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

// 🛟 [2026-09-04] 자동 받기가 «얹기 전에 되돌릴 벌»을 뜬다 — 그 창고(IndexedDB)는 노드에 없다.
//   ⛔ 안 물리면 벌을 못 떠서 «되돌릴자리없음»으로 물러난다(그건 설계대로다 — 판이 그걸 잡았다).
//   ⭐ 그래서 여기서도 가짜 창고를 물린다. 기록·계기판도 같은 창고를 쓴다.
const 큰창고 = new Map()
const 가짜큰창고 = {
  async 넣기 (k, v) { 큰창고.set(k, JSON.parse(JSON.stringify(v))); return true },
  async 꺼내기 (k) { const v = 큰창고.get(k); return v === undefined ? null : JSON.parse(JSON.stringify(v)) },
  async 지우기 (k) { 큰창고.delete(k) },
  async 열쇠들 () { return [...큰창고.keys()] },
}
;(await import('../src/syncUndo.js'))._창고물리기(가짜큰창고)
;(await import('../src/syncLog.js'))._창고물리기(가짜큰창고)
;(await import('../src/syncMeter.js'))._창고물리기(가짜큰창고)

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
// ⚠️ 비동기 검사는 «따로» — 위 잰다는 던진 Promise 를 못 잡아 «틀려도 통과»한다(조용한 거짓 초록불).
const 잰다비동기 = async (이름, 하기) => {
  try { await 하기(); console.log('✅ ' + 이름); 통과++ }
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


// ══ ⑩ 🔄 저절로 올리기 — 안전장치 둘 ═══════════════════════════════════
// 📮 창업자 2026-08-21 = *"나도 폰 패드 같이쓰거든."* · *"2번도 기변하는 사람들 많으니까 나도 기변할수있고"*
//   ⭐ 둘 다 «창업자 본인 시나리오»다. 여기서 안 재면 창업자 폰에서 데이터가 날아간다.
{
  창고.clear(); C.지문지우기(); C.받았다지우기()
  칸.set('hankki:cloud:on', '1')      // 로그인해 둔 표식
  칸.set('hankki:did', '폰A')          // 이 기기 = 폰A
  const 내것 = { ...백업(), diary: [], recipes: [{ id: 'r1', title: '하나' }, { id: 'r2', title: '둘' }] }

  잰다('⑱ 🚨 클라우드 것을 «안 가져왔으면» 안 올린다 (기변 — 빈 폰이 클라우드를 덮는 것을 막는다)', async () => {
    const r = await C.저절로올리기(async () => 내것)
    assert.equal(r.했나, false)
    assert.equal(r.왜, '아직안받았다', '왜 = ' + r.왜)
    assert.equal(창고.size, 0, '🚨 안 가져왔는데 올라갔다')
  })

  await 잰다비동기('⑲ 가져온 뒤엔 올라간다', async () => {
    C.받았다표시()
    const r = await C.저절로올리기(async () => 내것)
    assert.equal(r.했나, true, '왜 = ' + r.왜)
    assert.ok(창고.has('users/' + 구글번호 + '/recipes/r1'))
    assert.equal(창고.get('users/' + 구글번호).기기, '폰A', '기기 표식이 안 붙었다')
  })

  await 잰다비동기('⑳ 🔢 안 바뀌었으면 «한 건도» 안 쓴다 (ⓒ가 ⓐ보다 안 비싸다)', async () => {
    const 커밋전 = 커밋수
    const r = await C.저절로올리기(async () => 내것)
    assert.equal(r.했나, false)
    assert.equal(r.왜, '바뀐것없음', '왜 = ' + r.왜)
    assert.equal(커밋수, 커밋전, '쓰기가 ' + (커밋수 - 커밋전) + '번 났다')
  })

  await 잰다비동기('㉑ 🚨 다른 기기가 먼저 올렸으면 «안» 덮는다 (폰↔패드)', async () => {
    칸.set('hankki:did', '패드B')      // 이제 패드에서 켰다
    C.지문지우기(); C.받았다표시()
    const 패드것 = { ...백업(), diary: [], recipes: [{ id: 'x9', title: '패드에서 쓴 것' }] }
    const r = await C.저절로올리기(async () => 패드것)
    assert.equal(r.했나, false)
    assert.equal(r.왜, '다른기기', '왜 = ' + r.왜)
    assert.ok(창고.has('users/' + 구글번호 + '/recipes/r1'), '🚨 폰A 것이 덮였다')
    assert.ok(!창고.has('users/' + 구글번호 + '/recipes/x9'), '🚨 패드 것이 올라갔다')
    assert.equal(r.레시피, 2, '물어볼 때 보여줄 개수가 틀렸다')
  })

  // ☁️🔔 창업자 확정 2026-08-31 ⓑ — *"폰에서 저장하면 패드에서도 연동되야하는거 아냐??"*
  //   ⭐ 재는 것 = **물어볼 때 «두 판»이 다 보이나.** 한쪽 숫자만 보여주면 고를 수가 없다.
  //   ⛔ 「덮기」 단추를 여기서 주지 않는다 — 그건 두 판을 나란히 보는 화면에서만(창업자 확정).
  잰다('㉒-a 🔔 새 판 알림 글에 «두 판»이 다 들어간다', () => {
    const 글 = C.새판알림글({ 클라우드: { 레시피: 254, 일기: 17, 언제: '2026-08-31T12:18:00.000Z' }, 폰: { 레시피: 247, 일기: 15 } })
    assert.ok(/클라우드 · 레시피 254개 · 일기 17장/.test(글), '클라우드 쪽이 없다: ' + 글)
    assert.ok(/이 폰 · 레시피 247개 · 일기 15장/.test(글), '이 폰 쪽이 없다: ' + 글)
    assert.ok(/고르기 전까지는 아무것도 덮지 않아요/.test(글), '안심 문구가 없다')
    assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(글), '⛔ 유니코드 이모지가 들어갔다(앱 UI 규칙)')
  })

  잰다('㉒-b 🕐 «언제»가 붙는다 (어느 쪽이 새것인지)', () => {
    const 글 = C.새판알림글({ 클라우드: { 레시피: 1, 일기: 0, 언제: '2026-08-31T12:18:00.000Z' }, 폰: { 레시피: 1, 일기: 0 } })
    assert.ok(/\(\d+\/\d+ \d{2}:\d{2}\)/.test(글), '시각이 없다: ' + 글)
    const 없음 = C.새판알림글({ 클라우드: { 레시피: 1, 일기: 0, 언제: '' }, 폰: { 레시피: 1, 일기: 0 } })
    assert.ok(!/\(\)/.test(없음), '시각이 없을 때 빈 괄호가 남는다: ' + 없음)
  })

  await 잰다비동기('㉒ 로그인 안 했으면 아무것도 안 한다', async () => {
    칸.delete('hankki:cloud:on')
    const r = await C.저절로올리기(async () => 내것)
    assert.equal(r.했나, false)
    assert.equal(r.왜, '로그인안함')
  })
}

