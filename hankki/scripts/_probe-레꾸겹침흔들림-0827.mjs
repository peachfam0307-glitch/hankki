/**
 * 🔬 「레꾸겹침 판이 왜 흔들리나」 — `decor` 가 «언제» 비는지 시간을 따라 찍는다 (2026-08-27)
 *
 * ⛔⛔ **경위** — `_repro-레꾸겹침-0823` 이 2026-08-24(순차)에 한 번 실패하고 두 번 통과했다.
 *    그때 CLAUDE.md 에 *"왜 흔들렸는지는 아직 모른다. 「flaky 니까 괜찮다」로 덮지 않는다 —
 *    다시 나오면 그때 뿌리를 판다"* 라고 적었고, 2026-08-27 스모크 병렬화 3회 검증에서 **다시 나왔다.**
 *
 * 🔢 그때까지 좁힌 것
 *    · 실패 칸은 하나 — 저장값 `{"decor":2,...}` (스티커가 안 비었다)
 *    · 같은 patch 객체 안의 `thumb`·`image` 는 «①단계에서 이미» 저장돼 있어 ①-b 가 아무것도 안 해도 통과한다
 *      → `decor:2 · thumb=photo` 는 모순이 아니라 **「①-b 의 저장이 아직 안 끝났다」**와 정확히 맞는다
 *    · 판 안에서 대기 방식이 갈렸다 — ①은 **최대 30초 조건 대기**, ①-b만 **고정 4초**
 *    · CPU 경쟁을 주니(같은 판 4개 동시) **4개 중 3개 실패** ↔ 부하 없으면 3번 중 1번
 *
 * ❓ **아직 안 닫힌 것 = 「늦는 것」인가 「아예 안 하는 것」인가.**
 *    ⭐ 그래서 4초에서 판정하지 말고 **0.4초마다 40초까지 계속 본다.**
 *       · 어느 시점에 2 → 0 으로 바뀌면 → **늦는 것**(판의 고정 대기가 짧다)
 *       · 40초 내내 2 면 → **앱이 안 지운다**(진짜 버그 · 판이 맞았다)
 *
 * 쓰기: node scripts/_probe-레꾸겹침흔들림-0827.mjs
 *       PORT=4502 node scripts/_probe-레꾸겹침흔들림-0827.mjs     # 여러 개 동시에 돌려 CPU 를 다투게
 */
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4393)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

// ⛔ 크로미움 «경로를 박지 않는다» — 이 컨테이너에만 있는 길을 박아 배포를 죽인 적이 있다(v10.90).
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
}, { s: state, keys: Object.values(COACH) })
await page.goto(url)
await page.waitForTimeout(2200)

// ── ① 원본 판과 «똑같이» 카드를 한 번 올려 주인을 찾는다
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click()
await page.waitForTimeout(2500)
await page.getByText('이 카드를 내 레시피 표지로').click()
let 주인 = null
for (let i = 0; i < 60 && !주인; i++) {
  await page.waitForTimeout(500)
  주인 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (s.recipes || []).find((x) => typeof x.image === 'string' && x.image.startsWith('data:image'))
    return r ? { id: r.id, title: r.title } : null
  })
}
if (!주인) { console.log('⛔ ① 단계에서 카드 주인을 못 찾았다'); await browser.close(); stop(); process.exit(1) }
console.log(`① 카드 주인 = 「${주인.title}」`)

// ── ①-b 스티커 2개를 심고 다시 올린다 (원본 판과 같은 흐름)
await page.evaluate((id) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => x.id === id)
  r.decor = [{ id: 'z1', key: 'gp_gomhi', x: 40, y: 40, s: 1, r: 0 }, { id: 'z2', key: 'gp_pengv', x: 60, y: 60, s: 1, r: 0 }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 주인.id)
await page.goto(url); await page.waitForTimeout(1600)
await page.getByText('레꾸자랑', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 주인.title }).first().locator('button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click(); await page.waitForTimeout(2500)

const t0 = Date.now()
await page.getByText('이 카드를 내 레시피 표지로').click()

// ── ⭐ 여기가 이 판의 전부 — 「언제」 비는지 본다
let 빈때 = null
const 자취 = []
for (let i = 0; i < 100; i++) {
  await page.waitForTimeout(400)
  const n = await page.evaluate((id) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    const r = s.recipes.find((x) => x.id === id)
    return (r.decor || []).length
  }, 주인.id)
  const 초 = (Date.now() - t0) / 1000
  자취.push(`${초.toFixed(1)}s:${n}`)
  if (n === 0) { 빈때 = 초; break }
}

console.log(`자취 = ${자취.join(' ')}`)
if (빈때 === null) {
  console.log(`\n⛔⛔ 40초 내내 «안 비었다» — 늦는 게 아니라 «앱이 안 지운다». 진짜 버그다.`)
} else {
  console.log(`\n✅ ${빈때.toFixed(1)}초에 비었다 — «늦는 것»이다.`)
  console.log(`   판의 고정 대기는 4.0초 → ${빈때 > 4 ? `**부족했다**(${빈때.toFixed(1)}초 걸렸다)` : '이번엔 충분했다'}`)
}

await browser.close(); stop()
process.exit(빈때 === null ? 1 : 0)
