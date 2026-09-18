// 🛒🔬 파트너스 링크는 «창업자 폰에서만» 그냥 주소 (2026-09-18)
//   📮 창업자 = *"창업자 폰만 그냥 주소로 가게 해줘"*
//   ⛔ 왜 = 파트너스 링크를 누르면 그 뒤 24시간 그 기기의 개인 구매가 실적에 섞인다(공식 가이드 41쪽).
//      창업자는 그 폰으로 장을 본다. 유저는 그대로 파트너스로 가야 «우리 수익»이 난다.
//   ⭐ 정체 = 이미 있는 열쇠 `hankki:founder` 하나 (⛔새 표식을 만들지 않는다)
const 칸 = new Map()
globalThis.localStorage = {
  getItem: (k) => (칸.has(k) ? 칸.get(k) : null),
  setItem: (k, v) => 칸.set(k, String(v)),
  removeItem: (k) => 칸.delete(k),
}
const { 파트너스문 } = await import('../src/utils.js')
let 통과 = 0; const 실패 = []
const 본다 = (n, 참, 덧 = '') => { if (참) { 통과++; console.log('  ✓', n, 덧) } else { 실패.push(n); console.log('  ✗', n, 덧) } }

const 링크 = 'https://link.coupang.com/a/AbCdEf'
// ① 유저 폰 = 열쇠 없음 → 파트너스 그대로 (우리 수익)
칸.delete('hankki:founder')
본다('⭐ 유저는 파트너스 링크 그대로 간다 (수익이 난다)', 파트너스문(링크) === 링크)
// ② 창업자 폰 = 열쇠 있음 → 그냥 쿠팡 주소 (24시간에 안 걸린다)
칸.set('hankki:founder', '아무값')
본다('⭐ 창업자 폰은 그냥 쿠팡 주소로 간다', 파트너스문(링크) === 'https://www.coupang.com', 파트너스문(링크))
본다('⛔ 창업자 폰에 파트너스 주소가 «한 글자도» 안 남는다', !파트너스문(링크).includes('link.coupang'))
// ③ 파트너스가 «아닌» 주소는 둘 다 손대지 않는다
for (const u of ['https://www.coupang.com/np/search?q=두부', 'https://www.kurly.com', 'https://baemin.com']) {
  본다(`파트너스가 아니면 그대로 — ${u.slice(8, 30)}`, 파트너스문(u) === u)
}
// ④ 열쇠를 빼면 곧바로 유저 쪽으로 돌아온다 (껐다 켜는 길이 산다)
칸.delete('hankki:founder')
본다('열쇠를 빼면 다시 파트너스로 간다', 파트너스문(링크) === 링크)
// ⑤ 이상한 값에 안 죽는다
본다('빈 값·이상한 값에 안 죽는다', 파트너스문('') === '' && 파트너스문(null) === null && 파트너스문('그냥글자') === '그냥글자')

console.log(`\n${실패.length ? '⛔' : '✅'} ${통과}/${통과 + 실패.length}`)
if (실패.length) { console.log('실패:', 실패.join(' · ')); process.exit(1) }
