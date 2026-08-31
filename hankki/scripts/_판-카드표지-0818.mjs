// 🎴 판 — 「자랑카드를 표지로」 세 갈래를 나란히 (창업자 판정용 · 2026-08-18)
//
// ⭐ 왜 세 갈래인가 = 창업자 말이 둘을 가리킬 수 있다.
//    📮 *"원래 자랑카드전체가 표지여야하는데 동그랗게됐다고"* ＋ *"사진넣기 기능 넣고 변했어"*
//    · 「원래」  = 2026-08-17 «전» 모습 = **네모 꽉 채움(cover)** — 위아래 20% 잘린다
//    · 「전체」  = 카드가 한 군데도 안 잘림 = **다 보이기(contain)** — 좌우에 여백이 생긴다
//    ⛔ 짐작으로 하나를 고르지 않는다(규칙 25) — 실물을 찍어 나란히 놓고 정한다.
//
// ⚠️ 꾸미기 스티커가 있는 레시피로 찍으면 «잘림»과 «가림»이 섞여 판단이 안 된다
//    → 이 판은 **꾸미기를 비운 레시피**로 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 코치키들 = Object.values(COACH)
const now = Date.now()
// 🧹 꾸미기를 비운다 — 「잘렸나」만 보이게
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000, decor: [], decorBg: '' })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4328)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: 코치키들 })
await page.goto(url)
await page.waitForTimeout(2200)

// ── 자랑카드를 «진짜로» 만들어 표지에 넣는다 ──
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click()
await page.waitForTimeout(2500)
// 🔎 자르기 전에 «어디까지 찼는지»를 재서 찍는다 — 첫 판이 카드를 납작하게 잘랐다(규칙 7)
const 잰높이 = await page.evaluate(() => {
  const 판들 = [...document.querySelectorAll('div')].filter((d) => d.style.width === '1080px' && d.style.height === '1350px')
  return 판들.map((판) => {
    const R = 판.getBoundingClientRect()
    let 위 = Infinity, 아래 = 0, 큰것 = 0
    let 아래주인 = ''
    for (const n of 판.querySelectorAll('*')) {
      const r = n.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.width >= R.width * 0.98 && r.height >= R.height * 0.92) { 큰것++; continue }
      위 = Math.min(위, r.top - R.top)
      if (r.bottom - R.top > 아래) { 아래 = r.bottom - R.top; 아래주인 = n.tagName + '.' + (n.textContent || '').slice(0, 12) }
    }
    return { rect_h: Math.round(R.height), offset_h: 판.offsetHeight, 위: Math.round(위), 아래: Math.round(아래), 큰것, 아래주인 }
  })
})
console.log('   🔎 잰 값:', JSON.stringify(잰높이))
await page.getByText('이 카드를 내 레시피 표지로').click()

let 표지 = null
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  표지 = await page.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image/jpeg'))
      return r ? { id: r.id, title: r.title } : null
    } catch { return null }
  })
  if (표지) break
}
if (!표지) { console.log('⛔ 표지 저장 실패'); await browser.close(); stop(); process.exit(1) }
console.log(`\n🎴 자랑카드를 「${표지.title}」 표지로 넣었다`)

// ── 세 갈래를 갈아끼우며 찍는다 ──
//    ⛔ 옛 판(동그라미)은 코드가 이미 고쳐졌으니 «저장값»으로 흉내낸다 — imageFit 을 지우면 옛 길로 간다.
//    ⚠️ 단 옛 카드 되살리기(높이 ≥1600)가 걸려서 그대로면 네모가 된다 → 그 판만 원본 높이를 줄여 흉내.
// ⭐ 창업자가 두 마디로 갈래를 닫았다 — *"자랑카드**전체**가 표지여야"* ＋ *"**위에잘렸어**"*
//    → 「잘리지 않는다」가 조건이다. 아래 둘을 나란히 두는 건 **무엇이 달라졌나**를 보이기 위해서다.
//    ⛔ 「고치기 전」은 여기서 못 찍는다 — 옛 카드 되살리기(높이 ≥1600)가 걸려서 저장값을 지워도
//       네모로 나온다. **창업자가 폰에서 보고 있는 그 모습**이 before 이고, 이 판은 after 다.
const 갈래 = [
  { key: 'C-카드전체', fit: 'whole', 설명: '✅ 카드 전체 — 한 군데도 안 잘린다 (좌우 여백)' },
]
for (const g of 갈래) {
  await page.evaluate(({ id, fit }) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    s.recipes = s.recipes.map((r) => (r.id === id ? { ...r, imageFit: fit } : r))
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  }, { id: 표지.id, fit: g.fit })

  await page.goto(url)
  await page.waitForTimeout(1600)
  await page.getByText('레시피', { exact: true }).last().click()
  await page.waitForTimeout(1200)
  await page.locator('.grid-card').filter({ hasText: 표지.title }).first().click()
  await page.waitForTimeout(1400)

  const 잰것 = await page.evaluate(() => {
    const box = document.querySelector('.cover-box'); const img = box?.querySelector('img')
    if (!box || !img) return null
    const b = box.getBoundingClientRect(); const w = img.parentElement.getBoundingClientRect()
    const cs = getComputedStyle(img.parentElement); const ics = getComputedStyle(img)
    const 동그란가 = /%/.test(cs.borderRadius)
    const 채움 = (동그란가 ? Math.PI / 4 : 1) * w.width * w.height / (b.width * b.height)
    const 칸비 = w.width / w.height, 원비 = img.naturalWidth / img.naturalHeight
    const 잘림 = ics.objectFit === 'contain' ? 1 : (원비 > 칸비 ? 칸비 / 원비 : 원비 / 칸비)
    return { 채움: +(채움 * 100).toFixed(1), 생존: +((동그란가 ? Math.PI / 4 : 1) * 잘림 * 100).toFixed(1), fit: ics.objectFit, 모양: 동그란가 ? '⭕' : '⬜' }
  })
  // 표지 칸만 잘라 찍는다 — 판에 나란히 놓기 좋게
  const el = await page.locator('.cover-box').first()
  await el.screenshot({ path: `${OUT}/판-카드표지-${g.key}.png` })
  // 📱 목록 카드(작은 격자)도 본다 — 상세만 보고 넘기면 «목록에서 어떻게 보이나»를 통째로 놓친다
  await page.goBack(); await page.waitForTimeout(1000)
  await page.screenshot({ path: `${OUT}/판-카드표지-${g.key}-목록.png`, clip: { x: 0, y: 90, width: 390, height: 420 } })
  console.log(`   ${g.설명}`)
  console.log(`      ${잰것.모양} object-fit ${잰것.fit} · 표지를 채우는 넓이 ${잰것.채움}% · 카드가 살아남은 넓이 ${잰것.생존}%`)
}

console.log(`\n🖼 ${OUT}/판-카드표지-{A,B,C}*.png`)
await browser.close()
stop()
