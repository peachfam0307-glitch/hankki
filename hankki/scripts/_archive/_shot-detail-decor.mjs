// 🎨 상세 꾸미기 시안 검수판 — 지금 ／ A ／ B ／ C 를 «나란히» (2026-08-08)
//   ⛔ 규칙 13 — 창업자가 고화질로 보고 정한다. 내 판정으로 대신하지 않는다.
//   ⭐ 한 장씩 따로 보면 「그럭저럭 괜찮네」가 된다 — **나란히 놓아야 갈린다**(오늘 fe_113 이 그랬다).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4362, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let bad = 0
const rows = []

// ⭐⭐ 두 레시피로 본다 — 재료가 적은 것(콩국수 7줄)과 많은 것(제육볶음 14줄).
//    ⛔ 한 편만 보면 매칭률 착시가 난다. 콩국수만 보면 「2/7 뿐」이라 시안이 과소평가된다.
const RECIPES = [['콩국수', ''], ['제육볶음', '제육']]
for (const [rname, q] of RECIPES)
for (const [mode, label] of [
  ['off', '지금'],
  ['a', 'A · 단계마다 꼬르곰'], ['b', 'B · 재료 줄 아이콘'], ['c', 'C · 절 머리 한 컷'],
  ['d', 'D · 절 머리가 움직인다'], ['e', 'E · 번호가 꼬르곰 얼굴'],
  ['f', 'F · 조리법 스티커'], ['g', 'G · 맨 끝에 완성 칸'],
]) {
  // ⛔ 창이 낮으면 절이 잘리고 «고정 하단바»가 그 위를 덮는다(첫 판이 그랬다).
  //    창을 높여 절 전체가 한 화면에 들어오게 한다. dpr 2 = 판 크기와 선명함의 절충.
  const page = await b.newPage({ viewport: { width: 360, height: 1900 }, deviceScaleFactor: 2 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION })
  await page.goto(`http://127.0.0.1:4362/hankki/?decor=${mode}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  if (q) {
    // 홈 검색으로 찾아 들어간다 — 「최근 저장」 첫 칸만 보면 늘 같은 레시피다.
    // ⛔ 홈의 검색줄은 «입력칸이 아니라 버튼»이다(눌러야 검색 화면이 뜬다) — 첫 판에서 여기서 30초 멈췄다.
    await page.locator('.searchbar').first().click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder="검색어를 입력하세요"]').fill(q)
    await page.waitForTimeout(800)
  }
  const card = page.locator('.grid-card').first()
  if (!(await card.count())) { bad++; console.log(`   ⛔ ${rname} — 카드를 못 찾았다`); await page.close(); continue }
  await card.click()
  await page.waitForTimeout(900)
  const shown = await page.locator('.ing').count()
  if (q && shown < 10) { bad++; console.log(`   ⛔ ${rname} 인 줄 알았는데 재료가 ${shown}줄 — 엉뚱한 레시피를 열었다`) }

  // 그림이 실제로 «몇 개» 늘었나 — 눈으로만 보면 「있는 것 같다」가 된다
  const n = await page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)]
    const img = (s) => q(s).reduce((a, e) => a + e.querySelectorAll('img').length, 0)
    return {
      ing: q('.ing').length, ingCut: img('.ing'),
      step: q('.step').length, stepCut: img('.step:not(:has(.n-gom)) '),
      head: q('.sec-head img').length,
      // ⭐ E·G 는 «줄 폭을 안 먹는» 갈래라 따로 센다 — 위 숫자에 섞으면 「0」으로 읽혀 오해한다
      face: q('.n-gom').length, done: q('.done-strip').length,
      broken: q('img').filter((i) => i.complete && i.naturalWidth === 0).length,
    }
  })
  rows.push({ label: `${rname} / ${label}`, ...n, err: errors.length })
  if (n.broken) { bad++; console.log(`   ⛔ ${label} — 깨진 그림 ${n.broken}장`) }
  if (errors.length) { bad++; console.log(`   ⛔ ${label} — pageerror ${errors.length}: ${errors[0]}`) }

  // 재료 첫 줄부터 만드는 법 끝까지 한 화면에 — 그래야 「덜 심심한가」가 보인다
  //   ⛔ clip 좌표를 손으로 계산하면 어긋난다(오늘 두 번 겪었다) — 두 절을 감싼 «요소»에 표를 붙여 직접 찍는다
  await page.evaluate(() => {
    const head = [...document.querySelectorAll('.sec-head')].find((h) => /재료/.test(h.textContent))
    const steps = [...document.querySelectorAll('.step')]
    const last = steps[steps.length - 1]
    const wrap = document.createElement('div')
    wrap.id = 'shot-wrap'
    head.parentNode.insertBefore(wrap, head)
    let n = wrap.nextSibling
    while (n) { const next = n.nextSibling; wrap.appendChild(n); if (n.contains(last)) break; n = next }
    wrap.style.padding = '8px 0 14px'
  })
  const wrap = page.locator('#shot-wrap')
  const bb = await wrap.boundingBox()
  if (!bb || bb.height < 300) { bad++; console.log(`   ⛔ ${label} — 감싼 칸이 ${Math.round(bb?.height || 0)}px 뿐이다. 잘렸다`) }
  await wrap.screenshot({ path: `${OUT}/시안-${rname}-${mode}.png` })
  await page.close()
}

console.log('\n   ┌ 갈래 ─────────────────────── 재료줄 · 단계그림 · 절머리 · 얼굴번호 · 완성칸')
for (const r of rows) console.log(`   │ ${r.label.padEnd(28)} ${String(r.ingCut).padStart(3)}/${String(r.ing).padEnd(3)}  ${String(r.stepCut).padStart(3)}/${String(r.step).padEnd(3)}    ${r.head}       ${r.face}        ${r.done}`)
console.log(`\n   ${bad ? `⛔ 문제 ${bad}건` : '✅ 깨진 그림 0 · pageerror 0'}`)

await b.close(); srv.close()
console.log(`📁 ${OUT}/시안-{콩국수,제육볶음}-{off,a,b,c}.png`)
