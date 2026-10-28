import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
const R = '/home/user/hankki/hankki'
const 방 = '/tmp/claude-0/특집'
mkdirSync(방, { recursive: true })
const { basicRecipes, BASICS_VERSION } = await import(`${R}/src/data/basics.js`)
const { SEED_COACH_SEEN } = await import(`${R}/src/coach.js`)
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }
const PORT = 4411
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', `${R}/dist`], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 날 of ['2026-09-16', '2026-09-28']) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const 그날 = new Date('${날}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(그날) } static now(){ return 그날 } }
    Date = F
  }`)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.waitForTimeout(1800)
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
  }
  const 있나 = await p.locator('.weekly-row.rail').count()
  console.log(날, '· 특집 줄', 있나 ? '✅ 있다' : '⛔ 없다')
  await p.screenshot({ path: `${방}/${날}.png` })
  await ctx.close()
}
await b.close(); srv.kill()
