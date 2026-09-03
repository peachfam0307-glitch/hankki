// ※🥄 재현 — 「※ 곁말이 «걸음»이 되던 것」 ＋ 「[계량] 절이 통째로 사라지던 것」 (창업자 판정 2026-09-01)
//
// 📮 창업자 ③ = *"ⓐ 걸음 1 아래 작은 곁말로 (요리모드에서 빈 칸이 안 생김"*
// 📮 창업자 ④ = *"계량은 재료로 가야지 **원문에도 재료에 있었잖아**"*
//
// ⭐⭐⭐ **잣대가 «둘»이다 — 진짜 OCR 원문 ＋ 창업자가 손으로 친 깨끗한 원문.**
//    ⛔⛔ 이게 이 판을 만든 «이유»다. `_repro-삼치파서-0831` 은 **깨끗한 글로만** 재서
//       진짜 캡처에서 「식용유 2스푼 200ml」로 뭉개진 걸 통째로 놓쳤다(창업자가 폰에서 잡았다).
//       **앱이 받는 건 사람이 친 글이 아니라 «카메라가 읽은 글»이다**(절대원칙 30).
//    🔎 그래서 아래 `OCR` 은 창업자가 붙여 준 rawText 그대로다 —
//       「휴삼치」·「밥순가락」·「= 200ml」·「생가즈 조그」·「때/El/FEE」까지 한 글자도 안 고쳤다.
//
// ⭐ 재는 것 넷
//   ① ※ 줄이 «새 걸음»이 안 된다 — 앞 걸음의 둘째 줄(`\n`)로 접힌다
//   ② 화면 어디에도 「※」가 안 남는다 (표식은 파이프라인 통과용이지 글자가 아니다)
//   ③ 「계량」 절이 «재료»를 연다 — 「밥숟가락 기준」이 재료 맨 위에 담긴다
//   ④ ⛔ 그런데 「계량컵 200ml」은 «절 이름»이 아니다 — 재료로 남아야 한다
//      (안 그러면 고치려던 것과 «똑같은» 사고 — 재료 한 줄이 통째로 사라진다)
//
// 🧪 규칙 12 = `곁말접기()` 를 빼면 ①②가, `SEC_ING` 의 「계량」을 빼면 ③이,
//    음수 전방탐색 `(?![가-힣])` 을 빼면 ④가 죽는다.
//
// ⚠️ **여기서 «안» 재는 것** = 「= 200ml」가 「식용유 2스푼」에 붙는 것.
//    그건 OCR 이 「물」을 「=」로 읽은 것이라 파서 규칙으로 못 푼다 —
//    사진을 같이 보는 AI 를 재는 별도 계획(`사진읽는AI-조사-2026-09-01.md`)의 몫이다.
//    ⛔ 여기에 「언젠가 되겠지」로 실패 칸을 만들어 두지 않는다(빨간 게이트는 죽은 게이트다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-곁말계량-0901.mjs
// 🏷 이름표 = 판정대기 (⏳창업자 「배포해」 전 · hold/곁말계량-0901)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { parseRecipeText } from '../src/parseRecipe.js'

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 조건, 덧 = '') => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}${덧 ? '  ' + 덧 : ''}`) }
  else { 실패++; 실패목록.push(이름); console.log(`  ❌ ${이름}${덧 ? '  ' + 덧 : ''}`) }
}

// ── 잣대 ① 진짜 OCR 원문 (창업자가 붙여 준 rawText · ⛔한 글자도 고치지 않는다) ──
const OCR = `휴삼치간장조림 레시피
[계량]
밥순가락 기준
[재료]
무 1/3개
비비고 순살 삼치 2팩
식용유 2스푼
= 200ml
[양념]
미림 15스푼
청주 12스푼
간장 3스푼
생가즈 조그
ood ㅁ
[만드는 법]
때 팬에 식용유 2스푼을 두르고
중약불에서 무를 앞뒤로 3분씩 구워주세요.
※ 무의 각진 모서리는
물을 자작하게 봇고
미림 15스푼, 청주 12스푼, 간장 3스푼,
조금을 넣어 강불에서 한소끔 끊여주세요.
El 중약불로 줄이고
으
FEE 끼업어가며 양념이 때까지 졸여주세요.
무가 거의 다 익으면
비비고 순살 삼치구이를 올리고
으 초초
TEE 촉촉하게 끼었어주면 완성이에요.`

// ── 잣대 ② 창업자가 손으로 친 깨끗한 원문 ──
const 깨끗 = `#삼치간장조림 레시피

