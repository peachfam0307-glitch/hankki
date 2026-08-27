// 🍽 창업자 「그릇」 컷 108개를 앱에 넣는다 (2026-08-26)
//
// 📮 창업자 = *"새로 자른것이랑 옛날게 섞여있는데??"*
//    → *"새로자른건 이름을 다르게 붙여야 안헷갈리지..ㅠ"*
//    → *"아까반영안된컷 넣고, 방금준거잘라서검수하고넣자. **이번에갈아끼는건 이름표새로붙여 식별되게**"*
//
// ⭐⭐ **새 세대 접두어 = `gr_`(그릇)** — 이게 이 판의 핵심이다.
//    ⛔ 지난 106컷은 `fe_389~494` 로 **옛 컷과 같은 접두어에 이어 붙였다.**
//       그래서 파일명·키만 봐선 세대를 알 수 없고, 창업자가 화면에서 「섞여 보인다」를 겪었다.
//    📌 앞으로 새 세대는 **접두어를 바꾼다.** 이름이 곧 세대다.
//
// ⭐ 하는 일 = 「줄을 새로 만들지 않고 «옛 키를 새 키로 갈아끼운다»」
//    82개는 같은 요리의 옛 규칙이 이미 있다 → **그 줄의 키만** 바꾼다(규칙이 안 늘어난다).
//    13개는 전용 그림이 처음 생긴 것 → 새 줄을 «위쪽»에 넣는다(구체어 먼저 · v10.89).
//    픽커도 같은 자리에서 키만 갈아끼우므로 **갈래도 개수도 그대로**다.
//
// ⛔ 못 찾으면 «죽는다» — 조용히 지나가면 「고쳤다」고 말하게 된다(subst-guard 와 같은 뜻).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const APP = new URL('..', import.meta.url).pathname
const 목록 = JSON.parse(readFileSync(`${APP}docs/stickers/음식-창업자-2026-08-26/컷목록.json`, 'utf8'))
const 마름 = (s) => s.replace(/\(.*?\)/g, '').replace(/\s/g, '')

for (const r of 목록) {
  if (!existsSync(`${APP}src/assets/stickers/photo/${r.key}.png`)) {
    console.error(`⛔ ${r.key}.png 가 없다`); process.exit(1)
  }
}
const 올릴것 = 목록.filter((r) => r.use)
console.log(`🍽 컷 ${목록.length}개 · 픽커·규칙에 올릴 것 ${올릴것.length}개`)

// ── ① PHOTO_RATIO — ⛔비율은 «재서» 넣는다(짐작하면 앱에서 찌그러진다 · 검수 절대원칙 ④)
const S = `${APP}src/components/Stickers.jsx`
let s = readFileSync(S, 'utf8')
if (s.includes('gr_001:')) { console.error('⛔ 이미 넣었다 — 두 번 돌리지 않는다'); process.exit(1) }
const 표시 = 목록.map((r) => `${r.key}: ${r.ratio.toFixed(4)}`)
const 줄들 = []
for (let i = 0; i < 표시.length; i += 6) 줄들.push('  ' + 표시.slice(i, i + 6).join(', ') + ',')
const 표식 = 'const PHOTO_RATIO = {'
if (!s.includes(표식)) { console.error('⛔ PHOTO_RATIO 자리를 못 찾았다'); process.exit(1) }
s = s.replace(표식, `${표식}\n  // 🍽 [2026-08-26] 창업자 「그릇」 컷 108개 — 새 세대 접두어 gr_ (시트 18장)\n${줄들.join('\n')}`)
writeFileSync(S, s)
console.log(`✅ PHOTO_RATIO — ${목록.length}개`)

// ── ② ICON_RULES
const F = `${APP}src/components/FoodIcon.jsx`
let f = readFileSync(F, 'utf8')
const 줄배열 = f.split('\n')

// 규칙 줄을 찾는다 — [['이름', '별칭'], '키'],
const 규칙줄 = []
줄배열.forEach((ln, i) => {
  const m = ln.match(/^\s*\[\s*\[([^\]]*)\]\s*,\s*'([\w]+)'\s*\],\s*$/)
  if (m) 규칙줄.push({ i, 별칭: [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]), 키: m[2] })
})

