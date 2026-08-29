// 🎴 **9/1 레꾸자랑 카드 스킨 7장** — 창업자 = *"7장을 보여달라고"*
//
// ⭐ 시계를 9/1 로 속여 «진짜 앱»에서 찍는다(절대원칙 30 — 흉내가 아니라 그 값 자체).
// ⭐ 스킨은 `?card=<키>` 로 지정된다(`ShareDrawCard.jsx:161`) — 뽑기 운에 안 맡긴다.
// 🔢 9/1 풀 = warm·panel·pola·mag·arch·night ＋ chuseok(창 09-01~10-15) = **7장**
//    ⛔ summer 는 창업자 확정으로 9/1 에 빠졌다(`isPeakSeason`) · halloween 은 10/1 부터
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${OUT}/자랑카드-0901`
mkdirSync(방, { recursive: true })
const 그날 = process.env.ON || '2026-09-01'
const 키들 = (process.env.KEYS || 'warm,panel,pola,mag,arch,night,chuseok').split(',')

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4377
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
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1') }, state)

const 치우기 = async () => {
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
  }
}

let 찍음 = 0
for (const k of 키들) {
  await p.goto(`http://127.0.0.1:${PORT}/?card=${k}`)
  await p.waitForTimeout(1500)
  await 치우기()
  // 레꾸자랑 탭 → 카드 뽑기
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(900)
  await 치우기()
  // ⛔ 레꾸자랑은 「자랑할 레시피를 눌러주세요」가 먼저다 — 안 고르면 카드가 아예 안 뜬다
  //    (첫 판이 여기서 막혀 「카드 못 찾음」 7장이 나왔다 · 규칙 21 로 화면을 열어보고 알았다)
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1200)
  const 뽑기 = p.getByRole('button', { name: /랜덤|뽑/ })
  if (await 뽑기.count()) { await 뽑기.first().click().catch(() => {}); await p.waitForTimeout(1600) }
  else console.log(`     ⚠️ ${k}: 「랜덤/뽑기」 단추를 못 찾았다`)
  const 카드 = p.locator('.draw-card, [data-card], canvas').first()
  const 잰것 = await p.evaluate(() => {
    const el = document.querySelector('.draw-card') || document.querySelector('[data-card]')
    return el ? { w: Math.round(el.getBoundingClientRect().width), 글: (el.innerText || '').replace(/\n+/g, ' / ').slice(0, 50) } : null
  })
  if (await 카드.count()) { await 카드.screenshot({ path: `${방}/${k}.png` }).catch(() => {}) }
  else await p.screenshot({ path: `${방}/${k}-화면.png` })
  console.log(`  ${k.padEnd(9)} ${잰것 ? `카드 ${잰것.w}px · ${잰것.글}` : '(카드 못 찾음 — 화면 전체를 찍었다)'}`)
  찍음++
}
console.log(`\n📸 ${찍음}장 · ${방}`)
await b.close(); srv.kill(); process.exit(0)
