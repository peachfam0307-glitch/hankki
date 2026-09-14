// 📸 시안 — 「레시피 상세에서 유튜브 영상 바로 보기」 (창업자 2026-09-03)
//   📮 창업자 = *"1은 어떤식으로 우리앱에서 가능한지 시안줄수있어?
//      유튜브영상아래 재료랑 만드는법도 넣을 수 있어?"*
//   ⭐ 흉내가 아니라 **진짜 앱**을 띄워 찍는다(절대원칙 30).
//   ⛔ 기본 레시피 중 유튜브 sourceUrl 을 가진 편이 «0편»이라(실측) 하나 심어서 찍는다.
//   ⚠️ 헤드리스는 유튜브를 못 연다(프록시 차단) → 플레이어 «자리»는 빈 칸으로 나온다.
//      그래도 **자리·크기·순서**는 진짜다 — 그게 이 시안이 답하려는 것이다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-영상-0903'; mkdirSync(OUT, { recursive: true })
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise((r)=>srv.listen(0,r)); const BASE=`http://127.0.0.1:${srv.address().port}/hankki/`
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 📏 한 화면에 «순서»를 다 담는다 — 창업자가 물은 건 「영상 아래 재료·만드는법이 오나」다.
//    ⛔ 굴려서 세 장으로 나누면 순서가 오히려 안 보인다(첫 판이 그랬다).
const 높이 = Number(process.env.H || 2200)
const ctx = await b.newContext({ viewport:{width:390,height:높이}, deviceScaleFactor:2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
// 🎬 유튜브 주소를 가진 레시피를 «앱이 쓰는 그 모양»으로 심는다
await ctx.addInitScript(()=>{try{
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  s.recipes = [{
    id:'yt-demo', title:'감자채전', icon:'fe_38', category:'한식', folder:'한식',
    time:5, servings:2, difficulty:'쉬움', thumb:'icon', favorite:false, cooked:0,
    savedAt:Date.now(), status:'sorted',
    sourceUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ingredients:['감자 큰 것 2~3개','모짜렐라 치즈 1~2줌','체다치즈 1~2줌','[양념]','소금 적당량','후추 적당량','감자전분 듬뿍 1스푼'],
    steps:['팬 위에 감자를 채 썰어요.','나머지 재료를 모두 올린 뒤 골고루 섞어 동그란 모양을 잡아요.','올리브유를 두르고 앞뒤로 노릇하게 부쳐 완성해요.'],
    memo:'', decor:[], decorBg:'none',
  }, ...(s.recipes||[])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}catch{}})
const page = await ctx.newPage()
page.on('pageerror',(e)=>console.log('⚠️ pageerror:',String(e.message).split('\n')[0]))
await page.goto(BASE,{waitUntil:'networkidle'})
// 레시피 탭 → 감자채전
await page.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find((x)=>(x.innerText||'').replace(/\s+/g,'').includes('레시피'))?.click()})
await page.waitForTimeout(800)
await page.evaluate(()=>{[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().startsWith('감자채전'))?.click()})
await page.waitForTimeout(1200)
const 있나 = await page.evaluate(()=>({
  영상절: /영상으로 보기/.test(document.body.innerText||''),
  iframe: !!document.querySelector('iframe[title="원본 영상"]'),
  순서: [...document.querySelectorAll('.sec-head, .h-section')].map(x=>(x.innerText||'').trim()).filter(Boolean),
}))
console.log('영상 절 =', 있나.영상절, '· iframe =', 있나.iframe)
console.log('절 순서 =', 있나.순서.join(' → '))
await page.screenshot({ path: join(OUT,'1-상세-위.png') })
// ⛔ `window.scrollBy` 는 안 먹는다 — 앱은 «안쪽 칸»이 굴러간다(`.screen`).
//    첫 판이 그걸 몰라 컷 셋이 전부 «같은 화면»으로 나왔다(절대원칙 21 이 잡았다).
const 굴리기 = async (px) => {
  await page.evaluate((n) => {
    const el = [...document.querySelectorAll('*')].find((x) => x.scrollHeight > x.clientHeight + 40 && getComputedStyle(x).overflowY !== 'visible')
    if (el) el.scrollTop += n; else window.scrollBy(0, n)
  }, px)
  await page.waitForTimeout(500)
}
await page.screenshot({ path: join(OUT,'2-한장에-전체.png'), fullPage: true })
console.log('📁', OUT)
await b.close(); srv.close()
