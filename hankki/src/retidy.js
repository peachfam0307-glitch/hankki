// 🤖🗃 「AI 가 «나중에» 읽어 준 것을 레시피에 어떻게 얹나」 — ⭐이 저장소에서 «여기 한 곳»뿐이다 (2026-09-05)
//
// 📮 창업자 확정 = *"보관함은 **ai가 읽어서 성공했을때만 옮기고**, ai가 실패해서 기본규칙이 적용되면 그대로 남게 하자."*
// 📮 창업자 = *"보관함에 「AI로 다듬기」 단추 ㄱㄱ"*
//
// ⛔⛔ 왜 한 곳인가 = 이 «얹는 규칙»을 쓰는 자리가 둘이 됐다 —
//    ① 상세 화면이 «저절로» 만회할 때(`RecipeDetailScreen`)  ② 임시보관함에서 유저가 «단추를 눌러» 다듬을 때(`InboxScreen`)
//    둘이 따로 복사하면 **갈리는 순간 「눌러서는 되는데 열어서는 안 되는」 상태**가 된다
//    (`store.jsx` 의 `다읽었나()` 를 한 곳으로 모은 것과 같은 이유 · 2026-09-02 사고).
//
// 규칙 (전부 실물 사고에서 나온 것)
//   · 아직 임시보관함(unsorted) = 유저가 손댄 적이 없다 → **AI 것으로 통째로**(재료·걸음) ＋ 졸업
//     ⛔ 안 그러면 장사말 판(「계속됩니다.. 커밍쑨」·팬 광고문)이 그대로 졸업한다(9/05 헤드리스 실측)
//   · 이미 졸업한 편 = 유저가 봤을 수 있다 → **빈 칸만**(자리표 제목 · 0줄 재료) · ⛔걸음은 안 건드린다
//   · 제목 = 유저가 «준» 것은 지킨다. 자리표거나 «파서가 붙인 것»(같은 원문을 파서에 넣으면 나오는 제목)일 때만 AI 제목
//   · 표지 아이콘 = 제목이 정해지면 `공유아이콘` 잣대로(직접 고른 건 안 덮는다 · App.jsx 채우기와 같다)
//   · ⛔ 올리기만 한다 — 이미 sorted 인 것을 내리지 않는다
//
// 🔒 `_repro-보관함AI대기-0905.mjs` 가 이 파일을 두 화면이 «같이» 쓰는지 잰다.
import { parseRecipeText, 자리표제목 } from './parseRecipe'
import { mergeTidy } from './tidy'
import { 공유아이콘 } from './shareIcon'
import { guessFoodIconStrict } from './components/FoodIcon'
import { 다읽었나 } from './store'

/** AI 답(`tidyRecipe` 결과)을 레시피 r 에 얹을 «바꿀 값»을 만든다. r 은 안 건드린다. */
export function 만회값(r, 원문, ai) {
  const 기본 = parseRecipeText(원문, { fromOcr: true })
  const m = mergeTidy(기본, ai)
  const 자리표 = 자리표제목(r.title)
  const 재료없다 = !(r.ingredients || []).length
  const 아직보관함 = r.status !== 'sorted'
  const 파서제목이다 = !!r.title && r.title === 기본.title
  const 새제목 = (자리표 || 파서제목이다) && m.title ? m.title : r.title
  const 새아이콘 = 아직보관함 ? 공유아이콘(r, 새제목, guessFoodIconStrict) : null
  const 바꿀것 = 아직보관함
    ? {
      tidyFail: 0,
      ...(새제목 !== r.title ? { title: 새제목 } : {}),
      ingredients: m.ingredients, steps: m.steps,
      ...(새아이콘 ? { icon: 새아이콘, iconPicked: false } : {}),
    }
    : {
      tidyFail: 0,
      ...(자리표 && m.title ? { title: m.title } : {}),
      ...(재료없다 && m.ingredients.length ? { ingredients: m.ingredients } : {}),
    }
  // 🎓 졸업은 «바뀐 뒤의 값»으로 판정 · 올리기만 한다
  if (아직보관함 && 다읽었나({ ...r, ...바꿀것 })) 바꿀것.status = 'sorted'
  return { 바꿀것, 바뀐게있나: 아직보관함 || 자리표 || 재료없다 }
}
