// 🔗🔗 **「내 레시피랑 «같은 것»이 앱에 이미 있나」** — 손으로 찾지 않는다 (2026-09-02)
//
// 📮 창업자 = *"아니면 내가 내일 우리집레시피를 검수판으로 보면서 찾을까.. **내 레시피랑 같은걸. 노가다로라도..**"*
//    ⛔ **규칙 8 — 노가다는 클로드가 한다.** 창업자는 «판정»만 한다.
//
// ⭐⭐ 왜 필요한가 = **제목 매칭만으로는 「이름이 바뀐 편」을 놓친다.**
//    2026-09-02 에 내가 정확히 그걸로 틀렸다 — 창업자 *"제목이 바뀌어서 안되나"* 가 맞았고
//    내 답(*"3편뿐"*)이 틀렸다. 「막국수 양념 → 새콤달콤막국수」처럼 **통째로 갈린 이름**은
//    꾸밈말을 떼는 것만으론 절대 안 걸린다.
//
// ⛔ **재료만으로 견주지 않는다** — `_판-내레시피.mjs` 가 이미 그러다 「달래장 ↔ 제육볶음」을
//    같은 요리로 묶었다. **제목 ＋ 재료를 «둘 다» 보고, 어느 한쪽이라도 세게 겹칠 때만** 올린다.
//
// ⭐ 이 도구는 **판정하지 않는다 — «의심되는 짝»을 추려 창업자에게 보여줄 뿐이다**(규칙 11).
//
// 쓰기:  node scripts/_짝찾기-백업과앱-0902.mjs <백업.json>
import { readFileSync } from 'node:fs'

const 백업 = process.argv[2]
if (!백업) { console.error('⛔ 백업 파일 경로를 준다'); process.exit(1) }

const 줄 = (a) => (a || []).map(String).filter((x) => x.trim())
const 재료줄 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('['))

// ── 재료 이름만 남긴다(양·단위·괄호를 턴다) ────────────────────────
const 재료이름 = (s) =>
  String(s)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[0-9./~]+\s*(g|kg|ml|L|리터|큰술|작은술|컵|개|장|마리|봉|줌|스푼|T|t)?/gi, ' ')
    .replace(/[^가-힣a-zA-Z]/g, ' ')
    .trim()
    .split(/\s+/)[0] || ''

const 재료셋 = (r) => new Set(재료줄(r).map(재료이름).filter((x) => x.length >= 2))

// ── 제목을 뼈대만 남긴다 ────────────────────────────────────────
const 제목뼈 = (t) =>
  String(t)
    .replace(/\([^)]*\)/g, '')
    .replace(/초간단|간단|초스피드|황금|만능|홈메이드|우리집|엄마|비법|레시피|만들기|\d+분|\d+인분/g, '')
    .replace(/[^가-힣a-zA-Z]/g, '')

const 글자겹침 = (a, b) => {
  const A = new Set(제목뼈(a)), B = new Set(제목뼈(b))
  if (!A.size || !B.size) return 0
  let n = 0; for (const c of A) if (B.has(c)) n += 1
  return n / Math.min(A.size, B.size)
}
// ⛔⛔ **재료가 1~2개뿐이면 재료 겹침을 «세지 않는다»**
//    첫 판이 이걸 안 해서 「막국수 양념(2재) ↔ 양지수육」·「바지락국(1재) ↔ 스키야키」가
//    **재료 100%** 로 올라왔다. 작은 셋은 우연히 다 겹친다 — 근거가 못 된다.
const 셋겹침 = (A, B) => {
  if (A.size < 3 || B.size < 3) return 0
  let n = 0; for (const x of A) if (B.has(x)) n += 1
  return n / Math.min(A.size, B.size)
}

// ── 앱 레시피 전부 (씨앗까지 — 창업자 편이 씨앗에 녹아들었을 수도 있다) ──
const src = readFileSync(new URL('../src/data/basics.js', import.meta.url), 'utf8')
const 앱편 = []
for (const b of src.split('\n  {\n').slice(1)) {
  const t = (b.match(/title: '([^']+)'/) || [])[1]
  if (!t) continue
  const 원 = (b.match(/원래 이름 「([^」]+)」/) || [])[1]
  const ing = (b.match(/ingredients: \[([\s\S]*?)\n    \]/) || [])[1] || ''
  const 재 = new Set(
    [...ing.matchAll(/'([^']+)'/g)].map((m) => 재료이름(m[1])).filter((x) => x.length >= 2),
  )
  앱편.push({ 제목: t, 원제목: 원 || null, 창업자: /origin: *'창업자'/.test(b), 재 })
}

// ── 이미 이름표로 이어진 것 ────────────────────────────────────
const 이어짐 = new Set()
for (const a of 앱편) { if (!a.창업자) continue; 이어짐.add(a.제목); if (a.원제목) 이어짐.add(a.원제목) }

// ── 백업에서 「아직 안 나갔다」로 남은 편 ──────────────────────────
const d = JSON.parse(readFileSync(백업, 'utf8'))
const 남은것 = d.recipes
  .filter((r) => !String(r.id || '').startsWith('basic-'))
  .filter((r) => !이어짐.has((r.title || '').trim()))

console.log(`🔎 앱에 ${앱편.length}편(창업자 이름표 ${앱편.filter((a) => a.창업자).length}) · 백업에서 «아직 안 이어진» ${남은것.length}편\n`)

const 후보 = []
for (const r of 남은것) {
  const R = 재료셋(r)
  let 최고 = null
  for (const a of 앱편) {
    const t = 글자겹침(r.title, a.제목)
    const i = 셋겹침(R, a.재)
    // ⭐⭐ **제목과 재료가 «둘 다» 받쳐줘야 올린다** — 한쪽만 세면 우연이 너무 많다.
    //    ⓐ 제목이 거의 같다(≥0.8) ＋ 재료가 어느 정도 겹친다(≥0.3)
    //    ⓑ 제목이 반쯤 같다(≥0.6) ＋ 재료가 세게 겹친다(≥0.55)   ← 이름이 통째로 바뀐 편이 여기 걸린다
    const 짝인가 = (t >= 0.8 && i >= 0.3) || (t >= 0.6 && i >= 0.55)
    const 점 = 짝인가 ? t * 0.5 + i * 0.5 : 0
    if (점 > 0 && (!최고 || 점 > 최고.점)) 최고 = { 앱: a, t, i, 점 }
  }
  if (최고) 후보.push({ 백업: r, ...최고, 재수: R.size, 걸: 줄(r.steps).length })
}

후보.sort((a, b) => b.점 - a.점)
console.log(`━━━ 「같은 것 아닐까」 싶은 짝 — ${후보.length}건 (⛔판정은 창업자) ━━━\n`)
for (const c of 후보) {
  const 표 = c.앱.창업자 ? '창업자 편' : '씨앗'
  console.log(
    `  ${(c.점 * 100).toFixed(0).padStart(3)}%  「${c.백업.title}」 (${c.재수}재 ${c.걸}걸음)` +
      `\n         ↔ 앱 「${c.앱.제목}」 [${표}]  · 제목 ${(c.t * 100).toFixed(0)}% · 재료 ${(c.i * 100).toFixed(0)}%`,
  )
}
if (!후보.length) console.log('  없다 — 제목이 바뀌어 놓친 편은 안 보인다')
