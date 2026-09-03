// 🍚➡️📱 **검수 끝난 「우리집레시피」를 창업자 «앱»에 넣는다** (2026-09-03)
//
// 📮 창업자 = *"우리집레시피 검수해놓은거 몇주치있어??"* → *"다음주 부터 나갈 것들."*
//    → *"**그걸 내 앱에 다 넣어달란건데**"* → *"58편.. **검수끝난거 걔만** 넣어주면 돼. 우선은."* → *"맞앙"*
//
// ⭐⭐ **무슨 일인가 = 「바꿔치기」다.**
//    이 41편은 **원래 창업자가 쓴 레시피**다. 우리가 다듬고 창업자가 검수해서 `basics.js` 에 넣었다.
//    그런데 **창업자 폰엔 아직 «거친 원본»이 그대로** 있다 — 재료만 있거나, 걸음이 쪼개져 있거나.
//    📌 이게 이 세션의 처음 요청 그대로다: *"검수한 레시피로 싹 바꿔주면 좋겠엉... 재료랑 만들기 다 나오게."*
//
// ⛔ **날짜를 앞당기지 않는다** — `basicRecipes` 는 `from <= today` 로 거른다(`basics.js:5683`).
//    앞당기면 **모든 유저에게** 나간다(절대원칙 28). 여기서 고치는 건 **창업자 백업 파일 하나**뿐이다.
//
// ⛔⛔ **앱 판을 «흉내내지» 않는다 — `allBasicRecipes` 를 그대로 부른다**(절대원칙 30).
//    `basics.js` 를 글자로 파싱하면 `politeSteps()` 를 안 거쳐 **화면에 안 나오는 옛 문체**가 들어간다.
//    2026-08-17 에 검수판이 정확히 그래서 창업자가 «없는 문제»를 세 편이나 짚었다.
//    ⚠️ 단 「원래 이름 「…」」은 **주석**이라 필드가 없다 → 그것만 정규식으로 읽는다.
//
// ✅ 손대는 칸 = **제목 · 재료 · 걸음 · 시간 · 인분** 다섯.
// ⛔ 안 건드리는 것 = `id` · `savedAt` · `status` · `folder` · **`decor`·`decorBg`·`image`·`icon`**(창업자가 꾸민 것) ·
//    **`memo`**(창업자 개인 메모일 수 있다 — 앱 메모로 덮지 않는다. 필요하면 창업자가 말한다)
//
// 쓰기:  node scripts/_넣기-검수41-0903.mjs <넣을백업.json> <낼백업.json>
import { readFileSync, writeFileSync } from 'node:fs'

const [입력, 출력] = process.argv.slice(2)
if (!입력 || !출력) { console.error('⛔ node scripts/_넣기-검수41-0903.mjs <넣을.json> <낼.json>'); process.exit(1) }

const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)   // KST (절대원칙 27)

// ── 앱 실물 ──────────────────────────────────────────────────────
const { allBasicRecipes } = await import('../src/data/basics.js')

// 「원래 이름 「…」」은 주석이라 필드가 없다 → 제목으로 이어붙인다
const src = readFileSync(new URL('../src/data/basics.js', import.meta.url), 'utf8')
const 원래이름 = new Map()
for (const b of src.split('\n  {\n').slice(1)) {
  const t = (b.match(/title: '([^']+)'/) || [])[1]
  const o = (b.match(/원래 이름 「([^」]+)」/) || [])[1]
  if (t && o) 원래이름.set(t, o)
}

const 낼편 = allBasicRecipes.filter(
  (r) => r.origin === '창업자' && r.review === '창업자' && r.from && r.from > 오늘,
)

const 줄 = (a) => (a || []).map(String).filter((x) => x.trim())
const 재료줄 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('['))

const d = JSON.parse(readFileSync(입력, 'utf8'))
const 찾기 = (t) => d.recipes.find((r) => (r.title || '').trim() === String(t).trim())

console.log(`🍚 검수 끝나고 «다음 주부터» 열릴 창업자 편 = ${낼편.length}편  (오늘 ${오늘})\n`)

let 바꿈 = 0, 못찾음 = []
const 줄어듦 = []
for (const a of 낼편) {
  const 옛이름 = 원래이름.get(a.title)
  const b = 찾기(옛이름 || a.title) || 찾기(a.title)
  if (!b) { 못찾음.push(a.title); continue }

  const 전 = { 제목: b.title, 재: 재료줄(b).length, 걸: 줄(b.steps).length }
  const 후 = { 재: 재료줄(a).length, 걸: 줄(a.steps).length }

  // ⭐ 저장소본은 «통째로» 갈아끼운다 — 검수가 끝난 값이다
  b.title = a.title
  b.ingredients = 재료줄(a).slice()
  b.steps = 줄(a.steps).slice()
  if (a.time) b.time = a.time
  if (a.serves) b.serves = a.serves
  바꿈 += 1

  // ⚠️ 줄어드는 편은 «반드시» 창업자에게 보인다 — 걸음이 합쳐진 것일 수도, 뭔가 빠진 것일 수도 있다
  if (후.재 < 전.재 || 후.걸 < 전.걸) 줄어듦.push({ 제목: a.title, 전, 후 })
}

// ── 안전 검사 ────────────────────────────────────────────────────
const 원 = JSON.parse(readFileSync(입력, 'utf8'))
let 탈 = 0
if (원.recipes.length !== d.recipes.length) { console.log('❌ 편 수가 바뀌었다'); 탈 += 1 }
for (const k of ['folders', 'diary', 'shop', 'fridge', 'profile', 'removedSeedIds']) {
  if (JSON.stringify(원[k]) !== JSON.stringify(d[k])) { console.log(`❌ ${k} 가 바뀌었다`); 탈 += 1 }
}
// 손댄 칸 말고 다른 칸이 바뀌었나
const 손댄칸 = new Set(['title', 'ingredients', 'steps', 'time', 'serves'])
let 딴칸 = 0
for (const a of 원.recipes) {
  const b = d.recipes.find((x) => x.id === a.id)
  if (!b) { 탈 += 1; continue }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (손댄칸.has(k)) continue
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) { 딴칸 += 1; console.log(`❌ ${a.title} · ${k} 가 바뀌었다`) }
  }
}
if (딴칸) 탈 += 1

console.log(`✅ 바꿔치운 편 ${바꿈} / ${낼편.length}`)
if (못찾음.length) console.log(`⚠️ 백업에서 짝을 못 찾은 편 ${못찾음.length} — ${못찾음.join(' · ')}`)
console.log(`편 수 ${원.recipes.length} → ${d.recipes.length} · 손댄 칸 밖 변경 ${딴칸}곳`)
console.log('⛔ 안 건드린 것 = 꾸민 표지·스티커·아이콘·메모·폴더·저장시각')

if (줄어듦.length) {
  console.log(`\n⚠️⚠️ **줄어든 편 ${줄어듦.length}** — 걸음이 «합쳐진» 것일 수도, 뭔가 «빠진» 것일 수도 있다.`)
  console.log('   ⛔ 내가 판정하지 않는다. 창업자가 본다(규칙 11).')
  for (const x of 줄어듦) {
    console.log(`   · ${x.제목.padEnd(16)} 재료 ${x.전.재}→${x.후.재} · 걸음 ${x.전.걸}→${x.후.걸}`)
  }
}

if (탈) { console.log('\n❌ 안전검사 실패 — 저장하지 않는다'); process.exit(1) }
writeFileSync(출력, JSON.stringify(d))
console.log(`\n💾 ${출력}`)
