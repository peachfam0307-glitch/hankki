// 📏 패드 홈 — 블록마다 «높이»를 잰다 (2026-08-26)
// 📮 창업자 = *"이것도 양쪽으로 분할… 전체적으로 높이를 비슷하게. 지금은 흰상자부분이 너무 많고,
//    한끼소식·3일전 만든 것·오늘뭐해먹지가 너무 높이가 낮아"* ＋ *"이번주제철, 우리집레시피는 한줄에"*
// ⭐ C(위아래)를 «물린» 상태로 잰다 — 창업자가 「한 줄에」라고 했으므로.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4397,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
// C 를 물린다 = 좌우로 되돌린다
const 물림 = `@media (min-width:700px) and (min-height:700px){
  .week-pair.two{ grid-template-columns:minmax(0,1fr) minmax(0,1fr) }
  .week-pair.two .weekly-box > .weekly-row{
    grid-template-columns:repeat(auto-fit, calc((100% - 20px)/3)) }
}`
const page=await b.newPage({viewport:{width:834,height:1194},deviceScaleFactor:2})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
await page.goto('http://127.0.0.1:4397/hankki/',{waitUntil:'networkidle'})
await page.addStyleTag({content: 물림})
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
console.log(await page.evaluate(()=>{
  const s=document.querySelector('.screen .pad')||document.querySelector('.screen')
  const 줄=[]
  const 훑=(el,깊이)=>{[...el.children].forEach((e)=>{
    const r=e.getBoundingClientRect()
    if (r.height < 8) return
    const 글=(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,24)
    줄.push(`${'  '.repeat(깊이)}${String(Math.round(r.height)).padStart(4)}px  .${(typeof e.className==='string'?e.className.split(' ')[0]:e.tagName.toLowerCase())||'?'}  「${글}」`)
    if (깊이 < 1) 훑(e, 깊이+1)
  })}
  훑(s, 0)
  return 줄.join('\n') + `\n\n전체 ${Math.round(s.scrollHeight)}px · 화면 ${Math.round(s.clientHeight)}px`
}))
await page.screenshot({path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826/_물림-홈.png'})
await b.close();srv.close()
