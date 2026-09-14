// 🔬 [일회 · 2026-08-28] 확정 실험 — mergeWrappedLines 의 bare 벗기기 목록에 「■」가 없다.
//    앞줄이 «이어지는 중»(…고)일 때, 헤더에 ■ 가 붙어 있으면 SEC_ING 방어막을 못 넘어 «합쳐진다».
import { parseRecipeText } from '../src/parseRecipe.js'
const 앞 = `남편이 오늘도 또 해먹자고\n\n`
const 뒤 = `\n파스타면 340g\n차돌박이 300g\n후추\n\n1. 파스타면을 담가주세요`
for (const head of ['■ 재료 (2-3인분 기준)', '▪ 재료 (2-3인분 기준)', '• 재료 (2-3인분 기준)', '재료 (2-3인분 기준)']) {
  const r = parseRecipeText(앞 + head + 뒤, { fromOcr: true })
  console.log(`헤더 ${JSON.stringify(head.slice(0, 3))} …`)
  console.log(`   재료(${r.ingredients.length}) = ${r.ingredients.join(' / ') || '(없음)'}`)
  console.log(`   걸음 = ${r.steps.join(' / ') || '(없음)'}\n`)
}
