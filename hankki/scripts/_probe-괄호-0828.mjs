// 🔬 [일회 · 2026-08-28] 「(인덕션 8사용)」이 어디로 가나 — 회귀 원인 찾기
import { parseRecipeText } from '../src/parseRecipe.js'
const 글 = `삼계탕
[만드는 법]
웍에 불려둔 찹쌀을 깔고 닭다리 한팩을 키친타월로 꼼꼼하게 닦아주세요.
저희집 남편이랑 애들은 퍽퍽살을 싫어해서 요렇게 만들어 주니깐 너무 잘먹고 맛있더라구요.
물 600ml를 붓고 중강불에서 먼저 끓여줍니다.
(인덕션 8사용)
물이 끓어오르면 중불로 낮추고 40분간 폭 끓여주시면 끝이에요.`
const r = parseRecipeText(글, { fromOcr: true })
console.log(`제목 = ${JSON.stringify(r.title)}`)
r.steps.forEach((s, i) => console.log(`걸음 ${i + 1}. ${s}`))
console.log(`메모 = ${JSON.stringify(r.memo)}`)
console.log(`재료 = ${JSON.stringify(r.ingredients)}`)
