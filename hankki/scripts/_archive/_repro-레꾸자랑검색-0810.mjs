// 🔍 재현 — 「레꾸자랑에 검색 넣기」 (창업자 2026-08-10 *"레꾸자라에 검색도 넣고."*)
//
// ⭐ 재는 것 = **①돋보기가 있나 ②쳐서 걸러지나 ③재료로도 걸리나 ④초성으로 걸리나
//    ⑤못 찾으면 뭐라고 하나 ⑥닫으면 되돌아오나 ⑦레시피 탭도 초성이 되나**.
//
// ⚠️ 검색어를 «글자로 박지 않는다» — 시드 레시피 제목이 바뀌면 검사가 조용히 거짓 통과한다.
//    실제 목록에서 제목을 하나 집어 그 초성을 «계산해서» 친다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { chosungOf } = await import('../src/utils.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

// 검사에 쓸 표본을 «데이터에서» 고른다
const sample = basicRecipes.find((r) => (r.ingredients || []).length && /^[가-힣]{2,}$/.test(r.title))
if (!sample) { console.log('⛔ 표본 레시피를 못 골랐다'); process.exit(1) }
const TITLE = sample.title
const CHO = chosungOf(TITLE)                       // 「김밥」 → 「ㄱㅂ」
// 재료 줄에서 «제목엔 없는» 낱말 하나 (재료로도 걸리는지 보려고)
const ING = (sample.ingredients || [])
  .map((s) => String(s).replace(/[[\]]/g, '').trim().split(/\s+/)[0])
  .find((w) => /^[가-힣]{2,}$/.test(w) && !TITLE.includes(w) && !w.includes(TITLE))
const 제목걸릴수 = basicRecipes.filter((r) => (r.title || '').includes(TITLE)).length

const PORT = Number(process.env.PORT || 4327)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
// ⛔ 코치마크가 뜨면 화면을 통째로 덮어 아무것도 못 누른다.
//   `evaluate` 로 넣으면 다음 `goto` 에 날아간다 — 반드시 `addInitScript`(매 문서마다 다시 심긴다).
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
}, state)
await page.goto(url)
await page.waitForTimeout(1500)

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }
const 카드수 = () => page.locator('.grid-card').count()

console.log(`\n🔍 표본 = 「${TITLE}」 · 초성 「${CHO}」 · 재료 낱말 「${ING || '(없음)'}」\n`)

// ── 레꾸자랑 탭 ──
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(900)
const 전부 = await 카드수()
칸(전부 > 1, '레꾸자랑 목록이 떴다', `카드 ${전부}개`)

// ① 돋보기
const 돋보기 = page.getByLabel('자랑할 레시피 찾기')
const 돋보기있음 = await 돋보기.count() === 1
칸(돋보기있음, '① 우상단에 돋보기가 있다')

// ⚠️ 돋보기가 없어도 «여기서 죽지 않는다» — ⑦(레시피 탭)은 이 화면과 상관이 없다.
//    죽으면 「⑦이 되는지」를 영영 못 재고, 그게 규칙 12(옛 코드로 걸리나) 확인을 반쪽으로 만든다.
if (!돋보기있음) console.log('   ➖ ②~⑥ 은 돋보기가 없어 건너뜀')
else {
// ② 눌러서 열기 → 제목으로 걸러지나
await 돋보기.click()
await page.waitForTimeout(350)
const 입력 = page.locator('.searchbar input')
칸(await 입력.count() === 1, '② 검색창이 그 자리에서 열렸다')
await 입력.fill(TITLE)
await page.waitForTimeout(400)
const 제목결과 = await 카드수()
칸(제목결과 === 제목걸릴수 && 제목결과 < 전부, '② 제목으로 걸러진다', `${전부} → ${제목결과}개 (기대 ${제목걸릴수})`)
칸((await page.getByText(`‘${TITLE}’ — 내 레시피`).count()) > 0, '② 「몇 개 찾았나」가 뜬다')
await page.screenshot({ path: `${OUT}/레꾸자랑검색-제목.png` })

// ③ 재료로도
if (ING) {
  await 입력.fill(ING)
  await page.waitForTimeout(400)
  const 재료결과 = await 카드수()
  const 재료로들어감 = await page.evaluate(() => [...document.querySelectorAll('.grid-card .name')].map((e) => e.textContent))
  칸(재료결과 > 0 && 재료로들어감.some((t) => !t.includes(ING)), '③ 재료로도 찾는다', `「${ING}」 → ${재료결과}개 · 예: ${재료로들어감[0]}`)
} else console.log('➖ ③ 재료 낱말을 못 골라 건너뜀')

// ④ 초성
await 입력.fill(CHO)
await page.waitForTimeout(400)
const 초성결과 = await 카드수()
const 초성목록 = await page.evaluate(() => [...document.querySelectorAll('.grid-card .name')].map((e) => e.textContent))
칸(초성목록.includes(TITLE), `④ 초성 「${CHO}」 으로 「${TITLE}」 이 걸린다`, `${초성결과}개`)
await page.screenshot({ path: `${OUT}/레꾸자랑검색-초성.png` })

// ⑤ 못 찾을 때
await 입력.fill('ㅋㅋㅋ없는것ㅋㅋㅋ')
await page.waitForTimeout(400)
칸(await 카드수() === 0 && (await page.getByText('로 찾은 레시피가 없어요').count()) > 0, '⑤ 못 찾으면 안내가 뜬다(빈 화면 아님)')

// ⑥ 닫으면 되돌아오나 — 검색어도 같이 비워져야 한다
await page.getByLabel('찾기 닫기').click()
await page.waitForTimeout(400)
const 닫은뒤 = await 카드수()
칸(닫은뒤 === 전부 && (await page.locator('.searchbar input').count()) === 0, '⑥ 닫으면 목록이 되돌아온다', `${닫은뒤}개`)
칸((await page.getByText('자랑할 레시피를 눌러주세요').count()) > 0, '⑥ 안내문도 돌아온다')
}

// ⑦ 레시피 탭도 초성이 되나 (같은 기능은 탭이 달라도 같게)
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(900)
await page.getByLabel('내 레시피에서 찾기').click()
await page.waitForTimeout(350)
await page.locator('.searchbar input').fill(CHO)
await page.waitForTimeout(400)
const 탭초성 = await page.evaluate(() => [...document.querySelectorAll('.grid-card .name')].map((e) => e.textContent))
칸(탭초성.includes(TITLE), `⑦ 레시피 탭도 초성 「${CHO}」 으로 걸린다`, `${탭초성.length}개`)

칸(errs.length === 0, 'pageerror 0', errs.length ? errs[0] : '')

await browser.close(); stop()
console.log(fail ? `\n⛔ ${fail}칸 실패\n` : `\n✅ 전부 통과\n`)
process.exit(fail ? 1 : 0)
