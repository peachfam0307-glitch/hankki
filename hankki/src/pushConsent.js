// 🔔🔐 **폰 알림 «허락»** — 브라우저 권한창을 띄우기 «전에» 우리 시트로 한 번 묻는다. (2026-09-19)
//
// 📮 창업자 = *"장바구니담을때랑 냉장고재료넣을떄 좋아"* (권한 묻는 자리 확정)
// 📄 설계 = `docs/알림-설계-2026-09-19.md` (설계 관문 통과판)
//
// ⛔⛔ **왜 우리 시트를 «먼저» 세우나 — 브라우저 권한창은 «한 번뿐인 화살»이다.**
//    한 번 「차단」을 누르면 그 유저는 **영영 못 부른다**(우리가 다시 띄울 길이 없다).
//    그런데 담는 «순간» 권한창이 뜨면 담기가 끊기고, 놀란 유저가 차단을 누른다.
//    ✅ 그래서 담기가 «끝난 직후» 우리 시트로 묻고, 「예」 한 사람에게만 진짜 권한창을 띄운다.
//       우리 시트에서 거절하는 건 **손해가 0** 이다 — 화살을 안 쓴 것이다.
//
// 🍎⛔ **아이폰(Capacitor · WKWebView)에는 시트를 «아예 안 띄운다».**
//    🔢 근거 = WKWebView 엔 서비스워커·PushManager 가 없다(열람 2026-09-19).
//       iOS 의 Push API 는 「사파리 → 공유 → 홈 화면에 추가」한 PWA 전용이다.
//    ⛔ 거기서 시트를 띄우면 유저가 「알림 받을래요」를 눌렀는데 **영영 안 온다** — 거짓 약속이 된다.
//       그리고 «조용히» 실패해서 우리는 보낸 줄 안다. 아이폰은 2판(APNs)에서 따로 간다.
//
// ⛔ 이 파일은 화면을 모른다 — 시트(`components/PushConsentSheet.jsx`)가 이벤트를 받아 그린다.
//    (`aiConsent.js` 와 «같은 꼴»이다 — 새 장치를 만들지 않는다 · 절대원칙 35)
// 🔒 재현판 = `scripts/_repro-알림허락-0919.mjs`

export const 알림칸 = 'hankki:push:consent'
export const 알림이벤트 = 'hankki:pushconsent'
export const 알림바뀜 = 'hankki:pushconsent:changed'

const w = () => (typeof window !== 'undefined' ? window : null)

/** 📱 이 기기가 웹 푸시를 «할 수 있나» — 셋이 다 있어야 한다.
 *  ⛔ 못 읽으면 false(안 된다) 로 본다 — 안 되는 기기에 시트를 띄우는 쪽이 더 나쁘다. */
export function 푸시가능() {
  try {
    const win = w()
    if (!win) return false
    if (아이폰앱인가()) return true   // 🍎 아래 참고 — 아이폰 «앱»은 웹 푸시가 아니라 애플 길(APNs)로 받는다
    return 'serviceWorker' in win.navigator && 'PushManager' in win && 'Notification' in win
  } catch { return false }
}

/** 🍎 아이폰 «앱» 안인가 — 2026-09-20 딸 폰 실측: 앱 속 웹뷰엔 serviceWorker·PushManager·Notification 이 «셋 다 없다».
 *  ⛔ 그래서 위 잣대로는 아이폰이 영원히 false 였다(＝시트를 아예 안 띄웠다). 애플 길로 받으니 «된다»가 맞다.
 *  ⭐ 여기선 window 만 본다 — 플러그인을 부르지 않는다(이 파일은 네트워크·플러그인을 모른다는 원칙 그대로). */
export function 아이폰앱인가() {
  try {
    const C = w()?.Capacitor
    return !!(C && C.isNativePlatform && C.isNativePlatform() && C.getPlatform && C.getPlatform() === 'ios')
  } catch { return false }
}

export const 아이폰권한칸 = 'hankki:push:iosperm'   // 애플 권한창의 답을 적어 둔다 — 아이폰엔 Notification.permission 이 없다

/** 🔔 브라우저가 이미 정한 답 — 'granted' · 'denied' · 'default'(아직 안 물음) */
export function 브라우저권한() {
  try {
    // 🍎 아이폰 앱엔 Notification 이 «없다» → 애플 권한창의 답을 우리가 적어 둔 것을 읽는다(pushNative 가 적는다).
    //    ⛔ 아이폰도 한 번 거절하면 앱이 다시 못 묻는다(폰 설정에서만) — 웹의 'denied' 와 같은 뜻이라 같은 글자를 쓴다.
    if (아이폰앱인가()) {
      const v = localStorage.getItem(아이폰권한칸)
      return v === 'granted' || v === 'denied' ? v : 'default'
    }
    return 푸시가능() ? w().Notification.permission : 'denied'
  } catch { return 'denied' }
}

