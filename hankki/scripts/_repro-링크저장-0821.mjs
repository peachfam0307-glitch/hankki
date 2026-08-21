// 🔗💾 「링크로 저장하기 «자체»가 안 된다」 — 한 단계씩 확인하며 재현 (2026-08-21)
//
// 📮 창업자 = *"우리 링크는 아예 안돼 원래"* → *"확인해봐. **링크로 저장하기 자체가 안되는 걸로 아는데**"*
//
// ⭐⭐ **이건 여기서 «확실히» 재현할 수 있다** — 「Inbox 저장」은 바깥 웹이 필요 없다.
//    ⛔ 「본문 자동 읽기(베타)」는 `r.jina.ai` 등 바깥을 부르니 이 컨테이너에선 무조건 실패한다(못 잰다).
//    ✅ 그런데 「링크를 Inbox 에 저장」은 **그냥 폰 안에 넣는 일**이라 바깥과 무관하다.
//    📌 창업자가 말한 게 «저장 자체»이므로 **바로 이 갈래**를 잰다.
//
// ⛔⛔ 앞선 판 둘이 헛돌았다 — 그래서 이번엔 «단계마다 확인»한다(규칙 18)
//    ⑴ `input[type=text]` 로 찾았더니 **한 글자도 안 들어갔다**(칸이 빈 채로 찍혔다)
//    ⑵ `/저장/` 으로 단추를 찾았더니 **홈 화면 카드**를 눌렀다(「저장해두고 아직 한 번도」)
//    ⑶ 저장 결과를 `inbox` 칸에서 찾았는데 **그런 칸이 없다** —
//       실제로는 `recipes` 에 `status:'unsorted'` 로 들어간다(`makeInboxRecipe`·`InboxScreen.jsx:17`)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-링크저장-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/링크저장'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4405, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(이름, 값, 기대) {
  const ok = String(값) === String(기대)
  if (ok) 통과++; else { 실패++; 실패목록.push(`${이름} — 나온 값 ${값} · 기대 ${기대}`) }
  console.log(`  ${ok ? '✅' : '❌'} ${이름}${ok ? '' : `  → ${값} (기대 ${기대})`}`)
  return ok
}

const URL_시험 = 'https://blog.naver.com/hankkitest/223456789'
const 제목_시험 = '재현용 링크 레시피'

const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const 에러 = []
page.on('pageerror', (e) => 에러.push(String(e.message).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
await page.goto('http://127.0.0.1:4405/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

console.log('\n🔗 「링크로 저장하기」 재현 — 단계마다 확인\n')

// ── ① 저장 «전» 레시피 개수를 세어 둔다 (나중에 늘었나 보려고) ──
const 전 = await page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).length } catch { return -1 }
})
console.log(`  · 저장 전 레시피 ${전}개`)

// ── ② 가져오기 → 링크 붙여넣기 ──
await page.getByRole('button', { name: '가져오기', exact: true }).first().click()
await page.waitForTimeout(700)
await page.getByText('링크 붙여넣기', { exact: false }).first().click()
await page.waitForTimeout(900)
const 링크화면 = await page.evaluate(() =>
  /바로가기\(북마크\)로 저장|링크 주소/.test(document.body.innerText || ''))
if (!chk('① 링크 화면이 열렸다', 링크화면, true)) {
  console.log('  ⛔ 여기서 멈춘다 — 화면에 못 들어갔으면 아래는 의미가 없다')
}

