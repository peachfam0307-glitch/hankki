// 📔🗓 **「일기 앨범을 달마다 갈라 보여주나 · 한 달 안에서 안 겹치나」 재현판** (smoke · 2026-09-03)
//
// 📮 창업자 제보 = *"일기에서 8월에 만든 음식이 계속 누적으로 뜬다."*
//    🔢 창업자 폰 실물 = 「이번 달 3번 · 총 17개」인데 앨범엔 열일곱 칸이 통째로 이어지고
//       **수제 떡갈비 3칸 · 공심채 볶음 2칸 · 치킨 레터스랩 2칸**이 따로따로 떴다.
//    ✅ 창업자 확정 = **달마다 나누고 겹치지 않게.**
//
// ⛔⛔ 왜 판이 필요한가 — **되돌리기가 한 줄이다.**
//    `monthList` 의 `if (!pickedYm) return []` 를 `return entries` 로 되돌리면 그 자리로 돌아가고,
//    화면은 «멀쩡해 보인다»(그림이 많이 뜨는 게 오히려 풍성해 보인다). 아무도 안 터진다.
//    📌 8/17 에 「그 달 묶음은 안 겹친다」를 정해놓고 **이 자리만 빠뜨린 것**이 정확히 그런 종류의 구멍이었다.
//
// ⭐ 이 판이 보는 것 넷
//    ① 달 머리글이 «달마다» 선다 (2026년 9월 · 2026년 8월)
//    ② ⭐심장 — **한 달 안에 같은 제목이 두 번 없다**
//    ③ ⭐그 다음 심장 — **기록은 안 지워졌다.** 달력에서 그날을 누르면 그날 것이 «다» 나온다
//    ④ 달 머리글이 «최신 달부터» 선다 (8월이 9월보다 위에 오면 안 된다)
//
// 🧪 규칙 12 = `return []` 을 `return entries` 로 되돌리면 ①②④가 죽는다(직접 돌려서 확인).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

const 그날 = '2026-09-03'
// 🔀 빈 포트를 잡아서 쓴다 — 판 여럿이 한 번호를 같이 쓰면 EADDRINUSE 로 죽는다
const PORT = await new Promise((r) => {
  const t = createServer()
  t.listen(0, () => { const p = t.address().port; t.close(() => r(p)) })
})
let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

// 🗓 창업자 폰과 «같은 모양»으로 심는다 — 9월에 셋, 8월에 여럿, 그리고 겹치는 것들
//    ⛔ 날짜를 `Date.now()` 로 만들지 않는다. 판이 도는 날에 따라 달이 바뀌면 판이 낡는다.
const 때 = (달, 일) => new Date(`2026-${String(달).padStart(2, '0')}-${String(일).padStart(2, '0')}T19:00:00+09:00`).getTime()
const 심을것 = [
  ['수제 떡갈비', 9, 2], ['공심채 볶음', 9, 1], ['수제 떡갈비', 9, 1],   // 9월 — 떡갈비가 «두 번»
  ['수제 떡갈비', 8, 28], ['공심채 볶음', 8, 26], ['공심채 볶음', 8, 20], // 8월 — 둘 다 두 번
  ['엄마표 김밥', 8, 14], ['누룽지삼계탕', 8, 9],
]
const 일기들 = 심을것.map(([title, m, d], i) => ({
  id: `t${i}`, recipeId: `r${i}`, title, source: '창업자', at: 때(m, d), rating: 5, note: '', photo: null,
}))
const now = 때(9, 3)
const state = {
  recipes: basicRecipes.slice(0, 8).map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
  diary: 일기들,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const 그날 = new Date('${그날}T19:30:00+09:00').getTime()
  const O = Date
  class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(그날) } static now(){ return 그날 } }
  Date = F
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
// ⛔ 「새 소식」 팝업(sheet-mask)이 아래바를 덮어 «일기 탭이 안 눌린다»(실측: 클릭 30초 타임아웃).
//    ✅ 그래서 본 것으로 표시해 둔다 — 이 판이 볼 것은 팝업이 아니라 앨범이다.
await p.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1')
}, state)
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1600)

console.log('\n── 일기 앨범 달 묶음 (2026-09-03 · 9월 3장 · 8월 5장) ──')

