// 🍽 홈 「자주 해먹는」 음식 그림 크기 — 갈래 셋을 실제 화면에 얹어 찍는다 (창업자 판정용 · 2026-09-01)
//
// 📮 창업자 = *"음식아이콘을 레꾸에서 정확하게 가을의 정원으로 딱 덮었는데 **홈에서는 아이콘이 더 크네**.."*
//
// 🔢 실측(`_probe-접시아이콘-0901.mjs`) — 접시(꾸미기)는 «판 폭의 %» 라 어느 화면에서나 같은데
//    음식 그림만 홈 「자주 해먹는」에서 **0.70** 이고 나머지는 전부 **0.56** 이다 → 그림이 접시보다 **25% 크다**.
//    · 홈 자주해먹는  판 156px · 그림 109.2px (0.70)   ← 여기만 다르다
//    · 홈 최근저장    판 168px · 그림  94.1px (0.56)
//    · 레시피 모아보기 판 168px · 그림  94.1px (0.56)   ＝ 레꾸 캔버스·검색·즐겨찾기와 같은 값
//
// ⛔ 「70% 를 56% 로 되돌린다」가 답이 아닐 수 있다 — **70% 는 창업자가 시킨 값**이다
//    (2026-08-23 `1bee20df` · *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음. **조금만더크게수정.**"*)
//    그때는 **접시 프레임이 아예 없었다**(「가을의 정원 세트」는 2026-09-01 공개). 두 결정이 이제 부딪친다.
//
// ⭐ 그래서 «소스를 안 고치고» 화면 위에서 크기만 갈아끼워 찍는다(절대원칙 30) — 지금 앱 그대로에 얹힌다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-접시아이콘-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/zb/_접시아이콘'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
const PORT = 4397
await new Promise((r) => srv.listen(PORT, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const URL0 = `http://127.0.0.1:${PORT}/hankki/`
await page.goto(URL0, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// 🍽 창업자가 레꾸에서 맞춘 상태를 흉내낸다 — 접시를 «판의 62%» 로 놓고 그 안에 음식이 들어가야 한다.
//   ⭐ 62% = 레꾸에서 56% 그림이 접시 «안쪽»에 딱 담기는 크기(접시는 테가 있어 그림보다 조금 크다).
const 씌웠나 = await page.evaluate(() => {
  const raw = localStorage.getItem('hankki:v1'); if (!raw) return 0
  const st = JSON.parse(raw); let n = 0
  for (const r of st.recipes || []) {
    r.thumb = 'icon'; r.image = null
    r.decor = [{ id: 'probe-dish', type: 'sticker', key: 'pf_ad01', x: 0.5, y: 0.5, s: 0.62, r: 0 }]
    n++
  }
  localStorage.setItem('hankki:v1', JSON.stringify(st)); return n
})

const 갈래 = [
  ['가-지금-70', null, '지금 그대로 (70%) — 그림이 접시 밖으로'],
  ['나-56', 0.56, '레꾸와 같게 (56%) — 접시 안에 담긴다'],
  ['다-63', 0.63, '가운데 (63%) — 접시 테에 닿는다'],
]

for (const [이름, 값, 설명] of 갈래) {
  await page.goto(URL0, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  if (값 != null) {
    // ⛔ 소스를 안 고친다 — 「자주 해먹는」 칸의 음식 그림 폭만 화면 위에서 갈아끼운다
    const 바꾼수 = await page.evaluate((v) => {
      let n = 0
      for (const card of document.querySelectorAll('.mini-card')) {
        for (const img of card.querySelectorAll('img')) {
          if ((img.src || '').includes('pf_ad01')) continue
          // ⛔ `style.width === '70%'` 로 고르면 하나도 못 찾는다 — FoodIcon 이 폭을 다른 방식으로 준다.
          //    그래서 «접시가 아닌 그림»을 그대로 집어 폭을 덮어쓴다(절대원칙 18 ⓘ).
          img.style.setProperty('width', `${v * 100}%`, 'important')
          img.style.setProperty('height', 'auto', 'important')
          n++
        }
      }
      return n
    }, 값)
    if (!바꾼수) { console.log(`  ⛔ ${이름} — 70% 그림을 하나도 못 찾았다(잣대가 낡았다)`); continue }
  }
  await page.waitForTimeout(300)
  const 잰것 = await page.evaluate(() => {
    const card = document.querySelector('.mini-card'); if (!card) return null
    const imgs = [...card.querySelectorAll('img')]
    const 접시 = imgs.find((i) => (i.src || '').includes('pf_ad01'))
    const 그림 = imgs.find((i) => i !== 접시)
    if (!접시 || !그림) return null
    const D = 접시.getBoundingClientRect(), F = 그림.getBoundingClientRect()
    return { 접시: +D.width.toFixed(1), 그림: +Math.min(F.width, F.height).toFixed(1), 비: +(Math.min(F.width, F.height) / D.width).toFixed(3) }
  })
  const el = await page.$('.mini-card')
  await el.screenshot({ path: join(OUT, `${이름}.png`) })
  const 삐짐 = 잰것 && 잰것.비 > 1 ? ` 🚨 접시보다 ${((잰것.비 - 1) * 100).toFixed(0)}% 크다` : ''
  console.log(`  ${이름.padEnd(10)} 접시 ${잰것?.접시}px · 그림 ${잰것?.그림}px · 그림÷접시 ${잰것?.비}${삐짐}   — ${설명}`)
}

console.log(`\n📁 ${OUT}  (레시피 ${씌웠나}편에 접시를 씌워 찍었다 · 3배 해상도)\n`)
await b.close(); srv.close()
