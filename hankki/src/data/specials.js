// 🌕 「특집」 — 홈에 «한 줄»로 뜨는 제철·명절 모음 (2026-09-13)
//
// 📮 창업자 = *"추석특집을 띄우면 좋지 스크롤로 쭉 볼수있게"*
//
// ⭐⭐ **「이달의 레꾸」와 «같은 부품»이다** — 둘 다 「가로로 미는 한 줄」이다.
//    그래서 화면 부품(`Strip`)은 하나만 만들고, 여기선 «무엇을 실을지»만 정한다.
//
// ⛔⛔ 설계 관문(`design-gate`)에서 «고칠 것» 셋이 나왔고 전부 여기 반영했다:
//    ① 👤사람 — 명절 요리를 안 하는 사람에겐 이 줄이 «홈 자리를 먹는다»
//              → `until` 을 «반드시» 짝으로 둔다. 날짜가 지나면 스스로 사라진다.
//    ② 💥사고 — ⓐ편이 0개면 «빈 줄»이 뜬다 → 비면 아예 안 그린다(whatsnew 와 같은 방식)
//              ⓑ아이콘 없는 편이 섞이면 «빈칸»이 뜬다 → 아이콘이 붙는 편만 싣는다
//    ③ 📈규모 — 특집이 1년에 12개 쌓이면 홈에 여러 줄이 «동시에» 뜬다
//              → `now()` 는 **한 번에 하나**만 돌려준다(제일 먼저 끝나는 것).
//
// 🔢 왜 만드나 (실측) — 명절스러운 편이 **13편** 있는데 «검색해야» 나온다.
//    2026-09-13 인스타 광고 실측 = 「꾸민 결과물」 1,562 vs 「기능 목록」 29·1 = **54배**.
//    ⭐ 앱 «안»에서도 같다 — 있는 걸 «보여줘야» 쓴다.
import { todayKST } from '../today.js'

/**
 * 📅 특집 목록 — ⛔ `from`·`until` 을 «둘 다» 적는다. until 이 없으면 영영 안 사라진다.
 *    ids  : 실을 레시피 id (⛔없는 id 는 저절로 걸러진다)
 *    ⭐ 순서가 곧 화면 순서다.
 */
export const SPECIALS = [
  {
    key: 'chuseok26',
    label: '추석 특집',
    sub: '미리 해두면 그날이 편해요',
    from: '2026-09-14',
    until: '2026-09-27',      // 연휴 마지막 날(9/27)까지. 그 뒤엔 「남은 음식」 주차가 받는다
    ids: [
      // ⛔ [2026-09-13] 처음에 id 를 «지어냈다»(galbijjim-spicy 등) — 셋 다 안 붙어서 빈 줄이 됐다.
      //    ⭐ id 는 반드시 `recipe.mjs` 로 «읽어서» 적는다. 기억으로 적지 않는다(규칙 29).
      //
      // 🎨 **순서는 «갈래와 색»을 번갈아 놓는다** (2026-09-13)
      //    ⛔ 처음엔 갈비 셋을 나란히 뒀는데 **시안에서 «거의 같은 그림»으로 보였다** —
      //       갈색 조림이 연속이면 미는 손이 거기서 멈춘다.
      //    ⭐ 그래서 전 → 갈비 → 전 → 면 → 전 → 갈비 로 갈아 놓는다.
      //       ＋ 새로 나온 두 편(꼬치전·새우관자전)을 앞·가운데에 둔다.
      'basic-nokkochi-jeon',        // 🍢 꼬치 없는 꼬치전 (9/16 · 새것 · 알록달록)
      'basic-soonsal-galbijjim',    // 🥩 초간단 순살 갈비찜 35분 (갈비 중 제일 쉬운 것)
      'basic-kkaennip-jeon',        // 🌿 깻잎전 (초록)
      'basic-japchae',              // 🍜 잡채 (면)
      'basic-saeu-gwanja-jeon',     // 🦐 새우관자전 (9/16 · 새것 · 흰색)
      'basic-maeun-galbijjim',      // 🌶 매운 소갈비찜 70분 (빨강)
      'basic-tteokgalbi',           // 🍖 수제 떡갈비 30분
    ],
  },
]

/**
 * 🎯 지금 띄울 특집 «하나» — 없으면 null.
 * ⛔ 여럿이 겹쳐도 **하나만** 돌려준다(제일 먼저 끝나는 것) — 홈이 무거워지지 않게.
 */
export const nowSpecial = (today = todayKST()) => {
  const 산것 = SPECIALS.filter((s) => s.from <= today && today <= s.until)
  if (!산것.length) return null
  return 산것.sort((a, b) => a.until.localeCompare(b.until))[0]
}

/**
 * 🍱 그 특집에 «실제로 실릴» 편 — 아직 안 열렸거나 그림이 없는 편은 뺀다.
 * ⛔ 여기서 안 거르면 화면에 «빈칸»이 뜬다.
 * @param 편들 `allBasicRecipes` 또는 `basicRecipes`
 */
export const specialRecipes = (편들 = [], today = todayKST()) => {
  const s = nowSpecial(today)
  if (!s) return []
  const 표 = new Map(편들.map((r) => [r.id, r]))
  return s.ids
    .map((id) => 표.get(id))
    .filter((r) => r && (!r.from || r.from <= today))   // 아직 안 열린 편은 뺀다
}
