// 🧊 재현 — 「오늘 뭐 해먹지」·「냉장고 파먹기」가 «화면»에서 제대로 나오나
//
// ⛔ 단위 검사(`test-pantry.mjs`)는 함수만 본다. 화면에 붙는 자리가 틀리면 그건 못 잡는다.
//    (2026-08-10 v10.22 에 「검사는 전부 초록불인데 화면이 깨져 있던」 일이 있었다)
//
// ⭐ 재는 것 = ①「무」를 넣으면 «진짜 무가 든» 요리를 민다 ②풀무원·단무지 레시피가 안 뜬다
//    ③「돼지고기 앞다리살」로도 냉장고 파먹기가 걸린다(옛 코드는 0건) ④pageerror 0
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const 냉장고 = (이름들) => 이름들.map((n, i) => ({ id: `p${i}`, name: n, icon: null, expiry: null, addedAt: now }))
const state = (pantry) => ({
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  pantry,
  seedV: BASICS_VERSION,
})

const PORT = Number(process.env.PORT || 4341)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
const url = `http://127.0.0.1:${PORT}/`

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }

const 열기 = async (pantry) => {
  await page.goto(url)
  await page.evaluate((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
  }, state(pantry))
  await page.goto(url)
  await page.waitForTimeout(1400)
}
// 「오늘 뭐 해먹지」 칸이 지금 미는 요리 이름 · 「다른 추천」으로 넘겨 가며 목록을 본다
const 오늘목록 = async (n = 6) => {
  const out = []
  for (let i = 0; i < n; i++) {
    const t = await page.locator('.today-title').first().innerText().catch(() => '')
    if (!t) break
    out.push(t.trim())
    const more = page.locator('.today-refresh')
    if (!(await more.count())) break
    await more.click(); await page.waitForTimeout(250)
  }
  return out
}

console.log('\n── ① 냉장고에 「무」만 ─────────────────────')
await 열기(냉장고(['무']))
const 이유 = await page.locator('.today-reason').first().innerText().catch(() => '')
칸(이유.includes('냉장고'), '「냉장고 재료로 만들 수 있어요」로 뜬다', 이유)
const 무목록 = await 오늘목록(8)
console.log(`   민 요리: ${무목록.join(' · ') || '(없음)'}`)
// ⛔ 옛 코드가 걸었던 것 — 이 넷은 「무」가 «낱말 속»에서 걸린 것이라 뜨면 안 된다
const 가짜 = ['콩국수', '돼지고기 김치찌개', '크루키', '대구뭉티기']
const 낀것 = 무목록.filter((t) => 가짜.some((g) => t.includes(g)))
칸(낀것.length === 0, '풀무원·마무리·무방 때문에 걸리던 요리가 «안» 뜬다', 낀것.join(' · ') || '0건')

// ⛔⛔ 처음엔 「돼지고기 앞다리살」로 시험했는데 **그 말이 레시피에 통째로 적혀 있었다**
//    (「돼지고기 앞다리살 또는 삼겹살 200g」) → 옛 풀네임 방식도 걸려서 **버그를 증명 못 했다.**
//    ✅ 「소고기 국거리용」은 어느 레시피에도 통째로 없다 — 옛 방식 0편 · 첫 낱말로는 5편(실측).
//    📌 규칙 12는 「검사를 돌렸다」가 아니라 «옛 코드에서 진짜 걸리나»를 봐야 한다.
console.log('\n── ② 냉장고에 「소고기 국거리용」 ──────────')
await 열기(냉장고(['소고기 국거리용']))
const 이유2 = await page.locator('.today-reason').first().innerText().catch(() => '')
칸(이유2.includes('냉장고'), '뒤에 부위가 붙어도 냉장고 추천이 뜬다', 이유2)
const 돼지목록 = await 오늘목록(5)
console.log(`   민 요리: ${돼지목록.join(' · ') || '(없음)'}`)

console.log('\n── ③ 냉장고 파먹기 화면 ───────────────────')
await page.getByRole('button', { name: '장보기', exact: true }).first().click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: '냉장고', exact: true }).first().click()
await page.waitForTimeout(900)
// ⛔ 첫 판이 `.sec-head` 의 «바로 다음»을 봤는데 거긴 **안내문(`.t-sub`)** 이라 늘 빈 값이었다.
//    앱이 아니라 «내 선택자»가 범인이었다 — 규칙 18. → 격자가 나올 때까지 형제를 따라간다.
const 파먹기 = await page.evaluate(() => {
  const h = [...document.querySelectorAll('.h-section')].find((x) => x.textContent.includes('만들 수 있어요'))
  if (!h) return null
  let el = h.closest('.sec-head')
  while (el && !el.classList.contains('grid2')) el = el.nextElementSibling
  if (!el) return null
  return [...el.querySelectorAll('.grid-card')].map((c) => ({
    이름: c.querySelector('.name')?.textContent.trim(),
    개수: c.querySelector('.date')?.textContent.trim(),
  }))
})
칸(Array.isArray(파먹기) && 파먹기.length > 0, '「소고기 국거리용」으로 냉장고 파먹기가 걸린다 (옛 풀네임 방식은 0편)',
  파먹기 ? 파먹기.map((x) => `${x.이름}(${x.개수})`).join(' · ') : '칸을 못 찾음')
// ⛔⛔ 「가진 재료 N개」에 소수가 찍히면 안 된다 — 세우는 값(점수)과 보여주는 값(개수)은 다르다
const 소수 = (파먹기 || []).filter((x) => /\d+\.\d/.test(x.개수 || ''))
칸(소수.length === 0, '「가진 재료 N개」가 «정수»로 찍힌다', 소수.map((x) => x.개수).join(' · ') || '0건')

console.log('\n── ④ 크래시 ───────────────────────────────')
칸(errs.length === 0, '런타임 크래시 0', errs.slice(0, 2).join(' / '))

await browser.close()
stop()
console.log(fail ? `\n⛔ ${fail}칸 어긋남` : '\n✅ 냉장고 추천 재현 통과')
process.exit(fail ? 1 : 0)
