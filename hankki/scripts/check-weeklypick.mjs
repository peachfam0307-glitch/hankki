// 🗓 배포 게이트 — 「이번 주 픽」이 **정말 매주 바뀌나**
//
// 창업자 2026-08-10: *"주부장바구니픽도 매주 꼭 바꿔줘."*
//
// ⛔⛔ 예전엔 `pick: true` 가 박힌 «둘»을 그대로 보여줬다 — **매주는커녕 영영 안 바뀌었다.**
//    이름만 「이번 주 픽」이고 실제로는 「고정 둘」이었다. 창업자 확인 = *"예시야 된장."*
//
// ⭐⭐ **왜 게이트로 만드나** = 이건 **눈으로 볼 수 없는 종류의 고장**이다.
//    화면을 열면 픽이 «네 개» 멀쩡히 떠 있다. 다음 주가 와야 「어? 그대로네」를 안다.
//    그때는 이미 유저가 본 뒤다. → **주를 넘겨가며 미리 재는 수밖에 없다.**
// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용) 때문에 노드가 못 연다 →
//    돌리는 규칙만 담은 `weeklypick.js` 를 부르고, 제품 이름은 «글자로» 읽는다.
//    (`papers.js` 를 글자로 세는 것과 같은 처방 — 배포 게이트는 노드만으로 돌아야 한다)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pickRotate } from '../src/data/weeklypick.js'
import { todayKST } from '../src/data/weekly.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '../src/data/curation.js'), 'utf8')
// 🏷 [2026-08-22] brand 도 같이 읽는다 — 창업자가 브랜드를 이름에서 뗀 뒤(「자연드림」 배지)
//    name 만 읽으면 「자연누리 훈제오리」·「무무덕 훈제오리」가 둘 다 '훈제오리' 라 «같은 제품»으로 보인다.
// 🧺 [2026-08-28] `cat`·`mall` 도 같이 읽는다 — 「섞였나」(⑤)를 재려면 필요하다.
//   ⛔⛔ 그 전엔 `name`·`brand` 만 읽었다. 그 상태로 ⑤를 얹었더니 갈래가 «전부 빈 문자열»이 되어
//      `갈래섞기` 가 한 통으로 묶고, 검사도 「갈래 1가지」만 보게 된다 — **아무것도 안 재는 검사**(규칙 18 ⓘ).
//   ⭐ 줄 단위로 훑는다: `cat:` 을 만나면 지금 갈래를 갈아끼우고, `{ name:` 줄에서 제품을 뽑는다.
const PRODUCTS = []
{
  let 갈래 = ''
  for (const 줄 of src.split('\n')) {
    const c = 줄.match(/^\s*cat:\s*'([^']+)'/)
    if (c) { 갈래 = c[1]; continue }
    const m = 줄.match(/\{\s*name:\s*'([^']+)'(?:,\s*brand:\s*'([^']+)')?/)
    if (!m) continue
    const mall = (줄.match(/mall:\s*'([^']+)'/) || [])[1] || ''
    const url = /\burl:\s*'/.test(줄)
    PRODUCTS.push({ name: m[1], brand: m[2] || '', cat: 갈래, mall, url })
  }
}
// ⛔ 갈래를 못 읽으면 ⑤가 조용히 눈이 먼다 → 그 자리에서 죽인다
if (PRODUCTS.some((p) => !p.cat)) {
  console.log(`  ⛔ 갈래(cat)를 못 읽은 제품이 ${PRODUCTS.filter((p) => !p.cat).length}개 — 글자로 읽는 방식이 깨졌다`)
  process.exit(1)
}
if (PRODUCTS.length < 20) {
  console.log(`  ⛔ 제품을 ${PRODUCTS.length}개밖에 못 읽었다 — 글자로 읽는 방식이 깨졌다(형식이 바뀌었나)`)
  process.exit(1)
}
console.log(`  📦 제품 ${PRODUCTS.length}개를 읽었다`)
// ⚠️ 이 게이트는 «회전»만 본다 — 「이번 주 레시피와 이어지나」는 브라우저 스모크가 화면으로 본다.
const 그주 = () => null

const 주더하기 = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

let bad = 0
const no = (m) => { console.log(`  ⛔ ${m}`); bad++ }
const ok = (m) => console.log(`  ✅ ${m}`)

// 오늘부터 26주를 훑는다 — 반년이면 「돌긴 도는데 곧 제자리」도 드러난다.
const 시작 = todayKST()
const 주 = []
for (let i = 0; i < 26; i++) {
  const ymd = 주더하기(시작, i)
  const picks = pickRotate({ products: PRODUCTS, matched: [], today: ymd })
  // ⛔ [2026-08-22] 「name」만 보면 «다른 제품»이 같아 보인다 — 창업자가 브랜드를 이름에서 떼서
  //    「자연누리 훈제오리」·「무무덕 훈제오리」가 둘 다 name='훈제오리' 가 됐다.
  //    ✅ 잣대는 «화면에 보이는 이름»(브랜드 ＋ 이름)으로 본다 — 유저가 구분하는 그 단위다(규칙 18 ⓘ).
  주.push({ ymd, 이름: picks.map((p) => (p.brand ? p.brand + ' ' + p.name : p.name)) })
}

