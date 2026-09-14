// 홍보 카드 렌더러 (HTML → PNG, 2배 고해상도)
// 사용법:  node render.mjs templates/launch-1080x1350.html out.png
// 기본값:  templates/launch-1080x1350.html → launch.png
//
// 이 환경 전제(원격 실행 컨테이너):
//   - Chromium: /opt/pw-browsers/chromium-1194/chrome-linux/chrome
//   - Node   : /opt/node22/bin/node  (playwright 는 /opt/node22 전역 설치)
//   경로가 바뀌면 아래 두 상수만 고치면 됨.
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const { chromium } = pw
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const inFile = process.argv[2] || 'templates/launch-1080x1350.html'
const outFile = process.argv[3] || 'launch.png'
const abs = (p) => new URL(p, import.meta.url).pathname

const b = await chromium.launch({ executablePath: CHROME })
const c = await b.newContext({ deviceScaleFactor: 2 })
const p = await c.newPage()
await p.goto('file://' + abs(inFile), { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(300)
await p.locator('.card').first().screenshot({ path: abs(outFile) })
console.log('저장:', outFile)
await b.close()
