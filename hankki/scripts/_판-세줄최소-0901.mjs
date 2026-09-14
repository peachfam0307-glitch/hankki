// 📏🎯 **창업자 잣대로 다시 재기 — 「세 줄을 최소화」** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"최대한 **너무 길지않게 한줄에서 정리. 부족하면 두줄. 세줄은 최소화**하자. 이게 깔끔해보여서"*
//    ＋ 그 앞 = *"적당하게 두줄이 뭔지잘 모르겠어. **나는 3줄까지 가는 건 별로라. 760고른거였거든.**"*
//
// ⛔⛔ **내가 잣대를 잘못 알고 있었다** — 창업자 첫 제보를 *"적당하게 두 줄로"* 로 읽고
//    **「두 줄이 많아지는 폭」을 좋은 것**으로 세고 있었다(그래서 580 을 추천했다).
//    ⭐ 진짜 잣대는 **「세 줄이 안 나오게, 그러면서 한 줄이 너무 길지 않게」** 다. 방향이 거의 반대다.
//
// 🔢 그래서 이 판은 **세 줄 이상 걸음을 «개수와 이름으로»** 뽑는다 — 비율(%)로는 19편이 「2.0%」로 묻힌다.
//    ＋ 한 줄이 실제로 얼마나 기나(제일 긴 한 줄 · 화면 가장자리까지 남는 자리)도 같이.
//
// ⛔ 소스를 안 고친다 — 살아 있는 화면에 `max-width` 만 얹어 잰다(절대원칙 30).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-세줄최소-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/세줄'
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
const 후보들 = [1128, 980, 900, 860, 820, 790, 760, 700]

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

