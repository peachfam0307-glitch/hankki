// 📱 [절대원칙 · 창업자 2026-10-07] SNS 레시피는 «원본 그대로» — 우리 것(브랜드·대체품)을 넣지 않는다
// 📮 창업자 = 「앞으로 sns레시피는 절대 안바뀌는 걸로」 · 「절대원칙으로 박아줘」 · 「우리꺼 안넣고 그냥 가져오는거야」
// 🌲 사고 = 우렁 순두부 된장찌개(김대석 셰프TV)의 「원당·조청」이 9/26 에 「아우노슈가」로 바뀌어 10/7 에 그대로 열렸다.
//    뿌리 = 우리 레시피용 «설탕 → 아우노슈가» 표기 통일(v33)이 SNS 편까지 같이 덮었다.
// 🛡 sourceUrl 이 있는 편(＝SNS 레시피)의 재료·만드는 법·메모에 «우리 것» 낱말이 있으면 배포를 막는다.
//    ⛔ 낱말 목록을 늘릴 땐 «우리가 쓰는 제품·브랜드»만 — 원본에 그 낱말이 실제로 있으면 예외에 이유와 함께 적는다.
import { allBasicRecipes } from '../src/data/basics.js'

const 우리것 = ['아우노슈가', '아우노', '성가정', '올바른가', '요리의정수', '해통령', '육수명장', '제가 쓰는 양념', '한끼 주인장']
// 원본에 실제로 그 낱말이 있는 편 = { id: '이유' }
const 예외 = {}

const 걸린 = []
for (const r of allBasicRecipes) {
  if (!r.sourceUrl || 예외[r.id]) continue
  const 글 = [...(r.ingredients || []), ...(r.steps || []), r.memo || ''].join('\n')
  const 낱말 = 우리것.filter((w) => 글.includes(w))
  if (낱말.length) 걸린.push(`   · ${r.title} (${r.id} · ${r.from || '-'}) — ${낱말.join(', ')}`)
}
if (걸린.length) {
  console.error(`⛔ SNS 레시피에 «우리 것»이 들어갔다 ${걸린.length}편 — SNS 는 원본 그대로(창업자 절대원칙 2026-10-07)\n${걸린.join('\n')}`)
  process.exit(1)
}
console.log('✅ SNS 레시피 원본 그대로 — 우리 것 0')
