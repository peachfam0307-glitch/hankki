// 🛒📅 **「그날 저절로 열리는 주부의 장바구니」 전날 검수판** — 날짜만 주면 매주 돈다.
//
// ⛔⛔ **자동 공개 전날 검수 = 절대원칙 28** (창업자 2026-08-01
//    *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. **이건 절대원칙.**"*)
//    ⭐ 배포 통로가 둘인데 이쪽은 **내가 아무것도 안 해도 열린다** — 잊으면 그대로 나간다.
//
// ⭐⭐ **왜 새로 만들었나 — 「서랍」 판으로는 이걸 못 본다.**
//    `_shot-공개검수-0901.mjs` 는 `where.includes('서랍')` 로 걸러서 **꾸미기 컷만** 본다.
//    장바구니 제품은 «장보기 탭»에 뜨므로 그 판이 한 개도 안 잡는다.
//    🔢 남은 분량 = 창업자 확정 「1주에 3개씩」 × 29주 → **매주 금요일마다 이 검수가 돌아온다.**
//       ⭐ 그래서 «그날치»를 손으로 적지 않고 **달력이 말하게** 한다(규칙 8 · 손 목록은 반드시 낡는다).
//
// ⭐ 값은 `release-calendar.mjs` 의 `gates()` 에서 «읽어» 온다 — 앱과 같은 파싱 한 곳(절대원칙 30).
//    ⛔ `curation.js` 를 여기서 «또» 글자로 뜯지 말 것.
//
// ⭐⭐ **심장은 ②③ 한 쌍이다** — 「그날 뜬다」만 재면 반쪽이다.
//    ③ **하루 «전»엔 안 뜬다**까지 봐야 «날짜 문이 진짜 도는지»가 증명된다.
//    (게이트가 늘 초록불인데 아무것도 안 재던 사고를 여러 번 겪었다 — 규칙 18 ⓘ)
//
// 쓰는 법:
//    node scripts/_shot-장바구니열림-0902.mjs            ← 내일(KST)
//    ON=2026-09-05 node scripts/_shot-장바구니열림-0902.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { gates, cartItems } from './release-calendar.mjs'
import { todayKST } from '../src/today.js'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 내일 = () => {
  const d = new Date(todayKST() + 'T00:00:00+09:00')
  d.setDate(d.getDate() + 1)
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}
const 그날 = process.env.ON || 내일()
const 전날 = (() => {
  const d = new Date(그날 + 'T00:00:00+09:00')
  d.setDate(d.getDate() - 1)
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
})()
const 방 = OUT + '/장바구니열림-' + 그날
mkdirSync(방, { recursive: true })

// 📅 그날 열리기로 «약속»된 것 — 달력이 말한다
const 약속 = gates().filter((g) => g.kind === 'cart' && g.date === 그날)
// 제품 원본(mall·benefit)이 필요해 이름으로 맞춰 둔다
const 전부 = cartItems()
const 원본 = (이름) => 전부.find((it) => (it.brand ? it.brand + ' ' + it.name : it.name) === 이름) || {}

console.log('\n🛒 ' + 그날 + ' 에 저절로 열리는 「주부의 장바구니」 = ' + 약속.length + '개')
for (const g of 약속) {
  const it = 원본(g.what)
  console.log('   · ' + g.where + ' — ' + g.what + (it.mall ? '  [' + it.mall + ']' : ''))
}
if (!약속.length) {
  console.log('\n✅ 그날 열리는 장바구니 제품이 없다 — 볼 것이 없다.')
  process.exit(0)
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')

const PORT = Number(process.env.PORT || 4488)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log((ok ? '✅' : '⛔') + ' ' + 이름 + (값 ? ' — ' + 값 : '')); if (!ok) fail++ }

