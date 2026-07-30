// 🍂 제철 판정 — **한 곳에서만** 계산한다.
//
// 왜 모았나: 달력 계산이 두 군데에 따로 있었다.
//   · `DecorEditor.jsx` — 스티커 서랍에서 제철 그룹을 맨 위로 올리는 정렬
//   · `ShareDrawCard.jsx` — 여름 카드 스킨을 뽑기 풀에 넣는 판정
// 두 곳이 어긋나면 **"여름 스티커는 맨 위인데 여름 카드는 안 나오는"** 이상한 상태가 된다.
//
// ⭐ 전환기 겹침 (창업자 2026-07-30)
// 창업자: *"8월중순이면 여름에 준비한 아이템들은 정말 며칠 못하고 내년을 기약해야겠다..ㅠ"*
// 8/31 자정에 여름이 뚝 끊기면 **늦더위인데 여름 아이템이 아래로 내려가** 어색하고,
// 가을도 갑자기 들이닥치는 느낌이 된다. 그래서 **새 계절 첫 2주는 지난 계절도 함께 제철**로 둔다.
// → 여름 노출 창이 2주에서 약 4주로 늘고, 계절이 부드럽게 바뀐다.
//
// ⚠️ 스티커는 철이 지나도 **숨기지 않는다**(순서만 밀린다 — `DecorEditor.jsx` 주석 참고).
//    반면 **카드 스킨은 실제로 뽑기 풀에서 빠진다**(한정 수집감) → 전환기 겹침이 특히 여기서 크다.

// 월(1~12) → 계절. 한국 체감 기준.
export const SEASON_AT = (m) =>
  m >= 6 && m <= 8 ? 'summer'
    : m >= 9 && m <= 11 ? 'autumn'
      : (m === 12 || m <= 2) ? 'winter'
        : 'spring'

// 전환기로 볼 날짜 — 새 계절 첫 달의 1~14일
export const OVERLAP_DAYS = 14

// 지금 '제철'로 볼 계절들. **첫 원소가 지금 계절**이고, 전환기면 지난 계절이 뒤에 붙는다.
// (배열 순서 = 서랍에 보이는 순서)
export function seasonsNow(now = new Date()) {
  const m = now.getMonth() + 1
  const cur = SEASON_AT(m)
  const prev = SEASON_AT(m === 1 ? 12 : m - 1)
  // prev !== cur 이면 이 달에 계절이 막 바뀐 것 → 첫 2주는 둘 다 제철
  return now.getDate() <= OVERLAP_DAYS && prev !== cur ? [cur, prev] : [cur]
}

// 그 계절이 지금 제철인가 (카드 스킨처럼 '넣냐 마냐' 를 정할 때)
export const isSeason = (s, now) => seasonsNow(now).includes(s)

// 정렬용 순위 — 낮을수록 위. 제철이 아니면 맨 뒤(계절 없는 그룹과 같은 취급).
export function seasonRank(s, now) {
  const list = seasonsNow(now)
  const i = list.indexOf(s)
  return i < 0 ? list.length : i
}

// ⏳ 공개 시작일 — 그날이 되기 전엔 서랍에 **아예 안 나온다.**
//
// ⚠️ 이건 "철 지난 것을 숨기는 것"과 **다르다.** 철 지난 스티커는 절대 숨기지 않는다(순서만 밀린다 —
//    쓰던 걸 못 찾게 되는 게 더 나쁘다). 반면 **아직 공개 안 한 것은 유저가 쓴 적이 없으니 감춰도 잃는 게 없고**,
//    7월 서랍에 핼러윈·산타가 보이면 이상하다(창업자 2026-07-30 *"가을을 벌써 앱에 넣게??"*).
// ⭐ **한 번 공개되면 영구히 남는다** — 그래서 '월'이 아니라 **절대 날짜**로 쓴다.
//    (`from: 12` 처럼 월로 두면 이듬해 1월에 크리스마스가 다시 숨어버린다)
export function isReleased(from, now = new Date()) {
  if (!from) return true
  const [y, m, d] = String(from).split('-').map(Number)
  return now.getTime() >= new Date(y, m - 1, d).getTime()
}