// ── ③ 주소·제목을 «진짜로» 넣는다 (React 가 되돌리지 않게 native setter) ──
const 넣은값 = await page.evaluate(({ u, t }) => {
  const set = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    d ? d.call(el, v) : (el.value = v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const 칸들 = [...document.querySelectorAll('input')]
  const 주소칸 = 칸들.find((x) => /https?:\/\//.test(x.placeholder || ''))
  const 제목칸 = 칸들.find((x) => /예\s*\)/.test(x.placeholder || ''))
  if (주소칸) set(주소칸, u)
  if (제목칸) set(제목칸, t)
  return { 주소: 주소칸?.value || '', 제목: 제목칸?.value || '', 칸수: 칸들.length }
}, { u: URL_시험, t: 제목_시험 })
await page.waitForTimeout(400)
chk('② 주소가 칸에 «실제로» 들어갔다', 넣은값.주소, URL_시험)
chk('③ 제목도 들어갔다', 넣은값.제목, 제목_시험)
writeFileSync(join(OUT, '1-넣은뒤.png'), await page.screenshot())

// ── ④ 「Inbox 에 저장」 단추를 «그 화면 안에서» 찾아 누른다 ──
//    ⛔ 앞 판은 화면 전체에서 /저장/ 을 찾아 홈 카드를 눌렀다 → 이번엔 이름을 콕 집는다
const 단추 = await page.evaluate(() => {
  const b2 = [...document.querySelectorAll('button')]
    .find((x) => /Inbox에 저장|바로가기\)/.test(x.textContent || ''))
  return b2 ? { 글: (b2.textContent || '').trim(), 꺼짐: b2.disabled } : null
})
chk('④ 「Inbox에 저장」 단추를 찾았다', !!단추, true)
if (단추) {
  console.log(`     단추 글자 = 「${단추.글}」 · 꺼져있나 = ${단추.꺼짐}`)
  chk('⑤ 그 단추가 «켜져» 있다(누를 수 있다)', 단추.꺼짐, false)
  await page.evaluate(() => {
    const b2 = [...document.querySelectorAll('button')].find((x) => /Inbox에 저장|바로가기\)/.test(x.textContent || ''))
    if (b2) b2.click()
  })
  await page.waitForTimeout(2200)
}
writeFileSync(join(OUT, '2-저장누른뒤.png'), await page.screenshot())

// ── ⑤ 「진짜로 저장됐나」 — 화면이 아니라 «저장소»를 본다 ──
//    ⭐ 토스트는 「됐어요」라고 말하고도 실제로 안 됐을 수 있다(v11.00 addShopItem 사고와 같은 모양)
const 후 = await page.evaluate((u) => {
  try {
    const d = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const rs = d.recipes || []
    const 찾음 = rs.find((r) => (r.sourceUrl || '') === u || (r.link || '') === u)
    return {
      개수: rs.length,
      링크것있나: !!찾음,
      상태: 찾음?.status ?? null,
      제목: 찾음?.title ?? null,
      갈래: 찾음?.source ?? null,
    }
  } catch (e) { return { 오류: String(e).slice(0, 60) } }
}, URL_시험)
console.log(`  · 저장 후 레시피 ${후.개수}개 (전 ${전}개)`)
chk('⑥ ⭐레시피가 «하나 늘었다»', 후.개수, 전 + 1)
chk('⑦ ⭐그 주소로 저장된 것이 «있다»', 후.링크것있나, true)
if (후.링크것있나) {
  chk('⑧ 미정리함(unsorted)에 들어갔다', 후.상태, 'unsorted')
  console.log(`     제목 = ${후.제목} · 갈래 = ${후.갈래}`)
}

// ── ⑥ 미정리함 화면에서 «눈에 보이나» ──
await page.evaluate(() => {
  const b2 = [...document.querySelectorAll('button,a')].find((x) => /미정리|Inbox|보관함/.test(x.textContent || ''))
  if (b2) b2.click()
})
await page.waitForTimeout(1200)
const 보이나 = await page.evaluate((t) => (document.body.innerText || '').includes(t), 제목_시험)
chk('⑨ 화면 어딘가에 그 제목이 보인다', 보이나, true)
writeFileSync(join(OUT, '3-저장뒤화면.png'), await page.screenshot())

console.log(`\n  pageerror = ${에러.length}${에러.length ? ' ⛔ ' + 에러[0] : ''}`)
await b.close(); srv.close()

console.log('\n──────── 결과 ────────')
console.log(`통과 ${통과} · 실패 ${실패}`)
if (실패목록.length) { console.log('\n⛔ 실패:'); 실패목록.forEach((s) => console.log('   · ' + s)) }
console.log(`\n📁 ${OUT}`)
console.log('\n⚠️ 이 판이 재는 것 = 「Inbox 저장」(바깥 웹 불필요). 「본문 자동 읽기(베타)」는 여기서 못 잰다.')
process.exit(실패 ? 1 : 0)
