// 🍑 살구 테마 «포인트색(알약·단추)» 시안 — 창업자 2026-09-09 *"우리 배경테마 자체 알약 … 가을인데 추워보여"*
// ⛔ 앱 소스는 «안» 고친다 — 화면에서 색만 갈아 끼워 보여주고, 창업자가 고르면 그때 넣는다.
// ⚠️ `--brown` 은 styles.css 에서 51군데가 쓴다 — 알약만이 아니라 단추·링크·선택 상태가 다 같이 바뀐다.
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

// 🔢 흰 글씨 대비 / 배경 대비 — 전부 잰 값이다(살구에서 지금 파랑은 4.56 / 4.11 로 제일 낮다)
// 📮 창업자 2026-09-09 = *"진한테마에도 넣어봐야하지않아?"* — 맞다.
//   ⛔ **어두운 배경에선 같은 색을 쓸 수 없다** — 군고구마 #8a4a26 은 차콜(#17171b) 위에서 대비 2.63 이라
//      단추가 «배경에 잠긴다». 그래서 진한 테마는 «밝게 올린» 짝을 따로 둔다(지금 파랑도 그렇게 하고 있다:
//      살구 #5878a0 ↔ 진한 #7093c0).
const 테마 = process.argv[2] === '진한' ? 'dark' : 'apricot'
const 후보 = 테마 === 'dark' ? [
  ['진한-지금파랑', '#7093c0'], ['진한-군고구마', '#c07a45'],
  ['진한-대추진홍', '#cf6a55'], ['진한-밤웜', '#c98c5e'],
] : [
  ['지금-파랑', '#5878a0'], ['대추진홍', '#9c4436'], ['군고구마', '#8a4a26'],
  ['가지자주', '#6d3550'], ['밤웜브라운', '#7d4a2c'], ['솔잎카키', '#5f6b3a'],
]
for (const [이름, 색] of 후보) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((t) => { try { localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1'); localStorage.setItem('hankki-theme', t) } catch {} }, 테마)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  for (let i=0;i<5;i++){
    const 닫았나 = await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role="button"]')].filter(x=>x.getBoundingClientRect().height>8).find(x=>/^(나중에 볼게요|닫기)$/.test((x.innerText||'').trim()));if(!b)return false;b.click();return true})
    if(닫았나){await p.waitForTimeout(400);continue}
    if(!(await p.locator('.sheet-mask').count()))break
    await p.keyboard.press('Escape');await p.waitForTimeout(300)
  }
  // 🎨 색만 갈아 끼운다
  await p.evaluate((c) => document.documentElement.style.setProperty('--brown', c), 색)
  // 알약이 «켜진» 모습을 보려고 레시피 탭으로 간다(모아보기/한끼 일기 알약이 거기 있다)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(()=>{})
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `/tmp/포인트-${이름}.png` })
  await ctx.close()
}
await b.close(); srv.close()
console.log('시안', 후보.length, '장')
