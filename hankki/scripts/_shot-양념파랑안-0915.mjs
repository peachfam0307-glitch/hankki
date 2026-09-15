// 🔵🧂 [2026-09-15] **대괄호 줄을 «자리는 그대로 두고» 파랑 글씨로** — 창업자 안.
//
// 📮 창업자 = *"이게.. 양념이 오른쪽으로 일괄 이동을하면 양념이 많은 판은 애매해질거야.
//    차라리 그대로두고 대괄호 양념을 파랑글씨로 바꾸는게 어때"*
//
// ⭐⭐ **창업자 걱정이 숫자로 맞다** (`basics.js` 를 열어서 셌다 · ⛔짐작 아님)
//    · 대괄호 줄이 있는 편 = **94편 / 203편** — 절반 가까이다
//    · 제일 많은 편 = **샤브샤브 재료 29개 · 대괄호 4개**
//      (`[찍어 먹는 소스]` `[참깨 소스 — 골라 먹어요]` `[고마다래 소스 — 골라 먹어요]` `[죽 만들기 — 남은 국물로]`)
//    📌 앞선 A·B·C 안은 소제목을 «칸 전체»로 폈다 → 대괄호가 넷이면 2열 흐름이 네 번 끊긴다.
//       **꽃게탕(대괄호 1개)만 보고 「좋다」고 한 것이 좁았다.**
//
// 🔵 **「파랑」은 이미 우리 색이다** — `styles.css:7` `--brown: #5878a0` 이 실은 «더스티 블루»다
//    (주석 = *"포인트 = 더스티 블루 (전 테마 통일 포인트)"*). 상세의 `.ing-head` 도 이 색을 쓴다.
//    ⛔ 새 색을 지어내지 않는다.
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
await new Promise((r) => srv.listen(4505, r))
const OUT = process.env.SHOT_OUT || '/tmp/양념파랑0915'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

// 🔵 대괄호 줄에 이름표만 붙인다 — **자리도 체크박스도 안 건드린다.**
//    ⛔ 대괄호 줄이 «없는» 편엔 아무것도 만들지 않는다 —
//       📮 창업자 = *"안붙으면 굳이 붙이지말고. 붙어 있는 건 파랑색글자로"*
//       🔢 있는 편 94 · 없는 편 109 (`basics.js` 실측)
function 표시하기() {
  const 대괄호만 = (s) => /^\[[^\]]+\]$/.test(String(s).trim())
  let n = 0
  let 본디 = 0
  for (const 칸 of [...document.querySelectorAll('.cook-ing')]) {
    if (!본디) 본디 = parseFloat(getComputedStyle(칸).fontSize)
    if (!대괄호만(칸.textContent)) continue
    칸.classList.add('안-파랑')
    const 줄 = 칸.closest('.cook-ing-row'); if (줄) 줄.classList.add('안-파랑줄')
    n++
  }
  document.documentElement.style.setProperty('--안-본디', `${본디}px`)
  return { 대괄호줄: n, 본디글자: 본디 }
}

// 📐 창업자 확정 (2026-09-15 19:50)
//    *"요리모드에 재료칸에 글자가 많으니까. 거기만 1px씩 줄이고, 대신 양념은 파랑색글씨로 잘보이게. 사이즈는 같게"*
//    ⭐ 둘을 가른다 — **재료 줄은 −1px · 대괄호 줄은 «본디 크기 그대로» ＋ 파랑.**
//    ⛔ 대괄호 줄까지 같이 줄이면 「잘 보이게」가 안 된다.
const 파랑 = `.안-파랑{ color:var(--brown) !important; font-weight:800; font-size:var(--안-본디) !important }`
const 한px작게 = `.cook-ing{ font-size:calc(var(--안-본디) - 1px) !important }`

const 안들 = {
  '지금': '',
  // ⭐ D = 창업자 안 «그대로» — 자리·체크박스 다 두고 **색만** 파랑 ＋ 굵게
  'D-파랑만': 파랑,
  // ⭐⭐ G = **창업자 확정안** — 재료 −1px ＋ 대괄호는 본디 크기 파랑
  'G-재료1px작게＋파랑': `${한px작게}\n${파랑}`,
  // ⭐ H = G ＋ **체크박스만 숨긴다** — 소제목은 체크할 것이 아니다. 자리는 그대로
  'H-G＋체크없음': `${한px작게}\n${파랑}\n.안-파랑줄 .cook-ing-box{ visibility:hidden }`,
}

// ⛔ 「샤브샤브」는 레시피 탭에 «안 떠 있었다»(아직 안 열린 편이다) — 첫 판이 여덟 칸을 헛돌았다.
//    ✅ 그래서 «후보를 여럿» 두고 화면에 실제로 있는 편을 쓴다.
//    📌 대괄호가 둘 이상인 편으로 봐야 한다 — 하나뿐인 편만 보면 창업자가 짚은 그 문제를 못 본다.
for (const 편 of ['부대찌개', '마파두부', '간장 제육볶음', '꽃게탕']) {
  for (const [이름, w, h] of [['패드세로', 834, 1194], ['폰', 390, 844]]) {
    for (const [안이름, css] of Object.entries(안들)) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR' })
      await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
      const p = await ctx.newPage()
      await p.goto('http://127.0.0.1:4505/hankki/', { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(2600); await 치우기(p)
      await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
      // 🔎 그 편을 찾아 연다 — ⛔첫 카드를 쓰면 대괄호가 하나뿐인 편만 보게 된다
      const 카드 = p.locator('.grid-card').filter({ hasText: 편 }).first()
      if (await 카드.count() === 0) { await ctx.close(); continue }   // 화면에 없는 편은 조용히 건너뛴다
      await 카드.click(); await p.waitForTimeout(1100); await 치우기(p)
      await p.locator('button', { hasText: '요리모드 시작' }).first().click(); await p.waitForTimeout(1500); await 치우기(p)
      // ⛔⛔ **순서가 중요하다** — 먼저 «본디 글자 크기»를 재고, «그 다음» CSS 를 넣는다.
      //    첫 판은 거꾸로였다: `calc(var(--안-본디) - 1px)` 에서 변수가 아직 없어 font-size 가 통째로
      //    무효가 됐고, 그 «무효가 된 값»을 본디로 읽어서 **글자가 1px 이 아니라 확 작아졌다.**
      //    📌 눈으로 보고서야 잡았다(절대원칙 21) — 숫자만 봤으면 그냥 넘어갔다.
      const n = await p.evaluate(표시하기)
      if (css) await p.addStyleTag({ content: css })
      await p.waitForTimeout(400)
      await p.screenshot({ path: join(OUT, `${편}-${이름}-${안이름}.jpg`), type: 'jpeg', quality: 76 })
      console.log(`  [${편}·${이름}] ${안이름.padEnd(16)} 대괄호 줄 ${n}개`)
      await ctx.close()
    }
  }
}
await b.close(); srv.close()
console.log(`\n📂 시안 = ${OUT}`)
