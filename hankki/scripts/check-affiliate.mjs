// 💰 **제휴(대가성) 고지가 없는데 제휴 링크가 들어갔나** — 어기면 배포 차단. (2026-08-03 신설)
//
// ⛔ 왜
//   2026-08-03 에 창업자가 *"주부의 장바구니 아래 안내판은 없애도 될 것같아 아래위로 좀 지저분해보여"*
//   라고 해서 **제휴 고지판을 뺐다.** 지금은 제휴를 하나도 안 해서 **고지 의무가 없다** — 맞는 판단이다.
//   ⚠️ 그런데 **쿠팡 파트너스에 가입하는 순간 다시 넣어야 한다.**
//   · 공정위 「추천·보증 등에 관한 표시·광고 심사지침」 = 대가를 받으면 **소비자가 알아볼 수 있게 표시**해야 한다
//   · 쿠팡 파트너스 심사가 **그 문구가 보이는 스크린샷**을 요구한다 (`docs/제휴프로그램-확인-2026-08-03.md`)
//
// ⭐ **사람이 기억할 일로 두지 않는다.** 제휴 꼬리표가 주소에 붙는 순간 이 검사가 배포를 막는다.
//    (「기억하자」로 뒀다가 놓친 게 이 저장소에서만 여러 번이다)
//
// 🧾 **되살릴 문구 — 지워지지 않게 여기 통째로 보관한다** (2026-08-03 UI 에서 뺀 원문 그대로):
//
//   ‘사러가기’는 외부 쇼핑몰로 연결돼요. **현재 한끼는 제휴 서비스를 운영하지 않아 어떤 수수료도 받지 않아요.**
//   나중에 제휴가 생겨도 여러분은 **늘 정가 그대로** 구매하고 — 가격 인상·추가 부담은 전혀 없어요.
//   (그때 수수료는 구매자가 아니라 쇼핑몰이 한끼에 주는 거예요.)
//
//   ⚠️ 제휴를 «시작하면» 앞 문장을 사실에 맞게 고쳐야 한다 — ⛔「받지 않아요」를 그대로 두면 그게 거짓이 된다.
//      예: *"한끼는 쿠팡 파트너스 활동의 일환으로 이에 따른 일정액의 수수료를 제공받습니다.
//           구매자는 늘 정가 그대로 구매하고 추가 부담은 없어요."*
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(APP, p), 'utf8')

// 제휴 링크의 «꼬리표» — 이게 붙으면 돈을 받는다는 뜻이다
const MARKERS = [
  'link.coupang.com',   // 쿠팡 파트너스 단축 링크
  'lptag=',             // 쿠팡 파트너스 추적값
  'subId=',             // 쿠팡 파트너스 하위 추적값
  'partners.coupang',   // 파트너스 도메인
  'affiliate',          // 일반
  'utm_source=hankki',  // 우리 추적값(제휴로 쓰면)
]
// 고지가 살아 있는지 볼 말 — 문구를 통째로 안 보고 «핵심 낱말»로 본다(문장은 다듬을 수 있다)
const NOTICE = ['수수료', '제휴']

const src = [
  'src/data/curation.js',
  'src/screens/ShopScreen.jsx',
  'src/screens/RecipeDetailScreen.jsx',
].map((p) => [p, read(p)])

console.log('\n── 제휴 고지 ──')

// 주석을 «통째로» 걷어낸다 — ⛔줄머리만 보면 JSX 주석 `{/* … */}` 의 가운뎃줄이 안 걸러져
//   **설명 주석이 스스로 검사에 걸린다**(2026-08-03 만들자마자 실제로 그랬다).
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

const hits = []
for (const [path, text] of src) {
  const body = stripComments(text)
  for (const m of MARKERS) if (body.includes(m)) hits.push(`${path} → ${m}`)
}

if (!hits.length) {
  console.log('  ok  제휴 링크 0개 — 고지 의무 없음 (지금 상태)')
  console.log('     👉 쿠팡 파트너스에 가입하면 이 검사가 «자동으로» 고지를 요구한다.\n')
  process.exit(0)
}

// 제휴 링크가 있다 → 고지가 화면에 살아 있어야 한다
const shopUi = read('src/screens/ShopScreen.jsx')
  .split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
const hasNotice = NOTICE.every((w) => shopUi.includes(w))

console.log(`  🔗 제휴 링크 ${hits.length}건 — ${hits.slice(0, 5).join(' · ')}`)
if (hasNotice) {
  console.log('  ok  제휴 고지 문구가 화면에 있다\n')
  process.exit(0)
}

console.log('\n  ✗ ⛔⛔ **제휴 링크가 있는데 대가성 고지가 화면에 없다 — 배포 차단**')
console.log('     공정위 추천·보증 심사지침상 «법적 의무»고, 쿠팡 심사도 그 문구 스크린샷을 요구한다.')
console.log('     👉 이 파일 맨 위 §되살릴 문구를 `ShopScreen.jsx` 「주부의 장바구니」 머리 아래에 다시 넣을 것.')
console.log('     ⚠️ 그대로 붙이지 말 것 — 「수수료를 받지 않아요」는 제휴를 시작하면 «거짓»이 된다.\n')
process.exit(1)
