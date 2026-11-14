// 🎄 [2026-11-11] 크리스마스 꾸미기 샘플 2편(어묵탕·스키야키) 표지를 앱 그대로 찍어 창업자 영상과 나란히 놓는다
//    값 = basics.js 에 넣은 decor 그대로(⛔ 여기서 다시 적지 않는다) · 바탕 = _shot-호박스프표지-0929.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const OUT = process.env.OUT || '/tmp'
const { allBasicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 판들 = [['basic-eomuk-tang', '어묵탕'], ['basic-sukiyaki', '스키야키']]
const PORT = 4338
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const [ID, 이름] of 판들) {
  const now = Date.parse('2026-12-05T12:00:00+09:00')
  const recipes = allBasicRecipes.filter((r) => !r.from || r.from <= '2026-12-05').map((r, i) => ({ ...r, status: 'sorted', savedAt: r.id === ID ? now + 60000 : now - i * 60000 }))
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await ctx.clock.setFixedTime(new Date(now))
  const p = await ctx.newPage()
  const url = `http://127.0.0.1:${PORT}/`
  await p.goto(url)
  await p.evaluate(({ s, keys }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    keys.forEach((k) => localStorage.setItem(k, '1'))
  }, { s: { recipes, seedV: BASICS_VERSION }, keys: Object.values(COACH) })
  await p.goto(url); await p.waitForTimeout(2200)
  await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(900)
  await p.getByText(이름, { exact: true }).first().click(); await p.waitForTimeout(1500)
  // 📖 상세 표지(유저가 보는 것 · 냄비 그림까지) — 꾸미기 조각들의 판 = 첫 조각의 부모
  const cr = await p.evaluate(() => { const it = document.querySelector('[data-decor-item]'); if (!it) return null; const b = it.parentElement.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
  await p.screenshot({ path: `${OUT}/상세-${이름}.png` })
  console.log('📖', 이름, JSON.stringify(cr))
  await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(2200)
  const rr = await p.evaluate(() => { const e = document.querySelector('.decor-stage'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
  const 수 = await p.evaluate(() => document.querySelectorAll('.decor-stage [data-decor-item]').length)
  if (!rr) { await p.screenshot({ path: `${OUT}/표지-${이름}-못찾음.png` }); console.log('⚠️ 판 못 찾음', 이름); continue }
  await p.screenshot({ path: `${OUT}/표지-${이름}.png`, clip: rr })
  await ctx.close(); console.log('📸', 이름, JSON.stringify(rr), '조각', 수)
}
await b.close(); srv.kill()
