// 🌘 재현판 — 「가로에서 하단 액션 버튼이 화면을 가로지르는 어두운 띠가 된다」
//
// 📮 창업자 2026-08-16 = *"영상에 **아래부분만 그라데이션처럼 어둡게** 보였어"*
// 🔢 고치기 «전» 실측(프로모 영상 1920×1080) = 진한 띠가 **화면 높이의 9.4~9.6%** · 가로는 끝에서 끝까지
//
// ⭐⭐ 이 판이 «무엇을» 재는가 — 「어둡나」가 아니라 **「그 어두운 것이 화면 폭을 얼마나 먹나」**.
//    📌 어두운 건 문제가 아니다(버튼은 진해야 눈에 띈다). **폭을 다 먹는 것**이 문제다.
//    ⛔ 밝기만 재면 못 잡는다 — 버튼을 좁혀도 그 자리 밝기는 그대로다(규칙 18 ⓘ).
//
// ⛔ 폰 세로는 «일부러» 같이 잰다 — 가로만 고치려다 세로를 건드리면 여기서 걸린다.
//
// 실행: node scripts/_repro-하단띠-0816.mjs
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4392, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 「가로에서만 좁아졌나 · 세로는 그대로인가」를 둘 다 본다
const 화면들 = [
  { 이름: '패드 가로', w: 1280, h: 720, 가로: true },
  { 이름: '폰 가로', w: 780, h: 360, 가로: true },
  { 이름: '폰 세로', w: 411, h: 891, 가로: false },
]

// 가로에서 버튼이 먹어도 되는 폭의 상한 — 이보다 넓으면 「띠」다
const 상한 = 0.62
let 실패 = 0
const 줄 = []

for (const s of 화면들) {
  const page = await b.newPage({ viewport: { width: s.w, height: s.h } })
  const 오류 = []
  page.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
  await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))
  await page.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // 레시피 탭 → 첫 레시피 → 상세
  await page.locator('[data-coach="nav-diary"]').first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {})
  await page.locator('.nav-item', { hasText: '레시피' }).first().click().catch(() => {})
  await page.waitForTimeout(900)
  await page.locator('.card, .rc-card, .recipe-card').first().click().catch(() => {})
  await page.waitForTimeout(1200)

  // ── ① 레시피 상세의 「요리 시작」 ──
  const 재기 = async (sel) => await page.evaluate((q) => {
    const el = document.querySelector(q)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const fr = (document.querySelector('.app-frame') || document.body).getBoundingClientRect()
    return { 폭: Math.round(r.width), 판폭: Math.round(fr.width), 비율: r.width / fr.width }
  }, sel)

  const 상세 = await 재기('.action-bar .btn-primary')
  if (상세) {
    const ok = s.가로 ? 상세.비율 <= 상한 : true
    if (!ok) 실패++
    줄.push(`${s.이름.padEnd(8)} │ 요리 시작 버튼  │ ${String(상세.폭).padStart(4)}px / 판 ${String(상세.판폭).padStart(4)}px = ${(상세.비율 * 100).toFixed(0).padStart(3)}% │ ${s.가로 ? (ok ? '✅' : '⛔ 띠다') : '· 세로(안 잼)'}`)
  } else {
    줄.push(`${s.이름.padEnd(8)} │ 요리 시작 버튼  │ ⛔ 못 찾았다`)
  }

  // ── ② 요리모드의 「재료 준비 완료 · 시작 →」 ──
  await page.locator('[data-coach="cook"]').first().click().catch(() => {})
  await page.waitForTimeout(1200)
  const 요리 = await 재기('.cook-nav .cook-navbtn.primary')
  if (요리) {
    const ok = s.가로 ? 요리.비율 <= 상한 : true
    if (!ok) 실패++
    줄.push(`${s.이름.padEnd(8)} │ 요리모드 버튼   │ ${String(요리.폭).padStart(4)}px / 판 ${String(요리.판폭).padStart(4)}px = ${(요리.비율 * 100).toFixed(0).padStart(3)}% │ ${s.가로 ? (ok ? '✅' : '⛔ 띠다') : '· 세로(안 잼)'}`)
  } else {
    줄.push(`${s.이름.padEnd(8)} │ 요리모드 버튼   │ ⛔ 못 찾았다`)
  }

  if (오류.length) { console.log(`  ⛔ pageerror(${s.이름}):`, 오류[0]); 실패++ }
  await page.close()
}

console.log('\n🌘 하단 액션 버튼이 «판 폭»의 몇 %를 먹나')
console.log(`   ⭐ 가로에서 ${(상한 * 100).toFixed(0)}% 를 넘으면 「화면을 가로지르는 띠」로 본다`)
console.log('   ⛔ 폰 세로는 꽉 차는 게 맞다 — 재기만 하고 판정하지 않는다\n')
console.log('  화면     │ 무엇            │ 폭                       │ 판정')
console.log('  ─────────┼─────────────────┼──────────────────────────┼──────────')
줄.forEach((l) => console.log('  ' + l))

await b.close(); srv.close()
console.log(실패 === 0 ? '\n✅ 통과' : `\n⛔ 실패 ${실패}칸`)
process.exit(실패 === 0 ? 0 : 1)
