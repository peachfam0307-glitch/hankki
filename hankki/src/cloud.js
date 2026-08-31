// ☁️ 클라우드 저장 — 파이어베이스(Firestore 서울 ＋ 구글 로그인)
//
// 📮 창업자 확정 = **「프로덕션 통과 직후 1번」**(2026-08-16) · 짝 = **🅰 파이어베이스**(2026-08-20)
// ✅✅ 바닥은 **실물로 닫혔다** (2026-08-21 17:23 · 창업자 폰 · `docs/클라우드저장-실물판정-준비-2026-08-21.md` 6️⃣)
//    팝업 로그인 ✅ · 내 칸 써짐 ✅ · 남의 칸 막힘 ✅ · 구글번호 ≠ Firebase UID ✅
//
// ⭐⭐ **이 파일이 지키는 규칙 넷**
//   ① 🔑 **열쇠는 «구글 고유번호»다.** ⛔Firebase UID 를 쓰지 않는다 —
//      Firebase 를 떠나면 그 번호는 죽고, 구글 번호는 남는다(갈아타기 보험 ①).
//      ⚠️⚠️ 이름이 겹치는 함정 — 보안 규칙 안의 `request.auth.token.sub` 은 **Firebase UID** 다.
//         진짜 구글 번호는 `user.providerData` 의 `google.com` 칸에 있다.
//   ② 📦 **올리는 모양 = 백업 JSON 과 «같다».** 문서 하나하나가 백업 배열의 원소다(보험 ②).
//      → 내려받아 합치면 백업 파일이 그대로 나온다. 다른 집(D1 등)으로 옮길 때 그대로 올리면 끝.
//   ③ 🖼 **내가 찍은 사진은 안 올린다**(창업자 확정 「글자부터」). 폰 안과 백업 파일엔 그대로 남는다.
//      ⭐ 단 **자랑카드 표지는 올린다**(창업자 확정 2026-08-31 ⓑ) — 그건 «찍은 사진»이 아니라
//         앱이 그려서 만든 **완성된 표지 한 장**이라, 안 가면 다른 기기에서 «고장»으로 보인다.
//         📮 창업자 = *"레꾸자랑에서 뽑은카드로 레꾸한거는 사라졌어."* → 갈래 셋 중 **"b로 가자"**
//         🔢 실측 = 카드 한 장 **368KB**(`_repro-카드표지-0818`) → 문서 한 개 상한(900KB) 안이다.
//   ④ 🔒 **잠긴 일기는 «비번으로 잠가서» 올린다**(창업자 확정 2026-08-21).
//      → `백업용잠그기` 를 그대로 쓴다. 서버에 평문으로 눕지 않는다.
//
// ⛔ **자동으로 안 한다.** 유저가 단추를 눌러야 올라가고 내려온다.
//    왜 = 충돌을 «자동 병합»하면 유저 데이터가 조용히 덮인다. 고르게 한다(규칙 18 ⓙ).

// 🔑 아래 값은 **공개돼도 되는 값**이다 — 공식 원문:
//   *"API keys restricted to Firebase services do not need to be treated as secrets,
//     and it's safe to include them in your code or configuration files."*
//   *"API keys … are not used to control access to backend resources;
//     that can only be done with Firebase Security Rules and App Check."*
//   → 문지기는 이 열쇠가 아니라 **보안 규칙**이다(`firebase/firestore.rules`).
//   ⛔ 단 Firebase 관련 API 에만 쓴다.

// 🎴 자랑카드 표지 판정 — 화면(`Thumb.jsx`)과 «같은 잣대»를 쓴다.
//   ⭐ 이건 맨 위에서 받아도 된다(1KB · 파이어베이스와 달리 무겁지 않다).
import { 카드표지인가 } from './cardCover.js'

const 설정 = {
  apiKey: 'AIzaSyBngI2jsjsiEpvnyjV1mRm16XV3XnGjdAc',
  authDomain: 'hankki-6a768.firebaseapp.com',
  projectId: 'hankki-6a768',
  storageBucket: 'hankki-6a768.firebasestorage.app',
  messagingSenderId: '741474124689',
  appId: '1:741474124689:web:c01a03f5a669e249f91030',
}

