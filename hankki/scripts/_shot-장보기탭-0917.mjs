import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4531, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break } } }
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch {} })
const p = await ctx.newPage(); const errs = []
p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://127.0.0.1:4531/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(1200); await 치우기(p)
await p.screenshot({ path: process.env.OUT || (process.cwd() + '/장보기탭-지금.png'), fullPage: true })
console.log('errors:', errs.length, errs.slice(0, 5))
await b.close(); srv.close()
