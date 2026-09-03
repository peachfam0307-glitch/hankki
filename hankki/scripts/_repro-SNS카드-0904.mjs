// 📷📺 «상세에 «나가는 문» 카드가 SNS 편 «전부»에 있나» — 2026-09-04 (smoke)
//
// 📮 창업자 = *"꽈리는 뜨고 광어는 안떠"* (배포 v12.37 을 폰에서 보고)
//    ⛔ 유튜브 편엔 큰 카드가 뜨고 **인스타 편엔 아무것도 없었다.**
//    🔢 뿌리 = `embed.js` 의 `thumb`(그림 주소)가 «유튜브에만» 있어서
//       조건이 `영상.thumb && !썸네일깨짐` 이었다 → 인스타는 통째로 안 그려졌다.
//
// ⭐⭐ 이 판의 심장 = **「그림이 있나」가 아니라 «문이 있나»**.
//    ⛔ 그림으로 재면 이 환경에선 유튜브도 실패한다 —
//       🔢 실측 `curl i.ytimg.com` = **000**(프록시가 CONNECT 거부). CI 도 막힐 수 있다.
//    ✅ 그래서 «그림»이 아니라 **「눌러서 나가는 카드가 있나」**를 잰다. 그게 유저가 잃는 것이다.
//
// 🔢 재는 것
//    ① 유튜브 편(sourceUrl 이 youtube) 상세에 카드가 있나
//    ② ⭐인스타 편 상세에도 카드가 있나  ← 오늘 잡은 버그. 여기가 죽으면 되돌아온 것이다
//    ③ 둘 다 «앱 안에서 안 튼다» — iframe 0개 (III.E.4.j · 창업자 확정 2026-09-03)
//    ④ ▶ 는 «그림이 실제로 뜬 유튜브 카드»에만 — 인스타 카드엔 없다(목록 표와 같은 잣대)
//    ⑤ 카드 아래 줄에 원작자 이름 ＋ 「…에서 보기」 가 있나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const BASE = `http://127.0.0.1:${srv.address().port}/`