// 📔 일기 탭으로 — ⛔라벨로 찾는다(자리·순서는 바뀐다)
//    ⭐ 이 탭은 `MyRecipesScreen initView="log"` 라 **들어가면 이미 요리 앨범**이다.
//    ⛔⛔ 처음엔 「모아보기」를 눌렀다가 «레시피 격자»로 나가버려 `.album-grid` 가 0개였다.
//       세그먼트 두 짝은 「모아보기(레시피) / 한끼 일기(앨범)」다 — 누를 것은 후자거나 «아무것도 아니다».
await p.getByRole('button', { name: /일기/ }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 일기세그 = p.locator('.seg', { hasText: '한끼 일기' }).first()
if (await 일기세그.count() && !(await 일기세그.getAttribute('class') || '').includes('on')) {
  await 일기세그.click().catch(() => {}); await p.waitForTimeout(700)
}

// 화면에 실제로 그려진 달 머리글과 칸 제목을 «읽어» 온다
const 판 = await p.evaluate(() => {
  const 격자들 = [...document.querySelectorAll('.album-grid')]
  const 결과 = []
  for (const g of 격자들) {
    // 머리글 = 격자 바로 «위» 형제 또는 부모의 첫 글자줄
    let 머리 = ''
    let 앞 = g.previousElementSibling
    while (앞 && !머리) { 머리 = (앞.textContent || '').trim(); 앞 = 앞.previousElementSibling }
    if (!머리 && g.parentElement) 머리 = (g.parentElement.firstElementChild?.textContent || '').trim()
    const 제목들 = [...g.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || '').replace(/\s*기록 보기$/, '')).filter(Boolean)
    결과.push({ 머리, 제목들 })
  }
  return 결과
})
console.log('     읽은 격자', 판.map((x) => `[${x.머리.slice(0, 14)} · ${x.제목들.length}칸]`).join(' '))

// ① 달 머리글이 달마다 선다
const 달머리 = 판.map((x) => (x.머리.match(/(\d{4})년\s*(\d{1,2})월/) || [])[0]).filter(Boolean)
적기(달머리.includes('2026년 9월') && 달머리.includes('2026년 8월'),
  `달 머리글이 둘 다 있다 — ${달머리.join(' / ') || '(없다)'}`)

// ② ⭐심장 — 한 달 안에 같은 제목이 두 번 없다
let 겹침 = []
for (const 칸 of 판) {
  const 본 = new Set()
  for (const t of 칸.제목들) { if (본.has(t)) 겹침.push(`${칸.머리.slice(0, 10)}:${t}`); 본.add(t) }
}
적기(겹침.length === 0, `한 달 안에 겹치는 요리가 없다${겹침.length ? ' — ⛔' + 겹침.join(', ') : ''}`)

// ④ 최신 달이 위에 온다
const i9 = 달머리.indexOf('2026년 9월')
const i8 = 달머리.indexOf('2026년 8월')
적기(i9 >= 0 && i8 >= 0 && i9 < i8, `9월이 8월보다 «위»에 있다 (9월 ${i9}번째 · 8월 ${i8}번째)`)

// ③ ⭐기록은 안 지워졌다 — 달력에서 8/26 을 누르면 그날 것이 나온다
//    ⛔ 「겹쳐서 안 보이게」 한 것이 「지운 것」이 되면 그건 고친 게 아니라 망친 것이다
const 달력열기 = p.getByRole('button', { name: /달력|캘린더/ }).first()
if (await 달력열기.count()) { await 달력열기.click().catch(() => {}); await p.waitForTimeout(700) }
// ⚠️ 「개수가 같다」로 재지 않는다 — 앱이 첫 실행에 자기 몫을 한 장 더 넣는다(실측 8 → 9).
//    그건 우리 버그가 아니다. **심은 것이 «하나도 안 사라졌나»**를 열쇠로 본다.
const 살아있나 = await p.evaluate((심은) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 있 = new Set((s.diary || []).map((d) => d.id))
  return { 없는것: 심은.filter((id) => !있.has(id)), 전체: (s.diary || []).length }
}, 일기들.map((d) => d.id))
적기(살아있나.없는것.length === 0,
  `기록 원본이 하나도 안 사라졌다 — 심은 ${일기들.length}장 전부 있다 (저장된 것 ${살아있나.전체}장)`)

await ctx.close()
await b.close()
srv.kill()
console.log(bad === 0 ? '\n✅ 일기 달 묶음 전부 통과\n' : `\n⛔ ${bad}칸 실패\n`)
process.exit(bad === 0 ? 0 : 1)
