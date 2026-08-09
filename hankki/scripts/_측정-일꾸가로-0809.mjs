import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4386,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
for(const [n,w,h] of [['폰눕힘',780,360],['폴드',1104,690],['패드가로',1180,820]]){
  const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
  await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
  await page.goto('http://127.0.0.1:4386/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(1000)
  await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(700)
  await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1200)
  await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1100)
  const t=page.getByRole('button',{name:'일꾸',exact:true}).last()
  if(await t.count().catch(()=>0)){await t.click().catch(()=>{});await page.waitForTimeout(700)}
  const m=await page.evaluate(()=>{const d=document.querySelector('.decor-drawer'),st=document.querySelector('.decor-stage');const p=st?st.querySelector(':scope > div'):null;const paper=document.querySelector('.paper');const cs=st?getComputedStyle(st):null;console.log('CHAIN',JSON.stringify({stage:st?Math.round(st.getBoundingClientRect().width)+'x'+Math.round(st.getBoundingClientRect().height):null,stageMaxH:cs?cs.maxHeight:null,wrap:p?Math.round(p.getBoundingClientRect().width)+'x'+Math.round(p.getBoundingClientRect().height):null,wrapMaxW:p?getComputedStyle(p).maxWidth:null,paper:paper?Math.round(paper.getBoundingClientRect().width)+'x'+Math.round(paper.getBoundingClientRect().height):null}))
    const r=e=>e?e.getBoundingClientRect():null;const dr=r(d),pr=r(p)
    return{종이:pr?`${Math.round(pr.width)}×${Math.round(pr.height)}`:null,서랍:dr?Math.round(dr.height):null,
      서랍이오른쪽:dr&&pr?dr.left>pr.right-1:null,넘침:dr?Math.max(0,Math.round(dr.bottom-window.innerHeight)):null,
      안내:(document.body.innerText.match(/(아래|오른쪽)에서 골라/)||[])[0]||'(일꾸 안내문 따로)'}})
  console.log(`${n.padEnd(6)} (${w}×${h})`, JSON.stringify(m))
  await page.screenshot({path:`/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/일꾸가로-${n}.png`})
  await page.close()
}
await b.close();srv.close()
