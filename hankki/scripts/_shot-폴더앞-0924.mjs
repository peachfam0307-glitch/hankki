// 📁⬅ [2026-09-24] 폴더 칩 꾹 → 「맨 앞으로」(시안 D) — 실제 앱에서 눌러 찍는다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4511, r))
const OUT = process.env.SHOT_OUT || '/tmp/폴더앞'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
const 칩줄 = (p) => p.evaluate(() => { const s = [...document.querySelectorAll('.hscroll')].find((h) => /＋ 폴더|완료/.test(h.innerText)); return s ? [...s.querySelectorAll('button')].map((x) => x.innerText.trim()).slice(0, 6).join(' · ') : '' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR', hasTouch: false })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4511/hankki/?' + encodeURIComponent('폴더앞') + '=1', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1500); await 치우기(p)
console.log('처음   =', await 칩줄(p))
const 칩 = p.locator('.hscroll button', { hasText: /^간식/ }).first()
await 칩.scrollIntoViewIfNeeded()
const bx = await 칩.boundingBox()
await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up()
await p.waitForTimeout(600)
await p.screenshot({ path: join(OUT, '1-꾹누름.png') })
// ◀ 네 번 = 간식이 맨 앞으로
for (let k = 0; k < 4; k++) { await p.getByRole('button', { name: '간식 앞으로' }).click(); await p.waitForTimeout(250) }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300)
await p.screenshot({ path: join(OUT, '2-편집중.png') })
console.log('편집중 =', await 칩줄(p))
await p.getByRole('button', { name: '완료' }).click()
await p.waitForTimeout(900)
console.log('옮긴뒤 =', await 칩줄(p))
await p.evaluate(() => { document.querySelectorAll('.hscroll').forEach((s) => { s.scrollLeft = 0 }); window.scrollTo(0, 0) })
await p.waitForTimeout(400)
await p.screenshot({ path: join(OUT, '3-완료.png') })
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(1200)
console.log('새로고침 =', await 칩줄(p))
await ctx.close(); await b.close(); srv.close()
