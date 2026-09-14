import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png' }
const srv = createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,''); if(p==='/'||p==='')p='/index.html'
  let body,type=MIME[extname(p)]||'application/octet-stream'
  try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
  s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4699,r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const page = await b.newPage({ viewport:{width:390,height:900}, deviceScaleFactor:2 })
await page.goto('http://127.0.0.1:4699/hankki/vision-test.html',{waitUntil:'domcontentloaded'})
await page.fill('#key','TESTKEY_abcdefghijklmnopqrstuvwx')
await page.click('#앱에넣기')
await page.waitForTimeout(300)
await page.screenshot({ path:'/tmp/vt.png' })
await b.close(); srv.close()
