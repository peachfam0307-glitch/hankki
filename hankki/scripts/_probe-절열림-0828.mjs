// 🔬 [일회 · 2026-08-28] 「재료 절」이 실제로 열리나 — 분량 없는 재료(후추) 하나로 잰다
import { parseRecipeText } from '../src/parseRecipe.js'
const 판 = [
  ['① 인사말 없음 ＋ ■ 헤더', `■ 재료 (2-3인분 기준)\n후추`],
  ['② 인사말 없음 ＋ 민 헤더', `재료 (2-3인분 기준)\n후추`],
  ['③ 인사말 있음 ＋ ■ 헤더', `차돌 느끼함도 싹 잡아줘서 더 맛있어요\n남편이 오늘도 또 해먹자고\n\n■ 재료 (2-3인분 기준)\n후추`],
  ['④ 인사말 있음 ＋ 민 헤더', `차돌 느끼함도 싹 잡아줘서 더 맛있어요\n남편이 오늘도 또 해먹자고\n\n재료 (2-3인분 기준)\n후추`],
  ['⑤ ③ ＋ 짧은 헤더(■ 재료)', `차돌 느끼함도 싹 잡아줘서 더 맛있어요\n남편이 오늘도 또 해먹자고\n\n■ 재료\n후추`],
]
for (const [이름, 글] of 판) {
  const r = parseRecipeText(글, { fromOcr: true })
  console.log(`${r.ingredients.some((x) => /^후추/.test(x)) ? '✅' : '⛔'} ${이름}`)
  console.log(`      제목=${JSON.stringify(r.title)} 재료=[${r.ingredients.join(' / ')}] 걸음=[${r.steps.join(' / ')}]`)
}
