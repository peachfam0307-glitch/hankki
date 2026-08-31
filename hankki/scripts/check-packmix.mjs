// 💰 유료팩이 «공짜로 새는지» 검사 — 어기면 배포 차단.
//
// ⭐⭐ 왜 (창업자 2026-08-03)
//   *"할로윈은 저거 너무 귀여운데 저렇게 많이주면 유료팩에는 뭐넣어?"*
//   *"무료팩에는 할로윈 안나가야 하는거지? **그래야 유료를 사지 주면 누가사.**"*
//   *"**이거도 시스템 구축해 아주 중요한 부분이잖아**"*
//
// 🔎 실제로 새고 있었다 — 핼러윈 캐릭터 **16컷 중 14컷**이 무료 공유 카드로 나가고 있었다.
//   추석은 25컷 중 8컷만 내보내기로 2026-08-01 에 정했는데 **핼러윈엔 그 규칙을 안 적용했다.**
//   📌 규칙을 문서에 적어두면 다음에 또 «반만» 지킨다. 그래서 코드가 센다.
//
// 무엇을 보나 — «무료로 닿는 자리» 두 곳
//   ⒜ 꾸미기 서랍  `src/components/Stickers.jsx` 의 `STICKER_GROUPS[].items`
//   ⒝ 레꾸자랑 공유 카드 뽑기  `src/data/cardSeasons.js` 의 `gom`·`peng`·`duo`
//   ⚠️ ⒝도 「구경만」이 아니다 — 카드는 **레시피 표지로 저장**할 수 있다(v8.50).
//
// 판정 = `src/data/paidPacks.js`
//   · `sellable: false` (아직 못 파는 팩) → 무료 노출 **0컷**이어야 한다
//   · `sellable: true`  → `taste` 에 «적어둔 키»만 나갈 수 있다 (⛔통째로 열기 금지)
//
// ⛔ 새 유료팩을 앱에 넣을 땐 `paidPacks.js` 에 **접두어를 먼저 적는다.**
//    안 적으면 이 검사가 못 잡는다 — 그게 이번 사고의 모양이었다.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(APP, p), 'utf8')

// paidPacks.js 는 순수 데이터라 노드로 그대로 읽는다(Vite 전용 문법 없음).
const { PAID_PACKS, paidPackOf, freeOk } = await import(join(APP, 'src/data/paidPacks.js'))

let bad = 0
const fail = (m) => { console.log(`  ✗ ${m}`); bad++ }
const ok = (m) => console.log(`  ok  ${m}`)

console.log('\n── 유료팩이 공짜로 새는지 ──')

if (!PAID_PACKS.length) fail('⛔ 유료팩 목록이 비었다 — paidPacks.js 를 확인할 것')

// 키를 뽑는다 — 큰 배열 안의 '따옴표 낱말'을 전부 본다(넉넉하게 보고 접두어로 거른다).
const keysIn = (src, from, to) => {
  const a = src.indexOf(from)
  if (a < 0) throw new Error(`⛔ ${from} 를 못 찾았다 — 파일이 바뀌었다`)
  const blk = to ? src.slice(a, src.indexOf(to, a)) : src.slice(a)
  return [...new Set([...blk.matchAll(/'([a-z0-9_]+)'/gi)].map((m) => m[1]))]
}

// 🔁 **다른 이름으로 새는 것** — 팩의 `alias` 를 뒤집어 「무료 이름 → 그 팩」 표를 만든다.
//   ⛔⛔ 2026-08-03 사고: 이 검사가 *"✅ 안 샌다"* 고 «거짓말»하고 있었다.
//      가을 유료팩 16컷이 `wh_02` ↔ `au_i03` 처럼 **이름만 다르고 같은 그림**이라 그냥 통과했다.
//      그림이 두 벌 들어왔기 때문이다(`가을-창업자-2507` 무료 · `신규-2607-수채화팩` 유료).
//   📌 이름만 보는 검사는 이 사고를 **영원히 못 잡는다.** 그림으로 보려면 `python3 tools/leak-art.py`.
//      여기선 그 도구가 찾아 `alias` 에 적힌 것을 **배포 게이트로** 쓴다.
const aliasOf = new Map()
for (const p of PAID_PACKS) for (const [paid, free] of Object.entries(p.alias || {})) aliasOf.set(free, { pack: p, paid })
const aliasLeak = (keys) => keys.filter((k) => aliasOf.has(k))
const sayAlias = (hits, where) => {
  for (const k of hits) {
    const { pack, paid } = aliasOf.get(k)
    fail(`⛔⛔ **${where}의 '${k}' 는 ${pack.label} 팩에서 파는 '${paid}' 와 «같은 그림»이다**`)
  }
  if (hits.length) console.log('     👉 이름이 달라도 사는 사람 눈엔 같은 스티커다. 한쪽을 내릴 것.')
}

