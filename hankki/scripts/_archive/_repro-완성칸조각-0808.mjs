// 🔬 재현 — 「완성 칸의 음식 조각이 칸 «밖»으로 나가 단계 글자를 덮는다」
//
// 📮 창업자 폰 캡처 (2026-08-08 밤 · v10.03) — 돼지고기김치두루치기 상세에서
//    🍓 딸기가 4번 단계 아래에, 🍔 햄버거가 5번 단계 「볶」 글자 위에 떠 있었다.
//    창업자 말 = *"글씨를 올라가면서 가려. 근데 이건 위로 올라가는 거라 어쩔 수 없긴한데.."*
//    ⛔ **어쩔 수 없는 게 아니다.** 아래 숫자가 그걸 보여준다.
//
// 🎯 재는 것 = **조각의 화면 y 가 `.done-strip` 위쪽 경계보다 몇 px 위인가.**
//    ⛔ 「예쁜가」를 묻지 않는다 — 숫자로 «칸을 넘었나»만 본다(규칙 11: 미감은 창업자 몫).
//
// 🐛 원인 = `Stickers.jsx` 의 `rel()` 이 **스티커가 238px 라고 못 박혀 있다**
//      const STICKER_PX = 238
//      const rel = (size, pct) => pct / (size / STICKER_PX) + '%'
//    꾸미기 캔버스에 붙는 스티커는 진짜로 238px 라 맞는 값이다.
//    ⛔ 그런데 완성 칸 꼬르곰은 **46px** 이다 → 이동 거리가 **5.2배**로 튄다.
//    ⭐ v9.94 의 *"퍼센트 좌표는 상자 «모양»을 탄다"* 와 같은 계열인데, 이번엔 «크기» 다.
//
// ⚠️⚠️ **왜 검수판이 못 잡았나** — `_shot-detail-hl.mjs`·`_shot-detail-motion.mjs` 는
//    **완성 칸 요소만 잘라** 찍는다. 칸 «위»는 사진에 아예 안 들어왔다.
//    📌 **「칸 안에서 예쁜가」만 봤고 「칸 밖으로 나가나」는 아무도 안 봤다.**
//
// 🔁 애니메이션이 도니까 **여러 시점에 재서 «가장 높이 올라간» 값**을 쓴다.
//    한 순간만 재면 조각이 마침 바닥에 있을 때라 «안 나간다»고 거짓 통과한다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4371, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const ok = (b, m) => console.log(`${b ? '✅' : '⛔'} ${m}`)
let bad = 0

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => { console.log('⛔ pageerror:', String(e.message).split('\n')[0]); bad++ })

await page.addInitScript((a) => {
  localStorage.setItem('hankki:v1', JSON.stringify(a.s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, { s: { recipes: [], seedV: BASICS_VERSION } })

await page.goto('http://127.0.0.1:4371/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.locator('.grid-card').first().click()
await page.waitForTimeout(800)

const strip = page.locator('.done-strip')
if (!(await strip.count())) { console.log('⛔ 완성 칸이 아예 없다 — 화면부터 확인'); await b.close(); process.exit(1) }
await strip.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

// ── 여러 시점에 재서 「가장 높이 올라간」 값을 쓴다 ─────────────────
const SHOTS = 16          // 3초 주기 ＋ 조각 지연 2.3초 → 약 6.7초를 덮는다
let worst = null
for (let i = 0; i < SHOTS; i++) {
  const m = await page.evaluate(() => {
    const s = document.querySelector('.done-strip')
    if (!s) return null
    const sr = s.getBoundingClientRect()
    const parts = [...document.querySelectorAll('.done-strip .hk-fx')].map((el) => {
      const r = el.getBoundingClientRect()
      return { over: sr.top - r.top }   // over > 0 이면 칸 위로 나갔다
    })
    const steps = [...document.querySelectorAll('.step')]
    const last = steps.length ? steps[steps.length - 1].getBoundingClientRect() : null
    return { stripTop: sr.top, stripH: sr.height, parts, lastStepBottom: last ? last.bottom : null }
  })
  if (m && m.parts.length) {
    const top = Math.max(...m.parts.map((p) => p.over))
    if (!worst || top > worst.over) worst = { ...m, over: top }
  }
  await page.waitForTimeout(420)
}

console.log('')
console.log('──────── 실측 ────────')
if (!worst) { console.log('⛔ 조각(.hk-fx)을 하나도 못 찾았다 — 효과가 안 붙은 것'); await b.close(); process.exit(1) }
console.log(`  완성 칸 높이        ${Math.round(worst.stripH)}px`)
console.log(`  조각 개수           ${worst.parts.length}개`)
console.log(`  칸 위로 나간 최대   ${Math.round(worst.over)}px`)
if (worst.lastStepBottom != null) {
  const gap = Math.round(worst.stripTop - worst.lastStepBottom)
  console.log(`  마지막 단계 ↔ 칸    ${gap}px`)
  console.log(`  → 조각이 ${Math.round(worst.over)}px 올라가면 단계 글자를 ${worst.over > gap ? '⛔ 덮는다' : '안 덮는다'}`)
}
console.log('')

// ── 판정 ──────────────────────────────────────────────────────
// 칸 안에 머물러야 한다. 살짝(≤2px) 걸치는 건 반올림 오차로 본다.
ok(worst.over <= 2, `조각이 완성 칸 «안»에 머문다 (칸 밖 ${Math.round(worst.over)}px · 허용 2px)`)
if (worst.over > 2) bad++

ok(bad === 0, 'pageerror 0')
await b.close()
srv.close()
process.exit(bad ? 1 : 0)
