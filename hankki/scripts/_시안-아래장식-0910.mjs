// 🎑 맨 아래 장식·월 옆 줄장식 «재기» — 📮창업자 2026-09-10 "젤 아래 곰돌이 잘렸고 (크기도조금 더 키워야함) 월요일 옆에 곰돌이도 크기좀 키워야해"
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=new URL('../dist',import.meta.url).pathname
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/'||!extname(p))p='/index.html'
  let b=null; try{b=readFileSync(join(DIST,p))}catch{}
  if(!b){s.writeHead(404);s.end();return}
  s.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});s.end(b)})
await new Promise(r=>srv.listen(0,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki-theme','apricot')}catch{}})
const p=await ctx.newPage()
p.on('pageerror',e=>console.log('PAGEERR',e.message))
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200))})
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'});await p.waitForTimeout(2500)
for(let i=0;i<5;i++){const c=await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true});if(c){await p.waitForTimeout(350);continue}if(!(await p.locator('.sheet-mask').count()))break;await p.keyboard.press('Escape');await p.waitForTimeout(250)}
await p.waitForFunction(()=>document.querySelectorAll('.screen div[aria-hidden] > span').length>0,null,{timeout:45000})
await p.evaluate(()=>{const el=document.querySelector('.screen'); el.scrollTop=el.scrollHeight}); await p.waitForTimeout(1000)
const 잰=await p.evaluate(()=>{
  const 탭=document.querySelector('.tabbar, nav.tabbar, footer nav, .tabs')
  const 조각=[...document.querySelectorAll('.screen div[aria-hidden] > span')].map(e=>{const r=e.getBoundingClientRect()
    return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1),w:Math.round(r.width),h:Math.round(r.height)}})
  const 줄=document.querySelector('.weekly-day')
  const 줄r=줄?줄.getBoundingClientRect():null
  const 줄img=줄&&줄.parentElement?[...줄.parentElement.querySelectorAll('img')].map(i=>{const r=i.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),left:+r.left.toFixed(1),top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),src:i.src.split('/').pop()}}):[]
  return {탭위끝: 탭?+탭.getBoundingClientRect().top.toFixed(1):null, 창높이: innerHeight, 조각, 월알약: 줄r&&{left:+줄r.left.toFixed(1),right:+줄r.right.toFixed(1),top:+줄r.top.toFixed(1),bottom:+줄r.bottom.toFixed(1)}, 줄그림: 줄img}
})
console.log(JSON.stringify(잰,null,1))
await p.screenshot({path:'/tmp/아래-지금.png'})
await p.evaluate(()=>{const el=document.querySelector('.screen'); el.scrollTop=0}); await p.waitForTimeout(700)
await p.screenshot({path:'/tmp/위-지금.png'})
await b.close();srv.close()
