// 📊 재현판 — 표로 적힌 재료 「당면 | 물 250ml」(OCR 이 | 를 I·l 로 읽음)이 «한 재료»로 붙던 것 (2026-09-14 · 창업자 찜닭 실물)
//   📮 창업자 = "당면 물이 당면 I 물250 이렇게 된 원문이더라고" → 앱 = 「당면 물 250ml」＋「물 250ml」 중복 · 「진간장 4 설탕 2」
import { parseRecipeText } from '../src/parseRecipe.js'
let fail = 0
const ing = (글) => parseRecipeText(글, { fromOcr: true }).ingredients
const check = (이름, 조건, 실제) => { if (!조건) { fail++; console.log('❌', 이름, JSON.stringify(실제)) } else console.log('✅', 이름) }

// ① 세로줄 셋(| · I · l) 모두 두 칸으로 갈린다
for (const sep of ['|', 'I', 'l']) {
  const r = ing(`재료\n닭다리살 500g\n당면 ${sep} 물 250ml\n진간장 4 ${sep} 설탕 2\n`)
  check(`① 「${sep}」 = 다섯 재료`, r.length === 5 && r.includes('당면') && r.includes('물 250ml') && r.includes('진간장 4') && r.includes('설탕 2'), r)
  check(`① 「${sep}」 붙은 재료 없음`, !r.some((x) => /당면 물|진간장 4 설탕/.test(x)), r)
}
// ② 「물 1 l」 의 l 은 리터 — 안 쪼갠다
{ const r = ing('재료\n물 1 l\n소금 1t\n'); check('② 물 1 l 그대로', r.some((x) => /^물 1 ?l$/i.test(x)) && !r.includes('물 1'), r) }
// ③ 조리 문장 속 낱자(30자 넘음)는 안 건드린다
{ const r = parseRecipeText('재료\n양파 1개\n\n만드는 법\n1. 양파를 볶다가 I 물을 붓고 뚜껑을 덮은 뒤 중불에서 십 분간 끓여 주세요.\n', { fromOcr: true }); check('③ 긴 걸음은 그대로 한 걸음', r.steps.length === 1, r.steps) }
// ④ 분량이 하나도 없는 두 낱말(「양파 I 대파」)은 표로 안 본다 → 예전 그대로(안 죽으면 됨)
{ const r = ing('재료\n양파 1개\n양파 I 대파\n'); check('④ 분량 없는 줄은 예외 없이 처리됨', Array.isArray(r), r) }
// ⑤ 표 머리 「재료 | 분량」 뒤 줄들이 재료로 담긴다
{ const r = ing('재료 | 분량\n닭다리살 | 500g\n양파 | 1개\n'); check('⑤ 표 머리 뒤 재료 담김(2개 이상)', r.length >= 2, r) }

if (fail) { console.log(`\n❌ ${fail}칸 실패`); process.exit(1) }
console.log('\n✅ 표 재료 재현판 전부 통과')
