import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4401,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
await page.goto('http://127.0.0.1:4401/hankki/',{waitUntil:'networkidle'})
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(800)
await page.locator('.bottom-nav .nav-item').filter({hasText:'장보기'}).first().click()
await page.waitForTimeout(1400)
const 안= '<b style="color:var(--brown);white-space:nowrap">제휴 수수료를 받아도</b> 값은 그대로예요'
const 표= '한끼는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
const 시안={
 'ㄱ 지금 판 (두 줄 + 작은 문구)': [안, 표],
 'ㄴ 한 덩어리로 작게': ['<b style="color:var(--brown);white-space:nowrap">제휴 수수료를 받아도</b> 값은 그대로예요 · '+표, null],
 'ㄷ 표준 문구가 주인공': ['<b style="color:var(--brown)">쿠팡 파트너스 활동</b>의 일환으로 일정액의 수수료를 받아요 · <b style="color:var(--brown);white-space:nowrap">값은 그대로</b>예요', null],
 'ㄹ 안심 한 줄 + 표준은 아주 작게': [안, 표],
}
let i=0
for(const [이름,[a,c]] of Object.entries(시안)){
  i++
  await page.goto('http://127.0.0.1:4401/hankki/',{waitUntil:'networkidle'})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(700)
  await page.locator('.bottom-nav .nav-item').filter({hasText:'장보기'}).first().click()
  await page.waitForTimeout(1300)
  await page.evaluate(([a,c,이름])=>{
    const subs=[...document.querySelectorAll('.t-sub')]
    const 안줄=subs.find(e=>e.textContent.includes('제휴 수수료')||e.textContent.includes('파트너스 활동'))
    const 표줄=subs.find(e=>e.textContent.includes('일정액의 수수료를 제공'))
    if(!안줄) throw new Error('못찾음: '+subs.map(e=>e.textContent.slice(0,16)).join(' | '))
    if(표줄) 표줄.remove()
    안줄.innerHTML=a
    안줄.style.fontSize= 이름.startsWith('ㄴ')?'13px': '15px'
    안줄.style.opacity = 이름.startsWith('ㄴ')?'0.8':'1'
    if(c){ const d=document.createElement('div'); d.className='t-sub'; d.textContent=c
      d.style.cssText= 이름.startsWith('ㄹ') ? 'font-size:11.5px;margin-top:-4px;margin-bottom:12px;line-height:1.35;opacity:0.6'
        : 'font-size:13px;margin-top:-6px;margin-bottom:12px;line-height:1.4;opacity:0.75'
      안줄.after(d) }
  },[a,c,이름])
  await page.waitForTimeout(350)
  await page.screenshot({ path:`/tmp/v${i}.png`, clip:{x:0,y:190,width:390,height:150} })
  console.log(' ✅',이름)
}
await b.close(); srv.close()
