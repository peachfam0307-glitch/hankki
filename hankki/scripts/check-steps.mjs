// 만드는 법이 «해요체»로 나가는지 검사한다 — 한다체가 남으면 배포를 막는다.
//
// 왜 있나 (2026-08-02): 창업자가 *"우리 요리레시피 한다체 안쓰지 않아?"* 라고 물어서 세어 보니
//   앱에 나가는 순서 **22줄이 한다체 그대로**였다. 전부 옛 레시피였다 — 매운 소갈비찜·버섯 솥밥·
//   불닭냉면·비프페퍼라이스… 아무도 몰랐다.
//
// 뿌리 = `polish.js` 는 «사전에 있는 어미만» 바꾸고, 모르는 동사는 조용히 지나간다.
//   (그 설계 자체는 옳다 — 틀리게 바꾸는 것보다 안 바꾸는 게 낫다.)
//   문제는 **빠진 걸 알려주는 사람이 없었다**는 것. 그래서 여기서 잡는다.
//
// ⛔ 새 레시피를 쓸 때 낯선 동사로 끝내면 여기서 걸린다 → `src/polish.js` ENDINGS 에 한 줄 추가.
import { basicRecipes } from '../src/data/basics.js'

const bad = []
for (const r of basicRecipes) {
  for (const [i, s] of (r.steps || []).entries()) {
    if (/다[.!]?$/.test(String(s).trim())) bad.push({ title: r.title, no: i + 1, step: s })
  }
}

if (bad.length) {
  console.error(`\n⛔ 만드는 법에 «한다체»가 ${bad.length}줄 남았다 — 앱엔 해요체로 나가야 한다.\n`)
  for (const b of bad) console.error(`   ${b.title} (${b.no})  ${b.step}`)
  console.error(`\n👉 고치는 법: src/polish.js 의 ENDINGS 에 [한다체, 해요체] 한 줄 추가.`)
  console.error(`   예) ['달군다', '달궈요']  ← 긴 어미를 «위»에 둔다(구체적인 게 먼저 걸려야 한다).\n`)
  process.exit(1)
}

console.log(`✅ 만드는 법 문체 통일 — 레시피 ${basicRecipes.length}개, 한다체 0줄`)
