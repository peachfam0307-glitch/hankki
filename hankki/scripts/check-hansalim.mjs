// 🌱🌱 배포 게이트 — 「한살림 제품에 사러가기가 «어디에도» 안 붙나」
//
// 📮 창업자 2026-08-17 = *"한살림은 조합원전용스티커붙이고 링크안달면되고,
//    자연드림은 비조합원도되니까 링크달아도돼"*
//
// ⭐⭐ **왜 게이트로 만드나 — 이건 «조용히» 새는 종류다.**
//    실제로 그날 링크를 뺀 «뒤»에도 장보기 리스트에선 사러가기가 그대로 떴다.
//    ⛔ 그때 **배포 게이트 50개가 전부 초록불**이었다 — 아무도 이 자리를 안 보고 있었으니까.
//    화면을 열어보고서야 잡았다(규칙 21). **다음엔 열어보지 않을 수도 있다.**
//
// 🔎 새는 자리가 «넷»이라 넷을 다 본다 (하나만 막으면 나머지로 샌다):
//    ① `curation.js` — 한살림 제품에 `url` 이 남아 있나
//    ② `productLink()` — 한살림이면 빈 값을 주나 (안 그러면 **네이버 검색으로 폴백**한다)
//    ③ `store.jsx addShopItem` — `noBuy` 를 «저장»하나
//       ⭐ 여기가 실제로 샌 자리다. 필드를 골라서 새 객체를 만드는 코드라 **모르는 필드는 말없이 버려진다.**
//    ④ `ShopScreen` 리스트 — `noBuy` ＋ **옛 url**(이미 담아둔 사람) 둘 다 보나 · 규칙 18 ⓙ
//
// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 연다 → **글자로 읽는다.**
//    (`check-weeklypick.mjs` 와 같은 처방)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => readFileSync(join(HERE, p), 'utf8')
const cur = 읽기('../src/data/curation.js')
const shop = 읽기('../src/screens/ShopScreen.jsx')
const detail = 읽기('../src/screens/RecipeDetailScreen.jsx')
const store = 읽기('../src/store.jsx')

let bad = 0
const no = (m) => { console.log(`  ⛔ ${m}`); bad++ }
const ok = (m) => console.log(`  ✅ ${m}`)

// ① 한살림 제품 줄에 url 이 남아 있나 — 줄 단위로 본다(제품 하나 = 한 줄)
const 한살림줄 = cur.split('\n').filter((l) => l.includes("mall: 'hansalim'"))
if (!한살림줄.length) no('한살림 제품을 한 줄도 못 읽었다 — 표식이 바뀌었나(`mall: \'hansalim\'`)')
else {
  const url붙은 = 한살림줄.filter((l) => /\burl:/.test(l))
  if (url붙은.length) no(`한살림 제품 ${url붙은.length}개에 url 이 남아 있다 — 사러가기가 붙는다\n     ${url붙은[0].trim().slice(0, 70)}…`)
  else ok(`한살림 제품 ${한살림줄.length}개 · url 붙은 것 0개`)
}

// ② productLink 가 한살림을 «맨 먼저» 걸러 내나
//    ⛔ 안 걸러 내면 url 이 없으니 `MALL_SEARCH.naver` 폴백을 타서 **네이버에서 한살림 제품을 찾는다.**
if (/export const productLink[\s\S]{0,220}isHansalim/.test(cur)) ok('productLink() 가 한살림을 걸러 낸다')
else no('productLink() 에 한살림 예외가 없다 — url 이 없으면 네이버 검색으로 폴백한다')

// ③ ⭐ store 가 noBuy 를 «저장»하나 — 오늘 실제로 샌 자리
const addBlock = store.match(/case 'addShopItem': \{[\s\S]{0,600}?\n {4}\}/)
if (!addBlock) no("store.jsx 의 addShopItem 을 못 찾았다 — 검사가 낡았다")
else if (!/noBuy/.test(addBlock[0])) no('addShopItem 이 noBuy 를 안 담는다 — 담는 순간 표식이 버려져 리스트에서 사러가기가 되살아난다')
else ok('addShopItem 이 noBuy 를 저장한다')

// ④ 리스트가 「noBuy ＋ 옛 url」 둘 다 보나 (규칙 18 ⓙ — 이미 담아둔 사람)
const rowFn = shop.match(/const noBuyRow = [^\n]+/)
if (!rowFn) no('ShopScreen 에 noBuyRow 판정이 없다')
else {
  const s = rowFn[0]
  if (!/noBuy/.test(s)) no('noBuyRow 가 noBuy 표식을 안 본다')
  else if (!/hansalim/.test(s)) no('noBuyRow 가 «옛 url»을 안 본다 — 8/17 전에 담아둔 사람은 계속 한살림 앱으로 간다(규칙 18 ⓙ)')
  else ok('리스트 판정이 noBuy ＋ 옛 url 둘 다 본다')
  if (!shop.includes('!noBuyRow(it)')) no('리스트가 noBuyRow 를 실제로 안 쓴다 — 판정만 있고 안 부르면 아무것도 안 막는다')
}

// ⑤ 레시피 상세 픽 카드도 같은 규칙인가 (한쪽만 고치면 앞뒤가 안 맞는다)
if (/isHansalim\(p\)/.test(detail)) ok('레시피 상세 픽 카드도 한살림을 걸러 낸다')
else no('레시피 상세 픽 카드에 한살림 예외가 없다 — 장보기와 앞뒤가 안 맞는다')
if (/addShopItem\(\{[^}]*noBuy/.test(detail)) ok('상세의 「다 담기」도 noBuy 를 같이 담는다')
else no('상세의 「다 담기」가 noBuy 를 안 담는다 — 거기서 담으면 리스트로 샌다')

if (bad) { console.log(`\n⛔ 한살림 검사 실패 ${bad}건`); process.exit(1) }
console.log('✅ 한살림 — 사러가기가 네 자리 어디에도 안 붙는다')
