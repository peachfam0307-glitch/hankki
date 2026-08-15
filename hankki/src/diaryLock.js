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
