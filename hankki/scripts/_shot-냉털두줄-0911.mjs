// 📸 냉장고 추천 «두 줄» — 창업자 냉장고 그대로 세워 화면을 찍는다 (2026-09-11)
//
// 📮 창업자 제보 = *"해물모듬 오징어 소고기 닭고기 추가했는데 위에 레시피추천은 그대로야"*
// ⛔ 규칙 21 = 창업자에게 보여주기 «전»에 내가 열어서 눈으로 본다. 숫자만 보고 보내지 않는다.
//    (2026-08-11 사고 = 숫자는 전부 초록불인데 찍힌 건 «온보딩 화면»이었다)
//
// 찍는 것 넷 — ①담기 前 ②담은 後 ③돌리기 누른 뒤 ④임박 0개(윗줄이 안 떠야 한다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.SHOT_DIR || '/tmp/냉털두줄'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4417, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// ⛔ 날짜를 여기서 만들지 않는다 — todayKST 에 «그 시각»을 넘긴다(절대원칙 27)
const { todayKST } = await import('../src/today.js')
const 어제 = todayKST(new Date(Date.now() - 86400000))
// 📸 창업자 캡처 그대로 — 두부만 「1일 지남」, 나머지는 유통기한 안 적음
const 처음 = [['두부', 어제], ['닭고기', null], ['돼지고기', null], ['소고기', null], ['관자', null], ['계란', null], ['새우', null], ['참깨', null], ['김', null]]
const 더넣기 = [['해물모듬', null], ['오징어', null]]

