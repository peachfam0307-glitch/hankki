import { chromium } from 'playwright'
import { createServer } from 'http'; import { readFileSync, existsSync } from 'fs'; import { join, extname } from 'path'
const root = '/home/user/xmas/hankki/dist'
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || !extname(p)) p = '/index.html'; const f = join(root, p); if (!existsSync(f)) { s.statusCode = 404; return s.end() } s.setHeader('content-type', {'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}[extname(f)] || 'application/octet-stream'); s.end(readFileSync(f)) }).listen(5177)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })
const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage(); pg.on('console', (m) => { if (/못 불러옴/.test(m.text())) console.log('콘솔', m.text()) })
let 실패 = 0, 보고 = []
await pg.route('**/assets/*.webp*', (r) => { if (process.env.ALWAYS ? (실패++, true) : (!r.request().url().includes('r=1') && 실패 < 3)) { 실패++; return r.fulfill({ status: 503 }) } return r.continue() })
await pg.route('**/error', (r) => { 보고.push(r.request().postData()); r.fulfill({ status: 200 }) })
await pg.goto('http://localhost:5177/hankki/'); await pg.waitForTimeout(6000)
const 깨짐 = await pg.$$eval('img', (xs) => xs.filter((i) => i.dataset.한번더 && !(i.complete && i.naturalWidth)).length)
const 메움 = await pg.$$eval('img', (xs) => xs.filter((i) => i.dataset.한번더 && i.complete && i.naturalWidth).length)
console.log(보고.map((x) => (x.match(/못 불러옴[^"]*/) || [])[0])); console.log({ 일부러실패: 실패, 다시해서메워짐: 메움, 여전히깨짐: 깨짐, 보고수: 보고.length })
await b.close(); srv.close()
