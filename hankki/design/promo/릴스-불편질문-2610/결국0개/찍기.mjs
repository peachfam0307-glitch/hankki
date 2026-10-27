// 「결국 0개」 릴스 — 자막 PNG · ④ 레꾸 붙기 · ⑤ 끝 장을 프레임으로 찍는다
import { chromium } from '/home/user/hankki/hankki/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const W = fileURLToPath(new URL('.', import.meta.url))
const 자막 = [['할로윈 레꾸자랑 DM', '결국… 0개 ㅋㅋ'], ['괜찮아!', '우리가 꾸미면 되지!'], ['저희끼리', '신났어요 ㅋㅋ'], ['크리스마스 땐', '보내줄 거죠?']]
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [i, [a, b]] of 자막.entries()) {
  await p.goto('file://' + W + '자막-A.html?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b))
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
  await p.screenshot({ path: `${W}cap${i + 1}.png`, omitBackground: true })
}
// 애니메이션 장면 = 시간을 멈추고 프레임마다 찍는다(30fps)
async function 찍기 (html, 폴더, 초) {
  mkdirSync(W + 폴더, { recursive: true })
  await p.goto('file://' + W + html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
  for (let f = 0; f < 초 * 30; f++) {
    const t = f * 1000 / 30
    await p.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t }), t)
    await p.screenshot({ path: `${W}${폴더}/f${String(f).padStart(4, '0')}.png` })
  }
}
await 찍기('장면4-레꾸에붙기.html', 's4', 3)
await 찍기('장면-끝.html', 's5', 2.4)
await br.close()
console.log('ok')
