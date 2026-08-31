// 📸 만든 판을 «열어서» 눈으로 본다 (절대원칙 21 — 보여주기 전에 내가 실물을 본다)
// 실행: node /home/user/hankki/hankki/scripts/_shot-판-0828.mjs <html> <낼png> [폭]
// ⛔ (dist 가 낡았나 검사)를 부르지 «않는다» — 이 판은 앱을 안 띄우고
//    이미 만들어진 HTML 파일 하나를 열 뿐이라 dist 와 아무 상관이 없다.
//    (처음엔 넣었다가 「dist 가 낡았다」로 죽었다 — 검사가 «무엇을 보는지»가 안 맞았다)
import { chromium } from 'playwright'
const [, , 길, 낼것, 폭 = '430'] = process.argv
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: Number(폭), height: 1200 }, deviceScaleFactor: 2 })
await p.goto('file://' + 길)
await p.waitForTimeout(900)
const 안뜬것 = await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')))
if (안뜬것.length) { console.error('⛔ 그림이 안 떴다 →', 안뜬것); process.exit(1) }
await p.screenshot({ path: 낼것, fullPage: true })
console.log('📸', 낼것)
await b.close()
