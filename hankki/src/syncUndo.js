// ⏪⏪ **되돌리기 — 「꼬여도 돌아갈 자리가 반드시 있다」** (2026-09-04)
//
// 📮 창업자 = *"폰-패드는 동기화가 꼬이면 진짜 답없어서.."* → *"되돌리기 만들어줘"*
//           ＋ *"이건 네가 우리앱을 책임지는거야. 이거 잘못되면 답이 없어"*
//
// 🚨🚨 **왜 이게 «먼저»인가**
//    2026-09-01 23:51 에 자동 받기가 방금 담은 레시피를 덮었을 때 **되돌릴 길이 없었다.**
//    열쇠는 이미 깎여 있었고(5→4) 레시피는 없었다. 「돈은 썼는데 물건이 없는」 모양이다.
//    ⭐ 돌아갈 자리가 있어야 그다음(합치기·자동 받기)을 만질 수 있다. 그래서 이걸 먼저 만든다.
//
// ⛔⛔ **여기 쓰지 «않는» 것 — 일부러다**
//   · **작은 서랍(localStorage)** — 5MB 뿐이고 창업자 폰이 이미 **91%(4.56MB)** 였다(2026-09-02 실측).
//     여기에 벌을 쌓으면 **9/2 사고를 그대로 재현**한다. 판(`_repro-되돌리기-0904`)이 이걸 잡는다.
//   · **사진·꾸민 표지** — 🔢 표지 한 장 **368KB**(실측). 100장이면 36MB 로 글자의 **180배**다.
//     ⭐ 사진은 어차피 폰을 안 떠난다 → 되돌릴 때 **「지금 폰에 있는 것」에서 되살린다.**
//     🔢 그래서 한 벌이 가볍다 = 레시피 한 편 **808 B** · 255편 **201KB** · 3벌 **604KB**
//        (큰 창고 한도 **10,731MB** 의 0.006%)
//
// ⛔ **사진이 든 창고(`hankki-photos`)를 건드리지 않는다.**
//    거기에 칸을 더하려면 DB 판을 올려야 하는데, 그 창고엔 **되살릴 수 없는 유저 사진**이 들어 있다.
//    ✅ 그래서 **딴 창고(`hankki-undo`)** 를 쓴다. 이 창고가 통째로 날아가도 사진은 멀쩡하다.
//
// 🧪 판 = `scripts/_repro-되돌리기-0904.mjs` (9칸) · 📐 설계 = `docs/폰패드-자동동기화-설계-2026-09-04.md` §3-ⓑ

const DB이름 = 'hankki-undo'
const 칸이름 = 'snap'
const VER = 1
const 벌수 = 3          // ⭐3벌까지만 — 오래된 것부터 지운다(무한히 쌓이면 창고를 먹는다)
const 벌한도 = 5 * 1024 * 1024  // 한 벌이 5MB 를 넘으면 «안 만들고 알린다»

// 🧰 창고를 «갈아 끼울 수» 있게 둔다 — 판이 IndexedDB 없이 전부 돌린다.
//    ⭐ 2026-09-03 에 「내 컨테이너에만 있는 것」에 기댄 판이 CI 에서 죽었다. 같은 실수를 안 한다.
let 붙은창고 = null
export function _창고물리기 (것) { 붙은창고 = 것 }

function 진짜창고 () {
  const 열기 = () => new Promise((풀기, 깨기) => {
    const q = indexedDB.open(DB이름, VER)
    q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains(칸이름)) q.result.createObjectStore(칸이름) }
    q.onsuccess = () => 풀기(q.result)
    q.onerror = () => 깨기(q.error)
  })
  const 한번 = (모드, 몸통) => 열기().then((db) => new Promise((풀기, 깨기) => {
    const t = db.transaction(칸이름, 모드)
    let 값
    t.oncomplete = () => { db.close(); 풀기(값) }
    t.onerror = () => { db.close(); 깨기(t.error) }
    몸통(t.objectStore(칸이름), (v) => { 값 = v })
  }))
  return {
    async 넣기 (열쇠, 값) {
      try { await 한번('readwrite', (s) => s.put(값, 열쇠)); return true } catch { return false }
    },
    async 꺼내기 (열쇠) {
      try { return await 한번('readonly', (s, 담기) => { const q = s.get(열쇠); q.onsuccess = () => 담기(q.result ?? null) }) } catch { return null }
    },
    async 지우기 (열쇠) { try { await 한번('readwrite', (s) => s.delete(열쇠)) } catch { /* 못 지워도 치명적이지 않다 */ } },
    async 열쇠들 () {
      try { return await 한번('readonly', (s, 담기) => { const q = s.getAllKeys(); q.onsuccess = () => 담기(q.result || []) }) || [] } catch { return [] }
    },
  }
}
const 창고 = () => 붙은창고 || (붙은창고 = 진짜창고())

