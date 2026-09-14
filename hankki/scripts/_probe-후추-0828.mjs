// 🔬 [일회 · 2026-08-28] 「후추」가 어디서 사라지나 — 입력을 조금씩 늘려 좁힌다
import { parseRecipeText } from '../src/parseRecipe.js'
const 판 = [
  ['① 소스 절만', `소스\n다진마늘 1T\n참치액 2T\n후추`],
  ['② ＋다음 줄(주석)', `소스\n다진마늘 1T\n참치액 2T\n후추\n*매운거 좋아하심 페퍼론치노 추가`],
  ['③ 후추만 홀로', `차돌 파스타\n재료\n참치액 2T\n후추`],
  ['④ 후추 뒤에 빈 줄', `차돌 파스타\n재료\n참치액 2T\n후추\n\n1. 볶아주세요`],
  ['⑤ 후추 → 소금', `소스\n다진마늘 1T\n참치액 2T\n소금\n*매운거 좋아하심 페퍼론치노 추가`],
]
for (const [이름, 글] of 판) {
  const r = parseRecipeText(글, { fromOcr: true })
  console.log(`${이름}\n   재료 = ${r.ingredients.join(' | ') || '(없음)'}\n   걸음 = ${r.steps.join(' | ') || '(없음)'}\n   메모 = ${r.memo || '(없음)'}\n`)
}
