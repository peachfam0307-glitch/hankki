// 🔬 「스크롤하면 회색 막대기가 덜덜거린다」 — 원인 후보를 «실측»으로 가른다 (창업자 2026-08-14)
//   ⛔ 「늦게 따라온다」(고침 완료)와 «다른» 증상이다. 늦음 = 한 박자 뒤 · 떨림 = 박자가 안 맞음.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4461,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:411,height:891},deviceScaleFactor:2,timezoneId:'Asia/Seoul'})
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const pg=await ctx.newPage()
await pg.goto('http://127.0.0.1:4461/hankki/',{waitUntil:'networkidle'});await pg.waitForTimeout(900)
const a=pg.getByRole('button',{name:'나중에'}).first(); if(await a.count()&&await a.isVisible().catch(()=>false)) await a.click().catch(()=>{})
await pg.getByRole('button',{name:/^레시피/}).last().click();await pg.waitForTimeout(1200)

console.log('\n━━━ ① 브라우저가 «스크롤과 같은 스레드»에서 옮겨줄 수 있나 ━━━')
console.log(JSON.stringify(await pg.evaluate(`({
  scrollTimeline: CSS.supports('animation-timeline', 'scroll()'),
  animationRange: CSS.supports('animation-range', 'normal'),
  scrollbarWidthThin: CSS.supports('scrollbar-width', 'thin'),
  scrollbarColor: CSS.supports('scrollbar-color', 'red blue'),
  chrome: (navigator.userAgent.match(/Chrome\\/(\\d+)/) || [])[1] || '?',
})`), null, 1))

console.log('\n━━━ ② 굴리는 동안 내용 길이(scrollHeight)가 흔들리나 ━━━')
console.log(JSON.stringify(await pg.evaluate(`(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(r))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  const 표 = []
  for (let i = 0; i < 40; i++) { el.scrollTop += 40; await raf(); 표.push(el.scrollHeight) }
  const 종류 = [...new Set(표)]
  return { 종류수: 종류.length, 값: 종류.slice(0, 8), 처음: 표[0], 끝: 표[표.length - 1] }
})()`), null, 1))

await b.close();srv.close()
