// 🔖 판 — 책갈피 크기 견주기 (창업자 2026-08-18 *"책갈피 크기 좀더커도 될것같아"*)
//
// ⭐ 지금 = **26px** (창업자가 2026-08-18 아침에 고른 값 · *"표시용이니까 존재감이 너무 크면 곤란해"*)
//    ⛔ 그때 26 을 고른 «이유»가 있으니 무작정 키우지 않는다 — 옆에 두고 견준다.
// 🔢 함께 재는 것 = **꾸민 표지를 얼마나 가리나**. 26px 은 4% 미만이었다(2026-08-18 실측).
//
// ⚠️ 격자 둘을 다 찍는다 — 카드 크기가 1.5배 달라서 «같은 26px» 도 다르게 보인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const 크기들 = (process.env.SIZES || '26,30,34').split(',').map(Number)

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
// 🔖 절반쯤 책갈피를 꽂아 둔다 — 걸린 것과 안 걸린 것이 한 화면에 같이 보여야 견줄 수 있다
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000, favorite: i % 2 === 0 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4331)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const url = `http://127.0.0.1:${PORT}/`

for (const 격자 of ['big', 'small']) {
  for (const px of 크기들) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(url)
    await page.evaluate(({ s, keys, g }) => {
      localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
      keys.forEach((k) => localStorage.setItem(k, '1'))
    }, { s: state, keys: Object.values(COACH), g: 격자 })
    await page.goto(url)
    await page.waitForTimeout(1800)
    await page.getByText('레시피', { exact: true }).last().click()
    await page.waitForTimeout(1200)
    // 크기만 갈아끼운다 — 자리·모양은 확정된 그대로
    await page.addStyleTag({ content: `.fav-dot .idx-clip { height: ${px}px !important; }` })
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/책갈피크기-${격자}-${px}px.png`, clip: { x: 0, y: 150, width: 390, height: 430 } })
    // 🔢 꾸민 표지를 얼마나 가리나 = 책갈피 넓이 ÷ 카드 넓이
    const 잰것 = await page.evaluate(() => {
      const c = document.querySelector('.grid-card'); const b = document.querySelector('.fav-dot .idx-clip')
      if (!c || !b) return null
      const cr = c.getBoundingClientRect(), br = b.getBoundingClientRect()
      return { 카드: `${Math.round(cr.width)}×${Math.round(cr.height)}`, 클립: `${Math.round(br.width)}×${Math.round(br.height)}`,
        가림: +(br.width * br.height / (cr.width * cr.height) * 100).toFixed(1) }
    })
    console.log(`   ${격자 === 'big' ? '큰 격자(2줄)' : '작은 격자(3줄)'} · ${px}px — 카드 ${잰것.카드} · 클립 ${잰것.클립} · 표지 가림 ${잰것.가림}%`)
    await ctx.close()
  }
}
console.log(`\n🖼 ${OUT}/책갈피크기-{big,small}-{${크기들.join(',')}}px.png`)
await browser.close()
stop()
