// 🏠🔍 「홈만 말풍선이 아래로 보인다」 — 상단바에 «무엇이» 서 있는지 재서 찾는다 (2026-08-30)
//   📮 창업자 = *"홈 프로필 사진이 작아서 그런지 말풍선이 홈만 아래로 내려가 보여.."*
//   ⭐ 이 판이 답한 것 = **홈 상단바엔 `img` 가 아예 없다**(아바타는 「한」 글자 배지 div).
//      그래서 「캐릭터」를 `img` 로 찾는 잣대가 홈에서만 헛돌고 있었다(규칙 18 ⓘ).
//   🔢 실측 = 아바타 38px(하단 55) · 레시피 곰 43px(하단 57) · 말풍선 top 64 → 홈 9px · 레시피 6.5px
//   👉 고치는 시안은 `_판-홈아바타-0830.mjs` 〔판정 대기〕
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-홈아바타-0830.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'; import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
 let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}
 s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4401,r))
const {SEED_COACH_SEEN}=await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3})
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
await p.goto('http://127.0.0.1:4401/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900)
for (const [탭,이름] of [[null,'홈'],['레시피','레시피']]) {
  if (탭) { await p.evaluate((n)=>{const c=[...document.querySelectorAll('.bottom-nav .nav-item')].find(e=>([...e.querySelectorAll('span')].pop()?.textContent||'').trim()===n); if(c)c.click()},탭); await p.waitForTimeout(600) }
  const r = await p.evaluate(()=>{
    const 바=document.querySelector('.topbar'); const 말=document.querySelector('.tab-talk-b')
    const mr=말.getBoundingClientRect()
    // 상단바 «첫 자식» 전부를 훑어 실제로 보이는 것들
    const 것들=[...바.children].map(e=>{const r=e.getBoundingClientRect();return {태그:e.tagName, cls:(e.className||'').toString().slice(0,28), w:Math.round(r.width), h:Math.round(r.height), bottom:Math.round(r.bottom), 말까지:+(mr.top-r.bottom).toFixed(1)}}).filter(x=>x.w>0)
    const img=바.querySelector('img'); const ir=img?.getBoundingClientRect()
    return {것들, img: img?{src:(img.getAttribute('src')||'').split('/').pop(), w:Math.round(ir.width),h:Math.round(ir.height),bottom:Math.round(ir.bottom),말까지:+(mr.top-ir.bottom).toFixed(1)}:null, 말top:Math.round(mr.top)}
  })
  console.log(`\n【${이름}】 말풍선 top=${r.말top}`)
  console.log('  img =', r.img ? JSON.stringify(r.img) : '없음')
  for (const x of r.것들) console.log('   ', JSON.stringify(x))
}
await b.close(); srv.close()
