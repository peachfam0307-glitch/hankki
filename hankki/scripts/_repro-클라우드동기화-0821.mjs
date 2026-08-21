#!/usr/bin/env node
// ☁️🧪 클라우드 올리기·내려받기 재현판 — 2026-08-21
//
// ⭐ 이 판이 재는 것 = **진짜 파이어베이스 «없이»** 동기화가 통째로 도는가.
//   가짜 창고를 물려 두면 「묶어 쓰기 · 지운 것 지우기 · 바뀐 것만 쓰기 · 개수 세기 · 왕복」이 전부 실제로 돈다.
//   ⛔ 여기서 안 재면 버그는 «창업자 폰»에서 발견된다. 그건 제일 비싼 자리다.
//
// 🚨 특히 지키는 것 넷 (설계 규칙 그대로)
//   ① 열쇠 = 구글 고유번호 (⛔Firebase UID 아님)
//   ② 올린 모양 = 백업 JSON 과 같다 (내려받아 합치면 백업이 나온다)
//   ③ 사진(`data:`)은 안 올라간다
//   ④ 폰에서 지운 것은 클라우드에서도 지워진다
import { strict as assert } from 'node:assert'

// ── 폰 흉내(localStorage) ────────────────────────────────────────────────
const 칸 = new Map()
globalThis.localStorage = {
  getItem: (k) => (칸.has(k) ? 칸.get(k) : null),
  setItem: (k, v) => 칸.set(k, String(v)),
  removeItem: (k) => 칸.delete(k),
}

// ── 가짜 Firestore ──────────────────────────────────────────────────────
// 진짜와 같은 «모양»만 흉내낸다: doc/collection/getDoc/getDocs/writeBatch
const 창고 = new Map() // 길 → 값
let 커밋수 = 0

const 길 = (조각들) => 조각들.join('/')
const F = {
  doc: (_db, ...조각) => ({ _길: 길(조각), id: 조각[조각.length - 1] }),
  collection: (_db, ...조각) => ({ _길: 길(조각) }),
  async getDoc(자리) {
    const v = 창고.get(자리._길)
    return { exists: () => v !== undefined, data: () => v }
  },
  async getDocs(모음) {
    const 안 = []
    for (const [k, v] of 창고) {
      if (!k.startsWith(모음._길 + '/')) continue
      const 남은 = k.slice(모음._길.length + 1)
      if (남은.includes('/')) continue // 바로 아래 것만
      안.push({ id: 남은, data: () => v, ref: { _길: k } })
    }
    return { forEach: (f) => 안.forEach(f), size: 안.length }
  },
  writeBatch() {
    const 할일 = []
    return {
      set: (자리, 값) => 할일.push(['set', 자리._길, 값]),
      delete: (자리) => 할일.push(['del', 자리._길]),
      async commit() {
        assert.ok(할일.length <= 500, '⛔ 한 묶음이 500개를 넘었다 — Firestore 상한이다')
        커밋수++
        for (const [무엇, k, v] of 할일) 무엇 === 'set' ? 창고.set(k, v) : 창고.delete(k)
      },
    }
  },
}

const 사람 = {
  uid: 'psE7J7FirebaseUidXXXX',                                   // ⛔ 이건 쓰면 안 되는 번호
  displayName: '한끼러버',
  photoURL: '',
  providerData: [{ providerId: 'google.com', uid: '110688000000000006208' }], // ✅ 이게 열쇠
}
const 구글번호 = '110688000000000006208'

const C = await import('../src/cloud.js')
C._가짜창고물리기({ F, db: {}, auth: { currentUser: 사람 }, A: {} })

// ── 시험용 백업 ─────────────────────────────────────────────────────────
const 사진 = 'data:image/png;base64,' + 'A'.repeat(5000)
const 백업 = () => ({
  _app: 'hankki', _v: 2, _at: '2026-08-21T09:00:00.000Z',
  recipes: [
    { id: 'basic-kongguksu', title: '콩국수', thumb: 'photo', image: '/recipe-photos/kongguksu.webp',
      ingredients: [{ name: '콩', qty: '1컵' }], steps: ['불린다', '간다'] },
    { id: 'u1abc', title: '내 김치찌개', thumb: 'photo', image: 사진,
      decor: [{ id: 'd1', type: 'sticker', key: 'sk_05', x: 0.26, y: 0.67 }] },
    { id: 'u2def', title: '된장국' },
  ],
  diary: [
    { id: 'd-0821', day: '2026-08-21', note: '오늘은 콩국수', photo: 사진 },
    { id: 'd-0820', day: '2026-08-20', _hankkiLocked: { iv: 'AAAA', 글: 'BBBB' } },
  ],
  folders: ['국·찌개'], profile: { name: '한끼러버', bio: '' },
  shops: [{ id: 'coupang', name: '쿠팡' }], wishlist: [], shoppingList: [], pantry: [],
  seedV: 17, memoCleanV: 3, removedSeedIds: ['basic-x'],
})

let 통과 = 0
let 실패 = 0
const 잰다 = (이름, 하기) => {
  try { 하기(); console.log('✅ ' + 이름); 통과++ }
  catch (e) { console.log('⛔ ' + 이름 + '\n   ' + (e && e.message)); 실패++ }
}

