import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4541, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4541/hankki/?%EC%8B%9D%EB%B9%84=1', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600)
const 치우기 = async () => { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(500) } catch { break } } }
await 치우기(); await p.waitForTimeout(3500); await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await p.waitForTimeout(1000); await 치우기()
for (const t of ['두부 1910', '대파', '계란 5900']) { await p.locator('input[placeholder*="두부"]').first().fill(t); await p.keyboard.press('Enter'); await p.waitForTimeout(400) }
await p.screenshot({ path: (process.env.OUT || '/tmp') + '/금액칸.png', fullPage: true })
await b.close(); srv.close()
console.log('찍음')
