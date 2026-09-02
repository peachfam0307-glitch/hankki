// 🍚🥣 **「양념장 말고 «요리»는 몇 편인가」** — 창업자 백업을 갈라 센다 (2026-09-02)
//
// 📮 창업자 = *"양념장들말고 요리는 없어? **우리집레시피에 나갈 요리들 되게 많지않아??**"*
//
// ⭐⭐ 왜 이 도구가 필요한가 — `_판-내레시피.mjs` 는 **걸음 수**로만 갈랐다(🅰🅱🅲).
//    그래서 「소스인데 걸음이 3개」와 「요리인데 걸음이 3개」가 **같은 칸**에 들어간다.
//    창업자가 물은 것은 «걸음 수»가 아니라 **«무엇인가»**다 → 축을 하나 더 세운다.
//
// ⛔ **낱말로 가르되 «눈으로 볼 수 있게» 전부 찍는다** — 자동 판정만 믿지 않는다(규칙 21).
//    ⭐ 애매한 것은 아래 손판정표(`손판정`)에 «이유와 함께» 박는다. 낱말 규칙만으로는 못 가른다:
//       · 「달래장」 = 양념(비벼 먹는 장)   ↔  「마늘간장 계란장」·「꼬막장」 = 요리(밑반찬)
//       · 「물회육수」·「전 반죽」·「육전 밑간」 = 요리에 «들어가는 것»이라 양념 쪽
//       · 「고기 소분 기준」 = 레시피가 아니라 «메모»다 — 어느 쪽도 아니다
//
// ⛔ 레시피 «내용»은 안 찍는다 — 이 저장소는 공개(public)다. **제목·줄수·갈래만.**
//
// 쓰기:  node scripts/_세기-요리와소스-0902.mjs <백업.json>
//        (백업은 scratchpad 에서만 읽는다 — ⛔저장소에 두지 않는다)
// ⭐⭐ 판정 규칙은 **`_갈래-요리와양념-0902.mjs` 한 곳에만** 있다 —
//    검수판 도구(`_판-요리33-0903.mjs`)가 «같은 것»을 부른다. 각자 판정하면 반드시 어긋난다.
import { readFileSync } from 'node:fs'
import { 재료수, 걸음수, 갈래, 상태, 앱에든것, 내가넣은편 } from './_갈래-요리와양념-0902.mjs'

const 백업 = process.argv[2]
if (!백업) {
  console.error('⛔ 백업 파일 경로를 준다:  node scripts/_세기-요리와소스-0902.mjs <백업.json>')
  process.exit(1)
}

const 앱에 = 앱에든것(new URL('../src/data/basics.js', import.meta.url))

const d = JSON.parse(readFileSync(백업, 'utf8'))
const 내것 = 내가넣은편(d)

const 편 = 내것.map((r) => ({
  제목: (r.title || '(제목없음)').trim(),
  재: 재료수(r),
  걸: 걸음수(r),
  갈래: 갈래(r),
  상태: 상태(r),
}))
편.forEach((p) => { p.앱 = 앱에.has(p.제목) })

const 셈 = (조건) => 편.filter(조건).length
const 요리 = (p) => p.갈래 === '요리'
const 양념 = (p) => p.갈래 === '양념'

console.log(`📂 ${백업.split('/').pop()}`)
console.log(`총 ${d.recipes.length}편 · 씨앗 ${d.recipes.length - 내것.length} · 창업자가 넣은 것 ${내것.length}\n`)

console.log('━━━ ① 요리인가 양념인가 ━━━')
console.log(`  🍚 요리   ${String(셈(요리)).padStart(3)}편`)
console.log(`  🥣 양념   ${String(셈(양념)).padStart(3)}편`)
console.log(`  📝 메모   ${String(셈((p) => p.갈래 === '메모')).padStart(3)}편   (레시피가 아니다)`)

console.log('\n━━━ ② 앱에 이미 나갔나 ━━━')
console.log(`  🍚 요리 — 나감 ${셈((p) => 요리(p) && p.앱)} · 아직 ${셈((p) => 요리(p) && !p.앱)}`)
console.log(`  🥣 양념 — 나감 ${셈((p) => 양념(p) && p.앱)} · 아직 ${셈((p) => 양념(p) && !p.앱)}`)

console.log('\n━━━ ③ 아직 안 나간 «요리» 를 완성도로 ━━━')
for (const [기호, 이름] of [['🅰', '바로 낼 수 있다 (걸음 3↑ ＋ 재료)'], ['🅱', '순서가 1~2걸음'], ['🅲', '재료만 있다'], ['🅾', '재료도 걸음도 없다']]) {
  const 목 = 편.filter((p) => 요리(p) && !p.앱 && p.상태 === 기호)
  console.log(`\n  ${기호} ${이름} — ${목.length}편`)
  for (const p of 목.sort((a, b) => b.걸 - a.걸 || b.재 - a.재)) {
    console.log(`     ${String(p.재).padStart(2)}재 ${String(p.걸).padStart(2)}걸음  ${p.제목}`)
  }
}

console.log('\n━━━ ④ 아직 안 나간 «양념» (참고) ━━━')
const 양념남 = 편.filter((p) => 양념(p) && !p.앱)
console.log(`  ${양념남.length}편 — ${양념남.map((p) => p.제목).sort().join(' · ')}`)
