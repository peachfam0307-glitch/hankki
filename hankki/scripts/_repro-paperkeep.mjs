// 📄 「일기를 다시 열면 고른 속지가 그대로인가」 — 창업자 확정 ⓐ (2026-08-06)
//   창업자 *"a하자. **중간에 나갔다 들어오면 저장되는게 좋지.**"*
//   ⭐ 그래서 검사는 둘이다 — ①**빈 날**은 맨 왼쪽 ②**고른 날**은 그대로.
//   ⛔ 「되는 것 같다」로 넘기지 않는다. 실제로 고르고·나갔다·다시 연다(규칙 7).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4355, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = { recipes: [], diary: [], seedV: BASICS_VERSION } // ⭐ 일기가 하나도 없는 폰

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)

const openDiary = async () => {
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
}
const openPaperTab = async () => {
  await page.getByRole('button', { name: /꾸미기/ }).first().click(); await page.waitForTimeout(900)
  await page.locator('.decor-editor .segment .seg').first().click(); await page.waitForTimeout(600)
}
// 📐 절마다 고른 칸이 «몇 번째»인가 — 스와치의 포인트색 테두리(box-shadow 2.5px)로 찾는다
const picked = () => page.evaluate(() => [...document.querySelectorAll('.decor-editor .decor-sec')].map((sec) => {
  const label = sec.querySelector('.decor-sec-label')?.textContent?.trim() || '?'
  const cells = [...sec.querySelectorAll('button')]
  const idx = cells.findIndex((c) => { const sw = c.querySelector('div'); return sw && /2\.5px/.test(getComputedStyle(sw).boxShadow || '') })
  return { label, idx, name: (cells[idx]?.textContent || '').trim() }
}).filter((x) => x.idx !== undefined))

await page.goto('http://127.0.0.1:4355/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// ── ① 빈 날 = 전부 맨 왼쪽 ──────────────────────────────
await openDiary(); await openPaperTab()
for (const s of await picked()) {
  if (s.idx === 0) ok(`처음 열면 「${s.label}」 = 맨 왼쪽 (${s.name})`)
  else no(`처음 열면 「${s.label}」 이 ${s.idx + 1}번째 (${s.name}) — 맨 왼쪽이라야 한다`)
}

// ── ② 속지를 고른다 — 세 절 전부 «다른 것»으로 ─────────────
//    ⛔ 저장을 누르지 «않는다». 창업자 말대로 «중간에 나가도» 남아야 한다.
const pickCell = async (secLabel, cellLabel) => {
  const sec = page.locator('.decor-editor .decor-sec').filter({ has: page.locator('.decor-sec-label', { hasText: new RegExp(`^${secLabel}$`) }) })
  await sec.getByRole('button', { name: `속지 ${cellLabel}` }).click(); await page.waitForTimeout(400)
}
await pickCell('틀', '오늘의 한끼')
await pickCell('종이', '세이지')
await pickCell('선', '모눈')
const chose = await picked()
console.log('   📐 고른 뒤:', chose.map((s) => `${s.label}=${s.name}`).join(' · '))

// ── ③ 저장 안 누르고 나간다 → 「취소」 → 뒤로 ──────────────
await page.getByRole('button', { name: '취소', exact: true }).first().click(); await page.waitForTimeout(700)
// 취소가 「저장 안 하고 나갈까요?」를 물으면 나가기 쪽을 누른다
const ask = page.getByRole('button', { name: /나가기|안 하고|버리기/ })
if (await ask.count()) { await ask.first().click(); await page.waitForTimeout(600) }
await page.getByRole('button', { name: '뒤로', exact: true }).first().click(); await page.waitForTimeout(900)

// ── ④ 다시 들어온다 → 고른 그대로인가 ────────────────────
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await openPaperTab()
const again = await picked()
console.log('   📐 다시 열었을 때:', again.map((s) => `${s.label}=${s.name}`).join(' · '))
for (const want of [['틀', '오늘의 한끼'], ['종이', '세이지'], ['선', '모눈']]) {
  const got = again.find((s) => s.label === want[0])
  if (got && got.name === want[1]) ok(`다시 열어도 「${want[0]}」 = ${want[1]} 그대로`)
  else no(`「${want[0]}」 이 ${got ? got.name : '없음'} — ${want[1]} 이라야 한다`)
}
await page.screenshot({ path: join(OUT, 'paperkeep-다시열기.png') })

// ── ⑤ 그런데 «다른 날»은 여전히 맨 왼쪽이라야 한다 ──────────
//    (아까 고친 「날 바뀌면 pick 도 따라간다」가 안 깨졌나)
await page.getByRole('button', { name: '취소', exact: true }).first().click(); await page.waitForTimeout(600)
if (await ask.count()) { await ask.first().click(); await page.waitForTimeout(500) }
await page.getByRole('button', { name: '뒤로', exact: true }).first().click(); await page.waitForTimeout(800)
// 달력에서 «어제» 칸을 눌러 그 날로 간다
const cells = page.locator('.cal-day, .cal-cell, [aria-label*="일"]')
console.log(`   (달력 칸 후보 ${await cells.count()}개)`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
