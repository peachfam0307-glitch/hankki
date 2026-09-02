// 🔎 창업자 캡처 18:13 — 스티커 글 상자에 글을 치면 «화면이 확 바뀌고 먹통»
//    ⛔ 큰 글칸을 통째로 뺐다. 이제 «글을 쳐도 화면 구성이 안 바뀌어야» 한다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4404,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
let 나쁨=0
const 잰다=()=>{const st=document.querySelector('.decor-stage'),dr=document.querySelector('.decor-drawer')
 const w=st&&st.querySelector(':scope > div:not(.t-sub)'),r=w?w.getBoundingClientRect():null
 return{종이:r?`${Math.round(r.width)}×${Math.round(r.height)}`:null,서랍:dr?Math.round(dr.getBoundingClientRect().height):0,
  큰글칸:!!document.querySelector('.decor-editor.bigwrite'),
  다썼어요:(()=>{const e=document.querySelector('.decor-donewrite');if(!e)return false;const q=e.getBoundingClientRect();return q.width>1&&q.height>1})(),
  저장보임:(()=>{const t=document.querySelector('.decor-top');if(!t)return false;const q=t.getBoundingClientRect();return q.height>10})()}}
for(const [n,w,h,kb] of [['가로-앱',891,411,160],['가로-크롬',891,322,140],['세로',411,891,440]]){
 const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
 await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
 await page.goto('http://127.0.0.1:4404/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
 await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
 await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
 await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
 await page.getByRole('button',{name:'일꾸',exact:true}).last().click();await page.waitForTimeout(700)
 await page.getByRole('button',{name:'글자',exact:true}).last().click().catch(()=>{});await page.waitForTimeout(700)
 const a=await page.evaluate(잰다)
 await page.locator('.decor-drawer img').first().click();await page.waitForTimeout(1000)   // 글 상자 붙이기
 const ta=page.locator('.decor-stage textarea').last()
 if(await ta.count().catch(()=>0)){await ta.click({force:true});await page.waitForTimeout(700);await page.keyboard.type('제대로 검수해야지')}
 await page.setViewportSize({width:w,height:kb});await page.waitForTimeout(700)             // 자판 뜸
 const c=await page.evaluate(잰다)
 const ok = !c.큰글칸 && !c.다썼어요 && c.저장보임 && c.서랍>0
 if(!ok) 나쁨++
 console.log(`${ok?'✅':'⛔'} ${n} — 스티커 글 상자에 글 치고 자판 뜸`)
 console.log(`     전 ${JSON.stringify(a)}`)
 console.log(`     후 ${JSON.stringify(c)}`)
 await page.screenshot({path:`${OUT}/스티커글-${n}.png`})
 await page.close()
}
await b.close();srv.close()
console.log(나쁨===0?'\n✅✅ 글을 쳐도 화면 구성이 안 바뀐다':`\n⛔⛔ ${나쁨}건`)
process.exit(나쁨===0?0:1)