let 나쁨 = 0
const 칸 = (좋나, 이름, 덧 = '') => {
  if (!좋나) 나쁨++
  console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ` — ${덧}` : ''}`)
}

// ⭐ 기대치를 «앱의 실제 값»에서 뽑는다 — 손으로 제목을 적으면 창업자가 편을 바꿀 때 낡는다(절대원칙 30)
const { 레시피들 } = await import('./recipe.mjs')
const 오늘열린SNS = 레시피들().filter((r) => r && r.source === 'hankki' && (r.sourceUrl || '').trim())
const 유튜브편 = 오늘열린SNS.filter((r) => /youtube\.com|youtu\.be/.test(r.sourceUrl))
const 인스타편 = 오늘열린SNS.filter((r) => /instagram\.com/.test(r.sourceUrl))
console.log(`\n📷 SNS 편 실측 — 유튜브 ${유튜브편.length} · 인스타 ${인스타편.length}\n`)
칸(유튜브편.length > 0, '유튜브 편이 하나라도 있다 (＝이 판의 전제)', `${유튜브편.length}편`)
칸(인스타편.length > 0, '인스타 편이 하나라도 있다 (＝이 판의 전제)', `${인스타편.length}편`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 412, height: 915 } })
await ctx.addInitScript(SEED_COACH_SEEN)
// ⛔ 문이 넷이다 — 로그인·확인시트·온보딩·소식 팝업 (2026-09-03 에 스샷 네 판을 헛으로 냈다)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
let page = await ctx.newPage()
page.setDefaultTimeout(20000)
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2200)
// ⛔ 첫 방문에만 로그인 화면이 뜬다 → 새 탭으로 다시 연다(⛔`reload()` 금지 · 옛 함정 사전)
if (await page.getByText('Google 계정으로 시작하기').count()) {
  const p2 = await ctx.newPage(); p2.setDefaultTimeout(20000)
  await p2.goto(BASE, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(2200)
  await page.close(); page = p2
}

const 상세열기 = async (제목) => {
  // ⛔ 상세 화면엔 «하단바가 없다» — 첫 판이 여기서 20초 타임아웃으로 죽었다.
  //    그래서 탭을 누르기 «전»에 먼저 나와야 한다(뒤로 단추 → 그래도 없으면 새 탭).
  if (!(await page.getByRole('button', { name: '레시피', exact: true }).count())) {
    const 뒤로 = page.locator('button[aria-label="뒤로"]')
    if (await 뒤로.count()) { await 뒤로.first().click({ force: true }); await page.waitForTimeout(900) }
  }
  if (!(await page.getByRole('button', { name: '레시피', exact: true }).count())) {
    const p2 = await ctx.newPage(); p2.setDefaultTimeout(20000)
    await p2.goto(BASE, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(2200)
    await page.close(); page = p2
  }
  await page.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true })
  await page.waitForTimeout(1300)
  const 카드 = page.locator('.name', { hasText: 제목 })
  if (!(await 카드.count())) return false
  await 카드.first().click({ force: true })
  await page.waitForTimeout(1400)
  // ⭐ «도착했나»를 먼저 잰다 — 안 간 화면엔 당연히 아무것도 없고 그게 초록불로 새면 안 된다(규칙 18 ⓘ)
  return page.evaluate((t) => (document.body.innerText || '').includes(t) && /재료|만드는 법/.test(document.body.innerText || ''), 제목)
}

const 카드재기 = () => page.evaluate(() => {
  // 「나가는 문」 카드 = 절 제목(영상으로 보기 · 원본 보기) 바로 뒤의 button.card
  const 절 = [...document.querySelectorAll('.sec-head')]
    .find((x) => /영상으로 보기|원본 보기/.test(x.innerText || ''))
  const 문 = 절?.nextElementSibling
  const 문맞나 = !!문 && 문.tagName === 'BUTTON' && 문.className.includes('card')
  return {
    절글: (절?.innerText || '').trim(),
    카드있나: 문맞나,
    아래줄: 문맞나 ? (문.querySelector('.opt-row')?.innerText || '').replace(/\s+/g, ' ').trim() : '',
    재생창: document.querySelectorAll('iframe').length,
    그림: 문맞나 ? 문.querySelectorAll('img[src*="i.ytimg.com"]').length : 0,
    // ▶ = 그림 위에 얹는 표. 그림이 없으면 있어서는 안 된다.
    삼각: 문맞나 ? [...문.querySelectorAll('svg,span')].filter((e) => (e.getAttribute?.('aria-hidden') === 'true')).length : 0,
  }
})

// ── ① 유튜브 편 ──────────────────────────────────────────────
console.log('① 유튜브 편 — 나가는 문 카드가 있나')
{
  const r = 유튜브편[0]
  const 열림 = await 상세열기(r.title)
  칸(열림, `상세가 열렸다 (${r.title})`)
  if (!열림) { 나쁨 += 3; console.log('  ⛔⛔ 못 열었다 — 판정하지 않는다') } else {
    const v = await 카드재기()
    칸(v.카드있나, '⭐ 「나가는 문」 카드가 있다', v.절글)
    칸(v.재생창 === 0, '⛔ 앱 안에서 «안» 튼다 (iframe 0)', `${v.재생창}개`)
    // 🔤 [2026-09-04] 잣대를 «글자»에서 «뜻»으로 바꿨다 — 창업자가 *"링크만 떡 있으면 안눌러볼거야"* 라 해서
    //    말을 「YouTube에서 보기」 → 「영상으로 보기 ＋ 이유 한 줄」로 고쳤더니 이 칸이 죽었다.
    //    ⛔ 그때 «앱은 더 좋아졌는데 판이 빨간불»이었다 — 낡은 건 판이다(2026-08-31 클라우드 스위치와 같은 일).
    //    ✅ 그래서 문구를 통째로 박지 않고 «어디로 가는지 말하나»만 잰다. 말투는 앞으로도 바뀐다.
    칸(/보기/.test(v.아래줄), '아래 줄이 「어디로 가는지」 말한다', v.아래줄)
    // ⭐ 눌러야 할 «이유»가 적혀 있나 — 이게 없으면 링크만 떡 있는 그 화면으로 되돌아간 것이다.
    칸(v.아래줄.replace(/\s+/g, ' ').length > 20, '  아래 줄에 «이유»까지 있다', v.아래줄)
    if (r.sourceName) 칸(v.아래줄.includes(r.sourceName), '원작자 이름이 그 줄에 있다', r.sourceName)
    // ⚠️ 그림은 이 환경에서 «못 받는다»(i.ytimg.com = 000) → 그림 유무로 판정하지 않는다
    console.log(`     🔢 영상 그림 = ${v.그림}개 ${v.그림 ? '(받아졌다)' : '(이 환경/CI 는 못 받는다 — 판정 안 함)'}`)
  }
}

// ── ② ⭐인스타 편 — 오늘 잡은 버그 자리 ────────────────────────
console.log('\n② ⭐ 인스타 편 — «여기가 죽으면 2026-09-04 버그가 되돌아온 것이다»')
{
  const r = 인스타편[0]
  const 열림 = await 상세열기(r.title)
  칸(열림, `상세가 열렸다 (${r.title})`)
  if (!열림) { 나쁨 += 4; console.log('  ⛔⛔ 못 열었다 — 판정하지 않는다') } else {
    const v = await 카드재기()
    칸(v.카드있나, '⭐⭐ 인스타 편에도 「나가는 문」 카드가 있다', v.절글)
    칸(v.재생창 === 0, '⛔ 앱 안에서 «안» 튼다 (iframe 0)', `${v.재생창}개`)
    칸(v.그림 === 0, '⛔ 없는 영상 그림을 지어내지 않는다', `${v.그림}개`)
    // ⛔ 인스타 편이 「영상/YouTube」 라고 말하면 «거짓말»이다 — 그것만 못 박는다(말투는 안 박는다).
    칸(!/YouTube|유튜브/.test(v.아래줄), '아래 줄이 유튜브라고 «말하지 않는다»', v.아래줄)
    칸(/릴스|원본 글|인스타/.test(v.아래줄), '  인스타에서 온 것이라고 말한다', v.아래줄)
    if (r.sourceName) 칸(v.아래줄.includes(r.sourceName), '원작자 이름이 그 줄에 있다', r.sourceName)
  }
}

await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ SNS 편 «전부»에 나가는 문이 있다 · 앱 안에서 안 튼다\n')
process.exit(나쁨 ? 1 : 0)
