// 🔬 v10.33 실물 전수 테스트 (창업자 *"앱에제대로 반영되었는지 전수테스트하고(실물확인필수)"*)
//
// ⛔ 숫자만 재고 「됐다」 하지 않는다 — 2026-08-11 에 시안 3장이 전부 온보딩 화면이었는데
//    숫자는 전부 초록불이었다(규칙 21). 그래서 **화면을 찍고 내가 열어본다.**
//
// ⭐ 시계를 속여서 «미래 주»까지 지금 확인한다 — 8/17·9/28 이 와야 뜨는 이름표를 오늘 본다.
//    (2026-08-10 `_shot-공개검수-0901` 에서 쓴 방법 그대로. 새로 발명하지 않는다)
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { SEED_COACH_SEEN } from '../src/coach.js'

const BASE = 'http://127.0.0.1:4181'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const srv = spawn('npx', ['vite', 'preview', '--port', '4181', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
await 잠깐(2800)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const 결과 = []
const 오류 = []

// ⛔⛔ 캡처 전 «반드시» 끄는 것 둘 — 안 끄면 온보딩·코치가 화면을 덮는다
async function 새판(날짜) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  if (날짜) {
    // 🕰 Date 를 바꿔치기해 «그날»로 만든다. `from` 판정이 그날을 보므로 미래 주가 그대로 열린다.
    await ctx.addInitScript(`(() => {
      const T = new Date('${날짜}T09:00:00+09:00').getTime()
      const R = Date
      // eslint-disable-next-line no-global-assign
      Date = class extends R { constructor(...a) { super(...(a.length ? a : [T])) } static now() { return T } }
      Date.parse = R.parse; Date.UTC = R.UTC
    })()`)
  }
  const p = await ctx.newPage()
  p.on('pageerror', (e) => 오류.push(`${날짜 || '오늘'}: ${e}`))
  return { ctx, p }
}

// 🛡 「진짜 홈이 맨 위인가」를 재서 못 박는다 — 가려진 화면을 찍는 사고를 두 번 냈다
async function 덮개확인(p, 이름) {
  const 덮 = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    return el ? (el.closest('[class*="onboard"],[class*="sheet"],[class*="overlay"],[class*="coach"]')?.className || '') : 'none'
  })
  if (덮) 오류.push(`${이름}: ⛔ 화면을 덮은 것 → ${덮}`)
}

// ── ① 홈 이름표 — 오늘 / 8-17 / 9-28 ──
for (const [이름, 날짜, 기대] of [
  ['오늘', null, '이번 주 제철'],
  ['8월17일', '2026-08-17', '이번 주 특별한 한끼'],
  ['9월28일', '2026-09-28', '이번 주 특별한 한끼'],
]) {
  const { ctx, p } = await 새판(날짜)
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await 잠깐(700)
  await 덮개확인(p, 이름)
  const kick = await p.locator('.weekly-kicker').allInnerTexts()
  const 제목 = await p.locator('.weekly-box h3, .weekly-box .weekly-title').allInnerTexts().catch(() => [])
  const 맞나 = kick.includes(기대)
  결과.push({ 칸: `홈 이름표 ${이름}`, 값: kick.join(' / ') + (제목.length ? ` — ${제목.join(' / ')}` : ''), 판정: 맞나 })
  const box = p.locator('.week-pair').first()
  if (await box.count()) { await box.scrollIntoViewIfNeeded(); await 잠깐(300); await box.screenshot({ path: `${OUT}/전수-홈-${이름}.png` }) }
  await ctx.close()
}