// ⛔⛔ **맨 위에서 import 하지 않는다.** 파이어베이스는 압축해도 **167KB** 다(실측 2026-08-21).
//   로그인 안 한 사람에게 그걸 먼저 받게 하면 첫 화면이 느려진다.
//   ⭐ `import()` 로 **로그인을 누른 그 순간에** 받는다 → 안 쓰는 사람은 **0KB**.
//   ⚠️ 단 «팝업»은 누른 «그 순간»에 열려야 브라우저가 안 막는다 →
//      그래서 `미리붙기()` 로 화면이 뜰 때 몰래 받아 둔다(단추를 누르기 «전»에).
let 붙은것 = null
let 붙는중 = null

async function 붙기() {
  if (붙은것) return 붙은것
  if (붙는중) return 붙는중
  붙는중 = (async () => {
    const [앱, 인증, 창고] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])
    const application = 앱.initializeApp(설정)
    붙은것 = { A: 인증, F: 창고, auth: 인증.getAuth(application), db: 창고.getFirestore(application) }
    return 붙은것
  })()
  try {
    return await 붙는중
  } finally {
    붙는중 = null
  }
}

// 화면이 뜰 때 조용히 불러 둔다. 실패해도 조용히 넘어간다 — 단추를 누를 때 다시 시도한다.
export function 미리붙기() {
  붙기().catch(() => {})
}

// ─────────────────────────────────────────────────────────────────────────
// 👤 사람
// ─────────────────────────────────────────────────────────────────────────

// ⭐⭐ **여기가 보험 ①의 자리다.** 구글이 준 고유번호를 집는다.
//   ⛔ `user.uid`(＝Firebase UID)를 쓰면 안 된다 — 그건 Firebase 를 떠나면 죽는 번호다.
//   ⚠️ 실측(2026-08-21 창업자 폰) = 구글번호 21자 · Firebase UID 는 «다른» 값이었다.
function 구글번호(user) {
  const g = (user?.providerData || []).find((p) => p && p.providerId === 'google.com')
  return g?.uid || null
}

function 사람으로(user) {
  const 번호 = 구글번호(user)
  if (!번호) return null
  return { 번호, 이름: user.displayName || '', 사진: user.photoURL || '' }
}

// 🏷 «로그인해 둔 적이 있나»를 폰에 작게 적어 둔다.
//   ⭐⭐ 왜 = 홈 화면이 이걸 물어야 하는데, 진짜로 물으려면 파이어베이스(167KB)를 받아야 한다.
//      그러면 «로그인 안 한 사람도» 첫 화면에서 167KB 를 받는다 — 늦게 부르기가 통째로 무의미해진다.
//   ⛔ 이건 «진짜 로그인 상태»가 아니라 «표식»이다 — 로그인 판정에 쓰지 말 것. 홈 한 줄을 띄울지에만 쓴다.
const 표식칸 = 'hankki:cloud:on'
export const 로그인해뒀나 = () => { try { return localStorage.getItem(표식칸) === '1' } catch { return false } }
const 표식쓰기 = (v) => { try { v ? localStorage.setItem(표식칸, '1') : localStorage.removeItem(표식칸) } catch { /* noop */ } }

// 로그인 — ⭐팝업. TWA 안에서 «된다»는 걸 2026-08-21 창업자 폰으로 확인했다.
//   ⛔ `signInWithRedirect` 는 우리 환경(GitHub Pages)에서 깨진다 — 서드파티 쿠키를 쓴다.
export async function 로그인() {
  const { A, auth } = await 붙기()
  const r = await A.signInWithPopup(auth, new A.GoogleAuthProvider())
  const 사람 = 사람으로(r.user)
  // ⛔ 구글 번호가 없으면 «계속하지 않는다» — Firebase UID 로 대신 넣으면 보험 ①이 조용히 깨진다.
  if (!사람) throw new Error('구글 번호를 못 받았어요')
  표식쓰기(true)
  return 사람
}

export async function 로그아웃() {
  const { A, auth } = await 붙기()
  await A.signOut(auth)
  표식쓰기(false)
}

