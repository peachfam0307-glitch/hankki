// 2판 — 확정 그림 3장을 그대로 두고 움직임은 CSS 로(얼굴이 안 깨진다)
import { chromium } from '/home/user/hankki/hankki/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const W = fileURLToPath(new URL('.', import.meta.url))
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
for (const s of ['1', '2', '3']) {
  const 폴더 = `${W}m${s}`; mkdirSync(폴더, { recursive: true })
  await p.goto('file://' + W + '장면-정지움직임.html?s=' + s)
  await p.evaluate(() => document.fonts.ready); await p.waitForFunction(() => document.getElementById('pic').complete); await p.waitForTimeout(200)
  await p.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
  for (let f = 0; f < 90; f++) {
    await p.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t }), f * 1000 / 30)
    await p.screenshot({ path: `${폴더}/f${String(f).padStart(4, '0')}.png` })
  }
}
await br.close(); console.log('ok')
