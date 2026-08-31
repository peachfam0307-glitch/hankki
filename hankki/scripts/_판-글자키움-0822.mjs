// 🔠 [2026-08-22] 「글자가 작다」 — 키우기 전/후를 «같은 자리»로 찍는다
// 📮 창업자 = *"내가말한거는 글씨를 키우자는거야"* · *"큐레이션도 글자가 작아"*
//    *"자연드림 우리밀 올리고당 같은 제목＋설명 글자크기를 늘리자고"*
// ⛔ 배치는 «안» 건드린다 — 창업자 = *"지금 안처럼두고, 안내딱지(쿠팡) 이름옆에다"* · *"사러가기는 담기 옆에"*
// 실행: node scripts/_판-글자키움-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4456,r))
const { SEED_COACH_SEEN }=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const 새판=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
  await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  const p=await ctx.newPage(); await p.goto('http://127.0.0.1:4456/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900); return {ctx,p}}
// 🛒 장보기 제품 카드
{ const {ctx,p}=await 새판()
  await p.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find(x=>(x.innerText||'').replace(/\s+/g,'').includes('장보기'))?.click()})
  await p.waitForTimeout(1100)
  const box=await p.evaluate(()=>{const c=[...document.querySelectorAll('div')].find(e=>/담기/.test(e.innerText||'')&&/사러가기/.test(e.innerText||'')&&e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<400)
    const h=[...document.querySelectorAll('.sec-head')].find(e=>/주부의 장바구니/.test(e.innerText||''))
    const a=h.getBoundingClientRect(), bb=c.getBoundingClientRect()
    return {x:8,y:Math.max(0,a.top-6),width:374,height:Math.min(720,bb.bottom-a.top+12)}})
  writeFileSync(join(OUT,'키움-장보기.png'), await p.screenshot({clip:box})); await ctx.close() }
// 🍳 레시피 상세 광고
{ const {ctx,p}=await 새판()
  await p.getByRole('button',{name:/^레시피/}).last().click(); await p.waitForTimeout(800)
  await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click(); await p.waitForTimeout(900)
  await p.mouse.move(195,500); await p.mouse.wheel(0,900); await p.waitForTimeout(600)
  const box=await p.evaluate(()=>{const 후=[...document.querySelectorAll('*')].filter(e=>/주부의 장바구니에서 고른 재료/.test(e.innerText||'')&&e.children.length<=4)
    const r=후[후.length-1].parentElement.getBoundingClientRect()
    return {x:Math.max(0,r.left-6),y:Math.max(0,r.top-6),width:Math.min(378,r.width+12),height:Math.min(460,r.height+12)}})
  writeFileSync(join(OUT,'키움-광고.png'), await p.screenshot({clip:box})); await ctx.close() }
await b.close(); srv.close(); console.log('✅ 찍었다')
