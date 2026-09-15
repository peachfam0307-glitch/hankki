#!/usr/bin/env node
// 🗄🗄 게이트 — 창업자가 준 음식컷이 「아이콘 고르기」 서랍에 «다» 들어갔나
//
// ⛔⛔ 무슨 사고였나 (2026-09-15 창업자 제보)
//    📮 창업자 = *"역순으로 음식 들어가는지도 확인해봐"*
//    🔢 실측 = 음식컷 35개 중 **24개가 픽커 서랍(FOOD_ICON_GROUPS.items)에 없었다.**
//       ＝ 이름을 «정확히 알고 검색»해야만 나오고, 손으로 훑어 내려가면 영영 안 보였다.
//       n3001~n3008(9/11)은 넣었는데 그 뒤 들어온 24개를 매번 빠뜨렸다.
//
// 🌲 뿌리 = 컷 하나를 살리려면 «네 곳»에 적어야 하는데 아무도 세지 않았다:
//    ① 파일  ② PHOTO_RATIO(비율)  ③ 이름표  ④ 픽커 서랍
//    ⭐ ①②는 이미 게이트가 있다(check-photoratio). **④만 맨몸이었다.**
//
// ⛔ 빈 접시와 다른 병이다 — 빈 접시는 「안 뜨는 것」, 이건 **「숨어 있는 것」**이다.
//    유저는 그 그림이 있는 줄도 모른다. 그래서 «조용히» 손해다.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const 민낯 = (s) => s.split('\n').filter((줄) => !/^\s*\/\//.test(줄)).join('\n')

const fi = 민낯(fs.readFileSync(path.join(뿌리, 'src/components/FoodIcon.jsx'), 'utf8'))
const 파일 = fs.readdirSync(path.join(뿌리, 'src/assets/stickers/photo'))
  .filter((f) => /^n3\d{3}\.png$/.test(f)).map((f) => f.slice(0, -4)).sort()

console.log('\n🗄 아이콘 고르기 서랍 — 창업자가 준 음식컷이 다 들어갔나\n')
console.log(`   🍱 음식컷 파일 ${파일.length}개`)

if (파일.length < 8) {
  console.log('   ⛔ 컷을 8개도 못 읽었다 — 읽는 방식이 깨졌다(이 검사가 눈이 먼다)')
  process.exit(1)
}

// 서랍 = `{ label: '…', … items: [ … ] }` 줄에서 따옴표 안 키를 모은다
const 서랍 = new Map()
for (const 줄 of fi.split('\n')) {
  const m = 줄.match(/^\s*\{\s*label:\s*'([^']+)'/)
  if (!m) continue
  for (const k of 줄.matchAll(/'(n3\d{3})'/g)) {
    if (!서랍.has(k[1])) 서랍.set(k[1], m[1])
  }
}
if (!서랍.size) {
  console.log('   ⛔ 서랍에서 음식컷을 한 개도 못 읽었다 — 형식이 바뀌었나')
  process.exit(1)
}

// 이름표 — 없으면 서랍에 넣어도 칸이 빈 이름으로 뜬다
const 이름 = new Map([...fi.matchAll(/\b(n3\d{3})\s*:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]))

const 서랍없음 = 파일.filter((k) => !서랍.has(k))
const 이름없음 = 파일.filter((k) => !이름.has(k))

let 실패 = 0
if (서랍없음.length) {
  console.log(`   ⛔ 서랍에 «안 들어간» 컷 ${서랍없음.length}개 — 손으로 훑으면 안 보인다`)
  for (const k of 서랍없음) console.log(`      · ${k} ${이름.get(k) || '(이름표도 없다)'}`)
  console.log('      👉 FoodIcon.jsx 의 알맞은 { label: … items: [ … ] } 맨 앞에 넣는다')
  실패++
} else {
  console.log(`   ✅ ${파일.length}개가 전부 서랍에 있다`)
}

if (이름없음.length) {
  console.log(`   ⛔ 이름표가 없는 컷 ${이름없음.length}개 — 픽커 칸이 «빈 이름»으로 뜬다: ${이름없음.join(' ')}`)
  실패++
} else {
  console.log(`   ✅ ${파일.length}개가 전부 이름표를 갖고 있다`)
}

// 어느 서랍에 몇 개씩 — 한 서랍에 몰리면 눈으로 보고 갈라 준다
const 셈 = {}
for (const [, lab] of 서랍) 셈[lab] = (셈[lab] || 0) + 1
console.log('   📦 서랍별:', Object.entries(셈).map(([a, b]) => `${a} ${b}`).join(' · '))

console.log('')
if (실패) {
  console.error('⛔ 「아이콘 고르기 서랍」 검사 실패 — 준 컷이 숨는다')
  process.exit(1)
}
console.log('✅ 창업자가 준 음식컷이 하나도 안 숨는다')
