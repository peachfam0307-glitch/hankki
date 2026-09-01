// 🖥📏 **패드 «가로» 요리모드 — 한 줄이 너무 길다** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"근데 한가지 **패드 가로 요리모드에서 글자가 너무 한줄로 길어.**
//    이건 **적당하게 두 줄로** 할 순 없어?"*
//
// 🔢 **잰다 = 964걸음 «전수» × 글줄 폭 후보 아홉** (2026-08-21 에 글자 크기를 정할 때 쓴 그 잣대)
//    · 몇 줄이 되나 (1줄 / 2줄 / 3줄 / 4줄+)
//    · ⛔**스크롤이 생기나** — 이게 0 이 아니면 그 후보는 «죽는다»
//      (부엌에선 「굴려야 보이는 것」과 「잘린 것」이 같다 · styles.css:2214 에 그렇게 적혀 있다)
//
// ⛔⛔ **글자 «크기»(38px)는 안 건드린다** — 964걸음을 전수로 재서 정한 값이다(styles.css:2247).
//    바꾸는 것은 **글줄이 꺾이는 폭** 하나뿐이라 글자는 하나도 안 작아진다.
//
// ⛔ 소스를 안 고친다 — 살아 있는 화면에 `max-width` 만 얹어 잰다(절대원칙 30).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-패드가로줄길이-0901.mjs
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

// 🍳 앱과 «같은 모듈»에서 걸음을 꺼낸다(절대원칙 30) — 흉내가 아니다
const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const 첫줄 = String(s).split('\n')[0].trim()
  if (첫줄) 걸음들.push(첫줄)
}
console.log(`🍳 걸음 ${걸음들.length}개를 잰다`)

// 후보 = 「글줄이 꺾이는 폭」. 0 = 지금(안 건드림)
const 후보들 = [0, 980, 900, 820, 760, 700, 640, 580, 520, 460]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

async function 요리모드로(폭, 높이) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 2 })
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
  if (!(await p.locator('[data-coach="cook"]').count())) return { ctx, p, 됐나: false }
  await p.locator('[data-coach="cook"]').first().click()
  await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {})
    await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

const 기기 = [
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820 },
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180 },
]

const 잰값 = []
for (const g of 기기) {
  const { ctx, p, 됐나 } = await 요리모드로(g.폭, g.높이)
  if (!됐나) { console.error(`✗ ${g.이름} — 요리모드 글자를 못 찾았다(아무것도 못 잰다)`); await ctx.close(); continue }

  // ⚠️ 스스로 검사 — 이 화면이 정말 38px 인가(아니면 다른 화면을 재고 있는 것이다)
  const 기본 = await p.evaluate(() => {
    const e = document.querySelector('.cook-steptext'), body = document.querySelector('.cook-body')
    const cs = getComputedStyle(e)
    return {
      크기: cs.fontSize, 줄높이: cs.lineHeight, 끊기: cs.wordBreak,
      쓸폭: Math.round(e.getBoundingClientRect().width),
      본문키: body ? Math.round(body.clientHeight) : 0,
    }
  })
  console.log(`\n── ${g.이름} ── 글자 ${기본.크기} · 줄높이 ${기본.줄높이} · 끊기 ${기본.끊기} · 지금 글줄 폭 ${기본.쓸폭}px · 본문 키 ${기본.본문키}px`)

  // 🔬 한 번의 evaluate 안에서 «살아 있는 그 요소»에 걸음을 넣어 가며 잰다
  const 결과 = await p.evaluate(({ 걸음들, 후보들 }) => {
    const el = document.querySelector('.cook-steptext')
    const body = document.querySelector('.cook-body')
    const 원래글 = el.innerHTML
    const 원래폭 = el.style.maxWidth
    const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
    const out = []
    for (const w of 후보들) {
      el.style.maxWidth = w ? `${w}px` : ''
      const 줄수분포 = {}
      let 스크롤 = 0, 최대줄 = 0, 줄합 = 0, 넘침 = 0
      for (const t of 걸음들) {
        el.textContent = t
        const 줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
        줄수분포[줄] = (줄수분포[줄] || 0) + 1
        줄합 += 줄
        if (줄 > 최대줄) 최대줄 = 줄
        if (body.scrollHeight > body.clientHeight + 1) 스크롤 += 1
        if (el.scrollWidth > el.clientWidth + 1) 넘침 += 1   // 안 끊기는 긴 낱말이 삐져나오나
      }
      out.push({ 폭: w, 줄수분포, 스크롤, 넘침, 최대줄, 평균줄: Math.round((줄합 / 걸음들.length) * 100) / 100 })
    }
    el.style.maxWidth = 원래폭
    el.innerHTML = 원래글
    return out
  }, { 걸음들, 후보들 })

  for (const r of 결과) {
    const d = r.줄수분포
    const 한줄 = d[1] || 0, 두줄 = d[2] || 0, 세줄 = d[3] || 0
    const 네줄이상 = Object.entries(d).filter(([k]) => +k >= 4).reduce((a, [, v]) => a + v, 0)
    const pc = (n) => `${String(Math.round((n / 걸음들.length) * 1000) / 10).padStart(5)}%`
    console.log(
      `  · 글줄 폭 ${String(r.폭 || '지금').padStart(4)}px` +
      ` │ 1줄 ${pc(한줄)} · 2줄 ${pc(두줄)} · 3줄 ${pc(세줄)} · 4줄+ ${pc(네줄이상)}` +
      ` │ 평균 ${String(r.평균줄).padStart(4)}줄 · 최다 ${r.최대줄}줄` +
      ` │ 스크롤 ${String(r.스크롤).padStart(3)} · 가로넘침 ${r.넘침}`
    )
    잰값.push({ 기기: g.id, 기기이름: g.이름, ...r, 한줄, 두줄, 세줄, 네줄이상, 걸음수: 걸음들.length, 기본 })
  }

  // 📸 눈으로도 본다(절대원칙 21) — 「가장 흔한 길이」의 걸음으로 후보 넷을 찍는다
  if (g.id === 'padland') {
    const 대표 = [...걸음들].sort((a, b) => a.length - b.length)[Math.floor(걸음들.length / 2)]
    for (const w of [0, 760, 640, 580, 520]) {
      await p.evaluate(({ w, t }) => {
        const el = document.querySelector('.cook-steptext')
        el.style.maxWidth = w ? `${w}px` : ''
        el.dataset.원래 = el.dataset.원래 || el.textContent
        el.textContent = t
      }, { w, t: 대표 })
      await p.waitForTimeout(220)
      await p.screenshot({ path: join(OUT, `padland-${w || 'now'}.png`) })
    }
    console.log(`\n  📸 대표 걸음(중앙값 ${대표.length}자) = "${대표}"`)
  }
  await ctx.close()
}
await b.close(); srv.close()

// ⚠️ 스스로 검사 — 폭을 줄였는데 «줄이 안 늘면» 아무것도 못 잰 것이다(규칙 18 ⓘ)
const 가로 = 잰값.filter((v) => v.기기 === 'padland')
if (가로.length >= 2) {
  const 늘었나 = 가로[가로.length - 1].평균줄 > 가로[0].평균줄
  console.log(늘었나
    ? `\n✅ 폭을 줄이니 줄이 늘었다(${가로[0].평균줄} → ${가로[가로.length - 1].평균줄}) — 잣대가 살아 있다`
    : `\n⛔ 폭을 줄여도 줄이 안 늘었다 — max-width 가 «안 먹은» 것이다(판정 금지)`)
}

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰값, null, 2))
console.log(`\n📁 ${OUT}`)
