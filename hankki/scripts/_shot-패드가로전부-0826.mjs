// 🖥 패드 «가로»(1194×834) 전부 — 창업자 = *"패드는 기본이 가로모드아냐?"*
// ⛔ 그동안 내가 «세로»(834×1194)만 보여줬다. 가로가 실제로 더 많이 쓰는 방향이다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드가로'
mkdirSync(OUT,{recursive:true})
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4401,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const page=await b.newPage({viewport:{width:1194,height:834},deviceScaleFactor:2})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
await page.goto('http://127.0.0.1:4401/hankki/',{waitUntil:'networkidle'})
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
const 재기=async(이름)=>{
  const v=await page.evaluate(()=>{
    const s=document.querySelector('.screen')
    return { 쪽:(s.scrollHeight/s.clientHeight).toFixed(2), 넘침:Math.round(document.documentElement.scrollWidth-window.innerWidth) }
  })
  await page.screenshot({path:join(OUT,`${이름}.png`)})
  console.log(`${이름.padEnd(8)} ${v.쪽}쪽 · 가로넘침 ${v.넘침}px`)
}
await 재기('1홈')
for (const t of ['레시피','일기','장보기','레꾸자랑']) {
  await page.locator('.bottom-nav .nav-item').filter({hasText:t}).first().click()
  await page.waitForTimeout(1200)
  await 재기(`${['레시피','일기','장보기','레꾸자랑'].indexOf(t)+2}${t}`)
}
// 냉장고도
await page.locator('.bottom-nav .nav-item').filter({hasText:'장보기'}).first().click()
await page.waitForTimeout(1000)
await page.locator('[data-coach="pantry"]').first().click()
await page.waitForTimeout(900)
for (const 이 of ['돼지고기','김치','두부','대파']) {
  const 담기=page.getByRole('button',{name:/재료 담기/}).first()
  if(!(await 담기.count())) break
  await 담기.click(); await page.waitForTimeout(550)
  const 칸=page.locator('input[type="text"]:visible, input:not([type]):visible').first()
  if(!(await 칸.count())){await page.keyboard.press('Escape');await page.waitForTimeout(350);continue}
  await 칸.fill(이); await page.waitForTimeout(400)
  let 눌=false
  for(const g of [/^추가$/,/^담기$/,/^저장$/,/넣기/]){const t=page.getByRole('button',{name:g}).last();if(await t.count()){await t.click();눌=true;break}}
  if(!눌) await page.keyboard.press('Enter'); await page.waitForTimeout(600)
}
for(const g of ['닫기','취소']){const t=page.getByRole('button',{name:g}).first();if(await t.count()){await t.click();await page.waitForTimeout(450)}}
await page.waitForTimeout(800)
await 재기('6냉장고')
await b.close();srv.close()
console.log(`\n🖼 ${OUT}`)
