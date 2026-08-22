// 📏 [2026-08-22 창업자] "주부의 장바구니 띄우고 설명둘 띄우고 검색 띄우고 이번주픽 띄우고 … 우리밀올리고당"
//    → 블록 «사이» 여백을 잰다. ⛔고치기 전에 지금 값부터.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4459,r))
const { SEED_COACH_SEEN }=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx=await b.newContext({viewport:{width:390,height:844}})
await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4459/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900)
await p.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find(x=>(x.innerText||'').replace(/\s+/g,'').includes('장보기'))?.click()})
await p.waitForTimeout(1200)
const v=await p.evaluate(()=>{
  const 찾 = (fn) => [...document.querySelectorAll('*')].find(fn)
  const 칸 = [
    ['① 주부의 장바구니(제목)', 찾(e=>e.classList.contains('h-section') && /주부의 장바구니/.test(e.innerText||''))],
    ['② 소개 설명',            [...document.querySelectorAll('.t-sub')].find(e=>/추천 아이템/.test(e.innerText||''))],
    ['③ 고지 설명',            [...document.querySelectorAll('.t-sub')].find(e=>/수수료/.test(e.innerText||''))],
    ['④ 찾기 칸',              document.querySelector('.searchbar') || 찾(e=>e.tagName==='INPUT' && /찾기/.test(e.placeholder||''))],
    ['⑤ 칩 줄',                찾(e=>/이번 주 픽/.test(e.innerText||'') && e.className.includes('chip')) || 찾(e=>e.innerText==='이번 주 픽')],
    ['⑥ 이번 주 픽(제목)',      [...document.querySelectorAll('*')].filter(e=>/^이번 주 픽$/.test((e.innerText||'').trim())).pop()],
    ['⑦ 제품 카드',            찾(e=>/담기/.test(e.innerText||'')&&/사러가기/.test(e.innerText||'')&&e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<420)],
  ]
  const out=[]; let 앞=null
  for(const [이름, el] of 칸){
    if(!el){ out.push({이름, 못찾음:true}); continue }
    const r=el.getBoundingClientRect()
    out.push({이름, top:Math.round(r.top), 키:Math.round(r.height), 사이: 앞!==null?Math.round(r.top-앞):null})
    앞=r.bottom
  }
  return out
})
console.log('\n📏 장보기 — 블록 사이 여백 (390px)')
v.forEach(x=>console.log(x.못찾음?`   ${x.이름}  ⛔못 찾음`:`   ${x.이름.padEnd(22,' ')} 키 ${String(x.키).padStart(3)}px · 앞과의 사이 ${x.사이===null?'—':x.사이+'px'}`))
await b.close(); srv.close()
