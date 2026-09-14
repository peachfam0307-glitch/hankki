// 👗 **같은 뼈대 · «같은 캐릭터» · 날짜만 다르게** — 「옷이 갈아입어지나」를 눈으로 보는 판 (2026-09-02)
//
// 📮 창업자 = *"ⓑ 가을 옷을 두 벌로… **무슨말인지모르겠어. 여름캐릭터를 뺀다는거지?**"*
//
// ⭐⭐ **그렇게 읽힌 게 내 판 잘못이다** — 앞 판은 날짜마다 «캐릭터가 다르게 뽑혀서»
//    바뀐 게 옷인지 캐릭터인지 구분이 안 됐다. 그래서 **캐릭터를 못 박고** 다시 찍는다.
//
// 🎲 어떻게 = `Math.random` 을 **씨앗 고정**으로 갈아끼운다(같은 순서로 같은 값이 나온다).
//    ⛔ 앱 코드는 한 줄도 안 건드린다 — 브라우저에서만 바꾼다(절대원칙 30 — 앱은 그대로 찍는다).
//
// 🖨  ON=2026-11-15 KEYS=warm,arch SEED=7 node scripts/_shot-옷비교-0902.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/옷비교'
const 그날 = process.env.ON || '2026-11-15'
const 키들 = (process.env.KEYS || 'warm,arch').split(',')
const 씨앗 = Number(process.env.SEED || 7)
const 방 = `${OUT}/${그날}`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4441)
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
  // 🎲 씨앗 고정 난수 — 날짜가 달라도 «같은 캐릭터»가 뽑히게 한다
  let s = ${씨앗} >>> 0
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)

const 치우기 = async () => {
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
  }
}

for (const k of 키들) {
  await p.goto(`http://127.0.0.1:${PORT}/?card=${k}`)
  await p.waitForTimeout(1500)
  await 치우기()
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(900)
  await 치우기()
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1200)
  const 뽑기 = p.getByRole('button', { name: /랜덤|뽑/ })
  if (await 뽑기.count()) { await 뽑기.first().click().catch(() => {}); await p.waitForTimeout(1600) }
  // 🐻 어떤 캐릭터가 뽑혔나 — 씨앗이 먹었는지 «확인»한다(안 먹으면 비교가 헛것이다)
  const 누구 = await p.evaluate(() => {
    const el = document.querySelector('.draw-card') || document.body
    const img = [...el.querySelectorAll('img')].map((i) => (i.getAttribute('src') || '').split('/').pop()).filter((s) => /\.(png|webp)/.test(s))
    return img.slice(0, 3).join(' , ')
  })
  await p.screenshot({ path: `${방}/${k}.png` })
  console.log(`  ${그날} ${k.padEnd(8)} 캐릭터 = ${누구 || '(못 읽음)'}`)
}
console.log(`\n📸 ${방}`)
await b.close(); srv.kill(); process.exit(0)
