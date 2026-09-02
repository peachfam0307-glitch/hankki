// 📏 「패드버전이 너무 다 길어」 — 탭마다 «스크롤 길이»를 재서 어디가 긴지 찾는다 (2026-08-26)
// ⭐ 재는 것 = 화면 높이 대비 «몇 배»를 밀어야 끝인가. 폰과 나란히 놓아야 「길다」가 갈린다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4396,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const 탭 = ['홈','레시피','일기','장보기','레꾸자랑']
for (const [이름,W,H] of [['폰   411×914',411,914],['패드 834×1194',834,1194]]) {
  const page=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1})
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  await page.goto('http://127.0.0.1:4396/hankki/',{waitUntil:'networkidle'})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(800)
  const 줄=[]
  for (const t of 탭) {
    if (t!=='홈') {
      const nav=page.locator('.bottom-nav .nav-item').filter({hasText:t}).first()
      if (await nav.count()) { await nav.click(); await page.waitForTimeout(1100) }
    }
    const v=await page.evaluate(()=>{
      const s=document.querySelector('.screen')||document.body
      return { 속: Math.round(s.scrollHeight), 창: Math.round(s.clientHeight) }
    })
    줄.push(`${t} ${(v.속/v.창).toFixed(2)}쪽(${v.속}px)`)
  }
  console.log(`${이름} · ${줄.join(' · ')}`)
  await page.close()
}
await b.close();srv.close()