[계량]
밥숟가락 기준

[재료]
무 1/3개
비비고 순살 삼치 2팩
식용유 2스푼
물 200ml

[만드는 법]

1 팬에 식용유 2스푼을 두르고
중약불에서 무를 앞뒤로 3분씩 구워주세요.
※무의 각진 모서리는 돌려깎기 했어요.

2 물을 자작하게 붓고
미림 15스푼을 넣어 강불에서 한소끔 끓여주세요.`

console.log('\n※🥄 곁말 접기 ＋ 계량 → 재료 — 원문 «둘»로 잰다\n')

// ══ ① 진짜 OCR 원문 ══════════════════════════════════════════════════
console.log('  ── ① 진짜 OCR 원문 (카메라가 읽은 글) ──')
const o = parseRecipeText(OCR, { fromOcr: true })

chk('①-1 걸음이 «4개»다 (곁말이 5번째 걸음이 안 됐다)', (o.steps || []).length === 4,
  `${(o.steps || []).length}개`)
chk('①-2 걸음 1 아래에 곁말이 «둘째 줄»로 붙었다',
  /^[^\n]+\n무의 각진 모서리는/.test(o.steps?.[0] || ''),
  JSON.stringify(o.steps?.[0] || ''))
chk('①-3 ⛔ 어느 걸음에도 「※」가 «한 글자도» 안 남았다',
  !(o.steps || []).some((s) => s.includes('※')))
chk('①-4 ⛔ 곁말이 «혼자 서는» 걸음이 아니다',
  !(o.steps || []).some((s) => /^무의 각진 모서리는/.test(s)))
chk('①-5 「밥순가락 기준」이 재료 «맨 위»에 담겼다', (o.ingredients || [])[0] === '밥순가락 기준',
  JSON.stringify((o.ingredients || [])[0]))
// 🥄 [2026-09-03] 잣대를 「스푼」 → 「큰술」로 옮겼다 — **게이트가 «맞게» 걸린 것이다.**
//   📮 창업자 확정 = *"큰술로 통일하자. 스푼 다 빼고"* → `parseRecipe.js` 의 `단위통일()` 이
//      담을 때 「스푼」을 「큰술」로 고른다. 그래서 옛 낱말을 찾던 이 칸이 죽었다.
//   ⭐ 재료가 «사라진» 게 아니다 — 여덟 개가 다 있고 말만 바뀌었다(실측으로 확인).
//   ⛔ 잣대를 「큰술|스푼 아무거나」로 느슨하게 하지 «않는다» — 그러면 스푼이 되돌아와도 초록불이 된다.
chk('①-6 재료가 통째로 사라지지 않았다 (무·삼치·양념이 다 있다)',
  ['무 1/3개', '비비고 순살 삼치 2팩', '미림 15큰술', '간장 3큰술'].every((x) => (o.ingredients || []).includes(x)),
  (o.ingredients || []).join(' · '))
chk('①-7 마지막 걸음이 살아 있다', (o.steps || []).some((s) => /완성이에요/.test(s)))

// ══ ② 깨끗한 원문 ════════════════════════════════════════════════════
console.log('\n  ── ② 창업자가 손으로 친 깨끗한 원문 ──')
const c = parseRecipeText(깨끗)
chk('②-1 걸음이 «2개»다 (곁말이 3번째 걸음이 안 됐다)', (c.steps || []).length === 2,
  `${(c.steps || []).length}개`)
chk('②-2 곁말 전문이 걸음 1의 둘째 줄이다',
  /\n무의 각진 모서리는 돌려깎기 했어요/.test(c.steps?.[0] || ''),
  JSON.stringify(c.steps?.[0] || ''))
chk('②-3 ⛔ 「※」가 안 남았다', !(c.steps || []).some((s) => s.includes('※')))
chk('②-4 「밥숟가락 기준」이 재료 맨 위에 담겼다', (c.ingredients || [])[0] === '밥숟가락 기준',
  JSON.stringify((c.ingredients || [])[0]))

// ══ ③ 안 건드려야 하는 자리 ═══════════════════════════════════════════
console.log('\n  ── ③ ⛔ 안 건드려야 하는 자리 ──')
// ⛔⛔ 이 칸이 이 고침의 «제일 위험한 부작용»을 막는다 —
//    「계량」 뒤에 한글이 붙은 재료가 «절 이름»으로 읽히면 그 줄이 통째로 사라진다.
const 계량컵 = parseRecipeText('감자조림\n[재료]\n감자 2개\n계량컵 200ml\n계량스푼 1개\n[만드는 법]\n감자를 썰어요.')
chk('③-1 ⛔ 「계량컵 200ml」은 절 이름이 아니다 (재료로 남는다)',
  (계량컵.ingredients || []).some((x) => /계량컵/.test(x)), (계량컵.ingredients || []).join(' · '))
chk('③-2 ⛔ 「계량스푼 1개」도 재료로 남는다',
  (계량컵.ingredients || []).some((x) => /계량스푼/.test(x)))
// ⭐ 앞 걸음이 없으면 «내용을 잃지 않는다» — 그냥 걸음으로 남긴다
const 첫줄곁말 = parseRecipeText('무침\n[재료]\n무 1개\n[만드는 법]\n※ 무는 미리 절여두세요.\n무를 무쳐요.')
chk('③-3 앞 걸음이 없으면 곁말이 «걸음»으로 남는다 (내용을 안 잃는다)',
  (첫줄곁말.steps || []).some((s) => /무는 미리 절여두세요/.test(s)) &&
  !(첫줄곁말.steps || []).some((s) => s.includes('※')),
  (첫줄곁말.steps || []).map((s) => JSON.stringify(s)).join(' · '))

// ══ ④ 화면 — 진짜로 «작은 곁말»로 그려지나 ════════════════════════════
// ⛔ 파서만 재면 반쪽이다 — 창업자가 보는 건 화면이다(규칙 18 ⓘ · 21).
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4483, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
// ⭐ 씨앗을 «앱과 같은 모듈»로 만든다 — 흉내 낸 글자를 심으면 앱과 조용히 어긋난다(절대원칙 30)
const state = {
  // ⛔ `status: 'sorted'` ＋ `savedAt` 이 «없으면» 레시피 목록에 안 뜬다(MyRecipesScreen:242).
  //    2026-09-01 에 이걸 빠뜨려 ④⑤가 통째로 죽었다 — 화면에 «도착했나»를 먼저 재서 잡았다.
  recipes: [{ id: 'r곁말', title: '곁말시험', at: Date.now(), savedAt: Date.now(), status: 'sorted', ingredients: o.ingredients, steps: o.steps, cover: {} }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 } })
const 오류 = []
page.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
}, state)
await page.goto('http://127.0.0.1:4483/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 레시피 탭 → 「곁말시험」 열기
await page.evaluate(() => {
  const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
  bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
})
await page.waitForTimeout(500)
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith('곁말시험'))?.click())
await page.waitForTimeout(700)

console.log('\n  ── ④ 화면 (레시피 상세) ──')
const 상세 = await page.evaluate(() => {
  const steps = [...document.querySelectorAll('.step')]
  const 첫 = steps[0]
  const tip = 첫?.querySelector('.step-tip')
  const txt = 첫?.querySelector('.txt')
  const cs = tip ? getComputedStyle(tip) : null
  const ct = txt ? getComputedStyle(txt) : null
  return {
    도착: steps.length > 0,
    걸음수: steps.length,
    곁말글: tip ? (tip.innerText || '').trim() : '',
    곁말크기: cs ? parseFloat(cs.fontSize) : 0,
    본문크기: ct ? parseFloat(ct.fontSize) : 0,
    곁말색: cs ? cs.color : '',
    본문색: ct ? ct.color : '',
    // ⛔⛔ 여기서 `.screen` 을 읽으면 «거짓 초록불»이 난다 — 화면을 옮겨도 앞 화면 DOM 이 남고
    //    `querySelector` 는 «첫» `.screen`(＝앞 화면)을 집는다(2026-08-21 링크정직 판과 같은 함정).
    //    ✅ 걸음 칸 «그 자체»의 글자를 본다.
    화면글: steps.map((s) => s.innerText || '').join('\n'),
  }
})
chk('④-0 상세 화면에 «도착했다» (안 갔는데 초록불 나는 것 방지)', 상세.도착, `걸음 ${상세.걸음수}개`)
chk('④-1 걸음이 4개다 (곁말이 빈 칸을 안 만든다)', 상세.걸음수 === 4, `${상세.걸음수}개`)
chk('④-2 걸음 1 «안»에 곁말 줄이 있다', /무의 각진 모서리는/.test(상세.곁말글), JSON.stringify(상세.곁말글))
chk('④-3 곁말이 본문보다 «작다»', 상세.곁말크기 > 0 && 상세.곁말크기 < 상세.본문크기,
  `${상세.곁말크기}px < ${상세.본문크기}px`)
chk('④-4 곁말이 «앱 최소 글자 14px» 아래로 안 내려갔다', 상세.곁말크기 >= 14, `${상세.곁말크기}px`)
chk('④-5 곁말 색이 본문과 «다르다» (연한 회색)', !!상세.곁말색 && 상세.곁말색 !== 상세.본문색,
  `${상세.곁말색} ↔ ${상세.본문색}`)
chk('④-6 ⛔ 화면 글자에 「※」가 «없다»', !상세.화면글.includes('※'))

// ── 요리 모드 ──
console.log('\n  ── ⑤ 화면 (요리 모드) ──')
await page.evaluate(() => document.querySelector('[data-coach="cook"]')?.click())
await page.waitForTimeout(600)
await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))?.click())
await page.waitForTimeout(500)
const 요리 = await page.evaluate(() => {
  const el = document.querySelector('.cook-steptext')
  if (!el) return { 도착: false }
  const tip = el.querySelector('.step-tip')
  return {
    도착: true,
    본문: (el.childNodes[0]?.textContent || '').trim(),
    곁말: tip ? (tip.innerText || '').trim() : '',
    곁말크기: tip ? parseFloat(getComputedStyle(tip).fontSize) : 0,
    본문크기: parseFloat(getComputedStyle(el).fontSize),
    // ⭐ 창업자가 콕 집은 것 = *"요리모드에서 빈 칸이 안 생김"* → «걸음 수»가 답이다.
    //    ⛔ 「※ 가 보이나」만 재면 안 된다 — 요리 모드는 한 걸음씩 보여줘서
    //       ※ 가 든 걸음이 «다음 장»이면 안 고쳐졌는데도 초록불이 난다(2026-09-01 실제로 그랬다).
    총걸음: (document.querySelector('.cook-stepno')?.innerText || '').replace(/\s+/g, ''),
    화면글: (document.querySelector('.cook-steptext')?.innerText || ''),
  }
})
chk('⑤-0 요리 모드 첫 걸음에 «도착했다»', 요리.도착)
chk('⑤-1 걸음 글이 «시킬 일»로 시작한다', /팬에 식용유/.test(요리.본문 || ''), JSON.stringify(요리.본문 || ''))
chk('⑤-2 곁말이 그 아래 작게 붙었다',
  /무의 각진 모서리는/.test(요리.곁말 || '') && 요리.곁말크기 > 0 && 요리.곁말크기 < 요리.본문크기,
  `${요리.곁말크기}px < ${요리.본문크기}px`)
chk('⑤-3 요리 모드 걸음이 «4개»다 (할 일 없는 빈 칸이 안 생긴다)',
  /\/4$/.test(요리.총걸음 || ''), 요리.총걸음 || '')
chk('⑤-4 ⛔ 요리 모드 글자에 「※」가 없다', !(요리.화면글 || '').includes('※'))

const 진짜오류 = 오류.filter((m) => !/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch|NetworkError/i.test(m))
chk('⑥ 화면 오류 0건', 진짜오류.length === 0, 진짜오류.join(' / '))

await b.close(); srv.close()

console.log(`\n🔢 ${통과}/${통과 + 실패}`)
if (실패) { console.log('\n⛔ 곁말·계량이 다시 어긋난다:\n   · ' + 실패목록.join('\n   · ')); process.exit(1) }
console.log('✅ ※ 곁말은 앞 걸음 아래로, [계량]은 재료로 — 원문 둘 다 맞다.')
