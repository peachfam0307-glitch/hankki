// 💰📸 예산 정하는 길 — 창업자 2026-09-18 *"예산은 어떻게 설정해? 설정하는 칸도 보여줘"*
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
await new Promise((r) => srv.listen(4543, r))
const OUT = process.env.OUT || '/tmp/claude-0'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4543/hankki/?%EC%8B%9D%EB%B9%84=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300)
async function 치우기() { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break } } }
await 치우기()
// 기록만 심고 «예산은 안 정한» 상태로 연다
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 날 = (n) => { const d = new Date(Date.now() + 9 * 3600e3); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
  s.foodCost = [
    { id: 'b1', d: 날(0), k: 'shop', won: 45000, memo: '롯데마트' },
    { id: 'b2', d: 날(1), k: 'out', won: 29000, memo: '난장다이닝' },
    { id: 'b3', d: 날(8), k: 'shop', won: 61000, memo: '쿠팡' },
  ]
  s.foodBudget = { w: 0, m: 0 }
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(800); await 치우기()
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click(); await p.waitForTimeout(700)
await p.screenshot({ path: join(OUT, '예산-1-정하기전.png'), fullPage: true })
console.log('① 「이번 주 예산 정하기」 단추 =', await p.locator('.fc-bud-new').count())
await p.locator('.fc-bud-new').first().click(); await p.waitForTimeout(600)
for (const k of ['2', '00', '000']) { await p.locator('.fc-key', { hasText: new RegExp('^' + k + '$') }).first().click(); await p.waitForTimeout(150) }
await p.screenshot({ path: join(OUT, '예산-2-정하는칸.png'), fullPage: true })
await p.locator('.fc-save').last().click(); await p.waitForTimeout(800)
await p.screenshot({ path: join(OUT, '예산-3-정한뒤.png'), fullPage: true })
console.log('③ 남은 돈 =', (await p.locator('.fc-bud-s b').first().textContent()).trim())
await b.close(); srv.close()
