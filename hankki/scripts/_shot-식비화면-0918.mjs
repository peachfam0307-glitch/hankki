// 📸💰 식비 탭 화면 찍기 (2026-09-18) — 예고 릴스·캐러셀에 쓸 «실제 화면»
//   ⭐ 창업자 «식비탭에 장본거랑 외식 배달 쌓인 화면도 보여줘» → 두 갈래가 섞인 한 주를 심고 찍는다.
//   ⛔ 지어낸 그림이 아니라 «앱이 그리는 그것»이라야 한다(규칙 30).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4611, r))
const 밖 = process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp'
// 🗓 이번 주로 심는다 — 화면 기본 잣대가 «주»라서 바로 보인다
const 주첫 = (() => { const d = new Date(Date.now() + 9 * 3600e3); const w = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - w); return d.toISOString().slice(0, 10) })()
const 며칠 = (n) => { const d = new Date(주첫 + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 씨 = [
  { d: 며칠(0), k: 'shop', won: 38400, memo: '쿠팡' },
  { d: 며칠(1), k: 'out', won: 15000, memo: '배민 치킨' },
  { d: 며칠(2), k: 'shop', won: 12700, memo: '자연드림' },
  { d: 며칠(3), k: 'out', won: 9500, memo: '쿠팡이츠 국밥' },
  { d: 며칠(4), k: 'shop', won: 26800, memo: '컬리' },
  { d: 며칠(5), k: 'out', won: 32000, memo: '외식 삼겹살' },
]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    // 🙈 코치마크를 «다 본 것»으로 — 접두어로 막아서 열쇠를 올려도 안 낡는다(src/coach.js SEED_COACH_SEEN 과 같은 수)
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4611/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2300)
// 💰 씨앗은 «앱이 한 번 저장한 뒤»에 심는다 —
//    ⛔ `load()` 는 `recipes` 배열이 없으면 저장본을 통째로 버린다(store.jsx:145). 빈손에 심으면 날아간다.
const 심음 = await p.evaluate(([줄들, 지난주]) => {
  try {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
    if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
    s.foodCost = [...줄들, ...지난주].map((e, i) => ({ id: 'seed' + i, ...e }))
    s.foodBudget = { w: 150000, m: 600000 }
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return '심었다 ' + s.foodCost.length + '줄'
  } catch (e) { return '⛔ ' + e.message }
}, [씨, [{ d: 며칠(-6), k: 'shop', won: 41000 }, { d: 며칠(-4), k: 'out', won: 21000 }, { d: 며칠(-9), k: 'shop', won: 33000 }]])
console.log('씨앗 =', 심음)
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2300)
for (let i = 0; i < 12; i++) {
  const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
  if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
  try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break }
}
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(900)
for (let i = 0; i < 8; i++) {
  const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기")').first()
  if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
  try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break }
}
await p.screenshot({ path: join(밖, '식비-누르기전.png') })
const 가린것 = await p.evaluate(() => { const el = document.elementFromPoint(195, 120); return el ? ((el.className || '') + '|' + el.tagName + '|' + (el.textContent || '').slice(0, 30)) : '' })
console.log('식비 칸 자리를 가린 것 =', 가린것)
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click({ force: true }); await p.waitForTimeout(1200)
// ⛔ 화면 한가운데를 덮은 것이 있나 — 찍기 «전»에 본다(규칙 21)
const 덮음 = await p.evaluate(() => { const el = document.elementFromPoint(195, 420); return el ? (el.className || el.tagName) + '' : '' })
await p.screenshot({ path: join(밖, '식비화면-0918.png') })
await p.screenshot({ path: join(밖, '식비화면-0918-전체.png'), fullPage: true })
// 🧾 줄이 «쌓인» 자리 — 창업자 «장본거랑 외식 배달 쌓인 화면도 보여줘»(2026-09-18)
await p.locator('.fc-hit').nth(5).evaluate((el) => el.scrollIntoView({ block: 'center' })); await p.waitForTimeout(700)
await p.screenshot({ path: join(밖, '식비목록-0918.png') })
const 줄수 = await p.locator('.fc-hit').count()
console.log('덮은 것 =', 덮음 || '(없음)')
console.log('줄 개수 =', 줄수)
console.log('📸', join(밖, '식비화면-0918.png'), '·', join(밖, '식비화면-0918-전체.png'))
await b.close(); srv.close()
