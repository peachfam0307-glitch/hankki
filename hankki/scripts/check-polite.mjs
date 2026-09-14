// 🗣 기본 레시피가 «전부» 해요체로 나오나 — 하나라도 「~다」로 남으면 배포를 막는다.
//
// 🔢 2026-08-13 창업자 제보 *"진한맛이 난다(문체이상-전수검사해봐)"*
//   기본 레시피 111편의 만드는 법은 데이터에 「~다」체로 적혀 있고,
//   `basics.js` 가 화면에 내보낼 때 `politeSteps()` 로 해요체로 바꾼다.
//   그런데 사전(`polish.js` 의 ENDINGS)에 **「난다」가 없어서** 그 한 문장만 「~다」로 남아 있었다.
//   ⭐ 창업자 *"원래 해요체쓰는데 쟤만 ~다잖아"* — 실측도 정확히 그랬다(111편 중 1개).
//
// ⛔ 데이터를 고치는 게 아니다. **사전에 어미를 더하는 것**이 답이다.
//    (데이터가 「~다」로 적혀 있는 건 «정상»이다 — 창업자가 원고를 그 말투로 쓴다)
//
// 이 검사가 지키는 것 = 새 레시피를 넣다가 사전에 없는 어미를 쓰면 «그 자리에서» 걸린다.

import { allBasicRecipes } from '../src/data/basics.js'

// 해요체로 바뀌었어야 하는데 안 바뀐 것 — 문장 끝의 「~다」
//   ⚠️ 「~다」로 끝나도 괜찮은 것은 여기서 빼 준다(뒤에 목록).
const 남는게정상 = [
  /같다/, // 「닭곰탕과 같다」 같은 «비교» 표현은 해요체가 어색하다
]

const 걸린것 = []
for (const r of allBasicRecipes) {
  for (const s of r.steps || []) {
    for (const m of String(s).matchAll(/([가-힣]{1,4}다)(?=\s*[.!?~)"']|\s*$)/g)) {
      if (남는게정상.some((re) => re.test(m[1]))) continue
      걸린것.push({ 제목: r.title, 어미: m[1], 문장: String(s).slice(0, 60) })
    }
  }
}

console.log('\n🗣 기본 레시피 문체 검사\n')
console.log(`   레시피 ${allBasicRecipes.length}편 · 만드는 법 ${allBasicRecipes.reduce((n, r) => n + (r.steps?.length || 0), 0)}줄`)

if (!걸린것.length) {
  console.log('   ✅ 전부 해요체로 나온다\n')
  process.exit(0)
}

console.log(`\n   ⛔ 해요체로 안 바뀐 문장 ${걸린것.length}개 — «데이터»가 아니라 «사전»을 고칠 것`)
console.log('      👉 src/polish.js 의 ENDINGS 에 그 어미를 더한다 (예: [\'난다\', \'나요\'])\n')
for (const x of 걸린것.slice(0, 10)) console.log(`        「${x.어미}」  ${x.제목} — ${x.문장}`)
if (걸린것.length > 10) console.log(`        … 외 ${걸린것.length - 10}개`)
console.log('')
process.exit(1)
