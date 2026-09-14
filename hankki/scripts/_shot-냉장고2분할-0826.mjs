// 🧊 패드 냉장고 2분할 확인 — ⛔재료를 «UI로» 채워야 진짜 화면이 된다 (빈 냉장고는 안내문뿐)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
mkdirSync(OUT,{recursive:true})
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4400,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
for (const [이름,W,H] of [['폰',411,914],['패드세로',834,1194],['패드가로',1194,834]]) {
  const page=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  await page.goto('http://127.0.0.1:4400/hankki/',{waitUntil:'networkidle'})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(800)
  await page.locator('.bottom-nav .nav-item').filter({hasText:'장보기'}).first().click()
  await page.waitForTimeout(1100)
  await page.locator('[data-coach="pantry"]').first().click()
  await page.waitForTimeout(1000)
  // 재료를 UI 로 넣는다
  for (const 이 of ['돼지고기','김치','두부','대파','달걀','양파']) {
    const 담기=page.getByRole('button',{name:/재료 담기/}).first()
    if(!(await 담기.count())) break
    await 담기.click(); await page.waitForTimeout(600)
    const 칸=page.locator('input[type="text"]:visible, input:not([type]):visible').first()
    if(!(await 칸.count())){await page.keyboard.press('Escape');await page.waitForTimeout(400);continue}
    await 칸.fill(이); await page.waitForTimeout(450)
    let 눌=false
    for(const g of [/^추가$/,/^담기$/,/^저장$/,/넣기/]){const t=page.getByRole('button',{name:g}).last();if(await t.count()){await t.click();눌=true;break}}
    if(!눌) await page.keyboard.press('Enter')
    await page.waitForTimeout(650)
  }
  for(const g of ['닫기','취소']){const t=page.getByRole('button',{name:g}).first();if(await t.count()){await t.click();await page.waitForTimeout(500)}}
  await page.waitForTimeout(900)
  const v=await page.evaluate(()=>{
    const p=document.querySelector('.pantry-pair')
    const 왼=document.querySelector('.pantry-reco'), 오=document.querySelector('.pantry-box')
    const s=document.querySelector('.screen')
    return { 좌우: p?getComputedStyle(p).display==='grid':false,
             왼폭: 왼?Math.round(왼.getBoundingClientRect().width):0,
             오른폭: 오?Math.round(오.getBoundingClientRect().width):0,
             추천장수: document.querySelectorAll('.pantry-reco .grid-card').length,
             재료수: document.querySelectorAll('.exp-chip, .pantry-box .list-item').length,
             길이: s?(s.scrollHeight/s.clientHeight).toFixed(2):'?',
             넘침: Math.round(document.documentElement.scrollWidth-window.innerWidth) }
  })
  console.log(`${이름.padEnd(6)} ${v.좌우?'좌우 2분할':'세로 1열  '} · 왼 ${v.왼폭}/오른 ${v.오른폭}px · 추천 ${v.추천장수}장 · ${v.길이}쪽 · 가로넘침 ${v.넘침}px`)
  await page.screenshot({path:join(OUT,`냉장고-${이름}.png`)})
  await page.close()
}
await b.close();srv.close()
