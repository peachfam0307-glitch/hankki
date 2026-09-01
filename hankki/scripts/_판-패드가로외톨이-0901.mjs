// 🖥🪶 **패드 가로 — 「두 줄」을 만들면 «둘째 줄이 외톨이»가 되나** (창업자 2026-09-01)
//
// ⭐⭐ **폭만 줄이면 반쪽이다** — 640px 로 줄여 찍어 보니 둘째 줄이 **「비벼요.」 세 글자**뿐이었다.
//    창업자가 이미 한 번 짚은 그 모양이다 — v11.24 *"올리고당설명줄바꿈되게"*(「꽤」가 줄 끝에 매달림).
//    그때 답이 **`text-wrap: balance`**(줄을 고르게 나눈다)였고, 여기서도 같은 자리다.
//
// 🔢 **잰다 = 964걸음 × 폭 후보 × balance 켬/끔**
//    · **외톨이 비율** — 마지막 줄이 제일 긴 줄의 **35% 미만**이면 외톨이로 센다
//      (줄마다 폭을 «Range 로» 잰다 — div 상자로 재면 늘 max-width 라 아무것도 안 잰다 · 규칙 18 ⓘ)
//    · 줄 수가 «늘어나지는» 않나(balance 가 줄을 더 만들면 그건 손해다)
//
// ⛔ 소스를 안 고친다 — 살아 있는 화면에 얹어 잰다(절대원칙 30).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-패드가로외톨이-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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
const 후보들 = [0, 760, 700, 640, 580, 520]

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

// ⚠️ 먼저 «balance 가 이 브라우저에서 도나»부터 — 안 돌면 판정하면 안 된다(규칙 18 ⓘ)
const 되나 = await p.evaluate(() => CSS.supports('text-wrap', 'balance'))
console.log(`🧪 이 브라우저가 text-wrap: balance 를 아나 → ${되나 ? '✅ 안다' : '⛔ 모른다'}`)

const 결과 = await p.evaluate(({ 걸음들, 후보들 }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래글 = el.innerHTML, 원래폭 = el.style.maxWidth, 원래wrap = el.style.textWrap
  const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
  const out = []
  for (const w of 후보들) for (const bal of [false, true]) {
    el.style.maxWidth = w ? `${w}px` : ''
    el.style.textWrap = bal ? 'balance' : ''
    let 외톨이 = 0, 여러줄 = 0, 줄합 = 0, 최대줄 = 0
    let 꼬리합 = 0
    for (const t of 걸음들) {
      el.textContent = t
      // ⭐ 줄마다 폭 = Range 의 getClientRects() — 한 줄에 사각형 하나씩 나온다
      const r = document.createRange()
      r.selectNodeContents(el)
      const rects = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 1)
      const 줄 = rects.length || Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
      줄합 += 줄; if (줄 > 최대줄) 최대줄 = 줄
      if (줄 >= 2) {
        여러줄 += 1
        const 제일긴 = Math.max(...rects.map((x) => x.width))
        const 꼬리 = rects[rects.length - 1].width / 제일긴
        꼬리합 += 꼬리
        if (꼬리 < 0.35) 외톨이 += 1
      }
    }
    out.push({
      폭: w, balance: bal,
      여러줄, 외톨이,
      외톨이율: 여러줄 ? Math.round((외톨이 / 여러줄) * 1000) / 10 : 0,
      평균꼬리: 여러줄 ? Math.round((꼬리합 / 여러줄) * 1000) / 10 : 0,
      평균줄: Math.round((줄합 / 걸음들.length) * 100) / 100,
      최대줄,
    })
  }
  el.style.maxWidth = 원래폭; el.style.textWrap = 원래wrap; el.innerHTML = 원래글
  return out
}, { 걸음들, 후보들 })

console.log(`\n── 패드 가로 1180×820 · 걸음 ${걸음들.length}개 ──`)
console.log('   (외톨이 = 마지막 줄이 제일 긴 줄의 35% 미만 · 평균꼬리 = 마지막 줄이 제일 긴 줄의 몇 %인가)')
for (const r of 결과) {
  console.log(
    `  · 폭 ${String(r.폭 || '지금').padStart(4)}px · balance ${r.balance ? '켬' : '끔'}` +
    ` │ 여러 줄 ${String(r.여러줄).padStart(3)}개 중 **외톨이 ${String(r.외톨이).padStart(3)}개 (${String(r.외톨이율).padStart(5)}%)**` +
    ` │ 평균꼬리 ${String(r.평균꼬리).padStart(5)}%` +
    ` │ 평균 ${String(r.평균줄).padStart(4)}줄 · 최다 ${r.최대줄}줄`
  )
}

// 📸 눈으로도 (절대원칙 21) — balance 를 켠 판을 후보마다
const 대표 = [...걸음들].sort((a, b) => a.length - b.length)[Math.floor(걸음들.length / 2)]
for (const w of [760, 700, 640, 580]) {
  await p.evaluate(({ w, t }) => {
    const el = document.querySelector('.cook-steptext')
    el.style.maxWidth = `${w}px`; el.style.textWrap = 'balance'; el.textContent = t
  }, { w, t: 대표 })
  await p.waitForTimeout(220)
  await p.screenshot({ path: join(OUT, `bal-${w}.png`) })
}
// ＋ 제일 긴 걸음도 한 판(최악을 본다)
const 제일긴 = [...걸음들].sort((a, b) => b.length - a.length)[0]
for (const w of [700, 640, 580]) {
  await p.evaluate(({ w, t }) => {
    const el = document.querySelector('.cook-steptext')
    el.style.maxWidth = `${w}px`; el.style.textWrap = 'balance'; el.textContent = t
  }, { w, t: 제일긴 })
  await p.waitForTimeout(220)
  await p.screenshot({ path: join(OUT, `bal-긴걸음-${w}.png`) })
}
console.log(`\n  📸 대표(중앙값 ${대표.length}자) "${대표}"\n  📸 제일 긴 걸음(${제일긴.length}자) "${제일긴}"`)

await ctx.close(); await b.close(); srv.close()

// ⚠️ 스스로 검사 — balance 를 켰는데 외톨이가 «안 줄면» 안 먹은 것이다
const 짝 = 후보들.filter((w) => w).map((w) => [결과.find((r) => r.폭 === w && !r.balance), 결과.find((r) => r.폭 === w && r.balance)])
const 줄었다 = 짝.filter(([a, c]) => c.외톨이 < a.외톨이).length
console.log(줄었다 >= 짝.length - 1
  ? `\n✅ balance 가 실제로 일한다 — 후보 ${짝.length} 중 ${줄었다} 곳에서 외톨이가 줄었다`
  : `\n⛔ balance 를 켜도 외톨이가 안 줄었다(${줄었다}/${짝.length}) — 안 먹은 것일 수 있다(판정 금지)`)

writeFileSync(join(OUT, '외톨이.json'), JSON.stringify(결과, null, 2))
console.log(`\n📁 ${OUT}`)
