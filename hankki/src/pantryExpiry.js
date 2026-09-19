// 🧊🔴 냉장고 유통기한 — «장보기 탭 점 · 냉장고 ②»가 세는 것 (창업자 확정 2026-09-06)
//
// 📮 창업자 = *"우리 앱 유통기한 알람도 가능해?"* → 처음엔 홈 맨 위 한 줄(hold/유통기한홈줄-0906)을 냈는데
//    *"홈 맨 위에 줄이 셋(클라우드·백업·유통기한)이면 지저분해"* → 시안 여섯 장 →
//    *"맨 마지막장 시안으로 해줘 가져오기 장보기에 빨간 점_냉장고 2개"* = **탭바 점 ＋ 냉장고 탭 숫자**로 확정.
// ⭐ 세 갈래 중 ① = 앱을 «열었을 때» 알려준다. 서버 없음 · 폰 알림 아님.
//    ② 폰 푸시(앱 꺼져도 울림) — ✅ [2026-09-19 창업자 확정 «얹기»] 서버로 «안» 보낸다. 아래 거울쓰기() 가 임박 재료의 «이름·유통기한»만
//       폰 캐시(hankki-shared)에 적어 두고, 월·수·토 알림을 그릴 때 sw.js 가 그걸 읽어 본문에 한 줄 얹는다. privacy.html·데이터 보안 신고 «안» 바뀐다.
//       ⛔ 「매일 냉장고 봐」 신호는 못 쓴다 — 크롬은 푸시 받고 알림 안 띄우면 「This site has been updated…」를 대신 띄운다(열람 2026-09-19).
//       📄 설계 = docs/알림-설계-2026-09-19.md 🧊 절 · 재현판 = scripts/_repro-유통기한얹기-0920.mjs
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

// ═══════════════════════════════════════════════════════════════════
// 🔔🧊 **알림에 «얹기»** (창업자 확정 2026-09-19 *"ㄱㄱ 얹기로 가 내일 붙여"* · 설계 관문 통과)
//
// 거울 = 폰 캐시(`hankki-shared` 의 `pantry-expiry`)에 **이름·유통기한 두 칸만**. ⛔사진·메모·수량·id 는 안 넣는다(잠금 화면에 뜨는 글이다).
// ⭐ 남은 날은 거울에 «안» 적는다 — 금요일에 적고 월요일에 읽으면 낡는다. 그리는 «순간» sw 가 expiringPantry 로 다시 센다.
// ⭐ 거울 글자가 «지난번과 같으면» 안 쓴다 — store 는 모든 변화마다 저장하지만 냉장고는 하루 0~3번 바뀐다(규모 검토).
export const 거울칸 = 'pantry-expiry'
export const 거울캐시 = 'hankki-shared'   // sw.js 의 SHARE_CACHE 와 «같은» 이름 — 두 곳에 적지만 재현판이 같은지 잰다
let 마지막거울 = null

/** 냉장고 → 거울에 담을 것 (이름·유통기한만 · 유통기한 없는 재료는 뺀다) */
export function 거울고르기(pantry = []) {
  return (Array.isArray(pantry) ? pantry : [])
    .filter((p) => p && p.expiry && typeof p.name === 'string')
    .map((p) => ({ name: String(p.name).slice(0, 30), expiry: String(p.expiry).slice(0, 10) }))
}

/** 🪞 거울 쓰기 — 저장 자리 «하나»(store.쓰기)에서 매번 부른다. 실패해도 조용하다(냉장고는 이미 저장됐다). */
export async function 거울쓰기(pantry = []) {
  try {
    if (typeof caches === 'undefined') return false
    const 글 = JSON.stringify(거울고르기(pantry))
    if (글 === 마지막거울) return false
    const c = await caches.open(거울캐시)
    await c.put(거울칸, new Response(글, { headers: { 'Content-Type': 'application/json' } }))
    마지막거울 = 글
    return true
  } catch { return false }
}

/** 📨 거울 → 알림에 얹을 한 줄. 임박 0이면 null. `now` 는 «그리는 순간»이어야 한다. */
export function 거울문장(거울 = [], now = new Date()) {
  const 급한것 = expiringPantry(거울, now)
  if (!급한것.length) return null
  const [첫] = 급한것
  const 나머지 = 급한것.length - 1
  const 꼬리 = 나머지 > 0 ? ` 외 ${나머지}개` : ''
  // ⛔ 조사 「이/가」를 안 붙인다 — 받침에 따라 갈려서 「두부이(가)」 꼴이 된다. 조사 없이도 뜻이 선다.
  if (첫.left < 0) return `냉장고의 ${첫.name}${꼬리} 지났어요`
  if (첫.left === 0) return `냉장고의 ${첫.name}${꼬리} 오늘까지예요`
  return `냉장고에 ${첫.name}${꼬리} ${첫.left}일 남았어요`
}

/** sw 가 부른다 — 거울을 읽어 한 줄. 못 읽으면 null(원래 알림 그대로). */
export async function 거울읽어문장(now = new Date()) {
  try {
    if (typeof caches === 'undefined') return null
    const c = await caches.open(거울캐시)
    const r = await c.match(거울칸)
    if (!r) return null
    return 거울문장(await r.json(), now)
  } catch { return null }
}
