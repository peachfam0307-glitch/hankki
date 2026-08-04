// 🖼 «빈 표지» 게이트 — 시드가 꾸민 표지를 들고 오는데 업뎃 때 그게 사라지는 걸 막는다.
//
// 왜 있나 (2026-08-04 · 창업자 폰 캡처로 잡혔다):
//   레꾸 샘플 꾸미기를 「나시고랭」→「콩국수」로 옮기며 `basics.js` 에 `thumb:'none'` ＋ `decor` 7컷을 넣었다.
//   그런데 `store.jsx` 가 기존 사용자 레시피를 시드와 합칠 때 **`decor: r.decor` 로 무조건 유저 값을 얹었다.**
//   유저는 그 레시피를 꾸민 적이 없으니 `r.decor` 가 **없다** → 시드가 들고 온 꾸미기가 **덮여서 사라지고**,
//   `thumb` 은 시드의 `'none'`(=표지를 안 그린다)이 그대로 남아 **아무것도 없는 크림색 칸**이 됐다.
//   ⭐ **「보존」과 「덮어쓰기」는 다르다 — 없는 값으로 덮으면 그건 지우는 것이다.**
//
// ⛔ 왜 아무 검사도 안 걸렸나 = 우리 검사는 전부 **새로 까는 사람**이 보는 값(`basicRecipes`)만 본다.
//    **이미 깔린 폰이 업뎃받는 길**(`migrateBasics`)은 아무도 안 보고 있었다. 오늘 문체 사고와 **같은 뿌리**다.
//
// 무엇을 보나 (둘)
//   ① `thumb:'none'` 인 시드는 **반드시** `decor` 나 `decorBg` 를 들고 있어야 한다 (안 그러면 빈 칸)
//   ② `store.jsx` 가 `decor` 를 **조건 없이** 유저 값으로 덮지 않아야 한다
import { readFileSync } from 'node:fs'
import { allBasicRecipes } from '../src/data/basics.js'

const bad = []

// ① 시드 자체 — thumb:'none' 인데 꾸미기가 없으면 그 레시피는 «영원히 빈 칸»이다
for (const r of allBasicRecipes) {
  if (r.thumb !== 'none') continue
  const hasDecor = (Array.isArray(r.decor) && r.decor.length > 0) || (r.decorBg && r.decorBg !== 'none')
  if (!hasDecor) bad.push(`시드 「${r.title}」 — thumb:'none' 인데 decor·decorBg 가 둘 다 없다 (표지가 빈 칸이 된다)`)
}

// ② 합치는 코드 — 유저 값으로 «무조건» 덮으면 안 꾸민 사람의 표지가 지워진다
const store = readFileSync(new URL('../src/store.jsx', import.meta.url), 'utf8')
for (const key of ['decor', 'decorBg']) {
  // `decor: r.decor,` 처럼 조건 없이 얹는 줄을 잡는다. `decorated ? r.decor : s.decor` 는 통과.
  const re = new RegExp(`^\\s*${key}:\\s*r\\.${key}\\s*,`, 'm')
  if (re.test(store)) {
    bad.push(`store.jsx — \`${key}: r.${key}\` 가 조건 없이 유저 값을 얹는다. ` +
             `안 꾸민 사람은 값이 없어서 시드 꾸미기가 지워진다 → \`decorated ? r.${key} : s.${key}\``)
  }
}

if (bad.length) {
  console.error(`\n⛔ 빈 표지가 나갈 수 있다 — ${bad.length}건\n`)
  for (const b of bad) console.error(`   · ${b}`)
  console.error(`\n📌 2026-08-04 에 이걸로 콩국수 표지가 «통째로 빈 칸»이 되어 나갔다.`)
  console.error(`   ⭐ 「보존」과 「덮어쓰기」는 다르다 — 없는 값으로 덮으면 그건 지우는 것이다.\n`)
  process.exit(1)
}

const decorated = allBasicRecipes.filter((r) => r.thumb === 'none').map((r) => r.title)
console.log(`✅ 표지 통과 — 꾸민 시드 ${decorated.length}편(${decorated.join('·') || '없음'}), 빈 표지 0`)
