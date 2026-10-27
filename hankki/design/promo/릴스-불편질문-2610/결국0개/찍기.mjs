// 「결국 0개」 릴스 — 자막 PNG · ④ 레꾸 붙기 · ⑤ 끝 장을 프레임으로 찍는다
import { chromium } from '/home/user/hankki/hankki/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const W = fileURLToPath(new URL('.', import.meta.url))
const 자막 = [['할로윈 레꾸자랑 DM', '결국… 0개 ㅋㅋ'], ['괜찮아!', '우리가 꾸미면 되지!'], ['저희끼리', '신났어요 ㅋㅋ'], ['제1회 레꾸자랑 대상은', '…바로 저희요!']]
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [i, [a, b]] of 자막.entries()) {
  await p.goto('file://' + W + '자막-B.html?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b) + '&bg=%23FFEDAB&ink=%2375070C&sh=%234a0407')
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
  await p.screenshot({ path: `${W}cap${i + 1}.png`, omitBackground: true })
}
await br.close()
console.log('ok')
