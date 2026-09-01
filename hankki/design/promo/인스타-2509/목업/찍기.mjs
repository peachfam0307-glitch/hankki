// 🎬 목업 대화방을 프레임으로 찍는다 (1080×1920 · 30fps)
//    node 찍기.mjs --미리      → 중요한 순간 4장만 (눈으로 검수 · 절대원칙 21)
//    node 찍기.mjs             → 전 프레임
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const END = 7.90
const FPS = 30
const 미리 = process.argv.includes('--미리')
const 낼곳 = join(여기, 미리 ? '미리' : '프레임')

rmSync(낼곳, { recursive: true, force: true })
mkdirSync(낼곳, { recursive: true })

const browser = await chromium.launch({ args: ['--force-device-scale-factor=1'] })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
const 오류 = []
page.on('pageerror', (e) => 오류.push(String(e)))
await page.goto('file://' + join(여기, '대화방.html'))

const H = await page.evaluate(() => window.준비())
console.log('📐 말풍선 자연 높이 =', H.map((h) => Math.round(h)).join(' · '))
console.log('📐 합계 =', Math.round(H.reduce((a, b) => a + b, 0)), 'px  (대화칸 1620px)')

const 찍기 = async (t, 이름) => {
  await page.evaluate((tt) => window.setFrame(tt), t)
  await page.screenshot({ path: join(낼곳, 이름), animations: 'disabled' })
}

if (미리) {
  for (const [t, 이름] of [[0.00, 'a-시작.png'], [1.20, 'b-레꾸커버.png'], [4.60, 'c-레시피.png'], [7.85, 'd-끝.png']]) {
    await 찍기(t, 이름)
  }
  console.log('✅ 미리보기 4장 →', 낼곳)
} else {
  const n = Math.round(END * FPS)
  for (let i = 0; i < n; i++) await 찍기(i / FPS, String(i).padStart(4, '0') + '.png')
  console.log(`✅ ${n}프레임 →`, 낼곳)
}

if (오류.length) { console.error('⛔ 화면 오류', 오류); process.exitCode = 1 }
await browser.close()
