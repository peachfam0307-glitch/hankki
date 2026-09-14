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

// 그 계절이 지금 제철인가 — **전환기 14일을 «포함»한다**(9/1~9/14 는 여름·가을 «둘 다» 참).
// ⭐ 스티커 정렬처럼 「지난 계절도 아직 손에 닿게」 두는 자리에 쓴다.
export const isSeason = (s, now) => seasonsNow(now).includes(s)

// 🍂🍂 **지금이 «딱» 그 계절인가 — 전환기 겹침을 «안» 센다.**
//    📮 창업자 확정 2026-08-29 = *"**9월1일에 빼야지 가을시작이니까.**"*
//    ⭐ 왜 따로 필요한가 = 레꾸자랑 «카드 스킨»은 뽑기 풀에서 아예 빠지는 «한정»이라
//       9/1 에 가을이 시작됐는데 바다·물결 카드가 2주 더 뽑히면 **계절이 바뀐 느낌이 안 난다.**
//    ⛔ `isSeason` 을 이 자리에 쓰면 9/14 까지 여름이 남는다(2026-08-29 실측으로 확인한 값).
//    ⛔ **스티커·서랍 정렬엔 쓰지 말 것** — 거기선 겹침이 «일부러» 넣은 배려다
//       (창업자 2026-07-30 *"여름에 준비한 아이템들은 며칠 못하고…"*).
export const isPeakSeason = (s, now) => seasonsNow(now)[0] === s

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

// 🗓 되풀이 창 — **해마다 같은 날짜에 다시 열린다.**
//
// ⚠️ 왜 `MM-DD` 인가: `to: '2026-11-30'` 처럼 절대 날짜로 닫으면 **2027년 9월엔 안 열린다.**
//    첫 공개는 절대 날짜(`isReleased`)로, 여닫는 창은 월-일로 — 두 가지가 필요하다.
// ⚠️ 연말을 넘는 창도 된다(설날처럼 `['12-15','01-10']`) — `open > close` 면 넘어가는 것으로 본다.
export function inWindow([open, close], now = new Date()) {
  const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return open <= close ? md >= open && md <= close : md >= open || md <= close
}

// 계절·이벤트 컷을 **지금 뽑기 풀에 넣어도 되나** — 첫 공개일이 지났고 + 창 안에 있을 때만.
// (스티커는 철이 지나도 안 숨기지만 **카드는 창 밖이면 빠진다** — 한정 수집감. 성질이 다르다.)
export const inCardWindow = (set, now) => isReleased(set.from, now) && inWindow(set.win, now)
