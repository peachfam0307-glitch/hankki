import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist', OUT=process.argv[2]
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4471,r))
const {SEED_COACH_SEEN}=await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
async function 판(이름, 기존, 차단, 뒤){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
  await ctx.addInitScript(([기존,차단])=>{ if(기존) localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1'); localStorage.setItem('hankki:nudge:giftpack','1'); localStorage.setItem('hankki:giftSheetSeen','1'); if(차단) try{Object.defineProperty(Notification,'permission',{get:()=>'denied'})}catch{} },[기존,차단])
  await ctx.addInitScript({content:SEED_COACH_SEEN})
  const pg=await ctx.newPage(); await pg.goto('http://127.0.0.1:4471/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(5500)
  if(뒤) await 뒤(pg)
  await pg.screenshot({path:`${OUT}/${이름}.png`})
  const t=await pg.evaluate(()=>document.body.innerText.slice(0,300)); console.log(이름, JSON.stringify(t).slice(0,200))
  await ctx.close()
}
await 판('1-기존유저', true, false)
await 판('2-새유저', false, false)
await 판('3-차단-안내', true, true, async pg=>{ await pg.keyboard.press('Escape').catch(()=>{}); await pg.evaluate(()=>{ const bs=[...document.querySelectorAll('button,[role=button],.press')]; const g=bs.find(x=>/설정|settings/i.test(x.getAttribute('aria-label')||'')); g&&g.click() }); await pg.waitForTimeout(800); await pg.getByText('알림 받기').first().click().catch(e=>console.log('no row',e.message)); await pg.waitForTimeout(800) })
await b.close(); srv.close()
