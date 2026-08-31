// 📸 [2026-08-22] «바꾼 뒤» 화면만 크게 — 창업자가 before/after 를 헷갈려해서 하나만 보여준다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4458,r))
const { SEED_COACH_SEEN }=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3})
await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4458/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900)
await p.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find(x=>(x.innerText||'').replace(/\s+/g,'').includes('장보기'))?.click()})
await p.waitForTimeout(1200)
// 🔢 화면에 «그려진» 윗글을 그대로 찍어 확인한다(규칙 30 — 실물)
const 윗글=await p.evaluate(()=>[...document.querySelectorAll('.t-sub')].slice(0,2).map(e=>(e.innerText||'').replace(/\s+/g,' ')))
console.log('화면 윗글:'); 윗글.forEach(t=>console.log('  「'+t+'」'))
const box=await p.evaluate(()=>{const h=[...document.querySelectorAll('.sec-head')].find(e=>/주부의 장바구니/.test(e.innerText||''))
  const c=[...document.querySelectorAll('div')].find(e=>/담기/.test(e.innerText||'')&&/사러가기/.test(e.innerText||'')&&e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<400)
  const a=h.getBoundingClientRect(); return {x:8,y:Math.max(0,a.top-8),width:374,height:Math.min(740,c.getBoundingClientRect().bottom-a.top+16)}})
writeFileSync(OUT+'/지금상태-큐레이션.png', await p.screenshot({clip:box}))
console.log('✅ 찍었다')
await b.close(); srv.close()
