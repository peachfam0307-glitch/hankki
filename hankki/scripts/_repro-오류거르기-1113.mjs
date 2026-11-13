import { chromium } from 'playwright'
import { createServer } from 'http'; import { readFileSync, existsSync } from 'fs'; import { join, extname } from 'path'
const root = '/home/user/xmas/hankki/dist'
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || !extname(p)) p = '/index.html'; const f = join(root, p); if (!existsSync(f)) { s.statusCode = 404; return s.end() } s.setHeader('content-type', {'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}[extname(f)] || 'application/octet-stream'); s.end(readFileSync(f)) }).listen(5178)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })
async function 한판(이름, ua, 사람) {
  const ctx = await b.newContext({ serviceWorkers: 'block', userAgent: ua })
  if (사람) await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }))
  const pg = await ctx.newPage(); const 보고 = []
  await pg.route('**/assets/*.webp*', (r) => r.fulfill({ status: 503 }))
  await pg.route('**/error', (r) => { 보고.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200 }) })
  await pg.goto('http://localhost:5178/hankki/'); await pg.waitForTimeout(3000)
  await pg.evaluate(() => { Promise.reject(Object.assign(new Error('Rejected'), { stack: 'Error: Rejected' })) })
  await pg.waitForTimeout(5000)
  const 다 = 보고.flatMap((x) => x.묶음 || [x])
  console.log(이름, 다.length ? 다.map((x) => `${x.종류}|${x.기기}|${x.몇번}|${String(x.메시지).slice(0,30)}|${String(x.위치).slice(0,160)}`).join('\n   ') : '보고 없음')
  await ctx.close()
}
const 인스타 = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0'
await 한판('①인스타 사람', 인스타, true)
await 한판('②로봇', 'facebookexternalhit/1.1', true)
await 한판('③기본 헤드리스', undefined, false)
await b.close(); srv.close()
