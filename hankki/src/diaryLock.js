// 🔒 일기 잠금 — 「그날 일기 한 장」을 비번 네 자리로 가린다.
//
// 📮📮 창업자 2026-08-15 *"일기에 나만볼 수 있는 자물쇠? 잠금기능 넣으면 좋겠어.(비번을 심는다거나등등...)"*
//    ＋ 2026-08-06 *"잠금기능도 걸어놓고 ㅋㅋ 누가 못보게"*
//
// ✅ 창업자 확정 (2026-08-15) — **자물쇠 «단추»** · 잠기는 범위 = **그날 일기 한 장**
//    ⛔ 「자물쇠 스티커를 붙이면 잠긴다」는 내가 8/6에 써둔 안인데 **구멍이 있어 접었다** —
//       다꾸하다 **예뻐서 붙였는데 잠겨** 버리고, 뗄 때마다 비번을 물어 흐름이 끊긴다.
//       📌 다꾸는 노는 것이다. 놀다가 갇히면 안 된다.
//
// ⚠️⚠️ **세기는 정직하게** (`docs/요리기록-다이어리-방향-2026-08-05.md` 8/6 세대)
//    ⛔ **「완전 암호화」라고 쓰면 거짓말이다.** 이건 **가리는 것**이지 암호화가 아니다 —
//       일기 글자는 폰 안에 그대로 있고, 폰을 뒤질 줄 아는 사람은 볼 수 있다.
//    ⭐ 우리 유저가 막고 싶은 건 국가기밀이 아니라 **가족이 슬쩍 보는 것**이다. 거기엔 충분하다.
//    ✅ 그래서 화면 문구도 「누가 슬쩍 못 보게」 까지만 쓴다. ⛔「안전하게 암호화됩니다」 금지.
//
// ⭐ 비번은 **앱에 하나**다(날마다 다르게 두면 본인이 못 외운다).
// ⭐ 푼 것은 **이 세션 동안만** 열려 있다 — 앱을 껐다 켜면 다시 잠긴다.
//    ⛔ 안 그러면 한 번 풀고 폰을 건네주는 순간 잠금이 없는 것과 같다.

const PIN_KEY = 'hankki:diaryPin' // 비번 «자국»(원문 아님)
const HINT_KEY = 'hankki:diaryHint' // 잊었을 때 볼 힌트(본인이 쓴 말)

// 이 세션에서 이미 푼 날들. ⭐ 저장하지 않는다 — 새로고침하면 사라지는 게 «맞다».
const 열린날 = new Set()

// 비번 → 자국. ⛔ 비번 자체를 저장하지 않는다(개발자도구로 그냥 보인다).
// ⚠️ crypto.subtle 은 https·localhost 에서만 있다 — 없으면 간단 자국으로 내려간다.
//    📌 그 폴백이 약한 건 맞다. 그래서 위 주석대로 «가린다»고만 말하고 «암호화»라고 말하지 않는다.
async function 자국(pin) {
  const 소금 = 'hankki-diary-v1:'
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(소금 + pin))
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    /* 폴백으로 */
  }
  let h = 5381
  const s = 소금 + pin
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return 'f' + (h >>> 0).toString(16)
}

// 비번을 정해 둔 적이 있나
export function hasPin() {
  try {
    return !!localStorage.getItem(PIN_KEY)
  } catch {
    return false
  }
}

export function getHint() {
  try {
    return localStorage.getItem(HINT_KEY) || ''
  } catch {
    return ''
  }
}

// 처음 잠글 때 비번을 심는다. hint 는 비워도 된다.
export async function setPin(pin, hint) {
  try {
    localStorage.setItem(PIN_KEY, await 자국(pin))
    if (hint != null) localStorage.setItem(HINT_KEY, String(hint).slice(0, 40))
    return true
  } catch {
    return false
  }
}

// 맞나 확인. 맞으면 true.
export async function checkPin(pin) {
  try {
    const 저장된 = localStorage.getItem(PIN_KEY)
    if (!저장된) return false
    return 저장된 === (await 자국(pin))
  } catch {
    return false
  }
}

