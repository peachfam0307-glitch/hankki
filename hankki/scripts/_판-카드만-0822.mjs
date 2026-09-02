// 🔍 [2026-08-22] 제품 «카드 하나»만 딱 잘라 찍는다 — 창업자 *"뭐가 달라진거야/ 글씨크기만 바꼈자나"*
//    ⛔ 넓게 찍으면 배치가 바뀐 게 안 보인다. 바뀐 자리만 크게.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4457,r))
const { SEED_COACH_SEEN }=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3})
await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4457/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900)
await p.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find(x=>(x.innerText||'').replace(/\s+/g,'').includes('장보기'))?.click()})
await p.waitForTimeout(1200)
const box=await p.evaluate(()=>{const c=[...document.querySelectorAll('div')].find(e=>/담기/.test(e.innerText||'')&&/사러가기/.test(e.innerText||'')&&e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<400)
  const r=c.getBoundingClientRect(); return {x:r.left-3,y:r.top-3,width:r.width+6,height:r.height+6}})
writeFileSync(join(OUT,'카드-새.png'), await p.screenshot({clip:box}))
console.log('✅ 카드만 찍었다', JSON.stringify(box))
await b.close(); srv.close()
