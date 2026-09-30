// 🎃 핼러윈 검수판 — 시계를 «그날»로 돌려 실제 앱 화면을 찍는다 (창업자 2026-09-29 「오늘 할로윈 관련 미리 다 보자」)
//    📆 3일 전 절대원칙(2026-09-29) — 10/16 열림 → 10/12 까지 검수. 이 판이 그 «실물»이다.
//    실행: PLAYWRIGHT_BROWSERS_PATH=… node scripts/_shot-핼러윈검수-0929.mjs <출력폴더>
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = process.argv[2] || '/tmp/hw검수'; mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r)); const PORT = srv.address().port
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 찍기 = async (이름, 시각, 할일) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.clock.setFixedTime(new Date(시각))
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  if (할일) await 할일(p)
  await p.screenshot({ path: join(OUT, `${이름}.png`) }); await ctx.close()
  console.log('📸', 이름)
}
const 누르기 = (글) => async (p) => { const t = p.getByText(글, { exact: false }).first(); if (await t.count()) { await t.click(); await p.waitForTimeout(1200) } }
// ① 홈 — 그 전날 / 그날(20:00 KST = 11:00Z)
await 찍기('1-홈-10월15일', '2026-10-15T11:00:00Z')
await 찍기('2-홈-10월16일', '2026-10-16T11:00:00Z')
await 찍기('2b-홈아래-10월16일', '2026-10-16T11:00:00Z', async (p) => { await p.evaluate(() => { window.scrollTo(0, 1e6); document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = 1e6 }) }); await p.waitForTimeout(800) })
// ② 탭 — 레꾸자랑 · 레시피 · 일기 · 장보기 (상단바 캐릭터 = seasonDecor 탭컷)
await 찍기('3-레꾸자랑-10월16일', '2026-10-16T11:00:00Z', 누르기('레꾸자랑'))
await 찍기('4-레시피-10월16일', '2026-10-16T11:00:00Z', async (p) => { const t = p.getByText('레시피', { exact: true }).last(); await t.click(); await p.waitForTimeout(1200) })
await 찍기('5-일기-10월16일', '2026-10-16T11:00:00Z', 누르기('일기'))
await 찍기('6-장보기-10월16일', '2026-10-16T11:00:00Z', 누르기('장보기'))
// ③ 끝나는 날 — 10/30 은 뜨고 10/31 은 안 뜬다(창업자 2026-09-29)
await 찍기('7-홈-10월30일', '2026-10-30T11:00:00Z')
await 찍기('8-홈-10월31일', '2026-10-31T11:00:00Z')
await b.close(); srv.close()
