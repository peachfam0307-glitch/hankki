// ⚖️ 패드 홈 «높이 균형» 안 (2026-08-26)
// 📮 창업자 = *"이번주제철, 우리집레시피는 한줄에"* ＋ *"전체적으로 높이를 비슷하게.
//    지금은 흰상자부분이 너무 많고, 한끼소식·3일전 만든 것·오늘뭐해먹지가 너무 높이가 낮아"*
// 🔢 지금(좌우 복원) = 소식 83 · 아직안해봤어요 114 · 오늘뭐해먹지 114 ↔ 흰상자 340
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4398,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})

// ⓐ C 를 물린다(창업자 = 「한줄에」)  ⓑ 낮은 셋을 키운다  ⓒ 흰 상자를 줄인다
const 안 = {
 '지금(C)': '',
 '물림만': `@media (min-width:700px) and (min-height:700px){
   .week-pair.two{ grid-template-columns:minmax(0,1fr) minmax(0,1fr) }
   .week-pair.two .weekly-box > .weekly-row{ grid-template-columns:repeat(auto-fit, calc((100% - 20px)/3)) }
 }`,
 '균형': `@media (min-width:700px) and (min-height:700px){
   /* ⓐ 한 줄로 되돌린다 */
   .week-pair.two{ grid-template-columns:minmax(0,1fr) minmax(0,1fr) }
   .week-pair.two .weekly-box > .weekly-row{ grid-template-columns:repeat(auto-fit, calc((100% - 20px)/3)) }
   /* ⓑ 낮은 셋을 키운다 — 83/114/114 → 비슷하게 */
   .home-pair > .press{ min-height:118px }
   .next-row, .today-card{ min-height:168px }
   /* ⓒ 흰 상자를 줄인다 — 제목·설명 여백을 조인다 */
   .weekly-box .weekly-desc, .weekly-box .t-sub{ margin-bottom:4px }
   .week-pair.two .weekly-box > .weekly-row{ margin-top:4px }
 }`,
}
for (const [이름, css] of Object.entries(안)) {
  const page=await b.newPage({viewport:{width:834,height:1194},deviceScaleFactor:2})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
  await page.goto('http://127.0.0.1:4398/hankki/',{waitUntil:'networkidle'})
  if (css) await page.addStyleTag({content:css})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
  const v=await page.evaluate(()=>{
    const g=(s)=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().height):0}
    const pad=document.querySelector('.screen .pad')
    return { 소식:g('.home-pair > .press'), 안해봤:g('.next-row'), 오늘:g('.today-card'),
             흰상자:g('.weekly-box'), 카드:g('.mini-card'),
             카드폭:(()=>{const c=document.querySelector('.mini-card');return c?Math.round(c.getBoundingClientRect().width):0})(),
             전체:pad?Math.round(pad.scrollHeight):0 }
  })
  console.log(`${이름.padEnd(8)} 소식 ${String(v.소식).padStart(3)} · 안해봤 ${String(v.안해봤).padStart(3)} · 오늘 ${String(v.오늘).padStart(3)} ↔ 흰상자 ${String(v.흰상자).padStart(3)} (카드 ${v.카드폭}px) · 홈 전체 ${v.전체}px`)
  await page.screenshot({path:join(OUT,`균형-${이름}.png`)})
  await page.close()
}
await b.close();srv.close()
