import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
const SC = process.argv[2]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 950, height: 510 }, deviceScaleFactor: 1 })).newPage()
await p.setContent(readFileSync(`${SC}/_rain2.html`, 'utf8'))
await p.waitForTimeout(400)
mkdirSync(`${SC}/rain2fr`, { recursive: true })
// 4초 = 24fps × 96장. 2초 판은 그 안에 두 바퀴 → 이어붙여도 안 튄다
for (let i = 0; i < 96; i++) {
  await p.screenshot({ path: `${SC}/rain2fr/f${String(i).padStart(3, '0')}.png` })
}
console.log('✅ 96장')
await b.close()
