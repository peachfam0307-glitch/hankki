// 🔑 [2026-09-30] 레시피 열쇠 — 통단호박 크림스프(10/16)가 «열쇠 켠 폰»에서만 미리 보이나
//    ① 열쇠 없음 → 레시피 목록에 없다 ② ?할로윈=1 → 있다 ＋ 표지를 찍는다(샘플 꾸미기)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const OUT = process.env.OUT || '/tmp'
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const PORT = 4339
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
let 실패 = 0
for (const [이름, 뒤] of [['열쇠없음', ''], ['열쇠켬', '?할로윈=1']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.clock.setFixedTime(new Date('2026-09-30T12:00:00+09:00'))
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/${뒤}`); await p.waitForTimeout(2500)
  await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(1000)
  const 있다 = await p.getByText('통단호박 크림스프', { exact: true }).count() > 0
  const 맞다 = 이름 === '열쇠없음' ? !있다 : 있다
  if (!맞다) 실패++
  console.log(맞다 ? '  ✅' : '  ⛔', 이름, '→ 스프', 있다 ? '보임' : '안 보임')
  if (있다) { await p.getByText('통단호박 크림스프', { exact: true }).first().click(); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/열쇠-${이름}.png`, clip: { x: 0, y: 0, width: 390, height: 520 } }) }
  await ctx.close()
}
await b.close(); srv.kill()
process.exit(실패 ? 1 : 0)
