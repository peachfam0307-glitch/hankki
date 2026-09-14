// 🔬 [일회 · 2026-08-28] 「■ 재료」 같은 «장식 붙은 섹션 헤더»가 안 걸리는지 잰다
import { parseRecipeText } from '../src/parseRecipe.js'
const 본문 = `파스타면 340g
양배추 (생략가능)
후추
1. 파스타면은 뜨거운 물에 담가주세요
2. 참나물 잎과 줄기를 나누고 줄기는 송송 썰어주세요`
for (const head of ['■ 재료 (2-3인분 기준)', '▪ 재료 (2-3인분 기준)', '재료 (2-3인분 기준)', '[재료]', '🍲소스', '소스']) {
  const r = parseRecipeText(`차돌 파스타\n${head}\n${본문}`, { fromOcr: true })
  console.log(`\n헤더 = ${JSON.stringify(head)}`)
  console.log(`   재료(${r.ingredients.length}) = ${r.ingredients.join(' | ')}`)
  console.log(`   걸음(${r.steps.length}) = ${r.steps.map((s) => s.slice(0, 22)).join(' | ')}`)
}
