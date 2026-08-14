// 📸 새 57컷이 «앱 화면»에 실제로 뜨는지 — 숫자가 아니라 화면으로 본다(규칙 21)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const srv = spawn('npx', ['vite', 'preview', '--port', '4188'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
const 오류 = []
p.on('pageerror', e => 오류.push(String(e)))
// ⛔ 온보딩·코치마크가 화면을 덮으면 캡처가 헛것이 된다(2026-08-11 에 겪었다)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
})
await p.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
// 새 레시피 → 제목 치고 → 아이콘 픽커 열기
await p.getByRole('button', { name: /가져오기/ }).first().click().catch(() => {})
await p.waitForTimeout(400)
const 결과 = {}
// 🔎 픽커를 열어 새 컷이 그려지는지 «이미지 요소»로 센다
await p.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
결과.덮은것 = await p.evaluate(() => {
  const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  return e ? (e.className || e.tagName) + '' : 'none'
})
결과.깨진그림 = await p.evaluate(() => [...document.images].filter(i => !i.naturalWidth).length)
await p.screenshot({ path: '/tmp/앱-홈.png' })
console.log(JSON.stringify(결과), '· pageerror', 오류.length, 오류.slice(0, 2))
await b.close(); srv.kill(); process.exit(0)
