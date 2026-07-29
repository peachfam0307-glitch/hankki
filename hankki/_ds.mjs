// 꾸미기 '데코' 탭 실제 렌더 확인 — 새 스티커 그룹이 진짜 보이는지 + 런타임 에러 0
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4195/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4195', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
    'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
    'hankki:coach:profile'].forEach((x) => { try { localStorage.setItem(x, '1') } catch { /* noop */ } })
})
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(BASE, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200)
await p.getByRole('button', { name: '레시피', exact: true }).click()
await p.waitForTimeout(900)
await p.locator('[data-coach="myrecipes-grid"] button, .grid2 button').first().click()
await p.waitForTimeout(900)
await p.getByRole('button', { name: /꾸미기/ }).first().click()
await p.waitForTimeout(1400)
await p.getByRole('button', { name: '데코', exact: true }).click()
await p.waitForTimeout(1200)

// 그룹 라벨이 실제로 붙었는지
const labels = await p.locator('.decor-sec-label').allInnerTexts()
console.log('데코 탭 그룹:', labels.join(' / '))
// 새 스티커 이미지가 실제 로드됐는지(깨진 이미지 = naturalWidth 0)
const imgStat = await p.evaluate(() => {
  const im = [...document.querySelectorAll('.decor-drawer img, .decor-sec img')]
  return { total: im.length, broken: im.filter((i) => i.complete && i.naturalWidth === 0).length }
})
console.log('서랍 이미지:', imgStat.total, '깨짐:', imgStat.broken)
const drawer = p.locator('.decor-drawer').first()
if (await drawer.count()) await drawer.screenshot({ path: '../_deco.png' })
else await p.screenshot({ path: '../_deco.png' })
console.log('pageerror:', errs.length, errs.slice(0, 3))
await b.close(); srv.kill()
