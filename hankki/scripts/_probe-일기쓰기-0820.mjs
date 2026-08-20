import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = '/home/user/hankki/hankki/'
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let body,type=MIME[extname(p)]||'application/octet-stream';try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4385,r))
const { SEED_COACH_SEEN } = await import(ROOT+'src/coach.js')
const b = await chromium.launch({})
const page = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
await page.goto('http://127.0.0.1:4385/hankki/',{waitUntil:'networkidle'})
await page.waitForTimeout(1200)
await page.locator('.bottom-nav .nav-item').filter({hasText:'일기'}).first().click()
await page.waitForTimeout(1400)
await page.getByRole('button',{name:/오늘 일기 쓰기/}).first().click()
await page.waitForTimeout(2000)
const 정보 = await page.evaluate(()=>({
  버튼: [...document.querySelectorAll('button')].map(b=>(b.getAttribute('aria-label')||b.textContent||'').trim()).filter(Boolean).slice(0,30),
  글칸: [...document.querySelectorAll('input,textarea,[contenteditable="true"]')].map(e=>({태그:e.tagName, ph:e.placeholder||e.getAttribute('data-ph')||'', cls:(e.className||'').slice(0,40)})),
}))
console.log(JSON.stringify(정보,null,1))
await page.screenshot({path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/_일기쓰기화면.png'})
await b.close(); srv.close()
