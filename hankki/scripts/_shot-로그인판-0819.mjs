import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4599, r))
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const pg = await ctx.newPage()
const errs = []
pg.on('pageerror', (e) => errs.push(String(e)))
pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
await pg.goto('http://localhost:4599/hankki/logintest.html', { waitUntil: 'networkidle' })
await pg.waitForTimeout(900)
await pg.screenshot({ path: '/tmp/logintest-full.png', fullPage: true })
const verdict = await pg.textContent('#verdict')
const why = await pg.textContent('#verdictWhy')
const dump = await pg.textContent('#dump')
// 눌러보기 — 진짜 넘어가나(주소만 확인하고 막는다)
let probeUrl = null
await pg.route('https://accounts.google.com/**', (r) => { probeUrl = r.request().url(); r.abort() })
await pg.click('#probe'); await pg.waitForTimeout(700)
console.log('=== 결론 ===\n' + verdict.trim() + '\n' + why.trim())
console.log('\n=== 결과판 ===\n' + dump.trim())
console.log('\n=== ③ 단추가 여는 주소 ===\n' + probeUrl)
console.log('\n=== 오류 ===\n' + (errs.length ? errs.join('\n') : '없음'))
await b.close(); srv.close()
