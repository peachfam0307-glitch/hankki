// 🗄🗄 **판(재현판)이 「사진」을 잴 때 쓰는 한 곳** (2026-09-02 · 사진 이사와 한 몸)
//
//   ⛔⛔ 2026-09-02 부터 사진은 **「큰 창고」(IndexedDB)**에 있고 `localStorage` 엔 **쪽지**만 남는다
//      (`idb://recipes/r1/image` = 서른 글자).
//      그래서 서랍만 읽는 옛 판들은 **아무것도 안 재면서 초록·빨간불을 낸다** —
//      「사진이 저장됐나(`data:` 로 시작하나)」는 늘 ⛔, 「사진이 줄었나(길이)」는 늘 ✅(1,000,000 → 30).
//      📌 규칙 18 ⓘ 그대로다: **검사가 «무엇을 보는지»를 옮겨야 한다.**
//
//   ✅ 그래서 판은 값을 이 한 곳에 넣어 **「진짜 사진」**을 받아 간다.
//      쪽지면 창고에서 꺼내 오고, 이미 `data:` 면 그대로 준다.
//
//   ⚠️ 창고 이름·판 번호는 `src/photoStore.js` 와 «같아야» 한다 — 갈리면 판이 늘 빈손이 된다.
export const DB = 'hankki-photos'
export const 창고 = 'img'

/** 페이지 안에서 값을 「그릴 수 있는 사진」으로 바꿔 준다. 못 찾으면 `''`. */
export function 사진값 (page, 값) {
  return page.evaluate(([val, db이름, 창고이름]) => new Promise((res) => {
    if (typeof val !== 'string') return res('')
    if (!val.startsWith('idb://')) return res(val)
    const 길 = val.slice(6)
    let 끝났나 = false
    const 답 = (v) => { if (!끝났나) { 끝났나 = true; res(v) } }
    setTimeout(() => 답(''), 4000)   // ⛔ 창고가 안 열리면 판이 «영영» 멈춘다
    try {
      const req = indexedDB.open(db이름, 1)
      req.onerror = () => 답('')
      req.onblocked = () => 답('')
      req.onsuccess = () => {
        const db = req.result
        try {
          const g = db.transaction(창고이름, 'readonly').objectStore(창고이름).get(길)
          g.onsuccess = () => { 답(typeof g.result === 'string' ? g.result : ''); db.close() }
          g.onerror = () => { 답(''); db.close() }
        } catch { 답(''); db.close() }
      }
    } catch { 답('') }
  }), [값, DB, 창고])
}

/** 「사진이 있다」 판정 — 서랍에 있든 창고에 있든 «진짜 그림»이면 참. */
export async function 사진있나 (page, 값) {
  const v = await 사진값(page, 값)
  return typeof v === 'string' && v.startsWith('data:image')
}
