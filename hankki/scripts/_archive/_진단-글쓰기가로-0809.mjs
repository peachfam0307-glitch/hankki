// 🔎 일꾸 「글쓰기」 탭 가로 — 글씨체 줄이 서랍 밖으로 삐져나온다 (창업자 캡처 2026-08-09)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4394,r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const SEED={recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION}
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const page=await b.newPage({viewport:{width:891,height:322},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const _g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return (typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':_g.call(this,k)}},SEED)
await page.goto('http://127.0.0.1:4394/hankki/',{waitUntil:'networkidle'}); await page.waitForTimeout(900)
await page.getByText('일기',{exact:true}).last().click(); await page.waitForTimeout(700)
await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click(); await page.waitForTimeout(1100)
await page.getByRole('button',{name:'꾸미기 열기'}).first().click(); await page.waitForTimeout(900)
const 글 = page.getByRole('button',{name:'글쓰기',exact:true})
if (await 글.count()) { await 글.first().click(); await page.waitForTimeout(800) }
const m = await page.evaluate(() => {
  const ed = document.querySelector('.decor-editor')
  const kids = [...ed.children].map((e) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
    return { 이름: (typeof e.className==='string'&&e.className? '.'+e.className.trim().split(/\s+/).join('.') : e.tagName).slice(0,40),
      자리: cs.gridArea, 칸: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}` }
  })
  const dr = document.querySelector('.decor-drawer')?.getBoundingClientRect()
  const 삐져 = []
  // ⛔ 첫 판이 틀렸다 — 「서랍 위아래 범위 안 + 왼쪽」으로 골랐더니 «종이 칸»의 것이 전부 걸렸다.
  //    서랍이 칸 높이를 다 쓰게 되면서 그 조건이 무의미해졌다. → 서랍의 «자손»만 본다.
  for (const el of (document.querySelector('.decor-drawer')?.querySelectorAll('*') || [])) {
    const r = el.getBoundingClientRect(); if (r.width<8||r.height<8) continue
    if (dr && r.top >= dr.top-2 && r.bottom <= dr.bottom+2 && r.left < dr.left - 3)
      삐져.push({ 이름:(typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).join('.'):el.tagName).slice(0,40), 글:(el.innerText||'').replace(/\n/g,' ').slice(0,20), 왼쪽으로: Math.round(dr.left - r.left) })
  }
  return { 자식들: kids, 서랍왼쪽: dr?Math.round(dr.left):null, 서랍밖으로삐져나온것: 삐져.slice(0,6) }
})
console.log(JSON.stringify(m,null,1))
await b.close(); srv.close()
