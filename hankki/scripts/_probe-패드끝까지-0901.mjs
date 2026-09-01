// 🖥📐 **패드 가로 — 「한 줄일 때 글자가 패드 «끝»까지 가나」** (창업자 물음 2026-09-01)
//
// 📮 창업자 원문 = *"그럼 글자가 패드끝까지 가나? 한줄일 경우"*
//    (760px 판정 직후 나온 물음 — 폭을 760 으로 묶었는데 «한 줄짜리»는 여전히 끝까지 뻗나)
//
// 🔢 **잰다 = 964걸음 전수 · 지금 앱 그대로**(max-width 를 «얹지 않는다» — styles.css 값이 이미 760이다)
//    · 한 줄이 되는 걸음만 골라 **글자가 실제로 몇 px 인가**(Range 로 «글자 상자»를 잰다)
//    · 그 줄의 **왼쪽 끝 ↔ 화면 왼쪽 끝** 거리 = 「끝까지 갔나」의 답
//
// ⛔ div 상자로 재면 안 된다 — 가운데 맞춤(`align-items:center`)이라 상자가 글자에 붙긴 하지만,
//    두 줄이 되면 상자가 max-width 까지 벌어져 **글자 길이와 상자 길이가 갈린다**(규칙 18 ⓘ).
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-패드끝까지-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/줄길이'
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
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드 글자를 못 찾았다 — 아무것도 못 쟀다'); await b.close(); srv.close(); process.exit(1) }

// ⚠️ 먼저 «지금 앱이 정말 760 인가» — 아니면 딴 것을 재고 있는 것이다(규칙 18 ⓘ)
const 기본 = await p.evaluate(() => {
  const el = document.querySelector('.cook-steptext')
  const body = document.querySelector('.cook-body')
  const cs = getComputedStyle(el), bs = getComputedStyle(body)
  const br = body.getBoundingClientRect()
  return {
    크기: cs.fontSize, 폭최대: cs.maxWidth, 고르게: cs.textWrap || cs.textWrapStyle || '',
    화면폭: Math.round(window.innerWidth),
    본문왼: Math.round(br.left), 본문오른: Math.round(br.right),
    본문안폭: Math.round(body.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight)),
    좌우여백: Math.round(parseFloat(bs.paddingLeft)),
  }
})
console.log(`\n── 패드 가로 1180×820 · 걸음 ${걸음들.length}개 ──`)
console.log(`   글자 ${기본.크기} · max-width ${기본.폭최대} · ${기본.고르게}`)
console.log(`   화면 ${기본.화면폭}px · 본문이 쓸 수 있는 폭 ${기본.본문안폭}px (좌우 여백 ${기본.좌우여백}px)`)
if (기본.폭최대 !== '760px') { console.error(`⛔ max-width 가 760px 이 아니다(${기본.폭최대}) — 판정 금지`); await b.close(); srv.close(); process.exit(1) }

const 결과 = await p.evaluate(({ 걸음들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const 화면폭 = window.innerWidth
  let 한줄 = 0, 여러줄 = 0
  let 제일긴한줄 = { 폭: 0, 글: '' }
  let 한줄폭합 = 0
  const 폭들 = []
  // 「끝까지 갔나」 = 글자 왼쪽 끝 ↔ 화면 왼쪽 끝 (가운데 맞춤이라 양쪽이 같다)
  let 제일좁은틈 = 1e9
  for (const t of 걸음들) {
    el.textContent = t
    const r = document.createRange(); r.selectNodeContents(el)
    const rects = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 1)
    const 줄 = rects.length || Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
    if (줄 !== 1) { 여러줄 += 1; continue }
    한줄 += 1
    const w = rects[0].width
    폭들.push(w); 한줄폭합 += w
    const 틈 = Math.min(rects[0].left, 화면폭 - rects[0].right)
    if (틈 < 제일좁은틈) 제일좁은틈 = 틈
    if (w > 제일긴한줄.폭) 제일긴한줄 = { 폭: w, 글: t, 왼: rects[0].left, 오른: rects[0].right }
  }
  el.innerHTML = 원래글
  폭들.sort((a, b) => a - b)
  return {
    한줄, 여러줄, 화면폭,
    제일긴한줄,
    평균: 한줄 ? 한줄폭합 / 한줄 : 0,
    중앙값: 폭들.length ? 폭들[Math.floor(폭들.length / 2)] : 0,
    제일좁은틈,
  }
}, { 걸음들 })

const r1 = (x) => Math.round(x)
console.log(`\n  · 한 줄로 끝나는 걸음 = ${결과.한줄}개 (${(결과.한줄 / 걸음들.length * 100).toFixed(1)}%) · 두 줄 이상 ${결과.여러줄}개`)
console.log(`  · 한 줄 «글자» 폭 — 중앙값 ${r1(결과.중앙값)}px · 평균 ${r1(결과.평균)}px · **제일 긴 것 ${r1(결과.제일긴한줄.폭)}px**`)
console.log(`      제일 긴 한 줄 = "${결과.제일긴한줄.글}"`)
console.log(`      그 줄이 x ${r1(결과.제일긴한줄.왼)} ~ ${r1(결과.제일긴한줄.오른)} 에 선다 (화면 0 ~ ${결과.화면폭})`)
console.log(`  · ⭐ **화면 끝까지 남는 자리 = 제일 빠듯할 때도 한쪽에 ${r1(결과.제일좁은틈)}px**`)

// 📸 눈으로도 (절대원칙 21) — 제일 긴 한 줄 걸음을 그대로 찍는다
await p.evaluate((t) => { document.querySelector('.cook-steptext').textContent = t }, 결과.제일긴한줄.글)
await p.waitForTimeout(250)
await p.screenshot({ path: join(OUT, '패드끝까지-제일긴한줄.png') })

await ctx.close(); await b.close(); srv.close()

// ⚠️ 스스로 검사 — 「한 줄이 화면 끝에 닿으면」 이 판정은 틀린 것이다
const 닿았다 = 결과.제일좁은틈 < 40
console.log(닿았다
  ? `\n⛔ 한 줄이 화면 가장자리 40px 안까지 갔다 — 「끝까지 안 간다」고 말하면 안 된다`
  : `\n✅ 한 줄은 «끝까지 안 간다» — 제일 길어도 양옆에 ${r1(결과.제일좁은틈)}px 씩 남는다`)
console.log(`\n📁 ${OUT}/패드끝까지-제일긴한줄.png`)
process.exit(닿았다 ? 1 : 0)