// ⒜ 꾸미기 서랍 ─────────────────────────────────────────────
const drawer = keysIn(read('src/components/Stickers.jsx'), 'export const STICKER_GROUPS')
sayAlias(aliasLeak(drawer), '꾸미기 서랍')
const drawerLeak = drawer.filter((k) => paidPackOf(k) && !freeOk(k))
if (drawerLeak.length) {
  fail(`⛔⛔ **꾸미기 서랍에 유료팩 컷 ${drawerLeak.length}개가 무료로 들어 있다** — ${drawerLeak.slice(0, 8).join(' ')}`)
  console.log('     👉 파는 물건을 그냥 주고 있다. 서랍에서 내리거나 paidPacks 의 taste 에 적을 것.')
} else ok('꾸미기 서랍 — 유료팩 컷 0개')

// ⒝ 레꾸자랑 공유 카드 ───────────────────────────────────────
const cardSrc = read('src/data/cardSeasons.js')
const cards = keysIn(cardSrc, 'export const SEASON_CUTS')
sayAlias(aliasLeak(cards), '공유 카드')
const cardLeak = cards.filter((k) => paidPackOf(k) && !freeOk(k))
if (cardLeak.length) {
  const byPack = {}
  for (const k of cardLeak) { const p = paidPackOf(k); (byPack[p.label] ||= []).push(k) }
  for (const [label, ks] of Object.entries(byPack)) {
    const pack = PAID_PACKS.find((p) => p.label === label)
    fail(`⛔ **${label} 팩 컷 ${ks.length}개가 공유 카드로 무료로 나간다** (팩 ${pack.total}컷 · 판매 ${pack.sellable ? '가능' : '⛔아직 불가'})`)
    console.log(`     ${ks.slice(0, 10).join(' ')}${ks.length > 10 ? ' …' : ''}`)
  }
  console.log('     👉 못 파는 팩은 «한 컷도» 안 나간다. 팔 수 있게 되면 sellable:true ＋ taste 에 한 줄씩.')
} else ok('공유 카드 뽑기 — 못 파는 팩 컷 0개')

// 팩별 요약 ──────────────────────────────────────────────────
//   ⭐ 「팩에 넣은 것(packed)」과 「남은 것」을 갈라서 보여준다 (창업자 2026-08-03
//     *"파는 팩에 캐릭터가 16개면 나머지 자산은 공유카드에 넣자. 그럼 안 겹치잖아"*).
for (const p of PAID_PACKS) {
  if (!p.prefixes.length) { console.log(`  ⚠️  ${p.label} — 접두어가 안 적혀 있다(앱에 넣기 전에 적을 것)`); continue }
  const mine = [...drawer, ...cards].filter((k) => p.prefixes.some((pre) => k.startsWith(pre)))
  const packed = p.packed?.length || 0
  const inCard = mine.filter((k) => cards.includes(k)).length
  if (packed) {
    console.log(`  · ${p.label} ${p.total}컷 — 팩에 넣은 캐릭터 ${packed} · 카드에 쓰는 «나머지» ${inCard}컷 · 판매 ${p.sellable ? '가능' : '아직'}`)
  } else {
    console.log(`  · ${p.label} ${p.total}컷 — ⏳팩 명단 미정(접두어 전부 막는 중) · 무료 노출 ${mine.length}컷 · 판매 ${p.sellable ? '가능' : '아직'}`)
  }
}

// 📐 정원 대조 — ⚠️ **정원은 이미 정해져 있다**(창업자 2026-07-30 · `asset-map.mjs` QUOTA).
//    계절 세트 캐릭터 = **12컷**(한 파 4) · 기본(사철) = 24컷.
//    ⛔ 2026-08-03 에 클로드가 *"유료팩 캐릭터 정원은 정한 적 없다"* 고 말했는데 **틀렸다.**
//       `docs/자산현황-자동집계.md` §정원 대조에 표로 있고 도구가 이미
//       *"⚠️ 가을 캐릭터 27/12"* 라고 경고까지 띄우고 있었다. **내가 안 봤을 뿐이다.**
//    📌 그래서 여기서 «숫자로» 다시 짚는다 — 문서를 안 보면 또 같은 말을 한다.
const CHAR_QUOTA = 12
for (const p of PAID_PACKS) {
  if (!p.chars) continue
  if (p.chars > CHAR_QUOTA) {
    console.log(`  ⚠️  ${p.label} 팩 캐릭터 ${p.chars}컷 — 계절 정원 ${CHAR_QUOTA}컷의 ${(p.chars / CHAR_QUOTA).toFixed(1)}배`)
    console.log('     👉 넘었다고 무조건 빼진 않는다(한 번 준 것은 안 뺏는다). 다음 확장판으로 나눌지 창업자 판단.')
  } else ok(`${p.label} 팩 캐릭터 ${p.chars}컷 — 정원 ${CHAR_QUOTA} 안`)
}

