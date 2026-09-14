// 📸📸 냉장고 여섯 판 — 재료를 다양하게 넣고 «돌려가며» 화면을 찍는다 (2026-09-11)
//
// 📮 창업자 = *"다시 다 잘되는지 재현하고 눈으로확인해 다양한재료넣어 돌려봐"*
//
// ⛔⛔ 왜 «보이는 것»을 재나 — 2026-09-11 에 재현판이 «DOM 순서»만 보고 초록불을 냈는데
//    크롬 스크롤 앵커링(scrollLeft 4976)으로 **화면은 그대로**였다. 캡처를 열어서야 잡혔다.
//    ✅ 그래서 이 판은 `elementFromPoint` 로 **그 자리에 실제 있는 것**을 묻는다(＋scrollLeft).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.SHOT_DIR || '/tmp/냉털여섯판'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4422, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
// ⭐ 앱과 «같은 모듈»로 답을 구한다 — 흉내를 내면 어긋난다(절대원칙 30)
const { allBasicRecipes } = await import('../src/data/basics.js')
const { rankPantryRecipes } = await import('../src/pantryMatch.js')
const { todayKST } = await import('../src/today.js')
const 오늘문자 = todayKST()
const 열린레시피 = allBasicRecipes.filter((r) => !r.from || r.from <= 오늘문자)
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// ⛔ 날짜를 여기서 만들지 않는다 — todayKST 에 «그 시각»을 넘긴다(절대원칙 27)
const D = (n) => todayKST(new Date(Date.now() + n * 86400000))

let 나쁨 = 0
const 말 = (ok, s, 덧 = '') => { if (!ok) 나쁨++; console.log(`   ${ok ? '✅' : '⛔'} ${s}${덧 ? ' · ' + 덧 : ''}`) }

// 👁 «눈에 보이는» 카드를 읽는다 — ⛔DOM 순서가 아니다
const 읽기 = (p) => p.evaluate(() => {
  const 줄 = []
  for (const h of document.querySelectorAll('.sec-head')) {
    const 이름 = h.querySelector('.h-section')?.textContent || ''
    const 제목줄수 = (() => { const t = h.querySelector('.h-section'); if (!t) return 0
      const rg = document.createRange(); rg.selectNodeContents(t); return rg.getClientRects().length })()
    const 단추 = !!h.querySelector('button')
    const next = h.nextElementSibling
    if (!next || !next.classList.contains('hscroll')) continue
    const r = next.getBoundingClientRect()
    const 보임 = []
    for (let x = r.left + 30; x < r.right - 10; x += 40) {
      const t = document.elementFromPoint(x, r.top + 20)?.closest('.grid-card')?.querySelector('.name')?.textContent
      if (t && !보임.includes(t)) 보임.push(t)
    }
    줄.push({ 이름, 제목줄수, 단추, 전체: next.querySelectorAll('.grid-card').length, 보임, 가로: Math.round(next.scrollLeft) })
  }
  return 줄
})

const 열기 = async (ctx, 칸들) => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4422/', { waitUntil: 'networkidle' })
  await p.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
  await p.evaluate((칸들) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    s.pantry = 칸들.map(([name, expiry], i) => ({ id: 'p' + i, name, expiry, addedAt: Date.now() }))
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  }, 칸들)
  await p.close()
  const q = await ctx.newPage()
  await q.addInitScript(SEED_COACH_SEEN)
  await q.goto('http://127.0.0.1:4422/', { waitUntil: 'networkidle' })
  await q.click('text=장보기'); await q.waitForTimeout(350)
  await q.click('text=냉장고'); await q.waitForTimeout(700)
  return q
}

const 판들 = [
  ['① 비었다', []],
  ['② 임박 없음 — 기한 안 적음', [['닭고기', null], ['소고기', null], ['계란', null], ['김', null], ['참깨', null]]],
  ['③ 임박 없음 — 기한 다 멀다', [['두부', D(20)], ['우유', D(14)], ['계란', D(30)], ['대파', D(9)], ['김', D(90)]]],
  ['④ 딱 경계 — D-3 하나(임박) ＋ D-4 하나(아님)', [['두부', D(3)], ['우유', D(4)], ['계란', null], ['대파', null]]],
  ['⑤ 오늘까지 하나', [['양파', D(0)], ['소고기', null], ['계란', null], ['김', null]]],
  ['⑥ 하루 지남 — 창업자 지금', [['두부', D(-1)], ['닭고기', null], ['돼지고기', null], ['소고기', null], ['해물모듬', null], ['오징어', null], ['관자', null], ['계란', null], ['새우', null], ['참깨', null], ['김', null]]],
  ['⑦ 날짜가 다 다르다 — D-0·D-1·D-2·D-3', [['양파', D(0)], ['두부', D(1)], ['애호박', D(2)], ['대파', D(3)], ['우유', D(8)], ['소고기', null]]],
  ['⑧ 영수증 한 장 — 임박 여섯', [['두부', D(1)], ['애호박', D(2)], ['양파', D(0)], ['대파', D(3)], ['우유', D(1)], ['버섯', D(2)], ['닭고기', null], ['소고기', null]]],
  ['⑨ 섞임 — 지난 것·임박·먼 것·기한없음', [['두부', D(-5)], ['우유', D(-10)], ['양파', D(1)], ['소고기', D(30)], ['계란', null], ['김', null], ['대파', D(2)]]],
  ['⑩ 이름이 긴 재료가 임박', [['홀그레인머스터드', D(1)], ['크러쉬드레드페퍼', D(2)], ['소고기', null], ['계란', null]]],
  // 🥩 [창업자 시험 2026-09-11] 정육점·영수증이 실제로 적어 주는 이름들
  ['⑪ 정육 이름 — 부위로만 적음', [['채끝', D(1)], ['부채살', D(2)], ['항정살', null], ['오리로스', null], ['닭다리살', null]]],
  ['⑫ 정육 이름 — 괄호·용도', [['소고기(채끝)', D(0)], ['소고기(구이용)', null], ['돼지고기(찌개용)', null], ['계란(특란)', null], ['대파(흙대파)', D(2)]]],
  ['⑬ 정육 이름 — 앞에 말이 붙음', [['샤브용소고기', D(1)], ['찌개용돼지고기', null], ['한우 채끝', null], ['닭다리살 정육', null], ['소고기 국거리용', null]]],
]

