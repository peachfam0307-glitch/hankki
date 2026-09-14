import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 420, height: 900 } })
await p.goto('file:///tmp/굴려보기.html')
await p.waitForTimeout(800)
for (const [갈래, 이름] of [['hw','핼러윈'],['cs','추석']]) {
  await p.evaluate((g) => document.querySelector(`[data-g="${g}"]`)?.click(), 갈래)
  await p.waitForTimeout(400)
  const roll = await p.$('#roll')
  await roll.evaluate((e) => (e.scrollTop = 0)); await p.waitForTimeout(300)
  await p.screenshot({ path: `/tmp/시안-${이름}-위.png` })
  await roll.evaluate((e) => (e.scrollTop = e.scrollHeight)); await p.waitForTimeout(300)
  await p.screenshot({ path: `/tmp/시안-${이름}-아래.png` })
}
await b.close()