// 📦📦 **[2026-08-16] 백업 파일 안에서 잠긴 일기를 «뒤섞어» 담는다**
//   📮 창업자 판정 = *"비번으로 뒤섞어 담는다"* (갈래 넷 중)
//   ⛔⛔ **여태 백업엔 잠긴 일기가 «그냥 글자로» 들어갔다** — 잠금 비번은 백업에 안 들어가니
//      **백업 파일을 남에게 주면 잠근 일기가 그대로 읽혔다.** 앱에서만 잠기고 파일에선 안 잠겼다.
//      (v10.92 에서 「옮긴 기기에선 잠금이 풀려요」라고 **알리기만** 해뒀다 — 알린 것이지 고친 게 아니다)
//
//   ⛔⛔⛔ **이걸 「안전하게 암호화됩니다」라고 «말하지» 않는다.** 비번이 네 자리 = 만 가지뿐이라
//      작정하고 덤비면 결국 다 넣어 볼 수 있다. **그건 우리가 없앨 수 있는 게 아니다.**
//      ⭐ 우리가 하는 건 **「한 번 넣어 보는 데 시간이 걸리게」** 만드는 것뿐이다.
//         옛날엔 파일을 열면 일기가 «글자 그대로» 보였다. 이제는 뒤섞인 글자만 보인다. 거기까지가 정직한 설명이다.
//
//   ⛔⛔ **첫 판에서 내가 지름길을 탔다 — 손으로 만든 뒤섞기(XOR)를 썼다.**
//      까닭이라고 적은 게 *"`crypto.subtle` 은 https 에서만 되는데 백업은 파일로도 열린다"* 였는데 **틀렸다.**
//      백업을 «푸는» 것도 **앱 안에서** 일어나고 우리 앱은 늘 https 다. 표준 암호를 쓸 수 있다.
//      📌 창업자가 *"니가 잘 알아본거지?"* 라고 물어서 다시 봤고, 그래서 잡았다.
//      🔢 차이가 크다 — 손수 만든 것은 만 가지를 **1초 안에** 다 넣어 본다.
//         PBKDF2 는 **한 번 넣을 때마다** 시간을 먹어서 만 가지면 **수십 분~몇 시간**이 된다.
//
//   ⭐ 방식 = **PBKDF2(SHA-256, 반복 많이) 로 비번에서 열쇠를 만들고 AES-GCM 으로 잠근다.**
//      · 소금(salt)·초기값(iv)은 봉인마다 새로 뽑아 «같이» 담는다(그래야 풀 수 있고, 그래도 안전하다)
//      · AES-GCM 은 «맞는 비번인지»를 스스로 안다 → 틀리면 복호가 실패한다(우리가 따로 검사 안 해도 된다)
//   ⛔ **봉인은 실패하면 «원문 그대로» 둔다** — 못 여는 백업을 만드는 게 제일 나쁘다.
const 봉인표식 = 'hkseal2:'
const 옛봉인표식 = 'hkseal1:' // ⛔ 첫 판(손수 뒤섞기)으로 만든 백업도 읽을 수 있어야 한다
// 🔢🔢 **[2026-08-16 고침] 21만 → 60만** — 창업자가 다른 AI에게 교차검증을 받아 잡았다.
//   📮 *"OWASP 2025 기준 PBKDF2-HMAC-SHA256 은 **최소 310,000~600,000회**"* → **내 21만은 기준 미달이었다.**
//   ⛔⛔ 그리고 그 답이 더 아픈 것을 짚었다 —
//      *"4자리 PIN 만으로는 **반복 횟수 증가가 실질적 방어가 안 되므로** 시도 제한 ＋ 기기 바인딩을 함께"*
//      ⭐ 맞는 말인데 **백업 파일에는 그 둘을 못 쓴다** — 파일을 가져가 «자기 컴퓨터»에서 돌리면
//         우리 앱의 시도 제한도, 이 폰의 기기 키도 아무 소용이 없다(오프라인 공격).
//   ✅ **그래서 이 봉인이 막는 것은 딱 하나 — 「파일을 열어 글자를 읽는 것」이다.**
//      작정하고 도구를 짜는 사람은 결국 뚫는다. ⛔그걸 「안전하다」고 말하지 않는다.
const 반복 = 600000

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const un64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function 열쇠만들기(pin, salt) {
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode('hankki-seal-v2:' + pin), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 반복, hash: 'SHA-256' },
    raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )
}

// ── 옛 판(hkseal1) 되돌리기 — 읽기 전용. 새로 만들 땐 안 쓴다 ──
function 옛열쇠(pin) {
  const s = 'hankki-seal-v1:' + String(pin)
  let h1 = 2166136261, h2 = 5381
  const out = []
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < s.length; i++) {
      h1 = ((h1 ^ s.charCodeAt(i)) * 16777619) >>> 0
      h2 = (((h2 << 5) + h2 + s.charCodeAt(i) + r) | 0) >>> 0
    }
    out.push(h1 >>> 0, h2 >>> 0)
  }
  return out
}
function 옛섞기(글, pin) {
  const k = 옛열쇠(pin)
  let out = ''
  for (let i = 0; i < 글.length; i++) {
    const m = (k[i % k.length] >>> ((i % 4) * 8)) & 0xff
    out += String.fromCharCode(글.charCodeAt(i) ^ (m || 0x5a))
  }
  return out
}

