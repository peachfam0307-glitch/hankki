// 🔎 창업자 캡처 18:35 — **세로로 들고 있는데 가로 레이아웃이 됐다** (*"오늘의 한줄 쓰면 갑자기 가로모드가 됨"*)
//    가설 = 자판이 뜨면 411×891 → 411×410 이 되어 **폭 > 높이** 라 CSS 가 「가로」로 판정한다.
//    ⛔ 가설로 두지 않고 재서 확인한다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4405,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
let 나쁨=0
const 잰다=()=>{
 const st=document.querySelector('.decor-stage'),dr=document.querySelector('.decor-drawer')
 const sr=st?st.getBoundingClientRect():null, drr=dr?dr.getBoundingClientRect():null
 const w=st&&st.querySelector(':scope > div:not(.t-sub)'),r=w?w.getBoundingClientRect():null
 return{화면:`${window.innerWidth}×${window.innerHeight}`,
  CSS가가로로봄:window.matchMedia('(orientation: landscape)').matches,
  서랍이오른쪽:!!(sr&&drr&&drr.left>sr.right-2),
  종이:r?`${Math.round(r.width)}×${Math.round(r.height)}`:null,
  종이위가잘렸나:r&&sr?Math.round(Math.max(0,sr.top-r.top)):0,
  위로굴릴수있나:st?Math.round(st.scrollTop):0}}
for(const [n,w,h,kb] of [['폰 세로',411,891,410],['폰 가로',891,411,160]]){
 const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
 await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
 await page.goto('http://127.0.0.1:4405/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
 await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
 await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
 await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
 const a=await page.evaluate(잰다)
 await page.setViewportSize({width:w,height:kb});await page.waitForTimeout(700)
 const c=await page.evaluate(잰다)
 const 뒤바뀜 = a.서랍이오른쪽!==c.서랍이오른쪽
 if(n==='폰 세로' && 뒤바뀜) 나쁨++
 console.log(`▣ ${n}`)
 console.log('   자판 전', JSON.stringify(a))
 console.log('   자판 후', JSON.stringify(c), 뒤바뀜?'⛔ 화면 배치가 뒤바뀌었다':'✅ 그대로')
 await page.close()
}
await b.close();srv.close()
console.log(나쁨===0?'\n✅ 세로는 자판이 떠도 세로 배치':'\n⛔⛔ 세로인데 자판 뜨면 «가로 배치»가 된다 — 창업자 캡처 그대로')
