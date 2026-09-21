// 📸 [2026-09-21] 홈 「소식 2/3 · 인스타 1/3」 실물 판 — 흉내가 아니라 빌드된 앱을 그대로 찍는다(절대원칙 21·30)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.env.OUT || '/tmp'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) } catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const [이름, w, h] of [['폰', 390, 844], ['패드', 1024, 1366]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2000)
  for (let i = 0; i < 4; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300) }
  // 🔒 자기 점검 — 인스타 칸이 실제로 그려졌나 · 소식 글이 잘렸나(scrollWidth > clientWidth 면 잘린 것)
  const 잰것 = await p.evaluate(() => {
    const ig = document.querySelector('.insta-card'); const sub = document.querySelector('.news-sub'); const nc = document.querySelector('.news-row > .news-card')
    return { 인스타: !!ig, 인스타폭: ig && Math.round(ig.getBoundingClientRect().width), 소식폭: nc && Math.round(nc.getBoundingClientRect().width), 소식높이: nc && Math.round(nc.getBoundingClientRect().height), 인스타높이: ig && Math.round(ig.getBoundingClientRect().height), 소식잘림: sub ? sub.scrollHeight > sub.clientHeight + 1 : null, 소식글: sub && sub.textContent }
  })
  console.log(이름, JSON.stringify(잰것))
  if (!잰것.인스타) throw new Error('⛔ 인스타 칸이 안 그려졌다')
  await p.screenshot({ path: join(OUT, `인스타실물-${이름}.png`), clip: { x: 0, y: 0, width: w, height: Math.min(h, 520) } })
  await ctx.close()
}
await b.close(); srv.close()
