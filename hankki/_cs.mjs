// 카드 스킨 렌더 — ?card=<스킨키> 로 고정 (warm/plum/sky/mustard/summer/night)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4194/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4194', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const SHOTS = (process.env.SHOTS || 'warm').split(',')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const errs = []
for (const k of SHOTS) {
  const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
      'hankki:coach:profile'].forEach((x) => { try { localStorage.setItem(x, '1') } catch { /* noop */ } })
  })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errs.push(`${k}: ${e}`))
  await p.goto(`${BASE}?card=${k}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2200)
  await p.getByRole('button', { name: '레꾸자랑' }).click()
  await p.waitForTimeout(1000)
  await p.locator('[data-coach="brag-list"] button').first().click()
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).click()
  await p.waitForTimeout(3200)
  // 카드 요소만 찍는다(폰 화면 크롭이면 위아래가 잘린다)
  const card = p.locator('div[style*="width: 1080px"][style*="height: 1350px"]').first()
  if (await card.count()) await card.screenshot({ path: `../_k_${k}.png` })
  else await p.screenshot({ path: `../_k_${k}.png` })
  await ctx.close()
  console.log('찍음:', k)
}
console.log('pageerror:', errs.length, errs.slice(0, 3))
await b.close(); srv.kill()
