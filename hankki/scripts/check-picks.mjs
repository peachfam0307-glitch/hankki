// 🛒 「주부의 장바구니」가 «엉뚱한 재료»에 붙는 걸 잡는다.
//
// 왜 있나 (2026-08-03 · 창업자 제보):
//   *"홍콩식가지볶음은 기본레시피가 아닌데 주부장바구니 광고가 붙어.
//     심지어 두유가;;; **노두유**가 들어가는데 두유가 붙었어."*
//   → 재료 줄이 `노두유 1/2작은술 (색을 내기 위함, 옵션)` 인데
//     「연세 국산콩두유」가 붙었다. **노두유(老抽)는 중국 진간장이지 두유가 아니다.**
//
// ⭐ 뿌리 = `text.includes(w)` 가 **낱말 한가운데도 잡았다.**
//    「노두유」 안에 「두유」가 들어 있으니 걸린다. 「간장게장」↔간장, 「참치액」↔참치도 같은 꼴.
//    ⚠️ CLAUDE.md 에 *"matches 를 넓게 잡으면 엉뚱한 게 붙는다"* 고 **내가 직접 적어놓고** 그랬다.
//       적어두는 걸로는 안 된다 — 그래서 검사로 만든다.
//
// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 직접 못 읽는다
//    → `check-text.mjs` 와 같이 **소스 글자를 읽는다.**
//
// ⛔ 실패하면 배포가 막힌다 — 광고가 엉뚱하게 붙는 건 «돈 받는 자리»라 더 나쁘다.
import { readFileSync } from 'node:fs'

const cur = readFileSync('src/data/curation.js', 'utf8')
const basics = readFileSync('src/data/basics.js', 'utf8')

// ── ① 제품마다 matches 낱말 뽑기 ──
const products = []
for (const m of cur.matchAll(/\{\s*name:\s*'([^']+)'[^}]*?matches:\s*\[([^\]]*)\]/g)) {
  const words = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
  if (words.length) products.push({ name: m[1], words })
}
if (products.length < 5) {
  console.error(`⛔ 큐레이션에서 matches 를 ${products.length}개밖에 못 읽었다 — 파일 모양이 바뀌었다. 이 검사를 고칠 것.`)
  process.exit(1)
}

// ── ② 우리 레시피 재료 줄 전부 ──
// ⛔⛔ [2026-08-15 고침] 여기가 «구멍»이었다.
//    옛 코드 = `/ingredients:\s*\[([\s\S]*?)\]/g` — 짧게 잡는 정규식이라
//    재료 안의 **소제목 `'[국물]'` 의 닫는 대괄호에서 그냥 멈췄다.**
//    → 소제목 «뒤»에 적힌 재료를 ①~⑥ 검사가 **한 줄도 못 봤다.**
//    🔢 실측 = 옛 방식 482줄(소제목 0개) · 지금 716줄. **234줄이 안 보이고 있었다.**
//    ⭐⭐ 그리고 이게 «조용한» 구멍이다 — 검사는 초록불인데 그 뒤 재료는 아무도 안 본다.
//       실제로 오이물김치의 「뉴슈가」가 소제목 뒤에 있어서 ⑥ 이 «사라졌다»고 잘못 외쳤다.
//    ✅ 대괄호를 «세면서» 읽는다 — 따옴표 «안»의 대괄호는 글자로 치고 안 센다.
const 재료덩어리 = (src) => {
  const out = []
  for (const m of src.matchAll(/ingredients:\s*\[/g)) {
    let i = m.index + m[0].length
    let 깊이 = 1
    const 시작 = i
    while (i < src.length && 깊이 > 0) {
      const c = src[i]
      if (c === "'") {
        // 따옴표 안은 통째로 건너뛴다(\' 는 글자다)
        i++
        while (i < src.length && src[i] !== "'") i += src[i] === '\\' ? 2 : 1
      } else if (c === '[') 깊이++
      else if (c === ']') 깊이--
      i++
    }
    out.push(src.slice(시작, i - 1))
  }
  return out
}

const lines = new Set()
for (const 덩 of 재료덩어리(basics)) {
  for (const s of 덩.matchAll(/'((?:[^'\\]|\\.)*)'/g)) lines.add(s[1].replace(/\\'/g, "'"))
}
// ⛔ 구멍이 되살아나면 배포를 막는다 — 소제목이 하나도 안 보이면 또 짧게 끊긴 것이다
const 소제목 = [...lines].filter((l) => /^\[.*\]$/.test(l))
if (소제목.length === 0) {
  console.error('\n⛔ 재료에서 «소제목»(「[국물]」 같은 줄)이 한 개도 안 보인다 — 재료를 짧게 끊어 읽고 있다.')
  console.error('   👉 `재료덩어리()` 가 대괄호를 세면서 읽는지 확인할 것.')
  console.error('   📌 2026-08-15: 소제목의 `]` 에서 멈춰 **234줄을 못 보고 있었다**(검사는 초록불이었다).\n')
  process.exit(1)
}
// ⚠️ 창업자가 «가져오기»로 넣는 재료는 우리 사전에 없다 — 실제로 터진 것부터 넣는다
for (const x of [
  '노두유 1/2작은술 (색을 내기 위함, 옵션)',   // ⛔ 2026-08-03 실제 사고
  '간장게장 200g', '참치액 1큰술', '두반장 1큰술', '고추장아찌 조금',
  '초피액젓 2큰술', '들기름 1큰술', '연유 2큰술', '생크림 100ml',
]) lines.add(x)

