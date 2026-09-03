// 📏🔧 **「T」가 작은술로 들어간 다섯 곳을 큰술로 되돌린다** (2026-09-03)
//
// 📮 창업자 확답 = *"악.. 저건 큰일인데 **T는 큰술이고 t는 작은술**이라"*
//
// 🔢 실측 근거 = `_probe-T단위-0903.mjs` (백업 259편 전수)
//    · `t` → 작은술 = **3곳 다 맞다** ✅ (육회 소스 ×2 · 알탕)
//    · `T` → 큰술  = **6곳 중 1곳만 맞다** (뚝배기 파스타만 ✅)
//    ⭐ 갈렸다는 것이 곧 증거다 — 규칙이면 여섯이 다 같게 나온다. «그때그때 판단»이 한 것이다(＝AI 정리).
//
// ⛔ 우리 코드는 결백하다(재현함) — `parseRecipeText('… 배 12T …')` 는 「배 12T」를 그대로 둔다.
//
// ⚠️⚠️ **이건 「데이터 고침」이지 「뿌리 고침」이 아니다** — 절대원칙 34(땜빵 금지).
//    이 다섯 곳만 고치면 **다음에 담는 레시피에서 또 난다.**
//    뿌리는 `src/tidy.js` 와 워커 지시문이다 → 그건 창업자 판정을 받고 따로 만든다.
//
// ⛔ 「1큰술 = 3작은술」이라 **양이 3배 틀린다** — 미감이 아니라 맛이 바뀌는 자리다.
//
// 쓰기:  node scripts/_고침-T단위-0903.mjs <넣을백업.json> <낼백업.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// 편 · 재료줄에서 찾을 옛 글자 · 바꿀 글자   (⛔ 「그 줄에 그 글자가 있을 때만」 바꾼다)
const 고침 = [
  { 편: '목살돼지갈비구이', 옛: '배 12작은술', 새: '배 12큰술' },
  { 편: '편육냉채', 옛: '고추기름 1/2작은술', 새: '고추기름 1/2큰술' },
  { 편: '편육냉채', 옛: '겨자 1/2작은술', 새: '겨자 1/2큰술' },
  { 편: '돼지고기 된장덮밥', 옛: '물 3작은술', 새: '물 3큰술' },
  { 편: 'LA갈비', 옛: '참기름 2작은술', 새: '참기름 2큰술' },
]

function 굴리기 (넣을것, 낼것) {
  const d = JSON.parse(readFileSync(넣을것, 'utf8'))
  const 편수전 = d.recipes.length
  const 손댈칸 = new Set(['ingredients'])
  const 도장 = (r) => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !손댈칸.has(k))))
  const 전도장 = new Map(d.recipes.map((r) => [r.id, 도장(r)]))

  const 탈 = []
  let 됨 = 0
  for (const c of 고침) {
    const 후보 = d.recipes.filter((r) => (r.title || '').trim() === c.편)
    if (후보.length !== 1) { 탈.push(`${c.편} — ${후보.length}편 찾음(1편이라야 한다)`); continue }
    const r = 후보[0]
    const i = (r.ingredients || []).findIndex((x) => String(x).includes(c.옛))
    if (i < 0) { 탈.push(`${c.편} — 「${c.옛}」 을 재료칸에서 못 찾았다(이미 고쳤나)`); continue }
    r.ingredients[i] = String(r.ingredients[i]).replace(c.옛, c.새)
    console.log(`  ✅ ${c.편.padEnd(18)} ${c.옛}  →  ${c.새}`)
    됨++
  }

  // ── 안전 검사 ──
  if (d.recipes.length !== 편수전) 탈.push(`편 수가 ${편수전} → ${d.recipes.length}`)
  let 그밖 = 0
  for (const r of d.recipes) if (전도장.get(r.id) !== 도장(r)) 그밖++
  if (그밖) 탈.push(`재료칸 «밖»이 ${그밖}곳 바뀌었다`)
  // ⛔ 「작은술」을 통째로 쓸어버리지 않았나 — t 로 적은 것은 «그대로» 작은술이라야 한다
  const 남은작은술 = d.recipes.filter((r) => (r.ingredients || []).some((x) => /작은술/.test(String(x)))).length
  if (남은작은술 === 0) 탈.push('작은술이 통째로 사라졌다 — 너무 많이 바꿨다')

  console.log(`\n📏 ${됨}/${고침.length}곳 · 편 수 ${편수전} → ${d.recipes.length} · 재료칸 밖 변경 ${그밖}곳`)
  console.log(`   「작은술」이 남아 있는 편 ${남은작은술} (t 로 적은 것은 그대로여야 한다)`)

  if (탈.length) {
    console.error('\n⛔ 안전 검사 실패 — 저장하지 않는다')
    for (const t of 탈) console.error('   · ' + t)
    process.exit(1)
  }
  writeFileSync(낼것, JSON.stringify(d))
  console.log(`\n💾 ${낼것}`)
  console.log('👉 이어서 확인:  node scripts/_probe-T단위-0903.mjs ' + 낼것)
}

const 내가시작 = import.meta.url === pathToFileURL(process.argv[1] || '/dev/null').href
if (내가시작) {
  const [, , 넣을것, 낼것] = process.argv
  if (!넣을것 || !낼것) { console.error('⛔ 쓰기: node scripts/_고침-T단위-0903.mjs <넣을백업.json> <낼백업.json>'); process.exit(1) }
  굴리기(넣을것, 낼것)
}

export { 고침 }
