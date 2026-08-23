// 💬🎀 레꾸자랑 말풍선 «대사» 시안 넷 — 실물 앱에 얹어 찍는다 (2026-08-24) 〔판정 대기〕
//
// 📮 배경 = 여섯 탭 중 레꾸자랑만 말풍선이 없었다(실측). 넣었고 **문구가 창업자 판정**이다.
//
// ⭐ 잣대 = `TabTalk.jsx` 주석에 이미 있다: **「한 줄로 뜻이 닫히나」**
//    앱은 매일 보고 앞뒤 맥락이 없다. 홍보 문구를 그대로 옮기면 안 된다(창업자 2026-08-21).
//
// 🎭 기존 넷은 «결»이 다 다르다 — 후보도 그렇게 갈랐다
//    · 홈     「오늘 또 뭐 먹지?」   = 물음
//    · 레시피 「여기에 다 모았어.」   = 설명
//    · 일기   「오늘도 한 끼 해냈다.」 = 자기 칭찬
//    · 장보기 「또 두부 샀네.」       = 혼잣말·유머
//
// ⛔ 색·자리·꼬리는 «안» 건드린다 — 그건 v11.18 에 창업자가 이미 확정했다(ⓔ 흰색 ＋ 살짝 그림자).
//    이 판이 묻는 건 **글자 하나**다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-자랑대사-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/자랑대사'
mkdirSync(OUT, { recursive: true })

const 후보 = [
  ['가', '이건 자랑해야지.', '제목(레꾸자랑)과 말이 이어진다'],
  ['나', '오늘 건 좀 잘됐네.', '혼잣말·유머 — 「또 두부 샀네」와 같은 결'],
  ['다', '예쁘게 만들어 줄게.', '기능을 말한다 — 「여기에 다 모았어」와 같은 결'],
  ['라', '누구한테 보여줄까?', '물음 — 「오늘 또 뭐 먹지?」와 같은 결'],
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4414, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4414/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('레꾸자랑'))
  t?.click()
})
await page.waitForTimeout(1100)

const 잰값 = []
for (const [키, 말, 왜] of 후보) {
  // ⭐ 글자만 갈아끼운다 — 만드는 코드를 안 건드리므로 «지금 앱 그대로»에 얹힌다(절대원칙 30)
  const r = await page.evaluate((s) => {
    const el = document.querySelector('.tab-talk-b')
    if (!el) return null
    const 글노드 = [...el.childNodes].find((n) => n.nodeType === 3)
    if (글노드) 글노드.textContent = s
    const rc = el.getBoundingClientRect()
    return { 폭: Math.round(rc.width), 높이: Math.round(rc.height) }
  }, 말)
  await page.waitForTimeout(220)
  await page.screenshot({ path: join(OUT, `${키}.png`), clip: { x: 0, y: 0, width: 390, height: 230 } })
  잰값.push({ 키, 말, 글자수: 말.length, 폭: r?.폭 ?? 0, 두줄: (r?.높이 ?? 0) > 44 ? '⛔ 두 줄' : '한 줄', 결: 왜 })
}
console.table(잰값)

// 🖼 넷을 한 장에 — 창업자가 «나란히» 견줄 수 있게
const { createCanvas, loadImage } = await import('canvas').catch(() => ({}))
if (createCanvas) {
  const ims = await Promise.all(후보.map(([k]) => loadImage(join(OUT, `${k}.png`))))
  const W = ims[0].width, H = ims[0].height
  const c = createCanvas(W, H * 4 + 30); const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height)
  ims.forEach((im, i) => g.drawImage(im, 0, i * (H + 10)))
  const { writeFileSync } = await import('node:fs')
  writeFileSync(join(OUT, '_넷한장.png'), c.toBuffer('image/png'))
  console.log('🖼 _넷한장.png')
}
console.log(`📁 ${OUT}`)
await b.close(); srv.close()
