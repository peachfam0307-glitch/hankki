// 🗄🗄 **사진 창고** — 사진을 `localStorage`(작은 서랍 · 5MB) 밖으로 옮겨 담는 곳.
//
// 📮 창업자 2026-09-02 08:42 = *"방금 하나 저장한거 **흔적도 없이 증발함**"*
//   ⛔ 뿌리 = `store.jsx` 가 앱의 «모든 것»을 한 덩어리 JSON 으로 서랍 한 칸에 넣는데,
//      꽉 차면 **저장이 통째로 실패**한다. 그런데 메모리엔 남아 있어 화면은 「저장했어요」라고 말한다.
//   🔢 창업자 폰 실측 = **4.56MB / 5MB = 91%** (`public/idbtest.html` · 2026-09-02 14:12)
//
// ✅ 창업자 폰에서 «실물로» 확인하고 만들었다 — ⛔「된다더라」로 만들지 않는다(규칙 15)
//   | 잰 것 | 값 |
//   | 창고가 열리나 | ✅ 16ms |
//   | 사진 100장 넣기 / 꺼내기 | **183ms / 155ms** |
//   | 35.3MB 넣기 | 멀쩡 |
//   | 한도 | **10,731MB** ＝ 지금 서랍의 **2,000배** |
//   | 함부로 안 지워지게(`persist`) | ✅ 켜져 있다 |
//
// ⭐⭐ **잣대는 `cloud.js` 의 `사진털기` 와 «같다» = 「`data:` 로 시작하나」.**
//   ⛔ 칸 이름(`image`·`photo`)으로 고르지 않는다 — 일기 속지엔 사진 칸이 **열 개**고 이름이 계속 는다.
//      이름으로 고르면 **다음 달에 또 5MB 가 찬다.**
//   ⚠️ `/recipe-photos/…` 같은 «주소»는 글자 몇 십 자라 그냥 둔다.
//
// 🚨 **순서가 목숨이다 — 창고에 «먼저» 넣고, 그 다음에 서랍에서 뺀다.**
//   뒤집으면 「서랍엔 없고 창고에도 없는」 창이 생기고, 그 창에서 앱이 꺼지면 사진을 잃는다.
//   (서비스워커가 예고 없이 새로고침한다 — `main.jsx` 의 `location.reload()`)
//
// ⛔ **실패를 삼키지 않는다.** 오늘 사고의 절반이 「조용한 실패」였다.
//    못 넣었으면 `false` 를 돌려주고, 부르는 쪽이 **서랍에서 빼지 않는다**(＝지금과 같아질 뿐 나빠지지 않는다).

const DB = 'hankki-photos'
const 창 = 'img'
const VER = 1

let 열린것 = null

// ─────────────────────────────────────────────────────────────
// 📮 **「창고에 있다」는 표시**
//
// ⭐⭐ 사진을 뺀 자리에 `null` 을 넣으면 **「사진이 없다」와 구별이 안 된다.**
//    그러면 「만들었어요」가 일기에 사진을 안 담고(v11.29 재발), 자랑카드가 클라우드에서 털리고,
//    지문이 갈려 매번 전부 다시 올라간다. **전부 «조용히» 나빠지는 사고다.**
// ✅ 그래서 자리에 **「저기 있다」는 쪽지**를 남긴다. 그러면 —
//    · `null`(없다) ↔ `idb://…`(있는데 아직 안 왔다) ↔ `data:…`(여기 있다) **셋이 갈린다**
//    · 쪽지는 데이터를 따라 다닌다 — 백업·클라우드·복원 어디서든 「어느 사진인지」를 안 잃는다
export const 창고표시 = 'idb://'
export const 창고에있나 = (v) => typeof v === 'string' && v.startsWith(창고표시)
/** 화면에 바로 그릴 수 있는 사진인가 (＝쪽지가 아니라 진짜 그림) */
export const 그릴수있나 = (v) => typeof v === 'string' && v.startsWith('data:')

