// 📐📐 [2026-09-15] **큰 패드(1366)에서 빈 자리를 어떻게 메울까 — «시안»을 렌더해서 보여준다.**
//
// 📮 창업자 = *"이걸 시안을 보여줘야지 설명만으로는 무슨문제가 있는지 몰라"* — 맞는 말이다.
//
// ⛔⛔ 이 판은 **파일을 한 글자도 안 고친다.** CSS 를 «주입»만 해서 찍는다(규칙 11 · `_shot-패드안-0826.mjs` 와 같은 방법).
//    무엇을 쓸지는 창업자가 보고 고른다.
//
// 🔢 고치려는 것 (2026-09-15 실측 · `_shot-패드지금-0915.mjs` · 문서 §12)
//    ② 홈 「추석 특집」 상자의 «왼쪽 절반»이 빈다 — 글만 왼쪽, 카드 넉 장은 오른쪽
//    ③ 홈 「이번 주 제철」·「이번 주 한끼」 — 카드가 상자 오른쪽으로 몰려 왼쪽이 빈다
//    ⑤ 가져오기 네 갈래 줄이 **1300px** 로 늘어난다 — 최대 폭 제한이 없다
//
// ⛔⛔ 모든 안을 **`@media (min-width: 1100px)`** 로 감싼다 —
//    **폰(390)·패드세로(834)·패드가로(1194 이하)는 한 픽셀도 안 바뀐다.**
//    📌 1194 는 «가로 패드»라 지금도 꽉 차 보인다. 비는 건 1366 부터다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4495, r))

const OUT = process.env.SHOT_OUT || '/tmp/패드안0915'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const W = 1366, H = 1024

// ── 🏠 홈 ─────────────────────────────────────────────────────────
const 홈안 = {
  '지금': '',
  // ⭐ A = 「카드를 키운다」 — 칸은 그대로 두고 카드만 150 → 220px
  //    가장 적게 건드린다. 다만 «글 칸»은 여전히 절반이라 왼쪽이 조금 남는다.
  'A-카드키움': `@media (min-width:1100px){
      .weekly-row.rail > .mini-card{ flex-basis:220px }
      .week-pair.two .weekly-box > .weekly-row{ justify-content:start }
    }`,
  // ⭐⭐ B = 「칸 비율을 바꾼다」 — 글 40% · 카드 60% ＋ 카드도 키운다
  //    빈 자리의 «뿌리»가 「글 칸이 절반이나 되는 것」이라 이쪽이 근본이다.
  'B-칸비율': `@media (min-width:1100px){
      .weekly-box{ grid-template-columns:minmax(0,0.72fr) minmax(0,1.28fr) }
      .weekly-row.rail > .mini-card{ flex-basis:200px }
      .week-pair.two .weekly-box > .weekly-row{ justify-content:start }
    }`,
  // ⭐⭐⭐ C = 「한가운데로 모은다」 — 앱 몸통에 최대 폭을 준다
  //    ⛔ 화면을 더 넓게 쓰는 게 아니라 «안 넓히는» 길이다. 글줄이 눈으로 따라가기 쉬워진다.
  'C-몸통최대폭': `@media (min-width:1100px){
      .screen > *{ max-width:1180px; margin-inline:auto }
    }`,
}

// ── 📥 가져오기 ───────────────────────────────────────────────────
const 가져오기안 = {
  '지금': '',
  // ⭐ A = 한가운데로 모은다(860px) — 폰·패드세로에서 보던 그 모양 그대로.
  //    ⛔ 첫 판은 `.imp-opts` 만 모았더니 **제목과 아래 줄만 전폭으로 남아 어긋나 보였다**(눈으로 잡았다).
  //    ✅ 그래서 화면 «몸통 전체»를 모은다 — 아래에서 `안몸통` 클래스를 붙여 준다.
  'A-가운데모음': `@media (min-width:1100px){
      .안몸통{ max-width:860px; margin-inline:auto }
    }`,
  // ⭐ B = 두 칸으로 — 네 갈래가 2×2 로 선다. 한눈에 다 보인다
  'B-두칸': `@media (min-width:1100px){
      .imp-opts{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px }
    }`,
}

