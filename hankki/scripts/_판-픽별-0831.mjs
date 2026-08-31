// ⭐ 「이번 주 픽」 칩에 별을 얹어 본다 — 창업자 2026-08-31
//    📮 *"픽 위에 별이나 뭐 ... 서랍에서 딱 보이게."* · *"너무 작아"*
//    ⛔ 소스를 안 고친다 — 앱을 띄우고 DOM 에 얹어서 찍는다(절대원칙 30 · v11.30 열쇠판과 같은 방식)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽별'
mkdirSync(OUT,{recursive:true})
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
  let b,t=M[extname(p)]||'application/octet-stream'
  try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}
  s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4492,r))
const {SEED_COACH_SEEN}=await import('/home/user/hankki/hankki/src/coach.js')
// dist 안의 별 그림 주소를 찾는다(빌드하면 이름에 해시가 붙는다)
const { readdirSync } = await import('node:fs')
const assets = readdirSync(join(DIST,'assets'))
const 별주소 = (키) => { const f = assets.find(x=>x.startsWith(키+'-')||x.startsWith(키+'.')); return f?`/hankki/assets/${f}`:null }
const 후보=[['dn_star','얼굴 있는 별'],['dn_sparkle','반짝이'],['ta_star','크림 별']]
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
for (const [키,이름] of 후보) {
  const url=별주소(키)
  if(!url){ console.log(`⛔ ${키} 를 dist 에서 못 찾았다`); continue }
  const ctx=await b.newContext({viewport:{width:411,height:891},deviceScaleFactor:3,timezoneId:'Asia/Seoul'})
  await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
  await ctx.addInitScript({content:SEED_COACH_SEEN})
  const pg=await ctx.newPage()
  await pg.goto('http://127.0.0.1:4492/hankki/',{waitUntil:'networkidle'});await pg.waitForTimeout(1200)
  {const a=pg.getByRole('button',{name:'나중에'}).first();if(await a.count()&&await a.isVisible().catch(()=>false))await a.click().catch(()=>{});await pg.waitForTimeout(400)}
  await pg.getByRole('button',{name:/^장보기/}).last().click();await pg.waitForTimeout(1400)
  // 「이번 주 픽」 칩을 찾아 별을 얹는다
  const 얹음 = await pg.evaluate(`(() => {
    const chips=[...document.querySelectorAll('.cur-chips button, .cur-chips .chip, .cur-chips *')]
      .filter(e=>e.textContent.trim()==='이번 주 픽' && e.children.length===0)
    const c = chips[0] && (chips[0].closest('button') || chips[0])
    if(!c) return false
    // ⛔ .hscroll 이 overflow-x:auto 라 «위로 삐져나간 것이 잘린다».
    //    → 줄에 위 여백을 주고 margin 을 그만큼 줄인다(자리는 그대로, 별만 보인다).
    const row = c.closest('.cur-chips')
    if (row) { row.style.paddingTop='20px'; row.style.marginTop='0px' }
    c.style.position='relative'; c.style.overflow='visible'
    const img=document.createElement('img')
    img.src=${JSON.stringify(url)}
    img.style.cssText='position:absolute;left:50%;top:-16px;transform:translateX(-50%) rotate(-12deg);width:34px;height:34px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.18));z-index:5'
    c.appendChild(img)
    c.scrollIntoView({block:'center'})
    return true
  })()`)
  if(!얹음){ console.log('⛔ 「이번 주 픽」 칩을 못 찾았다'); await ctx.close(); continue }
  await pg.waitForTimeout(500)
  const box=await pg.locator('.cur-chips').first().boundingBox()
  await pg.screenshot({path:join(OUT,`${키}.png`),clip:{x:0,y:Math.max(0,box.y-34),width:411,height:110}})
  console.log(`✅ ${키} (${이름})`)
  await ctx.close()
}
console.log('📁',OUT)
await b.close();srv.close();process.exit(0)