// ── ② 새 레시피를 만들어 «제목만 치고» 어떤 그림이 붙나 — 앱이 진짜 쓰는 길이다 ──
{
  const { ctx, p } = await 새판(null)
  // 🍳 36편 중 이번에 그림이 «바뀌어야 하는» 편 ＋ 안 바뀌어야 하는 편을 섞어 넣는다
  const 시드 = [
    ['오징어 새우전', 'fe_163'], ['브로콜리 구이', 'fe_162'], ['가지덮밥', 'fe_182'],
    ['마늘쫑장아찌', 'fe_193'], ['굴 매생이 떡국', 'fe_183'], ['매콤 콩나물덮밥', 'fe_189'],
    ['황태장아찌', 'fe_95'], ['간장 제육볶음', 'fh_k13'], ['계란장', 'fe_195'], ['충무김밥', 'fe_202'],
  ]
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await p.evaluate((목록) => {
    const KEY = 'hankki:v1'
    const s = JSON.parse(localStorage.getItem(KEY) || '{}')
    // ⛔ `savedAt` 을 작게 주면 «1970년»이 되어 「최근 저장」 맨 뒤로 밀린다 —
    //    2026-08-11 에 9000 을 줬다가 카드를 못 찾아 「안 붙었다」로 잘못 볼 뻔했다(규칙 18).
    const 지금 = Date.now()
    // ⛔⛔ 재료·순서가 «비면» 「미정리」로 잡혀 레시피 탭에서 통째로 빠진다(v8.80 에 그렇게 만들었다).
    //    2026-08-11 에 빈 배열로 시드했다가 레시피 탭 0개를 보고 「안 붙었다」로 볼 뻔했다(규칙 18).
    // ⛔⛔⛔ 시드가 앱 규칙을 지켜야 «화면에 뜬다». 오늘 셋을 연달아 밟았다(전부 규칙 18 — 앱이 아니라 내 시드가 틀렸다):
    //    ⑴ `savedAt` 이 작으면 1970년이 되어 「최근 저장」 맨 뒤로 밀린다
    //    ⑵ 홈 「최근 저장」은 **4칸뿐** — 전부 보려면 「레시피」 탭으로 간다
    //    ⑶ ⭐`status: 'sorted'` 가 없으면 **레시피 탭이 통째로 거른다**
    //       (`MyRecipesScreen`: `recipes.filter((r) => r.status === 'sorted')`)
    s.recipes = [...목록.map(([t], i) => ({
      id: 'zz-' + i, title: t, status: 'sorted', category: '한식',
      ingredients: ['재료 한 줄'], steps: ['순서 한 줄'], savedAt: 지금 + 1000 - i,
    })), ...(s.recipes || [])]
    localStorage.setItem(KEY, JSON.stringify(s))
  }, 시드)
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await 잠깐(900)
  await 덮개확인(p, '아이콘')

  // ⛔⛔ 홈 「최근 저장」은 **최신 4개만** 보여준다(v8.54 2×2 그리드).
  //    2026-08-11 에 여기서 재다가 여섯 편을 「카드를 못 찾음」으로 잡을 뻔했다 —
  //    없는 게 아니라 **화면이 4칸**이었다(규칙 18). → 「레시피」 탭(전체 목록)으로 옮겨서 잰다.
  await p.getByRole('button', { name: '레시피', exact: true }).click()
  await 잠깐(800)
  await 덮개확인(p, '레시피탭')

  // 🖼 카드에 실제로 그려진 <img> 를 본다 — 깨졌으면 naturalWidth 가 0 이다
  const 잰것 = await p.evaluate(() => {
    const 칸 = [...document.querySelectorAll('.grid-card')]
    return 칸.map((el) => {
      const im = el.querySelector('img')
      return {
        제목: (el.innerText || '').split('\n')[0].trim(),
        src: im ? im.currentSrc.split('/').pop() : '(그림 없음)',
        뜸: im ? im.naturalWidth > 0 : false,
      }
    })
  })
  for (const [제목, 기대] of 시드) {
    const 찾 = 잰것.find((x) => x.제목 === 제목)
    // 번들은 `fe_163-<해시>.png` 처럼 이름을 바꾼다 → 앞부분만 맞춰 본다
    const 맞나 = !!찾 && 찾.뜸 && 찾.src.startsWith(기대 + '-')
    결과.push({ 칸: `그림 「${제목}」`, 값: 찾 ? `${찾.src} ${찾.뜸 ? '' : '⛔안 뜸'}` : '⛔카드를 못 찾음', 판정: 맞나 })
  }
  const 깨짐 = 잰것.filter((x) => !x.뜸).length
  결과.push({ 칸: '깨진 그림', 값: `${깨짐}장`, 판정: 깨짐 === 0 })
  await p.screenshot({ path: `${OUT}/전수-아이콘.png`, fullPage: false })
  await ctx.close()
}

console.log('')
for (const r of 결과) console.log(`  ${r.판정 ? '✅' : '⛔'} ${r.칸.padEnd(18)} ${r.값}`)
console.log(`\n  ${오류.length ? '⛔' : '✅'} pageerror·덮개 ${오류.length}`)
오류.forEach((e) => console.log('     ' + e))
await b.close()
srv.kill()
process.exit(0) // ⛔ spawn 한 서버가 이벤트 루프를 붙잡는다
