// 🍚🍚 「만드는 이야기에 나온 낱말」로 광고가 붙는다 — 재현판 (창업자 폰 제보 2026-08-31)
//
// 📮 창업자 = *"오늘 열린건데 **누룽지는 재료에 없어.** 만드는법에 밥을 눌리면 누룽지가
//    된다는건데 **광고에 들어가있어**.. 그리고 고춧가루는 빼기로 했던 것 같은데 광고에"*
//    → *"**레시피 광고에서만 뺀다고.** 누룽지는버그니까 고쳐줘"*
//
// 🔬 무엇이었나 — 레시피 = 「뚝딱 버섯 볶음밥」(`from: 2026-08-31` · 그날 저절로 열린 5편 중 하나)
//    · 재료 14줄에 **누룽지가 없다**
//    · 메모 셋째 줄 = *"약불에 눌러 가며 볶는 게 핵심이에요. 바닥에 **누룽지**가 생기면서 고소해져요."*
//    · 옛 `picksForIngredients` 는 호출부가 `[...ingredients, memo]` 로 **한 자루에 섞어** 넘겨서
//      낱말 매칭(`matches: ['누룽지']`)이 **메모에서** 걸렸다 → 「자연다음 현미누룽지」 광고가 붙었다.
//
// ⭐⭐ 왜 「그냥 메모를 빼면 되지」가 아닌가
//    메모 맨 아랫줄에 창업자가 **「제가 쓰는 양념 — 간장 「성가정 우리콩 진간장」…」** 을 적어 뒀고(68편),
//    그게 **풀네임 매칭**으로 광고를 붙이고 있다. 메모를 통째로 빼면 그 지정이 전부 날아간다.
//    ✅ 그래서 **갈랐다** — `matches` 낱말은 «재료 줄»만, 제품 «풀네임»은 메모까지.
//
// 🚫 ＋ 같은 날 확정 — 고춧가루는 **레시피 광고에서만** 뺀다(`noRecipePick`). 장보기 목록엔 그대로 있다.
//
// ⛔⛔ [규칙 12] **옛 값으로 되돌려 «진짜로 걸리는지»를 같이 잰다.**
//    `node scripts/_repro-누룽지광고-0831.mjs --old` = 옛 규칙으로 돌려서 **일부러 빨간불**을 본다.
//    빨간불이 안 뜨면 이 재현판이 «아무것도 안 보고 있다»는 뜻이다(2026-08-30 홈화면 사고와 같은 꼴).
//
// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 읽는다 → `check-picks.mjs` 처럼 **소스 글자를 읽는다.**
import { readFileSync } from 'node:fs'

const 옛판 = process.argv.includes('--old')
const cur = readFileSync('src/data/curation.js', 'utf8')
const basics = readFileSync('src/data/basics.js', 'utf8')

