// 🎃 [2026-09-29] 통단호박 크림스프 샘플 표지 — 창업자가 전찌개에 꾸민 배치를 그대로 옮기고 «그릇 넷»을 하나씩 얹어 찍는다
//    📮 창업자 = "크림배경 넣고. 펭펭 · 옆에 스티커1개 냄비그릇, 위에 BOO스티커 1개" → "스프는 냄비가 아니지" → "그릇이 들어가야예쁘지 · 해봐봐"
//    자리 = 창업자 캡처(전찌개 표지 923×922)에서 잰 가운데·폭 비율 · ⚠️ 효과(움직임)는 아직 안 옮겼다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const OUT = process.env.OUT || '/tmp'
const { allBasicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const ID = 'basic-tong-danhobak-cream-soup'
// 🧮 자리·크기는 «푼» 값 — tools/꾸미기-자리풀기.py 덮기 <그릇> --대상 n3048 (통과 범위 한가운데 후보 · 2026-09-29)
const 그릇값 = { pf_hw01: [0.77, 0.4932, 0.4614], pf_hw04: [0.75, 0.4949, 0.4532], pf_hw09: [0.64, 0.4983, 0.4647], pf_hw10: [0.68, 0.4932, 0.4433] }
const 그릇들 = Object.keys(그릇값)
const PORT = 4337
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 그릇 of 그릇들) {
  const now = Date.parse('2026-10-16T12:00:00+09:00')
  const recipes = allBasicRecipes.filter((r) => !r.from || r.from <= '2026-10-16').map((r, i) => {
    const base = { ...r, status: 'sorted', savedAt: now - i * 60000 }
    if (r.id !== ID) return base
    return { ...base, savedAt: now + 60000, touched: true, decorBg: 'hwfelt', decor: [
      { id: 'd1', type: 'sticker', key: 그릇, s: 그릇값[그릇][0], x: 그릇값[그릇][1], y: 그릇값[그릇][2], r: 0 },
      { id: 'd2', type: 'sticker', key: 'hp_14', x: 0.35, y: 0.21, s: 0.19, r: -6 },
      { id: 'd3', type: 'sticker', key: 'hp_18', x: 0.79, y: 0.70, s: 0.18, r: 0 },
      { id: 'd4', type: 'sticker', key: 'hw_11', x: 0.62, y: 0.84, s: 0.19, r: 0 },
    ] }
  })
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
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
  await p.getByText('통단호박 크림스프', { exact: true }).first().click(); await p.waitForTimeout(1500)
  await p.screenshot({ path: `${OUT}/호박스프-${그릇}.png`, clip: { x: 0, y: 0, width: 390, height: 520 } })
  await ctx.close(); console.log('📸', 그릇)
}
await b.close(); srv.kill()
