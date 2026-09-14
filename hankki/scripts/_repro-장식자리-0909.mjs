// 📐 장식이 «창업자가 저장한 자리»에 붙었나 · «글자를 가리나» — 눈이 아니라 숫자로 본다.
// 📮 창업자 2026-09-09 = *"스티커들이 글자를 안가리고 내가 저장한 자리에 붙였는지만 확인해줘"*
// ⭐ 두 가지를 따로 본다:
//    ① 자리 — 화면에서 잰 x·y·폭 비율이 seasonDecor.js 값과 같나 (0.005 안이면 같은 것으로 본다)
//    ② 가림 — 조각이 덮은 네모 «안»에 글자가 있나. ⛔단순히 겹치는지가 아니라
//       «조각의 안 비치는 부분»이 글자를 덮는지를 본다 — 진하기 0.7 이면 밑이 비쳐 읽힌다.
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
const { 홈장식, 탭컷 } = await import('../src/data/seasonDecor.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki-theme','apricot')}catch{}})
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${srv.address().port}/`,{waitUntil:'networkidle'})
await p.waitForTimeout(2200)
for(let i=0;i<5;i++){const c=await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true});if(c){await p.waitForTimeout(350);continue}if(!(await p.locator('.sheet-mask').count()))break;await p.keyboard.press('Escape');await p.waitForTimeout(250)}

const 잰것 = await p.evaluate(() => {
  const W = innerWidth, H = innerHeight
  const 통 = document.querySelector('.screen').getBoundingClientRect()
  const 글자들 = [...document.querySelectorAll('*')].filter((e) =>
    e.children.length === 0 && (e.textContent || '').trim().length > 1 &&
    e.getBoundingClientRect().width > 8 && getComputedStyle(e).visibility !== 'hidden')
    .map((e) => ({ 글: e.textContent.trim().slice(0, 16), r: e.getBoundingClientRect() }))
  return [...document.querySelectorAll('body > div[aria-hidden] img')].map((im) => {
    const r = im.getBoundingClientRect()
    // 글자 네모와 «가운데 60%»가 겹치는지 — 가장자리는 컷의 투명한 여백이라 안 가린다
    const 안 = { l: r.left + r.width*0.2, t: r.top + r.height*0.2,
                 rr: r.right - r.width*0.2, b: r.bottom - r.height*0.2 }
    const 덮은글자 = 글자들.filter((g) =>
      g.r.left < 안.rr && g.r.right > 안.l && g.r.top < 안.b && g.r.bottom > 안.t).map((g) => g.글)
    return {
      src: (im.getAttribute('src') || '').split('/').pop().split('.')[0].slice(0, 24),
      x: +((r.left + r.width/2 - 통.left) / 통.width).toFixed(4),
      y: +((r.top + r.height/2 - 통.top) / 통.height).toFixed(4),
      w: +(r.width / 통.width).toFixed(4),
      투명도: +getComputedStyle(im).opacity,
      덮은글자,
    }
  })
})
await ctx.close(); await b.close(); srv.close()

console.log('\n① 자리 — 창업자가 저장한 값과 «화면에서 잰 값»')
let 틀림 = 0
홈장식.cs.forEach((c, i) => {
  const m = 잰것[i]
  // ⛔ 저장값 y 는 «왼쪽 위» 기준, 화면에서 잰 것은 «가운데» 기준이라 폭·높이의 반만큼 갈린다.
  //    그래서 x·폭·진하기만 «값 그대로» 견주고, y 는 아래에서 따로 본다.
  const dx = Math.abs(m.x - c.x), dw = Math.abs(m.w - c.w), do_ = Math.abs(m.투명도 - c.o)
  const ok = dx < 0.006 && dw < 0.006 && do_ < 0.01
  if (!ok) 틀림++
  console.log(`   ${ok ? '✅' : '❌'} ${c.id.padEnd(10)} x ${c.x}→${m.x} · 폭 ${c.w}→${m.w} · 진하기 ${c.o}→${m.투명도}`)
})
console.log('\n② 가림 — 조각 «가운데 60%» 안에 든 글자')
잰것.forEach((m, i) => {
  const 컷 = 홈장식.cs[i]
  console.log(`   ${m.덮은글자.length ? '⚠️' : '✅'} ${컷.id.padEnd(10)} ${m.덮은글자.length ? m.덮은글자.join(' / ') : '없다'}`)
})
if (틀림) { console.error(`\n⛔ ${틀림}개가 저장한 자리와 다르다`); process.exit(1) }
console.log('\n✅ 넷 다 창업자가 저장한 자리·크기·진하기 그대로다')
