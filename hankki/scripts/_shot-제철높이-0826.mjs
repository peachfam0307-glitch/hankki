// 📐 「이번 주 제철」 상자 «높이»를 줄인다 — 창업자 = *"너무 크네 이번주제철이. 높이를 좀 줄여야겠어."*
// ⭐ 카드 폭 상한을 낮추면 그림 타일이 1:1 이라 «높이»가 같이 준다. 몇 개 재서 고르게 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
mkdirSync(OUT,{recursive:true})
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4395,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const 상한 = [null, 210, 185, 160]
for (const cap of 상한) {
  const page=await b.newPage({viewport:{width:834,height:1194},deviceScaleFactor:2})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
  await page.goto('http://127.0.0.1:4395/hankki/',{waitUntil:'networkidle'})
  if (cap) await page.addStyleTag({content:
    `@media (min-width:700px) and (min-height:700px){
       .week-pair.two .weekly-box > .weekly-row{
         grid-template-columns:repeat(auto-fit, min(${cap}px, calc((100% - 20px)/3))) }
     }`})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
  const v=await page.evaluate(()=>{
    const box=document.querySelector('.weekly-box')
    const c=document.querySelector('.mini-card')
    const wp=document.querySelector('.week-pair')
    return { 상자: box?Math.round(box.getBoundingClientRect().height):0,
             카드: c?Math.round(c.getBoundingClientRect().width):0,
             카드높이: c?Math.round(c.getBoundingClientRect().height):0,
             둘합: wp?Math.round(wp.getBoundingClientRect().height):0 }
  })
  console.log(`상한 ${String(cap??'없음').padStart(4)} → 카드 ${v.카드}×${v.카드높이}px · 제철 상자 ${v.상자}px · 두 상자 합 ${v.둘합}px`)
  await page.screenshot({path:join(OUT,`높이-${cap??'지금'}.png`)})
  await page.close()
}
await b.close();srv.close()
