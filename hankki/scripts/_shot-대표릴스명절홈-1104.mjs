// 🎬 대표 릴스 8번 「추석, 핼러윈엔 홈 테마도 이렇게 바뀌었어요」 — 실제 앱 홈을 그 날짜로 찍는다 (2026-11-04)
//   추석 = 2026-09-15 · 핼러윈 = 2026-10-20 (src/data/seasonDecor.js 명절창 안의 날) · 평소 = 2026-11-04
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = process.argv[2] || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/대표릴스'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4393, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 찍기 = async (iso, 이름) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 693 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2.77 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.addInitScript(`{ const 고정 = ${Date.parse(iso)}; const R = Date
    Date = class extends R { constructor(...a){ if(!a.length) super(고정); else super(...a) } static now(){ return 고정 } }
    Date.parse = R.parse; Date.UTC = R.UTC }`)
  await p.goto('http://localhost:4393/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  await p.screenshot({ path: join(OUT, `홈-${이름}.png`) })
  await ctx.close()
}
await 찍기('2026-09-15T02:00:00Z', '추석')
await 찍기('2026-10-20T02:00:00Z', '핼러윈')
await 찍기('2026-11-04T02:00:00Z', '평소')
await b.close(); srv.close(); console.log('✅ 찍음', OUT)
