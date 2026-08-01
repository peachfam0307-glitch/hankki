// 요리 모드에 우리 애들이 실제로 뜨나 — 단계 문구별로 알맞은 컷이 걸리는지
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE='http://127.0.0.1:4206/'
const srv=spawn('npx',['vite','preview','--host','127.0.0.1','--port','4206','--strictPort'],{stdio:'ignore'})
for(let i=0;i<90;i++){try{const r=await fetch(BASE);if(r.status<500)break}catch{}await new Promise(r=>setTimeout(r,400))}
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:430,height:940},deviceScaleFactor:2})
await ctx.addInitScript(()=>{['hankki:onboarded','hankki:coach:home2','hankki:coach:detail'].forEach(k=>{try{localStorage.setItem(k,'1')}catch{}})})
const p=await ctx.newPage(); const errs=[]
p.on('pageerror',e=>errs.push(String(e)))
await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1800)
await p.locator('.grid-card button, .grid2 button').first().click(); await p.waitForTimeout(1000)
const start = p.getByRole('button',{name:/요리 시작/}).first()
console.log('요리 시작 버튼 =', await start.isVisible().catch(()=>false))
await start.click(); await p.waitForTimeout(1200)
// i=0 은 '재료 준비' 안내 화면 — 한 번 더 눌러야 STEP 1로 간다
await p.getByRole('button',{name:/재료 준비 완료/}).first().click(); await p.waitForTimeout(900)
for (let step=0; step<5; step++){
  const info = await p.evaluate(()=>{
    const img=document.querySelector('.buddy img')
    const txt=document.querySelector('.cook-steptext')?.innerText||''
    return img ? {src:img.currentSrc.split('/').pop().split('-')[0], cls:img.className, w:img.naturalWidth, shown:img.clientHeight, step:txt.slice(0,34)} : null
  })
  console.log(info ? `  단계${step+1}: ${info.src} · ${info.cls} · 소스${info.w}px→표시${info.shown}px · "${info.step}"` : `  단계${step+1}: .buddy img 없음 ❌`)
  const next=p.getByRole('button',{name:/다음/}).first()
  if(!(await next.isVisible().catch(()=>false))) break
  await next.click(); await p.waitForTimeout(700)
}
await p.screenshot({path:'/tmp/cook.png',clip:{x:0,y:120,width:430,height:560}})
console.log('pageerror =',errs.length, errs.slice(0,2))
await b.close();srv.kill()