// 🕳 ⛔⛔ **팩에 넣어놓고 접두어를 안 적은 컷** — 2026-08-03 에 실제로 34컷이 이랬다.
//   추석 `cp_`·`ct_`·`cm_`·`cf2_`·`ci_` 31컷 ＋ 가을 `pf_02·04·08` 3컷.
//   그 컷들은 «유료팩 것»으로 인식조차 안 돼서 위의 누수 검사를 **통째로 빠져나갔다.**
//   📌 이제 `paidPackOf` 가 정확한 키도 보지만, 접두어가 없으면 **그 식구의 «새 컷»은 여전히 샌다.**
//      (예: `cp_12` 를 나중에 팩에 넣으면 접두어가 있어야 자동으로 막힌다)
//   ⭐ 그래서 여기서 «접두어로 안 덮이는 packed 키»를 찾아 **배포를 막는다.**
//      정말 접두어를 못 쓰는 경우만 팩의 `exactOnly` 에 적어서 통과시킨다(이유도 같이).
for (const p of PAID_PACKS) {
  const naked = (p.packed || []).filter((k) => !p.prefixes.some((pre) => k.startsWith(pre)))
  const excused = new Set(p.exactOnly || [])
  const leftover = naked.filter((k) => !excused.has(k))
  if (leftover.length) {
    fail(`⛔ ${p.label} 팩에 **접두어가 안 적힌 컷 ${leftover.length}개** — ${leftover.slice(0, 10).join(' ')}${leftover.length > 10 ? ' …' : ''}`)
    console.log(`     👉 ${[...new Set(leftover.map((k) => k.replace(/[0-9]+$/, '')))].join(' ')} 를 prefixes 에 적을 것.`)
    console.log('        앱·카드에 겹치는 게 있어 못 적으면 exactOnly 에 «이유와 함께» 적는다.')
  } else if (naked.length) {
    ok(`${p.label} — 접두어 못 쓰는 ${naked.length}컷은 exactOnly 로 인정됨(정확한 키로 막힘)`)
  }
  // exactOnly 에 적어놓고 정작 팩에 없는 유령 키
  const ghost = [...excused].filter((k) => !(p.packed || []).includes(k))
  if (ghost.length) fail(`⛔ ${p.label} exactOnly 에 팩에 없는 키: ${ghost.join(' ')}`)
}

// 📊 컷 수 — 상한을 넘지 않는가 · 중복은 없는가 (⭐ 개수는 «손으로» 세지 않는다)
for (const p of PAID_PACKS) {
  const k = p.packed || []
  if (!k.length) { console.log(`  ⏳ ${p.label} — 팩 명단 미정`); continue }
  const dup = k.filter((x, i) => k.indexOf(x) !== i)
  if (dup.length) fail(`⛔ ${p.label} 팩에 같은 컷이 두 번: ${[...new Set(dup)].join(' ')}`)
  if (k.length > p.total) fail(`⛔ ${p.label} 팩 ${k.length}컷 — 적어둔 ${p.total}컷을 넘었다`)
  else ok(`${p.label} 팩 ${k.length}컷 / ${p.total}${k.length === p.total ? ' (딱 맞음)' : ''}`)
}

// ⛔ 「맛보기 몇 컷까지」 같은 상한은 «없다» — 파는 컷은 0컷이 규칙이다.
//    2026-08-01 엔 「대표 8컷」이었는데 2026-08-03 에 창업자가 스스로 더 조였다:
//    *"돈주고 내가 산건데 카드에서라도 공유되면 별로지 한정판이 아니자나 그건"*
//    ⭐ 그러니 `taste` 같은 예외 구멍을 «만들지 말 것». 구멍이 있으면 언젠가 샌다.
if (PAID_PACKS.some((p) => Array.isArray(p.taste) && p.taste.length)) {
  fail('⛔ `taste`(맛보기 예외)가 되살아났다 — 파는 컷은 무료 경로에 0컷이 규칙이다')
}

if (bad) { console.log(`\n❌ 유료팩 검사 실패 ${bad}건 — 배포 차단\n`); process.exit(1) }
console.log('\n✅ 유료팩 통과 — 파는 물건이 공짜로 안 샌다\n')
