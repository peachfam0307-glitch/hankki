// 📸 시안 — 홈에 「우리집레시피」 줄이 붙은 모습 (창업자 판정용)
//   ✅ 창업자 확정 = 이름표 「우리집레시피」 · 안 ⒜(별도 줄) · 한 번에 3편
//   📐 창업자 *"폰에서는 2줄이 필요하지만 패드에서는 1줄에 다 들어가잖아"*
//   ⛔ 판정은 창업자가 한다(규칙 11) — 나는 «실물»만 찍는다.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
// 🧭 코치는 «이름으로» 심지 않는다 — 키를 올리면 조용히 낡아 화면을 덮는다(2026-08-08 사고).
import { SEED_COACH_SEEN } from '../src/coach.js'

const BASE = 'http://127.0.0.1:4175'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const srv = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2600)

// 🍳 창업자가 2026-08-11 에 컨펌한 36편 중 «생활요리» 3편 — id 는 `weekly.js` HOMEMADE 와 같아야 한다.
//   ⛔ 본문은 시안에 안 쓰이니 안 넣는다(제목·아이콘만 보인다).
const 시드3편 = [
  { id: 'basic-ganjang-jeyuk', title: '간장 제육볶음', ingredients: [], steps: [], savedAt: 3 },
  { id: 'basic-ojingeo-saeujeon', title: '오징어 새우전', ingredients: [], steps: [], savedAt: 2 },
  { id: 'basic-deulgireum-dubu-jeongol', title: '들기름 두부전골', ingredients: [], steps: [], savedAt: 1 },
]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const 오류 = []
const 잰것 = []

async function 찍자(이름, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  // ⛔⛔ 온보딩을 «먼저» 끈다 — 첫 방문이라 앱 소개가 홈 «위»를 덮는다.
  //    2026-08-11 실제 사고: 이걸 안 해서 시안 3장이 전부 «온보딩 화면»이었다.
  //    ⚠️ 숫자(y·폭)는 멀쩡히 나왔다 — `.week-pair` 가 DOM 에 있으니 재지긴 한다.
  //       **가려진 것을 숫자는 모른다.** 그래서 통과한 것처럼 보였다(규칙 18 ⓘ).
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  // ⛔ 코치마크도 꺼야 한다 — 온보딩만 껐더니 «화면 전체가 어두운» 시안이 나왔다(2026-08-11).
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => 오류.push(`${이름}: ${e}`))
  await p.goto(BASE, { waitUntil: 'networkidle' })
  // 🍳 창업자 36편은 아직 `basics.js` 에 «없다» → 시안에서만 시드로 넣는다.
  //   ⛔ 기존 레시피로 대신 찍었더니 창업자가 잡았다(*"소고기미역국은 원래 있었던 레시피야 뭉티기랑"*).
  //      시안은 «앞으로 뜰 화면»을 보여주는 것이라 «그 레시피»가 떠야 한다.
  await p.evaluate((더할것) => {
    const KEY = 'hankki:v1'
    const s = JSON.parse(localStorage.getItem(KEY) || '{}')
    s.recipes = [...더할것, ...(s.recipes || [])]
    localStorage.setItem(KEY, JSON.stringify(s))
  }, 시드3편)
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await 잠깐(900)
  // 🛡 「진짜 홈이 맨 위인가」를 재서 못 박는다 — 안 그러면 또 가려진 화면을 찍는다
  const 덮개 = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    return el ? (el.closest('[class*="onboard"],[class*="sheet"],[class*="overlay"],[class*="coach"]')?.className || '') : 'none'
  })
  if (덮개) 오류.push(`${이름}: ⛔ 화면을 덮은 것이 있다 → ${덮개}`)

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
