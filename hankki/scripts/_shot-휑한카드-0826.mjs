// 🫥 패드 «가로»에서 「아직 안 해봤어요」·「오늘 뭐 해먹지」가 휑한 것 (2026-08-26)
// 📮 창업자 = *"이건 나도 좀 그래보여. 글씨를 크게 해야해? 아님 다른 방법이 있어?"*
// ⭐ 뿌리 = 「아직 안 해봤어요」엔 «그 요리 그림이 없다». 오늘 카드엔 썸네일(72px)이 있어 짝이 안 맞는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드가로'
mkdirSync(OUT,{recursive:true})
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4403,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})

const 안 = {
 '지금': {css:'', js:null},
 'A-글씨': {css:`@media (min-width:700px) and (min-height:700px){
    .next-title{ font-size:24px } .next-reason{ font-size:17px } .next-label{ font-size:16px }
    .today-title{ font-size:26px } .today-label{ font-size:17px } .today-reason{ font-size:17px }
  }`, js:null},
 'C-높이': {css:`@media (min-width:700px) and (min-height:700px) and (orientation:landscape){
    /* ⛔ 내가 넣은 min-height 168px 는 «패드 세로» 기준이었다. 가로는 폭이 1.4배라 더 휑해진다 */
    .next-row, .today-card{ min-height:132px }
  }`, js:null},
 'D-그림＋높이': {css:`@media (min-width:700px) and (min-height:700px){
    .next-open{ align-items:center }
    .next-thumb-demo{ width:88px; height:88px; border-radius:16px; flex:0 0 auto; object-fit:cover;
      margin-right:14px; background:var(--cream) }
    .today-card{ --today-thumb: 88px }
  }
  @media (min-width:700px) and (min-height:700px) and (orientation:landscape){
    .next-row, .today-card{ min-height:132px }
  }`, js:()=>{
    const 원=document.querySelector('.today-main img, .today-main canvas, .today-main [class*=thumb]')
    const 열=document.querySelector('.next-open')
    if(원&&열){ const c=원.cloneNode(true); c.className='next-thumb-demo'; c.removeAttribute('style'); 열.insertBefore(c,열.firstChild) }
  }},
 'B-그림': {css:`@media (min-width:700px) and (min-height:700px){
    .next-open{ align-items:center }
    .next-thumb-demo{ width:96px; height:96px; border-radius:16px; flex:0 0 auto; object-fit:cover;
      margin-right:14px; background:var(--cream) }
    .today-card{ --today-thumb: 96px }
  }`, js:()=>{
    // 「오늘 뭐 해먹지」의 썸네일을 그대로 복사해 「아직 안 해봤어요」 앞에 붙여 «어떻게 보일지»만 보인다
    const 원=document.querySelector('.today-main img, .today-main canvas, .today-main [class*=thumb]')
    const 열=document.querySelector('.next-open')
    if(원&&열){ const c=원.cloneNode(true); c.className='next-thumb-demo'; c.removeAttribute('style'); 열.insertBefore(c,열.firstChild) }
  }},
}
for (const [이름,{css,js}] of Object.entries(안)) {
  const page=await b.newPage({viewport:{width:1194,height:834},deviceScaleFactor:2})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  await page.goto('http://127.0.0.1:4403/hankki/',{waitUntil:'networkidle'})
  if(css) await page.addStyleTag({content:css})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
  if(js) await page.evaluate(js)
  await page.waitForTimeout(500)
  const v=await page.evaluate(()=>{
    const g=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().height):0}
    const n=document.querySelector('.next-card'), t=document.querySelector('.today-main')
    const 속=(el)=>{ if(!el) return 0
      let r=0; [...el.querySelectorAll('*')].forEach(e=>{const q=e.getBoundingClientRect(); if(q.width>0) r=Math.max(r,q.right)})
      const b=el.getBoundingClientRect(); return Math.round((r-b.left)/b.width*100) }
    return { 안해봤높이:g('.next-row'), 오늘높이:g('.today-card'),
             안해봤채움:속(n), 오늘채움:속(t) }
  })
  console.log(`${이름.padEnd(7)} 안해봤 ${v.안해봤높이}px(가로 ${v.안해봤채움}% 참) · 오늘 ${v.오늘높이}px(${v.오늘채움}% 참)`)
  // 그 두 카드만 잘라서 낸다
  const el=await page.$('.home-pair')
  if(el) await el.screenshot({path:join(OUT,`휑-${이름}.png`)})
  await page.close()
}
await b.close();srv.close()
console.log(`\n🖼 ${OUT}`)