// 로그인 상태를 지켜본다. 되돌려주는 함수를 부르면 그만 본다.
export function 사람지켜보기(알림) {
  let 그만 = null
  let 죽었나 = false
  붙기().then(({ A, auth }) => {
    if (죽었나) return
    그만 = A.onAuthStateChanged(auth, (u) => 알림(u ? 사람으로(u) : null))
  }).catch(() => 알림(null))
  return () => { 죽었나 = true; if (그만) 그만() }
}

// ─────────────────────────────────────────────────────────────────────────
// 📦 모양 바꾸기 — 백업 JSON ↔ 문서들
// ─────────────────────────────────────────────────────────────────────────

// 백업 JSON 에서 «레시피·일기를 뺀 나머지» = 문서 하나(`users/{구글번호}`)에 들어간다.
const 메타칸 = ['folders', 'profile', 'shops', 'wishlist', 'shoppingList', 'pantry',
  'seedV', 'memoCleanV', 'removedSeedIds']

// 🖼 **사진 빼기** — 값이 `data:` 로 시작하는 «모든» 글자를 턴다.
//   ⭐ 칸 이름(`image`·`photo`)으로 찾지 않는 이유 = 일기 속지엔 사진 칸이 여럿이고 이름이 늘어난다.
//      «무엇이 무거운가»로 고르면 이름이 바뀌어도 안 샌다.
//   ✅ `/recipe-photos/…` 같은 «주소»는 남긴다 — 그건 글자 몇 십 자다.
//   ⚠️ 사진이 빠져도 화면은 안 깨진다 — `Thumb.jsx:38` 이 `recipe.image` 가 없으면 아이콘으로 그린다(실측).
function 사진털기(값) {
  if (typeof 값 === 'string') return 값.startsWith('data:') ? undefined : 값
  if (Array.isArray(값)) return 값.map(사진털기)
  if (값 && typeof 값 === 'object') {
    const 나온것 = {}
    for (const [k, v] of Object.entries(값)) {
      const t = 사진털기(v)
      if (t !== undefined) 나온것[k] = t
    }
    return 나온것
  }
  return 값
}

// ⭐⭐ **문서 안에는 «글자 한 덩어리»로 넣는다** (`{ j: '…JSON…' }`).
//   왜 = Firestore 는 **배열 안의 배열**을 못 담고, `undefined` 를 거부하고, 칸 이름에 규칙이 있다.
//      우리 레시피엔 꾸민 것(스티커·글씨)이 깊게 들어 있어 그 셋에 언제 걸릴지 모른다.
//   ✅ 글자 한 덩어리로 넣으면 **그 셋을 통째로 비껴간다.** 그리고 우리는 문서 «안»을 검색하지 않는다.
//   📌 보험 ②도 안 깨진다 — 그 글자가 바로 백업 JSON 의 원소다.
const 한덩어리 = 900 * 1024 // 문서 한 개 상한이 1MiB · 여유를 둔다

// 🎴 **자랑카드 표지는 «되살려» 담는다** (창업자 확정 2026-08-31 ⓑ)
//   ⭐ 위 `사진털기` 는 «무엇이 무거운가»로 고른다 — 그래서 카드까지 같이 턴다.
//      여기서 **한 칸만** 도로 넣는다. ⛔`사진털기` 자체를 느슨하게 만들지 않는다 —
//      그러면 일기 속지 사진까지 새고, 「글자부터」 확정이 조용히 깨진다.
//   📌 카드인지 아닌지는 `cardCover.js` **한 곳**이 정한다(화면과 «같은 잣대»).
function 문서로(원소) {
  const 턴것 = 사진털기(원소)
  if (턴것 && typeof 턴것 === 'object' && !Array.isArray(턴것) && 카드표지인가(원소)) 턴것.image = 원소.image
  return JSON.stringify(턴것)
}

