// 🧊🔴 냉장고 유통기한 — «장보기 탭 점 · 냉장고 ②»가 세는 것 (창업자 확정 2026-09-06)
//
// 📮 창업자 = *"우리 앱 유통기한 알람도 가능해?"* → 처음엔 홈 맨 위 한 줄(hold/유통기한홈줄-0906)을 냈는데
//    *"홈 맨 위에 줄이 셋(클라우드·백업·유통기한)이면 지저분해"* → 시안 여섯 장 →
//    *"맨 마지막장 시안으로 해줘 가져오기 장보기에 빨간 점_냉장고 2개"* = **탭바 점 ＋ 냉장고 탭 숫자**로 확정.
// ⭐ 세 갈래 중 ① = 앱을 «열었을 때» 알려준다. 서버 없음 · 폰 알림 아님.
//    ② 폰 푸시(앱 꺼져도 울림)는 유통기한 데이터가 서버로 가야 해서 privacy.html·데이터 보안 신고가 같이 바뀐다 → 명의 이전 뒤 판정.
//    ③ 「정한 날짜에 폰이 알아서」 웹 표준(Notification Triggers)은 크롬이 개발 중단(공식 문서 «no longer pursued»).
//
// 잣대 = 냉장고 화면의 D-3 칩(`PantryView.jsx` expiryChip · exp-soon)과 «같은 3일». 두 화면이 다른 날을 말하면 안 된다.
//   · 지난 것도 센다 — 「2일 지남」인 재료가 냉장고에 그대로 있는 게 이 기능이 막으려는 일이다(기획-노트 3번).
//   · 유통기한 없는 재료(expiry null)는 안 센다.
// ⭐ «상태 표시»다 — 닫기 없음. 임박·지난 재료가 냉장고에 남아 있는 동안 켜져 있고, 지우면(✕) 꺼진다.
//    (창업자 2026-09-06 *"3일내내 알려주는거야??"* → 그렇다. 팝업이 아니라 점이라 재촉이 아니다.)
//    냉장고 재료함은 이미 기한 가까운 순(`PantryView.sorted`)이라 탭을 열면 그 재료가 맨 위다.

export const EXPIRY_SOON_DAYS = 3

// 🔢 오늘 0시 기준 남은 날 — `PantryView.daysLeft` 와 같은 셈. 음수 = 지났다.
export function expiryDaysLeft(expiry, now = new Date()) {
  if (!expiry) return null
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const d = new Date(expiry + 'T00:00:00'); d.setHours(0, 0, 0, 0)
  if (Number.isNaN(d.getTime())) return null
  return Math.round((d - today) / 86400000)
}

// 🧊 임박·지남 재료 — 급한 순(지난 것 먼저 · 그다음 D-0, D-1 …)
export function expiringPantry(pantry = [], now = new Date()) {
  return pantry
    .map((p) => ({ ...p, left: expiryDaysLeft(p.expiry, now) }))
    .filter((p) => p.left !== null && p.left <= EXPIRY_SOON_DAYS)
    .sort((a, b) => a.left - b.left)
}

// 🔴 점·숫자가 세는 개수 — 임박(D-3 이내)＋지난 재료. 0 이면 점이 «없다».
export const pantryExpiryCount = (pantry = [], now = new Date()) => expiringPantry(pantry, now).length
