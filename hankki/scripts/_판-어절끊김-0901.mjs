// ✂️🔤 **「다진 / 마늘」처럼 «한 덩어리 말»이 줄에서 갈린다** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"2줄이 좋은데 **다진/ 마늘이네..**"*
//    (820px 두 줄 판을 보고 — 두 줄은 좋은데 「다진 마늘」이 줄을 넘어 갈렸다)
//
// ⭐ **`word-break: keep-all` 로는 못 막는다** — 그건 «낱말 안»이 안 갈리게 할 뿐이고
//    「다진 마늘」은 **띄어쓰기가 있는 두 낱말**이라 브라우저가 정상적으로 거기서 끊는다.
//    ✅ 막는 길은 하나뿐 = 그 사이 빈칸을 **안 끊기는 빈칸(U+00A0)** 으로 바꾼다.
//
// 🔢 그래서 먼저 **「무엇이 실제로 갈리나」를 전수로 뽑는다** — 짐작으로 목록을 만들면 반드시 빠진다.
//    · 964걸음 × 폭 후보 × `text-wrap: balance`(앱과 같은 조건)
//    · 줄이 갈린 «자리»의 앞 낱말·뒤 낱말을 Range 로 집어 세고, 잦은 짝부터 보여준다
//
// ⛔ 소스를 안 고친다 — 살아 있는 화면에 얹어 잰다(절대원칙 30).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-어절끊김-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/어절'
mkdirSync(OUT, { recursive: true })
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
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
const n = Math.min(await 카드.count(), 14)
for (let i = 0; i < n; i++) {
  await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) break
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드 글자를 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

const 결과 = await p.evaluate(({ 걸음들, 후보들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML, 원래폭 = el.style.maxWidth, 원래wrap = el.style.textWrap
  el.style.textWrap = 'balance'
  const out = []
  for (const w of 후보들) {
    el.style.maxWidth = `${w}px`
    const 짝 = new Map()
    let 갈린걸음 = 0
    for (const t of 걸음들) {
      el.textContent = t
      const node = el.firstChild
      if (!node || node.nodeType !== 3) continue
      const r = document.createRange()
      // ⭐ 글자를 하나씩 재서 «줄이 바뀌는 자리»를 찾는다 — 줄 top 이 달라지는 지점이 곧 줄바꿈이다
      let 앞top = null
      const 끊긴자리 = []
      for (let i = 0; i < t.length; i++) {
        r.setStart(node, i); r.setEnd(node, i + 1)
        const rect = r.getClientRects()[0]
        if (!rect) continue
        if (앞top !== null && rect.top > 앞top + 2) 끊긴자리.push(i)
        앞top = rect.top
      }
      if (!끊긴자리.length) continue
      갈린걸음 += 1
      for (const i of 끊긴자리) {
        // 끊긴 자리 «앞»의 낱말과 «뒤»의 낱말
        const 앞 = t.slice(0, i).trimEnd().split(/[\s]/).pop() || ''
        const 뒤 = t.slice(i).trimStart().split(/[\s]/)[0] || ''
        if (!앞 || !뒤) continue
        const key = `${앞} / ${뒤}`
        짝.set(key, (짝.get(key) || 0) + 1)
      }
    }
    out.push({ 폭: w, 갈린걸음, 짝: [...짝.entries()].sort((a, b) => b[1] - a[1]) })
  }
  el.style.maxWidth = 원래폭; el.style.textWrap = 원래wrap; el.innerHTML = 원래글
  return out
}, { 걸음들, 후보들: [820, 760] })

for (const r of 결과) {
  console.log(`\n── ${r.폭}px · 줄이 갈린 걸음 ${r.갈린걸음}개 · 갈린 자리 ${r.짝.reduce((a, x) => a + x[1], 0)}군데 ──`)
  console.log(`   ⭐ 두 번 이상 나온 짝(＝규칙으로 묶을 값어치가 있는 것):`)
  const 잦은것 = r.짝.filter(([, c]) => c >= 2)
  if (!잦은것.length) console.log('   (없다 — 전부 한 번씩만 갈린다)')
  for (const [k, c] of 잦은것.slice(0, 25)) console.log(`   ${String(c).padStart(3)}번 │ ${k}`)
  // 「다진 …」처럼 «앞말이 꾸미는 말»인 짝은 따로 — 창업자가 짚은 그 모양이다
  const 꾸밈 = r.짝.filter(([k]) => /^(다진|채 썬|잘게|굵게|얇게|송송|어슷|한입|통|생|익은|불린|삶은|데친|볶은|구운|남은|넉넉히)\s\//.test(k.replace(' / ', ' / ')))
  const 꾸밈2 = r.짝.filter(([k]) => ['다진','잘게','굵게','얇게','송송','어슷','한입','통','생','익은','불린','삶은','데친','볶은','구운','남은','채'].includes(k.split(' / ')[0]))
  const 목록 = 꾸밈2.length ? 꾸밈2 : 꾸밈
  console.log(`\n   🔤 «앞말이 뒷말을 꾸미는» 짝 = ${목록.reduce((a, x) => a + x[1], 0)}군데`)
  for (const [k, c] of 목록.slice(0, 20)) console.log(`   ${String(c).padStart(3)}번 │ ${k}`)
}

writeFileSync(join(OUT, '어절.json'), JSON.stringify(결과, null, 2))
await ctx.close(); await b.close(); srv.close()
console.log(`\n📁 ${OUT}/어절.json`)