// 🔑 **열쇠는 「어디에 있었나」로 만든다** — 따로 번호를 붙이면 저장할 때마다 새 번호가 생겨
//    창고에 주인 없는 사진이 쌓인다. 자리로 만들면 **몇 번을 저장해도 같은 열쇠**다.
//    ⭐ 배열은 «순서»가 아니라 `id` 로 — 순서가 바뀌어도 사진이 안 뒤바뀐다.
function 자리열쇠 (윗길, 조각) { return 윗길 ? 윗길 + '/' + 조각 : String(조각) }

/**
 * 🪓 **사진을 갈라낸다** — 서랍에 넣을 «가벼운 판» ＋ 창고에 넣을 «사진 묶음».
 *
 * ⭐⭐ 잣대는 `cloud.js` 의 `사진털기` 와 **똑같다 = 「`data:` 로 시작하나」.**
 *    ⛔ 칸 이름(`image`·`photo`)으로 고르지 않는다 — 일기 속지엔 사진 칸이 **열 개**고 이름이 계속 는다.
 *       이름으로 고르면 **다음 달에 또 5MB 가 찬다.**
 * ⚠️ `/recipe-photos/…` 같은 «주소»는 글자 몇 십 자라 그냥 둔다(위 잣대에 안 걸린다).
 */
export function 사진갈라내기 (값, 길 = '', 묶음 = []) {
  if (그릴수있나(값)) { 묶음.push([길, 값]); return 창고표시 + 길 }
  if (Array.isArray(값)) return 값.map((v, i) => 사진갈라내기(v, 자리열쇠(길, (v && v.id) || i), 묶음))
  if (값 && typeof 값 === 'object') {
    const 판 = {}
    for (const [k, v] of Object.entries(값)) 판[k] = 사진갈라내기(v, 자리열쇠(길, k), 묶음)
    return 판
  }
  return 값
}

/** 갈라낸 결과를 한 번에 — `{ 판, 사진들 }` */
export function 나누기 (state) {
  const 묶음 = []
  const 판 = 사진갈라내기(state, '', 묶음)
  return { 판, 사진들: 묶음 }
}

/** 쪽지(`idb://…`)를 진짜 사진으로 되돌린다. 못 찾은 쪽지는 **그대로 둔다**(＝「아직 안 왔다」). */
export function 사진끼우기 (값, 표) {
  if (창고에있나(값)) { const k = 값.slice(창고표시.length); return 표[k] != null ? 표[k] : 값 }
  if (Array.isArray(값)) return 값.map((v) => 사진끼우기(v, 표))
  if (값 && typeof 값 === 'object') {
    const 판 = {}
    for (const [k, v] of Object.entries(값)) 판[k] = 사진끼우기(v, 표)
    return 판
  }
  return 값
}

/** 값 안에 든 «쪽지 열쇠»를 다 모은다 — 백업·클라우드처럼 «전부» 필요한 곳이 쓴다. */
export function 쪽지열쇠모으기 (값, 담을것 = []) {
  if (창고에있나(값)) { 담을것.push(값.slice(창고표시.length)); return 담을것 }
  if (Array.isArray(값)) { for (const v of 값) 쪽지열쇠모으기(v, 담을것); return 담을것 }
  if (값 && typeof 값 === 'object') { for (const v of Object.values(값)) 쪽지열쇠모으기(v, 담을것); return 담을것 }
  return 담을것
}

