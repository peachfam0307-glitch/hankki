// 📺 「SNS 요리」 실물 스샷 — 홈 상자 · 레시피 탭 SNS 칩 · 상세 원본 링크 (2026-09-03)
//
// 📮 창업자 = *"스샷찍어줘 만든거 보게에"*
// ⛔ 절대원칙 21 — 창업자에게 보내기 «전»에 내가 열어서 눈으로 본다.
// ⛔ 결과 PNG 는 scratchpad 에만 (저장소가 public).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/3e7cc7f3-a746-5daf-b584-984c5d968d3d/scratchpad/sns'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 창업자 폰(갤럭시) 비슷하게
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
// ⛔ 온보딩·코치마크를 꺼야 화면이 안 가려진다 (2026-08-11 사고 — 시안 3장이 전부 온보딩이었다)
await ctx.addInitScript(SEED_COACH_SEEN)
// ⛔⛔ [2026-09-03] 문이 «셋»이었다 — 로그인 → 확인 시트 → **온보딩**.
//   `SEED_COACH_SEEN` 은 코치마크만 끈다. 온보딩은 `hankki:onboarded` 가 따로 연다(`Onboarding.jsx:34`).
//   📌 2026-08-11 사고가 정확히 이거였다(시안 3장이 전부 온보딩) — 그때 배운 걸 여기서 또 밟았다.
//   그리고 «넷째» 문 = 9월 소식 팝업(`NewsPopup.jsx:32` `hankki:news:off`).
//   📌 화면을 찍을 땐 «문이 몇 개인지»를 먼저 세어야 한다 — 하나씩 만나며 고치면 네 번 헛돈다(오늘 그랬다).
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
  } catch { /* noop */ }
})
let page = await ctx.newPage()
page.setDefaultTimeout(15000)
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

// ⛔⛔ [2026-09-03] 첫 판이 «로그인 화면»을 찍었다 — 상자는 DOM 에 있어서 `count()` 는 1을 줬는데
//    화면은 통째로 가려져 있었다. **2026-08-11 「시안 3장이 전부 온보딩」 사고와 «똑같다»**(절대원칙 21).
//    ⭐ `SEED_COACH_SEEN` 은 코치마크만 끄지 «로그인 화면»은 안 끈다 — 그건 다른 문이다.
//   ⭐ 그리고 「나중에 하기」는 **확인 시트를 하나 더 연다**(`CloudGate.jsx:228` ConfirmSheet).
//      첫 판에서 내가 Escape 를 눌러 그 시트를 «취소»하고 있었다 → 로그인 화면이 그대로 남았다.
//      ✅ 확인 단추 「그냥 시작하기」까지 눌러야 지나간다.
const 나중 = page.getByText('나중에 하기', { exact: true })
if (await 나중.count()) {
  console.log('  🚪 로그인 화면이 떴다 → 「나중에 하기」')
  await 나중.first().click({ force: true })
  await page.waitForTimeout(1200)
  const 시작 = page.getByRole('button', { name: '그냥 시작하기' })
  if (await 시작.count()) {
    console.log('  🚪 확인 시트 → 「그냥 시작하기」')
    await 시작.first().click({ force: true })
    await page.waitForTimeout(1800)
  }
}
// ⭐ 진짜로 홈이 떴나 — 화면 «한가운데»를 덮은 것이 있는지 본다(숫자만 믿지 않는다)
//   ⛔ 「나중에 하기」를 눌러도 `sheet-mask` 가 남는 판이 있었다 → 없어질 때까지 지나간다.
const 가운데 = () => page.evaluate(() => {
  const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  return el ? ((el.className && typeof el.className === 'string' ? el.className : el.tagName) + '') : '(없다)'
})
for (let i = 0; i < 5; i++) {
  const c = await 가운데()
  if (!/mask|overlay|onboard|coach|sheet/i.test(c)) break
  console.log(`  🚪 아직 덮여 있다(${c}) → 지나간다`)
  await page.keyboard.press('Escape').catch(() => {})
  await page.mouse.click(20, 20).catch(() => {})
  await page.waitForTimeout(900)
}
console.log('  🔎 화면 한가운데 =', await 가운데())

