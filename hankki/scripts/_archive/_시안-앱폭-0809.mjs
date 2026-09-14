// 📐 가로에서 앱 폭 — 창업자 *"양쪽으로 꽉차게는 어려우려나?"* (2026-08-09)
//    ⛔ 440px 상한은 «읽기 편한 줄 길이» 때문에 있다 — 풀면 꽉 차지만 한 줄이 길어진다.
//    ⭐ 그래서 넷을 실물로 찍어 창업자가 고른다(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/앱폭'
mkdirSync(OUT, { recursive: true })
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4387,r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const 안 = [['A-지금440', ''], ['B-600', '@media (orientation:landscape){.app-frame{max-width:600px!important}}'],
  ['C-720', '@media (orientation:landscape){.app-frame{max-width:720px!important}}'],
  ['D-꽉채움', '@media (orientation:landscape){.app-frame{max-width:none!important}}']]
for (const [탭, 클릭] of [['장보기','장보기'],['홈',null]]) {
  console.log(`\n── ${탭} (780×360) ──`)
  for (const [이름, css] of 안) {
    const page = await b.newPage({ viewport:{width:780,height:360}, timezoneId:'Asia/Seoul', locale:'ko-KR', deviceScaleFactor:2 })
    await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
    await page.goto('http://127.0.0.1:4387/hankki/',{waitUntil:'networkidle'}); await page.waitForTimeout(1000)
    if (클릭) { const t=page.getByText(클릭,{exact:true}).last(); if(await t.count().catch(()=>0)){await t.click().catch(()=>{});await page.waitForTimeout(800)} }
    if (css) { await page.addStyleTag({content:css}); await page.waitForTimeout(500) }
    const m = await page.evaluate(()=>{const a=document.querySelector('.app-frame')||document.body
      return { 앱폭: Math.round(a.getBoundingClientRect().width), 양옆여백: Math.round((window.innerWidth-a.getBoundingClientRect().width)/2) }})
    console.log(`   ${이름.padEnd(10)} ${JSON.stringify(m)}`)
    await page.screenshot({ path: `${OUT}/${탭}-${이름}.png` }); await page.close()
  }
}
await b.close(); srv.close(); console.log('\n📸 ' + OUT + '\n')
