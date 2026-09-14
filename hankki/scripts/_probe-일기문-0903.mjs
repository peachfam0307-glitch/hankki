import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/probe-diary'; mkdirSync(OUT, { recursive: true })
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise((r)=>srv.listen(0,r)); const BASE=`http://127.0.0.1:${srv.address().port}/hankki/`
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
const page = await ctx.newPage()
page.on('pageerror',(e)=>console.log('⚠️ pageerror:',String(e.message).split('\n')[0]))
await page.goto(BASE,{waitUntil:'networkidle'})
await page.evaluate(()=>{try{localStorage.removeItem('hankki:nudge:review')}catch{}})
await page.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find((x)=>(x.innerText||'').replace(/\s+/g,'')==='일기')?.click()})
await page.waitForTimeout(900)
console.log('1) 일기 탭 단추들 =', await page.evaluate(()=>[...document.querySelectorAll('button')].map(x=>(x.innerText||'').trim()).filter(Boolean).slice(0,25)))
await page.screenshot({path:join(OUT,'1-일기탭.png')})
await page.evaluate(()=>{[...document.querySelectorAll('button')].find((x)=>/일기 쓰기|오늘 일기/.test(x.innerText||''))?.click()})
await page.waitForTimeout(1200)
console.log('2) 꾸미기 열기 있나 =', await page.evaluate(()=>!!document.querySelector('button[aria-label="꾸미기 열기"]')))
await page.screenshot({path:join(OUT,'2-일기화면.png')})
await page.evaluate(()=>document.querySelector('button[aria-label="꾸미기 열기"]')?.click())
await page.waitForTimeout(2000)
console.log('3) decor-cell 개수 =', await page.evaluate(()=>document.querySelectorAll('button.decor-cell').length))
console.log('3a) 판 안 단추들 =', await page.evaluate(()=>[...document.querySelectorAll('button')].map(x=>(x.innerText||'').trim()).filter(Boolean).slice(0,30)))
console.log('3b) 저장 단추 있나 =', await page.evaluate(()=>[...document.querySelectorAll('button')].some(x=>(x.innerText||'').trim()==='저장')))
await page.screenshot({path:join(OUT,'3-꾸미기판.png')})
await page.evaluate(()=>document.querySelector('button.decor-cell')?.click())
await page.waitForTimeout(700)
await page.screenshot({path:join(OUT,'4-스티커얹음.png')})
await page.evaluate(()=>{[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim()==='저장')?.click()})
await page.waitForTimeout(1500)
console.log('5) 화면 글자 =', (await page.evaluate(()=>document.body.innerText)).slice(0,200).replace(/\n/g,' | '))
await page.screenshot({path:join(OUT,'5-저장뒤.png')})
console.log('📁',OUT)
await b.close(); srv.close()
