// ⌨️ 스티커 «글 상자»에 글을 칠 때도 큰 글칸이 되나 (창업자 폰 캡처 2026-08-09 17:36)
//    ⛔ 처음엔 스티커를 뺐다가 틀렸다 — 가른 기준이 「상자가 작냐」였는데 진짜 기준은 「자판이 떴냐」였다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4399,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
const 잰다=()=>{const ed=document.querySelector('.decor-editor'),st=document.querySelector('.decor-stage')
const w=st&&st.querySelector(':scope > div:not(.t-sub)'),r=w?w.getBoundingClientRect():null
const 보임=(s)=>{const e=document.querySelector(s);if(!e)return false;const q=e.getBoundingClientRect();return q.width>1&&q.height>1}
return{큰글칸:!!(ed&&ed.classList.contains('bigwrite')),종이:r?`${Math.round(r.width)}×${Math.round(r.height)}`:null,서랍보임:보임('.decor-drawer'),도구바보임:보임('.decor-tools'),다썼어요:보임('.decor-donewrite')}}
const page=await b.newPage({viewport:{width:891,height:411},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
await page.goto('http://127.0.0.1:4399/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
// 글자 탭 → 글 상자 붙이기
const 글자=page.getByRole('button',{name:'글자',exact:true}).last()
if(await 글자.count().catch(()=>0)){await 글자.click().catch(()=>{});await page.waitForTimeout(700)}
const 컷=page.locator('.decor-drawer img').first()
if(await 컷.count().catch(()=>0)){await 컷.click().catch(()=>{});await page.waitForTimeout(1000)}
console.log('① 글 상자 붙인 직후', JSON.stringify(await page.evaluate(잰다)))
const 연필=page.getByRole('button',{name:/글씨 쓰기|수정|연필/}).first()
if(await 연필.count().catch(()=>0)){await 연필.click().catch(()=>{});await page.waitForTimeout(800)}
else {const ta=page.locator('.decor-stage textarea').last(); if(await ta.count().catch(()=>0)) {await ta.click({force:true}); await page.waitForTimeout(800)}}
console.log('② 스티커 글칸에 커서', JSON.stringify(await page.evaluate(잰다)))
await page.setViewportSize({width:891,height:160});await page.waitForTimeout(600)
console.log('③ 자판 뜸(160px)  ', JSON.stringify(await page.evaluate(잰다)))
await page.screenshot({path:`${OUT}/큰글칸-스티커-자판뜸.png`})
await b.close();srv.close()
