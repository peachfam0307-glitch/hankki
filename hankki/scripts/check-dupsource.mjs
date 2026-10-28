// 🔁🔁 「같은 표·같은 함수가 «두 곳»에 베껴져 있나」 — 배포 게이트
//
// 📮 창업자 2026-09-12 = *"왜 이거 자꾸 이렇게 돼????? 컬리 몇번째야.."* ＋ *"a b 다해. 다시는 이런일없게"*
//
// ⛔⛔ 그날 무슨 일이 났나 — 「사러가기」가 컬리 제품을 «네이버 검색»으로 보냈다.
//    2026-08-29 에 컬리 검색 주소를 «분명히 넣었는데» 또 났다. 뿌리를 파 보니 —
//    `MALL_SEARCH` 표와 링크 만드는 함수가 **두 곳에 통째로 베껴져** 있었다:
//      · src/data/curation.js  → 컬리·자연드림 «있다» (8/29 에 여기만 고쳤다)
//      · src/screens/ShopScreen.jsx → 컬리·자연드림 «없다» (화면이 실제로 부르는 쪽)
//    📌 **「고쳤다」가 거짓말이 아니라, 고친 곳이 화면이 보는 곳이 아니었다.**
//       두 벌이면 한 벌은 반드시 낡는다 — 「현행이 둘이면 하나는 틀린 값」(2026-08-13)과 같은 사고다.
//
// ⭐⭐ 이 게이트가 막는 것 = **베끼는 순간**. 「컬리를 넣었나」를 세지 않는다 —
//    그건 몰이 늘 때마다 또 손봐야 하고 반드시 낡는다(절대원칙 34 · 값을 늘리지 말고 모양을 바꿔라).
//    ⛔ 그래서 「무엇을 베꼈나」가 아니라 **「베낀 것이 있나」**를 본다.
//
// 보는 법 = 아래 「한 곳에만 있어야 하는 것」의 표식이 두 파일 이상에서 «정의»되면 죽는다.
//    (부르는 것 import 는 얼마든지 좋다 — 정의가 둘이면 안 된다.)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = join(dirname(fileURLToPath(import.meta.url)), '../src')

// ⭐ 늘릴 때는 「두 곳에 있으면 반드시 갈리는 것」만 넣는다 — 시끄러운 게이트는 죽은 게이트다.
const 한곳에만 = [
  { 이름: 'MALL_SEARCH', 왜: '쇼핑몰 검색 주소표 — 두 벌이면 몰을 늘릴 때 한쪽만 늘어난다(컬리가 그랬다)', 집: 'src/data/curation.js' },
  { 이름: 'productMall', 왜: '구매처 배지 이름표 — 두 벌이면 한 벌이 낡는다(2026-09-10 에 자연드림 배지 10개가 그렇게 빠졌다)', 집: 'src/data/curation.js' },
  { 이름: 'productLink', 왜: '사러가기 주소 만들기', 집: 'src/data/curation.js' },
]

const 파일들 = []
;(function 훑기(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) { if (f !== 'assets') 훑기(p); continue }
    if (/\.(js|jsx)$/.test(f)) 파일들.push(p)
  }
})(src)

let 나쁨 = 0
for (const { 이름, 왜, 집 } of 한곳에만) {
  // «정의»만 센다 — `const X = {`·`let X =`·`var X =`. 부르는 것(X[...])은 안 센다.
  const 정의된곳 = 파일들.filter((p) => new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?(?:const|let|var|function)\\s+${이름}\\b\\s*[=(]`).test(readFileSync(p, 'utf8')))
  if (정의된곳.length > 1) {
    나쁨++
    console.log(`[dupsource] ❌ 「${이름}」 이 ${정의된곳.length}곳에서 정의된다 — 두 벌이면 한 벌은 반드시 낡는다`)
    for (const p of 정의된곳) console.log(`     · ${p.slice(p.indexOf('/src/') + 1)}`)
    console.log(`     👉 ${왜}`)
    console.log(`     👉 집은 ${집} 하나다. 나머지는 지우고 거기서 «불러다» 쓴다(import).`)
  } else if (정의된곳.length === 0) {
    나쁨++
    console.log(`[dupsource] ❌ 「${이름}」 이 아무 데도 없다 — 이름이 바뀌었으면 이 표도 같이 고쳐라(안 그러면 게이트가 «조용히» 죽는다)`)
  }
}
if (나쁨) { console.log('\n❌ 베낀 코드 게이트 실패'); process.exit(1) }
console.log(`[dupsource] ✓ 한 곳에만 있어야 하는 것 ${한곳에만.length}개 — 전부 한 곳`)