/** 'yes' · 'no' · null(아직 안 물었다) — «우리 시트»의 답이다(브라우저 권한과 다른 것) */
export function 알림동의상태() {
  try { const v = localStorage.getItem(알림칸); return v === 'yes' || v === 'no' ? v : null } catch { return null }
}

/** 답을 폰에 적는다(null 이면 지운다) ＋ 화면에 알린다 */
export function 알림동의쓰기(v) {
  try { v ? localStorage.setItem(알림칸, v) : localStorage.removeItem(알림칸) } catch { /* noop */ }
  try { w()?.dispatchEvent(new CustomEvent(알림바뀜, { detail: v })) } catch { /* noop */ }
}

/** ❓ 지금 물어도 되나 — 하나라도 걸리면 «안 묻는다».
 *  ⛔ 성가시게 하지 않는 것이 이 함수의 일이다. 알림이 잦으면 앱을 지우고, 삭제율은 Play 순위를 깎는다. */
export function 물어도되나() {
  if (!푸시가능()) return false                    // 🍎 아이폰·옛 브라우저 — 거짓 약속을 하지 않는다
  const 권한 = 브라우저권한()
  if (권한 === 'granted') return false             // 이미 켰다
  if (권한 === 'denied') return false              // ⛔화살을 이미 썼다 — 다시 못 띄운다
  if (알림동의상태() !== null) return false        // 우리 시트에 이미 답했다(예·아니오 둘 다)
  return true
}

let 대기 = null   // 이미 묻는 중이면 «같은 약속»을 돌려준다 — 시트가 두 개 뜨지 않는다

/**
 * 🙋 담기가 «끝난 직후» 부른다 → Promise<boolean>(진짜로 켜졌나).
 *  · 물을 자리가 아니면 바로 false (⛔아무 일도 안 일어난다 — 담기를 방해하지 않는다)
 *  · 시트에서 「예」 → 그때서야 브라우저 권한창을 띄운다
 *  · 시트가 없는 자리(재현판·옛 화면)에서 부르면 = «못 물었다» → false (⛔권한창을 띄우지 않는다)
 */
export function 알림허락받기({ 다시묻기 = false } = {}) {
  // ⚙️ 설정에서 「켜기」를 누르면 «우리 시트 답이 no 여도» 다시 묻는다(aiConsent 의 다시묻기와 같은 꼴).
  //    ⛔ 브라우저가 «차단»이면 다시묻기여도 못 묻는다 — 그건 폰 설정에서만 풀린다(부르는 쪽이 안내한다).
  const 다시 = 다시묻기 && 푸시가능() && 브라우저권한() !== 'denied' && 브라우저권한() !== 'granted'
  if (!다시 && !물어도되나()) return Promise.resolve(false)
  if (대기) return 대기
  // ⛔⛔ 「묻는 중」 표는 약속을 «만들고 난 뒤»에 풀어야 한다 —
  //    2026-09-08 에 aiConsent 가 이걸 거꾸로 해서 «첫 호출 뒤로 영영 묻지 않았다». 같은 꼴을 그대로 따른다.
  let 풀기 = null
  const 약속 = new Promise((r) => { 풀기 = r })
  대기 = 약속
  let 끝났나 = false
  const 끝 = async (v) => {
    if (끝났나) return
    끝났나 = true
    if (대기 === 약속) 대기 = null
    if (v !== 'yes') { if (v === 'no') 알림동의쓰기('no'); 풀기(false); return }
    // ✅ 여기서만 «진짜» 권한창을 띄운다 — 우리 시트에서 「예」 한 사람뿐이다
    let 결과 = 'denied'
    try { 결과 = await w().Notification.requestPermission() } catch { 결과 = 'denied' }
    알림동의쓰기(결과 === 'granted' ? 'yes' : 'no')
    풀기(결과 === 'granted')
  }
  let 받은시트 = false
  try {
    const win = w()
    if (!win) { 끝(null); return 약속 }
    win.dispatchEvent(new CustomEvent(알림이벤트, { detail: { 받았다: () => { 받은시트 = true }, 답: 끝 } }))
  } catch { 끝(null); return 약속 }
  // 이벤트 리스너는 «동기»로 돈다 — 여기까지 왔는데 아무도 안 받았으면 시트가 없는 자리다
  if (!받은시트) 끝(null)
  return 약속
}
