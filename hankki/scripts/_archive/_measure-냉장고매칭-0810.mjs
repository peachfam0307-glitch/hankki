// 🧊 재기 — 「냉장고 재료 ↔ 레시피 재료」 맞추기가 실제로 얼마나 틀리나
//
// ⛔ 규칙을 «정하기 전에» 잰다. 2026-08-10 에 창업자가 *"오늘뭐해먹지는 뭘 기반으로 추천해?"*
//    라고 물어 코드를 읽었더니 두 곳이 `ings.includes(키)` 로 «글자 포함»만 보고 있었다.
//    ⒜ `HomeScreen.jsx:106` — 냉장고 이름의 «첫 낱말» 로 includes
//    ⒝ `PantryView.jsx:104`(냉장고 파먹기) — «풀네임» 으로 includes
//    📌 머리로 「무↔무염버터가 걸리겠네」 하고 고치면 **없는 문제를 고치는 것**일 수 있다.
//       그래서 **우리 기본 레시피 전부**에 대고 돌려서 «진짜 걸리는 것»을 센다.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const { basicRecipes } = await import('../src/data/basics.js')

// 🧊 시험용 냉장고 — 흔한 것 ＋ 짧은 이름(위험할 만한 것)을 섞는다.
//    ⚠️ 실제 유저 냉장고는 영수증 OCR·손입력이라 「돼지고기 앞다리살」처럼 길 수도 있다.
const PANTRY = [
  '무', '파', '알', '물',                       // 1글자 — 제일 위험할 것으로 의심
  '두유', '마늘', '멸치', '참치', '고추장', '간장',
  '양파', '대파', '달걀', '두부', '감자', '당근', '버섯', '오이', '애호박',
  '돼지고기 앞다리살', '소고기 국거리용', '닭고기 정육',   // 긴 이름
]

const tokens = (r) => (r.ingredients || []).flatMap((i) => String(i).split(/[\s,()·/]+/)).filter(Boolean)

let 총 = 0
const 의심 = []
for (const p of PANTRY) {
  const 첫 = p.trim().split(/\s+/)[0]
  for (const r of basicRecipes) {
    const ings = (r.ingredients || []).join(' ')
    if (!ings.includes(첫)) continue
    총++
    // 「낱말 하나가 통째로 그 이름인가」 — 아니면 낱말 «속»에서 걸린 것이다
    const ts = tokens(r)
    const 통째 = ts.some((t) => t === 첫)
    if (!통째) {
      const 걸린것 = ts.filter((t) => t.includes(첫))
      의심.push({ 냉장고: p, 키: 첫, 레시피: r.title, 걸린낱말: [...new Set(걸린것)].join(' · ') })
    }
  }
}

console.log(`\n🧊 시험 냉장고 ${PANTRY.length}칸 × 기본 레시피 ${basicRecipes.length}편`)
console.log(`   지금 방식(글자 포함)이 «걸린다»고 한 짝 = ${총}건`)
console.log(`   그중 **낱말 속에서 걸린 것** = ${의심.length}건\n`)

if (의심.length) {
  console.log('⛔ 낱말 «속»에서 걸린 것 — 이게 오추천이다')
  for (const c of 의심.slice(0, 40)) {
    console.log(`   · 냉장고 「${c.키}」 → ${c.레시피}   (걸린 낱말: ${c.걸린낱말})`)
  }
  if (의심.length > 40) console.log(`   … 그리고 ${의심.length - 40}건 더`)
}

// ⚖️ 규칙 후보를 «데이터로» 견준다 — 머리로 고르면 또 틀린다.
//   A = 지금(글자 포함)  ·  B = 낱말이 정확히 같을 때만  ·  C = 같거나, 2글자 이상이면 그 낱말로 «끝날» 때
const 규칙 = {
  A: (ts, k) => ts.some((t) => t.includes(k)),
  B: (ts, k) => ts.some((t) => t === k),
  C: (ts, k) => ts.some((t) => t === k || (k.length >= 2 && t.endsWith(k))),
}
console.log('\n⚖️ 규칙 후보 견주기 — 「키 글자수」별로 나눠 본다')
for (const [이름, f] of Object.entries(규칙)) {
  let 한글자 = 0, 여러글자 = 0, 속에서 = 0
  for (const p of PANTRY) {
    const k = p.trim().split(/\s+/)[0]
    for (const r of basicRecipes) {
      const ts = tokens(r)
      if (!f(ts, k)) continue
      if (k.length === 1) 한글자++; else 여러글자++
      if (!ts.some((t) => t === k)) 속에서++
    }
  }
  console.log(`   ${이름} — 걸린 짝 ${한글자 + 여러글자}건 (1글자 키 ${한글자} · 2글자↑ ${여러글자}) · 그중 낱말 속에서 ${속에서}건`)
}
console.log('   ⭐ C 가 남겨야 할 것 = 「마늘 → 다진마늘」 · 버려야 할 것 = 「무 → 풀무원·단무지」 「파 → 스파게티」')
for (const k of ['마늘', '멸치', '두유', '무', '파']) {
  const 남 = basicRecipes.filter((r) => 규칙.C(tokens(r), k)).map((r) => r.title)
  const 버 = basicRecipes.filter((r) => 규칙.A(tokens(r), k) && !규칙.C(tokens(r), k)).length
  console.log(`   · 「${k}」 C가 남긴 ${남.length}편${남.length && 남.length <= 4 ? ` (${남.join(', ')})` : ''} · A에서 버린 ${버}편`)
}

// 🔢 ③ 점수 — 지금은 «겹친 개수»라 재료가 많은 레시피가 늘 이긴다. 실제로 그런지 잰다.
const 냉장고 = ['양파', '대파', '달걀', '두부', '감자']
const 점수 = basicRecipes
  .map((r) => {
    const ings = (r.ingredients || []).join(' ')
    const n = 냉장고.filter((k) => ings.includes(k)).length
    return { 제목: r.title, 겹침: n, 재료수: (r.ingredients || []).length }
  })
  .filter((x) => x.겹침 > 0)
  .sort((a, b) => b.겹침 - a.겹침)

console.log(`\n🔢 「겹친 개수」로 세운 순서 (냉장고 = ${냉장고.join('·')})`)
for (const x of 점수.slice(0, 8)) {
  const 비율 = ((x.겹침 / x.재료수) * 100).toFixed(0)
  console.log(`   ${x.겹침}개 겹침 · 재료 ${x.재료수}개 (${비율}% 있다)   ${x.제목}`)
}
console.log(`\n   ⭐ 「겹친 개수」가 아니라 «가진 비율»로 세우면 순서가 어떻게 달라지나`)
const 비율순 = [...점수].sort((a, b) => (b.겹침 / b.재료수) - (a.겹침 / a.재료수))
for (const x of 비율순.slice(0, 8)) {
  const 비율 = ((x.겹침 / x.재료수) * 100).toFixed(0)
  console.log(`   ${비율}% 있다 (${x.겹침}/${x.재료수})   ${x.제목}`)
}
console.log('')