// ⛔⛔ 글씨체가 안 실렸으면 «다른 앱»을 재는 것이다 (2026-09-01 사고 — 표가 통째로 틀렸었다)
//
// ⛔ **`document.fonts.check()` 를 쓰면 안 된다 — 실려 있는데도 `false` 를 준다.**
//    우리 `@font-face` 는 **weight 700** 인데다 같은 family 에 «안 쓰는 판»이 하나 더 걸려 있어서
//    (`Gaegu/unloaded/700` ＋ `Gaegu/loaded/700`) 무게를 맞춰 물어도 false 가 나왔다(실측).
// ✅ **진짜 증거 = 「그 글씨체를 줬을 때 폭이 달라지나」** — 그림이 바뀌는 것을 직접 잰다.
const 글씨 = await p.evaluate(async () => {
  const cs = getComputedStyle(document.querySelector('.cook-steptext'))
  try { await document.fonts.ready } catch {}
  const s = document.createElement('span')
  s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:${cs.fontSize};font-weight:${cs.fontWeight}`
  s.textContent = '남은 양념국물에 꽃게살을 넣고 밥을 비벼요.'
  document.body.appendChild(s)
  s.style.fontFamily = "'없는글씨체XYZ', sans-serif"; const 대체 = s.getBoundingClientRect().width
  s.style.fontFamily = "'Gaegu', '없는글씨체XYZ', sans-serif"; const 귀염 = s.getBoundingClientRect().width
  s.remove()
  return { 크기: cs.fontSize, 대체: Math.round(대체), 귀염: Math.round(귀염), 실렸나: Math.abs(귀염 - 대체) > 1 }
})
console.log(`\n── 패드 가로 1180×820 · 걸음 ${걸음들.length}개 · 글자 ${글씨.크기} ──`)
console.log(`   글씨체 = ${글씨.실렸나 ? `✅ 귀염체(Gaegu) 실렸다 — 잣대글 ${글씨.귀염}px (대체 글씨체면 ${글씨.대체}px)` : '⛔ 안 실렸다 — 판정 금지'}`)
if (!글씨.실렸나) { await b.close(); srv.close(); process.exit(1) }

const 결과 = await p.evaluate(({ 걸음들, 후보들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML, 원래폭 = el.style.maxWidth, 원래wrap = el.style.textWrap
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const 화면폭 = window.innerWidth
  el.style.textWrap = 'balance'   // 앱과 같은 조건
  const out = []
  for (const w of 후보들) {
    el.style.maxWidth = `${w}px`
    let 한줄 = 0, 두줄 = 0
    const 세줄이상 = []
    let 제일긴한줄 = 0
    for (const t of 걸음들) {
      el.textContent = t
      const 줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
      if (줄 === 1) {
        한줄 += 1
        const r = document.createRange(); r.selectNodeContents(el)
        const rects = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 1)
        if (rects[0] && rects[0].width > 제일긴한줄) 제일긴한줄 = rects[0].width
      } else if (줄 === 2) 두줄 += 1
      else 세줄이상.push({ 글: t, 줄, 자: t.length })
    }
    out.push({ 폭: w, 한줄, 두줄, 세줄이상, 제일긴한줄: Math.round(제일긴한줄), 화면폭 })
  }
  el.style.maxWidth = 원래폭; el.style.textWrap = 원래wrap; el.innerHTML = 원래글
  return out
}, { 걸음들, 후보들 })

const pc = (n) => `${(n / 걸음들.length * 100).toFixed(1)}%`
console.log(`\n   ⭐ 창업자 잣대 = ①한 줄(너무 길지 않게) ②모자라면 두 줄 ③**세 줄은 최소화**\n`)
console.log(`   글줄 폭 │  1줄            │  2줄            │ ⚠️3줄 이상  │ 한 줄 제일 긴 것 │ 양옆 남는 자리`)
for (const r of 결과) {
  const 틈 = Math.round((r.화면폭 - r.제일긴한줄) / 2)
  console.log(
    `   ${String(r.폭).padStart(6)}px │ ${String(r.한줄).padStart(3)}개 ${pc(r.한줄).padStart(6)} │` +
    ` ${String(r.두줄).padStart(3)}개 ${pc(r.두줄).padStart(6)} │` +
    ` **${String(r.세줄이상.length).padStart(2)}개** ${pc(r.세줄이상.length).padStart(5)} │` +
    ` ${String(r.제일긴한줄).padStart(4)}px        │ ${String(틈).padStart(3)}px`
  )
}

// ⭐ 지금 값(760)에서 세 줄이 되는 걸음을 «전부» 이름으로 — 개수로는 「2.0%」라 묻힌다
const 지금 = 결과.find((r) => r.폭 === 760)
console.log(`\n── 지금(760px)에서 «세 줄»이 되는 걸음 ${지금.세줄이상.length}개 ──`)
for (const s of 지금.세줄이상.sort((a, b) => b.자 - a.자)) console.log(`   ${String(s.자).padStart(3)}자 · ${s.줄}줄 │ ${s.글}`)

const 넓힘 = 결과.find((r) => r.폭 === 820)
console.log(`\n── 820px 으로 넓히면 남는 세 줄 ${넓힘.세줄이상.length}개 ──`)
for (const s of 넓힘.세줄이상.sort((a, b) => b.자 - a.자)) console.log(`   ${String(s.자).padStart(3)}자 · ${s.줄}줄 │ ${s.글}`)

// 📸 눈으로도 (절대원칙 21) — 「760 에선 세 줄인데 820 에선 두 줄이 되는」 걸음으로 찍는다
//    ⭐ 대표 걸음(24자)으로만 찍으면 «어느 폭이든 한 줄»이라 아무 차이도 안 보인다.
const 갈리는걸음 = 지금.세줄이상.find((s) => !넓힘.세줄이상.some((t) => t.글 === s.글))?.글
  || 지금.세줄이상[지금.세줄이상.length - 1].글
const 대표 = [...걸음들].sort((a, b) => a.length - b.length)[Math.floor(걸음들.length / 2)]
for (const [이름, 글] of [['보통걸음', 대표], ['갈리는걸음', 갈리는걸음]]) {
  for (const w of [760, 820, 860]) {
    await p.evaluate(({ w, 글 }) => {
      const el = document.querySelector('.cook-steptext')
      el.style.maxWidth = `${w}px`; el.style.textWrap = 'balance'; el.textContent = 글
    }, { w, 글 })
    await p.waitForTimeout(250)
    await p.screenshot({ path: join(OUT, `${이름}-${w}.png`) })
  }
}
console.log(`\n  📸 보통 걸음(${대표.length}자) = "${대표}"`)
console.log(`  📸 갈리는 걸음(${갈리는걸음.length}자 · 760=3줄 → 820=2줄) = "${갈리는걸음}"`)

writeFileSync(join(OUT, '세줄.json'), JSON.stringify(결과, null, 2))
await ctx.close(); await b.close(); srv.close()
console.log(`\n📁 ${OUT}/세줄.json`)
