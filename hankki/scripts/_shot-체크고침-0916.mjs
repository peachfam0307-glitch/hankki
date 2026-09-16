// ☑️ [2026-09-16] **창업자 제보 둘을 고친 판을 «실물»로 찍는다.**
//   📮 *"체크는 되어있으면 안되지"* · *"양념장 육수 앞에 제목 다 중복 뭐야"*
//   ⛔ 주입 없음 — 진짜 앱이다. 창업자가 캡처한 「오리지날 떡볶이」 그대로 연다.
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
await new Promise((r) => srv.listen(4516, r))
const OUT = process.env.SHOT_OUT || '/tmp/체크고침'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4516/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(1000); await 치우기(p)
await p.evaluate(() => { document.querySelectorAll('.sheet-mask').forEach((e) => e.remove()) })
await p.getByText('오리지날 떡볶이', { exact: true }).first().click({ timeout: 15000 }).catch(() => {})
await p.waitForTimeout(1400); await 치우기(p)
// 📍 「[육수]」·「[양념장]」이 시작하는 자리로 굴린다 — 거기가 판정할 곳이다
await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.ing')].find((e) => (e.textContent || '').includes('육수'))
  if (줄) { 줄.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120) }
})
await p.waitForTimeout(600)
await p.screenshot({ path: join(OUT, '1-기본-다꺼짐.jpg'), type: 'jpeg', quality: 82 })
// ☑️ 세 줄만 눌러 본다 — 「N개 담기」가 따라오나
const 줄들 = p.locator('.ing')
for (const n of [2, 5, 9]) await 줄들.nth(n).click().catch(() => {})
await p.waitForTimeout(500)
await p.screenshot({ path: join(OUT, '2-세개-체크.jpg'), type: 'jpeg', quality: 82 })
const 글 = await p.evaluate(() => {
  const 단추 = [...document.querySelectorAll('button')].find((e) => /담기/.test(e.textContent || ''))
  const 줄들 = [...document.querySelectorAll('.ing')].map((e) => (e.textContent || '').trim())
  return { 단추: (단추?.textContent || '').trim(), 줄: 줄들.slice(8, 20) }
})
console.log(JSON.stringify(글, null, 1))
await ctx.close(); await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
