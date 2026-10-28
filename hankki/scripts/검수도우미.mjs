// 🔎 검수 도우미 — 창업자 검수 «전에» 기계가 먼저 잡을 것을 잡는다
//
// 📮 창업자 2026-10-28 「검수도우미랑 유튜브후보판 순서대로 하자」
//    흐름 = 후보판 → 창업자 고르기 → 원문 초안 → ⭐검수 도우미 → 그림 → 검수판 → 월요일 공개
//    (docs/레시피-출처-규칙-2026-09-27.md 맨 아래)
//
// 잡는 것 (하나라도 걸리면 그 편은 검수판에 올리기 전에 고친다):
//   ① 빈 분량      — 재료 줄에 숫자·「약간」 같은 양이 없다
//   ② 숫자 차이    — 재료엔 「간장 3큰술」인데 순서엔 「간장 2큰술」
//   ③ 이름 겹침    — 같은(비슷한) 이름의 편이 이미 있다
//   ④ 재료 겹침    — 재료가 거의 같은 편이 이미 있다(만드는 법 겹칠 수 있음)
//   ⑤ 원본 링크    — 원작자 이름은 있는데 링크가 없다(또는 그 반대)
//   ⑥ 자동 그림    — icon 이 없어 앱이 그림을 «알아서» 고른다
//   ⑦ 이름에 사람  — 제목에 셰프·선생 같은 사람 이름 표시(유명인 이름 0건 원칙)
//
// ⛔ 레시피는 recipe.mjs(앱과 같은 모듈)로 읽는다 — 글자로 파싱하지 않는다.
//
// 쓰기:
//   node hankki/scripts/검수도우미.mjs                         ← 검수 표시 없는 «앞으로 열릴» 편 전부
//   node hankki/scripts/검수도우미.mjs 2026-12-21 2027-01-04   ← 그날 열리는 편
//   node hankki/scripts/검수도우미.mjs --편 "무생채,꽈리"       ← 이름 조각
//   node hankki/scripts/검수도우미.mjs --갈래 hold/SNS13-1028  ← 다른 갈래의 basics.js 로 본다(작업 트리는 안 건드림)
import { execFileSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { todayKST } from '../src/today.js'

const 인자 = process.argv.slice(2)
const 값 = (k) => { const i = 인자.indexOf(k); return i < 0 ? null : 인자[i + 1] }
const 갈래 = 값('--갈래')
const 편조각 = 값('--편')?.split(',').map((s) => s.trim()).filter(Boolean)
const 날짜들 = 인자.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a))

// ── 레시피 읽기 ─────────────────────────────────────────────
async function 읽기() {
  if (!갈래) return (await import('./recipe.mjs')).레시피들()
  // 다른 갈래 = 그 갈래의 basics.js 를 src/data 옆 임시 파일로 꺼내 «같은 import 길»로 부른다
  const 글 = execFileSync('git', ['show', `${갈래}:hankki/src/data/basics.js`], { encoding: 'utf8', maxBuffer: 64 << 20 })
  const 임시 = new URL(`../src/data/.검수도우미-${process.pid}.js`, import.meta.url)
  writeFileSync(임시, 글)
  try { return (await import(임시.href)).allBasicRecipes } finally { rmSync(임시, { force: true }) }
}
const 전부 = await 읽기()
const 오늘 = todayKST()

let 대상
if (편조각) 대상 = 전부.filter((r) => 편조각.some((p) => r.title.includes(p)))
else if (날짜들.length) 대상 = 전부.filter((r) => 날짜들.includes(r.from))
else 대상 = 전부.filter((r) => !r.review && r.from && r.from > 오늘)

// ── 재료 한 줄 풀기 ─────────────────────────────────────────
const 머리줄 = (s) => /^\[.*\]$/.test(s.trim())
const 양말 = /약간|적당량|적당히|듬뿍|넉넉히|넉넉하게|만큼|꼬집|한줌|한 줌|조금|톡톡|취향|기호|선택/
const 단위 = '(?:큰술|작은술|술|스푼|티스푼|컵|g|kg|ml|mL|L|개|대|모|장|줌|알|쪽|봉|팩|톨|마리|줄기|공기|인분|T|t)'
const 수 = '(\\d+(?:\\.\\d+)?(?:\\/\\d+)?(?:~\\d+(?:\\.\\d+)?)?)'
const 재료이름 = (s) => s.replace(/\(.*?\)/g, '').replace(new RegExp(`\\s*${수}\\s*${단위}?.*$`), '').replace(양말, '').trim()
const 재료양 = (s) => { const m = s.replace(/\(.*?\)/g, '').match(new RegExp(`${수}\\s*(${단위})`)); return m ? { n: m[1], u: m[2] } : null }
const 같은단위 = (a, b) => a === b || (/^(큰술|술|스푼|T)$/.test(a) && /^(큰술|술|스푼|T)$/.test(b))
const 정규 = (s) => s.replace(/\s+/g, '').replace(/[^\p{L}\p{N}]/gu, '')

const 재료집합 = (r) => new Set((r.ingredients || []).filter((s) => !머리줄(s)).map(재료이름).map(정규).filter((s) => s.length > 0))

