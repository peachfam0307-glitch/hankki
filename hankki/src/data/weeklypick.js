// 🗓 「이번 주 픽」이 도는 규칙 — **순수 계산만** 담는다.
//
// ⚠️⚠️ **왜 `curation.js` 에서 갈라 냈나** — 그 파일은 `import.meta.glob`(Vite 전용)을 쓴다.
//    배포 게이트는 **노드만으로** 돌아야 하는데(2026-08-03·08-07 에 두 번 데였다),
//    노드가 그 파일을 열면 `glob is not a function` 으로 죽는다.
//    ⭐ 그래서 «돌리는 규칙»만 여기 두고 제품 목록은 **인자로 받는다** → 게이트가 그대로 검사할 수 있다.
//
// ⛔ 이 파일에 import 를 늘리지 말 것. 늘리는 순간 게이트가 또 못 읽는다.

// 에폭 주차 — 해가 바뀌어도 이어지고 매주 정확히 1씩 오른다.
// ⛔ 연중 주차로 세면 12월 말~1월 초에 튄다.
export const weekNo = (ymd) => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 604800000)

// 이번 주 픽 = ①이번 주 레시피가 쓰는 제품 ②모자라면 주차로 밀어 채운다.
//   matched = ①의 결과(호출부가 넘긴다) · products = 전체 제품
export const pickRotate = ({ products = [], matched = [], today = '', n = 4 } = {}) => {
  const 담김 = new Set(matched.map((p) => p && p.name).filter(Boolean))
  const 나머지 = products.filter((p) => p && !담김.has(p.name))
  if (!나머지.length) return matched.slice(0, n)
  // ⭐⭐ **한 주에 `n` 칸씩 민다** — 한 칸씩 밀면 4개 중 3개가 다음 주에도 그대로 남는다.
  //    창업자가 *"매주 꼭 바꿔줘"* 라고 한 건 «다른 게 뜬다»는 뜻이지 «하나만 바뀐다»가 아니다.
  //    🔢 실측 = 한 칸씩일 때 앞뒤 주가 3개씩 겹쳤다(2026-08-10 게이트 미리보기에서 드러났다).
  // ⚠️ `%` 는 음수에서 음수를 내니 한 번 더 더해 양수로 만든다(1970 이전 날짜·이상값 방어).
  const off = today ? ((((weekNo(today) * n) % 나머지.length) + 나머지.length) % 나머지.length) : 0
  return [...matched, ...나머지.slice(off), ...나머지.slice(0, off)].slice(0, n)
}
