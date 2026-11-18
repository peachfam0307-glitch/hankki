// 🏠 홈을 «통째로 긴 한 장»으로 찍는다 — 창업자가 판에서 직접 스크롤해보게.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/xmas/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) } catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (let i = 0; i < 5; i++) {
  const 닫았나 = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
    if (!b) return false; b.click(); return true
  })
  if (닫았나) { await p.waitForTimeout(500); continue }
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(350)
}
const SP='/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad'
await p.screenshot({ path: SP + '/주인장-홈.png' })
await p.getByText('레시피', { exact: true }).last().click().catch(()=>{}); await p.waitForTimeout(1200)
await p.screenshot({ path: SP + '/주인장-레시피탭.png' })
const m = p.locator('img[alt="한끼 주인장 레시피"]').first()
console.log('표시 개수', await p.locator('img[alt="한끼 주인장 레시피"]').count())
await m.scrollIntoViewIfNeeded(); await m.click(); await p.waitForTimeout(300)
console.log('url', p.url(), await p.evaluate(() => { const s=[...document.querySelectorAll('span')].find(x=>x.textContent==='한끼 주인장 레시피예요'); return s ? JSON.stringify(s.getBoundingClientRect()) : '없음' }))
await p.screenshot({ path: SP + '/주인장-눌림.png' })
await b.close(); srv.close()
