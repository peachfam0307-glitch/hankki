#!/usr/bin/env node
// ✂️✂️ 재현판 — 「자르기 안내」가 «도달하나»
//
// ⛔⛔ 무슨 사고였나 (2026-09-15 창업자 실물)
//    📮 창업자 = *"자르기안내도 없어 어제 우리 문구까지 다 정했잖아"*
//             · *"위에 빨간 얄약도 안띄우기로 했었고"*
//
// 🌲 뿌리 = 9/13 에 「통째로 읽기는 자르기 화면을 안 띄운다」로 고쳤는데,
//    9/14 에 그 화면 «안»에 들어갈 안내 두 갈래(열쇠·무료)를 만들어 넣었다.
//    ＝ **글자는 들어갔는데 그 화면이 안 열려서 한 번도 못 떴다.**
//    ⛔ 나는 「넣었다」로 보고했다. «도달하는지»를 안 봤다(규칙 21).
//
// ⭐ 그래서 이 판이 재는 것 = **「글자가 있나」가 아니라 「거기에 닿나」**.
//    ⛔ 문구만 grep 하면 그때도 초록불이었다 — 그 검사는 이 사고를 못 잡는다.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const 편집 = fs.readFileSync(path.join(뿌리, 'src/screens/EditorScreen.jsx'), 'utf8')
const 자르기 = fs.readFileSync(path.join(뿌리, 'src/components/CropSheet.jsx'), 'utf8')

// ⛔ 주석을 먼저 걷어낸다 — 주석 속 옛 코드가 초록불을 만든 적이 있다(2026-09-14 · 구멍검사)
const 민낯 = (s) => s.split('\n').filter((줄) => !/^\s*\/\//.test(줄)).join('\n')
const 편집민낯 = 민낯(편집)

let 실패 = 0
const 잰다 = (참, 이름) => {
  console.log(`   ${참 ? '✅' : '❌'} ${이름}`)
  if (!참) 실패++
}

console.log('\n✂️ 재현판 — 자르기 안내가 «도달하나» (2026-09-15)\n')

// ── ① 화면이 열리나 — setCropImg 가 «조건 없이» 불리는가
console.log('① 자르기 화면이 열리나 — 여기가 막히면 안내를 아무리 잘 써도 안 보인다')
const 여는자리 = [...편집민낯.matchAll(/setCropImg\((urls\[0\]|다음)\)/g)]
잰다(여는자리.length === 2, `①-1 화면을 여는 자리가 둘이다 (첫 장 · 둘째 장) — 찾은 수 ${여는자리.length}`)
잰다(
  !/골라담기/.test(편집민낯),
  '①-2 「골라담기일 때만 자른다」 갈래가 없다 — 갈래가 살아 있으면 한쪽이 또 못 뜬다',
)
잰다(
  !/onCropped\(urls\[0\]\)/.test(편집민낯),
  '①-3 자르기를 «건너뛰고» 바로 읽는 샛길이 없다',
)

// ── ② 안내 두 갈래가 «그 화면 안»에 다 있나
console.log('\n② 안내 두 갈래 — 열쇠 쪽과 무료 쪽이 둘 다 살아 있나')
잰다(
  /글자는 다 남기고/.test(자르기),
  '②-1 열쇠 쪽 = CropSheet 기본 안내 「글자는 다 남기고 사진 부분만…」 (2026-09-13 창업자 확정)',
)
잰다(
  /제목 · 재료 · 만드는 법/.test(편집민낯) && /ocrNoVision\.current \?/.test(편집민낯),
  '②-2 무료 쪽 = 「제목 · 재료 · 만드는 법만 남겨주세요」가 ocrNoVision 갈래에 달려 있다',
)
잰다(
  /사진을 잘라낼수록 글자를 더 잘 읽어요/.test(편집민낯),
  '②-3 무료 쪽 까닭 줄이 있다 (ocr.js 가 최대 3배로 키워 읽는다 — 걷어낼수록 글자가 커진다)',
)

// ── ③ 빨간 열쇠 알약 — 무료면 «안» 뜨나
console.log('\n③ 빨간 알약 — 무료로 왔는데 「열쇠 1개를 써요」가 뜨면 한 화면이 반대말을 한다')
const 알약 = 편집민낯.match(/[^\n]*사진 1장에 \{keyCount\(1\)\}를 써요/)
잰다(!!알약, '③-1 빨간 알약 줄을 찾았다')
const 앞뒤 = 편집민낯.slice(Math.max(0, 편집민낯.indexOf('사진 1장에 {keyCount(1)}를 써요') - 700), 편집민낯.indexOf('사진 1장에 {keyCount(1)}를 써요'))
잰다(
  /!\(ocrNoVision\.current \|\| 무료판/.test(앞뒤),
  '③-2 그 줄이 «무료가 아닐 때만» 그려진다 (ocrNoVision ＋ 무료판 ＋ freeRead)',
)

// ── ④ 어제 배운 것을 다시 안 잊게 — 「글자만 넣기」 자체를 막는다
console.log('\n④ 배운 것 — 문구가 «달린 조건»이 실제로 닿는 자리인가')
잰다(
  편집민낯.indexOf('setCropImg') < 편집민낯.indexOf('제목 · 재료 · 만드는 법'),
  '④-1 화면을 여는 코드가 안내 문구보다 «앞»에 있다 (같은 파일 안에서 이어져 있다)',
)

console.log('')
if (실패) {
  console.error(`❌ ${실패}칸 실패 — 안내가 또 «안 닿을» 수 있다`)
  process.exit(1)
}
console.log('✅ 전부 통과 — 자르기 화면이 열리고, 안내 두 갈래가 거기에 닿는다.')
