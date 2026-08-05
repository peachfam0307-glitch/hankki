// 🖼 표지 아이콘 게이트 — 「하얗게 덮이는 것」과 「직접 고른 게 버려지는 것」을 막는다.
//
// 왜 있나 (2026-08-05 · 창업자 폰 캡처 · 제보 두 건)
//   ⓐ *"어두운 배경에서 이렇게 되고(음식아이콘이 하얗게 변함)"*
//      딥 배경에선 아이콘이 묻히니 뒤에 밝은 원(스포트)을 깔아 두었는데, 그 원이 **아이콘 위에** 칠해지고 있었다.
//      📌 **CSS 는 「자리를 잡은 것(position≠static)」을 「흐름 속 그림」보다 나중에 칠한다.**
//         `FoodIcon` 은 그냥 `<img>` 라 자리를 안 잡는다 → 뒤에 두려던 원이 **92% 흰 장막**이 됐다.
//         실측 = 같은 아이콘이 밝은 판에선 채도 52%, 딥플럼 위에선 **8%**(밝기 244).
//      ✅ 고침 = 스포트 `zIndex:-1` ＋ 감싸는 칸 `isolation:isolate`.
//         ⛔ **둘 중 하나만 있으면 안 된다** — `isolation` 이 없으면 `-1` 이 배경보다도 뒤로 가서 스포트가 아예 사라지고,
//            `zIndex:-1` 이 없으면 원래대로 아이콘을 덮는다.
//      ⚠️ 아이콘을 `<span>` 으로 감싸 층을 올리는 방법도 있었지만 **크기(%)가 흔들려** 안 쓴다
//         (`iconSize` 가 `'56%'` 라 감싸면 기준 상자가 바뀐다).
//
//   ⓑ *"레시피꾸미기 아이콘 변경하면 한번에 안 바뀜 … 다시 들어가면 최근목록에 있음 다시 누르면 바뀜"*
//      `EditorScreen` 이 저장할 때 **제목이 바뀌었으면 아이콘을 다시 자동 추천**했다(v8.58 · 창업자 요청).
//      그런데 그게 **직접 고른 것까지** 덮었다 → 제목을 손보는 김에 아이콘도 고르면 고른 게 버려진다.
//      두 번째엔 제목이 이미 고쳐져 있어 그대로 남는다 — 그래서 **「한 번엔 안 바뀐다」**로 보였다.
//      ✅ 고침 = `iconPicked`(사람이 직접 골랐다)를 레시피에 남기고, 그건 제목이 바뀌어도 안 덮는다.
//         자동 추천분만 다시 추천한다 → **두 제보가 둘 다 산다.**
//
// 📌 이 검사는 「글자가 있나」를 본다. 픽셀 재현판 = `scripts/_repro-icon2.mjs`
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const bad = []
const thumb = read('src/components/Thumb.jsx')
const editor = read('src/screens/EditorScreen.jsx')
const detail = read('src/screens/RecipeDetailScreen.jsx')

// ① 스포트가 아이콘 «뒤»에 있나 — 층 두 개가 짝이라 둘 다 본다
const spotLine = thumb.split('\n').find((l) => l.includes('radial-gradient') && l.includes('borderRadius'))
if (!spotLine) bad.push("Thumb.jsx — 딥 배경 스포트(밝은 원)를 못 찾았다. 지웠다면 이 검사도 같이 정리할 것")
else if (!/zIndex:\s*-1/.test(spotLine)) bad.push("Thumb.jsx — 스포트에 `zIndex: -1` 이 없다 → 아이콘을 «덮는다»(창업자 제보 2026-08-05)")
if (!/const center = \{[^\n]*isolation:\s*'isolate'/.test(thumb)) {
  bad.push("Thumb.jsx — `center` 에 `isolation: 'isolate'` 가 없다 → 스포트가 배경 뒤로 가서 «아예 안 보인다»")
}
// ⚠️ 아이콘 크기는 %다 — 감싸면 기준 상자가 바뀌어 크기가 흔들린다
if (/<span[^>]*zIndex:\s*1[^>]*>\s*<FoodIcon/.test(thumb)) {
  bad.push('Thumb.jsx — FoodIcon 을 층 올리려고 감쌌다. `iconSize` 가 %라 크기가 흔들린다(zIndex:-1 쪽으로)')
}

// ② 직접 고른 아이콘이 지켜지나 — 「표를 남기는 곳」과 「그 표를 읽는 곳」이 둘 다 있어야 한다
//    📌 하나만 있으면 «아무 말 없이» 통과한다 — 꼬리표는 읽는 쪽이 없으면 아무 일도 안 한다
if (!/setIconPicked\(true\)/.test(editor)) bad.push('EditorScreen — 아이콘 픽커가 `setIconPicked(true)` 를 안 남긴다(직접 고른 표시)')
if (!/iconPicked:\s*keepIcon\s*\?/.test(editor)) bad.push('EditorScreen — 저장 패치에 `iconPicked` 가 안 실린다(다음 편집 때 표가 사라진다)')
if (!/const keepIcon\s*=[^\n]*iconPicked/.test(editor)) bad.push('EditorScreen — 저장할 때 `iconPicked` 를 «읽지» 않는다 → 제목 바꾸면 고른 아이콘이 버려진다')
if (!/useState\(\(\)\s*=>\s*!!editing\?\.iconPicked\)/.test(editor)) bad.push('EditorScreen — 저장돼 있던 `iconPicked` 를 안 불러온다 → 다음 편집에서 또 버려진다')
if (!/iconPicked:\s*true/.test(detail)) bad.push('RecipeDetailScreen — 표지에서 고른 아이콘에 `iconPicked: true` 를 안 남긴다')

console.log('🖼 표지 아이콘 게이트\n')
if (bad.length) {
  for (const m of bad) console.log(`  ❌ ${m}`)
  console.error('\n⛔ 표지 아이콘 게이트 실패')
  console.error('   👉 재현판 = node scripts/_repro-icon2.mjs (픽셀·저장값으로 판정)')
  process.exit(1)
}
console.log('  ✅ 딥 배경 스포트가 아이콘 «뒤»에 있다 (zIndex:-1 ＋ isolation)')
console.log('  ✅ 직접 고른 아이콘이 제목 변경에도 지켜진다 (iconPicked · 남기는 곳 3 · 읽는 곳 2)')
console.log('\n✅ 표지 아이콘 게이트 통과\n')
