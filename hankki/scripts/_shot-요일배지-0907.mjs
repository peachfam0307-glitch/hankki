import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4433, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const OUT = process.env.OUT
for (const [w, h, n, d] of [[390, 844, '폰', 3], [820, 1180, '패드', 2]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage(); await p.goto('http://127.0.0.1:4433/hankki/', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000)
  const box = p.locator('.week-pair').first(); await box.evaluate((el) => el.scrollIntoView({ block: 'start' })); await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/요일배지-${n}.png` }); console.log('📸', n)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(1100)
  await p.screenshot({ path: `${OUT}/요일배지-장보기-${n}.png` }); console.log('📸 장보기', n)
}
await b.close(); srv.close()
