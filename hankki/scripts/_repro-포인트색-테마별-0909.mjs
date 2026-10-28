import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/'||!extname(p))p='/index.html';
  try{s.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});s.end(readFileSync(join(DIST,p)))}catch{s.writeHead(404);s.end()}})
await new Promise(r=>srv.listen(0,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const t of ['cream','greige','apricot','dark']) {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((k)=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki-theme',k)}catch{}}, t)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'})
  await p.waitForTimeout(1800)
  for(let i=0;i<4;i++){const c=await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true});if(c){await p.waitForTimeout(350);continue}if(!(await p.locator('.sheet-mask').count()))break;await p.keyboard.press('Escape');await p.waitForTimeout(250)}
  await p.locator('.bottom-nav .nav-item').filter({hasText:'레시피'}).first().click().catch(()=>{})
  await p.waitForTimeout(1000)
  const r = await p.evaluate(()=>{
    const on = document.querySelector('.seg.on')
    return { brown: getComputedStyle(document.documentElement).getPropertyValue('--brown').trim(),
             알약: on ? getComputedStyle(on).backgroundColor : null }
  })
  console.log(t.padEnd(8), JSON.stringify(r))
  await p.screenshot({ path: `/tmp/확정-${t}.png` })
  await ctx.close()
}
await b.close(); srv.close()
