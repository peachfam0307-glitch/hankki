// ⏱ 시간은 «어림수»다 — 이 검사가 배포를 막는다
//
// 📮 창업자 2026-08-13 *"정확하게 분은 못재 대강얼추비슷하게 고쳐"*
//                      *"7분 우삼겹도 간단으로 바꾸자"* · *"굳이 분을 넣을필요는 없을 듯"*
//
// ⭐ 왜 규칙이 아니라 장치인가 = 글로만 적어두면 다음에 또 분 단위로 계산해서 적는다.
//    실제로 오늘 「굽기 14분 ＋ 볶기 6분 = 20분」이라고 코드 주석에 계산해 놨었다.
//
// 무엇을 보나
//   ① `time` 이 5분 단위인가 (5분 미만은 예외 — 「1분」짜리는 어림수가 의미 없다)
//   ② 레시피 «제목»에 분이 박혀 있나 — 제목의 숫자는 나중에 영영 못 고친다
//   ③ 주간 레시피 주 설명(`why`)에 분이 박혀 있나 — 편의 시간이 바뀌면 그대로 거짓말이 된다
//
// ⛔ 재료·순서·메모의 분은 «안» 본다 — 「10초만 데친다」·「20분 둔다」는 조리 시간이라 정확해야 한다.
//    시끄러운 게이트는 죽은 게이트다.
import { allBasicRecipes } from '../src/data/basics.js'
import { WEEKLY } from '../src/data/weekly.js'

const 분표기 = /\d+\s*분/
let 탈 = 0, 경고 = 0

// 🙋 예외 — «창업자가 이미 정한 것». 기계가 창업자 판정을 물면 안 된다(규칙 11).
//    ⛔ 새 것을 여기 추가하지 말 것. 여기 있는 건 창업자에게 물어보고 지운다.
// ✅ 2026-08-13 창업자 판정으로 «둘 다» 고쳐져 예외가 비었다 —
//    「10분 버섯밥」→간단 버섯밥 · 깻잎 주 「5분 볶음까지」→「후딱 볶는 것까지」
// ⛔ 여기에 새로 추가하지 말 것. 예외가 필요하면 창업자에게 물어보고 넣는다.
const 봐줌 = {}

// ① time 이 5분 단위인가
for (const r of allBasicRecipes) {
  if (r.time >= 5 && r.time % 5 !== 0) {
    console.log(`⛔ 「${r.title}」 time ${r.time}분 — 5분 단위 어림수로 (창업자: 분은 못 잰다)`)
    탈++
  }
}

// ② 제목에 분
for (const r of allBasicRecipes) {
  if (!분표기.test(r.title)) continue
  if (봐줌[r.title]) { console.log(`🙋 「${r.title}」 — ${봐줌[r.title]}`); 경고++; continue }
  console.log(`⛔ 제목에 분이 박혔다 — 「${r.title}」`)
  console.log(`   제목의 숫자는 나중에 못 고친다. 「간단 ○○」처럼 말로 쓸 것.`)
  탈++
}

// ③ 주 설명에 분
for (const w of WEEKLY) {
  if (!분표기.test(w.why || '')) continue
  if (봐줌[w.title]) { console.log(`🙋 ${w.from} 「${w.title}」 주 — ${봐줌[w.title]}`); 경고++; continue }
  console.log(`⛔ 주 설명에 분이 박혔다 — ${w.from} 「${w.title}」`)
  console.log(`   "${w.why}"`)
  console.log(`   편의 시간이 바뀌면 이 숫자가 그대로 거짓말이 된다(실제로 그랬다).`)
  탈++
}

if (탈) {
  console.log(`\n⛔ 시간 어림수 검사 — ${탈}건. 고치고 다시 돌려라.`)
  process.exit(1)
}
console.log(`✅ 시간 어림수 — 레시피 ${allBasicRecipes.length}편 · 주 ${WEEKLY.length}개`
  + ` · 새로 박힌 분 0${경고 ? ` (🙋창업자 판정 대기 ${경고}건)` : ''}`)