async function 화면열기(css, 어디) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4495/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600)
  await 길막치우기(p)
  if (어디 === '가져오기') {
    try { await p.locator('.bottom-nav .nav-item-import').first().click({ timeout: 3000 }); await p.waitForTimeout(900) } catch { /* noop */ }
    await 길막치우기(p)
  }
  // 🏷 「몸통 전체를 모으는」 안을 그리려면 그 몸통에 이름표가 있어야 한다.
  //    ⛔ 앱 코드를 고치지 않는다 — 이 판에서만 클래스를 붙인다(시안이다).
  await p.evaluate(() => {
    const 통 = document.querySelector('.imp-opts')
    if (!통) return
    let e = 통
    while (e.parentElement && !e.parentElement.classList.contains('screen')) e = e.parentElement
    e.classList.add('안몸통')
  })
  if (css) await p.addStyleTag({ content: css })
  await p.waitForTimeout(700)
  return { ctx, p }
}

// 🚪 온보딩 시트·코치마크를 치운다 (`_shot-패드지금-0915.mjs` 와 같은 것)
async function 길막치우기(p) {
  for (let i = 0; i < 12; i++) {
    for (const 것 of [
      p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first(),
      p.locator('[aria-label="다음 안내 보기"]').first(),
      p.locator('button', { hasText: /^(시작|다음|시작하기|확인|알겠어요|닫기|건너뛰기)/ }).first(),
    ]) {
      if (await 것.count() > 0 && await 것.isVisible().catch(() => false)) {
        try { await 것.click({ timeout: 2500 }); await p.waitForTimeout(700) } catch { /* 다음 갈래로 */ }
      }
    }
    const 남았나 = await p.locator('.sheet-mask, [aria-label="다음 안내 보기"]').count()
    if (남았나 === 0) break
  }
}

// 📏 「빈 자리」를 숫자로 — ⛔그림만 보면 「좀 나아 보인다」로 끝난다
async function 재기(p, 어디) {
  return p.evaluate((어디) => {
    const 반올림 = (n) => Math.round(n)
    if (어디 === '가져오기') {
      const 줄 = document.querySelector('.imp-opt')
      const 통 = document.querySelector('.imp-opts')
      if (!줄) return null
      return { 한줄폭: 반올림(줄.getBoundingClientRect().width), 통높이: 통 ? 반올림(통.getBoundingClientRect().height) : 0 }
    }
    const rail = document.querySelector('.weekly-row.rail')
    const 카드 = rail && rail.querySelector('.mini-card')
    const 상자 = rail && rail.closest('.weekly-box')
    if (!rail || !카드 || !상자) return null
    const r = rail.getBoundingClientRect(), s = 상자.getBoundingClientRect()
    // 마지막 카드 오른쪽 끝 ~ 상자 오른쪽 끝 = 안 쓰는 자리
    const 카드들 = [...rail.querySelectorAll('.mini-card')]
    const 끝 = 카드들.length ? Math.max(...카드들.map((e) => e.getBoundingClientRect().right)) : r.left
    return {
      카드폭: 반올림(카드.getBoundingClientRect().width),
      글칸: 반올림(r.left - s.left),
      안쓰는자리: 반올림(s.right - 끝),
      상자폭: 반올림(s.width),
    }
  }, 어디)
}

console.log(`\n📐 큰 패드 ${W}×${H} — 「지금」과 「안」을 나란히\n`)
for (const [어디, 안들] of [['홈', 홈안], ['가져오기', 가져오기안]]) {
  console.log(`\n${'='.repeat(62)}\n  ${어디}\n${'='.repeat(62)}`)
  for (const [이름, css] of Object.entries(안들)) {
    const { ctx, p } = await 화면열기(css, 어디)
    const v = await 재기(p, 어디)
    await p.screenshot({ path: join(OUT, `${어디}-${이름}.jpg`), type: 'jpeg', quality: 72 })
    console.log(`  ${이름.padEnd(12)} ${v ? JSON.stringify(v) : '(못 쟀다)'}`)
    await ctx.close()
  }
}
await b.close(); srv.close()
console.log(`\n📂 시안 = ${OUT}`)
