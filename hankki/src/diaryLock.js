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

// ─────────────────────────────────────────────────────────────────────────
// 🔐🔐 백업 파일 안에서 잠긴 일기를 «가린다» — 창업자 확정 ⓑ (2026-08-19)
//
// 📮 창업자 = *"백업할때 일기 잠금 풀리는건 어떻게 해결해? 하고있어?"* → 갈래 셋 중 *"일기는 b로 가자"*
//
// ⛔⛔ **무엇이 구멍이었나** — 앱 «화면»으로는 못 연다(`checkPin` 이 비번 없으면 무조건 false).
//    진짜 구멍은 **파일 자체**였다: `buildBackup()` 이 `store.diary` 를 통째로 담고
//    `JSON.stringify()` 로 **평문** 저장한다 → **메모장으로 열면 본문이 그대로 보인다.**
//    게다가 비번 자국(`hankki:diaryPin`)은 백업 «밖»이라 **자물쇠는 빠지고 내용물만 담기는** 꼴이었다.
//
// ⭐⭐ **왜 ⓑ 인가** (갈래 셋 중)
//    ⓐ 잠긴 일기를 백업에서 «뺀다» → 한 줄이면 되지만 **폰 바꾸면 그 일기를 잃는다**(백업의 존재 이유와 충돌)
//    ⓑ **본문만 비번으로 잠가서 담는다** → **안 잃고 안 샌다** ← 창업자 확정
//    ⓒ 그대로 두고 안내만 → 정직하지만 짐을 유저에게 넘긴다
//
// 🔑 **열쇠는 비번 «자국»이다 — 그래서 백업할 때 비번을 «안 물어도» 된다.**
//    · 잠글 때 = 이미 `localStorage` 에 있는 자국을 그대로 쓴다(유저는 아무것도 안 한다)
//    · 풀 때 = 비번을 물어 자국을 다시 만들어 푼다
//    ⚠️ 같은 폰의 `localStorage` 를 들여다볼 수 있는 사람은 풀 수 있다 — **그건 원래 그 폰 주인**이다.
//       우리가 막으려는 건 **백업 파일만 남에게 건넸을 때**다. 거기엔 충분하다.
//
// ⚠️⚠️ **여기서도 「암호화」라고 말하지 않는다**(위 머리주석과 같은 이유). 화면 문구는 「잠가서 담아요」.
//    ⛔ `crypto.subtle` 이 없으면(http 등) **평문으로 담지 않는다** — 본문을 빼고 표식만 남긴다.
//       📌 **못 잠글 바엔 안 담는 게 맞다.** 새는 것보다 잃는 게 낫다(잃어도 원본 폰엔 그대로 있다).

const 잠금표 = '_hankkiLocked' // 백업 안에서 「이 칸은 잠겨 있다」는 표식

// 자국(16진 문자열) → AES-GCM 열쇠
async function 열쇠(자국문자열) {
  const raw = new Uint8Array(자국문자열.match(/.{1,2}/g).slice(0, 32).map((h) => parseInt(h, 16)))
  const 재료 = new Uint8Array(32)
  재료.set(raw.slice(0, 32))
  return crypto.subtle.importKey('raw', 재료, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const un64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

// 백업에 담기 «전» — 잠긴 일기의 글자 칸을 잠근다.
// 📌 `필드들` = DiaryScreen 의 WORDS 중 «글자»인 것(font·size 는 글씨체라 뺀다).
export async function 백업용잠그기(일기목록, 필드들) {
  const 자국문자열 = (() => { try { return localStorage.getItem(PIN_KEY) } catch { return null } })()
  if (!Array.isArray(일기목록)) return 일기목록
  return Promise.all(일기목록.map(async (d) => {
    if (!d || !d.locked) return d
    const 담을것 = {}
    for (const k of 필드들) if (d[k]) 담을것[k] = d[k]
    if (!Object.keys(담을것).length) return d

    // ⛔ 잠글 수단이 없으면 «빼고» 담는다 — 평문으로 새게 두지 않는다.
    if (!자국문자열 || !globalThis.crypto?.subtle) {
      const 뺀것 = { ...d }
      for (const k of 필드들) delete 뺀것[k]
      return { ...뺀것, [잠금표]: { 못잠금: true } }
    }
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const 암호 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await 열쇠(자국문자열),
        new TextEncoder().encode(JSON.stringify(담을것)),
      )
      const 뺀것 = { ...d }
      for (const k of 필드들) delete 뺀것[k]
      return { ...뺀것, [잠금표]: { iv: b64(iv), 글: b64(암호) } }
    } catch {
      const 뺀것 = { ...d }
      for (const k of 필드들) delete 뺀것[k]
      return { ...뺀것, [잠금표]: { 못잠금: true } }
    }
  }))
}

// 백업 파일에 잠긴 일기가 몇 장 들어 있나 (불러오기 화면에서 물어볼지 정할 때)
export function 잠긴장수(일기목록) {
  if (!Array.isArray(일기목록)) return 0
  return 일기목록.filter((d) => d && d[잠금표] && !d[잠금표].못잠금).length
}

// 불러올 때 — 비번으로 푼다. ⭐ 못 푼 것은 «잠긴 채로» 남긴다(안 지운다).
// 돌려주는 값 = { 일기목록, 푼수, 못푼수 }
export async function 백업풀기(일기목록, pin) {
  if (!Array.isArray(일기목록)) return { 일기목록, 푼수: 0, 못푼수: 0 }
  let 푼수 = 0
  let 못푼수 = 0
  const 자국문자열 = await 자국(pin)
  const 나온것 = await Promise.all(일기목록.map(async (d) => {
    const 봉투 = d && d[잠금표]
    if (!봉투 || 봉투.못잠금) return d
    try {
      const 푼 = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: un64(봉투.iv) },
        await 열쇠(자국문자열),
        un64(봉투.글),
      )
      const 글 = JSON.parse(new TextDecoder().decode(푼))
      푼수++
      const r = { ...d, ...글 }
      delete r[잠금표]
      return r
    } catch {
      // ⛔ 비번이 틀렸거나 다른 폰의 백업 — 지우지 않고 «잠긴 채로» 둔다.
      못푼수++
      return d
    }
  }))
  return { 일기목록: 나온것, 푼수, 못푼수 }
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
