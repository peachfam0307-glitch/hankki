// 🔎 「화면에 «한 번에» 그려지는 표지가 몇 개인가」 — 지연 로딩 설계의 전제 확인 (2026-09-02)
// ⛔ 목록이 전부를 그리면 「보이는 것만 꺼낸다」가 «전부 꺼낸다»가 된다. 그럼 설계가 무너진다.
// 실행: node scripts/_probe-표지몇개-0902.mjs
// 🏷 이름표 = 판정대기 (설계 근거)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4487,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:844} })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4487/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(2800)
await p.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim()==='레시피')?.click()})
await p.waitForTimeout(1500)
const 잰값 = await p.evaluate(()=>{
  const 총 = JSON.parse(localStorage.getItem('hankki:v1')||'{}').recipes?.length ?? 0
  const 칸 = document.querySelectorAll('.grid-card').length
  // Thumb 이 그리는 표지 상자 = .thumb 또는 그 안 img
  const 표지 = document.querySelectorAll('.grid-card img, .grid-card [class*=thumb]').length
  const 화면 = window.innerHeight
  let 보이는 = 0
  document.querySelectorAll('.grid-card').forEach((e)=>{ const r=e.getBoundingClientRect(); if (r.bottom>0 && r.top<화면) 보이는++ })
  return { 저장된레시피: 총, 그려진칸: 칸, 표지요소: 표지, 화면에보이는칸: 보이는 }
})
console.log('\n🔎 표지가 «한 번에» 몇 개 그려지나\n')
Object.entries(잰값).forEach(([k,v])=>console.log(`  ${k.padEnd(16)} ${v}`))
console.log(`\n  👉 ${잰값.그려진칸 >= 잰값.저장된레시피 ? '⛔ 전부 그린다 — 「보이는 것만」이 저절로 되지 않는다' : '✅ 일부만 그린다'}`)
await b.close(); srv.close()