// ── 검사 ───────────────────────────────────────────────────
function 검사(r) {
  const 걸림 = []
  const 재료 = (r.ingredients || []).filter((s) => !머리줄(s))

  // ① 빈 분량
  // ½·「한 공기」도 양이다 — 2026-10-28 겨울 16편 헛경보
  for (const s of 재료) if (!/[\d½⅓⅔¼¾]/.test(s) && !/(한|두|세|네|반)\s?(줌|공기|대|개|장|컵|숟갈|스푼|큰술|꼬집|모|봉|팩)/.test(s) && !양말.test(s)) 걸림.push(['① 빈 분량', `「${s}」`])

  // ② 숫자 차이 — 순서에 「재료이름 N단위」로 나온 곳만 본다
  const 표 = new Map()
  // 같은 재료가 두 줄이면(굴솥밥 간장 1·양념장 간장 4) 어느 줄인지 못 가린다 → 안 본다
  const 몇번 = new Map()
  for (const s of 재료) { const 이름 = 재료이름(s); 몇번.set(이름, (몇번.get(이름) || 0) + 1) }
  for (const s of 재료) { const 양 = 재료양(s); const 이름 = 재료이름(s); if (양 && 이름 && 몇번.get(이름) === 1) 표.set(이름, 양) }
  ;(r.steps || []).forEach((st, i) => {
    for (const [이름, 양] of 표) {
      // 앞이 글자면 다른 재료다 — 「깨소금 1.5큰술」을 「소금」으로 읽은 적 있다(2026-10-28 얼갈이 헛경보)
      const 찾 = new RegExp(`(?<![\\p{L}\\p{N}])${이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${수}\\s*(${단위})`, 'gu')
      for (const m of st.matchAll(찾)) {
        if (같은단위(m[2], 양.u) && m[1] !== 양.n) 걸림.push(['② 숫자 차이', `${i + 1}번 순서 「${이름} ${m[1]}${m[2]}」 ↔ 재료 「${양.n}${양.u}」`])
      }
    }
  })

  // ③ 이름 겹침 · ④ 재료 겹침
  const 내이름 = 정규(r.title), 내재료 = 재료집합(r)
  for (const o of 전부) {
    if (o.id === r.id) continue
    const 남 = 정규(o.title)
    if (남 === 내이름 || (Math.min(남.length, 내이름.length) >= 3 && (남.includes(내이름) || 내이름.includes(남))))
      걸림.push(['③ 이름 겹침', `「${o.title}」(${o.from || '바로'})`])
    const 남재료 = 재료집합(o)
    const 겹 = [...내재료].filter((x) => 남재료.has(x)).length
    const 합 = new Set([...내재료, ...남재료]).size
    if (합 >= 5 && 겹 / 합 >= 0.6) 걸림.push(['④ 재료 겹침', `「${o.title}」 ${Math.round((겹 / 합) * 100)}% 같음`])
  }

  // ⑤ 원본 링크
  if (r.sourceName && !r.sourceUrl) 걸림.push(['⑤ 원본 링크', `원작자 「${r.sourceName}」인데 링크 없음`])
  if (r.sourceUrl && !r.sourceName) 걸림.push(['⑤ 원본 링크', '링크는 있는데 원작자 이름 없음'])
  if (/-sns$/.test(r.id) && !r.sourceUrl) 걸림.push(['⑤ 원본 링크', 'SNS 편인데 링크 없음'])

  // ⑥ 자동 그림
  if (!r.icon) 걸림.push(['⑥ 자동 그림', 'icon 없음 — 앱이 알아서 고른다'])

  // ⑦ 이름에 사람
  // 원작자 이름(채널명)의 낱말이 제목에 들어가면 사람 이름일 수 있다 — 「이연복 마늘쫑…」을 셰프 없이도 잡는다
  const 원작낱말 = (r.sourceName || '').split(/[^\p{L}\p{N}]+/u).map((w) => w.replace(/의$/, '')).filter((w) => w.length >= 2)
  // ＋ 자주 나오는 요리하는 사람 이름 — ⚠️ 클로드가 적은 시작 목록이다(전부가 아니다) · 새로 보이면 더한다
  const 이름들 = ['백종원', '이연복', '정호영', '김대석', '류수영', '최현석', '이원일', '안성재', '정지선', '여경래', '에드워드권', '김풍', '이혜정', '승우아빠', '박막례']
  const 겹낱말 = [...new Set([...원작낱말, ...이름들])].filter((w) => r.title.includes(w))
  // 📮 창업자 2026-10-28 19:12 「b」 = SNS 편은 제목에 원작자 이름을 넣는다 → 원작 칸에 있는 이름이면 통과,
  //    원작 칸에 «없는» 사람 이름만 잡는다(남의 이름을 잘못 붙인 것)
  const 남이름 = 겹낱말.filter((w) => !원작낱말.includes(w) && !(r.sourceName || '').includes(w))
  if (남이름.length || (/셰프|쉐프|선생/.test(r.title) && !원작낱말.length)) 걸림.push(['⑦ 이름에 사람', `「${r.title}」 — 원작 칸에 없는 이름: ${남이름.join('·') || '(호칭만)'}`])

  return 걸림
}

// ── 출력 ───────────────────────────────────────────────────
console.log(`🔎 검수 도우미 — ${대상.length}편${갈래 ? ` (갈래 ${갈래})` : ''} · 오늘 ${오늘}\n`)
let 걸린편 = 0
for (const r of 대상.sort((a, b) => (a.from || '').localeCompare(b.from || ''))) {
  const 걸림 = 검사(r)
  if (!걸림.length) { console.log(`✅ ${r.from || '바로'} ${r.title}`); continue }
  걸린편++
  console.log(`⚠️ ${r.from || '바로'} ${r.title}  (${r.id})`)
  for (const [종류, 말] of 걸림) console.log(`     ${종류}  ${말}`)
}
console.log(`\n${걸린편 ? `⚠️ ${걸린편}편 걸림 — 고치거나 창업자에게 물은 뒤 검수판으로` : '✅ 다 통과'}`)
process.exitCode = 걸린편 ? 1 : 0
