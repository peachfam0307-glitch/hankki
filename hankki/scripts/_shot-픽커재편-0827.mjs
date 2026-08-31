import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
let body,type=MIME[extname(p)]||'application/octet-stream'
try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4433,r))
const {SEED_COACH_SEEN}=await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4433/hankki/',{waitUntil:'networkidle'})
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(700)
await p.evaluate(()=>{[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')].find(x=>(x.innerText||'').replace(/\s+/g,'').includes('레시피'))?.click()})
await p.waitForTimeout(600)
await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/\S/.test(x.innerText||'')&&x.querySelector('img, svg'))?.click()})
await p.waitForTimeout(800)
if(!await p.evaluate(()=>!!document.querySelector('.ficon-grid'))){await p.evaluate(()=>document.querySelector('[data-coach="thumb"], .detail-thumb, .rd-thumb')?.click());await p.waitForTimeout(500)}
if(!await p.evaluate(()=>!!document.querySelector('.ficon-grid'))){await p.evaluate(()=>{[...document.querySelectorAll('button,[role="button"]')].find(x=>/표지|아이콘/.test(x.getAttribute('aria-label')||''))?.click()});await p.waitForTimeout(600)}
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
await p.screenshot({path:`${OUT}/픽커-첫화면.png`})
// 긴 이름이 많은 자리로 굴린다
await p.evaluate(()=>{const sc=document.querySelector('.emoji-sheet');const t=[...document.querySelectorAll('.ficon-name')].find(e=>(e.textContent||'').length>=8);t?.scrollIntoView({block:'center'})})
await p.waitForTimeout(500)
await p.screenshot({path:`${OUT}/픽커-긴이름.png`})
// 🅲 시안 — 4열 → 3열 (⏳창업자 판정 대기 · 실측상 「낱말 가운데 끊김」이 123 → 11 로 준다)
//    ⛔ 소스를 안 고치고 CSS 만 얹어 찍는다(절대원칙 30) — 지금 앱 그대로에 얹힌 모습이다
await p.evaluate(()=>{const s=document.createElement('style');s.id='_3열';s.textContent='.ficon-grid{grid-template-columns:repeat(3,minmax(0,1fr))}';document.head.appendChild(s)})
await p.waitForTimeout(400)
await p.screenshot({path:`${OUT}/픽커-3열시안.png`})
await p.evaluate(()=>document.getElementById('_3열')?.remove())
// 갈래 이름들
const 갈래=await p.evaluate(()=>[...document.querySelectorAll('.emoji-cat')].map(x=>x.textContent))
console.log('갈래:',갈래.join(' / '))
await b.close();srv.close()
