// 🔬 [일회 · 2026-08-28] 가설: mergeWrappedLines 가 «빈 줄»을 안 보고 넘어가 문단을 합친다.
//    인스타 캡션에서 빈 줄은 «문단 나눔»이라 합치면 안 되는 자리다.
import { parseRecipeText } from '../src/parseRecipe.js'
const 판 = [
  ['① 빈 줄 «있음»(실물 그대로)', `남편이 오늘도 또 해먹자고\n\n재료 (2-3인분 기준)\n파스타면 340g\n후추`],
  ['② 빈 줄 «없음»',            `남편이 오늘도 또 해먹자고\n재료 (2-3인분 기준)\n파스타면 340g\n후추`],
  ['③ 앞줄이 마침표로 끝남',      `남편이 오늘도 또 해먹자고.\n\n재료 (2-3인분 기준)\n파스타면 340g\n후추`],
]
for (const [이름, 글] of 판) {
  const r = parseRecipeText(글, { fromOcr: true })
  console.log(`${이름}`)
  console.log(`   제목 = ${JSON.stringify(r.title)}`)
  console.log(`   재료 = ${r.ingredients.join(' / ') || '(없음)'}`)
  console.log(`   걸음 = ${r.steps.join(' / ') || '(없음)'}\n`)
}
