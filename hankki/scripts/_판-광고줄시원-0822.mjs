// 【⏳ 판정 중 · 2026-08-22】 🔠 「글자가 작다」 — 장보기·광고의 글자 크기를 «재는» 판
//
// 📮 창업자 = *"시원시원하게 보이면 좋겠어. **작으면 잘 안봐져.**"*
//    → *"**내가말한거는 글씨를 키우자는거야.**"* · *"**큐레이션도 글자가 작아.**"*
//    → *"자연드림 우리밀 올리고당 같은 **제목＋설명 글자크기를 늘리자고.**"*
//    → *"이거는 **지금 안처럼두고**, 안내딱지(쿠팡)이런거 **이름옆에다** 하고."*
//    → *"**사러가기는 지금처럼 담기 옆에** 두는게 맞는거 같고"*
//
// ⛔⛔ **내가 통째로 잘못 읽었다.** *"장바구니 2줄도 예쁘게"*·*"줄바꿈 다체크"* 를 «레이아웃» 문제로 읽고
//    줄바꿈 안 아홉 개를 만들었는데, 창업자가 원한 건 **«글자 크기»** 하나였다.
//    📌 규칙 25 — 제보를 받으면 «어디의 무엇인지» 먼저 «물어보고» 시작한다. 안 물었다.
//    ⛔ 그래서 배지 내리기·단추 옮기기 갈래는 **전부 죽었다**(창업자가 「지금 안처럼」이라 못 박음).
//
// 🔢 이 판은 고치지 않는다 — **지금 몇 px 인지 잰다.** 고칠 값은 그 다음에 정한다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-광고줄시원-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4455,r))
const { SEED_COACH_SEEN }=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const 새판=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844}})
  await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  const p=await ctx.newPage(); await p.goto('http://127.0.0.1:4455/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(900); return {ctx,p}}

// ── 🛒 장보기 : 제품 카드 제목·설명·배지 ──
{
  const {ctx,p}=await 새판()
  await p.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find(x=>(x.innerText||'').replace(/\s+/g,'').includes('장보기'))?.click()})
  await p.waitForTimeout(1000)
  const v=await p.evaluate(()=>{
    const 잰다=(el)=>{const c=getComputedStyle(el);return {px:parseFloat(c.fontSize), 굵기:c.fontWeight, 글:(el.innerText||'').replace(/\s+/g,' ').slice(0,22)}}
    // 제품 카드 = 「담기」와 「사러가기」를 둘 다 가진 상자
    const 카드=[...document.querySelectorAll('div')].filter(e=>/담기/.test(e.innerText||'')&&/사러가기/.test(e.innerText||'')&&e.getBoundingClientRect().height>90&&e.getBoundingClientRect().height<400)
    const c=카드[카드.length-1]
    if(!c) return {없음:true}
    const 글자칸=[...c.querySelectorAll('*')].filter(e=>e.children.length===0&&(e.innerText||'').trim())
    return { 제품카드: 글자칸.map(잰다),
      윗글: [...document.querySelectorAll('.t-sub')].slice(0,2).map(잰다),
      제목줄: [...document.querySelectorAll('.sec-head')].slice(0,2).map(잰다) }
  })
  console.log('\n🛒 장보기 — 제품 카드')
  ;(v.제품카드||[]).forEach(x=>console.log(`   ${String(x.px).padStart(5)}px  w${x.굵기}  「${x.글}」`))
  console.log('🛒 장보기 — 윗글(소개·고지)')
  ;(v.윗글||[]).forEach(x=>console.log(`   ${String(x.px).padStart(5)}px  w${x.굵기}  「${x.글}」`))
  console.log('🛒 장보기 — 절 제목')
  ;(v.제목줄||[]).forEach(x=>console.log(`   ${String(x.px).padStart(5)}px  w${x.굵기}  「${x.글}」`))
  await ctx.close()
}
// ── 🍳 레시피 상세 광고 ──
{
  const {ctx,p}=await 새판()
  await p.getByRole('button',{name:/^레시피/}).last().click(); await p.waitForTimeout(800)
  await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click(); await p.waitForTimeout(900)
  await p.mouse.move(195,500); await p.mouse.wheel(0,900); await p.waitForTimeout(600)
  const v=await p.evaluate(()=>{
    const 후=[...document.querySelectorAll('*')].filter(e=>/주부의 장바구니에서 고른 재료/.test(e.innerText||'')&&e.children.length<=4)
    const 상자=후[후.length-1]?.parentElement; if(!상자) return []
    return [...상자.querySelectorAll('*')].filter(e=>e.children.length===0&&(e.innerText||'').trim())
      .map(e=>{const c=getComputedStyle(e);return {px:parseFloat(c.fontSize),굵기:c.fontWeight,글:(e.innerText||'').replace(/\s+/g,' ').slice(0,22)}})
  })
  console.log('\n🍳 레시피 상세 광고')
  v.forEach(x=>console.log(`   ${String(x.px).padStart(5)}px  w${x.굵기}  「${x.글}」`))
  await ctx.close()
}
await b.close(); srv.close()
