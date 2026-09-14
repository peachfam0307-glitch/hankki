// 🔐🍎 **앱 안 로그인 부품 다리** — 아이폰(Capacitor) 앱 안에서 구글·애플 로그인을 «부품»으로 하고,
//   그 열쇠(idToken)로 웹 층(firebase/auth)에도 로그인해 `cloud.js` 가 «그대로» 돌게 한다. (2026-09-08 · 큰 틀 4 · 열쇠 갈래 ⓑ)
//
// 왜 = 앱 속 웹 화면(WKWebView)에서 구글 팝업 로그인은 «확실히» 막힌다(구글 원문 disallowed_useragent · 계획 §8-b).
//   ＋ 애플 심사 4.8 = 제3자 로그인(구글)을 쓰면 「Apple 로 로그인」을 «같이» 둬야 한다.
//
// 열쇠 갈래 ⓑ (창업자 2026-09-08 "ⓑ로 가") = 구글 유저는 지금 그대로 «구글번호» · 애플 유저는 «apple_애플번호».
//   ⭐ 이미 있는 유저 칸(users/{구글번호})을 손 안 댄다 · 보험 ①(파이어베이스를 떠나도 번호 유지)도 그대로.
//   ⚠️ 같은 사람이 안드로이드=구글·아이폰=애플로 들어오면 칸이 둘 → 아이폰에서도 구글 단추를 «먼저» 둔다.
//
// 부품은 `window.Capacitor.Plugins.FirebaseAuthentication` 으로 부른다 — 웹 번들에 npm 부품을 «안» 넣는다(거울과 같은 방식).
//   근거 = @capacitor/ios JSExport.swift:77-79 (네이티브 부품마다 window.Capacitor.Plugins[이름] 을 심는다).
//   원문 = @capacitor-firebase/authentication 8.5.1 docs/firebase-js-sdk.md — 구글 = credential(idToken) ·
//          애플 = signInWithApple({ skipNativeAuth: true }) → OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce })
//
// 재현판 = scripts/_repro-앱로그인-0908.mjs

/** 아이폰(또는 안드로이드) «앱» 안인가 */
export function 앱안인가 (w = (typeof window !== 'undefined' ? window : null)) {
  try { return !!(w && w.Capacitor && w.Capacitor.isNativePlatform && w.Capacitor.isNativePlatform()) } catch { return false }
}

/** 앱 안 로그인 부품. 없으면 null(＝부품을 안 넣은 옛 껍데기). */
export function 로그인부품 (w = (typeof window !== 'undefined' ? window : null)) {
  try { return (w && w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.FirebaseAuthentication) || null } catch { return null }
}

// 🔑 공급자별 열쇠 접두 — 새 공급자(카카오 등)가 오면 여기 한 줄
export const 열쇠접두 = { 'google.com': '', 'apple.com': 'apple_' }
const 공급자순서 = ['google.com', 'apple.com']   // 둘 다 붙어 있으면 구글이 이긴다(이미 있는 칸을 지킨다)

/**
 * 로그인한 사람의 «우리 열쇠»를 만든다 — `{ 번호, 공급자 }`. 못 만들면 null.
 * ⛔ `user.uid`(Firebase UID)는 쓰지 않는다 — 보험 ①(cloud.js 구글번호 주석).
 */
export function 열쇠 (user) {
  const pd = (user && user.providerData) || []
  for (const 공급자 of 공급자순서) {
    const p = pd.find((x) => x && x.providerId === 공급자 && x.uid)
    if (p) return { 번호: 열쇠접두[공급자] + p.uid, 공급자 }
  }
  return null
}

/** 규칙(firestore.rules)이 같은 열쇠를 만드는지 재현판이 대조할 때 쓴다 — 규칙 원문과 «같은 식» */
export function 규칙열쇠 (token) {
  const f = token && token.firebase
  if (!f) return null
  if (f.sign_in_provider === 'google.com') return f.identities?.['google.com']?.[0] || null
  if (f.sign_in_provider === 'apple.com') { const a = f.identities?.['apple.com']?.[0]; return a ? 'apple_' + a : null }
  return null
}

/**
 * 앱 안에서 로그인한다 → 웹 층 `user` 를 돌려준다.
 * @param {{ A: any, auth: any, 공급자?: 'google.com'|'apple.com', 부품?: any }} p  A = firebase/auth 모듈
 */
export async function 앱으로로그인 ({ A, auth, 공급자 = 'google.com', 부품 = 로그인부품() }) {
  // ⛔ 부품이 없으면 팝업으로 «떨어지지 않는다» — WKWebView 팝업은 확실히 죽고, 그건 조용한 실패가 된다.
  if (!부품) throw new Error('이 앱 판에선 로그인이 안 돼요. 앱을 업데이트한 뒤 다시 해주세요')
  let 자격
  if (공급자 === 'apple.com') {
    const r = await 부품.signInWithApple({ skipNativeAuth: true })
    const idToken = r?.credential?.idToken
    const nonce = r?.credential?.nonce
    if (!idToken || !nonce) throw new Error('Apple 로그인 정보를 못 받았어요')
    자격 = new A.OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce })
  } else {
    const r = await 부품.signInWithGoogle()
    const idToken = r?.credential?.idToken
    if (!idToken) throw new Error('구글 로그인 정보를 못 받았어요')
    자격 = A.GoogleAuthProvider.credential(idToken)
  }
  try {
    const r = await A.signInWithCredential(auth, 자격)
    return r.user
  } catch (e) {
    // 반쪽 상태(부품만 로그인·웹 층은 안 됨)를 남기지 않는다
    try { await 부품.signOut() } catch { /* noop */ }
    throw e
  }
}

/** 앱 층도 같이 로그아웃 — 안 하면 다음 켤 때 부품이 «로그인돼 있다»고 우기고 웹 층은 아니다 */
export async function 앱로그아웃 (부품 = 로그인부품()) {
  if (!부품) return false
  try { await 부품.signOut(); return true } catch { return false }
}

/** 앱 층에서 계정 삭제(애플 5.1.1(v)) — 웹 층 `deleteUser` 와 짝으로 부른다(큰 틀 6) */
export async function 앱계정지우기 (부품 = 로그인부품()) {
  if (!부품) return false
  await 부품.deleteUser()
  return true
}
