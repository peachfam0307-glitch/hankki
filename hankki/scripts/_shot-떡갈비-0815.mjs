// 🍖 수제 떡갈비 — 앱 화면 실물 (창업자 검수용 · 2026-08-15)
//   ⛔ 검수 절대원칙 ⑤ = 실제 앱 렌더. 데이터가 맞아도 화면에서 이상할 수 있다.
//   ⭐ `review: '창업자'` 는 **이 화면을 창업자가 보고 확인한 뒤에만** 붙인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4372, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'))
await page.goto('http://127.0.0.1:4372/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 찾기로 연다 — 목록 순서에 기대지 않는다(순서가 바뀌면 조용히 딴 걸 찍는다)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
// ⛔ 검색창에 기대지 않는다 — placeholder 가 다르면 «조용히» 첫 카드를 연다(실제로 콩국수를 찍었다).
//    카드 «글자»로 집는다. 못 찾으면 시끄럽게 죽는다.
const 카드 = page.locator('.grid-card').filter({ hasText: '떡갈비' }).first()
for (let i = 0; i < 24 && !(await 카드.count()); i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(200) }
if (!(await 카드.count())) { console.log('  ⛔ 목록에서 떡갈비 카드를 못 찾았다'); process.exit(1) }
await 카드.scrollIntoViewIfNeeded(); await 카드.click(); await page.waitForTimeout(1400)

const 제목 = await page.locator('h1, .h-title, [class*="title"]').first().innerText().catch(() => '')
console.log('  화면 제목 =', 제목.trim().slice(0, 30))
await page.screenshot({ path: join(OUT, '떡갈비-1-상세.png'), fullPage: true })
console.log(errors.length ? `  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '  ✅ pageerror 0')
await b.close(); srv.close()
