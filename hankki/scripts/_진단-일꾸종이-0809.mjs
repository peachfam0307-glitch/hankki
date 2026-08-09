// 🔎 일꾸(속지) 종이가 가로에서 왜 작은가 — 래퍼를 한 겹씩 뜯어본다
// ⛔ 앞선 가설(부모 align-items:center 라 stretch 안 됨)은 틀렸다 — width:100% 를 줘도 값이 안 변했다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = new URL('..', import.meta.url).pathname, D = join(R, 'dist')
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4388,r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport:{width:1104,height:690}, timezoneId:'Asia/Seoul', locale:'ko-KR' })
await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
await page.goto('http://127.0.0.1:4388/hankki/',{waitUntil:'networkidle'}); await page.waitForTimeout(1000)
await page.getByText('일기',{exact:true}).last().click(); await page.waitForTimeout(700)
await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button',{name:'꾸미기 열기'}).first().click(); await page.waitForTimeout(1200)
const chain = await page.evaluate(()=>{
  const st0=document.querySelector('.decor-stage'); const paper = st0 && (st0.querySelector('.paper') || st0.querySelector('[style*="aspect-ratio"]')); if(!paper) return {못찾음:'꾸미기 판 안의 종이'}
  const out=[]; let el=paper
  for(let i=0;i<6&&el&&!el.classList.contains('decor-editor');i++){
    const cs=getComputedStyle(el), r=el.getBoundingClientRect()
    out.push({ 이름: el.className? '.'+String(el.className).split(' ')[0] : el.tagName.toLowerCase(),
      크기: Math.round(r.width)+'×'+Math.round(r.height),
      width: cs.width, maxW: cs.maxWidth, maxH: cs.maxHeight, ar: cs.aspectRatio,
      flex: cs.flex, align: cs.alignSelf, ct: cs.containerType })
    el = el.parentElement
  }
  const st=document.querySelector('.decor-stage'); const sr=st.getBoundingClientRect()
  out.push({ 이름:'.decor-stage', 크기: Math.round(sr.width)+'×'+Math.round(sr.height),
    dir:getComputedStyle(st).flexDirection, align:getComputedStyle(st).alignItems, maxH:getComputedStyle(st).maxHeight })
  return out
})
console.log('\n🔎 일꾸 종이 → 위로 (폴드 1104×690)\n')
chain.forEach((c,i)=>console.log(' ', i, JSON.stringify(c)))
await b.close(); srv.close()