// ⛔ 자동으로 못 가르는 둘 — 실물을 보고 손으로 정했다
//   ⑴ 「깍두기」 = 옛 규칙 `fh_k32` 가 **배추김치와 깍두기 둘을 한 그림으로** 대신하고 있었다.
//      이제 둘 다 전용 컷이 생겼으니 그 줄은 «배추김치»가 가져가고 깍두기는 새 줄로 갈라 나온다.
//   ⑵ 「두부조림(간장)」 = 옛 규칙의 첫 낱말이 「간장두부조림」이라 이름이 뒤집혀 못 맞췄다. 같은 요리다.
const 손판정 = { 깍두기: null, '두부조림(간장)': 'fe_422' }

const 갈아낌 = [], 새줄 = [], 못함 = []
const 쓴줄 = new Set()   // ⭐ 한 규칙줄이 «두 요리»를 대신하던 자리(fe_310 = 돼지갈비구이 ＋ 뼈없는양념돼지갈비구이).
                         //    이제 둘 다 전용 컷이 생겼으니 갈라진다 — 줄은 «첫 낱말인 쪽»이 갖고 나머지는 새 줄로.
// 첫 낱말이 자기 이름인 요리를 «먼저» 처리한다(그 줄의 임자다)
const 차례 = [...올릴것].sort((a, b) => {
  const 임자 = (r) => 규칙줄.some((g) => 마름(g.별칭[0]) === 마름(r.name)) ? 0 : 1
  return 임자(a) - 임자(b)
})
for (const r of 차례) {
  const n = 마름(r.name)
  if (r.name in 손판정) {
    const 키 = 손판정[r.name]
    if (키 === null) { 새줄.push(r); continue }
    const g = 규칙줄.find((x) => x.키 === 키)
    if (!g) { console.error(`⛔ 손판정한 규칙 ${키} 를 못 찾았다`); process.exit(1) }
    갈아낌.push({ r, g }); 쓴줄.add(g.i); continue
  }
  const 후보 = 규칙줄.filter((g) => g.별칭.some((a) => 마름(a) === n))
  // ⭐ 같은 이름이 여러 규칙에 «별칭»으로 들어 있을 수 있다(「전복죽」이 「죽」 규칙에도 있는 식).
  //    그럴 땐 «그 요리 전용» 줄을 고른다 — ⑴첫 낱말이 이 요리인 줄 ⑵그중 별칭이 제일 적은 줄.
  //    ⛔ 넓은 줄(「죽」·「김치」)의 키를 바꾸면 그 규칙이 대신하던 «다른 요리»까지 이 그림이 된다.
  const 남은 = 후보.filter((g) => !쓴줄.has(g.i))
  const 전용 = 남은.filter((g) => 마름(g.별칭[0]) === n).sort((a, b) => a.별칭.length - b.별칭.length)
  if (전용.length) { 갈아낌.push({ r, g: 전용[0] }); 쓴줄.add(전용[0].i) }
  else if (남은.length === 1) { 갈아낌.push({ r, g: 남은[0] }); 쓴줄.add(남은[0].i) }
  else if (남은.length === 0) 새줄.push(r)
  else 못함.push({ r, 개수: 남은.length, 줄: 남은.map((g) => g.별칭[0] + '→' + g.키) })
}
if (못함.length) {
  console.error(`⛔ 규칙이 여러 줄인 요리 ${못함.length}개 — 손으로 봐야 한다`)
  못함.forEach(({ r, 개수, 줄 }) => console.error(`   ${r.name} (${개수}줄) — ${줄.join(" / ")}`))
  process.exit(1)
}

// 옛 키 → 새 키 (이미 저장된 레시피용 대응표에 쓴다)
const 대응 = {}
for (const { r, g } of 갈아낌) {
  const 옛 = 줄배열[g.i]
  const 새 = 옛.replace(new RegExp(`'${g.키}'(\\s*\\],\\s*)$`), `'${r.key}'$1`)
  if (새 === 옛) { console.error(`⛔ ${r.name} 줄에서 키를 못 바꿨다: ${옛}`); process.exit(1) }
  줄배열[g.i] = 새
  if (!대응[g.키]) 대응[g.키] = r.key   // 한 옛 키가 여러 요리를 대신했으면 «첫째»만 대응표에
}
f = 줄배열.join('\n')
console.log(`✅ ICON_RULES — 옛 키를 갈아끼운 것 ${갈아낌.length}개`)

