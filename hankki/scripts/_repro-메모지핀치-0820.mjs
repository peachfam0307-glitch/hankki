// 🤏 메모지를 «두 손가락으로» 키우고 줄이나 (2026-08-20)
//   📮 창업자 확정 = *"유저가 손가락으로 키우고 줄이게"*
//   ⭐ 물어야 할 것 = 「코드가 있나」가 아니라 **「벌리면 실제로 커지나 · 남나」**(규칙 18 ⓘ)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
let body,type=MIME[extname(p)]||'application/octet-stream'
try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4415,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:900}, timezoneId:'Asia/Seoul', hasTouch:true })

const 심기 = async () => {
  const p = await ctx.newPage(); await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1')})
  await p.goto('http://127.0.0.1:4415/',{waitUntil:'networkidle'})
  await p.waitForFunction(()=>!!localStorage.getItem('hankki:v1'),null,{timeout:15000})
  await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hankki:v1'))
  const r=s.recipes.find(x=>x.title==='닭곰탕')||s.recipes[0]; r.cooked=2
  s.diary=[{id:'d0',recipeId:r.id,title:r.title,at:Date.now()-864e5,rating:4,note:'물 조금 더 · 대파 듬뿍',photo:null}]
  localStorage.setItem('hankki:v1',JSON.stringify(s))})
  await p.close()
}
const 열기 = async () => {
  const p = await ctx.newPage(); await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4415/',{waitUntil:'networkidle'}); await p.waitForTimeout(600)
  await p.click('text=닭곰탕'); await p.waitForSelector('.memo-note',{timeout:10000})
  await p.evaluate(()=>{[...document.querySelectorAll('.memo-note')].pop().scrollIntoView({block:'center'})})
  await p.waitForTimeout(300); return p
}
const 폭 = (p) => p.evaluate(()=>Math.round([...document.querySelectorAll('.memo-note')].pop().getBoundingClientRect().width))
// 🤏 두 손가락 — CDP 로 «진짜» touch 를 두 개 보낸다(마우스 흉내로는 pointerId 가 하나뿐이라 못 잡는다)
const 벌리기 = async (p, 배) => {
  const r = await p.evaluate(()=>{const e=[...document.querySelectorAll('.memo-note')].pop().getBoundingClientRect()
    return {cx:e.left+e.width/2, cy:e.top+e.height/2}})
  const cdp = await ctx.newCDPSession(p)
  const d0 = 40, d1 = 40*배
  const 점 = (d)=>[{x:r.cx-d/2,y:r.cy,id:1},{x:r.cx+d/2,y:r.cy,id:2}]
  const 보내 = (type, pts) => cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(q=>({x:q.x,y:q.y,id:q.id}))})
  await 보내('touchStart', 점(d0))
  for (let i=1;i<=6;i++) await 보내('touchMove', 점(d0+(d1-d0)*i/6))
  await 보내('touchEnd', [])
  await p.waitForTimeout(300)
}
const 저장값 = (p) => p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('hankki:v1')).profile?.memoScale}catch{return null}})

let 죽음 = 0
const 말 = (ok, s) => { if(!ok)죽음++; console.log(`${ok?'✅':'⛔'} ${s}`) }

await 심기()
const p1 = await 열기()
const 전 = await 폭(p1)
await 벌리기(p1, 1.5)
const 후 = await 폭(p1)
const 값 = await 저장값(p1)
말(전 >= 150 && 전 <= 170, `처음 폭이 44% (${전}px)`)
말(후 > 전 + 8, `벌리니 «커진다» (${전} → ${후}px)`)
말(값 && 값 > 44, `크기가 저장됐다 (memoScale=${값})`)
await p1.close()

// 🔁 다시 열어도 그 크기인가 — 「보이나」가 아니라 «남나»
const p2 = await 열기()
const 다시 = await 폭(p2)
말(Math.abs(다시 - 후) <= 3, `다시 열어도 그 크기 (${다시}px)`)
// 🤏 줄이기도 되나
await 벌리기(p2, 0.55)
const 줄임 = await 폭(p2)
말(줄임 < 다시 - 8, `오므리니 «작아진다» (${다시} → ${줄임}px)`)
말(줄임 >= 118, `너무 작아지지 않는다 (하한 34%)`)
await p2.close()

// ⛔ 벌린 뒤 «기록 편집 시트»가 열리면 안 된다 — 손 떼는 순간 클릭이 샌다
const p3 = await 열기()
await 벌리기(p3, 1.3)
const 시트 = await p3.evaluate(()=>!!document.querySelector('.sheet, .modal, [role="dialog"]'))
말(!시트, '벌려도 기록 편집 시트가 «안» 열린다')
await p3.close()

await ctx.close(); await b.close(); srv.close()
process.exit(죽음 ? 1 : 0)
