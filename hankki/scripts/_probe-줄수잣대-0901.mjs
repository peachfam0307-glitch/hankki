// 🔬 **「한 줄 비율」이 잣대마다 갈린다** — 표는 50.6%, 실측은 66.1% (2026-09-01)
//
// ⛔ 우리 표(`styles.css` 요리모드 절)는 `_판-패드가로줄길이-0901.mjs` 로 잰 값이고,
//    그 판은 **`max-width` 만 얹고 `text-wrap: balance` 는 «안» 켰다.**
//    지금 앱은 둘 다 켜져 있다. **다른 앱을 재고 표에 적어 뒀을 수 있다.**
//
// 🔢 그래서 한 판에서 네 가지를 «같은 걸음»으로 잰다 —
//    잣대 둘(상자 키 ÷ 줄높이  ↔  Range 줄 수) × balance 끔/켬
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-줄수잣대-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const 첫줄 = String(s).split('\n')[0].trim()
  if (첫줄) 걸음들.push(첫줄)
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
}
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
const n = Math.min(await 카드.count(), 14)
for (let i = 0; i < n; i++) {
  await 카드.nth(i).click().catch(() => {})
  await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) break
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
await p.locator('[data-coach="cook"]').first().click()
await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {})
  await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드 글자를 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

const 결과 = await p.evaluate(({ 걸음들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML, 원래wrap = el.style.textWrap
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const out = []
  for (const bal of ['', 'balance']) {
    el.style.textWrap = bal
    let 키한줄 = 0, 렉트한줄 = 0, 갈린것 = 0
    let 예시 = null
    for (const t of 걸음들) {
      el.textContent = t
      const 키줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
      const r = document.createRange(); r.selectNodeContents(el)
      const rects = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 1)
      const 렉트줄 = rects.length || 키줄
      if (키줄 === 1) 키한줄 += 1
      if (렉트줄 === 1) 렉트한줄 += 1
      if (키줄 !== 렉트줄) { 갈린것 += 1; if (!예시) 예시 = { t, 키줄, 렉트줄, 키: el.getBoundingClientRect().height, 줄높이 } }
    }
    out.push({ balance: bal || '끔', 키한줄, 렉트한줄, 갈린것, 예시 })
  }
  el.style.textWrap = 원래wrap; el.innerHTML = 원래글
  return out
}, { 걸음들 })

const pc = (n) => `${(n / 걸음들.length * 100).toFixed(1)}%`
console.log(`\n── 패드 가로 1180×820 · max-width 760px · 걸음 ${걸음들.length}개 ──`)
for (const r of 결과) {
  console.log(`  · balance ${r.balance.padEnd(7)} │ 「상자 키 ÷ 줄높이」 한 줄 ${String(r.키한줄).padStart(3)}개 ${pc(r.키한줄)}` +
    ` │ 「Range 줄 수」 한 줄 ${String(r.렉트한줄).padStart(3)}개 ${pc(r.렉트한줄)}` +
    ` │ 두 잣대가 갈린 걸음 ${r.갈린것}개`)
  if (r.예시) console.log(`      갈린 예 = 키 ${r.예시.키.toFixed(1)}px ÷ 줄높이 ${r.예시.줄높이}px → ${r.예시.키줄}줄 · Range ${r.예시.렉트줄}줄 · "${r.예시.t}"`)
}
await ctx.close(); await b.close(); srv.close()
