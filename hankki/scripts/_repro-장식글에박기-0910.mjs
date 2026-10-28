// 📜 명절 장식이 «글에 박혀» 있나 — 굴려도 그 자리인가.
// 📮 창업자 2026-09-10 = "큰달 아래작은달 애들 기도하는거 움직인다고.. 내가 정한자리에서 고정시켜"
// ⭐ 잣대 = 굴리기 «전»과 «후»에 조각이 «글 안에서» 같은 자리인가.
//    화면 좌표는 굴리면 당연히 바뀐다 — 그러니 «굴린 양만큼» 정확히 따라 올라갔는지를 본다.
//    ⛔ 화면 고정이면 굴려도 화면 좌표가 «그대로»다 → 그게 창업자가 본 「움직인다」였다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=new URL('../dist',import.meta.url).pathname
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.jpg':'image/jpeg'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/'||!extname(p))p='/index.html';
 try{s.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});s.end(readFileSync(join(DIST,p)))}catch{s.writeHead(404);s.end()}})
await new Promise(r=>srv.listen(0,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki-theme','apricot')}catch{}})
const p=await ctx.newPage()
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'});await p.waitForTimeout(2500)
for(let i=0;i<5;i++){const c=await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true});if(c){await p.waitForTimeout(350);continue}if(!(await p.locator('.sheet-mask').count()))break;await p.keyboard.press('Escape');await p.waitForTimeout(250)}
// ⛔ 조각은 «두 번째 재기»(닻 자리 측정) 뒤에 나온다 — 나오기를 기다리고 잰다.
await p.waitForFunction(() => document.querySelectorAll('.screen div[aria-hidden] > span').length > 0, null, { timeout: 20000 })
await p.waitForTimeout(400)

const 재기 = () => p.evaluate(() => {
  const el = document.querySelector('.screen')
  return {
    굴린양: Math.round(el.scrollTop),
    조각: [...el.querySelectorAll('div[aria-hidden] > span')].map((e) => {
      const r = e.getBoundingClientRect()
      return { 화면y: Math.round(r.top), 폭: Math.round(r.width) }
    }),
  }
})
const 전 = await 재기()
await p.evaluate(() => { document.querySelector('.screen').scrollTop = 300 })
await p.waitForTimeout(500)
const 후 = await 재기()

console.log('굴리기 전 ', JSON.stringify(전))
console.log('굴린  뒤 ', JSON.stringify(후))
const 굴린만큼 = 후.굴린양 - 전.굴린양
let ok = 전.조각.length > 0 && 전.조각.length === 후.조각.length && 굴린만큼 > 100
전.조각.forEach((a, i) => {
  const 움직인양 = a.화면y - 후.조각[i].화면y
  const 맞나 = Math.abs(움직인양 - 굴린만큼) < 2
  console.log(`  ${맞나 ? '✅' : '❌'} 조각${i + 1} — 굴린 양 ${굴린만큼}px · 따라 올라간 양 ${움직인양}px`)
  if (!맞나) ok = false
})
console.log(ok ? '\n✅ 조각이 «글에» 박혀 있다 — 굴려도 그 글 옆 그 자리다'
               : '\n❌ 아직 화면에 붙어 있다 — 굴리면 글 위를 지나간다')
await b.close(); srv.close()
process.exit(ok ? 0 : 1)