/** 그 날짜로 시계를 돌려 「주부의 장바구니」 찾기 칸까지 간다 */
async function 열기 (날짜) {
  const ctx = await browser.newContext({
    viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR',
  })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  // ⏰ 시계를 그날로 — `from` 판정이 「오늘」을 보므로 이것 하나로 미래가 열린다.
  await ctx.addInitScript('{\n'
    + "  const 그날 = new Date('" + 날짜 + "T09:00:00+09:00').getTime()\n"
    + '  const OrigDate = Date\n'
    + '  class FakeDate extends OrigDate {\n'
    + '    constructor(...a) { return a.length ? new OrigDate(...a) : new OrigDate(그날) }\n'
    + '    static now() { return 그날 }\n'
    + '  }\n'
    + '  Date = FakeDate\n'
    + '}')
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  const url = 'http://127.0.0.1:' + PORT + '/'
  await page.goto(url)
  // ⛔ 소식 팝업이 뜨면 탭 클릭을 가로챈다 — 여기선 팝업이 검수 대상이 아니라 끈다.
  await page.evaluate(() => {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
  })
  await page.goto(url)
  await page.waitForTimeout(1500)
  // 앞을 막는 시트가 있으면 치운다(그날은 새로 열린 게 많아 시트가 뜬다)
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.sheet-mask').count())) break
    const 닫기 = page.getByRole('button', { name: /^(닫기|확인|나중에|취소|건너뛰기|그냥 시작하기|나중에 하기)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await page.locator('.sheet-mask').first().click({ position: { x: 8, y: 8 }, timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: /장보기/ }).first().click().catch(() => {})
  await page.waitForTimeout(900)
  return { ctx, page, errs, url }
}

/** 찾기 칸에 이름을 넣고 「‘…’ — N개」 를 읽는다 */
async function 몇개 (page, 이름) {
  const 칸입력 = page.getByPlaceholder('찾기 · 이름이나 초성(ㄱㅈ)')
  await 칸입력.fill('')
  await page.waitForTimeout(200)
  await 칸입력.fill(이름)
  await page.waitForTimeout(700)
  const 글 = await page.locator('.t-sub').filter({ hasText: /개$/ }).first().innerText().catch(() => '')
  const m = 글.match(/—\s*(\d+)개/)
  return m ? Number(m[1]) : 0
}

// ── ① 시계가 진짜 그날인가 ───────────────────────────────────────────
const A = await 열기(그날)
const 오늘 = await A.page.evaluate(() => new Date().toISOString().slice(0, 10))
칸(오늘 === 그날, '시계를 ' + 그날 + ' 로 돌렸다', '앱이 보는 오늘 = ' + 오늘)

// ── ② 열리기로 한 것이 «전부» 화면에 떴나 ────────────────────────────
const 뜬것 = []
for (const g of 약속) {
  const it = 원본(g.what)
  const n = await 몇개(A.page, it.name || g.what)
  const 떴나 = n > 0
  칸(떴나, '「' + g.what + '」 가 화면에 뜬다', '찾기 결과 ' + n + '개')
  if (떴나) {
    뜬것.push(g.what)
    // ④ 사러가기 모양 — 🌱한살림은 «사러가기를 아예 안 단다»(창업자 2026-08-17 "링크안달면되고")
    const 사러 = await A.page.getByRole('button', { name: '사러가기' }).count()
    const 한살림 = (it.mall || '') === 'hansalim'
    칸(한살림 ? 사러 === 0 : 사러 > 0,
      '  ↳ 사러가기 ' + (한살림 ? '«없어야» 한다(한살림 조합원 전용)' : '가 붙는다'),
      '단추 ' + 사러 + '개' + (it.mall ? ' · ' + it.mall : ''))
    await A.page.screenshot({ path: 방 + '/' + (it.name || g.what).replace(/[/ ]/g, '_') + '.png' })
  }
}
칸(뜬것.length === 약속.length, '약속 ↔ 실물 대조', 약속.length + '개 중 ' + 뜬것.length + '개가 떴다')

// ── ⑥ 그날 장보기 화면 통째로 (창업자가 눈으로 볼 것) ────────────────
await A.page.getByPlaceholder('찾기 · 이름이나 초성(ㄱㅈ)').fill('').catch(() => {})
await A.page.waitForTimeout(600)
await A.page.screenshot({ path: 방 + '/0-장보기-' + 그날 + '.png', fullPage: true })
칸(A.errs.length === 0, '앱이 죽지 않았다', A.errs.length ? A.errs[0].slice(0, 90) : '오류 0')
await A.ctx.close()

// ── ③ ⭐ 하루 «전»엔 «안» 떠야 한다 — 날짜 문이 진짜 도는지 ──────────
const B = await 열기(전날)
const 새는것 = []
for (const g of 약속) {
  const it = 원본(g.what)
  const n = await 몇개(B.page, it.name || g.what)
  if (n > 0) 새는것.push(g.what + '(' + n + ')')
}
칸(새는것.length === 0, '전날(' + 전날 + ')엔 «아직» 안 뜬다',
  새는것.length ? '⛔ 미리 새는 것 = ' + 새는것.join(' · ') : '0개 — 날짜 문이 제대로 닫혀 있다')
await B.page.screenshot({ path: 방 + '/0-장보기-' + 전날 + '.png', fullPage: true })
await B.ctx.close()

await browser.close()
stop()

console.log('\n📁 ' + 방)
console.log(fail ? '\n⛔ ' + fail + '칸 실패' : '\n✅ 전부 통과 — ' + 그날 + ' 에 열려도 된다')
process.exit(fail ? 1 : 0)