// ══ ① 첫 올리기 ════════════════════════════════════════════════════════
const r1 = await C.올리기(백업())

잰다('① 열쇠가 «구글 고유번호»다 (⛔Firebase UID 아님)', () => {
  const 길들 = [...창고.keys()]
  assert.ok(길들.every((k) => k.startsWith('users/' + 구글번호)), '엉뚱한 자리에 썼다: ' + 길들[0])
  assert.ok(!길들.some((k) => k.includes(사람.uid)), '🚨 Firebase UID 가 열쇠로 들어갔다')
})

잰다('② 레시피 3편 · 일기 2장이 «문서 하나씩» 됐다', () => {
  const 레 = [...창고.keys()].filter((k) => k.includes('/recipes/'))
  const 일 = [...창고.keys()].filter((k) => k.includes('/diary/'))
  assert.equal(레.length, 3, '레시피 ' + 레.length + '개')
  assert.equal(일.length, 2, '일기 ' + 일.length + '장')
})

잰다('③ 🖼 사진(data:)은 «안» 올라갔다 — 주소는 남았다', () => {
  const 전부 = JSON.stringify([...창고.values()])
  assert.ok(!전부.includes('data:image'), '🚨 사진이 클라우드로 올라갔다')
  assert.ok(전부.includes('/recipe-photos/kongguksu.webp'), '주소까지 지워버렸다')
})

잰다('④ 🔒 잠긴 일기는 «잠긴 채로» 올라갔다', () => {
  const v = 창고.get('users/' + 구글번호 + '/diary/d-0820')
  const d = JSON.parse(v.j)
  assert.ok(d._hankkiLocked, '잠금 봉투가 사라졌다')
  assert.ok(!d.note, '본문이 평문으로 올라갔다')
})

잰다('⑤ meta 문서 하나에 개수가 들어 있다 (요약이 읽기 1번)', () => {
  const m = 창고.get('users/' + 구글번호)
  assert.equal(m.n레시피, 3)
  assert.equal(m.n일기, 2)
  assert.ok(m.at, '올린 시각이 없다')
})

잰다('⑥ 되돌려준 값이 맞다', () => {
  assert.equal(r1.올린것, 6, '올린것 = ' + r1.올린것) // 레시피3 + 일기2 + meta1
  assert.equal(r1.지운것, 0)
  assert.equal(r1.건너뛴것.length, 0)
  assert.ok(r1.전부인가)
})

// ══ ② 아무것도 안 바꾸고 또 올리기 ═════════════════════════════════════
const 커밋1 = 커밋수
const r2 = await C.올리기(백업())
잰다('⑦ 🔢 안 바뀐 것은 «안» 쓴다 — meta 하나만 쓴다', () => {
  assert.equal(r2.올린것, 1, '올린것 = ' + r2.올린것 + ' (meta 하나여야 한다)')
  assert.equal(커밋수 - 커밋1, 1, '묶음 커밋이 ' + (커밋수 - 커밋1) + '번')
})

// ══ ③ 하나 고치고 하나 지우고 올리기 ═══════════════════════════════════
const 바뀐것 = 백업()
바뀐것.recipes[2].title = '된장국(고침)'
바뀐것.recipes = 바뀐것.recipes.filter((r) => r.id !== 'u1abc') // 폰에서 지웠다
const r3 = await C.올리기(바뀐것)

잰다('⑧ 고친 것만 다시 쓴다', () => {
  assert.equal(r3.올린것, 2, '올린것 = ' + r3.올린것) // 고친 레시피 1 + meta 1
})
잰다('⑨ 🗑 폰에서 지운 것은 클라우드에서도 지워졌다', () => {
  assert.equal(r3.지운것, 1, '지운것 = ' + r3.지운것)
  assert.ok(!창고.has('users/' + 구글번호 + '/recipes/u1abc'), '🚨 지운 레시피가 클라우드에 남았다')
})

// ══ ④ 요약 ════════════════════════════════════════════════════════════
const 요 = await C.요약()
잰다('⑩ 요약이 맞다', () => {
  assert.equal(요.있나, true)
  assert.equal(요.레시피, 2)
  assert.equal(요.일기, 2)
})

