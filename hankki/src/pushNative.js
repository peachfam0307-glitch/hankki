// 🔔🍎 아이폰 «앱» 알림 — 애플 길(APNs)로 받는다. (2026-09-20)
//
// ⛔⛔ 왜 따로 있나 — 2026-09-20 20:32 딸 아이폰 실측 = `푸시 API: 없음 · Notification 없음`.
//    앱 속 웹뷰엔 서비스워커가 «아예» 없다 → 갤럭시가 쓰는 웹 푸시(`pushSubscribe.js`)가 아이폰 앱에선 못 돈다.
//    ⭐ 그래서 «받는 쪽»만 다르다. 보내는 쪽(워커)·문구(앱이 구운 schedule.json)·때는 갤럭시와 «같은 것»을 쓴다.
//
// ⭐ 웹과 다른 점 딱 셋
//   ① 주소가 아니라 «기기 토큰»(16진 64자)을 워커에 준다
//   ② 글자가 «푸시에 실려» 온다 — 가져올 서비스워커가 없으니까(워커의 아이폰하나() 참고)
//   ③ 권한 답을 우리가 적어 둔다 — 아이폰 웹뷰엔 Notification.permission 이 없다
//
// ⛔⛔ 부품은 `window.Capacitor.Plugins.PushNotifications` 로 부른다 — 웹 번들에 npm 부품을 «안» 넣는다.
//    📌 이건 내가 정한 게 아니라 이 저장소가 이미 쓰는 방식이다(`src/mirror.js` 23줄 · Filesystem 도 같은 꼴).
//    ⭐ 그래서 웹·갤럭시 번들은 한 글자도 안 커지고, 부품이 없는 판에서도 앱이 안 죽는다.
//    껍데기(ios-app)엔 `@capacitor/push-notifications` 8.1.2 가 깔리고 `cap sync` 가 등록한다.
// 🔒 재현판 = scripts/_repro-아이폰알림-0920.mjs

// ⛔ 워커 주소·토큰을 여기서 «다시 적지» 않는다 — 부르는 쪽(pushSubscribe)이 넘긴다.
//   🔎 왜 = 그 둘은 `ocr.js`(tesseract) 를 끌고 오는 자리에 산다. 여기서 import 하면 이 부품이
//      노드에서 못 돌아 «재현판을 못 만든다». 알림은 안 와도 화면에 아무 일도 안 나는 «조용한 실패»라
//      돌려보지 못하면 영영 모른다 → 값을 받아쓰는 쪽으로 바꿨다(베껴 쓰면 두 벌이 갈린다 · 규칙 28).
import { 아이폰앱인가, 아이폰권한칸, 알림동의쓰기 } from './pushConsent.js'  // ⭐ 확장자를 붙인다 — 재현판(node)이 이 부품을 «그대로 불러» 돌린다(favPin.js 와 같은 까닭)

const 보낸표 = 'hankki:push:iostoken'   // 워커에 «이미 보낸» 토큰 — 같은 토큰을 매번 다시 안 보낸다(KV 쓰기 아낀다)

function 부품() {
  try { return (typeof window !== 'undefined' && window.Capacitor?.Plugins?.PushNotifications) || null } catch { return null }
}

/** 애플 권한창 → Promise<'granted'|'denied'|'default'>. 답을 폰에 적어 둔다(브라우저권한() 이 읽는다). */
export async function 아이폰허락받기() {
  const P = 부품()
  if (!P) return 'default'
  try {
    // ⛔ 이미 정해진 답이 있으면 «다시 안 묻는다» — 아이폰은 한 번 거절하면 앱이 영영 못 묻는다(화살이 하나다).
    let r = await P.checkPermissions()
    if (r.receive === 'prompt' || r.receive === 'prompt-with-rationale') r = await P.requestPermissions()
    const 답 = r.receive === 'granted' ? 'granted' : r.receive === 'denied' ? 'denied' : 'default'
    try { localStorage.setItem(아이폰권한칸, 답) } catch { /* 못 적어도 된다 — 다음에 한 번 더 확인할 뿐 */ }
    return 답
  } catch { return 'default' }
}

/** 애플이 주는 기기 토큰을 «기다린다» — register() 는 답을 안 돌려주고 사건으로 알려준다. */
function 토큰기다리기(P, 초 = 12) {
  return new Promise((풀기) => {
    let 끝났나 = false
    const 마침 = (v) => { if (!끝났나) { 끝났나 = true; 풀기(v) } }
    // ⏰ 비행기 모드·애플 서버 지연이면 영영 안 온다 → 기다림에 «끝»을 둔다. 실패해도 다음에 또 한다.
    const 시계 = setTimeout(() => 마침(null), 초 * 1000)
    P.addListener('registration', (t) => { clearTimeout(시계); 마침(String(t?.value || '')) })
    P.addListener('registrationError', () => { clearTimeout(시계); 마침(null) })
    P.register()
  })
}

/** 🔁 켜져 있는 아이폰이면 토큰이 워커에 «있게» 맞춘다. Promise<boolean> */
export async function 아이폰구독맞추기({ 주소, 토큰: 앱토큰 } = {}) {
  if (!아이폰앱인가() || !주소 || !앱토큰) return false
  const P = 부품()
  if (!P) return false
  try {
    const r = await P.checkPermissions()
    if (r.receive !== 'granted') return false
    const 토큰 = await 토큰기다리기(P)
    if (!토큰 || !/^[0-9a-fA-F]{64}$/.test(토큰)) return false   // 잣대는 좁게 — 이상한 값을 워커에 안 보낸다
    let 이미 = null
    try { 이미 = localStorage.getItem(보낸표) } catch { 이미 = null }
    if (이미 === 토큰) return true
    const res = await fetch(`${주소}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hankki-token': 앱토큰 },
      // 문(production/sandbox)은 «안 보낸다» — 워커가 production 으로 잡고, 애플이 아니라고 하면 그 폰만 바꾼다.
      body: JSON.stringify({ platform: 'ios', sub: { endpoint: 토큰 } }),
    })
    if (!res.ok) return false
    try { localStorage.setItem(보낸표, 토큰) } catch { /* noop */ }
    return true
  } catch { return false }
}

/** 🙋 우리 시트에서 「좋아요」를 누른 뒤 부른다 = 애플 권한창 → 토큰 등록까지. Promise<boolean> */
export async function 아이폰알림켜기(설정) {
  const 답 = await 아이폰허락받기()
  if (답 !== 'granted') return false
  return 아이폰구독맞추기(설정)
}

/** ⚙️ 설정 「끄기」 — 토큰을 잊는다. 워커 칸은 다음 보낼 때 410 이 와서 스스로 빠진다(웹과 같은 꼴).
 *  ⛔ 애플 권한 자체는 우리가 못 내린다 — 하지만 토큰이 워커에서 빠지면 아무것도 안 온다. */
export async function 아이폰알림끄기() {
  const P = 부품()
  try { await P?.unregister() } catch { /* 못 지워도 아래 답은 no 로 남긴다 */ }
  try { localStorage.removeItem(보낸표) } catch { /* noop */ }
  알림동의쓰기('no')
  return true
}
