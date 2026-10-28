import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 460, height: 1000 } })
p.on('pageerror', (e) => console.log('❌ 오류:', e.message))
await p.goto('file:///tmp/장식판.html')
await p.waitForTimeout(1500)
for (const g of ['cs', 'hw']) {
  await p.evaluate((x) => document.querySelector(`[data-g="${x}"]`)?.click(), g)
  await p.waitForTimeout(300)
  console.log(g, '서랍 컷', await p.evaluate(() => document.querySelectorAll('#tray button, #tray .chip').length))
}
await p.screenshot({ path: '/tmp/판v3.png' })
await b.close()