// 문서 아이디로 쓸 수 있게 다듬는다.
//   ⛔ Firestore 문서 이름엔 `/` 를 못 쓰고 `.`·`..` 도 안 된다.
//   ⭐ 진짜 아이디는 «문서 안»에 그대로 들어 있으니, 이름이 다듬어져도 잃는 게 없다.
function 이름으로(id) {
  const s = String(id == null ? '' : id)
  if (!s || s === '.' || s === '..' || s.includes('/')) return 'x' + encodeURIComponent(s).replace(/%/g, '_')
  return s.slice(0, 1000)
}

// ─────────────────────────────────────────────────────────────────────────
// ⬆️ 올리기
// ─────────────────────────────────────────────────────────────────────────

// 🔢 **바뀐 것만 올린다** — 무료 쓰기가 하루 2만이라 매번 전부 쓰면 아깝다.
//   폰에 「지난번에 뭘 올렸나」 지문을 남겨 두고 그것과 다른 것만 쓴다.
//   ⚠️ 지문이 없으면(새 폰·앱 지웠다 깔았을 때) **전부 올린다** — 그게 맞는 동작이다.
const 지문칸 = 'hankki:cloud:sent'
const 지문읽기 = () => { try { return JSON.parse(localStorage.getItem(지문칸)) || {} } catch { return {} } }
const 지문쓰기 = (m) => { try { localStorage.setItem(지문칸, JSON.stringify(m)) } catch { /* 못 써도 다음에 전부 올릴 뿐이다 */ } }
export function 지문지우기() { try { localStorage.removeItem(지문칸) } catch { /* noop */ } }

function 지문(글) {
  let h = 5381
  for (let i = 0; i < 글.length; i++) h = ((h << 5) + h + 글.charCodeAt(i)) | 0
  return (h >>> 0).toString(36) + ':' + 글.length
}

// 500개가 한 묶음의 상한이라 여유를 두고 400으로 끊는다.
const 묶음 = 400
// ⛔⛔ **개수만으로 끊으면 안 된다** — 자랑카드 표지가 실리면서 문서 하나가 «수백 KB»가 됐다.
//   Firestore 는 **쓰기 요청 하나가 10MiB** 를 넘으면 통째로 거절한다 →
//   400 × 400KB = 160MB 라 **카드가 여러 장인 사람은 올리기가 몽땅 실패한다.**
//   ⭐ 그래서 «개수»와 «크기» 둘 다로 끊는다. 여유 있게 3MB.
//   📌 이건 ⓑ(카드 올리기)에 «딸려오는» 것이다 — 글자만 올릴 땐 한 번도 안 걸리던 자리다.
const 묶음바이트 = 3 * 1024 * 1024

async function 묶어쓰기(F, db, 할일들, 진행) {
  let 한것 = 0
  for (let i = 0; i < 할일들.length;) {
    const 조각 = []
    let 바이트 = 0
    // ⭐ 첫 한 개는 «크기와 상관없이» 넣는다 — 안 그러면 큰 문서 하나에서 영영 못 나간다.
    while (i < 할일들.length && 조각.length < 묶음) {
      const 크기 = 할일들[i].크기 || 0
      if (조각.length && 바이트 + 크기 > 묶음바이트) break
      바이트 += 크기
      조각.push(할일들[i])
      i++
    }
    const b = F.writeBatch(db)
    for (const t of 조각) {
      if (t.지울까) b.delete(t.자리)
      else b.set(t.자리, t.값)
    }
    await b.commit()
    한것 += 조각.length
    if (진행) 진행(한것, 할일들.length)
  }
  return 한것
}

/**
 * 백업 JSON 모양을 그대로 올린다.
 * ⛔ 「이 폰 판으로 클라우드를 덮는다」는 뜻이다 — 부르기 «전»에 유저가 골랐어야 한다.
 * 되돌려주는 값 = { 올린것, 지운것, 건너뛴것: [{ 어디, 왜 }], 전부인가 }
 */
