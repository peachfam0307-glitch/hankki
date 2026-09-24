// 📸 홈 「다음 레시피」 제목 — 한 줄 잘림(전) vs 두 줄(후) (2026-09-24 창업자 「보여줘」)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body) })
await new Promise((r) => srv.listen(4392, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
for (const [이름, 옛것] of [['전-한줄잘림', true], ['후-두줄', false]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  if (옛것) await p.addStyleTag({ content: '.next-title{display:block!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important}' })
  const el = await p.$('.next-title')
  if (!el) { console.log('  (다음 제목 칸이 화면에 없다)'); continue }
  console.log('  ' + 이름 + ' → ' + (await el.innerText()))
  await el.scrollIntoViewIfNeeded()
  const r = await el.boundingBox()
  await p.screenshot({ path: join(OUT, '다음제목-' + 이름 + '.png'), clip: { x: 0, y: Math.max(0, r.y - 160), width: 390, height: 300 } })
  await ctx.close()
}
await b.close(); srv.close()
