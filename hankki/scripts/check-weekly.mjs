// 🗓 이번 주 레시피 재고 검사 — 「매주 온다」는 약속이 끊기기 «전에» 알려준다.
//
// 왜 있나 (2026-08-03): 주간 레시피는 **재고가 없으면 홈에서 줄을 아예 안 그린다**(빈 자리 금지).
//   그건 맞는 동작이지만 ⭐**조용히 사라진다**는 뜻이기도 하다 —
//   어느 월요일 아침에 그냥 없어지고, 아무도 모른 채 몇 주가 간다.
//   📌 창업자 원문: *"매주마다 레시피 하나씩 올리는데 이번주는 이거"* — **약속이니까 끊기면 안 된다.**
//
// ⛔ 시끄러운 게이트는 죽은 게이트다 → **재고가 3주 밑일 때만** 실패시킨다.
//   그 위로는 조용히 통과. (지금 몇 주 남았는지는 `npm run weekly` 로 언제든 본다)
import { WEEKLY, weeklyNow, weeksLeft, todayKST } from '../src/data/weekly.js'
// ⚠️ 「잠긴 것까지 전부」를 봐야 한다 — 주간 레시피는 그 주가 와야 열리므로
//    (오늘 열린 것)로 보면 다음 주 것을 「없는 id」로 잘못 잡는다.
import { allBasicRecipes as basicRecipes } from '../src/data/basics.js'

const MIN_WEEKS = 3   // 이 밑으로 내려가면 배포를 막는다(= 채울 시간을 강제로 만든다)

const t = todayKST()
const bad = []

// ① 가리키는 레시피가 실제로 있나 — id 오타·삭제를 잡는다
const ids = new Set(basicRecipes.map((r) => r.id))
for (const w of WEEKLY) {
  const miss = w.ids.filter((id) => !ids.has(id))
  if (miss.length) bad.push(`${w.from} 「${w.title}」 — 없는 레시피 id: ${miss.join(', ')}`)
  if (w.ids.length === miss.length) bad.push(`${w.from} 「${w.title}」 — 레시피가 하나도 없다(그 주엔 줄이 안 그려진다)`)
  if (!w.why || w.why.length < 10) bad.push(`${w.from} 「${w.title}」 — «올린 이유»(why)가 비었다`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(w.from)) bad.push(`${w.from} — 날짜 꼴이 아니다`)
  // ⚠️ 월요일이 아니면 「이번 주」가 주 중간에 바뀐다(창업자 확정 = 월요일)
  const d = new Date(`${w.from}T00:00:00Z`).getUTCDay()
  if (d !== 1) bad.push(`${w.from} 「${w.title}」 — 월요일이 아니다(${'일월화수목금토'[d]}요일). 「이번 주」는 월요일에 바뀐다`)
}

// ② 날짜가 겹치나
const froms = WEEKLY.map((w) => w.from)
if (new Set(froms).size !== froms.length) bad.push('같은 날짜가 두 번 있다')

if (bad.length) {
  console.error(`\n⛔ 이번 주 레시피 설정에 문제가 ${bad.length}건 있다.\n`)
  for (const b of bad) console.error(`   ${b}`)
  console.error(`\n👉 고치는 곳 = src/data/weekly.js\n`)
  process.exit(1)
}

// ③ 재고
const left = weeksLeft()
const now = weeklyNow(basicRecipes)
if (left < MIN_WEEKS) {
  console.error(`\n⛔ 이번 주 레시피 재고가 «${left}주»밖에 안 남았다 (기준 ${MIN_WEEKS}주).\n`)
  console.error(`   오늘 = ${t} · 지금 열려 있는 주 = ${now ? `「${now.title}」` : '없음'}`)
  console.error(`   마지막 주 = ${froms.sort().at(-1)}\n`)
  console.error(`   📌 재고가 마르면 홈의 「이번 주」 줄이 **조용히 사라진다.**`)
  console.error(`      「매주 온다」는 약속이라 끊기면 안 하느니 못하다.\n`)
  console.error(`   👉 src/data/weekly.js 에 다음 주를 채운다.`)
  console.error(`      바닥 = docs/52주-제철표-2026-08-01.md (제철 재료 + 요리 셋)\n`)
  process.exit(1)
}

console.log(`✅ 이번 주 레시피 — 지금 「${now ? now.title : '없음'}」 · 앞으로 ${left}주치 남음 (${WEEKLY.length}주 등록)`)