// ⛔⛔ 그래도 로그인 화면이 안 사라졌다 — 「나중에 하기」를 눌러도 그대로였다.
//   ✅ 재현판(`_repro-영상표-0903.mjs`)이 쓰는 방식 = **새 탭으로 다시 연다.**
//      첫 방문에만 뜨는 문이라 두 번째 방문엔 안 뜬다.
//   ⛔ `page.reload()` 는 쓰지 않는다 — `addInitScript` 가 다시 돌아 저장값을 덮는다(CLAUDE.md 옛 함정 사전).
if (await page.getByText('Google 계정으로 시작하기').count()) {
  console.log('  🚪 아직 로그인 화면이다 → 새 탭으로 다시 연다')
  const page2 = await ctx.newPage()
  page2.setDefaultTimeout(15000)
  await page2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(2500)
  await page.close()
  page = page2
  console.log('  🔎 다시 연 뒤 로그인 화면 =', await page.getByText('Google 계정으로 시작하기').count(), '개')
}

const 찍기 = async (이름, opt = {}) => {
  const p = join(OUT, `${이름}.png`)
  await page.screenshot({ path: p, ...opt })
  console.log('  📸', p)
}

// ① 홈 — SNS 요리 상자로 스크롤
const 상자 = page.locator('.weekly-box').filter({ hasText: 'SNS 요리' })
const 있나 = await 상자.count()
console.log(`  🔎 홈 「SNS 요리」 상자 = ${있나}개`)
if (있나) {
  await 상자.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)
  await 찍기('1-홈-SNS요리상자', { clip: await 상자.first().boundingBox() })
  await 찍기('2-홈-전체')
} else {
  console.log('  ⛔ 상자를 못 찾았다 — 화면 전체만 찍는다')
  await 찍기('2-홈-전체')
}

// ② 레시피 탭 — SNS 칩
await page.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true })
await page.waitForTimeout(1500)
const 칩 = page.locator('button.pill', { hasText: 'SNS' })
console.log(`  🔎 SNS 칩 = ${await 칩.count()}개 · 글자 = ${await 칩.count() ? JSON.stringify((await 칩.first().innerText()).trim()) : '—'}`)
await 찍기('3-레시피탭-SNS칩')

// ③ 칩을 눌러 거른 목록
if (await 칩.count()) {
  await 칩.first().click({ force: true })
  await page.waitForTimeout(900)
  await 찍기('4-SNS칩-누른뒤')
}

// ④ 상세 — 인스타 편(광어깻잎무침)의 「원본 링크」
const 광어 = page.locator('.name', { hasText: '광어깻잎무침' })
if (await 광어.count()) {
  await 광어.first().click({ force: true })
  await page.waitForTimeout(1400)
  const 링크 = page.locator('a[target="_blank"]').filter({ hasText: '애둘핑' })
  console.log(`  🔎 상세 「원본 링크」(애둘핑) = ${await 링크.count()}개`)
  if (await 링크.count()) { await 링크.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(600) }
  await 찍기('5-상세-인스타-원본링크')
} else {
  console.log('  ⛔ 광어깻잎무침 카드를 못 찾았다')
}

// ⑤ 상세 — 유튜브 편(꽈리고추)에 «재생 창이 없고» 원본 링크만 있나
//   ⛔⛔ [창업자 확정 2026-09-03 · ⓐ] 앱 «안»에서 재생하지 않는다(III.E.4.j). 여기서 눈으로 확인한다.
await page.goBack().catch(() => {})
await page.waitForTimeout(900)
const 꽈리 = page.locator('.name', { hasText: '꽈리고추' })
if (await 꽈리.count()) {
  await 꽈리.first().click({ force: true })
  await page.waitForTimeout(1400)
  // ⭐ 재는 것 둘 = ⑴앱 «안»에서 안 트나(iframe 0) ⑵미리보기 그림은 «보이나»(i.ytimg.com)
  const 플레이어 = await page.locator('iframe').count()
  const 미리보기 = await page.locator('img[src*="i.ytimg.com"]').count()
  console.log(`  🔎 유튜브 편 — 재생창(iframe) ${플레이어}개 ${플레이어 === 0 ? '✅' : '⛔'} · 미리보기 그림 ${미리보기}개 ${미리보기 > 0 ? '✅' : '⛔'}`)
  const 링크 = page.locator('img[src*="i.ytimg.com"]')
  if (await 링크.count()) { await 링크.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(900) }
  await 찍기('6-상세-유튜브-재생창없음')
} else {
  console.log('  ⛔ 꽈리고추 카드를 못 찾았다')
}

await b.close(); srv.close()
console.log('\n✅ 다 찍었다 →', OUT)