let 나쁨 = 0
const 말 = (ok, s) => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${s}`) }

const 열기 = async (칸들) => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4417/', { waitUntil: 'networkidle' })
  await p.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
  await p.evaluate((칸들) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    s.pantry = 칸들.map(([name, expiry], i) => ({ id: 'p' + i, name, expiry, addedAt: Date.now() }))
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  }, 칸들)
  await p.close()
  const q = await ctx.newPage()
  await q.addInitScript(SEED_COACH_SEEN)
  await q.goto('http://127.0.0.1:4417/', { waitUntil: 'networkidle' })
  await q.click('text=장보기')
  await q.waitForTimeout(400)
  await q.click('text=냉장고')
  await q.waitForTimeout(700)
  return q
}

// 👁 **화면에 «보이는» 카드를 읽는다 — ⛔DOM 순서가 아니다.**
//    ⛔⛔ 첫 판은 `querySelectorAll` 차례를 읽었다. 그런데 2026-09-11 에 그게 «거짓 초록불»을 냈다 —
//       돌리기를 눌러 DOM 은 바뀌었는데 크롬이 가로 스크롤을 밀어(scrollLeft 4976) **화면은 그대로**였다.
//       재현판은 통과했고 **캡처를 눈으로 열어서야** 잡혔다(규칙 18 ⓘ · 21).
//    ✅ 그래서 «그 자리에 실제로 있는 것»을 브라우저에게 묻는다(`elementFromPoint`) ＋ `scrollLeft` 도 같이 잰다.
const 읽기 = (p) => p.evaluate(() => {
  const 줄 = []
  for (const h of document.querySelectorAll('.sec-head')) {
    const 이름 = h.querySelector('.h-section')?.textContent || ''
    const 돌리기 = !!h.querySelector('button')
    const next = h.nextElementSibling
    if (!next || !next.classList.contains('hscroll')) continue
    const 카드 = [...next.querySelectorAll('.grid-card')].map((c) => ({ 제목: c.querySelector('.name')?.textContent || '', 꼬리: c.querySelector('.date')?.textContent || '' }))
    // 👁 그 줄에서 «눈에 보이는» 카드 = 가로로 훑으며 그 자리에 실제로 있는 것을 묻는다
    const r = next.getBoundingClientRect()
    const 보임 = []
    for (let x = r.left + 30; x < r.right - 10; x += 40) {
      const el = document.elementFromPoint(x, r.top + 20)?.closest('.grid-card')
      const t = el?.querySelector('.name')?.textContent
      if (t && !보임.includes(t)) 보임.push(t)
    }
    줄.push({ 이름, 돌리기, 카드, 보임, 가로스크롤: Math.round(next.scrollLeft) })
  }
  return 줄
})

const 찍기 = async (p, 이름) => { await p.screenshot({ path: join(낼곳, 이름), fullPage: false }); console.log(`   📸 ${join(낼곳, 이름)}`) }

console.log('\n【① 담기 前 — 창업자 캡처 상태】')
const p1 = await 열기(처음)
const a = await 읽기(p1)
a.forEach((줄) => console.log(`   ${줄.돌리기 ? '🔁' : '  '} 「${줄.이름}」 ${줄.카드.length}장 → ${줄.카드.slice(0, 3).map((c) => c.제목).join(' / ')}`))
await 찍기(p1, '1-담기전.png')
말(a.length === 2, `줄이 «둘»이다 (지금 ${a.length}줄)`)
// ⛔ 옛 검사 = *"윗줄 제목에 급한 재료 이름이 있다(「두부부터 쓰세요」)"* — **낡았다.**
//    같은 날 창업자가 제목을 **「임박재료부터 쓰기」로 고정**했다(긴 이름에서 제목이 두 줄로 접혀서).
//    📌 그 뒤로 이 칸은 «영영 빨간불»이었다 — 고친 걸 검사가 못 따라온 것이지 앱이 틀린 게 아니다.
// ✅ 대신 «급한 재료 이름이 어디로 갔나»를 본다 — 제목이 아니라 **카드 꼬리말**이 말해준다.
말(a[0]?.카드?.[0]?.꼬리?.includes('두부'), `윗줄 첫 카드가 급한 재료를 말한다 — 「${a[0]?.카드?.[0]?.꼬리}」`)
말(a[0]?.이름 === '임박재료부터 쓰기', `윗줄 제목 = 「${a[0]?.이름}」`)
말(a[1]?.이름 === '가진 재료로 만들기', `아랫줄 제목 = 「${a[1]?.이름}」`)
const 겹 = a[0]?.카드.filter((c) => a[1]?.카드.some((x) => x.제목 === c.제목)) || []
말(겹.length === 0, `두 줄이 안 겹친다 (겹침 ${겹.length}장)`)
말(a[0]?.카드.every((c) => /지남|오늘까지|D-/.test(c.꼬리)), '윗줄 카드마다 «왜 급한지»가 적혀 있다')
await p1.close()

console.log('\n【② 해물모듬·오징어를 담은 뒤 — 여기가 바뀌어야 한다】')
const p2 = await 열기([...처음, ...더넣기])
const c = await 읽기(p2)
c.forEach((줄) => console.log(`   ${줄.돌리기 ? '🔁' : '  '} 「${줄.이름}」 ${줄.카드.length}장 → ${줄.카드.slice(0, 3).map((x) => x.제목).join(' / ')}`))
await 찍기(p2, '2-담은뒤.png')
말(c[1]?.카드.length >= (a[1]?.카드.length || 0), `아랫줄이 늘거나 같다 (${a[1]?.카드.length} → ${c[1]?.카드.length})`)
말(a[0]?.카드.map((x) => x.제목).join('|') === c[0]?.카드.map((x) => x.제목).join('|'), '⭐ 윗줄(급한 것)은 흔들리지 않는다 — 두부는 여전히 급하다')

console.log('\n【③ 아랫줄 「돌리기」를 눌렀을 때】')
const 전 = c[1].보임.slice(0, 3)
const 단추 = p2.locator('.sec-head button')
말(await 단추.count() >= 1, `돌리기 단추가 그려졌다 (${await 단추.count()}개)`)
await 단추.last().click()
await p2.waitForTimeout(350)
const d = await 읽기(p2)
const 후 = d[1].보임.slice(0, 3)
console.log(`   전 = ${전.join(' / ')}`)
console.log(`   후 = ${후.join(' / ')}`)
await 찍기(p2, '3-돌린뒤.png')
// ⛔ 캡처와 DOM 이 어긋나면 «내가 창업자에게 보여주는 것»이 실물이 아니다(규칙 21).
//    그래서 찍은 «뒤»에 한 번 더 읽어서 같은지 본다.
const d2 = await 읽기(p2)
const 찍은뒤 = d2[1].보임.slice(0, 3)
말(찍은뒤.join('|') === 후.join('|'), '📸 캡처 시점과 읽은 값이 같다', `찍은뒤 = ${찍은뒤.join(' / ')}`)
말(전.join('|') !== 후.join('|'), '⭐ 돌리기를 누르면 «눈에 보이는» 3장이 바뀐다')
말(d[1].가로스크롤 === 0, '⛔ 돌린 뒤 가로 스크롤이 맨 앞이다 (크롬 앵커링 방지)', `scrollLeft = ${d[1].가로스크롤}`)
말(d[0].보임.join('|') === c[0].보임.join('|'), '⭐ 아랫줄을 돌려도 «윗줄은 그대로» (창업자: 각줄끼리만)')
await p2.close()

console.log('\n【④ 유통기한을 하나도 안 적었을 때 — 윗줄이 안 떠야 한다】')
const p3 = await 열기(처음.map(([n]) => [n, null]))
const e = await 읽기(p3)
e.forEach((줄) => console.log(`   ${줄.돌리기 ? '🔁' : '  '} 「${줄.이름}」 ${줄.카드.length}장`))
await 찍기(p3, '4-임박없음.png')
말(e.length === 1 && e[0].이름 === '가진 재료로 만들기', `줄이 하나만 뜬다 (지금 ${e.length}줄)`)
await p3.close()

await ctx.close(); await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패` : '\n✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
