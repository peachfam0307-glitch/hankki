// 🕗 「최근 쓴 것」 재현판 (2026-08-06)
//   창업자 = *"유저가 꾸미기탭 배치도 알아서 하고. 카톡 이모티콘처럼"*
//   → 손으로 등록시키는 즐겨찾기 대신 **최근 쓴 것 8개가 저절로 맨 위**로.
//
// ⭐ 검사가 진짜 걸리는지 보려면 «옛 상태»부터 확인해야 한다 —
//    ①처음엔 없다 → ②붙이고 다시 열면 있다 → ③최신이 먼저 → ④탭을 안 넘는다.
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
await new Promise((r) => srv.listen(4347, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [], seedV: BASICS_VERSION,
}

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
await page.goto('http://127.0.0.1:4347/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const openDecor = async () => {
  await page.getByText('들깨나물무침', { exact: true }).first().click(); await page.waitForTimeout(800)
  await page.locator('[aria-label="레시피 꾸미기"]').first().click(); await page.waitForTimeout(1400)
  await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 1200 }).catch(() => {})
  await page.waitForTimeout(400)
}
const closeDecor = async () => {
  await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(900)
  await page.locator('.bar-btn[aria-label="뒤로"]').first().click().catch(() => {}); await page.waitForTimeout(500)
  await page.getByText('홈', { exact: true }).last().click(); await page.waitForTimeout(600)
}
const tab = (name) => page.locator('.decor-drawer').getByRole('button', { name, exact: true })
const recentLabels = async () => {
  const sec = page.locator('.decor-sec', { has: page.locator('.decor-sec-label', { hasText: /^최근 쓴 것$/ }) })
  if ((await sec.count()) === 0) return null
  return sec.first().locator('.decor-cell').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label').split(' ·')[0]))
}

// ① 처음엔 없다 — 쓴 적이 없는데 「최근」이 뜨면 그건 가짜다
await openDecor()
await tab('데코').first().click(); await page.waitForTimeout(500)
if ((await recentLabels()) === null) ok('처음엔 「최근 쓴 것」이 없다')
else no('아무것도 안 썼는데 「최근 쓴 것」이 떴다')

// ② 데코 넷을 붙인다 — 셋 이상이라야 줄이 생긴다(하나뿐이면 자리만 먹는다)
const cells = page.locator('.decor-sec:not(:has(.decor-sec-label:text-is("최근 쓴 것"))) .decor-cell')
const put = []
for (let i = 0; i < 4; i++) {
  const c = cells.nth(i * 3)
  put.push((await c.getAttribute('aria-label')).split(' ·')[0])
  await c.click(); await page.waitForTimeout(250)
}
// 🎗 다른 탭에서도 하나 — 탭을 넘어 새면 안 된다
await tab('마테').first().click(); await page.waitForTimeout(400)
const tapeCell = page.locator('.decor-sec .decor-cell').first()
const tapeKey = (await tapeCell.getAttribute('aria-label')).split(' ·')[0]
await tapeCell.click(); await page.waitForTimeout(300)
await closeDecor()

const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:decorRecent') || 'null'))
if (Array.isArray(stored) && stored.length === 5) ok(`붙인 것이 저장소에 쌓인다 (${stored.length}개)`)
else no(`저장이 안 된다 — ${JSON.stringify(stored)}`)

// ③ 다시 열면 맨 위에 뜬다 · 최신이 먼저
await openDecor()
await tab('데코').first().click(); await page.waitForTimeout(500)
const shown = await recentLabels()
if (shown && shown.length === 4) ok(`다시 여니 데코 탭에 「최근 쓴 것」 ${shown.length}개`)
else no(`최근 줄이 안 뜬다 — ${JSON.stringify(shown)}`)
if (shown && shown[0] === put[3]) ok(`제일 나중에 쓴 게 맨 앞 (${shown[0]})`)
else no(`순서가 틀렸다 — 화면 ${JSON.stringify(shown)} · 붙인 순서 ${JSON.stringify(put)}`)
// ⭐ 「맨 위」인가 = 서랍의 첫 스티커 절이라야 한다
const firstLabel = await page.locator('.decor-drawer .decor-sec-label').first().innerText()
if (firstLabel.trim() === '최근 쓴 것') ok('최근 줄이 그 탭의 맨 위에 있다')
else no(`최근 줄이 맨 위가 아니다 — 첫 절 = "${firstLabel}"`)

// ④ 탭을 안 넘는다 — 마테 탭엔 마테 하나뿐이라 줄이 아예 없어야 한다(셋 미만)
await tab('마테').first().click(); await page.waitForTimeout(400)
const tapeRecent = await recentLabels()
if (tapeRecent === null) ok('마테 탭엔 최근이 하나뿐이라 줄을 안 그린다')
else if (tapeRecent.every((k) => k === tapeKey)) ok('마테 탭엔 마테만 뜬다 — 탭을 안 넘는다')
else no(`마테 탭에 딴 탭 것이 섞였다 — ${JSON.stringify(tapeRecent)}`)
// 데코 탭에서 붙인 것이 마테 탭에 새면 안 된다
if (!(tapeRecent || []).some((k) => put.includes(k))) ok('데코에서 쓴 게 마테 탭으로 안 샌다')
else no(`데코 것이 마테 탭에 샜다 — ${JSON.stringify(tapeRecent)}`)

// ⑤ 「글자」 탭은 맨 위가 「직접 쓰기」 그대로 (창업자 2026-07-30 확정 순서)
await tab('글자').first().click(); await page.waitForTimeout(400)
const textFirst = await page.locator('.decor-drawer .decor-sec-label').first().innerText()
if (textFirst.trim() === '글자') ok('「글자」 탭은 맨 위가 직접 쓰기 그대로')
else no(`「글자」 탭 맨 위가 바뀌었다 — "${textFirst}"`)
await page.screenshot({ path: join(OUT, 'recent-데코탭.png') })
await tab('데코').first().click(); await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, 'recent-최근줄.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
