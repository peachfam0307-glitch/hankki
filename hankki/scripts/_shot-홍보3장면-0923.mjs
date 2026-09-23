// 📸 캐러셀 2장에 쓸 «실물» 화면 셋 (2026-09-23)
//   ① 「✏️ 내 것」 칩 · ② 꾹 눌러 고르고 ［📁 폴더］ · ③ 「해볼 것」·「최애」 꽂은 목록
// ⛔ 이름은 앱과 «같아야» 한다 — 북마크(X) → 「해볼 것」(요리사모자) · 「최애」(하트) (favName.js·favPin.js)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/홍보3장면'; mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon, extra = {}) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 90000, status: 'sorted', favorite: false, cooked: 0, ...extra })
const state = {
  recipes: [
    // 🔖 「해볼 것」(chef) 둘 · ❤️ 「최애」 하나 — 칩이 뜨려면 꽂힌 편이 있어야 한다
    // ⛔ favorite: true 가 «같이» 있어야 꽂힌 걸로 친다 — isPinned 는 둘 다 본다(favPin.js:59).
    R('u_1', '엄마 김치찌개', 'fe_128', { favorite: true, favPin: 'chef' }),
    R('u_22', '우리집 제육', 'fe_18', { favorite: true, favPin: 'heart' }),
    R('u_333', '릴스에서 본 마늘파스타', 'fh_k18', { sourceUrl: 'https://www.instagram.com/reel/bbbb/', favorite: true, favPin: 'chef' }),
    R('basic-1', '꽃게탕', 'fh_k02'),
    R('basic-2', '어남선생 오징어볶음', 'fe_18', { sourceUrl: 'https://www.youtube.com/watch?v=aaaa' }),
  ],
  folders: ['우리집 김치', '주말 브런치'],
  diary: [], seedV: BASICS_VERSION,
}
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:nudge:cloudgate', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, '3-해볼것최애.png') })   // 칩 줄에 해볼 것·최애가 다 뜬 목록
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200)
await page.screenshot({ path: join(OUT, '1-내것칩.png') })
// ② 고르기 모드 → 폴더 시트
await page.locator('text=편집').first().click(); await page.waitForTimeout(500)
await page.getByText('엄마 김치찌개').click(); await page.waitForTimeout(200)
await page.getByText('우리집 제육').click(); await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '2a-고른모습.png') })
await page.getByText('폴더', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, '2b-폴더시트.png') })
console.log('pageerror', errs.length, errs.slice(0, 2)); console.log('저장 →', OUT)
await b.close(); srv.close()
