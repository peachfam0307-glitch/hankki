// 🧪 가짜 파이어스토어에 «바뀐 것만 읽기» 부품을 얹는다 — 2026-09-07
//
// ⭐ 왜 한 곳에 두나 = 재현판 셋(`_repro-자동받기붙이기-0904` · `_repro-폰패드왕복-0904` · `_repro-클라우드동기화-0821`)이
//    저마다 가짜 F 를 갖고 있다. 셋에 같은 것을 따로 붙이면 언젠가 하나가 갈린다 → 여기서 «감싸서» 얹는다.
//
// 진짜 파이어스토어와 «같은 모양»만 흉내낸다:
//   · `serverTimestamp()` → 쓰는 «순간»이 아니라 **commit 때** 서버 시계로 바뀐다(진짜도 그렇다)
//   · `Timestamp.fromMillis(ms)` → `{ toMillis() }`
//   · `query(모음, where('st','>',ts))` → getDocs 가 **`st` 가 있고 ts 보다 큰 문서만** 준다
//     ⛔ `st` 칸이 «없는» 문서는 안 온다 — 진짜 파이어스토어가 그렇다(범위 질의는 칸 없는 문서를 뺀다).
//       이게 「옛 문서는 통째로 받을 때만 온다」(재현판 ⑪)의 근거다.
//
// 🕰 서버 시계는 «단조 증가»로 흉내낸다(commit 마다 +1000ms) — 같은 ms 에 두 번 써도 순서가 갈리게.

const 서버시계표 = Symbol('serverTimestamp')
const 때 = (ms) => ({ toMillis: () => ms, _ms: ms })

// @param 창고  가짜 창고(Map · 길 → 값). 주면 «걸러 읽기»를 창고에서 직접 해서 **걸러진 문서만** 센다
//              (진짜 파이어스토어도 걸러진 문서만 읽기로 센다 — 거르기 전 것까지 세면 계기판 검사가 «틀리게» 죽는다 · 실측)
// @param 읽음  (n) => void — 걸러 읽은 문서 수를 판의 계수기에 더한다(없으면 안 센다)
export function 바뀐것만지원 (F, { 시작 = 1_000_000, 창고 = null, 읽음 = null } = {}) {
  let 시계 = 시작
  const 도장찍기 = (v) => {
    if (v === 서버시계표) return 때(시계)
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = {}
      for (const [k, x] of Object.entries(v)) o[k] = 도장찍기(x)
      return o
    }
    return v
  }
  const 본디getDocs = F.getDocs.bind(F)
  const 본디writeBatch = F.writeBatch.bind(F)
  return {
    ...F,
    serverTimestamp: () => 서버시계표,
    Timestamp: { fromMillis: 때 },
    where: (칸, 부호, 값) => ({ 칸, 부호, 값 }),
    query: (모음, ...조건들) => ({ ...모음, _조건들: 조건들 }),
    async getDocs (모음) {
      const 조건들 = 모음._조건들 || []
      if (!조건들.length) return 본디getDocs(모음)
      // ⭐ 창고를 받았으면 거기서 «직접» 읽는다 — 본디 getDocs 를 거치면 거르기 «전» 문서까지 세어 버린다
      const 전부 = []
      if (창고) {
        for (const [k, v] of 창고) {
          if (!k.startsWith(모음._길 + '/')) continue
          const 남은 = k.slice(모음._길.length + 1)
          if (남은.includes('/')) continue
          전부.push({ id: 남은, data: () => v, ref: { _길: k } })
        }
      } else {
        // ⚠️ 옛 가짜(0821)는 `docs` 없이 forEach 만 준다 → forEach 로 모은다(docs 만 보면 «조용히 0편»이 된다 · 실측)
        const r = await 본디getDocs(모음)
        r.forEach((문서) => 전부.push(문서))
      }
      const 안 = 전부.filter((문서) => 조건들.every(({ 칸, 부호, 값 }) => {
        const x = (문서.data() || {})[칸]
        if (x == null) return false                       // ⛔ 칸 없는 문서는 범위 질의에서 빠진다
        const a = typeof x.toMillis === 'function' ? x.toMillis() : Number(x)
        const b = typeof 값?.toMillis === 'function' ? 값.toMillis() : Number(값)
        if (부호 === '>') return a > b
        if (부호 === '>=') return a >= b
        if (부호 === '<') return a < b
        if (부호 === '<=') return a <= b
        if (부호 === '==') return a === b
        throw new Error('가짜 where 가 모르는 부호: ' + 부호)
      }))
      if (창고 && 읽음) 읽음(안.length)
      return { forEach: (f) => 안.forEach(f), docs: 안, size: 안.length }
    },
    writeBatch (db) {
      const b = 본디writeBatch(db)
      const 본디set = b.set.bind(b)
      const 본디commit = b.commit.bind(b)
      b.set = (자리, 값) => 본디set(자리, 도장찍기(값))
      b.commit = async () => { 시계 += 1000; await 본디commit() }
      return b
    },
    // 🧪 판이 「지금 서버 시계」를 알고 싶을 때
    _서버시계: () => 시계,
  }
}
