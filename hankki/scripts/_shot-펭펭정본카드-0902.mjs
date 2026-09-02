// 🐧🎴 **펭펭 정본 4컷이 «진짜 카드»에서 어떻게 보이나** — 넣고 나서 눈으로 본다 (2026-09-02)
//
// 📮 창업자 = *"좋다고 한 것 중에서 선별해서 넣어줘."*
// ⛔ 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 실물을 열어서 본다.
//    숫자(긴변·비율·게이트)는 전부 초록불이어도 **크게 띄웠을 때 어떤지는 눈으로만 안다.**
// ⛔ 절대원칙 30 = 흉내가 아니라 «진짜 앱»에서 찍는다 — 시계를 가을로 속이고 카드를 뽑는다.
//
// ⚠️ 뽑기는 운이라 원하는 컷이 안 나올 수 있다 → **`Math.random` 을 씨앗으로 고정**하고
//    「다시 뽑기」를 여러 번 눌러 **네 컷이 다 나올 때까지** 돈다. 나온 순간 카드를 찍는다.
// ⚠️ `SEED_COACH_SEEN` 을 빼면 안내 코치가 클릭을 가로채 「0번 뽑음」이 된다(2026-09-02 실제로 당했다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${OUT}/펭펭정본카드-0902`
mkdirSync(방, { recursive: true })
const 그날 = process.env.ON || '2026-10-05'
const 찾을것 = (process.env.CUTS || 'pj_01,pj_02,pj_03,pj_04').split(',')
const 최대 = Number(process.env.TRY || 120)

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4391
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const 그날 = new Date('${그날}T09:00:00+09:00').getTime()
  const O = Date
  class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(그날) } static now(){ return 그날 } }
  Date = F
  let s = 20260902
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1')
}, state)

const 치우기 = async () => {
  for (let i = 0; i < 5; i += 1) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }
}

await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1400)
await 치우기()
await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
await p.waitForTimeout(800)
await 치우기()
// ⛔ 레시피를 먼저 골라야 카드가 뜬다
await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
await p.waitForTimeout(1200)

const 카드안그림 = () => p.evaluate(() => {
  const el = document.querySelector('.draw-card') || document.querySelector('[data-card]')
  if (!el) return null
  return [...el.querySelectorAll('img')].map((i) => (i.currentSrc || i.src || '').split('/').pop())
})

const 뽑기 = p.getByRole('button', { name: /랜덤|뽑/ })
const 찾음 = new Map()
let 눌렀다 = 0
for (let i = 0; i < 최대 && 찾음.size < 찾을것.length; i += 1) {
  const imgs = (await 카드안그림()) || []
  for (const k of 찾을것) {
    if (찾음.has(k)) continue
    if (imgs.some((f) => f.startsWith(`${k}-`) || f === `${k}.png`)) {
      const 카드 = p.locator('.draw-card, [data-card]').first()
      await 카드.screenshot({ path: `${방}/${k}.png` }).catch(() => {})
      const w = await p.evaluate(() => Math.round((document.querySelector('.draw-card') || document.querySelector('[data-card]')).getBoundingClientRect().width))
      찾음.set(k, { 폭: w, 그림: imgs.join(' ') })
      console.log(`  ✅ ${k}  ${i}번째 뽑기에서 나왔다 · 카드 ${w}px`)
    }
  }
  if (찾음.size >= 찾을것.length) break
  if (!(await 뽑기.count())) { console.log('  ⛔ 「다시 뽑기」 단추를 못 찾았다'); break }
  await 뽑기.first().click().catch(() => {})
  눌렀다 += 1
  await p.waitForTimeout(320)
}

console.log(`\n🔁 뽑기 ${눌렀다}번 · 찾은 컷 ${찾음.size}/${찾을것.length}`)
for (const k of 찾을것) if (!찾음.has(k)) console.log(`  ⚠️ ${k} 는 ${눌렀다}번 안에 안 나왔다(뽑기 운 — 풀엔 들어 있다)`)
console.log(`📸 ${방}`)
await b.close(); srv.kill(); process.exit(찾음.size === 찾을것.length ? 0 : 1)
