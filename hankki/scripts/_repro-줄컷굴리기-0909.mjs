// 📜 「이번 주 제철 · 월」 줄에 박은 명절 듀오가 «굴려도 그 줄에 붙어 있나» — 재현판.
// 📮 창업자 2026-09-09 = "고정해줘 스크롤하면 내려가는거이상해"
// ⭐ 잣대 = 굴리기 전·후로 「월 알약과 듀오의 사이」가 «변하지 않아야» 한다(화면 좌표는 둘 다 변한다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=new URL('../dist',import.meta.url).pathname
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/'||!extname(p))p='/index.html';
 try{s.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});s.end(readFileSync(join(DIST,p)))}catch{s.writeHead(404);s.end()}})
await new Promise(r=>srv.listen(0,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki-theme','apricot')}catch{}})
const p=await ctx.newPage()
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'});await p.waitForTimeout(2500)
const 재기 = () => p.evaluate(() => {
  const 월=[...document.querySelectorAll('.weekly-day')][0]
  const 컷=document.querySelector('.weekly-text img')
  if(!월||!컷) return null
  const a=월.getBoundingClientRect(), b=컷.getBoundingClientRect()
  return { 사이x:+(b.left-a.right).toFixed(1), 사이y:+(b.top-a.top).toFixed(1), 컷폭:Math.round(b.width) }
})
const 전 = await 재기()
await p.evaluate(() => { const 통=[...document.querySelectorAll('*')].map(e=>[e,e.scrollHeight-e.clientHeight])
  .filter(([e,d])=>d>40&&e.clientHeight>200).sort((x,y)=>y[1]-x[1])[0]; if(통) 통[0].scrollTop = 260 })
await p.waitForTimeout(600)
const 후 = await 재기()
console.log('굴리기 전', JSON.stringify(전))
console.log('굴린  뒤', JSON.stringify(후))
const ok = 전 && 후 && Math.abs(전.사이x-후.사이x)<1.5 && Math.abs(전.사이y-후.사이y)<1.5 && 후.컷폭>20
console.log(ok ? '✅ 굴려도 「월」 알약과 사이가 그대로다 — 줄에 붙어 있다'
               : '❌ 사이가 벌어졌다 — 아직 화면에 붙어 있다')
await b.close(); srv.close()
process.exit(ok?0:1)
