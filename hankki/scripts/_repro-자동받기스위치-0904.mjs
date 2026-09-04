#!/usr/bin/env node
// 🔒 «자동 받기» 스위치 재현판 — 2026-09-04
//
// 📮 창업자 = *"ㄱㄱ"* (ⓐ = 창업자 기기에서 먼저, 유저는 나중)
//
// ⭐⭐ **이 판이 지키는 것 = 「유저 폰에서는 아직 안 돈다」.**
//    자동 받기는 9/1 에 실제로 사고를 냈다(담은 레시피가 덮여 사라졌다).
//    합치기로 모양을 바꿨지만 **창업자 폰-패드에서 왕복을 보기 «전»엔 유저에게 안 나간다.**
//    ⛔ 스토어 앱(TWA)이라 잘못 나가면 «되돌릴 창»이 없다 — 심사에 하루가 걸린다.
//
// 🧪 재는 것 여섯
//   ① 아무 표식 없는 «유저» 기기 = 꺼져 있다
//   ② `hankki:founder` 가 있는 창업자 기기 = 켜져 있다
//   ③ localStorage 가 아예 «막힌» 기기(사생활 모드)에서도 던지지 않는다 — 꺼짐으로 본다
//   ④ ⭐**전체공개 상수가 아직 `false`** — 켤 땐 사람이 «일부러» 켠다
//   ⑤ ⭐**App.jsx 가 그 스위치를 «진짜로» 물고 있다** — 함수만 있고 아무도 안 부르면 소용없다
//   ⑥ 못 받은 길은 «물어보기»로 내려간다 — 유저 눈엔 9/1 이전과 똑같다
//
// 📐 설계 = `docs/폰패드-자동동기화-설계-2026-09-04.md`

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => {
  if (!좋나) 나쁨++
  console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ` — ${덧}` : ''}`)
}

const 여기 = dirname(fileURLToPath(import.meta.url))
const 뿌리 = join(여기, '..')

// ── 폰 흉내 ──────────────────────────────────────────────────────────────
const 칸 = new Map()
globalThis.localStorage = {
  getItem: (k) => (칸.has(k) ? 칸.get(k) : null),
  setItem: (k, v) => 칸.set(k, String(v)),
  removeItem: (k) => 칸.delete(k),
}

const { 자동받기켤까 } = await import('../src/nudges.js')

console.log('\n🔒 자동 받기 스위치 — 유저 폰에서는 아직 안 돈다\n')

// ① 유저 기기
칸.clear()
잰다(자동받기켤까() === false, '① 유저 기기 = 꺼져 있다')

// ② 창업자 기기
칸.set('hankki:founder', '1')
잰다(자동받기켤까() === true, '② 창업자 기기 = 켜져 있다')

// ③ localStorage 가 막힌 기기
const 원래 = globalThis.localStorage
globalThis.localStorage = { getItem () { throw new Error('막혔다') } }
let 던졌나 = false
let 값3 = null
try { 값3 = 자동받기켤까() } catch { 던졌나 = true }
globalThis.localStorage = 원래
잰다(!던졌나 && 값3 === false, '③ 사생활 모드에서도 안 던진다', 던졌나 ? '던졌다' : `값=${값3}`)

// ④ 전체공개 상수
const 쪽지 = readFileSync(join(뿌리, 'src/nudges.js'), 'utf8')
const 상수줄 = 쪽지.split('\n').find((줄) => /^const 자동받기_전체공개/.test(줄)) || ''
잰다(/=\s*false\s*$/.test(상수줄.trim()), '④ 전체공개 상수가 아직 false', 상수줄.trim() || '줄을 못 찾았다')

// ⑤ ⭐App.jsx 가 스위치를 «진짜로» 물고 있나
//    ⛔ 주석 안의 글자를 세면 안 된다 — 9/4 에 실제로 그렇게 헛세었다.
const 앱 = readFileSync(join(뿌리, 'src/App.jsx'), 'utf8')
const 코드줄 = 앱.split('\n').filter((줄) => !/^\s*(\/\/|\*|\/\*)/.test(줄))
const 부른곳 = 코드줄.filter((줄) => 줄.includes('자동받기켤까()'))
const 받기줄 = 코드줄.filter((줄) => /await 저절로받기\(/.test(줄))
잰다(부른곳.length === 1, '⑤-a App.jsx 가 스위치를 부른다', `${부른곳.length}군데`)
잰다(
  받기줄.length === 1 && 받기줄[0].includes('자동받기켤까()'),
  '⑤-b 자동 받기는 «그 스위치를 지나야만» 돈다',
  받기줄.map((s) => s.trim()).join(' | ') || '저절로받기 부르는 줄이 없다'
)
잰다(/import \{[^}]*자동받기켤까[^}]*\} from '\.\/nudges'/.test(앱), '⑤-c 스위치를 실제로 들여왔다')

// ⑥ 못 받으면 «물어보기»로 내려간다
잰다(코드줄.some((줄) => /set덮을까\(\{/.test(줄)), '⑥ 못 받은 길 = 예전처럼 물어본다')

// ⑦ 화면(클라우드 시트)에 붙은 「기록·되돌리기」도 «같은 스위치»를 지난다
//    ⚠️ 정직하게 — 이건 «소스»를 재는 것이지 실물 화면을 띄운 게 아니다.
//       로그인이 있어야 뜨는 자리라 재현판으로는 여기까지가 한계다.
//       실물 확인은 창업자 폰-패드 왕복에서 한다(그게 ⓐ를 하는 이유다).
const 시트 = readFileSync(join(뿌리, 'src/components/CloudSheet.jsx'), 'utf8')
const 시트코드 = 시트.split('\n').filter((줄) => !/^\s*(\/\/|\*|\/\*)/.test(줄))
잰다(/import \{[^}]*자동받기켤까[^}]*\} from '\.\.\/nudges'/.test(시트), '⑦-a 시트가 스위치를 들여왔다')
잰다(시트코드.some((줄) => /자동받기켤까\(\)\s*&&\s*</.test(줄)), '⑦-b 기록·되돌리기 칸이 스위치 뒤에 있다')
잰다(시트코드.some((줄) => /불러오기끝\(판, '되돌리기'\)/.test(줄)), '⑦-c 되돌리기는 «이미 있는» 얹는 길을 쓴다')
잰다(!/store\.replaceAll/.test(시트), '⑦-d 없는 함수를 지어내지 않았다')

// ⑧ 🩺 [2026-09-04] 「지금 무엇이 막고 있나」가 화면에 뜨나
//   📮 창업자 = *"기록 안보여 저절로 맞춘적이 없데"* — 그때 화면은 «비었다»만 말했고
//      그게 「안 해봤다」인지 「하다 말았다」인지 아무도 몰랐다.
const 구름소스 = readFileSync(join(뿌리, 'src/cloud.js'), 'utf8')
잰다(/export async function 맞추기상태/.test(구름소스), '⑧-a 「지금 상태」를 읽는 길이 있다')
잰다(시트코드.some((줄) => /맞추기상태\(\)/.test(줄)), '⑧-b 시트가 그걸 «부른다»')
잰다(시트코드.some((줄) => /상태\.받았다표시/.test(줄)) && 시트코드.some((줄) => /상태\.마지막올린기기/.test(줄)),
  '⑧-c 두 값을 «화면에» 그린다 (가져온 적 · 마지막 올린 기기)')
// ⛔ 기기 이름(무작위 글자)을 날것으로 찍지 않는다 — 읽어도 아무것도 알 수 없다
잰다(!시트코드.some((줄) => /\{\s*상태\.마지막올린기기\s*\}/.test(줄)),
  '⑧-d ⛔기기 이름을 날것으로 찍지 않는다 (이 기기 / 다른 기기 로만)')

console.log(`\n${나쁨 ? `⛔ ${나쁨}칸 빨간불` : '✅ 다 초록불'}\n`)
process.exit(나쁨 ? 1 : 0)
