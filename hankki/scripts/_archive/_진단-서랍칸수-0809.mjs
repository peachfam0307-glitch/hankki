import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4396,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
// 🔢 「몇 칸이 실제로 보이나」 = 서랍 굴릴 칸 «안»에 들어오는 스티커 칸을 센다. 이게 창업자가 보는 숫자다.
const 센다=()=>{const dr=document.querySelector('.decor-scroll');if(!dr)return null;const r=dr.getBoundingClientRect();let 보임=0,크기=0,열=0;const g=dr.querySelector('.decor-grid');if(g){열=getComputedStyle(g).gridTemplateColumns.split(' ').length;const c=g.querySelector('.decor-cell');if(c)크기=Math.round(c.getBoundingClientRect().width)}
for(const c of dr.querySelectorAll('.decor-cell')){const q=c.getBoundingClientRect();if(q.top>=r.top-1&&q.bottom<=r.bottom+1)보임++}
return{서랍폭:Math.round(document.querySelector('.decor-drawer').getBoundingClientRect().width),굴릴칸:Math.round(r.height),칸크기:크기,열:열,보이는칸:보임}}
for(const [n,w,h] of [['크롬눕힘',891,322],['앱눕힘',891,411],['폰눕힘',780,360]]){
  const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
  await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
  await page.goto('http://127.0.0.1:4396/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
  await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
  await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
  await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
  const t=page.getByRole('button',{name:'일꾸',exact:true}).last()
  if(await t.count().catch(()=>0)){await t.click().catch(()=>{});await page.waitForTimeout(600)}
  console.log(`▣ ${n} 안 골랐을 때`,JSON.stringify(await page.evaluate(센다)))
  const c=page.locator('.decor-drawer img').first()
  if(await c.count().catch(()=>0)){await c.click().catch(()=>{});await page.waitForTimeout(800)}
  console.log(`▣ ${n} 골랐을 때  `,JSON.stringify(await page.evaluate(센다)))
  await page.close()
}
await b.close();srv.close()
