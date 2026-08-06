// 🏷 탭 이름 후보 — 창업자 판정용 (2026-08-06)
//   창업자 *"다이어리할까 일지할까.. 감정다이어리? 우리 감정레시피북이니까."*
//   ⭐ 이름은 «글자로 고르는 게 아니라 화면에서 고르는 것»이다 — 폭·무게가 실물에서만 보인다.
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
await new Promise((r) => srv.listen(4348, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [{ id: 'd1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '', photo: null }],
  seedV: BASICS_VERSION,
}

const CANDIDATES = ['요리 일지', '감정 다이어리', '오늘의 나', '한끼 일기']

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4348/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)

// 세그먼트 한 줄만 잘라 찍는다 — 이름끼리 나란히 비교해야 폭·무게가 보인다
for (const name of CANDIDATES) {
  await page.evaluate((n) => {
    const segs = document.querySelectorAll('.segment .seg')
    if (segs[1]) segs[1].textContent = n
  }, name)
  await page.waitForTimeout(200)
  const box = await page.locator('.segment').first().boundingBox()
  const w = await page.locator('.segment .seg').nth(1).boundingBox()
  // ⚠️ 글자가 칸을 넘치나 = 이름을 고르는 진짜 기준
  const over = await page.evaluate(() => {
    const s = document.querySelectorAll('.segment .seg')[1]
    return s ? s.scrollWidth > s.clientWidth + 1 : false
  })
  console.log(`   ${name.padEnd(8)} · 칸 폭 ${Math.round(w.width)}px · ${over ? '⛔ 글자가 칸을 넘친다' : '✅ 한 줄에 들어간다'}`)
  await page.screenshot({ path: join(OUT, `tabname-${CANDIDATES.indexOf(name) + 1}.png`), clip: { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 } })
}
await b.close(); srv.close()
