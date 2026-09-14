// 📏 서랍이 «무엇에» 자리를 뺏기고 있나 — 줄마다 실제 높이를 잰다.
//    📮 창업자 2026-08-12 *"글씨(높이줄이고) 프레임데코..얘네들도 높이줄이자. 접기기능이라도 있으면"*
//    ⛔ 눈대중으로 깎지 않는다. 어디를 깎아야 스티커가 «몇 칸» 더 보이는지 숫자로 정한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4405,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891} })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4405/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(1000)
const 닫기=async()=>{for(const t of ['나중에','닫기']){const x=pg.getByRole('button',{name:t}).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click().catch(()=>{});await pg.waitForTimeout(200)}}}
await pg.getByRole('button',{name:/일기/}).last().click();await pg.waitForTimeout(600);await 닫기()
await pg.getByRole('button',{name:/오늘 일기/}).first().click();await pg.waitForTimeout(700);await 닫기()
await pg.getByRole('button',{name:/꾸미기/}).first().click();await pg.waitForTimeout(900);await 닫기()
const 탭=async(t)=>{const x=pg.getByRole('button',{name:t,exact:true}).first();if(await x.count()){await x.click();await pg.waitForTimeout(450)}}
for (const 갈래 of ['마테','데코','글자','기록']) {
  await 탭('일꾸'); await 탭(갈래)
  const r = await pg.evaluate(() => {
    const d = document.querySelector('.decor-drawer'), sc = d.querySelector('.decor-scroll')
    const 줄 = [...d.children].filter((e)=>e!==sc).map((e)=>({ 이름:(e.textContent||'').trim().slice(0,14)||e.className.slice(0,14), h:Math.round(e.getBoundingClientRect().height) }))
    const 칸 = [...sc.querySelectorAll('.decor-cell')]
    const 보임 = 칸.filter((c)=>{const b=c.getBoundingClientRect(),p=sc.getBoundingClientRect();return b.top>=p.top-1&&b.bottom<=p.bottom+1}).length
    const 그룹 = [...sc.querySelectorAll('*')].filter((e)=>e.children.length===0&&/^[가-힣].{1,12}$/.test((e.textContent||'').trim())&&getComputedStyle(e).fontWeight>=700).length
    return { 서랍:d.clientHeight, 굴칸:sc.clientHeight, 담긴것:sc.scrollHeight, 위줄:줄, 칸수:칸.length, 온전히보이는칸:보임, 칸높이:칸[0]?Math.round(칸[0].getBoundingClientRect().height):null, 그룹이름수:그룹 }
  })
  console.log(`\n■ 일꾸 · ${갈래}`)
  console.log('  서랍', r.서랍, '· 굴칸', r.굴칸, '· 담긴 것', r.담긴것, `(${(r.담긴것/r.굴칸).toFixed(1)}화면)`) 
  console.log('  위 고정 줄 :', r.위줄.map(x=>`${x.이름}=${x.h}`).join(' · '))
  console.log('  칸', r.칸수, '개 · 한 칸', r.칸높이, 'px · **온전히 보이는 칸', r.온전히보이는칸, '개**')
}
await b.close(); srv.close(); process.exit(0)