// ── ③ 낱말 «한가운데»에서 걸리는 것 = ⛔ ──
//    한국어는 조사가 뒤에 붙으니 앞을 기준으로 본다: `두유를`·`두유 200ml` ✅ / `노두유` ⛔
const bad = []
for (const line of lines) {
  const tokens = line.split(/[\s,()·/]+/).filter(Boolean)
  for (const p of products) {
    // ✅ 제품 «풀네임»이 줄에 그대로 있으면 창업자가 직접 적은 것 — 어차피 붙는 게 맞다
    if (line.includes(p.name)) continue
    for (const w of p.words) {
      if (!line.includes(w)) continue
      if (!tokens.some((t) => t.startsWith(w))) bad.push({ line, product: p.name, word: w })
    }
  }
}

// ── ④ ⛔ 배포를 막는 건 «규칙이 코드에 살아 있는가» 하나다 ──
//    위 ③은 「위험한 짝」을 알려줄 뿐이고, 그걸로 막으면 시끄럽다 —
//    「국수」·「두유」는 정당한 matches 이고 낱말 시작 규칙이 이미 막고 있다.
//    ⭐ 진짜 위험은 **그 규칙이 언젠가 조용히 사라지는 것**이다. 그것만 못 박는다.
const fn = cur.slice(cur.indexOf('export const picksForIngredients'))
const hasRule = /startsWith\(/.test(fn) && /split\(/.test(fn)
if (!hasRule) {
  console.error('\n⛔ `picksForIngredients` 가 «낱말 시작»으로 안 맞춘다 — 낱말 한가운데서 걸린다.')
  console.error('   2026-08-03: 재료가 「노두유」인데 「연세 국산콩두유」가 붙었다(노두유＝중국 진간장).')
  console.error('   👉 재료 줄을 낱말로 쪼개고 `tok.startsWith(w)` 로 맞출 것.\n')
  process.exit(1)
}

if (bad.length) {
  console.log(`⚠️ 장바구니 픽 — 낱말 속에 들어가 «걸릴 뻔한» 짝 ${bad.length}건 (규칙이 막고 있다)`)
  for (const b of bad) console.log(`     「${b.line.slice(0, 26)}」 ↔ ${b.product} (「${b.word}」)`)
}

// ── ⑤ ⛔ «뒤집힌 이름» — 광고가 «끊기는» 쪽 (2026-08-11) ──
//    위 ①~④ 는 전부 「엉뚱한 게 붙는 것」을 본다. 그 반대는 아무도 안 보고 있었다.
//    📮 창업자 *"소고기솥밥-해물육수가루로"* → 그 이름으로 쓰면 육수 제품이 «안» 붙는다.
//    ⭐ matches 는 「낱말 시작」으로만 맞아서 —
//       「해물가루육수」✅ ·「가루육수」✅  ／  「육수가루」⛔ ·「해물육수가루」⛔
//    ✅ 창업자 판정(2026-08-11) = *"광고붙는 이름으로하자. 가루육수나 육수가루나 그게 그거라서"*
//    ⚠️ 재료 줄만 본다 — 메모의 설명 문장(「버섯과 육수가루를 볶으면」)까지 막으면 시끄럽다.
const 뒤집힘 = [...lines].filter((l) => /육수가루/.test(l) && !/올바른가|해통령/.test(l))
if (뒤집힘.length) {
  console.error(`\n⛔ 재료에 «뒤집힌 육수 이름» ${뒤집힘.length}줄 — 이 이름으론 장바구니 광고가 «안 붙는다».`)
  for (const l of 뒤집힘) console.error(`     「${l}」`)
  console.error('   👉 「해물가루육수」로 적을 것 (「육수가루」가 아니라).')
  console.error('   📌 matches 가 «낱말 시작»으로만 맞아서 「육수가루」는 어느 제품에도 안 걸린다.\n')
  process.exit(1)
}
// ── ⑥ ⛔ 「뉴슈가」는 «아우노슈가가 아니다» — 표기 통일에 휩쓸리지 않게 (창업자 확정 2026-08-15) ──
//    📮 창업자 *"뉴슈가랑 아우노슈가는 달라. **이건 뉴슈가가 맞아**"* (오이물김치)
//    ⛔⛔ 위험이 큰 자리다 — 우리에겐 `v33` 「설탕 → 아우노슈가 표기 통일」 규칙이 있고
//       **아우노슈가는 90군데, 뉴슈가는 오이물김치 한 편에 «두 줄»뿐**이다.
//       표기 통일을 한 번만 돌려도 그 두 줄이 통째로 휩쓸린다.
//    ⭐ 그래서 「바뀌면 막는다」가 아니라 **「사라지면 막는다」**로 잰다 —
//       사라지는 것이 바로 우리가 겪을 사고이기 때문이다.
const 뉴슈가줄 = [...lines].filter((l) => /뉴슈가/.test(l))
if (뉴슈가줄.length === 0) {
  console.error('\n⛔ 재료에서 「뉴슈가」가 사라졌다 — 창업자가 2026-08-15 에 *"이건 뉴슈가가 맞아"* 로 확정한 값이다.')
  console.error('   👉 「아우노슈가」로 바꾸지 말 것 — 둘은 «다른 것»이다(창업자 확인).')
  console.error('   📌 v33 「설탕 → 아우노슈가」 표기 통일에 휩쓸린 게 아닌지 본다.\n')
  process.exit(1)
}

console.log(`✅ 장바구니 픽 — 낱말 시작 규칙 살아 있음 · 제품 ${products.length}개 × 재료 ${lines.size}줄 검사`)
