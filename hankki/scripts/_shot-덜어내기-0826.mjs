// 🧹 「아직 안 해봤어요」 카드 — 덜어내는 안 (2026-08-26)
// 📮 창업자 = *"D에서 표지랑 펭펭 알약까지 들어가니까 정신없어보여"*
// ⭐ 옆 「오늘 뭐 해먹지」는 = 표지 ＋ «작은 글자» 라벨 ＋ 제목 ＋ 설명 (펭펭도 알약도 없다).
//    그 짜임에 맞출수록 두 카드가 «한 판»으로 읽힌다.
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
await new Promise(r=>srv.listen(4404,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})

const 표지붙이기 = ()=>{
  const 원=document.querySelector('.today-main img, .today-main canvas, .today-main [class*=thumb]')
  const 열=document.querySelector('.next-open')
  if(원&&열){ const c=원.cloneNode(true); c.className='next-thumb-demo'; c.removeAttribute('style'); 열.insertBefore(c,열.firstChild) }
}
const 낮춤 = `@media (min-width:700px) and (min-height:700px) and (orientation:landscape){
    .next-row, .today-card{ min-height:132px } }`
const 표지css = `@media (min-width:700px) and (min-height:700px){
    .next-open{ align-items:center }
    .next-thumb-demo{ width:88px;height:88px;border-radius:16px;flex:0 0 auto;object-fit:cover;
      margin-right:14px;background:var(--cream) }
    .today-card{ --today-thumb: 88px } }`

const 안 = {
 'C-표지없이': {css: 낮춤, js:null},
 'E-표지＋펭펭뺌': {css: 표지css+낮춤+`
   @media (min-width:700px) and (min-height:700px){ .next-peng{ display:none } }`, js:표지붙이기},
 'F-오늘카드와같게': {css: 표지css+낮춤+`
   @media (min-width:700px) and (min-height:700px){
     .next-peng{ display:none }
     /* 알약 → 옆 카드와 같은 «작은 글자» 라벨로 */
     .next-label{ background:none; color:var(--brand,#4a6fa5); padding:0; font-size:15px; font-weight:700 }
     .next-head{ margin-bottom:2px }
   }`, js:표지붙이기},
 'H-완전히같게': {css: 표지css+낮춤+`
   @media (min-width:700px) and (min-height:700px){
     /* 📮 창업자 = *"오늘 뭐해먹지랑 «똑같이» 만들되 제목을 아직 안해봤어요를 «알약»으로"*
        ⭐ 오늘 카드 짜임 = [표지] | 라벨 ↓ 제목 ↓ 설명  (세로로 쌓인다)
        ⛔ 지금은 알약과 제목이 «가로»로 붙어 있다 — 그래서 짜임이 달랐다. */
     .next-peng{ display:none }
     .next-open{ align-items:center; flex-wrap:nowrap }
     .next-open > .next-head,
     .next-open > .next-title,
     .next-open > .next-reason{ display:block; width:100%; text-align:left }
     .next-head{ margin:0 0 3px }
     .next-title{ margin:0 0 3px }
     .next-reason{ margin:0 }
     /* 표지 오른쪽 것들을 «한 덩어리»로 세워 준다 */
     .next-open{ display:grid; grid-template-columns:auto minmax(0,1fr); grid-template-rows:auto auto auto;
       column-gap:0; align-items:center }
     .next-thumb-demo{ grid-row:1 / span 3; grid-column:1 }
     .next-head{ grid-row:1; grid-column:2 }
     .next-title{ grid-row:2; grid-column:2 }
     .next-reason{ grid-row:3; grid-column:2 }
   }`, js:표지붙이기},
}
for (const [이름,{css,js}] of Object.entries(안)) {
  const page=await b.newPage({viewport:{width:1194,height:834},deviceScaleFactor:2})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
  await page.goto('http://127.0.0.1:4404/hankki/',{waitUntil:'networkidle'})
  if(css) await page.addStyleTag({content:css})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
  if(js) await page.evaluate(js)
  await page.waitForTimeout(400)
  const h=await page.evaluate(()=>{const e=document.querySelector('.next-row');return e?Math.round(e.getBoundingClientRect().height):0})
  console.log(`${이름.padEnd(14)} 높이 ${h}px`)
  const el=await page.$('.home-pair')
  if(el) await el.screenshot({path:join(OUT,`덜-${이름}.png`)})
  await page.close()
}
await b.close();srv.close()
