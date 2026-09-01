// 🔬 **옛 「글줄 폭」 표가 실측과 갈린다 — 왜인가** (2026-09-01)
//
// ⛔ `styles.css` 요리모드 절에 적어 둔 표 = 760px → 1줄 **50.6%** · 평균 1.56줄
//    오늘 다시 재니 = 760px → 1줄 **66.1%** · 평균 1.36줄
//    ⭐ 줄마다 맞춰 보면 **옛 W ≈ 새 (W×0.85)** — 옛 760 이 새 640 과 «소수점까지» 같다.
//       즉 옛 판의 글자가 **한결같이 ~15% 더 넓었다** = 값이 아니라 **글씨체**가 달랐다는 뜻이다.
//
// 🔢 그래서 «같은 걸음·같은 폭»에 글씨체만 갈아 끼워 잰다 — Gaegu(지금) ↔ Pretendard(옛 대체 글씨체)
//    ⭐ 이게 맞으면 「옛 판은 귀염체가 «아직 안 실린 채» 쟀다」가 확정된다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-옛표왜틀렸나-0901.mjs
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
  const 원래글 = el.innerHTML, 원래폰트 = el.style.fontFamily
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const out = []
  // ⭐ 한 글월의 «글자 폭»도 같이 잰다 — 「15% 넓었다」를 숫자로 못 박기 위해
  const 잣대글 = '남은 양념국물에 꽃게살을 넣고 밥을 비벼요.'
  for (const [이름, ff] of [['Gaegu(지금)', "'Gaegu', 'Pretendard', sans-serif"], ['Pretendard(옛 대체)', "'Pretendard', sans-serif"]]) {
    el.style.fontFamily = ff
    el.style.maxWidth = 'none'; el.style.whiteSpace = 'nowrap'
    el.textContent = 잣대글
    const 한줄폭 = el.getBoundingClientRect().width
    el.style.whiteSpace = ''
    const dist = {}
    let 줄합 = 0
    el.style.maxWidth = '760px'
    for (const t of 걸음들) {
      el.textContent = t
      const 줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
      dist[줄] = (dist[줄] || 0) + 1; 줄합 += 줄
    }
    out.push({ 이름, 실제글씨체: getComputedStyle(el).fontFamily, 잣대폭: Math.round(한줄폭), dist, 평균: Math.round(줄합 / 걸음들.length * 100) / 100 })
  }
  el.style.fontFamily = 원래폰트; el.style.maxWidth = ''; el.innerHTML = 원래글
  return out
}, { 걸음들 })

console.log(`\n── 패드 가로 1180×820 · max-width 760px 고정 · 걸음 ${걸음들.length}개 ──`)
console.log(`   잣대 글월 = "남은 양념국물에 꽃게살을 넣고 밥을 비벼요."`)
for (const r of 결과) {
  const pc = (k) => `${((r.dist[k] || 0) / 걸음들.length * 100).toFixed(1)}%`
  console.log(`  · ${r.이름.padEnd(20)} │ 안 꺾은 한 줄 폭 ${String(r.잣대폭).padStart(4)}px` +
    ` │ 1줄 ${pc(1)} · 2줄 ${pc(2)} · 3줄 ${pc(3)} · 평균 ${r.평균}줄`)
}
const [g, pre] = 결과
console.log(`\n  ⭐ Pretendard 가 Gaegu 보다 **${((pre.잣대폭 / g.잣대폭 - 1) * 100).toFixed(1)}% 넓다**`)
await ctx.close(); await b.close(); srv.close()
