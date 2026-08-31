// 📸 가져오기 화면 «통째로» 찍는다 — 줄간·글자 크기 판정용 (창업자 2026-08-24)
//    ⛔ 숫자만 보고 보내지 않는다(절대원칙 21). 이 판이 뽑은 그림을 Read 로 열어서 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }
const PORT = Number(process.env.PORT || 4413)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await b.newContext({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 2 })).newPage()
page.setDefaultTimeout(15000)
const url = `http://127.0.0.1:${PORT}/`
for (const [딱지, l] of [['남음', { welcome: 20, month: 5 }], ['다씀', { welcome: 0, month: 0 }]]) {
  await page.goto(url)
  await page.evaluate(({ s, keys, ll }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    keys.forEach((k) => localStorage.setItem(k, '1'))
    localStorage.setItem('hankki:ocrLeft', JSON.stringify(ll))
  }, { s: state, keys: Object.values(COACH), ll: l })
  await page.goto(url); await page.waitForTimeout(1600)
  try { await page.locator('[data-coach="import"]').first().click({ timeout: 8000 }) }
  catch { await page.getByText('가져오기', { exact: true }).last().click({ timeout: 8000 }) }
  await page.waitForTimeout(1400)
  // ⛔ 덮개가 있으면 「찍었다」가 「보였다」가 아니다
  const 덮 = await page.evaluate(() => { const e = document.elementFromPoint(195, 300); const c = e && e.closest('.coach-mask,.sheet-mask,.onboard'); return c ? c.className : null })
  if (덮) console.log(`  ⚠️ ${딱지} — 화면이 ${덮} 로 덮였다`)
  await page.screenshot({ path: `/tmp/imp-${딱지 === '남음' ? 'a' : 'b'}.png`, fullPage: false })
  console.log(`  ${딱지} 찍음`)
}
await b.close()
