// 🍳 레시피 한 편을 «실물 그대로» 찍는다 — 「말하기 전에 확인」을 «기억보다 빠르게» 만든다
//
// 📮 창업자 2026-08-17 = *"**말하기 전에 문서,실물 확인 후 얘기해 역시 절대원칙**"*
//
// ⛔⛔ **왜 만들었나 — 2026-08-16 에 실제로 틀렸다.**
//    창업자 *"시원한 묵채 샘플표지는 지우고 내보내야하지않을꺼"* 에 나는 **파일을 안 열고**
//    「그렇다」고 답했다. 실물을 여니 `sample` 은 **콩국수**에 붙어 있었고 묵채엔 없었다.
//    창업자는 «내가 만든 오해» 위에서 판정을 한 셈이 됐다.
//
// ⭐⭐ **훅으로는 못 막는다** — 훅은 «도구 호출»을 막지 «내가 하는 말»은 못 막는다(규칙 26 과 같은 한계).
//    그래서 막는 대신 **확인을 기억보다 빠르게** 만든다. 한 줄이면 답이 나오면 기억을 안 쓴다.
//    📌 `decided.mjs`(이미 정한 것 찾기)와 같은 생각이다.
//
// 쓰기:
//   node hankki/scripts/recipe.mjs 묵채            ← 이름 조각으로 찾는다(초성 아님)
//   node hankki/scripts/recipe.mjs --from 2026-08-17   ← 그날 열리는 편 전부
//   node hankki/scripts/recipe.mjs --sample        ← 샘플 표시가 붙은 편
//   node hankki/scripts/recipe.mjs --unreviewed    ← 검수 표시가 없는데 열린 편
import { todayKST } from '../src/today.js'
import { allBasicRecipes } from '../src/data/basics.js'

/**
 * 레시피 전부 — ⭐⭐ **앱이 화면에 쓰는 «바로 그 값»이다.**
 *
 * ⛔⛔ [2026-08-17] 첫 판은 `basics.js` 를 **글자로 파싱**했다. 그래서 `politeSteps()` 를
 *    «거치지 않은» 원문이 나왔고, 그걸로 만든 검수판이 앱 화면과 달랐다.
 *    창업자는 **앱에 없는 문체 문제**를 세 편이나 짚느라 시간을 썼다
 *    (*"다 문체이상 해요체로 바꾸기"* → *"여름꺼 3개 문체이상이야."*).
 * ⭐ 이제 앱과 «같은 모듈»을 부른다 — 흉내가 아니라 그 값 자체라 어긋날 수가 없다.
 * ⛔ **검수판·조회 도구는 반드시 이걸 쓴다. 글자로 다시 파싱하지 말 것.**
 */
export const 레시피들 = () => allBasicRecipes

const isMain = (process.argv[1] || '').endsWith('recipe.mjs')
if (!isMain) { /* import 용 */ } else {
  const 전부 = 레시피들()
  const 오늘 = todayKST()
  const 모드 = process.argv[2] || ''
  const 값 = process.argv[3] || ''

  const 한줄 = (r) => {
    const 열림 = !r.from || r.from <= 오늘
    return `${열림 ? '🔓' : '🔒'} ${r.title.padEnd(16)}`
      + ` from ${(r.from || '처음부터').padEnd(11)}`
      + ` 검수 ${(r.review || '⛔없음').padEnd(6)}`
      + ` ${r.sample ? '🏷샘플' : '     '}`
      + ` 그림 ${r.icon || '(없음)'}`
  }

  if (모드 === '--from') {
    const 것 = 전부.filter((r) => r.from === 값)
    console.log(`🍳 ${값} 에 열리는 레시피 ${것.length}편\n`)
    것.forEach((r) => console.log('  ' + 한줄(r)))
    process.exit(0)
  }
  if (모드 === '--sample') {
    const 것 = 전부.filter((r) => r.sample)
    console.log(`🏷 샘플 표시가 붙은 레시피 ${것.length}편 — ⛔여기 없는 편에 「샘플이 붙었다」고 말하지 말 것\n`)
    것.forEach((r) => console.log('  ' + 한줄(r)))
    process.exit(0)
  }
  if (모드 === '--unreviewed') {
    const 것 = 전부.filter((r) => (!r.from || r.from <= 오늘) && r.review !== '창업자')
    console.log(`⛔ 열려 있는데 창업자 검수 표시가 «없는» 편 ${것.length}편 (오늘 ${오늘})\n`)
    것.forEach((r) => console.log('  ' + 한줄(r)))
    process.exit(0)
  }
  if (!모드) {
    console.log(`🍳 레시피 ${전부.length}편 (열린 것 ${전부.filter((r) => !r.from || r.from <= 오늘).length}편)`)
    console.log('   쓰기: recipe.mjs <이름조각> | --from <날짜> | --sample | --unreviewed')
    process.exit(0)
  }

  const 찾음 = 전부.filter((r) => r.title.includes(모드) || r.id.includes(모드))
  if (!찾음.length) {
    console.log(`⛔ «${모드}» 로 찾은 레시피가 없다.`)
    console.log('   📌 「없다」가 아니라 «내가 못 찾았다» — 이름 조각을 줄여서 다시 볼 것.')
    process.exit(1)
  }
  for (const r of 찾음) {
    console.log(`\n${'─'.repeat(64)}`)
    console.log(`🍳 ${r.title}   (${r.id})`)
    console.log(한줄(r).slice(2))
    console.log(`   ${r.time}분 · ${r.servings}인분 · ${r.difficulty} · ${r.folder}`)
    console.log(`\n   재료 ${r.ingredients.filter((x) => !/^\[/.test(x)).length}줄`)
    r.ingredients.forEach((x) => console.log(`     ${/^\[/.test(x) ? x : '· ' + x}`))
    console.log(`\n   만드는 법 ${r.steps.length}걸음`)
    r.steps.forEach((s, i) => console.log(`     ${i + 1}. ${s}`))
    if (r.memo) { console.log('\n   메모'); r.memo.split('\n').filter(Boolean).forEach((p) => console.log(`     ${p}`)) }
  }
  console.log()
}
