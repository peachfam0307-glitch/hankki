// 🔌 우리 서버(Cloudflare Worker)와 주고받는 «공통 부품» — ⛔여기엔 import 가 하나도 없다.
//
// ⭐⭐ 왜 따로 뺐나 (2026-08-19)
//   `src/ocr.js`(사진→글자)와 `src/billing.js`(결제)가 **같은 서버·같은 앱토큰·같은 기기번호**를 쓴다.
//   두 벌로 적으면 언젠가 어긋나 **401** 이 나고, 그때 「결제만 안 되는」 상태가 된다.
//   ⛔ 그리고 billing 이 ocr 을 통째로 부르면 배포 게이트(`test-billing.mjs`)가 이 파일을 못 읽는다
//      (ocr 은 tesseract 를 끌고 온다). **잎사귀로 두면 둘 다 산다.**

// ── 프록시 ────────────────────────────────────────────────
export const OCR_PROXY_URL = 'https://hankki-ocr.annyeong-hankki.workers.dev'
export const OCR_APP_TOKEN = '0VRNDSjHBhwniTzIDAbnRaJygyfGJ2K2'   // ⛔ worker 의 APP_TOKEN 과 같아야 한다

// 기기 식별자 — 유저당 무료 횟수·산 장수를 세는 열쇠. 개인정보 아님(임의 난수), 이 브라우저에만 저장.
// ⚠️⚠️ **앱을 지웠다 깔면 바뀐다** → 산 장수는 이 값으로 못 따라온다.
//   ⭐ 그래서 서버는 잔량을 «구매 토큰»에 매달고, 앱이 `listPurchases()` 로 그 토큰을 다시 들고 오면
//      새 uid 로 옮겨 준다(`ocr-proxy/worker.js` handlePurchase). **그게 이메일 없는 복원이다.**
export function deviceId() {
  try {
    let id = localStorage.getItem('hankki:did')
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('hankki:did', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

// ── 📢 AI 스캔 남은 장수 ────────────────────────────────────
// 서버(worker)가 응답에 { left: { welcome, month, paid? } } 를 실어 보낸다.
//   welcome = 🎁 웰컴 20장의 잔량(첫 1회·달이 바뀌어도 남는다)
//   month   = 웰컴을 다 쓴 뒤의 그 달 잔량
//   paid    = 💳 산 장수. ⭐**무료를 다 쓴 사람에게만** 온다.
// ⭐ note 와 달리 «읽어도 지우지 않는다» — 화면에 상시 떠 있어야 하니까.
// ⚠️ 아직 한 번도 안 써 본 사람은 서버 응답이 없다 → 웰컴 20장이 «그대로»인 게 맞으므로 그 값으로 시작한다.
export const WELCOME_FREE = 20 // ⛔ worker.js 의 LIMITS.WELCOME_FREE 와 같아야 한다
export const MONTHLY_FREE = 5 // ⛔ worker.js 의 LIMITS.PER_USER_MONTHLY 와 같아야 한다
const LEFT_KEY = 'hankki:ocrLeft'

function readLeft() {
  try {
    const v = JSON.parse(localStorage.getItem(LEFT_KEY) || 'null')
    return v && typeof v.welcome === 'number' ? v : null
  } catch {
    return null
  }
}

export function saveOcrLeft(left) {
  const w = Math.max(0, parseInt(left.welcome, 10) || 0)
  const m = Math.max(0, parseInt(left.month, 10) || 0)
  // 💳 ⛔ `paid` 가 «안 왔을 때» 0 으로 덮으면 **산 게 사라진 것처럼 보인다** → 옛 값을 그대로 둔다.
  //    («안 보냈다»와 «0장»은 다른 말이다 · 규칙 18)
  const prev = readLeft()
  const p = left.paid === undefined
    ? (prev ? prev.paid || 0 : 0)
    : Math.max(0, parseInt(left.paid, 10) || 0)
  try {
    localStorage.setItem(LEFT_KEY, JSON.stringify({ welcome: w, month: m, paid: p }))
  } catch {
    /* noop */
  }
}

// 💳 결제 확인(`billing.syncPurchases`)이 서버에서 받아온 「산 장수」를 여기에 적는다.
//   ⭐ 그래야 **사자마자** 화면 숫자가 바뀐다 — 다음 스캔까지 기다리지 않는다.
export function setOcrPaid(n) {
  const v = readLeft() || { welcome: WELCOME_FREE, month: MONTHLY_FREE }
  try {
    localStorage.setItem(LEFT_KEY, JSON.stringify({ ...v, paid: Math.max(0, parseInt(n, 10) || 0) }))
  } catch {
    /* noop */
  }
}

// 남은 장수 = { welcome, month, paid, total, unknown }
//   total   = 지금 실제로 쓸 수 있는 장수 — ⭐**웰컴 → 그 달 무료 → 💳산 장수** 순서로 쓴다
//             (worker 도 같은 순서다: 웰컴이 남으면 월 한도를 안 보고, 월까지 다 써야 산 장수를 본다)
//   unknown = 서버 응답을 아직 한 번도 못 받았다(=안 써 봤다) → 웰컴 그대로로 본다
export function getOcrLeft() {
  const v = readLeft()
  if (!v) {
    return { welcome: WELCOME_FREE, month: MONTHLY_FREE, paid: 0, total: WELCOME_FREE, unknown: true }
  }
  const paid = Math.max(0, v.paid || 0)
  const total = v.welcome > 0 ? v.welcome : (v.month > 0 ? v.month : paid)
  return { ...v, paid, total, unknown: false }
}