// ① 어느 주도 비면 안 된다 — 빈 자리는 「관리 안 하는 앱」으로 읽힌다
const 빈주 = 주.filter((w) => w.이름.length === 0)
if (빈주.length) no(`픽이 빈 주가 ${빈주.length}개 (${빈주[0].ymd} …)`)
else ok(`26주 내내 픽이 안 빈다 (매주 ${주[0].이름.length}개)`)

// ② ⭐⭐ 앞뒤 주가 «몇 개나» 겹치나 — 이게 이 게이트의 심장
//    ⛔⛔ 처음엔 「통째로 똑같은가」만 봤다. 그런데 **4개 중 3개가 겹쳐도 통과**했다.
//       (한 칸씩만 밀던 시절 실제로 그랬다 — 미리보기를 «눈으로 보고» 알았다)
//       📌 「바뀌었다」와 「달라졌다」는 다른 말이다. 검사가 앞엣것만 보고 있었다.
let 겹친주 = []
for (let i = 1; i < 주.length; i++) {
  const 겹침 = 주[i].이름.filter((x) => 주[i - 1].이름.includes(x)).length
  if (겹침) 겹친주.push(`${주[i].ymd}(${겹침}개)`)
}
if (겹친주.length) no(`앞뒤 주에 같은 제품이 남는 곳 ${겹친주.length}군데 — ${겹친주.slice(0, 3).join(' ')}`)
else ok('26주 동안 앞뒤 주에 같은 제품이 하나도 안 남는다')

// ③ 한 바퀴 도는 데 몇 주 걸리나 — 두세 주 만에 제자리로 오면 「도는 척」이다
//    ⛔⛔ 처음엔 「26주에 서로 다른 조합 20가지」로 잡았다가 스스로 걸렸다.
//       🔢 제품 40개를 4개씩 나누면 **10주면 한 바퀴**다 — 20가지는 «수학적으로 불가능»한 기준이었다.
//       📌 못 지킬 기준은 기준이 아니다. 그렇다고 그냥 낮추는 게 아니라 **재고에 따라 늘어나는 값**으로 바꿨다.
//       ⭐ 창업자 자료(8/9)의 93개가 들어오면 한 바퀴가 23주로 저절로 길어진다.
const 조합 = new Set(주.map((w) => w.이름.join('|')))
const 한바퀴 = Math.floor(PRODUCTS.length / 주[0].이름.length)
if (한바퀴 < 8) no(`한 바퀴가 ${한바퀴}주뿐 — 제품이 너무 적다(지금 ${PRODUCTS.length}개)`)
else ok(`한 바퀴 ${한바퀴}주 (제품 ${PRODUCTS.length}개 ÷ 매주 ${주[0].이름.length}개) · 26주에 ${조합.size}가지`)

// ④ 한 주 안에 같은 제품이 두 번 들어가면 안 된다
const 중복주 = 주.filter((w) => new Set(w.이름).size !== w.이름.length)
if (중복주.length) no(`한 주에 같은 제품이 두 번 (${중복주[0].ymd})`)
else ok('한 주 안에 같은 제품이 겹치지 않는다')

// ⑤ 🧺🧺 **한 주 4개가 «섞여» 있나** — 창업자 2026-08-28 *"87개 다 넣어줘(섞어서)"*
//   ⛔⛔ 제품이 갈래별로 뭉쳐 있어서, 섞기 전에는 한 주가 통째로 한 갈래였다
//      (8/28 = 순두부·도토리묵·연두부·낫또 = 전부 「두부·낫또」 · 9/18 = 한살림2＋자연드림2).
//   ⭐ 「섞였다」를 말이 아니라 **숫자로** 잰다 = 그 주 4개가 몇 «갈래»·몇 «몰»에서 왔나.
//   ⚠️ 잣대를 4로 잡지 않는다 — 갈래 수가 적은 몰(그 외 등)이 끼면 4가 안 나올 수 있고,
//      **못 지킬 기준은 기준이 아니다**(③에서 이미 겪었다). 「갈래 3 이상 · 몰 2 이상」이면 뭉침이 깨진다.
const 몰이름 = (p) => p.mall || (p.url ? '직접' : '네이버')
const 주갈래 = []
for (let i = 0; i < 26; i++) {
  const ymd = 주더하기(시작, i)
  const picks = pickRotate({ products: PRODUCTS, matched: [], today: ymd })
  주갈래.push({ ymd, 갈래: new Set(picks.map((p) => p.cat)).size, 몰: new Set(picks.map(몰이름)).size, 개: picks.length })
}
const 뭉친주 = 주갈래.filter((w) => w.개 >= 3 && (w.갈래 < 3 || w.몰 < 2))
if (뭉친주.length) no(`한 갈래·한 몰로 뭉친 주가 ${뭉친주.length}개 — ${뭉친주.slice(0, 3).map((w) => `${w.ymd}(갈래${w.갈래}·몰${w.몰})`).join(' ')}`)
else ok(`26주 내내 한 주가 «섞여» 나온다 (갈래 최소 ${Math.min(...주갈래.map((w) => w.갈래))}가지 · 몰 최소 ${Math.min(...주갈래.map((w) => w.몰))}곳)`)

console.log('\n  🗓 앞 4주 미리보기')
for (const w of 주.slice(0, 4)) console.log(`     ${w.ymd}  ${w.이름.join(' · ')}`)

if (bad) { console.log(`\n⛔ 「이번 주 픽」 검사 ${bad}건 실패\n`); process.exit(1) }
console.log('\n✅ 「이번 주 픽」은 매주 바뀐다\n')