for (const [W] of [[360], [390]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  console.log(`\n${'═'.repeat(54)}\n📐 폭 ${W}px\n${'═'.repeat(54)}`)
  for (const [이름, 칸들] of 판들) {
    const q = await 열기(ctx, 칸들)
    const a = await 읽기(q)
    console.log(`\n【${이름}】 냉장고 ${칸들.length}칸`)
    a.forEach((줄) => console.log(`   ${줄.단추 ? '🔁' : '  '} 「${줄.이름}」 ${줄.제목줄수}줄 · ${줄.전체}장 → ${줄.보임.join(' / ')}`))
    if (!a.length) console.log('      (추천 줄 없음 — 기본 메뉴 안내)')
    const 파일 = `${W}-${이름.slice(0, 2)}.png`
    await q.screenshot({ path: join(낼곳, 파일) }); console.log(`   📸 ${join(낼곳, 파일)}`)

    // ── 칸마다 확인 ──
    말(a.every((줄) => 줄.제목줄수 <= 1), '제목이 «한 줄»이다', a.map((x) => `${x.이름}=${x.제목줄수}`).join(' · ') || '줄 없음')
    const 윗 = a.find((x) => x.이름 === '임박재료부터 쓰기')
    const 아랫 = a.find((x) => x.이름 === '가진 재료로 만들기')
    const 임박없는판 = ['①', '②', '③'].some((k) => 이름.startsWith(k))
    if (이름.startsWith('①')) 말(a.length === 0, '빈 냉장고 → 추천 줄이 «아예 없다»')
    if (임박없는판 && !이름.startsWith('①')) 말(!윗 && !!아랫, '급한 게 없으면 «윗줄이 안 뜬다»', 윗 ? `⛔「${윗.이름}」이 떴다` : '')
    if (윗) 말(윗.이름 === '임박재료부터 쓰기', '윗줄 제목이 «고정»이다', `「${윗.이름}」`)
    if (!임박없는판) {
      말(!!윗, '윗줄이 뜬다')
      말(!!아랫, '아랫줄이 뜬다')
      말(윗 ? 윗.전체 <= 12 : true, '윗줄은 12장 이하', 윗 ? `${윗.전체}장` : '')
      // ⛔⛔ 첫 판은 「아랫줄 10장 이상」이라 박았다 — **재료가 많은 냉장고에서 뽑은 문턱**이라
      //    고기만 다섯 칸 넣은 판에서 «앱이 멀쩡한데» 빨간불이 났다(걸린 편이 원래 13편뿐).
      //    📌 규칙 18 ⓘ — 검사가 «무엇을» 보는지. 봐야 할 건 장수가 아니라 **한 편도 안 잃나**다.
      // ✅ 그래서 앱과 «같은 셈»으로 걸린 편 전부를 구해 «두 줄의 합»과 맞춰 본다.
      const 전부 = rankPantryRecipes(열린레시피, 칸들.map(([name, expiry]) => ({ name, expiry })), (p) => (p?.expiry ? Math.round((Date.parse(p.expiry) - Date.parse(오늘문자 + 'T00:00:00Z')) / 86400000) : null)).length
      말(윗.전체 + 아랫.전체 === 전부, '두 줄을 합치면 «걸린 편 전부» — 한 편도 안 잃는다', `${윗.전체} ＋ ${아랫.전체} = ${전부}`)
      말(아랫.전체 > 0, '아랫줄이 비지 않는다', `${아랫.전체}장`)
      const 겹 = 윗 && 아랫 ? 윗.보임.filter((t) => 아랫.보임.includes(t)) : []
      말(겹.length === 0, '보이는 칸에서 두 줄이 «안 겹친다»', 겹.join(','))
    }
    // 🔁 돌리기 단추가 «있어야 할 때만» 있나 (⛔이 판은 돌리지 않는다 — 창업자 지시)
    for (const 줄 of a) 말(줄.단추 === 줄.전체 > 3, '돌리기 단추는 «4장 이상일 때만»', `「${줄.이름}」 ${줄.전체}장 · 단추 ${줄.단추 ? '있음' : '없음'}`)
    await q.close()
  }
  await ctx.close()
}
await b.close(); srv.close()
console.log(나쁨 ? `\n⛔⛔ ${나쁨}칸 실패` : '\n✅✅ 여섯 판 × 두 폭 — 전부 통과')
process.exit(나쁨 ? 1 : 0)
