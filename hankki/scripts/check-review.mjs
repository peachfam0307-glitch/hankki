// 🛑🛑 **검수 관문 — 「올라가기 전에 검수」를 «장치»가 지킨다** (창업자 절대원칙 2026-08-12)
//
// 📮 창업자 원문 = *"이제 레시피든 유료팩이든 뭐든 올라가기전에 검수 필수야.(절대원칙) 규칙위반 절대금지."*
//    그 앞에 = *"레시피 올리기전에 나한테 꼭 확인하고 올리라고 얘기했었는데.."*
//
// ⛔⛔ **왜 규칙이 아니라 장치인가 — 오늘 실제로 어겼기 때문이다.**
//    닭곰탕은 창업자 손메모 «한 줄」(「끓으면 닭」)이었는데 내가 순서 일곱 걸음·시간 60분·
//    메모 세 문단을 «지어내» 넣고 `from: 2026-08-10` 으로 **열어버렸다.**
//    게다가 코드 주석에 **「내가 지어낸 값 — 창업자 검수 대상」이라고 내 손으로 적어놓고** 그대로 열었다.
//    📌 «적어두는 것»을 «검수받는 것»으로 착각했다. 글로 적은 규칙은 이렇게 샌다.
//
// ⭐ 그래서 이 검사는 **날짜가 열리는 것을 막는다** — 검수 표시가 없는 편은 배포가 죽는다.
//    ⑴ `review: '창업자'` 가 붙어 있거나
//    ⑵ `from` 이 «아직 안 온 날짜»(미래)라 아무한테도 안 보이거나
//    둘 중 하나라야 통과한다.
//
// ⚠️ 「검수했다」는 **창업자가 실제로 그 편을 보고 말했을 때만** 붙인다.
//    ⛔ 내가 잘 썼다고 생각해서 붙이는 표시가 아니다. 그러면 이 관문도 종이가 된다.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const src = readFileSync(join(ROOT, 'src/data/basics.js'), 'utf8')

// 한 편 = `{ ...base, ... }` 한 덩어리. `title` 과 `from` 과 `review` 를 뽑는다.
const 편들 = []
for (const m of src.matchAll(/\{\s*\.\.\.base,([\s\S]*?)\n  \},/g)) {
  const body = m[1]
  const t = body.match(/title:\s*'([^']+)'/)
  const f = body.match(/from:\s*'(\d{4}-\d{2}-\d{2})'/)
  const r = body.match(/review:\s*'([^']*)'/)
  if (t) 편들.push({ title: t[1], from: f ? f[1] : null, review: r ? r[1] : null })
}

if (!편들.length) {
  console.log('⛔ 검수 관문 — 레시피를 한 편도 못 읽었다. 검사가 죽은 것이니 고칠 것.')
  process.exit(1)
}

// ⏰⏰⏰ **[2026-08-17 창업자 절대원칙] 「오늘」이 아니라 «내일»까지 본다.**
//
// 📮 창업자 원문 = *"**전날 검수 못한거는 어떻게잡아? 절대원칙도 무시됐는데?**"*
//
// ⛔⛔ **2026-08-17 에 이 관문이 「막긴 했는데 늦었다».** 다섯 편이 «이미 열린 뒤»에 막았다.
//    「날짜가 저절로 여는 문도 전날 검수한다」(절대원칙 2026-08-01)를 지키려면
//    **열리기 «전날»에 막혀야** 한다. 오늘 잣대로 재면 영영 «당일»에만 걸린다.
//
// ⭐⭐ **고침은 글자 두 개다 — `오늘` → `내일`.**
//    그러면 8/16 에 배포하려 할 때 「내일 열리는 5편이 검수 전이다」로 **배포가 막힌다.**
//    ＝ 규칙으로 부탁하던 「전날 검수」가 **장치로 강제된다.**
//
// ⏰ 날짜는 `src/today.js` 한 곳에서만 만든다(게이트 `check-kst` 가 강제 · 2026-08-17 사고).
import { todayKST, tomorrowKST } from '../src/today.js'

const 오늘 = todayKST()
const 내일 = tomorrowKST()
const 열린것 = 편들.filter((r) => !r.from || r.from <= 내일)
const 안된것 = 열린것.filter((r) => r.review !== '창업자')
const 내일열림 = (r) => r.from === 내일

console.log(`🛑 검수 관문 — 레시피 ${편들.length}편 중 «열린 것 ＋ 내일 열릴 것» ${열린것.length}편 (오늘 ${오늘} · 내일 ${내일})`)
if (!안된것.length) {
  console.log('   ✅ 열린 편도 내일 열릴 편도 모두 창업자 검수 표시가 있다')
  process.exit(0)
}

// ⚠️ 이미 열려 있는 편이 많다 — 하루아침에 전부 막으면 배포가 통째로 죽는다.
//    ⭐ 그래서 «오늘부터 새로 여는 것»만 막고, 이미 열린 것은 목록으로 남겨 하나씩 검수받는다.
//    ⛔ 이 유예를 늘리지 말 것 — 줄여야 하는 숫자다.
const 유예 = readFileSync(join(ROOT, 'scripts/review-allow.json'), 'utf8')
const 봐준다 = new Set(JSON.parse(유예).검수대기)
const 막힘 = 안된것.filter((r) => !봐준다.has(r.title))

for (const r of 안된것) {
  const 표 = 막힘.includes(r) ? '⛔' : '⏳'
  const 때 = 내일열림(r) ? ' 📅 «내일» 열린다 — 오늘 검수받을 것' : ''
  console.log(`   ${표} ${r.title} (from ${r.from || '없음'})${때}`)
}
if (!막힘.length) {
  console.log(`\n   ⏳ ${안된것.length}편이 «검수 대기» 목록에 있다 — 하나씩 창업자 검수를 받고 목록에서 뺄 것.`)
  process.exit(0)
}
const 내일것 = 막힘.filter(내일열림).length
console.log(`\n⛔⛔ 검수 안 받은 레시피 ${막힘.length}편${내일것 ? ` (그중 ${내일것}편은 «내일» 열린다)` : ''} — 배포를 막는다.`)
console.log('   👉 창업자에게 실물(앱 화면)을 보여 주고, 확인받으면 그 편에 `review: \'창업자\',` 를 붙일 것.')
console.log('   ⛔ 내가 잘 썼다고 생각해서 붙이는 표시가 아니다.')
process.exit(1)
