// 📸 새 하트 열쇠 — 0개(열쇠구멍) · 다크 테마 확인 (2026-10-04 창업자 「2번도 한번 보자」)
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
await new Promise((r) => srv.listen(4396, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const THEME_KEY = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [이름, 남은, 다크] of [['0개-밝음', 0, false], ['0개-다크', 0, true], ['3개-다크', 3, true]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(([n, d, tk]) => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: n, month: 0, total: n }))
    if (d) localStorage.setItem(tk, 'dark') }, [남은, 다크, THEME_KEY])
  await p.route('**/*workers.dev/**', (r) => r.abort())   // 서버 답이 0 을 덮지 않게
  await p.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  await p.getByText('가져오기', { exact: true }).first().click(); await p.waitForTimeout(900)
  await p.screenshot({ path: join(OUT, `열쇠-${이름}-가져오기.png`), clip: { x: 0, y: 0, width: 390, height: 230 } })
  await p.getByText('한끼 앱에서 사진 가져오기').first().click(); await p.waitForTimeout(900)
  await p.screenshot({ path: join(OUT, `열쇠-${이름}-안내.png`), clip: { x: 0, y: 40, width: 390, height: 120 } })
  await ctx.close()
}
await b.close(); srv.close()
