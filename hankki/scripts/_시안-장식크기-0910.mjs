// 🎑 명절 장식 크기·자리 시안 — ①아이콘과 안 겹치나(숫자) ②창업자가 볼 그림(맨 위·맨 아래)
// 📮 창업자 2026-09-10 = "큰달위치 조금내리고 크기키워서 빈자리에넣어. 아이콘들과간섭안생기게."
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
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'});await p.waitForTimeout(2500)
for(let i=0;i<5;i++){const c=await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true});if(c){await p.waitForTimeout(350);continue}if(!(await p.locator('.sheet-mask').count()))break;await p.keyboard.press('Escape');await p.waitForTimeout(250)}
await p.waitForFunction(()=>document.querySelectorAll('.screen div[aria-hidden] > span').length>0,null,{timeout:45000})
await p.waitForTimeout(500)
const 잰=await p.evaluate(()=>{
  const 아이콘=[...document.querySelectorAll('.topbar button, .topbar [role="button"]')].map(e=>e.getBoundingClientRect())
  const 아래끝=아이콘.length?Math.max(...아이콘.map(r=>r.bottom)):0
  const 조각=[...document.querySelectorAll('.screen div[aria-hidden] > span')].map(e=>{const r=e.getBoundingClientRect()
    return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1),w:Math.round(r.width),h:Math.round(r.height)}})
  return {아이콘아래끝:+아래끝.toFixed(1), 큰달:조각[0], 전부:조각.length}
})
const 큰 = 잰.큰달
const 안겹침 = 큰.top >= 잰.아이콘아래끝
console.log(`아이콘 줄 아래끝 ${잰.아이콘아래끝} · 큰달 위끝 ${큰.top}`)
console.log(`  ${안겹침?'✅':'❌'} 큰달이 아이콘 «아래»에서 시작한다 (틈 ${(큰.top-잰.아이콘아래끝).toFixed(1)}px)`)
console.log(`  큰달 크기 ${큰.w}×${큰.h} · 오른쪽 끝 ${큰.right} (창 390)`)
await p.screenshot({path:'/tmp/시안-위.png'})
await p.evaluate(()=>{const el=document.querySelector('.screen'); el.scrollTop=el.scrollHeight}); await p.waitForTimeout(800)
await p.screenshot({path:'/tmp/시안-아래.png'})
await b.close();srv.close()
process.exit(안겹침?0:1)
