import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const OUT='/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/sns검수'; mkdirSync(OUT,{recursive:true})
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p===''||p==='/')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4521,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})
const ctx=await b.newContext({viewport:{width:412,height:2600},deviceScaleFactor:2,locale:'ko-KR'})
await ctx.addInitScript(()=>{const 고정=Date.UTC(2027,2,4,3);const R=Date;function F(...a){return a.length?new R(...a):new R(고정)}F.prototype=R.prototype;F.now=()=>고정;F.parse=R.parse;F.UTC=R.UTC;Object.setPrototypeOf(F,R);window.Date=F})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki:nudge:cloudgate','1')}catch{}})
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4521/hankki/',{waitUntil:'networkidle'});await p.waitForTimeout(2500)
for(const g of ['나중에 볼게요','확인','닫기','건너뛰기']){const t=p.getByRole('button',{name:g}).first();if(await t.count())await t.click({timeout:1500}).catch(()=>{})}
const titles=process.argv.slice(2)
let i=0
for(const t of titles){i++
  await p.goto('http://127.0.0.1:4521/hankki/',{waitUntil:'networkidle'});await p.waitForTimeout(1500)
  for(let k=0;k<6;k++){const f=await p.evaluate(()=>{const f=[...document.querySelectorAll('div')].find(d=>getComputedStyle(d).position==='fixed'&&+getComputedStyle(d).zIndex>=400);if(!f)return 0;const bt=[...f.querySelectorAll('button')].pop();(bt||f).click();return 1});if(!f)break;await p.waitForTimeout(400)}
  await p.getByLabel('검색').first().click().catch(e=>console.log('검색X',e.message.slice(0,60)));await p.waitForTimeout(700)
  await p.getByPlaceholder('검색어를 입력하세요').fill(t);await p.waitForTimeout(1200)
  const hit=p.getByText(t,{exact:true}).first()
  if(!(await hit.count())){console.log('못찾음',t);continue}
  await hit.click();await p.waitForTimeout(1500)
  await p.screenshot({path:`${OUT}/${String(i).padStart(2,'0')}-${t}.png`,fullPage:true})
  console.log('찍음',t)
}
await b.close();srv.close()
