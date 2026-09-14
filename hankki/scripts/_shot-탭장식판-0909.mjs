// 🗂 탭 장식 놓아보기 판이 «빈 판»으로 안 나가는지 확인한다 — 탭 5개 배경이 다 뜨는지, 오류가 없는지.
// ⛔ 2026-09-09 사고 = 자리표를 못 찾아도 조용히 넘어가면 빈 판이 나간다. 그래서 눈으로 본다.
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 460, height: 1100 } })
p.on('pageerror', (e) => console.log('❌ 오류:', e.message))
await p.goto('file:///tmp/탭장식판.html')
await p.waitForTimeout(1500)
const 조각 = []
for (const g of ['rec', 'log', 'shop', 'fridge', 'brag']) {
  await p.evaluate((x) => document.querySelector(`[data-g="${x}"]`)?.click(), g)
  await p.waitForTimeout(500)
  const 상태 = await p.evaluate(() => {
    const im = document.getElementById('bg')
    return { 배경: (im.src || '').slice(0, 24), 폭: im.naturalWidth, 서랍: document.querySelectorAll('#tray button').length }
  })
  console.log(g, JSON.stringify(상태))
  조각.push(await p.locator('.stage, #stage').first().screenshot())
}
await p.screenshot({ path: '/tmp/탭판.png' })
await b.close()
