// 🚪🚪 「사진에서 글자를 읽는 문」에 «전부» AI 다듬기가 붙었나 — 배포 게이트 (2026-08-29)
//
// ⛔⛔⛔ **이 검사가 태어난 사고 (2026-08-29 아침)**
//   AI 다듬기를 만들어 배포했는데 **창업자 폰에서 워커가 한 번도 안 불렸다**
//   (Cloudflare 대시보드 실측 = `Invocations 3` · `CPU Time 569μs` — AI 를 부르면 나올 수 없는 값).
//
//   뿌리 = **`ocrImage()` 를 부르는 곳이 «셋»인데 «한 곳»에만 AI 를 붙였다.**
//     ① `EditorScreen.jsx`  편집 화면 캡처 단추      ← 여기만 붙였다
//     ② `App.jsx`           공유받기 · 갤러리 사진   ← ⛔**창업자가 실제로 쓰는 문인데 안 붙였다**
//     ③ `PantryView.jsx`    냉장고 영수증           ← 여긴 안 붙이는 게 맞다(레시피가 아니다)
//
//   ⛔⛔ **그때 재현판 16칸이 «전부 초록불»이었다.** 검사가 ①만 봤기 때문이다.
//      📌 규칙 18 ⓘ — **「검사가 있다」와 「검사가 «전부»를 본다」는 다른 말이다.**
//      우리는 이 모양을 이미 두 번 겪었다 = v11.00 한살림(새는 자리가 넷) · v10.96 재료 아이콘(절반만 연결).
//
// ⭐⭐ **그래서 이 검사는 「붙인 자리」를 보지 않는다 — 「문이 몇 개인가」부터 센다.**
//   `src/` 를 훑어 `ocrImage(` 를 부르는 파일을 «전부» 찾고,
//   그중 `tidyRecipe` 가 없는 파일은 **아래 예외 목록에 «이유»가 적혀 있어야** 통과한다.
//   → 나중에 문이 하나 더 생겨도 **반드시 판단하게 된다**(모르는 문은 배포를 막는다).
//
// ⚠️ **정직하게 — 이 검사가 «못» 보는 것**
//   「부르긴 하는데 결과를 안 쓴다」는 소스로 못 잡는다.
//   그 자리는 `_repro-AI다듬기-0829.mjs` 가 «실제로 실행해서» 잡는다(둘이 짝이다).
//
// 실행: node scripts/check-ai붙었나.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

// ⛔ 예외 = 「사진을 읽지만 AI 다듬기를 «일부러» 안 쓰는 곳」. 이유를 «반드시» 적는다.
//   ⭐ 여기에 줄을 더할 땐 「왜 레시피가 아닌가」를 쓴다. 못 쓰겠으면 그건 붙여야 하는 문이다.
const 예외 = {
  'components/PantryView.jsx':
    '냉장고 영수증 = 재료 목록이라 AI 지시(레시피 정리)가 안 맞는다. 붙이면 오히려 나빠진다.',
}

function 파일들(dir) {
  const out = []
  for (const 이름 of readdirSync(dir)) {
    const p = join(dir, 이름)
    if (statSync(p).isDirectory()) out.push(...파일들(p))
    else if (/\.(jsx?|mjs)$/.test(이름)) out.push(p)
  }
  return out
}

let 실패 = 0
const 문들 = []

for (const p of 파일들(SRC)) {
  const 상대 = p.slice(SRC.length + 1)
  if (상대 === 'ocr.js' || 상대 === 'tidy.js') continue // 읽는 쪽·다듬는 쪽 «본체»
  const src = readFileSync(p, 'utf8')
  // ⛔ 주석을 걷어내고 본다 — 주석에 적어둔 설명(`ocrImage()` 를 부르는 곳은 셋)이 걸린다.
  //   📌 이 함정을 2026-08-29 재현판에서 이미 한 번 밟았다(규칙 18 ⓘ).
  const 코드만 = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  if (!/\bocrImage\s*\(/.test(코드만)) continue
  문들.push({ 상대, 붙음: /\btidyRecipe\s*\(/.test(코드만) })
}

console.log(`\n🚪 사진에서 글자를 읽는 문 = ${문들.length}개\n`)

for (const { 상대, 붙음 } of 문들) {
  if (붙음) { console.log(`  ✅ ${상대}  — AI 다듬기 붙음`); continue }
  const 이유 = 예외[상대]
  if (이유) { console.log(`  ⏭ ${상대}  — 일부러 안 붙임: ${이유}`); continue }
  console.log(`  ❌ ${상대}  — ⛔ 사진을 읽는데 AI 다듬기가 «없다»`)
  console.log('       👉 「tidyRecipe」 를 붙이거나, 안 붙이는 «이유»를 이 파일 「예외」에 적는다.')
  실패++
}

// ⛔ 문이 하나도 안 잡히면 그건 「다 붙었다」가 아니라 «검사가 죽은 것»이다.
//   📌 2026-08-24 사고 — 화면에 못 갔는데 「옛 이름이 없다」가 초록불이었다(아무것도 안 쟀다).
if (문들.length < 2) {
  console.log(`\n⛔ 문이 ${문들.length}개밖에 안 잡혔다 — 검사가 «아무것도 안 보고» 있다. 잣대를 고쳐야 한다.`)
  실패++
}

// ⭐ 얹는 규칙이 «한 곳»인가 — 복붙하면 두 경로가 조용히 갈린다
const tidySrc = readFileSync(join(SRC, 'tidy.js'), 'utf8')
if (!/export function mergeTidy\s*\(/.test(tidySrc)) {
  console.log('\n⛔ 「mergeTidy」 가 없다 — 얹는 규칙이 흩어지면 경로마다 결과가 갈린다.')
  실패++
}
for (const { 상대, 붙음 } of 문들) {
  if (!붙음) continue
  const 코드만 = readFileSync(join(SRC, 상대), 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  if (/\bmergeTidy\s*\(/.test(코드만)) continue
  console.log(`\n⛔ ${상대} 가 AI 결과를 «직접» 얹는다 — 「mergeTidy」 를 쓸 것(규칙이 갈린다).`)
  실패++
}

console.log(실패 ? `\n⛔ ${실패}곳` : '\n✅ 통과')
process.exit(실패 ? 1 : 0)