// 글자 → 백업에 담을 모양. ⚠️ 한글·이모지가 있으니 UTF-8 로 편다.
export async function sealText(글, pin) {
  try {
    if (!글 || !pin || !globalThis.crypto?.subtle) return 글
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await 열쇠만들기(String(pin), salt)
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(String(글)))
    return 봉인표식 + b64(salt) + '.' + b64(iv) + '.' + b64(enc)
  } catch {
    return 글 // ⛔ 못 잠갔으면 원문 그대로 — 백업이 «비는» 것보다 낫다
  }
}

export function isSealed(값) {
  return typeof 값 === 'string' && (값.startsWith(봉인표식) || 값.startsWith(옛봉인표식))
}

// 되돌리기. 비번이 틀리면 null(부른 쪽이 「비번이 안 맞아요」를 띄운다).
export async function unsealText(값, pin) {
  try {
    if (!isSealed(값)) return 값
    if (!pin) return null
    if (값.startsWith(옛봉인표식)) {
      const 글 = decodeURIComponent(escape(옛섞기(atob(값.slice(옛봉인표식.length)), String(pin))))
      return 글
    }
    const [s, i, c] = 값.slice(봉인표식.length).split('.')
    const key = await 열쇠만들기(String(pin), un64(s))
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: un64(i) }, key, un64(c))
    return new TextDecoder().decode(dec)
  } catch {
    return null // ⭐ 비번이 틀리면 여기로 온다 — AES-GCM 이 스스로 안다
  }
}

// ── 일기 한 장을 통째로 봉인/해제 ───────────────────────────
// ⭐ 「글·사진·꾸민 스티커」를 **한 덩어리로 묶어** 잠근다.
//    ⛔ 글만 잠그면 안 된다 — 꾸민 스티커에도 «글자 스티커»가 있어서 거기 속마음이 적힌다.
// ⚠️ 잠글 게 없거나 비번이 없으면 **원래 일기를 그대로 돌려준다**(백업이 비면 안 된다).
export async function sealEntry(일기, pin) {
  try {
    if (!일기 || !pin || 일기.kind !== 'diary' || !일기.locked) return 일기
    if (일기.sealed) return 일기 // 이미 봉인돼 있다
    const 속 = { note: 일기.note || '', photos: 일기.photos || [], decor: 일기.decor || [] }
    if (!속.note && !속.photos.length && !속.decor.length) return 일기 // 빈 일기는 잠글 것이 없다
    const sealed = await sealText(JSON.stringify(속), pin)
    if (!isSealed(sealed)) return 일기 // 봉인 실패 → 원본 유지
    const out = { ...일기, sealed }
    delete out.note
    delete out.photos
    delete out.decor
    return out
  } catch {
    return 일기
  }
}

// 비번이 맞으면 «푼 일기»를, 틀리면 null 을 준다.
export async function unsealEntry(일기, pin) {
  try {
    if (!일기?.sealed) return 일기
    const 글 = await unsealText(일기.sealed, pin)
    if (글 == null) return null
    const 속 = JSON.parse(글)
    const out = { ...일기, note: 속.note || '', photos: 속.photos || [], decor: 속.decor || [] }
    delete out.sealed
    return out
  } catch {
    return null
  }
}

// 이 세션 동안 그날을 열어 둔다
export function unlockDay(day) {
  열린날.add(String(day))
}

export function isDayOpen(day) {
  return 열린날.has(String(day))
}

// 잠금을 아예 풀 때(자물쇠를 뗄 때) — 이 세션 표식도 같이 지운다.
export function forgetDay(day) {
  열린날.delete(String(day))
}

// ⚠️ 비번을 잊었을 때 = 「이 일기를 포기하고 잠금을 초기화」밖에 없다.
//    ⭐ 그래서 화면에서 **무엇을 잃는지 먼저 말하고** 확인을 받는다. 조용히 지우지 않는다.
//    ⛔ 「관리자 비번」·「우회 코드」는 만들지 않는다 — 있으면 잠금이 아니다.
export function resetAllLocks() {
  try {
    localStorage.removeItem(PIN_KEY)
    localStorage.removeItem(HINT_KEY)
  } catch {
    /* noop */
  }
  열린날.clear()
}
