// 📜 재현 — 「모아보기 막대가 다른 화면까지 따라온다」 (창업자 폰 제보 2026-08-10
//    *"모아보기 바가 다른데도 침범중야"* · 캡처 = 「한끼 일기」 달력 위를 가로지르는 막대)
//
// ⭐ 재는 것 = ①모아보기엔 가로 막대가 있다 ②「한끼 일기」로 옮기면 «사라진다»
//    ③달력 위에 막대가 없다 ④다시 모아보기로 오면 돌아온다 ⑤장보기 탭도 같다 ⑥pageerror 0
//
// ⛔⛔ 왜 생겼나 = `ScrollHint` 가 다시 재는 신호가 **셋뿐**이었다 —
//    ⒜`dep`(탭·스택) ⒝스크롤·리사이즈 ⒞`document.body` **직계** 자식이 바뀔 때.
//    「모아보기 ↔ 한끼 일기」는 **한 화면 «안»에서 갈리는 것**이라 셋 중 어디에도 안 걸린다.
//    → 마지막에 잰 값(모아보기 칩 줄)이 **fixed 로 그대로 남아** 달력을 가로질렀다.
//    📌 규칙 18 그대로 — 「막대가 틀린 자리에 있다」가 아니라 **「다시 잰 적이 없다」**였다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  // ⛔ 일기가 «하나도 없으면 달력이 아예 안 그려진다**(`entries.length > 0 || diaryDays.size > 0`).
  //    그러면 ③ 이 늘 「달력 못 찾음」으로 통과해 **실패할 줄 모르는 칸**이 된다.
  //    창업자 캡처엔 달력이 있었으니 «그 상태»로 재야 한다.
  diary: [{ id: 'd1', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }],
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4337)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
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
// 가로 막대들의 자리 — [왼쪽 x, 폭, 위 y]
const 막대 = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-hhint]')].map((d) => {
    const r = d.getBoundingClientRect()
    return [Math.round(r.left), Math.round(r.width), Math.round(r.top)]
  }))
const 탭가기 = async (이름) => { await page.getByRole('button', { name: 이름, exact: true }).first().click(); await page.waitForTimeout(700) }

console.log('\n── ① 모아보기 ─────────────────────────────')
await 탭가기('레시피')
await page.waitForTimeout(600)
const a = await 막대()
칸(a.length > 0, '모아보기엔 가로 막대가 있다(칩 줄이 넘친다)', `${a.length}개 ${JSON.stringify(a)}`)

console.log('\n── ② 「한끼 일기」로 옮긴다 ────────────────')
await page.getByRole('button', { name: '한끼 일기', exact: true }).first().click()
await page.waitForTimeout(900)
// ⚠️ «정말 옮겨졌나»부터 확인한다 — 안 옮겨졌는데 「막대 없음」이면 거짓 통과다(규칙 18 ⓘ)
const 제목 = await page.locator('.h-title').first().innerText()
칸(제목.trim() === '한끼 일기', '진짜로 「한끼 일기」로 옮겨졌다', 제목.trim())
const b = await 막대()
칸(b.length === 0, '한끼 일기엔 가로 막대가 «없다»', `${b.length}개 ${JSON.stringify(b)}`)

// ③ 달력을 실제로 침범했나 — 창업자 캡처가 그 모습이었다
const cal = await page.evaluate(() => {
  const el = document.querySelector('.cal-head')
  if (!el) return null
  const box = el.parentElement.getBoundingClientRect()
  return [Math.round(box.top), Math.round(box.bottom)]
})
// ⛔ 달력을 못 찾으면 «통과»가 아니라 «실패»다 — 안 그러면 이 칸은 영영 초록불이다
const 침범 = cal ? b.filter(([, , y]) => y >= cal[0] - 40 && y <= cal[1]) : null
칸(침범 !== null && 침범.length === 0, '달력 위를 가로지르는 막대가 없다', cal ? `달력 y ${cal[0]}~${cal[1]} · 침범 ${침범.length}개` : '⛔달력을 못 찾았다 — 시드에 일기가 없나')

console.log('\n── ④ 다시 모아보기 ────────────────────────')
await page.getByRole('button', { name: '모아보기', exact: true }).first().click()
await page.waitForTimeout(900)
const c = await 막대()
칸(c.length > 0, '돌아오면 막대도 돌아온다', `${c.length}개`)

console.log('\n── ⑤ 장보기 ↔ 냉장고 ──────────────────────')
await 탭가기('장보기')
await page.waitForTimeout(700)
const d = await 막대()
await page.getByRole('button', { name: '냉장고', exact: true }).first().click()
await page.waitForTimeout(900)
const e = await 막대()
칸(!(d.length > 0 && JSON.stringify(d) === JSON.stringify(e)), '냉장고로 옮기면 장보기 막대가 그대로 안 남는다', `장보기 ${d.length}개 → 냉장고 ${e.length}개`)

console.log('\n── ⑥ 크래시 ───────────────────────────────')
칸(errs.length === 0, '런타임 크래시 0', errs.slice(0, 2).join(' / '))

await page.screenshot({ path: `${OUT}/막대잔상.png` })
await browser.close()
stop()
console.log(fail ? `\n⛔ ${fail}칸 어긋남` : '\n✅ 막대 잔상 검사 통과')
process.exit(fail ? 1 : 0)
