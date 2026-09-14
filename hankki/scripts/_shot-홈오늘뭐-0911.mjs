// 📸 홈 화면의 「오늘 뭐 해먹지」가 «어디에 있고 무엇을 보여주나» (2026-09-11)
//   📮 창업자 = *"홈은뭐야?"* → 말로 설명하지 말고 **찍어서 보여준다**(규칙 21).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const 낼곳 = process.env.SHOT_DIR || '/tmp/홈'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
let body,type=MIME[extname(p)]||'application/octet-stream'
try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4430,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { todayKST } = await import('../src/today.js')
const 어제 = todayKST(new Date(Date.now() - 86400000))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:900}, timezoneId:'Asia/Seoul', deviceScaleFactor:2 })
// 📸 창업자 냉장고 그대로
const 칸들 = [['두부',어제],['닭고기',null],['돼지고기',null],['소고기',null],['해물모듬',null],['오징어',null],['관자',null],['계란',null],['새우',null],['참깨',null],['김',null]]
const p = await ctx.newPage(); await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')})
await p.goto('http://127.0.0.1:4430/',{waitUntil:'networkidle'})
await p.waitForFunction(()=>!!localStorage.getItem('hankki:v1'),null,{timeout:15000})
await p.evaluate((칸들)=>{const s=JSON.parse(localStorage.getItem('hankki:v1'))
s.pantry=칸들.map(([name,expiry],i)=>({id:'p'+i,name,expiry,addedAt:Date.now()}))
localStorage.setItem('hankki:v1',JSON.stringify(s))},칸들)
await p.close()
const q = await ctx.newPage(); await q.addInitScript(SEED_COACH_SEEN)
await q.goto('http://127.0.0.1:4430/',{waitUntil:'networkidle'}); await q.waitForTimeout(900)
// 🔎 화면에서 「오늘 뭐 해먹지」 자리를 찾아 빨간 테두리로 표시한다
const 찾음 = await q.evaluate(()=>{
  const 후보=[...document.querySelectorAll('*')].filter(el=>/오늘 뭐 해먹/.test(el.textContent||'') && el.children.length<6)
  if(!후보.length) return null
  const el=후보[후보.length-1]
  const 통=el.closest('section,div')||el
  통.style.outline='3px solid red'; 통.style.outlineOffset='2px'
  const r=통.getBoundingClientRect()
  return { 글:통.innerText.replace(/\n+/g,' · ').slice(0,120), top:Math.round(r.top), 높이:Math.round(r.height) }
})
console.log('🏠 홈 「오늘 뭐 해먹지」 =', JSON.stringify(찾음,null,1))
await q.screenshot({ path: join(낼곳,'홈-오늘뭐해먹지.png') })
console.log('📸', join(낼곳,'홈-오늘뭐해먹지.png'))
await ctx.close(); await b.close(); srv.close()