// 📷 무거운 것을 턴다 — 사진(`data:`)과 꾸민 표지.
//   ⭐ `cloud.js` 의 `사진털기` 와 «같은 잣대»를 쓴다 = 「`data:` 로 시작하나」.
//      ⛔ 칸 이름(`image`·`표지`)으로 고르지 않는다 — 일기 속지엔 사진 칸이 열 개고 계속 는다.
//         이름으로 고르면 다음 달에 또 창고가 찬다(2026-09-02 에 배운 것).
function 무거운것털기 (값) {
  if (typeof 값 === 'string') return 값.startsWith('data:') ? null : 값
  if (Array.isArray(값)) return 값.map(무거운것털기)
  if (값 && typeof 값 === 'object') {
    const 나온것 = {}
    for (const [k, v] of Object.entries(값)) 나온것[k] = 무거운것털기(v)
    return 나온것
  }
  return 값
}

const 벌열쇠 = (id) => `벌:${id}`
const 목록열쇠 = '벌목록'

/**
 * 지금 상태를 한 벌 떠 둔다. ⛔합치기를 얹기 «전»에 부른다.
 * @returns { 됐나, 왜? , id? }  ⛔조용히 실패하지 않는다 — 못 뜨면 «왜»를 돌려준다
 */
export async function 벌뜨기 (판, { 기기 = '' } = {}) {
  try {
    const 가벼운판 = 무거운것털기(판 || {})
    const 글 = JSON.stringify(가벼운판)
    // 🔢 너무 크면 «안 만들고 알린다» — 억지로 넣다가 창고를 채우는 게 더 나쁘다
    if (글.length > 벌한도) {
      return { 됐나: false, 왜: `한 벌이 너무 큽니다(${Math.round(글.length / 1024)}KB)` }
    }
    const id = String(Date.now()) + ':' + Math.random().toString(36).slice(2, 7)
    const 넣었나 = await 창고().넣기(벌열쇠(id), 가벼운판)
    // ⛔⛔ **조용한 실패 금지** — 2026-09-02 사고의 절반이 「저장 실패를 삼킨 것」이었다.
    //    화면은 「저장했어요」라고 말하는데 실제론 안 들어가 있었다.
    if (!넣었나) return { 됐나: false, 왜: '폰 창고에 자리가 없습니다' }

    // ⭐ **다 쓴 «뒤»에** 목록에 넣는다 — 뜨는 도중에 앱이 꺼지면 반쪽 벌이 남는데,
    //    목록에 없으면 «보이지도 고르지도» 않는다(＝없는 것과 같다).
    const 목록 = (await 창고().꺼내기(목록열쇠)) || []
    목록.unshift({
      id, 때: new Date().toISOString(), 기기,
      레시피: (판?.recipes || []).length, 일기: (판?.diary || []).length,
    })
    // 🗑 3벌까지만 — 넘치면 오래된 것부터 지운다
    const 버릴것 = 목록.slice(벌수)
    for (const x of 버릴것) await 창고().지우기(벌열쇠(x.id))
    await 창고().넣기(목록열쇠, 목록.slice(0, 벌수))
    return { 됐나: true, id }
  } catch (e) {
    return { 됐나: false, 왜: (e && e.message) || '알 수 없는 탈' }
  }
}

/** 되돌릴 수 있는 벌 목록 — 화면이 「언제·몇 편·어느 기기」를 보여준다. */
export async function 벌목록 () {
  try {
    const 열쇠들 = await 창고().열쇠들()
    if (!열쇠들 || !열쇠들.length) return []
    return (await 창고().꺼내기(목록열쇠)) || []
  } catch { return [] }
}

/**
 * 그 벌로 되돌린다.
 * ⭐ 사진은 벌에 없다 — **지금 폰에 있는 것**에서 그 자리에 되살린다(사진은 폰을 안 떠난다).
 * ⛔ 저장하지 않는다 — 부르는 쪽이 «한 번에» 얹는다(반만 되돌아가는 일 방지).
 */
export async function 되돌리기 (id, { 지금 } = {}) {
  const 벌 = await 창고().꺼내기(벌열쇠(id))
  if (!벌) return null
  return 사진되살리기(벌, 지금 || {})
}

// 📷 벌엔 사진이 `null` 로 들어 있다. 「지금 폰에 있는 것」에서 같은 자리를 찾아 되살린다.
//   ⭐ `syncMerge.js` 의 사진 지키기와 «같은 생각»이다 — 빈 자리면 폰 것을 놓는다.
function 사진되살리기 (벌, 지금) {
  const 짝 = (a, b) => {
    if (a === null && typeof b === 'string' && b.startsWith('data:')) return b
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => 짝(v, b[i]))
    if (a && typeof a === 'object' && b && typeof b === 'object') {
      const 나온것 = {}
      for (const k of Object.keys(a)) 나온것[k] = 짝(a[k], b[k])
      return 나온것
    }
    return a
  }
  const 지금표 = new Map()
  for (const 갈래 of ['recipes', 'diary']) {
    for (const x of 지금[갈래] || []) if (x && x.id != null) 지금표.set(갈래 + ':' + x.id, x)
  }
  const 나온것 = { ...벌 }
  for (const 갈래 of ['recipes', 'diary']) {
    나온것[갈래] = (벌[갈래] || []).map((x) => {
      const 짝꿍 = 지금표.get(갈래 + ':' + x?.id)
      return 짝꿍 ? 짝(x, 짝꿍) : x
    })
  }
  return 나온것
}

export const _내부 = { 무거운것털기, 사진되살리기, 벌수, 벌한도 }
