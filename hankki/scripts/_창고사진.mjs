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

/** 한 번만 읽어 본다. 못 찾으면 `''`. (아래 `사진값` 이 이걸 여러 번 부른다) */
function 한번읽기 (page, 값) {
  return page.evaluate(([val, db이름, 창고이름]) => new Promise((res) => {
    if (typeof val !== 'string') return res('')
    if (!val.startsWith('idb://')) return res(val)
    const 길 = val.slice(6)
    let 끝났나 = false
    const 답 = (v) => { if (!끝났나) { 끝났나 = true; res(v) } }
    // ⛔ 창고가 안 열리면 판이 «영영» 멈춘다. 스모크는 브라우저 넷이 동시에 도니 넉넉히 준다.
    setTimeout(() => 답(''), 10000)
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

/**
 * 페이지 안에서 값을 「그릴 수 있는 사진」으로 바꿔 준다. 못 찾으면 `''`.
 *
 * ⏳⏳ **[2026-09-02] 「없다」와 「아직 안 왔다」를 갈라야 한다.**
 *   ⛔ 첫 판은 «한 번» 읽고 못 찾으면 곧바로 `''` 를 줬다. 그런데 사진 이사(v12.24) 뒤로
 *      앱이 창고에 쓰는 일이 **비동기**라, 판이 고정 시간(`waitForTimeout(900)`)만 기다리고 물으면
 *      **아직 안 쓰인 순간**에 물어볼 수 있다.
 *   🔢 실측 = 이 판을 «혼자» 돌리면 4/4 통과인데, 스모크에서 브라우저 넷이 동시에 돌 때
 *      `_repro-완성사진-0821` 의 「사진은 일기에 담겼다」가 **false** 로 나왔다.
 *      즉 앱이 잘못한 게 아니라 **판이 성급했다.**
 *   ✅ 그래서 «찾을 때까지» 다시 본다(0.3초 간격 · 최대 8초). 찾으면 그 자리에서 바로 끝난다 —
 *      멀쩡할 땐 예전과 같은 속도다.
 *   ⛔ 이 도우미를 쓰는 판 넷은 전부 「사진이 «있다»」를 기대하는 자리다(실측). 「없다」를 확인하는
 *      자리에 쓰면 8초를 헛되이 기다리게 되니, 그럴 땐 `기다림: 0` 을 준다.
 */
export async function 사진값 (page, 값, { 기다림 = 8000, 간격 = 300 } = {}) {
  const 끝 = Date.now() + 기다림
  for (;;) {
    const v = await 한번읽기(page, 값)
    if (v) return v
    if (Date.now() >= 끝) return ''
    await new Promise((r) => setTimeout(r, 간격))
  }
}

/** 「사진이 있다」 판정 — 서랍에 있든 창고에 있든 «진짜 그림»이면 참. */
export async function 사진있나 (page, 값, 옵션) {
  const v = await 사진값(page, 값, 옵션)
  return typeof v === 'string' && v.startsWith('data:image')
}
