// 📐 패드에서 「너무 작다」는 자리를 찍는다 — 지금 모습 (2026-08-26)
//
// 📮 창업자 = *"홈 자주해먹는요리랑 장보기세로나누기는 «패드에서 보여지는거» 고치는거야."*
//
// ⭐⭐ 폰이 아니라 **패드 세로/가로 둘 다** 찍는다 — 2026-08-17 에 「패드 «세로»에서만」
//    장보기가 틀 밖으로 나간 적이 있다(`1fr` 의 최소가 min-content 라서). 한 쪽만 보면 또 놓친다.
//
// 🔢 재는 것도 같이 — 눈으로만 보면 「작다/크다」가 갈리지 않는다(규칙 18 ⓘ).
//    · 자주 해먹는 요리 = 카드 실제 폭 ↔ 화면 폭
//    · 장보기 = 왼쪽/오른쪽 칸 폭 · 오른쪽 «빈 세로» 비율
//
// 씀: cd /home/user/hankki/hankki && node scripts/_shot-패드크기-0826.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 📱 아이패드 실제 값 — 세로 834×1194(에어 10.9) · 가로 1194×834 · 폰은 대조군
const 기기들 = [
  ['폰-411', 411, 914],
  ['패드세로-834', 834, 1194],
  ['패드가로-1194', 1194, 834],
]

const 잰것 = []

for (const [이름, W, H] of 기기들) {
  const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)

  // ── ① 홈 — 「자주 해먹는 요리」
  await page.screenshot({ path: join(OUT, `${이름}-1홈.png`) })
  const 홈 = await page.evaluate(() => {
    const 화면 = document.querySelector('.screen') || document.body
    const 카드 = document.querySelector('.mini-card')
    const 줄 = 카드?.closest('.hscroll')
    if (!카드) return null
    const c = 카드.getBoundingClientRect(), s = 화면.getBoundingClientRect()
    const 이름칸 = 카드.querySelector('.name')
    return {
      화면폭: Math.round(s.width),
      카드폭: Math.round(c.width),
      카드높이: Math.round(c.height),
      비율: +(c.width / s.width * 100).toFixed(1),
      글자: 이름칸 ? getComputedStyle(이름칸).fontSize : '?',
      한줄에: 줄 ? Math.round(줄.getBoundingClientRect().width / c.width * 10) / 10 : null,
    }
  })

  // ── ② 장보기
  const 장보기탭 = page.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first()
  if (await 장보기탭.count()) { await 장보기탭.click(); await page.waitForTimeout(1200) }
  await page.screenshot({ path: join(OUT, `${이름}-2장보기.png`) })
  const 장보기 = await page.evaluate(() => {
    const 쌍 = document.querySelector('.shop-pair')
    if (!쌍) return null
    const 왼 = 쌍.querySelector('.shop-cur'), 오 = 쌍.querySelector('.shop-list')
    if (!왼 || !오) return null
    const a = 왼.getBoundingClientRect(), c = 오.getBoundingClientRect(), p = 쌍.getBoundingClientRect()
    // 오른쪽 칸의 «실제 내용» 높이 — 칸 높이에서 얼마나 비었나
    const 안쪽 = [...오.children].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), c.top)
    return {
      좌우인가: getComputedStyle(쌍).display === 'grid',
      왼폭: Math.round(a.width), 오른폭: Math.round(c.width),
      쌍높이: Math.round(p.height),
      오른쪽내용높이: Math.round(안쪽 - c.top),
      오른쪽빈비율: +(100 - (안쪽 - c.top) / p.height * 100).toFixed(1),
    }
  })

  // ── ③ 냉장고 — 영수증 안내 한 줄(로드맵이 「냉장고 글자」로 적어 둔 그것)
  const 냉장고 = page.locator('[data-coach="pantry"]').first()
  if (await 냉장고.count()) { await 냉장고.click(); await page.waitForTimeout(1000) }
  await page.screenshot({ path: join(OUT, `${이름}-3냉장고.png`) })
  const 냉 = await page.evaluate(() => {
    const 줄 = [...document.querySelectorAll('div')].find((e) =>
      e.textContent?.startsWith('영수증은 사진에 따라'))
    const 재료 = document.querySelector('.list-item, .pantry-row, .row .name')
    return {
      안내글자: 줄 ? getComputedStyle(줄).fontSize : '없음',
      안내줄간격: 줄 ? getComputedStyle(줄).lineHeight : '없음',
      재료글자: 재료 ? getComputedStyle(재료).fontSize : '못 찾음',
    }
  })

  잰것.push({ 이름, 화면: `${W}×${H}`, 홈, 장보기, 냉 })
  await page.close()
}

await b.close(); srv.close()

console.log('\n📐 잰 값\n')
for (const r of 잰것) {
  console.log(`━━ ${r.이름}  (${r.화면})`)
  if (r.홈) console.log(`   홈 자주해먹는요리 — 카드 ${r.홈.카드폭}×${r.홈.카드높이}px · 화면의 ${r.홈.비율}% · 이름 ${r.홈.글자} · 한 줄에 ${r.홈.한줄에}장`)
  if (r.장보기) console.log(`   장보기 — ${r.장보기.좌우인가 ? '좌우 2열' : '세로 1열'} · 왼 ${r.장보기.왼폭} / 오른 ${r.장보기.오른폭}px · 오른쪽 «빈» 세로 ${r.장보기.오른쪽빈비율}%`)
  console.log(`   냉장고 — 재료 글자 ${r.냉.재료글자} · 영수증 안내 ${r.냉.안내글자}/${r.냉.안내줄간격}`)
}
console.log(`\n🖼 ${OUT}`)
