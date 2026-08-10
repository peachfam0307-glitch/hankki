import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { SEED_COACH_SEEN } from '../src/coach.js'
const PORT = 4188
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })).newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  raw.recipes = [{ id: 'my-sauce', title: '고마다래 소스', source: 'manual', createdAt: Date.now(),
    ingredients: ['깨 3큰술 (곱게 갈아서)', '간장 3큰술', '마요네즈 2큰술', '아우노슈가 2와1/4큰술 (일반설탕 1과1/2큰술)', '참기름 1큰술'], steps: [] },
    ...(raw.recipes || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(raw))
})
await p.reload({ waitUntil: 'networkidle' })
await p.getByText('고마다래 소스', { exact: true }).first().click()
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/만들었어요-순서없음.png' })
console.log('액션바 =', await p.locator('.action-bar').innerText())
await b.close(); srv.kill(); process.exit(0)
