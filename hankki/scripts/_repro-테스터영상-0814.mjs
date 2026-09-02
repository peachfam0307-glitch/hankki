// 🧪 테스터 영상(2026-08-14 · 1042×866 가로형)에서 눈에 걸린 것을 «실제로» 재본다.
//    ⛔ 영상엔 소리도 자막도 없다 — 테스터가 «뭐라고» 했는지는 모른다(규칙 15·18).
//       그래서 여기선 «화면이 정말 그런가»만 잰다. 원인·의도는 창업자에게 묻는다.
//
// 재는 것
//   ① 갈래 칩 줄이 «처음부터» 왼쪽으로 밀려 있나 (scrollLeft ≠ 0 이면 그렇다)
//   ② 페이지가 가로로 넘치나
//   ③ 한 화면에 레시피 카드가 몇 개나 «온전히» 보이나 (영상에선 한 줄 반쯤이었다)
//   ④ 상단 고정 줄이 세로를 얼마나 먹나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const DIST = join('/home/user/hankki/hankki', 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4451, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 잰다 = `(() => {
  const 굴 = [...document.querySelectorAll('*')].filter(e =>
    e.scrollWidth > e.clientWidth + 4 && e.clientWidth > 120 && getComputedStyle(e).overflowX !== 'visible')
  const 칩 = 굴.map(e => ({
    이름: (e.className && String(e.className).split(' ')[0]) || e.tagName.toLowerCase(),
    보이는폭: Math.round(e.clientWidth), 속폭: Math.round(e.scrollWidth),
    지금밀림: Math.round(e.scrollLeft),
    첫칸글: (e.firstElementChild && e.firstElementChild.innerText || '').trim().slice(0, 12),
  }))
  // 온전히 보이는 레시피 카드
  const cards = [...document.querySelectorAll('.grid-card')]
  let 온전 = 0
  for (const c of cards) { const r = c.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= innerHeight) 온전++ }
  const top = document.querySelector('.topbar')
  const seg = document.querySelector('.segment')
  const chips = document.querySelector('.cur-chips, .folder-chips, .chips')
  const 첫카드 = cards[0] ? Math.round(cards[0].getBoundingClientRect().top) : -1
  return {
    창: innerWidth + '×' + innerHeight,
    가로넘침: document.documentElement.scrollWidth > innerWidth + 1
      ? document.documentElement.scrollWidth - innerWidth : 0,
    가로로굴러가는줄: 칩,
    상단바h: top ? Math.round(top.getBoundingClientRect().height) : 0,
    세그h: seg ? Math.round(seg.getBoundingClientRect().height) : 0,
    칩줄h: chips ? Math.round(chips.getBoundingClientRect().height) : 0,
    첫카드까지: 첫카드,
    카드수: cards.length, 온전히보이는카드: 온전,
  }
})()`

const 판들 = [
  { 이름: '테스터 판 1042×866', w: 1042, h: 866 },
  { 이름: '폰 세로 411×891', w: 411, h: 891 },
]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 판 of 판들) {
  const ctx = await b.newContext({ viewport: { width: 판.w, height: 판.h }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript(() => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    localStorage.setItem('hankki:giftSheetSeen', '1')
  })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const pg = await ctx.newPage()
  const 닫기 = async () => {
    const a = pg.getByRole('button', { name: '나중에' }).first()
    if (await a.count() && await a.isVisible().catch(() => false)) { await a.click().catch(() => {}); await pg.waitForTimeout(180) }
  }
  await pg.goto('http://127.0.0.1:4451/hankki/', { waitUntil: 'networkidle' })
  await pg.waitForTimeout(900); await 닫기()
  await pg.getByRole('button', { name: /^레시피/ }).last().click()
  await pg.waitForTimeout(800); await 닫기()
  console.log(`\n━━━ ${판.이름} ━━━`)
  console.log(JSON.stringify(await pg.evaluate(잰다), null, 1))
  await pg.screenshot({ path: join(OUT, `테스터판-레시피-${판.w}.png`) })
  await ctx.close()
}
await b.close(); srv.close()
