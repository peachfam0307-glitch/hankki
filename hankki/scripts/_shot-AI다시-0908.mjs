// 📸 시안 — ①AI 다듬기 실패 줄(상세) ②AI 다듬는 중 ③열쇠 선물 줄 ④인스타 랜딩
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-AI다시-0908.mjs
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { COACH } from '../src/coach.js'
import { THEME_KEY } from '../src/theme.js'
const OUT = process.env.OUT || '/tmp/shot-ai다시-0908'
mkdirSync(OUT, { recursive: true })
const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.startsWith('/hankki/'))p=p.slice(7);const f=join(ROOT,p==='/'?'index.html':p);try{statSync(f);s.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});s.end(readFileSync(f))}catch{s.writeHead(404);s.end('x')}})
await new Promise(r=>srv.listen(0,r)); const PORT=srv.address().port
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 원문 = '무화과 부라타 잠봉 샐러드 2인분\n\n재료\n무화과 3개\n부라타치즈 1개\n잠봉 4장\n루꼴라 한 줌\n\n만드는 법\n1. 무화과를 4등분해요\n2. 접시에 담아요\n3. 올리브유를 둘러요'

async function 새창(심기) {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true })
  await ctx.route('**/*.googleapis.com/**', r=>r.abort()); await ctx.route('**/*.gstatic.com/**', r=>r.abort())
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => console.log('⛔pageerror:', String(e && e.message).slice(0, 300)))
  pg.on('console', (m) => { if (m.type() === 'error') console.log('⛔console:', m.text().slice(0, 300)) })
  await pg.addInitScript(ks=>{ks.forEach(k=>localStorage.setItem(k,'1'))}, Object.values(COACH))
  await pg.addInitScript(([k,t,심을것])=>{
    localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1'); localStorage.setItem(k,t)
    for (const [키,값] of Object.entries(심을것.저장 || {})) localStorage.setItem(키, 값)
    if (심을것.탭) sessionStorage.setItem('hankki:tab', 심을것.탭)
  }, [THEME_KEY,'greige',심기])
  return { ctx, pg }
}

// ① 실패 줄 — 상세 화면 (tidyFail: 2)
{
  const 창고 = { recipes:[{ id:'u1', title:'무화과 부라타 잠봉 샐러드', status:'sorted', tidyFail:2, rawText:원문,
    // ⛔ 재료는 «글자 배열»이다 — 객체로 넣으면 `Q.trim is not a function` 으로 화면이 죽는다(2026-09-08 확인)
    ingredients:['무화과 3개','부라타치즈 1개','잠봉 4장','루꼴라 한 줌'],
    steps:['무화과를 4등분해요','접시에 담아요'] }],
    folders:[], profile:{name:'한끼러버',bio:''}, shops:[], wishlist:[], shoppingList:[], pantry:[], diary:[], seedV:999, memoCleanV:9, removedSeedIds:[] }
  const { ctx, pg } = await 새창({ 저장:{ 'hankki:v1': JSON.stringify(창고) }, 탭:'myrecipes' })
  await pg.goto(`http://localhost:${PORT}/hankki/`,{waitUntil:'networkidle'}); await pg.waitForTimeout(1200)
  await pg.getByText('무화과 부라타 잠봉 샐러드').first().click(); await pg.waitForTimeout(1200)
  console.log('화면글자=', (await pg.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' | '))
  const 줄 = pg.getByText('AI 다듬기가 안 됐어요', { exact: false }).first()
  await 줄.scrollIntoViewIfNeeded(); await pg.waitForTimeout(300)
  const bb = await 줄.boundingBox()
  await pg.screenshot({ path: join(OUT,'①상세-AI다시하기.png'), clip:{ x:0, y:Math.max(0,bb.y-20), width:390, height:bb.height+40 } })
  console.log('📸 ① ', (await 줄.innerText()).replace(/\n/g,' / '))
  await ctx.close()
}
// ② 열쇠 선물 줄 — 「지금 10개 · 20개 더」를 지운 뒤(첫 화면 CloudGate)
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true })
  await ctx.route('**/*.googleapis.com/**', r=>r.abort()); await ctx.route('**/*.gstatic.com/**', r=>r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript(([k,t])=>{ localStorage.setItem(k,t) }, [THEME_KEY,'greige'])  // ⛔ onboarded 를 «안» 심는다 = 새로 깐 사람
  await pg.goto(`http://localhost:${PORT}/hankki/`,{waitUntil:'networkidle'}); await pg.waitForTimeout(1600)
  const 칸 = pg.locator('.cg-gift').first()
  await 칸.scrollIntoViewIfNeeded(); await pg.waitForTimeout(300)
  const bb = await 칸.boundingBox()
  await pg.screenshot({ path: join(OUT,'②첫화면-열쇠선물.png'), clip:{ x:Math.max(0,bb.x-12), y:Math.max(0,bb.y-12), width:Math.min(390,bb.width+24), height:bb.height+24 } })
  console.log('📸 ② ', (await 칸.innerText()).replace(/\n/g,' / '))
  await ctx.close()
}

// ③ 인스타 랜딩 — 「앱 없이 웹으로 먼저 볼래요」를 지운 뒤
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true })
  await ctx.route('**play.google.com/**', r=>r.abort())   // ⛔ 스토어로 튕기지 않게(이 판은 «화면»만 본다)
  const pg = await ctx.newPage()
  await pg.goto(`http://localhost:${PORT}/hankki/get.html`,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(800)
  const 칸 = pg.locator('.box').first()
  const bb = await 칸.boundingBox()
  await pg.screenshot({ path: join(OUT,'③인스타랜딩.png'), clip:{ x:Math.max(0,bb.x-10), y:Math.max(0,bb.y-10), width:Math.min(390,bb.width+20), height:bb.height+20 } })
  console.log('📸 ③ ', (await 칸.innerText()).replace(/\n/g,' / '))
  await ctx.close()
}

await b.close(); srv.close()
