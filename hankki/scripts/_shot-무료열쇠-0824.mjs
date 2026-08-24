// 🔑 잔량 카드 «두 상태»를 찍는다 — 웰컴 중 / 다 쓴 뒤 (2026-08-24) 〔판정 대기〕
//
// 📮 창업자 = *"무료열쇠 5개 채워드려요로 바꿔야겠다. 무료5개 채워드려요에서."* → *"채워져요구나."*
//           → *"열쇠를 붙여줘. 무료 5개 -> 무료열쇠"*
//
// ⭐ 왜 «두 상태»를 찍나 = 이 카드는 상태마다 문구가 다르다. 창업자가 짚은 「채워져요」는
//    **다 쓴 뒤에만** 뜨는 줄이라, 기본 화면만 찍으면 그 문구를 «영영 못 본다».
//    🔢 실측 = 웰컴 중(알약 두 줄) / 웰컴 다 쓰고 넉넉(회색 한 줄) / 아예 0개(소진 카드) = 세 갈래
//
// ⚠️ 폭이 판정 요소다 — 「무료열쇠 5개」가 길어져 줄이 넘어가면 그게 곧 판정거리다(절대원칙 21).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-무료열쇠-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/무료열쇠'
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
await new Promise((r) => srv.listen(4422, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()

// [이름, 저장할 잔량, 설명]
//   ⛔ `hankki:ocrLeft` 가 «없으면» 웰컴 20개로 시작한다(서버 응답 전) — 그게 첫 화면이다
const 갈래 = [
  ['1-웰컴중', null, '갓 깐 사람 — 웰컴 20개'],
  ['2-웰컴다씀', { welcome: 0, month: 5 }, '웰컴을 다 쓰고 그 달 5개 남음'],
  ['3-소진', { welcome: 0, month: 0 }, '이번 달을 다 씀 — 「채워져요」가 여기 뜬다'],
]

const 잰값 = []
for (const [이름, 값, 설명] of 갈래) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((v) => {
    try {
      localStorage.setItem('hankki:onboarded', '1')
      if (v) localStorage.setItem('hankki:ocrLeft', JSON.stringify(v))
      else localStorage.removeItem('hankki:ocrLeft')
    } catch { /* noop */ }
  }, 값)
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4422/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
    t?.click()
  })
  await page.waitForTimeout(1300)

  // 🔢 카드 «자체»를 재서 찍는다 — 자리를 손으로 적으면 화면이 바뀔 때마다 낡는다
  const 상자 = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')]
      .find((x) => /남았어요|다 썼어요/.test(x.innerText || '')
        && ![...x.children].some((c) => /남았어요|다 썼어요/.test(c.innerText || '')))
    let 카드 = el
    for (let i = 0; i < 6 && 카드; i++) {
      const r = 카드.getBoundingClientRect()
      if (r.height > 90) break
      카드 = 카드.parentElement
    }
    if (!카드) return null
    const r = 카드.getBoundingClientRect()
    return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), w: Math.min(390, r.width + 20), h: r.height + 20, 글: (카드.innerText || '').replace(/\s+/g, ' ').trim() }
  })
  if (!상자) { console.log(`⛔ ${이름} — 잔량 카드를 못 찾았다`); continue }
  await page.screenshot({ path: join(OUT, `${이름}.png`), clip: { x: 상자.x, y: 상자.y, width: 상자.w, height: 상자.h } })
  잰값.push({ 갈래: 이름, 설명, 키: Math.round(상자.h), 글: 상자.글.slice(0, 56) })
  await ctx.close()
}
console.table(잰값)
console.log(`📁 ${OUT}`)
await b.close(); srv.close()
