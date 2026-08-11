// 홈 뒤로가기 = '한 번 더 누르면 나가요' → 진짜로 나가지는지 점검.
//
// 왜 이 테스트가 있나:
//   예전엔 홈에서 뒤로가기 → 종료 팝업 → 「나가기」 였는데, 그 버튼이 window.close() 라
//   설치형 앱(TWA)에선 브라우저가 막아 **아무 일도 안 일어났다.** ("홈 버튼으로 끄세요" 안내만 떴다)
//   자바스크립트로 앱을 닫는 방법은 없다. TWA 는 **히스토리가 다 떨어진 상태에서 시스템
//   뒤로가기**를 눌러야 액티비티가 종료된다. 그런데 우리는 갑작스런 종료를 막으려고 히스토리를
//   일부러 붙잡아뒀다(index.html 트랩 + App.jsx ensureGuard) → 영영 안 닫혔다.
//
// 그래서 이 테스트가 확인하는 핵심 = **첫 뒤로가기 뒤에 우리가 심은 히스토리 칸이 0이 되는가.**
//   하나라도 남으면 다음 뒤로가기가 그걸 먹고 앱은 또 안 닫힌다(= 예전 증상 그대로 재발).
//   ⚠️ 헤드리스 브라우저에는 '앱 종료'가 없어서 종료 자체는 못 재현한다. 대신 종료의 전제조건인
//      '히스토리 소진'을 못 박는다. 실제 종료는 실기기에서 확인.
//
// 같이 지키는 것: 다른 탭에서 뒤로가기는 여전히 '홈으로'(바로 종료 아님) — 가드가 살아 있어야 한다.
//
// 로컬: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/test-exit.mjs
import { chromium } from 'playwright'
import { SEED_COACH_SEEN } from '../src/coach.js'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.SMOKE_PORT || 4174)
const HOST = '127.0.0.1'
const BASE = `http://${HOST}:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined

let previewOut = ''
async function waitHttp(url, timeout = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 안 뜸 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`preview 준비 안 됨(${timeout}ms)\n${previewOut.slice(-800)}`)
}

const log = (...a) => console.log('[exit]', ...a)
const fails = []
let server, browser
async function cleanup() {
  try { if (browser) await browser.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
}
async function must(name, fn) {
  try { await fn(); log('✓', name) }
  catch (e) { fails.push(`${name} — ${String(e.message || e).split('\n')[0]}`); log('✗', name) }
}

try {
  server = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: process.cwd(), env: process.env })
  server.stdout?.on('data', (d) => { previewOut += d })
  server.stderr?.on('data', (d) => { previewOut += d })
  await waitHttp(BASE)

  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  // 🧭 코치는 «이름으로» 심지 않는다 — 키를 올리면 조용히 낡아 화면을 덮는다(2026-08-08 사고).
  //    `src/coach.js` 가 주는 조각이 **접두어 전체**를 「본 적 있음」으로 만든다 → 다음에 키를 올려도 안 낡는다.
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e).split('\n')[0]))

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1600)

  // 우리가 심어둔 히스토리 칸인지( {hankki:1} / {hankki:1,guard:1} ) — 이게 남아 있으면 못 나간다
  const ourEntry = () => page.evaluate(() => !!(history.state && history.state.hankki))

  // 0) 가드가 실제로 깔리는지 — 이게 안 깔리면 딴 탭에서 뒤로가기가 앱을 바로 종료시킨다
  await must('탭하면 히스토리 가드가 깔린다', async () => {
    await page.mouse.click(195, 700) // 아무 데나 탭(pointerup → ensureGuard)
    await page.waitForTimeout(300)
    if (!(await ourEntry())) throw new Error('가드가 안 깔림')
  })

  // 1) 홈에서 뒤로 1번 → 안내가 뜨고, 우리 칸이 남김없이 비워져야 한다 (= 다음 뒤로가기가 진짜 종료)
  await must('홈 뒤로가기 1번 → 안내 + 히스토리 소진', async () => {
    await page.goBack()
    await page.waitForTimeout(500)
    const hint = await page.getByText('한 번 더 누르면 나가요').first().isVisible().catch(() => false)
    if (!hint) throw new Error('"한 번 더 누르면 나가요" 안내가 안 뜸')
    if (await ourEntry()) throw new Error('우리 히스토리 칸이 남아 있음 = 다음 뒤로가기로도 앱이 안 닫힌다')
  })

  // 2) 대기 중엔 화면을 만져도 가드를 다시 심지 않아야 한다 (심으면 두 번째 뒤로가기를 먹어버림)
  await must('나가기 대기 중엔 가드를 다시 안 심는다', async () => {
    await page.mouse.click(195, 700)
    await page.waitForTimeout(200)
    if (await ourEntry()) throw new Error('대기 중에 가드가 다시 깔림 = 두 번째 뒤로가기가 막힌다')
  })

  // 3) 창(2초)이 지나면 다시 보호로 복귀 = 실수로 나가는 것 방지 (안내 무시하고 계속 쓰는 경우)
  await must('창이 지나면 가드가 되살아난다', async () => {
    await page.waitForTimeout(2100)
    await page.mouse.click(195, 700)
    await page.waitForTimeout(300)
    if (!(await ourEntry())) throw new Error('창이 지났는데도 가드가 안 깔림')
  })

  // 4) 다른 탭에서 뒤로가기는 '홈으로' — 여기서 바로 나가버리면 안 된다
  await must('다른 탭에서 뒤로가기 → 홈으로', async () => {
    await page.getByText('장보기', { exact: true }).last().click(); await page.waitForTimeout(700)
    await page.goBack(); await page.waitForTimeout(600)
    const onHome = await page.getByText('한 번 더 누르면 나가요').first().isVisible().catch(() => false)
    if (onHome) throw new Error('탭에서 뒤로가기가 곧장 나가기로 샜다')
    if (!(await ourEntry())) throw new Error('홈 복귀 후 보호 칸이 없음')
  })

  if (pageErrors.length) fails.push(`런타임 크래시 — ${[...new Set(pageErrors)].join(' / ')}`)
} catch (e) {
  fails.push(`실행오류 — ${String(e.message || e).split('\n')[0]}`)
} finally {
  await cleanup()
}

if (fails.length) {
  console.error('\n❌ 나가기 점검 실패 — 배포 차단')
  fails.forEach((f) => console.error('  ✗', f))
  process.exit(1)
}
console.log('\n✅ 나가기 점검 통과 — 뒤로 두 번이면 히스토리가 비고, 탭 뒤로가기는 홈으로')
process.exit(0)
