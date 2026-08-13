// ✂️ 「반쪽 해요체」 검사 — 한 줄 «안»에 한다체와 해요체가 섞인 것을 잡는다
//
// ⛔ 왜 있나 (2026-08-13)
//   꼬들단무지 무침 순서 1을 「…그대로 쓴다. 씻지도, 물기를 빼지도 않는다.」로 썼더니
//   앱엔 **「…그대로 쓴다. 씻지도, 물기를 빼지도 않아요.」** 로 나왔다.
//   `polish.js` 사전에 「쓴다」가 없어서 앞 문장만 그대로 남은 것이다.
//
// ⭐⭐ `check-steps` 는 이걸 «통과시킨다» — 줄 «끝»만 보기 때문이다.
//    끝이 「않아요」라 해요체로 판정된다. 문장이 둘인 줄은 앞쪽이 조용히 샌다.
//    📌 「끝이 맞나」와 「전부 맞나」는 다른 말이다.
//
// ⚠️ 그리고 `check-steps` 는 `basicRecipes`(오늘 열린 것)만 본다.
//    여기서는 **`allBasicRecipes`(날짜로 잠긴 주간 레시피까지 전부)** 를 본다 —
//    새로 쓰는 레시피는 거의 다 잠겨 있어서, 안 그러면 새 글이 검사 밖에 있다.
import { allBasicRecipes } from '../src/data/basics.js'
import { politeSteps } from '../src/polish.js'

// 「…다. 」·「…까. 」 처럼 «문장 중간»에서 한다체로 끝난 자리
const 중간한다체 = /(다|까)\.\s/

const bad = []
for (const r of allBasicRecipes) {
  for (const [i, s] of (r.steps || []).entries()) {
    const out = politeSteps([s])[0]
    if (중간한다체.test(out) && /요[.!]?\s*$/.test(out)) bad.push({ title: r.title, no: i + 1, out })
  }
}

if (bad.length) {
  console.error(`\n⛔ 한 줄 «안»에 한다체가 남은 곳 ${bad.length}줄 — 앞 문장만 안 바뀌었다.\n`)
  for (const b of bad) console.error(`   ${b.title} (${b.no})  ${b.out}`)
  console.error(`\n👉 고치는 법 두 가지`)
  // ⚠️ 여기에 백틱을 쓰면 템플릿 문자열이 끊긴다(CLAUDE.md 함정) — 낫표로 쓴다
  console.error(`   ⓐ 「src/polish.js」 의 ENDINGS 에 그 동사를 넣는다 — 예) ['쓴다', '써요']`)
  console.error(`   ⓑ 사전에 «있는» 동사로 문장을 고쳐 쓴다 — 예) 「쓴다」 → 「넣는다」`)
  console.error(`   ⛔ 한 줄에 문장을 둘 넣을 땐 «둘 다» 바뀌는지 확인할 것.\n`)
  process.exit(1)
}

console.log(`✅ 반쪽 해요체 — 레시피 ${allBasicRecipes.length}편(잠긴 것 포함) · 섞인 줄 0`)
