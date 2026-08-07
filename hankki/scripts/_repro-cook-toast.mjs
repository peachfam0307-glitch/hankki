// 🔬 재현 — 「만들었어요」를 누르면 «폼이 따라 뜬다» (창업자 확정 ①, 2026-08-06)
//
// 창업자 판정 = *"만들었어요 → **토스트만**, 시트 안 뜬다"*
//   (`docs/요리기록-다이어리-방향-2026-08-05.md` 9️⃣ 순서표 ①)
//
// ⚠️ 같이 봐야 하는 것 = **리뷰 청하기**.
//    `RecipeDetailScreen.jsx` 는 `{askReview && !logEntry && <ReviewAskSheet/>}` 라서
//    기록 시트를 없애면 «세 번째 요리» 직후 리뷰 시트가 **곧바로** 뜬다 → 마찰이 그대로다.
//    그래서 이 재현은 **세 번** 눌러 리뷰 시트까지 확인한다.
//
// 판정(고친 뒤 기대값)
//   ① 「만들었어요」 → 기록 시트 **안 뜬다** · 토스트만
//   ② 세 번째에도 리뷰 시트 **안 뜬다**
//   ③ 「내 요리 기록」을 **직접 열었다 닫으면** 그때 리뷰 시트가 뜬다 (v9.02 설계 의도 유지)
//   ④ 같은 날 또 누르면 **기록이 두 번 안 쌓인다**
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-cook-toast.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.SMOKE_PORT || 4188)
const BASE = `http://127.0.0.1:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined

let server, browser
const cleanup = async () => {
  try { if (browser) await browser.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
}
async function waitHttp(url, timeout = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('preview 준비 안 됨')
}

const LOG_SHEET = '요리 기록 남기기'   // DiaryEntrySheet 머리글
const REVIEW_SHEET = '번째 한 끼예요'   // ReviewAskSheet 머리글(REVIEW_AT 이 앞에 붙는다)

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

try {
  server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { cwd: process.cwd(), env: process.env })
  await waitHttp(BASE)

  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
      'hankki:coach:profile'].forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1800)

  const seen = (t) => page.getByText(t, { exact: false }).first().isVisible().catch(() => false)
  const diaryN = () => page.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary || []).length } catch { return -1 }
  })
  const goHome = async () => {
    const back = page.getByRole('button', { name: '뒤로' }).first()
    if (await back.isVisible().catch(() => false)) { await back.click().catch(() => {}); await page.waitForTimeout(600) }
  }

  // ── 세 번 「만들었어요」 ─────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    await goHome()
    await page.locator('.grid-card button').nth(i).click()
    await page.waitForTimeout(700)
    const title = (await page.locator('.h-title').last().innerText().catch(() => '?')).trim()
    const before = await diaryN()

    await page.locator('.action-bar button').last().click()
    await page.waitForTimeout(700)
    // 📸 창업자 검수판 — 「눌렀을 때 화면이 어떻게 되나」 한 장 (SHOT 을 주면 찍는다)
    if (process.env.SHOT && i === 0) await page.screenshot({ path: process.env.SHOT })
    await page.waitForTimeout(300)

    const sheet = await seen(LOG_SHEET)
    const review = await seen(REVIEW_SHEET)
    const after = await diaryN()
    console.log(`\n── ${i + 1}번째 「만들었어요」 · 『${title}』 ──`)
    console.log(`   기록 수 ${before} → ${after}`)
    if (after === before + 1) ok('기록이 하나 쌓였다'); else no(`기록이 ${after - before}개 늘었다`)
    if (sheet) no('기록 시트(「요리 기록 남기기」)가 따라 떴다 — 창업자가 빼라고 한 그 마찰')
    else ok('기록 시트 안 뜸 — 토스트만')
    if (review) no('리뷰 시트가 «요리 직후» 떴다 — 마찰이 그대로')
    else ok('리뷰 시트 안 뜸')

    // 열렸으면 닫고 다음으로 (안 닫으면 다음 클릭이 마스크에 먹힌다)
    if (sheet || review) {
      await page.getByRole('button', { name: '닫기' }).first().click().catch(() => {})
      await page.waitForTimeout(700)
      // ⚠️ 지금 코드는 `{askReview && !logEntry && …}` 라서 «시트를 닫는 순간» 리뷰가 이어서 뜬다.
      //    시트를 없애면 이 자리가 통째로 앞당겨진다 — 그게 딸려오는 문제다.
      if (await seen(REVIEW_SHEET)) {
        no('기록 시트를 닫자 리뷰 시트가 «이어서» 떴다 — 시트를 없애면 이게 요리 직후로 앞당겨진다')
        await page.getByRole('button', { name: '닫기' }).first().click().catch(() => {})
        await page.waitForTimeout(500)
      }
    }
  }

  // ── 같은 날 또 누르면? (두 번 집계 방지) ────────────────────────
  const dup0 = await diaryN()
  await page.locator('.action-bar button').last().click()
  await page.waitForTimeout(900)
  const dup1 = await diaryN()
  console.log('\n── 같은 레시피를 같은 날 또 누르면 ──')
  if (dup1 === dup0) ok('기록이 두 번 안 쌓인다')
  else no(`기록이 ${dup1 - dup0}개 더 쌓였다 — 하루 두 번 집계`)
  if (await seen(LOG_SHEET)) { no('기록 시트가 떴다'); await page.getByRole('button', { name: '닫기' }).first().click().catch(() => {}); await page.waitForTimeout(500) }
  else ok('기록 시트 안 뜸')

  // ── 「내 요리 기록」을 직접 열었다 닫으면 = 리뷰 청하는 자리 ──────
  console.log('\n── 「내 요리 기록」 직접 열기 → 닫기 ──')
  const card = page.getByText('내 요리 기록', { exact: true }).first()
  if (!(await card.isVisible().catch(() => false))) {
    no('「내 요리 기록」 카드가 안 보인다 — 리뷰를 청할 자리가 없다')
  } else {
    await card.click(); await page.waitForTimeout(700)
    if (await seen(LOG_SHEET)) ok('직접 누르면 기록 시트가 열린다')
    else no('기록 시트가 안 열린다')
    await page.getByRole('button', { name: '닫기' }).first().click().catch(() => {})
    await page.waitForTimeout(800)
    if (await seen(REVIEW_SHEET)) ok('닫는 순간 리뷰 시트가 뜬다 — v9.02 설계 의도 그대로')
    else no('리뷰 시트가 안 뜬다 — 리뷰 청하기가 죽었다')
  }

  if (errors.length) { errors.forEach((e) => no(`pageerror — ${e}`)) }
  else console.log('\n   ✅ pageerror 0')

  // ── 2판: 「요리 기록」 탭에서 열었다 닫아도 물어보나 ─────────────
  // ⭐ 기록을 제일 많이 여닫는 곳이 여기다. 1판에서 이미 «물어봤음»이 찍혔으니 새 사람으로 시작한다.
  console.log('\n══ 새 사람 · 요리 기록 탭에서 열었다 닫기 ══')
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx2.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
      'hankki:coach:profile'].forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
  })
  const p2 = await ctx2.newPage()
  p2.setDefaultTimeout(8000)
  const errors2 = []
  p2.on('pageerror', (e) => errors2.push(String(e.message || e).split('\n')[0]))
  await p2.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await p2.waitForTimeout(1800)
  const seen2 = (t) => p2.getByText(t, { exact: false }).first().isVisible().catch(() => false)

  for (let i = 0; i < 3; i++) {
    const back = p2.getByRole('button', { name: '뒤로' }).first()
    if (await back.isVisible().catch(() => false)) { await back.click().catch(() => {}); await p2.waitForTimeout(600) }
    await p2.locator('.grid-card button').nth(i).click(); await p2.waitForTimeout(700)
    await p2.locator('.action-bar button').last().click(); await p2.waitForTimeout(700)
  }
  const back2 = p2.getByRole('button', { name: '뒤로' }).first()
  if (await back2.isVisible().catch(() => false)) { await back2.click().catch(() => {}); await p2.waitForTimeout(600) }
  await p2.getByText('레시피', { exact: true }).last().click(); await p2.waitForTimeout(800)
  await p2.locator('.seg', { hasText: '한끼 일기' }).first().click(); await p2.waitForTimeout(700)
  const tile = p2.locator('.album-tile').first()
  if (!(await tile.isVisible().catch(() => false))) {
    no('요리 기록 탭에 앨범 칸이 없다 — 기록이 안 쌓였거나 탭을 못 열었다')
  } else {
    await tile.click(); await p2.waitForTimeout(700)
    // ⭐⭐ v9.95 창업자 확정(ⓒ) — *"이거 없애기로 하지않았어? 일기에서 만든음식 누르면 떠."*
    //    「한끼 일기」 앨범을 누르면 기록 시트가 아니라 **그날 일기**로 간다.
    //    기록 시트·리뷰 청하기는 «레시피 상세»에 그대로 산다(위 절이 이미 재고 있다).
    //    ⛔ 옛 판정(「앨범 → 기록 시트」)은 그 확정으로 뒤집힌 설계다 — 2026-08-07 전수검사에서 갈아엎음.
    if (await seen2(LOG_SHEET)) no('앨범을 눌렀는데 기록 시트가 뜬다 — v9.95 에 없앤 길이 되살아났다')
    else ok('⭐ 앨범을 눌러도 기록 시트가 «안» 뜬다 (v9.95 ⓒ)')
    const diaryOpened = await p2.getByRole('button', { name: '꾸미기 열기' }).first().isVisible().catch(() => false)
    if (diaryOpened) ok('⭐ 대신 «그날 일기»로 들어간다')
    else no('일기로도 안 간다 — 앨범이 죽은 단추다')
  }
  if (errors2.length) errors2.forEach((e) => no(`pageerror(2판) — ${e}`))
  else console.log('   ✅ pageerror 0')
} catch (e) {
  no(`실행오류 — ${String(e.message || e).split('\n')[0]}`)
} finally {
  await cleanup()
}

console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
