// 🔎 창업자 *"스티커 붙이면 속지 쪼그라들어서 안보이는것"* (2026-08-09) — 진짜 그런지 «잰다».
//    ⛔ 「고쳤다」고 말하기 전에 창업자 화면(앱 891×411 · 크롬 891×322)에서 실제로 확인한다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4398,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const 잰다=()=>{const st=document.querySelector('.decor-stage');const w=st&&st.querySelector(':scope > div:not(.t-sub)');const r=w?w.getBoundingClientRect():null;const t=document.querySelector('.decor-tools')
return{종이:r?`${Math.round(r.width)}×${Math.round(r.height)}`:null,종이칸높이:st?Math.round(st.getBoundingClientRect().height):null,도구바:t?Math.round(t.getBoundingClientRect().height):0}}
for(const [n,w,h] of [['앱눕힘',891,411],['크롬눕힘',891,322]]){
  const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
  await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
  await page.goto('http://127.0.0.1:4398/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
  await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
  await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
  await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
  const t=page.getByRole('button',{name:'일꾸',exact:true}).last()
  if(await t.count().catch(()=>0)){await t.click().catch(()=>{});await page.waitForTimeout(600)}
  const 전=await page.evaluate(잰다)
  const c=page.locator('.decor-drawer img').first()
  if(await c.count().catch(()=>0)){await c.click().catch(()=>{});await page.waitForTimeout(900)}
  const 후=await page.evaluate(잰다)
  console.log(`▣ ${n} (${w}×${h})`)
  console.log('   붙이기 전', JSON.stringify(전))
  console.log('   붙인 뒤  ', JSON.stringify(후), 전.종이===후.종이?'✅ 종이 그대로':'⛔ 종이가 줄었다')
  await page.close()
}
await b.close();srv.close()
