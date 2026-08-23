// 🔎 창업자 제보 2026-08-09 17:45~17:46
//    ⑴ 가로 — 스티커 붙인 «직후» 글자 쓰려 하면 «먹통 · 스크롤 안 됨»
//    ⑵ 세로 — 「원래모드 속지 넘 작음」 · 「다 썼어요는 왜 저기 떠 있는지 모르겠다」
//    ⛔ 추측 금지 — 스크롤이 «실제로» 굴러가는지 픽셀로 재고, 세로 종이 크기도 잰다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4400,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const 잰다=()=>{const ed=document.querySelector('.decor-editor'),st=document.querySelector('.decor-stage')
const w=st&&st.querySelector(':scope > div:not(.t-sub)'),r=w?w.getBoundingClientRect():null
const 보임=(s)=>{const e=document.querySelector(s);if(!e)return false;const q=e.getBoundingClientRect();return q.width>1&&q.height>1}
return{큰글칸:!!(ed&&ed.classList.contains('bigwrite')),종이:r?`${Math.round(r.width)}×${Math.round(r.height)}`:null,
 칸높이:st?Math.round(st.clientHeight):null,굴릴양:st?Math.round(st.scrollHeight-st.clientHeight):null,굴린위치:st?Math.round(st.scrollTop):null,
 서랍보임:보임('.decor-drawer'),다썼어요:보임('.decor-donewrite')}}
const 시드=(s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}}
const 값={recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION}
async function 열기(page){await page.goto('http://127.0.0.1:4400/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
 await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
 await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
 await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)}

// ── ⑴ 가로 · 스티커 글 상자 ─────────────────────────
{
 const page=await b.newPage({viewport:{width:891,height:411},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
 await page.addInitScript(시드,값); await 열기(page)
 const 글자=page.getByRole('button',{name:'글자',exact:true}).last()
 if(await 글자.count().catch(()=>0)){await 글자.click().catch(()=>{});await page.waitForTimeout(700)}
 const 컷=page.locator('.decor-drawer img').first()
 if(await 컷.count().catch(()=>0)){await 컷.click().catch(()=>{});await page.waitForTimeout(1000)}
 // ✍️ 붙인 글 상자에 «커서를 넣는다» — 창업자 화면은 자판이 떠 있었으니 커서가 있는 상태다
 const ta2=page.locator('.decor-stage textarea').last()
 if(await ta2.count().catch(()=>0)){await ta2.click({force:true});await page.waitForTimeout(800)}
 await page.setViewportSize({width:891,height:160});await page.waitForTimeout(700)
 console.log('⑴ 가로·스티커 글 · 자판 뜸 ', JSON.stringify(await page.evaluate(잰다)))
 // 🖐 손가락으로 굴려 본다 — 종이 «한가운데»에서(스티커를 안 잡게 왼쪽 끝 근처)
 await page.mouse.move(160,120); await page.mouse.wheel(0,200); await page.waitForTimeout(500)
 const a=await page.evaluate(잰다)
 console.log('   휠로 굴린 뒤            ', JSON.stringify(a), a.굴린위치>0?'✅ 굴러간다':'⛔ 안 굴러간다')
 await page.setViewportSize({width:891,height:411});await page.waitForTimeout(400)
 const d=page.getByRole('button',{name:'다 썼어요'})
 if(await d.count().catch(()=>0)){await d.click().catch(()=>{});await page.waitForTimeout(700)}
 console.log('   「다 썼어요」 누른 뒤    ', JSON.stringify(await page.evaluate(잰다)))
 await page.close()
}
// ── ⑵ 세로 · 자판 뜸 ───────────────────────────────
{
 const page=await b.newPage({viewport:{width:411,height:891},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
 await page.addInitScript(시드,값); await 열기(page)
 console.log('⑵ 세로 · 자판 없음        ', JSON.stringify(await page.evaluate(잰다)))
 const ta=page.locator('.decor-stage textarea').first()
 if(await ta.count().catch(()=>0)){await ta.click({force:true});await page.waitForTimeout(700)}
 await page.setViewportSize({width:411,height:440});await page.waitForTimeout(700)   // ⌨️ 자판 올라온 셈
 console.log('   세로 · 자판 뜸          ', JSON.stringify(await page.evaluate(잰다)))
 await page.screenshot({path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수/세로-자판뜸.png'})
 await page.close()
}
await b.close();srv.close()
