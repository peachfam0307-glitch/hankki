// 🔒🔒 «레시피에 박아 둔 icon» 이 «규칙이 고를 컷» 을 막고 있나
//
//   📮 창업자 *"또 왜 꼬였지.. 이해가 안되네"*
//
// ⭐⭐ **이게 「왜 꼬였나」의 답이다.**  `Thumb.jsx:93` = `recipe.icon || guessFoodIcon(recipe.title)`
//    → **`icon:` 이 박혀 있으면 `ICON_RULES` 를 «아예 안 본다».**
//    창업자가 새 컷을 줘서 앱에 넣고 `ICON_RULES` 까지 맞게 고쳤는데,
//    레시피마다 **옛날에 손으로 박아 둔 `icon:`** 이 그 앞을 막아 새 컷이 안 뜬다.
//    📌 그림도 있고 규칙도 맞는데 **박힌 값 하나가 다 덮는다.**
//
// 이 검사가 세는 것 = 「박힌 값 ≠ 규칙값」인 편. 그게 곧 「막힌 자리」다.
import { readFileSync, existsSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const R = (p) => readFileSync(new URL(p, 뿌리), 'utf8')
const src = R('src/components/FoodIcon.jsx')

const 본문 = src.slice(src.indexOf('const ICON_RULES = ['))
const 규칙 = [...본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 100) { console.error(`⛔ ICON_RULES 를 ${규칙.length}개밖에 못 읽었다`); process.exit(1) }
const 고르기 = (t) => 규칙.find((r) => r.keys.some((k) => t.includes(k)))?.key || 'default'

// 규칙 12 — 검사가 맞게 재는지 먼저 본다
for (const [t, 기대] of [['나시고랭', 'fe_115'], ['연근조림', 'fe_105'], ['깻잎장아찌', 'fe_194']])
  if (고르기(t) !== 기대) { console.error(`⛔ 검사가 틀렸다 — 「${t}」 → ${고르기(t)}, 기대 ${기대}`); process.exit(1) }

const 사진 = (k) => ['src/assets/stickers/photo', 'src/assets/stickers/ing']
  .some((d) => existsSync(new URL(`${d}/${k}.png`, 뿌리)))

const bs = R('src/data/basics.js')
const 편 = []
for (const m of bs.matchAll(/id:\s*'([^']+)',\s*\n?\s*title:\s*'([^']+)'([^\n]*)\n(?:[^\n]*\n){0,6}?\s*icon:\s*'([^']+)'/g))
  편.push({ id: m[1], 제목: m[2], 박힌: m[4], 잠금: /from:/.test(m[3]) })

const 막힘 = [], 없음 = [], 같음 = []
for (const r of 편) {
  const 규 = 고르기(r.제목)
  if (!사진(r.박힌)) 없음.push({ ...r, 규 })
  else if (규 !== 'default' && 규 !== r.박힌 && 사진(규)) 막힘.push({ ...r, 규 })
  else 같음.push(r)
}

console.log(`\n🔒 레시피 ${편.length}편 — 박아 둔 icon 이 규칙을 막고 있나\n`)
console.log(`  ⛔ 규칙엔 «맞는 컷»이 있는데 박힌 값이 막는다 : ${막힘.length}편`)
console.log(`  ⛔ 박힌 값에 그림이 아예 없다(도형으로 나감)   : ${없음.length}편`)
console.log(`  ✅ 박힌 값 = 규칙값 (또는 규칙에 없음)        : ${같음.length}편\n`)

if (막힘.length) {
  console.log('── ⛔ 막힌 자리 — 박힌 값을 지우기만 하면 규칙이 «맞는 컷»을 고른다 ──')
  console.log(`  ${'레시피'.padEnd(20)} ${'지금'.padEnd(10)} → ${'규칙이 고를 컷'}`)
  for (const r of 막힘) console.log(`  ${r.제목.padEnd(20)} ${r.박힌.padEnd(10)} → ${r.규}  ${r.잠금 ? '🔒' : ''}`)
}
if (없음.length) {
  console.log('\n── ⛔ 그림이 아예 없어 «도형»으로 나가는 편 ──')
  for (const r of 없음)
    console.log(`  ${r.제목.padEnd(20)} ${r.박힌.padEnd(12)} 규칙값 ${r.규}${사진(r.규) ? ' ✅사진있음' : ' ⛔사진없음'}`)
}
