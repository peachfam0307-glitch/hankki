// 📸 검수판 — 창업자 자료 19개가 실제 장보기 화면에 어떻게 뜨나 (규칙 13)
//   ⛔ 숫자만 재고 보내지 않는다 — 내가 열어서 본다(규칙 21).
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { SEED_COACH_SEEN } from '../src/coach.js'

const BASE = 'http://127.0.0.1:4186'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const srv = spawn('npx', ['vite', 'preview', '--port', '4186', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2800)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const 오류 = []
const ctx = await b.newContext({ viewport: { width: 411, height: 1100 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const p = await ctx.newPage()
p.on('pageerror', (e) => 오류.push(String(e)))

await p.goto(BASE, { waitUntil: 'networkidle' })
await 잠깐(700)
await p.getByRole('button', { name: '장보기', exact: true }).click()
await 잠깐(900)

// 🛡 가려진 화면을 찍는 사고를 두 번 냈다 — 재서 못 박는다
const 덮개 = await p.evaluate(() => {
  const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  return el ? (el.closest('[class*="onboard"],[class*="sheet"],[class*="overlay"],[class*="coach"]')?.className || '') : 'none'
})
if (덮개) 오류.push(`⛔ 화면을 덮은 것 → ${덮개}`)

const 잰것 = await p.evaluate(() => {
  const 글 = document.body.innerText
  const 카드 = [...document.querySelectorAll('.shop-row, .cur-card, [class*="curation"]')].length
  return {
    픽: (글.match(/이번 주 픽[\s\S]{0,300}/) || [''])[0].split('\n').slice(0, 8),
    조합원: (글.match(/조합원만/g) || []).length,
    글자수: 글.length,
    카드,
  }
})
console.log('이번 주 픽 자리:', JSON.stringify(잰것.픽, null, 1))
console.log('「조합원만」 배지:', 잰것.조합원, '개')

// 📸 화면을 통째로 — 새 제품이 어디에 어떻게 붙었나
const H = await p.evaluate(() => document.querySelector('.screen')?.scrollHeight || document.body.scrollHeight)
for (const [이름, y] of [['1', 0], ['2', Math.round(H * 0.22)], ['3', Math.round(H * 0.45)], ['4', Math.round(H * 0.68)]]) {
  await p.evaluate((v) => { const s = document.querySelector('.screen'); if (s) s.scrollTop = v; else scrollTo(0, v) }, y)
  await 잠깐(350)
  await p.screenshot({ path: `${OUT}/장바구니19-${이름}.png` })
}
console.log(`\n  ${오류.length ? '⛔' : '✅'} pageerror·덮개 ${오류.length}`)
오류.forEach((e) => console.log('     ' + e))
await b.close()
srv.kill()
process.exit(0) // ⛔ spawn 한 서버가 이벤트 루프를 붙잡는다
