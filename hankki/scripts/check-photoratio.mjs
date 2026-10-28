#!/usr/bin/env node
// 🖼🖼 사진 아이콘이 «빈 접시»로 뜨지 않나 — 파일과 PHOTO_RATIO 표를 맞춘다
//
// ⛔⛔ 왜 만들었나 — **같은 사고가 두 번 났다.**
//    · 2026-09-14 00:10 창업자 실물 = *"음식아이콘안올라갔어"* → n3009~n3012 넷이 빈 접시
//    · 2026-09-15 08:1x = **n3030~n3033 이 또 그랬다.** 그중 둘(간단 우삼겹 갈비탕 · 충무김밥 오징어무침)은
//      `from` 이 「처음부터」라 **이미 유저 폰에 빈 접시로 떠 있었다.**
//
// 🌲 뿌리 = 새 컷 하나를 넣으려면 **손으로 세 곳**에 적어야 한다
//    ① `src/assets/stickers/photo/<키>.png` (파일)
//    ② `FoodIcon.jsx` 의 `FOOD_NAMES` (이름표)
//    ③ `Stickers.jsx` 의 `PHOTO_RATIO` (비율표)  ← **두 번 다 여기를 빼먹었다**
//    ⭐ 화면은 ③을 «돌면서» `PHOTO_FAMILY` 를 만든다. 여기 없으면 `src` 가 undefined 가 되어
//       `FoodIcon` 이 기본 SVG(빈 접시)로 떨어진다. ①②가 멀쩡해도 소용없다.
//
// ⭐ 그래서 「적는 것」을 규칙으로 부탁하지 않고 **기계가 맞춰 본다**(규칙 12 — 규칙이 아니라 장치).
//
// ⛔ 이 검사는 «레시피가 실제로 쓰는 키»만 막는다 — 서랍에만 있는 여분 컷까지 막으면 시끄러워서 죽는다.
//    (시끄러운 게이트는 죽은 게이트)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')

const 읽기 = (p) => fs.readFileSync(path.join(뿌리, p), 'utf8')

console.log('\n🖼 사진 아이콘이 빈 접시로 뜨지 않나 — 파일 · 이름표 · 비율표 맞추기\n')

// ── ① 파일
const 사진폴더 = path.join(뿌리, 'src/assets/stickers/photo')
const 파일들 = new Set(
  fs.readdirSync(사진폴더).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)),
)
if (파일들.size < 50) {
  console.error('⛔ photo 폴더를 못 읽었다 — 검사가 «가짜 초록불»을 낼 뻔했다')
  process.exit(1)
}

// ── ③ 비율표 (PHOTO_RATIO = { ... } 블록 안의 키만)
const 스티커 = 읽기('src/components/Stickers.jsx')
const 비율덩이 = 스티커.match(/const PHOTO_RATIO\s*=\s*\{([\s\S]*?)\n\}/)
if (!비율덩이) {
  console.error('⛔ Stickers.jsx 에서 PHOTO_RATIO 를 못 찾았다 — 이름이 바뀌었으면 이 검사도 고쳐야 한다')
  process.exit(1)
}
// ⛔ 주석 줄을 먼저 버린다 — 안 그러면 주석 속 시각(00:10)·날짜를 «키»로 줍는다.
//    2026-09-15 에 실제로 그랬다: js · cs_b29 · 00 이 키로 잡혀 «가짜 빨간불»이 났다.
const 비율본문 = 비율덩이[1].split('\n').filter((줄) => !/^\s*\/\//.test(줄)).join('\n')
const 비율표 = new Set(
  [...비율본문.matchAll(/([A-Za-z0-9_]+)\s*:\s*[\d.]+\s*,/g)].map((m) => m[1]),
)

if (비율표.size < 50) {
  console.error('⛔ PHOTO_RATIO 를 제대로 못 읽었다 (키 ' + 비율표.size + '개) — 가짜 초록불 방지로 죽는다')
  process.exit(1)
}

// ── 레시피가 실제로 쓰는 키
const 씨앗 = 읽기('src/data/basics.js')
const 쓰는키 = new Map()   // 키 → [제목…]
for (const m of 씨앗.matchAll(/id: '([^']+)',\s*\n?\s*title: '([^']+)'[\s\S]{0,400}?icon: '([A-Za-z0-9_]+)'/g)) {
  const [, , 제목, 키] = m
  if (!쓰는키.has(키)) 쓰는키.set(키, [])
  쓰는키.get(키).push(제목)
}
// title 이 id 와 다른 줄에 있는 꼴도 줍는다
for (const m of 씨앗.matchAll(/title: '([^']+)'[\s\S]{0,400}?icon: '([A-Za-z0-9_]+)'/g)) {
  const [, 제목, 키] = m
  if (!쓰는키.has(키)) 쓰는키.set(키, [])
  if (!쓰는키.get(키).includes(제목)) 쓰는키.get(키).push(제목)
}
if (쓰는키.size < 20) {
  console.error('⛔ basics.js 에서 icon 을 제대로 못 읽었다 (키 ' + 쓰는키.size + '개) — 가짜 초록불 방지로 죽는다')
  process.exit(1)
}

console.log(`   📄 파일 ${파일들.size} · 비율표 ${비율표.size} · 레시피가 쓰는 키 ${쓰는키.size}\n`)

// ── 판정: 레시피가 쓰는 «사진 키»(파일이 있는 키)인데 비율표에 없으면 빈 접시
const 빈접시 = []
for (const [키, 제목들] of 쓰는키) {
  if (!파일들.has(키)) continue          // 파일이 없으면 SVG 아이콘이다 — 이 검사 대상이 아니다
  if (비율표.has(키)) continue
  빈접시.push({ 키, 제목들 })
}

if (빈접시.length) {
  console.error(`⛔⛔ **빈 접시로 뜨는 편 ${빈접시.length}개** — 파일은 있는데 «비율표»에 없다\n`)
  for (const { 키, 제목들 } of 빈접시) {
    console.error(`   · ${키}  →  ${제목들.join(' · ')}`)
  }
  console.error(`
   👉 고칠 자리 = src/components/Stickers.jsx 의 PHOTO_RATIO
      값은 «파일을 열어» 재서 적는다(가로 ÷ 세로) — ⛔짐작으로 적지 않는다:
      python3 -c "from PIL import Image; im=Image.open('src/assets/stickers/photo/<키>.png'); print(im.width/im.height)"

   ⛔ 2026-09-14 · 2026-09-15 에 «같은 자리»에서 두 번 났다. 파일·이름표만 넣고 여기를 빼먹는다.`)
  process.exit(1)
}

// ── 거꾸로: 비율표에 있는데 파일이 없는 키 — ⚠️경고만 한다(배포는 안 막는다)
//    레시피가 «안 쓰는» 잔재라 화면엔 안 뜬다. 막으면 시끄러워서 게이트가 죽는다.
const 파일없음 = [...비율표].filter((k) => !파일들.has(k))
if (파일없음.length) {
  console.log(`⚠️ 비율표에 있는데 «파일이 없는» 키 ${파일없음.length}개 — ${파일없음.join(' · ')}`)
  console.log('   (레시피가 안 쓰면 화면엔 안 뜬다 — 치우고 싶으면 PHOTO_RATIO 에서 지운다)')
}

console.log(`✅ 레시피가 쓰는 사진 아이콘이 전부 비율표에 있다 — 빈 접시 0`)
