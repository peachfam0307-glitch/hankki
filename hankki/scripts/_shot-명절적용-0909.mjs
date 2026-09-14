// 🏠 홈 화면 «맨 위»와 «맨 아래»를 찍는다 — 창업자가 놓아보는 판의 배경이 된다.
// 📮 창업자 2026-09-09 = "그럼 화면 제일 아래쪽도 찍어줘"
// ⛔ 앱 소스는 한 줄도 안 고친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) }
  catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
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
await p.screenshot({ path: '/tmp/명절_홈_위.png' })
const 높이 = await p.evaluate(() => {
  // ⛔ document 가 안 굴러간다 — 앱은 «안쪽 통»이 구른다. 제일 많이 구를 수 있는 통을 찾는다.
  const 통 = [...document.querySelectorAll('*')].map((e) => [e, e.scrollHeight - e.clientHeight])
    .filter(([e, d]) => d > 40 && e.clientHeight > 200).sort((a, b) => b[1] - a[1])[0]
  if (!통) return ['안 구른다']
  통[0].scrollTop = 통[0].scrollHeight
  return [통[0].className || 통[0].tagName, 통[1], 통[0].scrollTop]
})
await p.waitForTimeout(1200)
await p.screenshot({ path: '/tmp/명절_홈_아래.png' })
console.log('스크롤', 높이)
await b.close(); srv.close()
