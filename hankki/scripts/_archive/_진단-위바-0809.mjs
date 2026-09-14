// 🔎 창업자 캡처 18:10 — 가로에서 «취소·저장·확대»가 안 보인다 · *"종이 확대는 아직안돼"*
//    ⛔ 저장을 못 누르면 치명적이다. 위바가 어디 있는지 픽셀로 잰다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4403,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
const 잰다=()=>{
 const q=(s)=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e)
  return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),보임:cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0}}
 // 🖐 그 자리를 실제로 «누르면 무엇이 잡히나» — 겹쳐서 가려졌는지 이걸로만 알 수 있다
 const 누르면=(s)=>{const e=document.querySelector(s);if(!e)return'없음';const r=e.getBoundingClientRect()
  const t=document.elementFromPoint(Math.round(r.x+r.width/2),Math.round(r.y+r.height/2));return t?(t.textContent||t.tagName).trim().slice(0,14):'없음'}
 return{위바:q('.decor-top'),취소:q('.decor-top button'),저장:q('.decor-top .press:last-child'),확대칸:q('.decor-zoom'),
  확대버튼:q('.decor-zoom button'),취소를누르면:누르면('.decor-top button'),확대를누르면:누르면('.decor-zoom button')}}
for(const [n,w,h] of [['가로-앱',891,411],['가로-크롬',891,322],['세로',411,891]]){
 const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
 await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
 await page.goto('http://127.0.0.1:4403/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
 await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
 await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
 await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
 console.log(`\n▣ ${n} — 그냥 열었을 때`); console.log('  ',JSON.stringify(await page.evaluate(잰다)))
 await page.getByRole('button',{name:'일꾸',exact:true}).last().click();await page.waitForTimeout(700)
 await page.locator('.decor-drawer img').first().click();await page.waitForTimeout(900)
 console.log(`▣ ${n} — 스티커 붙여 «고른» 상태 (창업자 화면)`); console.log('  ',JSON.stringify(await page.evaluate(잰다)))
 await page.screenshot({path:`${OUT}/위바-${n}.png`})
 await page.close()
}
await b.close();srv.close()
