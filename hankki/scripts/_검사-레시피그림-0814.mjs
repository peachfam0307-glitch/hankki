// 🍱🍱 «레시피 제목» ↔ «실제 붙은 그림이 원래 무슨 요리였나» 전수 대조
//
//   📮 창업자 *"내가 이름까지 다 붙여서 뽑아줬어 원본찾아서 레시피에 대조해서 맞는그림 들어갔는지 확인해"*
//   📮 창업자 *"두부참치찌개에 왜 고등어구이가 들어가있는지 의문."*
//
// ⛔⛔ **어제 진단이 절반 틀렸다** — 「`ICON_RULES` 의 참치 규칙이 범인」이라 했는데,
//    `Thumb.jsx:93` 은 `recipe.icon || guessFoodIcon(...)` 이다. **박아 넣은 `icon:` 이 우선**이라
//    두부참치찌개는 규칙을 아예 안 탄다. `basics.js:3504` 에 `icon: 'fh_k18'` 이 **손으로 박혀** 있다.
//    📌 그러니 규칙만 고쳐선 안 고쳐진다. 박힌 값을 봐야 한다.
//
// ⭐ 「그 그림이 원래 뭐였나」는 **창업자가 붙인 이름**에서 온다 — 두 군데를 합친다:
//    ① 픽셀 대조(`_대조-원본레시피-0814.py`) = 창업자 낱개 ↔ 앱 컷을 그림으로 이어붙인 표
//    ② `scripts/icon-checked.json` 의 「판독」 = 눈으로 보고 적어둔 이름표
//    ⛔ 문서의 매핑표는 «안» 쓴다 — 이름을 바꿔 넣으면서 표가 낡는 게 이번 사고의 뿌리다.
import { readFileSync, existsSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const R = (p) => readFileSync(new URL(p, 뿌리), 'utf8')

// ── ① 그림 → 원래 이름 사전 ──────────────────────────────
const 이름표 = new Map()
const 출처 = new Map()

const 판독 = JSON.parse(R('scripts/icon-checked.json')).판독 || {}
for (const [k, v] of Object.entries(판독)) {
  const nm = typeof v === 'string' ? v : v?.이름 || v?.name
  if (nm) { 이름표.set(k, nm); 출처.set(k, '판독기록') }
}

const 대조판 = new URL('docs/_대조-원본-앱-0814.json', 뿌리)
if (existsSync(대조판)) {
  for (const r of JSON.parse(readFileSync(대조판, 'utf8'))) {
    if (!r.앱키 || r.거리 > 6 || !r.이름) continue
    const 키 = r.앱키.replace(/^.*\//, '').replace(/\.png$/, '')
    이름표.set(키, r.이름)          // 픽셀이 문서보다 세다 — 덮어쓴다
    출처.set(키, `창업자 ${r.폴더}`)
  }
}

// ── ② 레시피 전편 (basics + weekly 본문) ──────────────────
const src = R('src/data/basics.js')
const 편 = []
for (const m of src.matchAll(/id:\s*'([^']+)',\s*\n?\s*title:\s*'([^']+)'([^\n]*)\n(?:[^\n]*\n){0,6}?\s*icon:\s*'([^']+)'/g)) {
  편.push({ id: m[1], 제목: m[2], 아이콘: m[4], 잠금: /from:/.test(m[3]) })
}
if (편.length < 100) {
  console.error(`⛔ 레시피를 ${편.length}편밖에 못 읽었다 — basics.js 모양이 바뀌었다. 검사를 고칠 것(규칙 18).`)
  process.exit(1)
}

// ── ③ 「같은 요리인가」 ────────────────────────────────────
// ⛔ 기계가 «완벽히» 가를 수는 없다. 그래서 «확실히 다른 것»만 빨간 줄로 올리고 나머진 눈으로 본다.
const 다듬기 = (s) => s.replace(/[\s\-_()]/g, '').replace(/^\d+분?/, '').replace(/^(간단|초간단|매운|매콤)/, '')
const 겹치나 = (a, b) => {
  const x = 다듬기(a), y = 다듬기(b)
  if (!x || !y) return 0
  if (x.includes(y) || y.includes(x)) return 1
  let best = 0                                   // 가장 긴 «연속» 겹침
  for (let i = 0; i < x.length; i++)
    for (let j = i + 2; j <= x.length; j++)
      if (y.includes(x.slice(i, j))) best = Math.max(best, j - i)
  return best / Math.min(x.length, y.length)
}

const 결과 = 편.map((r) => {
  const 원래 = 이름표.get(r.아이콘) || null
  return { ...r, 원래, 출처: 출처.get(r.아이콘) || null, 점수: 원래 ? 겹치나(r.제목, 원래) : null }
})

const 어긋 = 결과.filter((r) => r.원래 && r.점수 < 0.5)
const 애매 = 결과.filter((r) => r.원래 && r.점수 >= 0.5 && r.점수 < 1)
const 모름 = 결과.filter((r) => !r.원래)

// ── ④ 같은 그림을 둘 이상이 쓰나 ─────────────────────────
const 겹침 = new Map()
for (const r of 결과) {
  if (!겹침.has(r.아이콘)) 겹침.set(r.아이콘, [])
  겹침.get(r.아이콘).push(r.제목)
}
const 중복 = [...겹침].filter(([, v]) => v.length > 1)

console.log(`\n🍱 레시피 ${편.length}편 — 붙은 그림이 그 요리가 맞나\n`)
console.log(`  ⛔ 딴 요리 그림  : ${어긋.length}편`)
console.log(`  ⚠️ 아슬아슬      : ${애매.length}편`)
console.log(`  ❔ 이름 모르는 컷 : ${모름.length}편  (창업자 원본에도 판독기록에도 없다)`)
console.log(`  🔁 같은 그림 겹침 : ${중복.length}쌍\n`)

if (어긋.length) {
  console.log('── ⛔ 딴 요리 그림이 붙은 편 ──')
  for (const r of 어긋)
    console.log(`  ${r.제목.padEnd(18)} → ${r.아이콘.padEnd(9)} = 「${r.원래}」  ${r.잠금 ? '🔒' : ''}`)
}
if (애매.length) {
  console.log('\n── ⚠️ 아슬아슬 (눈으로 볼 것) ──')
  for (const r of 애매) console.log(`  ${r.제목.padEnd(18)} → ${r.아이콘.padEnd(9)} = 「${r.원래}」`)
}
if (중복.length) {
  console.log('\n── 🔁 같은 그림을 둘 이상이 쓴다 ──')
  for (const [k, v] of 중복) console.log(`  ${k.padEnd(9)} = 「${이름표.get(k) || '?'}」 → ${v.join(' · ')}`)
}
console.log(`\n  (이름 모르는 컷 ${모름.length}편은 --모름 으로 본다)`)
if (process.argv.includes('--모름')) {
  console.log('\n── ❔ 이름을 모르는 컷 ──')
  for (const r of 모름) console.log(`  ${r.제목.padEnd(18)} → ${r.아이콘}`)
}
