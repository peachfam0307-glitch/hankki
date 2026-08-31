import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST=join('/home/user/hankki/hankki','dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4414,r))
const {SEED_COACH_SEEN}=await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:411,height:891},deviceScaleFactor:2})
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const pg=await ctx.newPage()
const 닫기=async()=>{for(const t of['나중에','닫기']){const x=pg.getByRole('button',{name:t}).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click().catch(()=>{});await pg.waitForTimeout(180)}}}
await pg.goto('http://127.0.0.1:4414/hankki/',{waitUntil:'networkidle'});await pg.waitForTimeout(900);await 닫기()
await pg.getByRole('button',{name:/일기/}).last().click();await pg.waitForTimeout(600);await 닫기()
await pg.getByRole('button',{name:/오늘 일기/}).first().click();await pg.waitForTimeout(700);await 닫기()
await pg.getByRole('button',{name:/꾸미기/}).first().click();await pg.waitForTimeout(900);await 닫기()
const 일꾸=pg.getByRole('button',{name:'일꾸',exact:true}).first()
if(await 일꾸.count()){await 일꾸.click();await pg.waitForTimeout(400)}
const 잰다=()=>pg.evaluate(()=>{const st=document.querySelector('.decor-stage'),dr=document.querySelector('.decor-drawer');const p=document.querySelector('.paper-box')||st?.querySelector('div')
return {서랍:dr?Math.round(dr.getBoundingClientRect().height):0, 종이칸:st?Math.round(st.getBoundingClientRect().height):0}})
console.log('내리기 전 :',JSON.stringify(await 잰다()))
await pg.screenshot({path:join(OUT,'서랍-내리기전.png')})
await pg.locator('.decor-grab').first().click();await pg.waitForTimeout(500)
console.log('내린 뒤   :',JSON.stringify(await 잰다()))
await pg.screenshot({path:join(OUT,'서랍-내린뒤.png')})
await pg.locator('.decor-grab').first().click();await pg.waitForTimeout(500)
console.log('다시 올림 :',JSON.stringify(await 잰다()))
await b.close();srv.close();process.exit(0)
