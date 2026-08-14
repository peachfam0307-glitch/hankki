// 🧷 「가로로 굴러가는 줄」의 **첫 칸이 잘려 있나** — 화면 전부 훑는다 (2026-08-14 테스터 영상)
//   ⛔ 한 곳만 보고 「됐다」 하지 않는다 — `.hscroll` 은 앱 열두 곳이 쓴다.
//   판정 = 열자마자 `scrollLeft` 가 0 이고 첫 칸 왼쪽이 컨테이너 안(≥ padding)에 있어야 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4455,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 잰다 = `(() => {
  const out = []
  for (const el of document.querySelectorAll('.hscroll')) {
    const r = el.getBoundingClientRect()
    if (r.width < 10 || r.bottom < 0 || r.top > innerHeight) continue
    const c = el.firstElementChild; if (!c) continue
    const cr = c.getBoundingClientRect(), cs = getComputedStyle(el)
    out.push({
      inset: el.classList.contains('inset'),
      밀림: Math.round(el.scrollLeft),
      첫칸: (c.innerText || '').trim().replace(/\\n/g, ' ').slice(0, 14),
      왼쪽여백: Math.round(cr.left - r.left - parseFloat(cs.paddingLeft)),  // 0 이면 딱 맞다 · 음수면 잘림
    })
  }
  return out
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891}, deviceScaleFactor:2, timezoneId:'Asia/Seoul' })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
// 🧪 규칙 12 — 옛 값으로 «진짜 걸리는지» 확인하는 스위치. `HK_OLD=1` 이면 고치기 «전» 상태로 되돌린다.
if (process.env.HK_OLD) await ctx.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style')
    s.textContent = '.hscroll{scroll-padding-left:auto}.hscroll.inset{scroll-padding-left:auto}'
    document.head.append(s)
  })
})
const pg = await ctx.newPage()
const 닫기 = async () => { const a=pg.getByRole('button',{name:'나중에'}).first(); if(await a.count()&&await a.isVisible().catch(()=>false)){await a.click().catch(()=>{});await pg.waitForTimeout(180)} }
await pg.goto('http://127.0.0.1:4455/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(900); await 닫기()

const 탭 = [
  ['홈',      async()=>pg.getByRole('button',{name:/^홈/}).last().click()],
  ['레시피',  async()=>pg.getByRole('button',{name:/^레시피/}).last().click()],
  ['한끼일기',async()=>pg.getByRole('button',{name:/일기/}).last().click()],
  ['장보기',  async()=>pg.getByRole('button',{name:/^장보기/}).last().click()],
  ['레꾸자랑',async()=>pg.getByRole('button',{name:/레꾸자랑/}).last().click()],
  ['가져오기',async()=>pg.locator('nav.bottom-nav .nav-item-import').click()],
]
let 잘림 = 0, 잰것 = 0
for (const [이름, 가기] of 탭) {
  await 가기(); await pg.waitForTimeout(700); await 닫기()
  // 아래쪽 줄도 보이게 한 번 내려본다
  for (const y of [0, 900, 1800]) {
    await pg.evaluate(`(() => { const s=document.querySelector('.screen'); (s||window).scrollTo ? (s||window).scrollTo(0, ${y}) : 0 })()`)
    await pg.waitForTimeout(250)
    for (const r of await pg.evaluate(잰다)) {
      잰것++
      const bad = r.밀림 !== 0 || r.왼쪽여백 < -0.6
      if (bad) { 잘림++; console.log(`  ⛔ ${이름}  「${r.첫칸}」  밀림=${r.밀림}  왼쪽여백=${r.왼쪽여백}${r.inset ? '  (inset)' : ''}`) }
    }
  }
  if (이름 === '가져오기') { await pg.goBack().catch(()=>{}); await pg.waitForTimeout(400) }
}
console.log(잘림 ? `\n⛔ 첫 칸이 잘린 줄 ${잘림}개 (잰 것 ${잰것})` : `\n✅ 첫 칸이 잘린 줄 0개 — 잰 것 ${잰것}개 전부 딱 맞다`)
await b.close(); srv.close()
process.exit(잘림 ? 1 : 0)
