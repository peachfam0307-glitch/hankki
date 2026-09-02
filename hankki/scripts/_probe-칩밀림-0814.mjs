// 🔬 「전체 46」 칩이 왜 처음부터 왼쪽으로 잘리나 — 원인을 «끄고 켜서» 확인한다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4453,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891}, deviceScaleFactor:2, timezoneId:'Asia/Seoul' })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4453/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(900)
const a=pg.getByRole('button',{name:'나중에'}).first(); if(await a.count()&&await a.isVisible().catch(()=>false)) await a.click().catch(()=>{})
await pg.getByRole('button',{name:/^레시피/}).last().click(); await pg.waitForTimeout(800)

const 잰다 = (라벨) => pg.evaluate(`(() => {
  const el = document.querySelector('.hscroll')
  if (!el) return { 오류: 'hscroll 없음' }
  const cs = getComputedStyle(el)
  const 첫 = el.firstElementChild.getBoundingClientRect()
  return {
    판: ${JSON.stringify(라벨)},
    밀림: Math.round(el.scrollLeft),
    snap: cs.scrollSnapType, padL: cs.paddingLeft, scrollPadL: cs.scrollPaddingLeft,
    첫칸글: el.firstElementChild.innerText.trim(),
    첫칸왼쪽: Math.round(첫.left),   // 0 보다 작으면 «잘려 있다»
  }
})()`)

console.log('Ⓐ 지금 그대로            :', JSON.stringify(await 잰다('지금')))

// ① scroll-snap 을 끄고 새로 그린다
await pg.evaluate(`(() => { const s=document.createElement('style'); s.id='t1'; s.textContent='.hscroll{scroll-snap-type:none}'; document.head.append(s) })()`)
await pg.evaluate(`document.querySelector('.hscroll').scrollLeft = 0`)
await pg.waitForTimeout(400)
console.log('Ⓑ snap 끄고 0 으로 밀면  :', JSON.stringify(await 잰다('snap 끔')))

// ② snap 을 되살리고 scroll-padding-left 를 준다
await pg.evaluate(`(() => { document.getElementById('t1').remove()
  const s=document.createElement('style'); s.id='t2'; s.textContent='.hscroll{scroll-padding-left:20px}'; document.head.append(s) })()`)
await pg.evaluate(`document.querySelector('.hscroll').scrollLeft = 0`)
await pg.waitForTimeout(400)
console.log('Ⓒ snap 켠 채 scroll-padding-left:20px :', JSON.stringify(await 잰다('scroll-padding')))

await b.close(); srv.close()
