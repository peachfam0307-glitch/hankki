// 🗓 재현판 — 홈 「이번 주」 줄의 kicker 가 주마다 바뀌나
//
// 📮 창업자 2026-08-11: *"그럼 제목은어떻게 올라가? 우리 주별로 제철이랑 이벤트레시피올라가자나"*
//    → 파 보니 홈의 **「이번 주 제철」이 글자로 박혀 있었다**(HomeScreen).
//       제철이 «아닌» 주도 「이번 주 제철」로 뜬다 — `2026-09-28 추석 남은 음식` 이 실제로 그랬다.
//    ⭐ 52주 표는 **제철 35 ＋ 나머지 17** 이라 그냥 두면 17주가 전부 거짓말이 된다.
//
// ⭐⭐ 시계를 속여서 «미래 주»를 연다 — `addInitScript` 로 Date 를 바꿔치기하면
//    `weeklyNow` 가 그날을 봐서 그 주가 그대로 열린다 (v10.23 9/1 검수판과 같은 방법).
//
// ⛔ 규칙 12 — 옛 코드(고정 글자)로 되돌리면 ②가 «반드시» 실패해야 한다.
//    안 그러면 이 검사는 「실패할 줄 모르는 칸」이다.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const BASE = 'http://127.0.0.1:4174'
const srv = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2600)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const 판 = []
const 오류 = []

// 그날로 시계를 맞추고 홈의 「이번 주」 줄을 읽는다
async function 그날(날짜) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => 오류.push(`${날짜}: ${e}`))
  await p.addInitScript(`{
    const 고정 = new Date('${날짜}T09:00:00+09:00').getTime()
    const R = Date
    Date = class extends R { constructor(...a){ if(!a.length) super(고정); else super(...a) } static now(){ return 고정 } }
    Date.parse = R.parse; Date.UTC = R.UTC
  }`)
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await 잠깐(700)
  const box = p.locator('.weekly-box')
  const 있나 = await box.count()
  const out = { 있나, kicker: null, title: null }
  if (있나) {
    out.kicker = (await box.locator('.weekly-kicker').innerText()).trim()
    out.title = (await box.locator('.weekly-title').innerText()).trim()
  }
  await ctx.close()
  return out
}

// ① 오늘 (제철 주) — 기본값 그대로여야 한다
const a = await 그날('2026-08-11')
판.push([a.kicker === '이번 주 제철' && a.title === '깻잎', '① 제철 주는 「이번 주 제철」 그대로', `${a.kicker} / ${a.title}`])

// ② 9/28 (명절 뒤) — ⛔여기가 「이번 주 제철」이면 실패
const c = await 그날('2026-09-28')
판.push([c.title === '추석 남은 음식', '②-0 9/28 에 그 주가 열린다', `${c.title}`])
판.push([c.kicker === '이번 주는', '② 제철 아닌 주는 kicker 가 바뀐다', `${c.kicker} / ${c.title}`])
판.push([c.kicker !== '이번 주 제철', '②-2 ⛔「이번 주 제철」이 아니어야 한다', `${c.kicker}`])

// ③ 다음 제철 주(10/05 고구마)도 기본값이 살아 있나 — kicker 를 넣은 줄만 바뀌어야 한다
const d = await 그날('2026-10-05')
판.push([d.kicker === '이번 주 제철' && d.title === '고구마', '③ 다른 주는 안 건드려졌다', `${d.kicker} / ${d.title}`])

// ④ kicker 를 안 적은 줄이 «전부» 기본값인가 (데이터 쪽 확인)
const { WEEKLY } = await import('../src/data/weekly.js')
const 적힌줄 = WEEKLY.filter((w) => w.kicker)
판.push([적힌줄.length === 1 && 적힌줄[0].from === '2026-09-28', '④ kicker 를 적은 줄은 9/28 하나뿐', `${적힌줄.length}줄`])

console.log('')
for (const [ok, n, v] of 판) console.log(`  ${ok ? '✅' : '⛔'} ${n}  —  ${v}`)
console.log(`\n  ${오류.length ? '⛔' : '✅'} pageerror ${오류.length}`)
오류.forEach((e) => console.log('     ' + e))
const 다통과 = 판.every(([o]) => o) && !오류.length
console.log(`\n  ${다통과 ? '🎉 전부 통과' : '⛔ 어긋난 칸이 있다'}`)

await b.close()
srv.kill()
process.exit(다통과 ? 0 : 1) // ⛔ spawn 한 서버가 이벤트 루프를 붙잡는다 — 반드시 명시적으로 끝낸다
