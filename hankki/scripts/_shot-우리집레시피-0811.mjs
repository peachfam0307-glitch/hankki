// 📸 시안 — 홈에 「우리집레시피」 줄이 붙은 모습 (창업자 판정용)
//   ✅ 창업자 확정 = 이름표 「우리집레시피」 · 안 ⒜(별도 줄) · 한 번에 3편
//   📐 창업자 *"폰에서는 2줄이 필요하지만 패드에서는 1줄에 다 들어가잖아"*
//   ⛔ 판정은 창업자가 한다(규칙 11) — 나는 «실물»만 찍는다.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const BASE = 'http://127.0.0.1:4175'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const srv = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2600)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const 오류 = []
const 잰것 = []

async function 찍자(이름, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => 오류.push(`${이름}: ${e}`))
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await 잠깐(900)

  // 「이번 주」 두 박스가 있는 자리만 찍는다 — 홈 전체를 찍으면 판정할 것이 안 보인다
  const pair = p.locator('.week-pair')
  const 있나 = await pair.count()
  if (있나) {
    await pair.scrollIntoViewIfNeeded()
    await 잠깐(400)
    await pair.screenshot({ path: `${OUT}/시안-${이름}.png` })
  }
  // 🔢 눈이 아니라 «재서» 확인한다 — 좌우로 놓였나(같은 y) / 위아래인가(다른 y)
  const box = await pair.evaluate((el) => {
    const kids = [...el.children].map((k) => k.getBoundingClientRect())
    return { n: kids.length, ys: kids.map((r) => Math.round(r.y)), ws: kids.map((r) => Math.round(r.width)) }
  }).catch(() => null)
  const kick = await p.locator('.weekly-kicker').allInnerTexts()
  const 넘침 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  잰것.push({ 이름, 판: `${w}×${h}`, 박스: box?.n, y: box?.ys, 폭: box?.ws, 이름표: kick, 넘침 })
  await ctx.close()
}

await 찍자('폰세로', 411, 891)
await 찍자('폴드세로', 765, 900)
await 찍자('폰가로', 891, 411)
await 찍자('패드가로', 1280, 900)
await 찍자('패드세로', 900, 1280)

console.log('')
for (const r of 잰것) {
  const 나란히 = r.y && r.y.length === 2 && r.y[0] === r.y[1]
  console.log(`  📐 ${r.이름.padEnd(3)} ${r.판.padEnd(9)} 박스 ${r.박스}개 · y ${JSON.stringify(r.y)} · 폭 ${JSON.stringify(r.폭)}`)
  console.log(`      ${나란히 ? '↔ 좌우 나란히' : '↕ 위아래'} · 이름표 ${JSON.stringify(r.이름표)} · 가로넘침 ${r.넘침}px`)
}
console.log(`\n  ${오류.length ? '⛔' : '✅'} pageerror ${오류.length}`)
오류.forEach((e) => console.log('     ' + e))
await b.close()
srv.kill()
process.exit(0) // ⛔ spawn 한 서버가 이벤트 루프를 붙잡는다
