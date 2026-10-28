#!/usr/bin/env node
// 🍽🍽 재현판 — 「빈 접시」가 «날 수 없나»
//
// ⛔⛔ 무슨 사고였나 (이틀에 «두 번»)
//    · 2026-09-13 v13.35 = n3009~n3022 열넷이 Stickers.jsx 의 PHOTO_RATIO 에 없어 빈 접시
//    · 2026-09-14 v13.42 = n3030~n3033 이 «또» 없었다 → 이미 열린 두 편
//      (간단 우삼겹 갈비탕 · 충무김밥 오징어무침)이 **유저 폰에 빈 접시로 떠 있었다**
//    📮 창업자 2026-09-15 = *"자꾸 빈접시나가는거 우리 어제 다 잡은거 아니었어? 뿌리부터 찾아내."*
//
// 🌲 뿌리 = v13.35 때 «빠진 값을 채우기»만 하고 구조도 검사도 안 만들었다.
//    PHOTO_FAMILY 를 «손으로 적는 표»(PHOTO_RATIO)를 «돌면서» 만들었기 때문에
//    표에 안 적으면 그림 주소가 통째로 사라졌다.
//
// ✅ 고침 = 목록의 주인을 «폴더에 있는 파일»(import.meta.glob)로 옮겼다.
//    ⭐ 이 재현판이 재는 것 = **«비율표에서 빼도 그림이 뜨나»**.
//       ⛔ 「지금 값이 다 채워졌나」를 재면 안 된다 — 그건 check-photoratio 가 하는 일이고,
//          «구조가 고쳐졌나»는 그걸로 알 수 없다(그게 이번에 두 번 놓친 까닭이다).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const 스티커길 = path.join(뿌리, 'src/components/Stickers.jsx')
const 본문 = fs.readFileSync(스티커길, 'utf8')

let 실패 = 0
const 잰다 = (참, 이름) => {
  console.log(`   ${참 ? '✅' : '❌'} ${이름}`)
  if (!참) 실패++
}

console.log('\n🍽 재현판 — 빈 접시가 «날 수 없나» (2026-09-15)\n')

// ── ① 구조: 목록의 주인이 «파일»인가
console.log('① 목록의 주인 — 손으로 적는 표가 아니라 «폴더의 파일»이어야 한다')
잰다(
  /for \(const 경로 of Object\.keys\(PHOTO_URLS\)\)/.test(본문),
  '①-1 PHOTO_FAMILY 를 PHOTO_URLS(폴더에서 자동 수집)를 «돌면서» 만든다',
)
잰다(
  /PHOTO_RATIO\[key\]\s*\|\|\s*기본비율/.test(본문),
  '①-2 비율이 표에 없으면 «기본비율»로 떨어진다 — 그림 주소는 안 잃는다',
)
잰다(
  /const 기본비율\s*=\s*[\d.]+/.test(본문),
  '①-3 기본비율이 숫자로 정해져 있다',
)

// ── ② 뜻: 실제로 돌려 본다 (표에서 빼도 그림이 뜨나)
console.log('\n② 뜻 — «비율표에서 빼도» 그림 주소가 살아 있나 (구조를 흉내 내어 돌린다)')

// 폴더의 파일 목록 = import.meta.glob 이 모으는 것과 같은 자리
const 사진폴더 = path.join(뿌리, 'src/assets/stickers/photo')
const 파일키 = fs.readdirSync(사진폴더).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))
잰다(파일키.length > 50, `②-0 사진 파일을 읽었다 (${파일키.length}개) — 못 읽으면 이 재현판은 가짜 초록불이다`)

// PHOTO_RATIO 를 본문에서 뽑는다 (주석 줄은 버린다 — 시각 00:10 같은 것이 키로 잡힌다)
const 덩이 = 본문.match(/const PHOTO_RATIO\s*=\s*\{([\s\S]*?)\n\}/)
잰다(!!덩이, '②-0b PHOTO_RATIO 블록을 찾았다')
const 표본문 = (덩이 ? 덩이[1] : '').split('\n').filter((줄) => !/^\s*\/\//.test(줄)).join('\n')
const 표 = {}
for (const m of 표본문.matchAll(/([A-Za-z0-9_]+)\s*:\s*([\d.]+)\s*,/g)) 표[m[1]] = Number(m[2])

// 새 구조를 그대로 흉내 낸다
const 기본비율 = Number((본문.match(/const 기본비율\s*=\s*([\d.]+)/) || [])[1] || 0)
const 만들기 = (비율표) => {
  const 가족 = {}
  for (const key of 파일키) 가족[key] = { src: `/photo/${key}.png`, ratio: 비율표[key] || 기본비율 }
  return 가족
}

// 오늘 사고를 그대로 재현 — n3030~n3033 을 표에서 «뺀다»
const 뺀표 = { ...표 }
for (const k of ['n3030', 'n3031', 'n3032', 'n3033', 'n3034', 'n3035']) delete 뺀표[k]
const 뺀가족 = 만들기(뺀표)

for (const k of ['n3031', 'n3032', 'n3034', 'n3035']) {
  잰다(
    !!뺀가족[k] && !!뺀가족[k].src && 뺀가족[k].ratio > 0,
    `②-${k} 비율표에서 빼도 그림 주소와 비율이 살아 있다 (빈 접시가 안 난다)`,
  )
}

// ── ③ 옛 구조로는 «진짜 죽는지» — 안 죽으면 이 재현판이 아무것도 안 재는 것이다
console.log('\n③ 옛 구조 — 표를 돌면 실제로 빈 접시가 난다 (안 나면 이 재현판이 헛것이다)')
const 옛만들기 = (비율표) => {
  const 가족 = {}
  for (const key of Object.keys(비율표)) 가족[key] = { src: `/photo/${key}.png`, ratio: 비율표[key] }
  return 가족
}
const 옛가족 = 옛만들기(뺀표)
잰다(!옛가족.n3031, '③-1 옛 구조에서는 n3031 이 아예 없다 → 화면이 기본 SVG(빈 접시)로 떨어진다')
잰다(!옛가족.n3034, '③-2 옛 구조에서는 새 컷 n3034 도 없다')

// ── ④ 2차 그물이 살아 있나
console.log('\n④ 2차 그물 — 게이트가 스모크에 등록돼 있나')
const 팩 = fs.readFileSync(path.join(뿌리, 'package.json'), 'utf8')
잰다(팩.includes('check-photoratio.mjs'), '④-1 check-photoratio.mjs 가 smoke 에 걸려 있다')
잰다(
  fs.existsSync(path.join(여기, 'check-photoratio.mjs')),
  '④-2 게이트 파일이 실제로 있다',
)

console.log('')
if (실패) {
  console.error(`❌ ${실패}칸 실패 — 빈 접시가 또 날 수 있다`)
  process.exit(1)
}
console.log('✅ 전부 통과 — 비율을 빼먹어도 그림은 뜬다. 게이트가 2차로 잡는다.')
