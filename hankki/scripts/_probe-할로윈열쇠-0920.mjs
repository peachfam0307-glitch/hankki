// 🔑🎃 할로윈 접시 열쇠 — 서랍까지 들어가서 «진짜로» 보이나/안 보이나 잰다 (2026-09-20)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4581,r))
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})

async function 서랍까지(ctx, 주소){
  const p=await ctx.newPage()
  await p.goto(주소,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2200)
  for(let i=0;i<12;i++){const 것=p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first();if(await 것.count()===0||!(await 것.isVisible().catch(()=>false)))break;try{await 것.click({timeout:1500});await p.waitForTimeout(350)}catch{break}}
  // 레시피 → 아무 편 → 「레시피 꾸미기」
  // ⭐ 이 길은 _shot-무료배분검수-0902.mjs 가 쓰는 길 그대로다(레시피 → .grid-card → 「레시피 꾸미기」)
  await p.getByText('레시피', { exact: true }).last().click().catch(()=>{}); await p.waitForTimeout(1200)
  await p.locator('.grid-card').first().click().catch(()=>{}); await p.waitForTimeout(1400)
  await p.getByText('레시피 꾸미기').first().click().catch(()=>{}); await p.waitForTimeout(2200)
  await p.getByText('프레임', { exact: true }).first().click().catch(()=>{}); await p.waitForTimeout(900)
  return p
}
async function 잰다(ctx, 주소){
  const p=await 서랍까지(ctx,주소)
  const 값=await p.evaluate(()=>{try{return localStorage.getItem('hankki:열쇠:할로윈')}catch{return 'ERR'}})
  const 열림=await p.locator('.decor-sec').count()
  const 보이나=await p.locator('text=할로윈 접시').count()
  await p.close(); return {서랍: 열림>0?'O':'X(못 열었다)', 값, 보이나}
}
const c=await b.newContext({viewport:{width:390,height:844},locale:'ko-KR'})
const base='http://localhost:4581/hankki/'
console.log('① 그냥        →', JSON.stringify(await 잰다(c, base)))
console.log('② ?할로윈=1   →', JSON.stringify(await 잰다(c, base+'?할로윈=1')))
console.log('③ 다시 그냥   →', JSON.stringify(await 잰다(c, base)))
console.log('④ ?할로윈=0   →', JSON.stringify(await 잰다(c, base+'?할로윈=0')))
await b.close(); srv.close()
