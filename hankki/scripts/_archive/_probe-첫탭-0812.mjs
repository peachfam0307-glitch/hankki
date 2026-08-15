import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4404,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891} })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4404/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(1000)
const 닫기=async()=>{for(const t of ['나중에','닫기']){const x=pg.getByRole('button',{name:t}).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click().catch(()=>{});await pg.waitForTimeout(200)}}}
await pg.getByRole('button',{name:/일기/}).last().click();await pg.waitForTimeout(600);await 닫기()
await pg.getByRole('button',{name:/오늘 일기/}).first().click();await pg.waitForTimeout(700);await 닫기()
await pg.getByRole('button',{name:/꾸미기/}).first().click();await pg.waitForTimeout(900);await 닫기()
for (const t of ['일꾸','글자']) { const x=pg.getByRole('button',{name:t,exact:true}).first(); if(await x.count()){await x.click();await pg.waitForTimeout(400)} }
const 본문 = pg.locator('.decor-stage textarea').first()
await 본문.click(); await pg.waitForTimeout(300); await 본문.type('불고기',{delay:30}); await pg.waitForTimeout(400)
// 🔎 서랍 칸에 «직접» 리스너를 달아 무슨 이벤트가 오는지 본다
await pg.evaluate(()=>{
  window.__log=[]
  const el=document.querySelector('button[aria-label^="글 상자"]')
  window.__cell=el
  for(const t of ['pointerdown','pointerup','click','mousedown'])
    el.addEventListener(t,()=>window.__log.push(t),true)
  document.addEventListener('focusout',()=>window.__log.push('본문blur'),true)
})
const box = await pg.locator('button[aria-label^="글 상자"]').first().boundingBox()
console.log('칸 자리(누르기 전):', JSON.stringify(box))
await pg.mouse.move(box.x+box.width/2, box.y+box.height/2)
await pg.mouse.down(); await pg.waitForTimeout(120)
const 중간 = await pg.evaluate(()=>{ const e=window.__cell.getBoundingClientRect(); return {log:[...window.__log], y:Math.round(e.top), 활성:document.activeElement.tagName} })
await pg.mouse.up(); await pg.waitForTimeout(500)
const 끝 = await pg.evaluate(()=>{ const e=window.__cell.getBoundingClientRect(); return {log:[...window.__log], y:Math.round(e.top), 붙음:document.querySelectorAll('.decor-stage textarea').length} })
console.log('누르는 중 :', JSON.stringify(중간))
console.log('뗀 뒤    :', JSON.stringify(끝))
console.log(box.y!==끝.y ? `⛔ 손가락 아래에서 칸이 ${Math.round(box.y)} → ${끝.y} 로 움직였다 (${Math.round(끝.y-box.y)}px) — click 이 딴 데로 간다` : '칸은 안 움직였다')
await b.close(); srv.close(); process.exit(0)