// ── ① 제품 목록 (name · matches · noRecipePick) ─────────────────────
const products = []
for (const m of cur.matchAll(/\{\s*name:\s*'([^']+)'([^}]*)\}/g)) {
  const 뒤 = m[2]
  const mw = 뒤.match(/matches:\s*\[([^\]]*)\]/)
  products.push({
    name: m[1],
    words: mw ? [...mw[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [],
    noRecipePick: /noRecipePick:\s*true/.test(뒤),
  })
}
if (products.length < 50) {
  console.error(`⛔ 큐레이션 제품을 ${products.length}개밖에 못 읽었다 — 파일 모양이 바뀌었다. 이 재현판을 고칠 것.`)
  process.exit(1)
}

// ── ② 앱과 «같은 규칙» (curation.js `picksForIngredients` 를 그대로 옮긴다) ──
//    ⛔ 갈라지면 이 재현판은 거짓말을 한다 — 아래 ④ 가 「규칙이 코드에 살아 있나」를 따로 못 박는다.
const 픽 = (ingredients, notes) => {
  // 옛판 = 재료와 메모를 한 자루에 섞는다(＝사고 그 자체) · 새판 = 낱말은 재료 줄만
  const 낱말밭 = 옛판 ? [...ingredients, notes] : ingredients
  const text = [...ingredients, notes].join('  ')
  const tokens = 낱말밭.flatMap((i) => String(i).split(/[\s,()·/]+/)).filter(Boolean)
  const out = []
  for (const p of products) {
    if (!옛판 && p.noRecipePick) continue      // 옛판엔 이 표식이 없었다
    if (p.name && text.includes(p.name)) out.push(p.name)
    else if (p.words.some((w) => tokens.some((t) => t.startsWith(w)))) out.push(p.name)
  }
  return out
}

// ── ③ 그 레시피를 «파일에서» 꺼낸다 (손으로 안 적는다) ──────────────
const 레시피 = (title) => {
  const at = basics.indexOf(`title: '${title}'`)
  if (at < 0) return null
  const 조각 = basics.slice(at, at + 6000)
  const ing = []
  const i0 = 조각.indexOf('ingredients: [')
  if (i0 >= 0) {
    let i = i0 + 'ingredients: ['.length, 깊이 = 1
    const 시작 = i
    while (i < 조각.length && 깊이 > 0) {
      const c = 조각[i]
      if (c === "'") { i++; while (i < 조각.length && 조각[i] !== "'") i += 조각[i] === '\\' ? 2 : 1 }
      else if (c === '[') 깊이++
      else if (c === ']') 깊이--
      i++
    }
    for (const s of 조각.slice(시작, i - 1).matchAll(/'((?:[^'\\]|\\.)*)'/g)) ing.push(s[1].replace(/\\'/g, "'"))
  }
  const mm = 조각.match(/memo:\s*'((?:[^'\\]|\\.)*)'/)
  return { ing, memo: mm ? mm[1].replace(/\\'/g, "'").replace(/\\n/g, '\n') : '' }
}

const 이름 = '뚝딱 버섯 볶음밥'
const r = 레시피(이름)
if (!r) { console.error(`⛔ 「${이름}」 을 basics.js 에서 못 찾았다 — 이 재현판을 고칠 것.`); process.exit(1) }

// ⛔ 전제가 무너지면 이 재현판은 «아무것도 안 보는» 초록불이 된다 — 전제부터 잰다
const 재료글 = r.ing.join('  ')
if (재료글.includes('누룽지')) {
  console.error(`⛔ 전제가 깨졌다 — 「${이름}」 재료에 누룽지가 생겼다. 그러면 광고가 붙는 게 «맞다».`)
  process.exit(1)
}
if (!r.memo.includes('누룽지')) {
  console.error(`⛔ 전제가 깨졌다 — 「${이름}」 메모에서 누룽지가 사라졌다. 이 재현판은 이제 아무것도 안 본다.`)
  process.exit(1)
}
if (!r.memo.includes('성가정 우리콩 진간장')) {
  console.error(`⛔ 전제가 깨졌다 — 메모의 「제가 쓰는 양념」 지정이 사라졌다(반대쪽 검사가 무의미해진다).`)
  process.exit(1)
}

const 붙은것 = 픽(r.ing, r.memo)
console.log(`🍳 ${이름} — 재료 ${r.ing.length}줄 · 메모 ${r.memo.split('\n').length}줄`)
console.log(`   붙은 광고 ${붙은것.length}개 : ${붙은것.join(' · ') || '(없음)'}`)
console.log(`   (지금 도는 규칙 = ${옛판 ? '⛔옛판(재료＋메모 섞음)' : '✅새판(낱말은 재료 줄만)'})\n`)

const 나쁨 = [], 좋음 = []
// ⛔ 메모의 «설명 문장»에서 걸린 것 — 유저가 헛것을 산다
if (붙은것.includes('현미누룽지')) 나쁨.push('현미누룽지 — 메모 「바닥에 누룽지가 생기면서」에서 걸렸다(재료엔 없다)')
// 🚫 창업자가 레시피 광고에서 빼라고 한 것
if (붙은것.includes('고춧가루')) 나쁨.push('고춧가루 — 창업자 2026-08-31 「레시피 광고에서만 뺀다」')
// ✅ 이건 «반드시» 붙어야 한다 — 메모에 창업자가 콕 집어 적은 지정이다
for (const 있어야 of ['우리콩 진간장', '굴소스']) {
  if (붙은것.includes(있어야)) 좋음.push(있어야)
  else 나쁨.push(`「${있어야}」가 «사라졌다» — 메모의 창업자 지정까지 같이 날렸다(고치다 부순 것)`)
}

if (옛판) {
  // 규칙 12 — 옛판은 «반드시» 걸려야 한다. 안 걸리면 이 재현판이 헛것을 보고 있다.
  if (나쁨.length) {
    console.log(`✅ 옛판이 제대로 걸린다 — ${나쁨.length}건 (이게 정상이다)`)
    for (const b of 나쁨) console.log(`     ⛔ ${b}`)
    console.log('\n   👉 새판으로 돌려서 초록불인지 보라 : node scripts/_repro-누룽지광고-0831.mjs\n')
    process.exit(0)
  }
  console.error('⛔⛔ 옛판인데 아무것도 안 걸렸다 — 이 재현판이 «사고를 재현하지 못하고» 있다.')
  console.error('   👉 재현판이 무엇을 보는지부터 고칠 것(초록불이 거짓말이 된다).\n')
  process.exit(1)
}

if (나쁨.length) {
  console.error(`⛔ 레시피 광고가 잘못 붙었다 — ${나쁨.length}건`)
  for (const b of 나쁨) console.error(`     · ${b}`)
  console.error('\n   👉 `curation.js` `picksForIngredients` 가 «재료»와 «메모»를 갈라 보는지 확인할 것.\n')
  process.exit(1)
}

// ── ④ ⛔ 규칙이 «코드에 살아 있는가» — 조용히 사라지는 걸 막는다 ──
const fn = cur.slice(cur.indexOf('export const picksForIngredients'))
const 갈랐나 = /picksForIngredients\s*=\s*\(\s*ingredients[^)]*,\s*notes/.test(fn)
  && /const tokens\s*=\s*\(ingredients\s*\|\|\s*\[\]\)/.test(fn)
if (!갈랐나) {
  console.error('⛔ `picksForIngredients` 가 재료와 메모를 «안» 가르고 있다 — 누룽지 사고가 되살아난다.')
  console.error('   👉 `matches` 낱말은 «재료 줄»에서만 훑을 것(메모는 풀네임만).\n')
  process.exit(1)
}
if (!/noRecipePick/.test(fn)) {
  console.error('⛔ `noRecipePick` 표식을 안 보고 있다 — 「레시피 광고에서만 뺀다」가 무효가 된다.\n')
  process.exit(1)
}

console.log(`✅ 메모의 설명 문장에선 광고가 «안» 붙는다 · 창업자 지정(${좋음.join('·')})은 그대로 붙는다`)
console.log('✅ 고춧가루는 레시피 광고에서 빠졌다(장보기 큐레이션 목록엔 그대로 있다)')
console.log('\n   ⛔ 옛 값으로 되돌려 진짜 걸리는지 : node scripts/_repro-누룽지광고-0831.mjs --old\n')
