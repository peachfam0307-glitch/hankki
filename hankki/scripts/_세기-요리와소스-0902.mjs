// 🍚🥣 **「양념장 말고 «요리»는 몇 편인가」** — 창업자 백업을 갈라 센다 (2026-09-02)
//
// 📮 창업자 = *"양념장들말고 요리는 없어? **우리집레시피에 나갈 요리들 되게 많지않아??**"*
//
// ⭐⭐ 왜 이 도구가 필요한가 — `_판-내레시피.mjs` 는 **걸음 수**로만 갈랐다(🅰🅱🅲).
//    그래서 「소스인데 걸음이 3개」와 「요리인데 걸음이 3개」가 **같은 칸**에 들어간다.
//    창업자가 물은 것은 «걸음 수»가 아니라 **«무엇인가»**다 → 축을 하나 더 세운다.
//
// ⛔ **낱말로 가르되 «눈으로 볼 수 있게» 전부 찍는다** — 자동 판정만 믿지 않는다(규칙 21).
//    ⭐ 애매한 것은 아래 손판정표(`손판정`)에 «이유와 함께» 박는다. 낱말 규칙만으로는 못 가른다:
//       · 「달래장」 = 양념(비벼 먹는 장)   ↔  「마늘간장 계란장」·「꼬막장」 = 요리(밑반찬)
//       · 「물회육수」·「전 반죽」·「육전 밑간」 = 요리에 «들어가는 것»이라 양념 쪽
//       · 「고기 소분 기준」 = 레시피가 아니라 «메모»다 — 어느 쪽도 아니다
//
// ⛔ 레시피 «내용»은 안 찍는다 — 이 저장소는 공개(public)다. **제목·줄수·갈래만.**
//
// 쓰기:  node scripts/_세기-요리와소스-0902.mjs <백업.json>
//        (백업은 scratchpad 에서만 읽는다 — ⛔저장소에 두지 않는다)
import { readFileSync } from 'node:fs'

const 백업 = process.argv[2]
if (!백업) {
  console.error('⛔ 백업 파일 경로를 준다:  node scripts/_세기-요리와소스-0902.mjs <백업.json>')
  process.exit(1)
}

const 줄 = (a) => (a || []).map(String).filter((x) => x.trim())
const 재료수 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('[')).length
const 걸음수 = (r) => 줄(r.steps).length

// ── ① 손판정 (낱말 규칙이 못 가르는 것) ─────────────────────────────
const 손판정 = new Map([
  ['달래장', '양념'],            // 비벼 먹는 장이다
  ['마늘간장 계란장', '요리'],   // 밑반찬 — 「장」이 붙었지만 계란 요리다
  ['꼬막장', '요리'],            // 밑반찬
  ['장똑똑이', '요리'],          // 소고기 조림 반찬
  ['물회육수', '양념'],          // 요리에 «들어가는» 국물
  ['전 반죽', '양념'],           // 요리에 «들어가는» 것
  ['피클초', '양념'],
  ['고기 소분 기준', '메모'],    // ⛔레시피가 아니다 — 고기 나누는 기준을 적어둔 것
  // ⛔ 낱말 규칙에 «잘못» 걸린 것 — 「양념구이」는 굽는 요리지 양념이 아니다
  //    📌 처음 돌렸을 때 이게 양념 칸에 들어가 있었고, 목록을 눈으로 훑어서 잡았다(규칙 21).
  ['한우채끝 소고기양념구이', '요리'],
])

// ── ② 낱말 규칙 ─────────────────────────────────────────────────
const 양념낱말 = /소스|양념|밑간|다래|늑맘|마요간장/

const 갈래 = (r) => {
  const t = (r.title || '').trim()
  if (손판정.has(t)) return 손판정.get(t)
  return 양념낱말.test(t) ? '양념' : '요리'
}

// ── ③ 앱에 이미 나갔나 = `basics.js` 의 `origin: '창업자'` 이름표 ──────
//    ⛔ 재료로 더듬지 않는다(`_판-내레시피.mjs` 와 같은 이유 — 셀 때마다 숫자가 달라진다)
const src = readFileSync(new URL('../src/data/basics.js', import.meta.url), 'utf8')
const 앱에 = new Set()
for (const b of src.split('\n  {\n').slice(1)) {
  if (!/origin: *'창업자'/.test(b)) continue
  const t = (b.match(/title: '([^']+)'/) || [])[1]
  const 원 = (b.match(/원래 이름 「([^」]+)」/) || [])[1]
  if (t) 앱에.add(원 || t)
  if (원 && t) 앱에.add(t)
}

// ── ④ 세기 ──────────────────────────────────────────────────────
const d = JSON.parse(readFileSync(백업, 'utf8'))
const 내것 = d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))

const 편 = 내것.map((r) => {
  const 재 = 재료수(r)
  const 걸 = 걸음수(r)
  return {
    제목: (r.title || '(제목없음)').trim(),
    재, 걸,
    갈래: 갈래(r),
    // 🅰 바로 낼 수 있다(걸음 3↑ ＋ 재료 있음) · 🅱 순서가 1~2걸음 · 🅲 재료만 · 🅾 재료도 없음
    상태: 걸 >= 3 && 재 > 0 ? '🅰' : 걸 >= 1 ? '🅱' : 재 > 0 ? '🅲' : '🅾',
  }
})
편.forEach((p) => { p.앱 = 앱에.has(p.제목) })

const 셈 = (조건) => 편.filter(조건).length
const 요리 = (p) => p.갈래 === '요리'
const 양념 = (p) => p.갈래 === '양념'

console.log(`📂 ${백업.split('/').pop()}`)
console.log(`총 ${d.recipes.length}편 · 씨앗 ${d.recipes.length - 내것.length} · 창업자가 넣은 것 ${내것.length}\n`)

console.log('━━━ ① 요리인가 양념인가 ━━━')
console.log(`  🍚 요리   ${String(셈(요리)).padStart(3)}편`)
console.log(`  🥣 양념   ${String(셈(양념)).padStart(3)}편`)
console.log(`  📝 메모   ${String(셈((p) => p.갈래 === '메모')).padStart(3)}편   (레시피가 아니다)`)

console.log('\n━━━ ② 앱에 이미 나갔나 ━━━')
console.log(`  🍚 요리 — 나감 ${셈((p) => 요리(p) && p.앱)} · 아직 ${셈((p) => 요리(p) && !p.앱)}`)
console.log(`  🥣 양념 — 나감 ${셈((p) => 양념(p) && p.앱)} · 아직 ${셈((p) => 양념(p) && !p.앱)}`)

console.log('\n━━━ ③ 아직 안 나간 «요리» 를 완성도로 ━━━')
for (const [기호, 이름] of [['🅰', '바로 낼 수 있다 (걸음 3↑ ＋ 재료)'], ['🅱', '순서가 1~2걸음'], ['🅲', '재료만 있다'], ['🅾', '재료도 걸음도 없다']]) {
  const 목 = 편.filter((p) => 요리(p) && !p.앱 && p.상태 === 기호)
  console.log(`\n  ${기호} ${이름} — ${목.length}편`)
  for (const p of 목.sort((a, b) => b.걸 - a.걸 || b.재 - a.재)) {
    console.log(`     ${String(p.재).padStart(2)}재 ${String(p.걸).padStart(2)}걸음  ${p.제목}`)
  }
}

console.log('\n━━━ ④ 아직 안 나간 «양념» (참고) ━━━')
const 양념남 = 편.filter((p) => 양념(p) && !p.앱)
console.log(`  ${양념남.length}편 — ${양념남.map((p) => p.제목).sort().join(' · ')}`)
