// 🕳🕳 레시피에 «화면이 한 번도 안 읽는 칸»이 있으면 배포를 막는다 (2026-09-14 신설)
//
// 📮 창업자 = *"그게 가능해?? 메모는 기본으로 붙어야할텐데"* ＋ *"이거 중요한거야 꼭!! 반영해."*
//
// ⛔⛔ **무슨 일이 났나** — 레시피에 「메모」를 적는 칸 이름이 «정해진 데가 없어서»
//    내가 `memo` 로도 쓰고 `notes` 로도 썼다. 화면은 `memo` 만 읽는다.
//    🔢 실측 = **16편의 메모가 통째로 안 보이고 있었다** (2026-09-13 부터).
//       전부 창업자가 «직접 써서 준» 최근 레시피였다 —
//       견과류 멸치볶음의 *"올리고당은 맨 마지막에 넣고 불을 바로 꺼요"*,
//       대패삼겹살 김치 솥밥의 *"아이가 먹을 거면 김치를 씻어서 써요"* 같은,
//       **요리를 좌우하는 말인데 유저가 한 줄도 못 봤다.**
//
// ⭐⭐ **숫자를 넓히는 고침이 아니다 — 실패의 «모양»을 바꾼다**(절대원칙 34).
//    옛 모양 = 「칸 이름을 잘못 써도 조용히 안 뜬다」 → 새 모양 = **「그 자리에서 배포가 죽는다」**
//
// ⛔ 「일부러 내부용인 칸」은 아래 허용 목록에 **왜 그런지 적고** 넣는다.
//    적지 않고 늘리면 이 게이트가 죽는다(시끄러운 게이트가 아니라 «비어 버린» 게이트가 된다).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))

// 🔓 화면이 «안 읽어도 되는» 칸 — 우리 도구만 읽는다
const 내부용 = {
  review: '검수 표시 — release-prep·release-calendar 가 읽는다(유저에겐 안 보이는 게 맞다)',
  물어볼것: '창업자에게 물어볼 것 — 검수판과 recipe.mjs 가 ❓ 로 띄운다',
  origin: '출처 표시 — check-origin 이 읽는다',
  sourceName: '출처 이름 — 화면이 sourceUrl 과 함께 쓴다',
}
// 👀 유저 화면을 그리는 파일들 — 여기서 한 번도 안 읽히면 그 칸은 «죽은 칸»이다
const 화면파일 = [
  'src/screens/RecipeDetailScreen.jsx', 'src/screens/CookScreen.jsx', 'src/screens/EditorScreen.jsx',
  'src/screens/MyRecipesScreen.jsx', 'src/screens/InboxScreen.jsx', 'src/screens/DiaryScreen.jsx',
  'src/App.jsx', 'src/store.jsx', 'src/retidy.js', 'src/shareIcon.js', 'src/parseRecipe.js',
  'src/components/FoodIcon.jsx', 'src/components/ShareDrawCard.jsx',
]

const { allBasicRecipes } = await import(join(R, 'src/data/basics.js'))
let 화면 = ''
for (const p of 화면파일) { try { 화면 += readFileSync(join(R, p), 'utf8') } catch { /* 파일이 없으면 건너뛴다 */ } }
// ⛔ 파일을 하나도 못 읽었으면 «모든 칸이 죽은 칸»으로 보인다 — 그건 가짜 빨간불이다
if (화면.length < 10000) { console.error('⛔ 화면 파일을 못 읽었다 — 경로를 확인할 것'); process.exit(1) }

const 칸 = new Set()
for (const r of allBasicRecipes) Object.keys(r).forEach((k) => 칸.add(k))
const 죽은 = []
for (const k of 칸) {
  if (내부용[k]) continue
  // `.memo` · `['memo']` · `"memo"` · `memo:` 어느 모양으로든 읽으면 산 칸이다
  if (new RegExp('[.\\["\']' + k + '\\b').test(화면)) continue
  죽은.push([k, allBasicRecipes.filter((r) => r[k] !== undefined).length])
}
if (죽은.length) {
  console.error('\n⛔⛔ 레시피에 «화면이 한 번도 안 읽는 칸»이 있다 — 적어도 유저는 못 본다.\n')
  for (const [k, n] of 죽은) {
    console.error(`   ⛔ ${k}   ${n}편`)
    console.error(`      · 이름을 잘못 썼으면 → 화면이 읽는 이름으로 고친다 (메모는 «memo» 다)`)
    console.error(`      · 일부러 내부용이면 → scripts/check-deadfield.mjs 의 «내부용» 에 «왜 그런지 적고» 넣는다`)
  }
  console.error('\n📌 2026-09-13~14 에 실제로 이 구멍으로 16편의 메모가 통째로 안 보였다.\n')
  process.exit(1)
}
console.log(`[deadfield] ✅ 레시피가 쓰는 칸 ${칸.size}개 — 죽은 칸 0 (내부용 ${Object.keys(내부용).length}개는 허용)`)
