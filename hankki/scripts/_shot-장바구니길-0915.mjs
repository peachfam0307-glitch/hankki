// 🛒🛒 [2026-09-15] **큐레이션 자리를 어떻게 바꿀까 — 창업자 안 셋을 그려본다.**
//
// 📮 창업자 = *"큐레이션이 되게 제한적이야. 다 올리면 레시피보는데 방해되서 3-4개정도만 올렸거든"*
//    ＋ *"또 계속 반복되니까 흠… 그걸 작게 «주부의 장바구니 탭으로 바로 가기»를 그냥 만들까 싶기도 하고
//       (큐레이션 광고를 빼고)"*
//
// 🔢 왜 바꾸나 (2026-09-15 실측)
//    · 큐레이션 상자가 화면 위에서 **750px** 아래 (화면 844px) — 거의 한 판을 다 내려야 나온다
//    · `detail` 체류 = **10초** → 거기까지 «안 내려간다»
//    · `buy_pick_detail` 오늘 **0건** (계측은 `stats.js:426` 에 이미 있다)
//
// ⛔ 이 판은 **앱 소스를 한 글자도 안 고친다.** 주입으로 그려 보여줄 뿐이다(규칙 11).
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
await new Promise((r) => srv.listen(4511, r))
const OUT = process.env.SHOT_OUT || '/tmp/장바구니길'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

// 🧰 큐레이션 상자를 찾아 손본다 — `data-coach="pantry"` 가 그 상자다(RecipeDetailScreen.jsx:988)
const 손질 = {
  '지금': () => {},
  // ⭐ A = **창업자 안 그대로** — 제품 카드를 빼고 «한 줄 바로가기»만 남긴다
  'A-바로가기한줄': () => {
    const 상자 = document.querySelector('[data-coach="pantry"]')
    if (!상자) return
    const 줄 = document.createElement('button')
    줄.className = 'press'
    줄.setAttribute('style', 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;'
      + 'margin-top:16px;padding:13px 15px;border-radius:14px;background:var(--cream);'
      + 'border:1.5px solid var(--cream-deep);color:var(--brown);font-weight:800;font-size:16px')
    줄.innerHTML = '<span>🧺 주부의 장바구니에서 재료 보기</span><span style="opacity:.55">›</span>'
    상자.replaceWith(줄)
  },
  // ⭐ B = A ＋ **재료 칸 «바로 밑»으로 올린다** (지금은 만드는 법 뒤에 있다)
  'B-바로가기＋위로': () => {
    const 상자 = document.querySelector('[data-coach="pantry"]')
    if (!상자) return
    const 줄 = document.createElement('button')
    줄.className = 'press'
    줄.setAttribute('style', 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;'
      + 'margin:10px 0 4px;padding:13px 15px;border-radius:14px;background:var(--cream);'
      + 'border:1.5px solid var(--cream-deep);color:var(--brown);font-weight:800;font-size:16px')
    줄.innerHTML = '<span>🧺 주부의 장바구니에서 재료 보기</span><span style="opacity:.55">›</span>'
    상자.remove()
    // 「재료」 소제목이 연 목록의 «끝»에 붙인다
    const 재료제목 = [...document.querySelectorAll('.sec-head, .sec-title-row, div')]
      .find((e) => (e.textContent || '').trim().startsWith('재료') && e.getBoundingClientRect().width > 100)
    const 기준 = 재료제목 ? 재료제목.closest('div') : null
    const 마지막재료 = [...document.querySelectorAll('.ing')].pop()
    const 붙일곳 = (마지막재료 && 마지막재료.parentElement) || 기준
    if (붙일곳) 붙일곳.appendChild(줄)
  },
  // ⭐ C = **제품은 두되 「이름만」 한 줄로 접는다** — 카드를 없애지 않는 절충
  'C-이름만한줄': () => {
    const 상자 = document.querySelector('[data-coach="pantry"]')
    if (!상자) return
    const 이름들 = [...상자.querySelectorAll('b, strong')].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 4)
    const 줄 = document.createElement('button')
    줄.className = 'press'
    줄.setAttribute('style', 'display:block;width:100%;margin-top:16px;padding:12px 15px;border-radius:14px;'
      + 'background:var(--cream);border:1.5px solid var(--cream-deep);color:var(--brown);text-align:left')
    줄.innerHTML = '<div style="font-weight:800;font-size:15.5px">🧺 주부의 장바구니에 이 재료가 있어요</div>'
      + `<div style="margin-top:4px;font-size:14.5px;opacity:.72">${이름들.join(' · ')} ›</div>`
    상자.replaceWith(줄)
  },
}

for (const [이름, 고침] of Object.entries(손질)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4511/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
  await p.locator('.grid-card').first().click(); await p.waitForTimeout(1100); await 치우기(p)
  await p.evaluate(고침)
  await p.waitForTimeout(500)
  // 📏 「몇 px 내려야 보이나」를 잰다 — 이게 이 시안의 잣대다
  const 잰값 = await p.evaluate(() => {
    const 찾 = [...document.querySelectorAll('button,div')].find((e) => (e.textContent || '').includes('주부의 장바구니'))
    if (!찾) return { 못찾음: true }
    const y = Math.round(찾.getBoundingClientRect().top + window.scrollY)
    return { 위에서: y, 화면: window.innerHeight, 화면판: +(y / window.innerHeight).toFixed(2) }
  })
  // 📍 그 자리로 굴려서 찍는다
  //    ⛔⛔ 첫 판은 `querySelectorAll('button,div')` 로 찾아 **맨 바깥 div 를 먼저 잡았다** →
  //       「위에서 0px」이 나왔고, 화면도 엉뚱한 데서 멈춰 **줄이 아래 단추에 반쯤 덮여 안 보였다.**
  //       📮 창업자 = *"이짜나 잘려서 안보여.. 아래에 있어서"* — 맞는 지적이다.
  //    ✅ 그래서 ⑴ «제일 안쪽» 요소를 고르고 ⑵ 아래 고정 단추(요리모드 줄) 높이만큼 위로 올린다.
  await p.evaluate(() => {
    const 후보 = [...document.querySelectorAll('button,div')]
      .filter((e) => (e.textContent || '').includes('주부의 장바구니'))
    const 찾 = 후보[후보.length - 1]      // 제일 안쪽(마지막)이 진짜 그 줄이다
    if (!찾) return
    찾.scrollIntoView({ block: 'center' })
    window.scrollBy(0, -90)               // 아래 고정 단추에 안 덮이게 조금 더 올린다
  })
  await p.waitForTimeout(700)
  await p.screenshot({ path: join(OUT, `${이름}.jpg`), type: 'jpeg', quality: 76 })
  console.log(`  ${이름.padEnd(14)} ${JSON.stringify(잰값)}`)
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