// 전용 그림이 «처음» 생긴 것 = 새 줄. ⛔위쪽에(구체어 먼저 · v10.89)
if (새줄.length) {
  const 말 = (nm) => {
    const w = new Set([nm, nm.replace(/\s/g, '')])
    if (nm.includes('(')) w.add(nm.replace(/\(.*?\)/g, '').trim())
    return [...w].filter(Boolean)
  }
  const 규칙 = 새줄.map((r) => `  [[${말(r.name).map((w) => `'${w}'`).join(', ')}], '${r.key}'],`)
  const 규칙표식 = 'const ICON_RULES = ['
  if (!f.includes(규칙표식)) { console.error('⛔ ICON_RULES 자리를 못 찾았다'); process.exit(1) }
  f = f.replace(
    규칙표식,
    `${규칙표식}\n  // 🍽 [2026-08-26] 창업자 「그릇」 컷 — «전용 그림이 처음 생긴» ${새줄.length}개만 새 줄로 적는다\n`
    + `  //   ⭐ 나머지 ${갈아낌.length}개는 «같은 이름의 옛 규칙 키만 새 키로 갈아끼웠다»(줄을 안 늘린다)\n`
    + `  //   ⛔ 구체어 먼저 — 이 블록이 아래 넓은 규칙(「무침」·「국」·「볶음」)보다 «위»에 있어야 한다\n`
    + `${규칙.join('\n')}\n`,
  )
  console.log(`✅ ICON_RULES — 새로 적은 줄 ${새줄.length}개: ${새줄.map((r) => r.name).join(' · ')}`)
}

// ── ③ 픽커(FOOD_ICON_GROUPS) — 같은 자리에서 키만 갈아끼운다(갈래·개수 그대로)
let 픽갈림 = 0, 픽추가 = []
for (const { r, g } of 갈아낌) {
  const re = new RegExp(`('${g.키}')(?=[,\\s\\]])`)
  const 앞 = f
  // FOOD_ICON_GROUPS 안에서만 바꾼다
  const gi = f.indexOf('FOOD_ICON_GROUPS')
  if (gi < 0) { console.error('⛔ FOOD_ICON_GROUPS 를 못 찾았다'); process.exit(1) }
  const 머리 = f.slice(0, gi), 몸 = f.slice(gi)
  if (re.test(몸)) { f = 머리 + 몸.replace(re, `'${r.key}'`); 픽갈림++ }
  else 픽추가.push(r)                     // 옛 키가 픽커에 없던 것(내려둔 컷)
  if (f === 앞 && re.test(몸)) { console.error(`⛔ 픽커에서 ${g.키} 를 못 바꿨다`); process.exit(1) }
}
writeFileSync(F, f)
console.log(`✅ 픽커 — 자리에서 갈아끼운 것 ${픽갈림}개`)

// ── ④ 손으로 넣어야 하는 것 = 픽커에 «자리가 없는» 컷
const 손 = [...새줄, ...픽추가]
if (손.length) {
  console.log(`\n📋 픽커에 «새로» 넣을 것 ${손.length}개 — 갈래는 손으로 고른다`)
  손.forEach((r) => console.log(`   ${r.key}  ${r.name}`))
}

// ── ⑤ 이미 저장된 레시피용 대응표(옛 키 → 새 키) — store.jsx 에 손으로 넣는다
console.log(`\n📋 store.jsx 대응표에 넣을 것 ${Object.keys(대응).length}쌍:`)
const 쌍 = Object.entries(대응).map(([o, n]) => `${o}: '${n}'`)
for (let i = 0; i < 쌍.length; i += 4) console.log('    ' + 쌍.slice(i, i + 4).join(', ') + ',')
writeFileSync(`${APP}docs/stickers/음식-창업자-2026-08-26/대응표.json`, JSON.stringify(대응, null, 1))