export async function 올리기(백업, { 진행, 통째로, 기기, 안바뀌면건너뛰기 } = {}) {
  const { F, auth, db } = await 붙기()
  const 사람 = 사람으로(auth.currentUser)
  if (!사람) throw new Error('로그인부터 해주세요')

  const 나 = F.doc(db, 'users', 사람.번호)
  const 옛지문 = 지문읽기()
  // ⛔⛔ **[2026-08-21 재현판이 잡은 버그]** 지문이 없으면 «지운 것을 못 지운다» →
  //    새 폰에서 백업으로 되살린 뒤 올리면, 예전에 지웠던 레시피가 클라우드에 남아 **되살아난다.**
  //    ✅ 그래서 지문이 없을 때(새 폰·앱 지웠다 깜)는 **클라우드를 한 번 훑어** 남는 것을 지운다.
  //    ⚠️ 훑으면 읽기를 쓴다 — 그래서 «지문이 있을 땐 안 훑는다»(평소엔 읽기 0).
  const 훑을까 = !!통째로 || Object.keys(옛지문).length === 0
  const 새지문 = {}
  const 할일 = []
  const 건너뛴것 = []

  const 담기 = (갈래, id, 원소) => {
    const 글 = 문서로(원소)
    // ⛔ 1MiB 를 넘으면 «그 하나만» 건너뛰고 나머지는 올린다 — 통째로 실패시키지 않는다.
    if (글.length > 한덩어리) {
      건너뛴것.push({ 어디: 갈래, id, 왜: '너무 커요(' + Math.round(글.length / 1024) + 'KB)' })
      return
    }
    const 열쇠 = 갈래 + ':' + id
    새지문[열쇠] = 지문(글)
    if (옛지문[열쇠] === 새지문[열쇠]) return // 안 바뀐 것은 안 쓴다
    할일.push({ 자리: F.doc(db, 'users', 사람.번호, 갈래, 이름으로(id)), 값: { j: 글 }, 크기: 글.length })
  }

  const 레시피들 = Array.isArray(백업.recipes) ? 백업.recipes : []
  const 일기들 = Array.isArray(백업.diary) ? 백업.diary : []
  for (const r of 레시피들) if (r && r.id != null) 담기('recipes', r.id, r)
  for (const d of 일기들) if (d && d.id != null) 담기('diary', d.id, d)

  // 🗑 폰에서 지운 것은 클라우드에서도 지운다 — 안 그러면 지운 레시피가 새 폰에서 «되살아난다».
  const 지금열쇠 = new Set(Object.keys(새지문))
  const 지울자리 = new Map() // 길 → 자리 (두 번 지우지 않게)

  // ⒜ 평소 = 지문만 보고 지운다 (읽기 0)
  for (const 열쇠 of Object.keys(옛지문)) {
    if (지금열쇠.has(열쇠) || 열쇠 === 'meta') continue
    const [갈래, ...나머지] = 열쇠.split(':')
    if (갈래 !== 'recipes' && 갈래 !== 'diary') continue
    const 자리 = F.doc(db, 'users', 사람.번호, 갈래, 이름으로(나머지.join(':')))
    지울자리.set(갈래 + '/' + 이름으로(나머지.join(':')), 자리)
  }

  // ⒝ 지문이 없거나 「통째로」면 = 클라우드를 훑어 «폰에 없는 것»을 지운다
  //   ⭐ 이게 없으면 새 폰에서 지운 레시피가 되살아난다(재현판 ⑯이 잡은 자리).
  if (훑을까) {
    for (const 갈래 of ['recipes', 'diary']) {
      const 있는것 = 새지문
      const 남길 = new Set(Object.keys(있는것)
        .filter((k) => k.startsWith(갈래 + ':'))
        .map((k) => 이름으로(k.slice(갈래.length + 1))))
      const 묶 = await F.getDocs(F.collection(db, 'users', 사람.번호, 갈래))
      묶.forEach((문서) => {
        if (남길.has(문서.id)) return
        지울자리.set(갈래 + '/' + 문서.id, 문서.ref)
      })
    }
  }
  for (const 자리 of 지울자리.values()) 할일.push({ 지울까: true, 자리 })

  // 📄 meta = 문서 하나. ⭐ 레시피·일기 «개수»도 같이 넣는다 —
  //    그래야 「클라우드에 뭐가 있나」를 물을 때 **읽기 한 번**으로 끝난다(하위 문서를 안 읽는다).
  const 메타 = {}
  for (const k of 메타칸) if (백업[k] !== undefined) 메타[k] = 백업[k]
  const 메타글 = 문서로(메타)
  const 언제 = new Date().toISOString()
  // 🏷 «마지막으로 올린 기기»를 같이 적는다 — 폰·패드를 같이 쓸 때 덮어쓰기를 막는 열쇠다(안전장치 ①).
  const 메타값 = { j: 메타글, at: 언제, v: 2, n레시피: 레시피들.length, n일기: 일기들.length }
  if (기기) 메타값.기기 = 기기
  새지문.meta = 지문(메타글)

  // ⛔ 「저절로 올리기」에서 아무것도 안 바뀌었으면 **한 건도 안 쓴다.**
  //   ⭐ 이게 없으면 앱을 켤 때마다 meta 를 써서 «안 바꾼 날에도» 쓰기를 먹는다.
  //      창업자가 물은 「ⓒ가 ⓐ보다 비싼가」의 답을 여기서 0으로 만든다.
  if (안바뀌면건너뛰기 && !할일.length && 옛지문.meta === 새지문.meta) {
    지문쓰기(새지문)
    return { 건너뜀: true, 올린것: 0, 지운것: 0, 건너뛴것, 언제: '', 전부인가: true }
  }
  할일.push({ 자리: 나, 값: 메타값, 크기: 메타글.length })

  const 했다 = await 묶어쓰기(F, db, 할일, 진행)
  지문쓰기(새지문)
  return {
    올린것: 할일.filter((t) => !t.지울까).length,
    지운것: 할일.filter((t) => t.지울까).length,
    건너뛴것,
    언제,
    전부인가: 했다 === 할일.length,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ⬇️ 내려받기 · 물어보기
// ─────────────────────────────────────────────────────────────────────────

/**
 * 클라우드에 «뭐가 있나»만 본다. ⭐ 읽기 «한 번»만 쓴다(meta 문서 하나).
 * 되돌려주는 값 = { 있나, 언제, 레시피, 일기 }
 */
export async function 요약() {
  const { F, auth, db } = await 붙기()
  const 사람 = 사람으로(auth.currentUser)
  if (!사람) throw new Error('로그인부터 해주세요')
  const 문서 = await F.getDoc(F.doc(db, 'users', 사람.번호))
  if (!문서.exists()) return { 있나: false }
  const d = 문서.data() || {}
  return { 있나: true, 언제: d.at || '', 레시피: d.n레시피 || 0, 일기: d.n일기 || 0 }
}

/**
 * 클라우드에 있는 것을 **백업 JSON 모양 그대로** 내려받는다.
 * ⭐ 그래서 부르는 쪽은 `불러오기끝(data)` 에 그대로 넘기면 된다 —
 *    잠긴 일기 비번 묻기까지 **이미 있는 흐름**이 처리한다(보험 ②).
 * ⛔ 되돌려주는 값을 «앱에 바로 밀어넣지 말 것» — 덮어쓰기라 유저가 골랐어야 한다.
 */
export async function 내려받기() {
  const { F, auth, db } = await 붙기()
  const 사람 = 사람으로(auth.currentUser)
  if (!사람) throw new Error('로그인부터 해주세요')

  const [메타문서, 레시피들, 일기들] = await Promise.all([
    F.getDoc(F.doc(db, 'users', 사람.번호)),
    F.getDocs(F.collection(db, 'users', 사람.번호, 'recipes')),
    F.getDocs(F.collection(db, 'users', 사람.번호, 'diary')),
  ])
  if (!메타문서.exists()) return null

  const 풀기 = (묶음) => {
    const 나온것 = []
    묶음.forEach((문서) => {
      try {
        const v = 문서.data()
        if (v && typeof v.j === 'string') 나온것.push(JSON.parse(v.j))
      } catch { /* ⛔ 한 장이 깨져도 나머지는 살린다 */ }
    })
    return 나온것
  }

  let 메타 = {}
  try { 메타 = JSON.parse(메타문서.data().j || '{}') } catch { 메타 = {} }

  // 📦 백업 JSON 과 «같은 모양»으로 합친다 (`ProfileScreen.buildBackup` 과 칸이 같다)
  return {
    _app: 'hankki',
    _v: 2,
    _at: 메타문서.data().at || new Date().toISOString(),
    _from: 'cloud',
    recipes: 풀기(레시피들),
    diary: 풀기(일기들),
    folders: 메타.folders,
    profile: 메타.profile,
    shops: 메타.shops,
    wishlist: 메타.wishlist,
    shoppingList: 메타.shoppingList,
    pantry: 메타.pantry,
    seedV: 메타.seedV,
    memoCleanV: 메타.memoCleanV,
    removedSeedIds: 메타.removedSeedIds,
  }
}

/**
 * 클라우드에 있는 걸 통째로 지운다(계정 삭제·「클라우드 그만 쓸래요」).
 * ⛔ 폰 안의 레시피는 안 건드린다.
 */
export async function 클라우드비우기() {
  const { F, auth, db } = await 붙기()
  const 사람 = 사람으로(auth.currentUser)
  if (!사람) throw new Error('로그인부터 해주세요')
  const [레시피들, 일기들] = await Promise.all([
    F.getDocs(F.collection(db, 'users', 사람.번호, 'recipes')),
    F.getDocs(F.collection(db, 'users', 사람.번호, 'diary')),
  ])
  const 할일 = []
  레시피들.forEach((d) => 할일.push({ 지울까: true, 자리: d.ref }))
  일기들.forEach((d) => 할일.push({ 지울까: true, 자리: d.ref }))
  할일.push({ 지울까: true, 자리: F.doc(db, 'users', 사람.번호) })
  await 묶어쓰기(F, db, 할일)
  지문지우기()
  return { 지운것: 할일.length }
}

// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// 🔄 저절로 저장하기 (창업자 확정 2026-08-21 = ⓒ)
//
// 📮 창업자 = *"C하면 추가비용이 또 발생해?"* → 숫자를 재서 보여주니 *"좋아 그럼 C지."*
//    ＋ *"그래 좋아 **나도 폰 패드 같이쓰거든.**"* ← ⚠️아래 안전장치 ①이 창업자 본인 시나리오다
//
// ⭐⭐ **왜 자동인가** — 로그인만 하고 「올리기」를 안 누르면 클라우드에 아무것도 안 간다.
//    유저는 *"로그인했으니 안전하겠지"* 하고 넘어가고, 폰을 바꾸면 **아무것도 없다.**
//    📌 창업자가 백업을 두고 한 걱정과 «똑같은 모양»이다 — *"백업하는지도 모르고 폰바꿀수있어"*.
//    ✅ 그래서 **동작을 고쳐서** 그 안내가 아예 필요 없게 만든다.
//
// ⛔⛔ **「저절로 안 한다」(창업자 확정)와 안 부딪힌다** — 그건 «충돌»을 자동으로 합치지 말라는 말이다.
//    충돌은 **다른 기기가 먼저 올렸을 때만** 난다. 그때는 «안 올리고 물어본다»(아래 ①).
//
// 🛡 **안전장치 둘 — 둘 다 「안 올린다」쪽으로 판정한다(의심스러우면 안 건드린다)**
//    ① **다른 기기가 마지막이면 안 올린다** — 폰·패드를 같이 쓰면 늦게 켠 쪽이 먼저 것을 덮는다.
//       자동이라 **유저가 모르는 사이에** 일어나므로 제일 위험하다.
//    ② **클라우드 것을 아직 «안 가져왔으면» 안 올린다** — 앱을 지웠다 깔면 폰이 비어 있는데,
//       그대로 올리면 **빈 폰이 클라우드를 덮는다.**
//
// ⛔ 인터넷이 없거나 실패하면 **조용히 넘어간다** — 앱을 멈추지 않는다.
// ⛔ 못 막는 것 하나 = **실수로 지운 것은 바로 클라우드에서도 지워진다.**
//    클라우드 동기화의 본질이라 어느 앱이든 그렇다. 그래서 **백업 파일 단추를 안 없앤다.**

const 기기칸 = 'hankki:did'   // ⭐ 이미 있는 것을 쓴다(`src/ocr.js` 가 같은 칸을 쓴다 · 규칙 17)
const 받았나칸 = 'hankki:cloud:pulled' // 클라우드 것을 가져왔거나, 애초에 클라우드가 비어 있었다

function 내기기() {
  try {
    let id = localStorage.getItem(기기칸)
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36))
      localStorage.setItem(기기칸, id)
    }
    return id
  } catch { return 'anon' }
}

