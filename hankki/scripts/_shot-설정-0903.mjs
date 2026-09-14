// 📸 설정 화면 실물 — 창업자에게 보내기 «전»에 내가 연다 (절대원칙 21)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/3e7cc7f3-a746-5daf-b584-984c5d968d3d/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
let page = await ctx.newPage(); page.setDefaultTimeout(15000)
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200)
if (await page.getByText('Google 계정으로 시작하기').count()) {
  const p2 = await ctx.newPage(); p2.setDefaultTimeout(15000)
  await p2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(2200)
  await page.close(); page = p2
}
await page.getByRole('button', { name: '설정', exact: true }).first().click({ force: true })
await page.waitForTimeout(1600)
// ⭐ 숫자만 믿지 않는다 — 한가운데를 «덮은 것»이 있나 본다(2026-08-11 사고)
console.log('  🔎 한가운데 =', await page.evaluate(() => { const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return el ? (typeof el.className === 'string' ? el.className : el.tagName) : '(없다)' }))
await page.screenshot({ path: join(OUT, '설정-1.png') })
// ⛔ `scrollTo` 는 안 먹는다 — 앱은 «안쪽 상자»가 구른다. 휠로 굴린다.
await page.mouse.move(206, 500)
await page.mouse.wheel(0, 750); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, '설정-2.png') })
await b.close(); srv.close(); console.log('  📸', OUT)
