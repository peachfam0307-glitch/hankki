// 🍱 창업자가 «아직 안 뽑은» 음식 아이콘 목록 — 창업자 2026-08-24
//   📮 *"내가 뽑아 준 것 제외하고 남은 음식이모지들 정리해서 올려줘 …
//       종류별로 길게 적어주고(복사하기편하게) **제목을 정확히 적어줘야해.(앱에있는 그대로)**"*
//
// ⭐ 이름은 «지어내지 않는다» — `_판-음식아이콘목록-0823.mjs` 가 뽑은 값(＝앱 픽커가 그리는 이름) 그대로다.
// ⛔ 재료(ing)는 뺀다 — 창업자가 말한 건 「음식 이모지」다.
// 🔎 맞대보는 법 = 공백·괄호·「(매운)」 같은 꼬리를 떼고 견준다(앱은 「갈비찜(간장)」, 창업자 목록은 「갈비찜」).
import { readFileSync } from 'node:fs'

const 앱 = JSON.parse(readFileSync(process.argv[2] || '/tmp/icons.json', 'utf8'))
const 뽑은것 = readFileSync(process.argv[3] || '/tmp/뽑은것.txt', 'utf8')
  .split('\n').map((s) => s.trim()).filter(Boolean)

const 씻기 = (s) => s.replace(/\([^)]*\)/g, '').replace(/[\s·]/g, '')
const 뽑음 = new Set(뽑은것.map(씻기))

let 남은수 = 0, 전체 = 0
const 줄 = []
for (const g of 앱.groups) {
  if (g.band !== '요리') continue
  const 남 = g.items.filter((i) => { 전체++; return !뽑음.has(씻기(i.name)) })
  남은수 += 남.length
  if (!남.length) continue
  줄.push(`【${g.label}】 ${남.length}컷`)
  줄.push(남.map((i) => i.name).join(' · '))
  줄.push('')
}
console.log(`━━━━ 앱에 든 요리 ${전체}컷 중 «아직 안 뽑은» ${남은수}컷 ━━━━\n`)
console.log(줄.join('\n'))