// ══ ⑫ ⬇️⚡ 저절로 «받기» — 폰에서 한 것이 패드에 저절로 온다 (창업자 확정 2026-09-01 = ⓐ)
// 📮 창업자 = *"자동동기화는 꼭 필요해."* · *"폰에서 레꾸한거 패드에서는 안보이거든?"*
//            · *"레꾸한거(우리레꾸스티커랑 배경으로 꾸민 것도??)"*
//   ⭐ 여기가 이 판의 심장이다 — **받아도 «사진»을 안 잃는가.**
//      클라우드엔 사진이 안 올라가므로, 그냥 덮으면 폰에 있던 사진이 빈 채로 덮인다.
{
  창고.clear(); C.지문지우기(); C.받았다지우기()
  칸.set('hankki:cloud:on', '1')

  // 🐻 «우리 자료로만» 꾸민 레시피 ＋ 갤러리 사진 한 장 (둘을 갈라 재려고 한 편에 같이 둔다)
  // ⭐⭐ `사진넣나 = false` 는 «클라우드에서 온 판»을 흉내낸다 —
  //    사진 스티커는 **원소째 사라지는 게 아니라 `src` 만 빠진 채** 올라간다(`사진털기` 는 값만 턴다).
  //    ⛔ 처음엔 원소째 없는 걸로 만들었다가 ㉕ 이 죽었다. **시험 데이터가 현실과 달랐던 것**이고
  //       그대로 뒀으면 「사진이 안 돌아온다」를 영영 못 재는 판이 됐다.
  const 꾸민것 = (제목, 사진넣나) => ({
    id: 'r1', title: 제목,
    ...(사진넣나 ? { image: 사진 } : {}),
    decorBg: 'sea',
    decor: [
      { id: 'd1', type: 'sticker', key: 'sk_05', x: 0.26, y: 0.67 },
      { id: 'd2', type: 'note', key: 'pn101', text: '맛있었음', font: 'gaegu' },
      { id: 'd3', type: 'photo', ...(사진넣나 ? { src: 사진 } : {}), x: 0.5, y: 0.44 },
    ],
  })

  // ① 패드B 가 «사진까지 있는» 레시피를 올린다 (클라우드엔 사진이 안 간다)
  칸.set('hankki:did', '패드B')
  C.받았다표시()
  const 패드것 = { ...백업(), diary: [], recipes: [꾸민것('내 김치찌개', true), { id: 'r2', title: '된장국' }] }
  await C.저절로올리기(async () => 패드것)
  // ⚠️ 재현판은 localStorage 가 «하나»라 기기마다 다른 지문을 흉내내야 한다 → 패드 것을 맡아 둔다
  const 패드지문 = 칸.get('hankki:cloud:sent')

  // ② 폰A 가 «같은 레시피의 제목»을 고쳐 올렸다 (사진은 애초에 클라우드에 없다)
  await C.올리기(
    { ...백업(), diary: [], recipes: [꾸민것('김치찌개 (폰에서 고침)', false), { id: 'r2', title: '된장국' }] },
    { 기기: '폰A' }
  )
  칸.set('hankki:cloud:sent', 패드지문) // 다시 패드B 의 자리로 돌아왔다

  let 받 = null
  await 잰다비동기('㉓ ⬇️ 다른 기기가 올렸으면 «저절로» 받아온다 (⛔안 물어본다)', async () => {
    받 = await C.저절로받기(async () => 패드것)
    assert.equal(받.했나, true, '왜 = ' + 받.왜)
    const r1 = (받.판.recipes || []).find((r) => r.id === 'r1')
    assert.equal(r1.title, '김치찌개 (폰에서 고침)', '🚨 폰에서 고친 제목이 안 왔다: ' + r1.title)
  })

  잰다('㉔ 🐻 «우리 스티커·배경»으로 꾸민 것이 그대로 온다 (창업자 물음 2026-09-01)', () => {
    const r1 = (받.판.recipes || []).find((r) => r.id === 'r1')
    const 스 = (r1.decor || []).find((d) => d.id === 'd1')
    assert.ok(스, '🚨 스티커가 통째로 사라졌다')
    assert.equal(스.key, 'sk_05', '스티커 그림이 바뀌었다')
    assert.equal(스.x, 0.26, '붙인 자리가 어긋났다')
    const 메모 = (r1.decor || []).find((d) => d.id === 'd2')
    assert.equal(메모 && 메모.text, '맛있었음', '🚨 메모지 글자가 사라졌다')
    assert.equal(r1.decorBg, 'sea', '🚨 배경지가 사라졌다')
  })

  잰다('㉕ 📷 폰에만 있던 «사진»이 안 사라진다 ⭐이 판의 심장 (자동으로 덮어도)', () => {
    const r1 = (받.판.recipes || []).find((r) => r.id === 'r1')
    assert.equal(r1.image, 사진, '🚨 표지 사진이 사라졌다')
    const 사진스티커 = (r1.decor || []).find((d) => d.id === 'd3')
    assert.ok(사진스티커, '🚨 사진 스티커가 통째로 사라졌다')
    assert.equal(사진스티커.src, 사진, '🚨 사진 스티커의 그림이 사라졌다')
    // ⛔⛔ [2026-09-04] 여기서 «살린 개수»를 재고 있었는데, 그건 **결과가 아니라 «누가 살렸나»**다.
    //   합치기(src/syncMerge.js)가 붙으면서 표지 사진은 «합치기 단계»에서 이미 살아난다 →
    //   뒤 단계가 살릴 게 1개로 줄어 판이 죽었다. **사진은 둘 다 멀쩡히 있었다**(위 세 줄이 그걸 잰다).
    //   ✅ 그래서 「몇 개 살렸나」가 아니라 **「사진이 남아 있나」**를 잰다. 그게 이 판의 심장이다.
    //   📌 규칙 18 ⓘ — 검사가 «무엇을 보는지»를 봐야 한다. 초록불이어도, 빨간불이어도 마찬가지다.
    assert.ok(받.살린사진 >= 1, '아무것도 안 살렸다: ' + 받.살린사진)
    const 사진들 = JSON.stringify(받.판.recipes).match(/data:image/g) || []
    assert.ok(사진들.length >= 2, '🚨 폰에 있던 사진이 줄었다: ' + 사진들.length)
  })

  await 잰다비동기('㉖ 🔁 받은 «다음»에도 또 저절로 받아진다 (두 번째부터 막히면 안 된다)', async () => {
    // ⚠️ 폰A 가 올리면 이 판의 «하나뿐인» 지문칸이 폰 것으로 덮인다 → 패드 자리로 되돌려 둔다
    const 패드지문2 = 칸.get('hankki:cloud:sent')
    await C.올리기({ ...백업(), diary: [], recipes: [꾸민것('또 고침', false), { id: 'r2', title: '된장국' }] }, { 기기: '폰A' })
    칸.set('hankki:cloud:sent', 패드지문2)
    const 받2 = await C.저절로받기(async () => 받.판)
    assert.equal(받2.했나, true, '🚨 두 번째가 막혔다 — 왜 = ' + 받2.왜)
    const r1 = (받2.판.recipes || []).find((r) => r.id === 'r1')
    assert.equal(r1.title, '또 고침', '제목이 안 왔다: ' + r1.title)
    assert.equal(r1.image, 사진, '🚨 두 번째에 사진이 사라졌다')
  })

  // 🔄🔄 **[2026-09-04 · 이 칸의 잣대가 «뒤집혔다»]**
  //   옛 잣대 = 「양쪽이 바뀌었으면 자동으로 «안» 받는다(사람이 고른다)」.
  //     ⭐ 그때는 «맞는» 판정이었다 — 받기가 **통째로 덮어쓰기**라 받는 순간 폰 것이 사라졌다.
  //     ⛔ 그런데 그 막음이 창업자가 겪은 「패드에 반영이 안 된다」의 절반이었다.
  //        양쪽이 조금씩 바뀌는 건 늘 있는 일이라 사실상 «늘» 멈춰 있었다.
  //   새 잣대 = **덮지 않고 «합친다»**(src/syncMerge.js) → 양쪽이 바뀌어도 «잃을 게 없다».
  //     🛟 그리고 얹기 «전»에 되돌릴 벌을 뜬다 — 못 뜨면 아예 안 얹는다.
  //   📌 그래서 이 칸은 「안 받는다」가 아니라 **「받되 «둘 다» 남는다」**를 재도록 바꿨다.
  //   📐 경위 = docs/폰패드-자동동기화-설계-2026-09-04.md
  await 잰다비동기('㉗ 🔀 양쪽이 바뀌면 «합쳐서» 받는다 — 둘 다 남는다 (2026-09-04 뒤집힘)', async () => {
    await C.올리기({ ...백업(), diary: [], recipes: [꾸민것('폰이 또 고침', false), { id: 'r2', title: '된장국' }] }, { 기기: '폰A' })
    const 패드에서고친것 = { ...백업(), diary: [], recipes: [꾸민것('패드에서도 고쳤다', true), { id: 'r2', title: '된장국' }, { id: 'r9', title: '패드에만 있는 편' }] }
    const r = await C.저절로받기(async () => 패드에서고친것)
    assert.equal(r.했나, true, '🚨 합치기가 되는데도 안 받았다 — 왜 = ' + r.왜)
    const 편들 = (r.판?.recipes || []).map((x) => x.id)
    assert.ok(편들.includes('r9'), '🚨 이 기기에만 있던 편이 사라졌다(＝덮었다)')
    assert.ok(편들.includes('r2'), '🚨 클라우드에 있던 편이 사라졌다')
  })

  잰다('㉘ 📷 「사진은 기기마다 따로」 안내는 «처음 한 번만»', () => {
    칸.delete('hankki:cloud:photonote')
    assert.equal(C.사진안내봤나(), false, '처음인데 봤다고 나온다')
    C.사진안내봤다()
    assert.equal(C.사진안내봤나(), true, '봤는데 안 봤다고 나온다')
  })
}

console.log('\n' + (실패 === 0 ? '✅ 다 통과 ' + 통과 + '건' : '⛔ ' + 실패 + '건 실패 (통과 ' + 통과 + '건)'))
process.exit(실패 === 0 ? 0 : 1)
