// 🛒🛒 [2026-09-15] **레시피 상세의 「주부의 장바구니」를 어떻게 더 보이게 할까** — 시안.
//
// 📮 창업자 = *"큐레이션 시안 3장 만들어줘"*
//
// ⭐ 먼저 확인한 것 = **자리는 이미 좋다.** `RecipeDetailScreen.jsx:986` 주석 =
//    *"재료 바로 밑 · 수익 연결"* — 내가 «자리를 올리자»고 한 것은 이미 돼 있었다. 그 안은 버린다.
//
// 🔢 그래서 무엇이 문제인가 (09-15 GA4)
//    · `detail` = 10명 · 10초  ← 상세엔 오는데 **10초**다. 스크롤해서 재료 밑까지 갈 시간이 아니다.
//    · `shop`   = 2명 · 3초
//    👉 「자리」가 아니라 **「눈에 안 띈다」 · 「10초 안에 안 보인다」** 쪽을 건드린다.
//
// ⛔ 이 판은 **앱 소스를 한 글자도 안 고친다.** 주입으로 그려서 보여줄 뿐이다(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4509, r))
const OUT = process.env.SHOT_OUT || '/tmp/큐레안'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

const 안들 = {
  '지금': '',
  // ⭐ A = **상자를 눈에 띄게** — 크림 바탕 ＋ 포인트 테두리 ＋ 제목 키움
  //    ⛔ 색을 새로 만들지 않는다 — `--cream` 과 `--brown`(앱 포인트 색)만 쓴다.
  'A-눈에띄게': `
    .pick-wrap, .picks, [data-pick], .sec-head + .card { }
    .picks-box, .pick-box { background:var(--cream) !important; border:1.5px solid var(--brown) !important; border-radius:16px }
  `,
  // ⭐ B = **「이 재료 다 담기」를 큰 단추로** — 지금은 아래 묻혀 있다
  'B-담기단추크게': `
    button:has-text("재료 다 담기"), .pick-add-all {
      background:var(--brown) !important; color:#fff !important;
      font-size:18px !important; font-weight:800 !important; padding:15px !important; border-radius:14px !important }
  `,
  // ⭐ C = **접힌 것을 편다** — 지금 4칸에서 접혀 「더 보기」를 눌러야 한다
  'C-펼쳐두기': `.pick-more, button:has-text("더 보기") { display:none !important }`,
}

for (const [이름, css] of Object.entries(안들)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4509/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
  await p.locator('.grid-card').first().click(); await p.waitForTimeout(1100); await 치우기(p)
  if (css) await p.addStyleTag({ content: css })
  // 🛒 큐레이션 상자까지 내려간다 — ⛔「몇 번 굴려야 보이나」도 같이 잰다
  const 잰값 = await p.evaluate(() => {
    const 제목 = [...document.querySelectorAll('div,h3,span')].find((e) => (e.textContent || '').trim() === '주부의 장바구니에서 고른 재료')
    if (!제목) return { 못찾음: true }
    const r = 제목.getBoundingClientRect()
    const 위에서 = Math.round(r.top + window.scrollY)
    제목.scrollIntoView({ block: 'center' })
    return { 화면위에서: 위에서, 화면높이: window.innerHeight, 굴림: +(위에서 / window.innerHeight).toFixed(1) }
  })
  await p.waitForTimeout(700)
  await p.screenshot({ path: join(OUT, `${이름}.jpg`), type: 'jpeg', quality: 76 })
  console.log(`  ${이름.padEnd(12)} ${JSON.stringify(잰값)}`)
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