/** 창고를 연다. 못 열면 `null` — 그러면 앱은 «지금까지처럼» 서랍만 쓴다(안 죽는다). */
export function 창고열기 () {
  if (열린것) return 열린것
  열린것 = new Promise((ok) => {
    let 끝났나 = false
    const 한번 = (v) => { if (!끝났나) { 끝났나 = true; ok(v) } }
    try {
      if (typeof indexedDB === 'undefined') return 한번(null)
      const q = indexedDB.open(DB, VER)
      q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains(창)) q.result.createObjectStore(창) }
      q.onsuccess = () => {
        const db = q.result
        // 🪟🪟 **두 탭** — 다른 창이 판을 올리면 «내 연결을 놓아준다».
        //   ⛔ 안 놓으면 새 탭이 `blocked` 로 멎어 **그 탭은 사진을 영영 못 본다.**
        db.onversionchange = () => { try { db.close() } catch { /* noop */ } ; 열린것 = null }
        한번(db)
      }
      q.onerror = () => 한번(null)
      // 🕐 다른 창이 잡고 있으면 `blocked` 가 온다 — 기다리지 말고 «없는 셈» 친다(앱이 멎으면 안 된다)
      q.onblocked = () => 한번(null)
      setTimeout(() => 한번(null), 3000)   // 어떤 이유로도 3초를 안 넘긴다
    } catch { 한번(null) }
  })
  return 열린것
}

function 일하기 (db, 쓰기, 몸통) {
  return new Promise((ok, no) => {
    try {
      const t = db.transaction(창, 쓰기 ? 'readwrite' : 'readonly')
      let 값
      t.oncomplete = () => ok(값)
      t.onerror = () => no(t.error || new Error('창고 일이 안 됐다'))
      t.onabort = () => no(t.error || new Error('창고 일이 끊겼다'))
      몸통(t.objectStore(창), (v) => { 값 = v })
    } catch (e) { no(e) }
  })
}

/** 사진 한 장을 넣는다. ⭐**진짜로 들어간 뒤에만** `true` — 안 그러면 서랍에서 빼면 안 된다. */
export async function 넣기 (열쇠, 사진) {
  const db = await 창고열기()
  if (!db) return false
  try { await 일하기(db, true, (s) => s.put(사진, 열쇠)); return true } catch { return false }
}

/** 여러 장을 «한 거래»로 넣는다 — 100장에 183ms(창업자 폰 실측). */
export async function 여럿넣기 (묶음) {
  const db = await 창고열기()
  if (!db) return false
  try { await 일하기(db, true, (s) => { for (const [k, v] of 묶음) s.put(v, k) }); return true } catch { return false }
}

/** 꺼낸다. 없으면 `null`. ⛔못 꺼내도 앱은 안 깨진다 — `Thumb` 이 아이콘으로 그린다. */
export async function 꺼내기 (열쇠) {
  const db = await 창고열기()
  if (!db) return null
  try { return (await 일하기(db, false, (s, 담기) => { const q = s.get(열쇠); q.onsuccess = () => 담기(q.result) })) ?? null }
  catch { return null }
}

/** 여러 개를 한 번에 — `{열쇠: 사진}`. 못 꺼낸 것은 그냥 빠진다. */
export async function 여럿꺼내기 (열쇠들) {
  const db = await 창고열기()
  const 결과 = {}
  if (!db || !열쇠들.length) return 결과
  try {
    await 일하기(db, false, (s) => {
      for (const k of 열쇠들) { const q = s.get(k); q.onsuccess = () => { if (q.result != null) 결과[k] = q.result } }
    })
  } catch { /* 못 꺼낸 건 빠진 채로 돌려준다 */ }
  return 결과
}

/** 지운다. ⛔레시피를 지우면 **여기도** 지워야 한다 — `delete-account.html` 이 「앱에서 직접 삭제」를 약속했다. */
export async function 지우기 (열쇠들) {
  const db = await 창고열기()
  if (!db || !열쇠들.length) return false
  try { await 일하기(db, true, (s) => { for (const k of 열쇠들) s.delete(k) }); return true } catch { return false }
}

/** 창고에 든 «열쇠 목록» — 주인 없는 사진을 청소할 때 쓴다. */
export async function 열쇠들 () {
  const db = await 창고열기()
  if (!db) return []
  try { return (await 일하기(db, false, (s, 담기) => { const q = s.getAllKeys(); q.onsuccess = () => 담기(q.result) })) || [] }
  catch { return [] }
}

/** 통째로 비운다 (앱 초기화). */
export async function 통째로비우기 () {
  const db = await 창고열기()
  if (!db) return false
  try { await 일하기(db, true, (s) => s.clear()); return true } catch { return false }
}