/** 「클라우드 것을 봤다」고 표시한다 — 가져왔거나, 클라우드가 비어 있었거나. */
export function 받았다표시() { try { localStorage.setItem(받았나칸, '1') } catch { /* noop */ } }
const 받았나 = () => { try { return localStorage.getItem(받았나칸) === '1' } catch { return false } }
export function 받았다지우기() { try { localStorage.removeItem(받았나칸) } catch { /* noop */ } }

/**
 * 앱을 켤 때 «한 번» 부른다. 조건이 하나라도 안 맞으면 **아무것도 안 하고** 왜 안 했는지만 돌려준다.
 * 되돌려주는 값 = { 했나, 왜, 올린것?, 언제? }
 *   왜 = '로그인안함' | '아직안받았다' | '다른기기' | '바뀐것없음' | '인터넷' | '됨'
 * ⛔ 여기서 절대 throw 하지 않는다 — 앱을 켜는 길목이라 던지면 앱이 안 열린다.
 */
export async function 저절로올리기(백업만들기) {
  try {
    if (!로그인해뒀나()) return { 했나: false, 왜: '로그인안함' }
    const { F, auth, db } = await 붙기()
    const 사람 = 사람으로(auth.currentUser)
    if (!사람) return { 했나: false, 왜: '로그인안함' }

    // ⛔ 안전장치 ② — 클라우드 것을 아직 안 가져왔으면 «절대» 안 올린다.
    //   (앱을 지웠다 깐 빈 폰이 클라우드를 덮는 것을 막는다)
    if (!받았나()) return { 했나: false, 왜: '아직안받았다' }

    const 문서 = await F.getDoc(F.doc(db, 'users', 사람.번호))
    const d = 문서.exists() ? (문서.data() || {}) : null

    // ⛔ 안전장치 ① — 마지막으로 올린 게 «내 기기»가 아니면 안 올린다. 부르는 쪽이 물어본다.
    if (d && d.기기 && d.기기 !== 내기기()) {
      return { 했나: false, 왜: '다른기기', 언제: d.at || '', 레시피: d.n레시피 || 0, 일기: d.n일기 || 0 }
    }

    const 백업 = await 백업만들기()
    const r = await 올리기(백업, { 기기: 내기기(), 안바뀌면건너뛰기: true })
    if (r.건너뜀) return { 했나: false, 왜: '바뀐것없음' }
    return { 했나: true, 왜: '됨', 올린것: r.올린것, 언제: r.언제 }
  } catch (e) {
    // 인터넷이 없거나 잠깐 안 될 때 — 조용히. 다음에 켤 때 또 해 본다.
    return { 했나: false, 왜: '인터넷', 탈: (e && e.code) || '' }
  }
}
// 🧪 재현판 전용 — `scripts/_repro-클라우드동기화-0821.mjs`
//
// ⭐ 왜 문을 하나 낸다 = **진짜 파이어베이스 없이** 올리기·내려받기를 통째로 돌려보기 위해서다.
//    가짜 창고를 물려 두면 «묶어 쓰기 · 지운 것 지우기 · 바뀐 것만 쓰기 · 개수 세기»가 전부 실제로 돈다.
//    ⛔ 이 문이 없으면 잴 수 있는 게 「글자 바꾸기」뿐이고, 버그는 늘 그 «바깥»에 있다.
// ⛔ 앱 코드는 이 둘을 부르지 않는다.
export function _가짜창고물리기(것) { 붙은것 = 것 }
export const _내부 = { 사진털기, 문서로, 이름으로, 지문, 메타칸, 한덩어리, 묶음, 묶음바이트, 묶어쓰기 }
