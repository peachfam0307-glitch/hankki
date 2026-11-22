// 📸 원본 교체한 편의 «레시피 상세» 실제 화면 (👁️ 절대원칙 2026-09-20 · 내보내기 전에 눈으로)
//   새로 깐 폰 그대로 띄워 레시피 탭 → 제목 눌러 상세 → 한 장에 전체
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-원본교체-1122'; mkdirSync(OUT, { recursive: true })
const 제목들 = process.argv.slice(2).length ? process.argv.slice(2) : ['진미채볶음', '야끼우동', '양배추 치즈전']
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise((r)=>srv.listen(0,r)); const BASE=`http://127.0.0.1:${srv.address().port}/hankki/`
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
for (const 제목 of 제목들) {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  const page = await ctx.newPage()
  page.on('pageerror',(e)=>console.log('⚠️ pageerror:',String(e.message).split('\n')[0]))
  await page.goto(BASE,{waitUntil:'networkidle'})
  if (await page.getByText('Google 계정으로 시작하기').count()) { await page.goto(BASE,{waitUntil:'networkidle'}) }
  await page.evaluate(()=>{const bs=[...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')];bs.find((x)=>(x.innerText||'').replace(/\s+/g,'').includes('레시피'))?.click()})
  await page.waitForTimeout(900)
  const 눌림 = await page.evaluate((t)=>{const x=[...document.querySelectorAll('button')].find((x)=>(x.innerText||'').trim().startsWith(t));x?.scrollIntoView();x?.click();return !!x}, 제목)
  await page.waitForTimeout(1300)
  const 글 = await page.evaluate(()=>document.body.innerText||'')
  const 파일 = join(OUT, `${제목.replace(/\s+/g,'')}.png`)
  await page.screenshot({ path: 파일, fullPage: true })
  console.log(`${눌림 ? '✅' : '⛔ 못 찾음'} ${제목} → ${파일} · 출처 줄 = ${(글.match(/(백종원|쿡언니네|엄마의가정식|요리왕비룡)[^\n]{0,20}/)||['없음'])[0]}`)
  await ctx.close()
}
await b.close(); srv.close()
