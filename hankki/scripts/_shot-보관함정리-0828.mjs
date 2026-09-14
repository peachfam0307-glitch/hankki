// 📸 임시보관함 «정리 뒤» 실물 — 창업자 시안용 (2026-08-28)
// ⭐ 창업자 폰 상황을 그대로 심는다 — 미정리 6(사진) ＋ 정리됨 다수.
//    ⛔ 숫자만 보고 보내지 않는다(절대원칙 21) — 뽑아서 내가 열어본다.
// 🏷 이름표 = 시안 뽑기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = process.env.SHOT_OUT || '/tmp/shot'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4454,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1') } catch {} })

const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4454/hankki/', { waitUntil:'networkidle' }); await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  const 그리기 = (w,h,글) => { const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')
    x.fillStyle='#101014';x.fillRect(0,0,w,h);x.fillStyle='#1c1c22';x.fillRect(16,80,w-32,h-160)
    x.fillStyle='#e8e8ee';x.font='bold '+Math.round(w/22)+'px sans-serif'
    for(let k=0;k<20;k++) x.fillText(글, 30, 130+k*Math.round(h/24)); return c.toDataURL('image/jpeg',0.9) }
  const 제목 = ['콩나물의 시원함을 최대한 살린 콩나물무침','릴스 친구 1','2na2jun mom.official','간단한데 진짜 맛있는','사진 레시피','사진 레시피']
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  const 이제 = Date.now()
  s.recipes = [
    ...제목.map((t,i)=>({ id:'sh-'+i, title:t, status:'unsorted', source:'photo',
      image: 그리기(540,1170,'깨끗이 씻은 콩나물 300g'), savedAt: 이제-i*3600*1000,
      ingredients:[], steps:[], favorite:false, cooked:0 })),
    ...(s.recipes||[]),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p0.close()
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4454/hankki/', { waitUntil:'networkidle' }); await p.waitForTimeout(7000)
await p.getByRole('button',{name:/임시보관함/}).first().click(); await p.waitForTimeout(900)
await p.screenshot({ path: join(OUT,'임시보관함-후.png') })
const n = await p.evaluate(()=>document.querySelectorAll('.inbox-row').length)
const 총 = await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('hankki:v1')).recipes.length}catch{return -1}})
console.log(`줄 ${n}개 / 저장소 전체 ${총}편 → 임시보관함엔 «미정리만»`)
await b.close(); srv.close()