// ══ ⑤ 내려받기 — 왕복 ══════════════════════════════════════════════════
const 내려온것 = await C.내려받기()
잰다('⑪ ⭐ 백업 JSON 과 «같은 모양»으로 돌아온다 (보험 ②)', () => {
  assert.equal(내려온것._app, 'hankki')
  assert.equal(내려온것._v, 2)
  assert.ok(Array.isArray(내려온것.recipes))
  for (const k of ['folders', 'profile', 'shops', 'shoppingList', 'pantry', 'seedV', 'memoCleanV', 'removedSeedIds']) {
    assert.ok(내려온것[k] !== undefined, '칸이 빠졌다: ' + k)
  }
  assert.deepEqual(내려온것.folders, ['국·찌개'])
  assert.equal(내려온것.seedV, 17)
})
잰다('⑫ 레시피·일기가 다 돌아왔다 (사진만 빠진 채)', () => {
  assert.equal(내려온것.recipes.length, 2)
  assert.equal(내려온것.diary.length, 2)
  const 된장 = 내려온것.recipes.find((r) => r.id === 'u2def')
  assert.equal(된장.title, '된장국(고침)')
  const 콩 = 내려온것.recipes.find((r) => r.id === 'basic-kongguksu')
  assert.equal(콩.image, '/recipe-photos/kongguksu.webp')
  assert.deepEqual(콩.steps, ['불린다', '간다'])
  const 일 = 내려온것.diary.find((d) => d.id === 'd-0821')
  assert.equal(일.note, '오늘은 콩국수')
  assert.equal(일.photo, undefined, '🚨 사진이 돌아왔다 = 올라갔었다는 뜻')
})

// ══ ⑥ 새 폰 흉내 — 지문이 없으면 전부 올린다 ══════════════════════════
C.지문지우기()
const r4 = await C.올리기(바뀐것)
잰다('⑬ 새 폰(지문 없음)이면 «전부» 올린다', () => {
  assert.equal(r4.올린것, 5, '올린것 = ' + r4.올린것) // 레시피2 + 일기2 + meta1
})

// ══ ⑦ 너무 큰 것 하나 ═════════════════════════════════════════════════
const 큰것 = 백업()
큰것.recipes.push({ id: 'u-huge', title: '큰것', note: 'ㄱ'.repeat(1024 * 1024) })
const r5 = await C.올리기(큰것)
잰다('⑭ 1MiB 넘는 하나만 건너뛰고 나머지는 올린다', () => {
  assert.equal(r5.건너뛴것.length, 1, '건너뛴것 = ' + JSON.stringify(r5.건너뛴것))
  assert.equal(r5.건너뛴것[0].id, 'u-huge')
  assert.ok(창고.has('users/' + 구글번호 + '/recipes/u2def'), '나머지까지 안 올라갔다')
})

// ══ ⑧ 묶음 상한 ═══════════════════════════════════════════════════════
const 많은것 = 백업()
많은것.recipes = Array.from({ length: 950 }, (_, i) => ({ id: 'm' + i, title: '레시피' + i }))
많은것.diary = []
C.지문지우기()
const 커밋2 = 커밋수
const r6 = await C.올리기(많은것)
잰다('⑮ 950편도 «끊어서» 올린다 (한 묶음 500 상한을 안 넘는다)', () => {
  assert.equal(r6.올린것, 951, '올린것 = ' + r6.올린것) // 950 + meta
  assert.ok(커밋수 - 커밋2 >= 3, '커밋 ' + (커밋수 - 커밋2) + '번')
  assert.ok(r6.전부인가)
})

// ══ ⑨ 이상한 아이디 ═══════════════════════════════════════════════════
const 이상한것 = 백업()
이상한것.recipes = [{ id: 'a/b/c', title: '슬래시' }, { id: '..', title: '점둘' }]
이상한것.diary = []
C.지문지우기()
await C.올리기(이상한것)
const 되돌린것 = await C.내려받기()
잰다('⑯ 아이디에 «/» 가 있어도 안 깨지고 원래 아이디로 돌아온다', () => {
  const ids = 되돌린것.recipes.map((r) => r.id).sort()
  assert.deepEqual(ids, ['..', 'a/b/c'])
})

// ══ ⑩ ⛔⛔ 재현판이 잡은 진짜 버그 — 「새 폰에서 지운 게 되살아난다」 ═══════
// 시나리오 = 폰A 가 3편을 올린다 → 앱을 지웠다 깐다(지문 사라짐) → 백업 파일로 2편만 되살린다
//   → 올린다 → ⛔ 클라우드엔 3편이 남아 있어서 다음에 내려받으면 «지운 1편이 돌아온다»
{
  창고.clear(); C.지문지우기()
  const 셋 = { ...백업(), diary: [], recipes: [{ id: 'r1', title: '하나' }, { id: 'r2', title: '둘' }, { id: 'r3', title: '셋' }] }
  await C.올리기(셋)
  C.지문지우기() // ← 앱을 지웠다 깐 상태
  const 둘 = { ...셋, recipes: 셋.recipes.filter((r) => r.id !== 'r2') } // r2 를 지운 백업으로 되살림
  const r = await C.올리기(둘)
  const 다시 = await C.내려받기()
  잰다('⑰ 🚨 새 폰에서 지운 레시피가 «안» 되살아난다', () => {
    assert.equal(r.지운것, 1, '지운것 = ' + r.지운것)
    assert.ok(!창고.has('users/' + 구글번호 + '/recipes/r2'), '🚨 클라우드에 지운 레시피가 남았다')
    assert.deepEqual(다시.recipes.map((x) => x.id).sort(), ['r1', 'r3'])
  })
}

console.log('\n' + (실패 === 0 ? '✅ 다 통과 ' + 통과 + '건' : '⛔ ' + 실패 + '건 실패 (통과 ' + 통과 + '건)'))
process.exit(실패 === 0 ? 0 : 1)
