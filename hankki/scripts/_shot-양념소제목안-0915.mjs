// 🧂🧂 [2026-09-15] **요리모드에서 「[양념]」을 소제목으로** — 시안을 렌더해서 보여준다.
//
// 📮 창업자 = *"어떻게 소제목으로 보여줘?? 시안보여줘"*
//
// 🔢 확인한 사실 (⛔짐작 아니다 · 파일을 열어서 봤다)
//    · **레시피 «상세»엔 이미 그 처리가 있다** — `RecipeDetailScreen.jsx:102-104` 의 `isIngHeader`
//      = `/^\[[^\]]+\]$/` 인 줄(대괄호만 있는 줄)을 **소제목으로 그리고 장보기 담기·인분 환산에서 뺀다.**
//    · 그 소제목 생김새도 **창업자가 이미 확정했다** — `styles.css:1662` `.ing-head`
//      = 17px · 굵기 800 · `--brown` · 불릿 없음 (2026-08-22 *"재료 줄(18px)보다 한 단 작게"*)
//    ⭐⭐ 그러니 **새로 정할 것이 없다.** 요리모드 0단계(재료 준비)만 그 처리를 «안 하고» 있다.
//       → `CookScreen.jsx:184` 가 `ings.map` 을 그냥 다 체크박스 줄로 그린다.
//
// ⛔ 이 판은 **앱 소스를 한 글자도 안 고친다.** 화면에 그려진 것을 «주입»으로 바꿔 찍을 뿐이다(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4503, r))
const OUT = process.env.SHOT_OUT || '/tmp/양념안0915'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

// 🧂 「대괄호만 있는 줄」을 찾아 소제목으로 바꾼다 — 상세의 `isIngHeader` 와 «같은 잣대»를 쓴다.
//    ⛔ 잣대를 새로 지어내지 않는다. 두 벌이 되면 반드시 갈린다(2026-09-12 사고).
const 바꾸기 = (안) => `(${(안) => {
  const 대괄호만 = (s) => /^\[[^\]]+\]$/.test(String(s).trim())
  for (const 줄 of [...document.querySelectorAll('.cook-ing-row')]) {
    const 글칸 = 줄.querySelector('.cook-ing')
    if (!글칸 || !대괄호만(글칸.textContent)) continue
    const 이름 = 글칸.textContent.trim().replace(/^\[|\]$/g, '')
    const 소제목 = document.createElement('div')
    소제목.className = '안-소제목'
    소제목.textContent = 안 === 'C' ? `— ${이름} —` : 이름
    줄.replaceWith(소제목)
  }
}})(${JSON.stringify(안)})`

const 안들 = {
  '지금': { 스타일: '', 손질: null },
  // ⭐ A = **상세와 «똑같이»** — 17px · 800 · brown · 불릿 없음 (`styles.css:1662` `.ing-head`)
  //    ⛔ 다만 요리모드 재료는 «손글씨체»라 그 결을 따른다(창업자 2026-09-01 *"귀염체로"*).
  'A-상세와같이': {
    스타일: `.안-소제목{ font-family:inherit; font-size:20px; font-weight:800; color:var(--brown); margin:16px 0 4px; grid-column:1/-1 }`,
    손질: 'A',
  },
  // ⭐ B = A ＋ **얇은 줄**을 그어 「여기부터 양념」을 눈으로 가른다
  'B-줄긋기': {
    스타일: `.안-소제목{ font-family:inherit; font-size:20px; font-weight:800; color:var(--brown);
      margin:18px 0 6px; padding-bottom:5px; border-bottom:1.5px solid var(--line, #e3ddd3); grid-column:1/-1 }`,
    손질: 'B',
  },
  // ⭐ C = **가운데에 「— 양념 —」** — 손글씨 결에 제일 가깝다
  'C-가운데': {
    스타일: `.안-소제목{ font-family:inherit; font-size:20px; font-weight:800; color:var(--brown);
      margin:18px 0 6px; text-align:center; grid-column:1/-1 }`,
    손질: 'C',
  },
}

for (const [이름, w, h] of [['패드세로', 834, 1194], ['폰', 390, 844]]) {
  for (const [안이름, 안] of Object.entries(안들)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR' })
    await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
    const p = await ctx.newPage()
    await p.goto('http://127.0.0.1:4503/hankki/', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2600); await 치우기(p)
    await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
    await p.locator('.grid-card').first().click(); await p.waitForTimeout(1000); await 치우기(p)
    await p.locator('button', { hasText: '요리모드 시작' }).first().click(); await p.waitForTimeout(1500); await 치우기(p)
    if (안.스타일) await p.addStyleTag({ content: 안.스타일 })
    if (안.손질) await p.evaluate(바꾸기(안.손질))
    await p.waitForTimeout(500)
    await p.screenshot({ path: join(OUT, `${이름}-${안이름}.jpg`), type: 'jpeg', quality: 76 })
    const 남았나 = await p.evaluate(() => [...document.querySelectorAll('.cook-ing')].filter((e) => /^\[[^\]]+\]$/.test(e.textContent.trim())).length)
    console.log(`  [${이름}] ${안이름.padEnd(12)} 대괄호 줄 ${남았나}개 남음`)
    await ctx.close()
  }
}
await b.close(); srv.close()
console.log(`\n📂 시안 = ${OUT}`)
