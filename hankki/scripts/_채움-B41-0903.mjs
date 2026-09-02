// 🅱🅱 **「순서가 모자란 편」을 채우기 «전»에 무엇이 있는지부터 본다** (2026-09-03)
//
// 📮 창업자 = *"악.. 오늘은 레시피데이구나... **b40편 채우기 시작해**"*
//
// ⛔⛔ **바로 쓰기 시작하면 안 된다 — 세 가지를 먼저 갈라야 한다.**
//
//  ⑴ **🅱 라는 이름표가 부정확하다.** 판정식이 `걸음>=3 && 재료>0` 이라
//     **걸음이 8개여도 재료가 0이면 🅱 로 떨어진다.** 그런 편은 「걸음을 쓸」 게 아니라 «재료»를 채워야 한다.
//     📌 목록을 눈으로 훑다 잡았다(규칙 21) — 숫자만 봤으면 41편에 같은 처방을 냈을 것이다.
//
//  ⑵ **앱에 이미 «좋은 판»이 있는 편이 섞여 있다.** 보기 = 감바스(창업자가 직접 만들어 보고 준 값 · v10.76).
//     백업의 거친 판만 보고 새로 쓰면 **있는 것을 또 만드는 것**이다(규칙 17).
//     ⭐ 2026-09-03 의 41편 교체는 «제목이 같은 것»만 이었다 → **이름이 갈린 짝**이 여기 남아 있을 수 있다.
//
//  ⑶ **채울 «재료»가 정말 있나.** `memo`·`rawText` 에 근거가 없으면 ⛔지어내지 않는다.
//     그런 편은 창업자에게 «물어볼 것»으로 남긴다.
//
// ⛔ 레시피 «내용»은 저장소에 안 적는다 — 이 저장소는 공개(public)다.
//    이 파일엔 **판정 규칙만** 있고, 내용은 scratchpad 로만 나간다.
//
// ⭐ 절대원칙 30 = 앱 쪽은 «앱과 같은 모듈»(`allBasicRecipes`)을 부른다. 파싱해서 흉내내지 않는다.
//
// 쓰기:  node scripts/_채움-B41-0903.mjs <백업.json> [낼곳.md] [🅱|🅲]
//   ⭐ 세 번째 인자로 «어느 무리»를 볼지 고른다(기본 🅱). 🅲 = 재료만 있고 걸음이 0인 편.
//      ⛔ 무리마다 도구를 새로 만들지 않는다 — 그러면 판정 규칙이 갈리고 하나는 반드시 틀려진다.
import { readFileSync, writeFileSync } from 'node:fs'
import { 줄, 재료줄, 재료수, 걸음수, 갈래, 상태, 앱에든것 } from './_갈래-요리와양념-0902.mjs'

const 백업경로 = process.argv[2]
if (!백업경로) { console.error('⛔ 백업 파일 경로를 준다'); process.exit(1) }
const 낼곳 = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : null
const 볼무리 = process.argv[4] || '🅱'

const d = JSON.parse(readFileSync(백업경로, 'utf8'))
const { allBasicRecipes } = await import('../src/data/basics.js')

const 나간것 = 앱에든것(new URL('../src/data/basics.js', import.meta.url).pathname)
const 내편 = d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))

// ── 🅱 이면서 아직 안 나간 «요리» ────────────────────────────────
const 대상 = 내편.filter(
  (r) => 갈래(r) === '요리' && 상태(r) === 볼무리 && !나간것.has((r.title || '').trim()),
)

// ── 세 무리로 가른다 ────────────────────────────────────────────
//    ㉠ 걸음은 있는데 재료가 0   → «재료»를 채운다 (제일 싸다 — 걸음이 이미 있다)
//    ㉡ 재료는 있는데 1~2걸음    → «걸음»을 채운다
//    ㉢ 1걸음 ＋ 재료 0          → 둘 다 없다 — 앱 대조부터
const 무리 = (r) => {
  const 재 = 재료수(r), 걸 = 걸음수(r)
  if (걸 === 0) return '㉣'          // 🅲 — 재료만 있고 걸음이 «아예» 0
  if (재 === 0 && 걸 >= 3) return '㉠'
  if (재 > 0) return '㉡'
  return '㉢'
}

// ── 채울 «재료»가 있나 ──────────────────────────────────────────
//    ⛔ 「있다/없다」로만 세지 않는다 — 글자 수가 곧 쓸 수 있는 양이다.
const 밑감 = (r) => {
  const m = String(r.memo || '').trim()
  const raw = String(r.rawText || '').trim()
  const desc = String(r.desc || '').trim()
  const note = String(r.note || '').trim()
  return { memo: m, raw, desc, note, 총: m.length + raw.length + desc.length + note.length }
}

// ── 앱에 비슷한 편이 있나 (제목 ＋ 재료를 «둘 다» 본다) ──────────
//    ⛔ 재료만으로 견주면 「달래장 ↔ 제육볶음」이 묶인다(_판-내레시피 사고).
const 제목뼈 = (t) =>
  String(t)
    .replace(/\([^)]*\)/g, '')
    .replace(/초간단|간단|초스피드|황금|만능|홈메이드|우리집|엄마|비법|레시피|만들기|\d+분|\d+인분/g, '')
    .replace(/[^가-힣a-zA-Z]/g, '')

const 글자겹침 = (a, b) => {
  const A = new Set(제목뼈(a)), B = new Set(제목뼈(b))
  if (!A.size || !B.size) return 0
  let n = 0
  for (const c of A) if (B.has(c)) n++
  return n / Math.min(A.size, B.size)
}

const 재료이름 = (s) =>
  String(s)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[0-9./~]+\s*(g|kg|ml|L|리터|큰술|작은술|컵|개|장|마리|봉|줌|스푼|T|t)?/gi, ' ')
    .replace(/[^가-힣a-zA-Z]/g, ' ')
    .trim()
    .split(/\s+/)[0] || ''

const 재료셋 = (r) => new Set(재료줄(r).map(재료이름).filter((x) => x.length >= 2))

//    ⛔ 재료가 2개 이하면 겹침이 100% 로 튄다(「바지락국(1재) ↔ 스키야키」) → 3개 미만은 0
const 셋겹침 = (A, B) => {
  if (A.size < 3 || B.size < 3) return 0
  let n = 0
  for (const c of A) if (B.has(c)) n++
  return n / Math.min(A.size, B.size)
}

// 앱 쪽 후보 = 창업자 편이면서 «걸음이 3개 이상»(＝쓸모 있는 판)
const 앱후보 = allBasicRecipes.filter((r) => r.origin === '창업자' && 걸음수(r) >= 3)

const 짝찾기 = (r) => {
  const A = 재료셋(r)
  const out = []
  for (const b of 앱후보) {
    const t = 글자겹침(r.title, b.title)
    const i = 셋겹침(A, 재료셋(b))
    if ((t >= 0.8 && i >= 0.3) || (t >= 0.6 && i >= 0.55) || t >= 0.95) {
      out.push({ 앱제목: b.title, t, i, 걸: 걸음수(b), 재: 재료수(b), from: b.from })
    }
  }
  return out.sort((x, y) => y.t + y.i - (x.t + x.i)).slice(0, 3)
}

// ── 훑는다 ──────────────────────────────────────────────────────
const 결과 = 대상.map((r) => ({
  제목: (r.title || '').trim(),
  무리: 무리(r),
  재: 재료수(r),
  걸: 걸음수(r),
  밑감: 밑감(r),
  짝: 짝찾기(r),
}))

const 셈 = { '㉠': 0, '㉡': 0, '㉢': 0, '㉣': 0 }
for (const x of 결과) 셈[x.무리]++

console.log(`📂 ${백업경로.split('/').pop()}`)
console.log(`${볼무리} 아직 안 나간 요리 — ${결과.length}편  (㉠ ${셈['㉠']} · ㉡ ${셈['㉡']} · ㉢ ${셈['㉢']} · ㉣ ${셈['㉣']})\n`)

const 이름 = {
  '㉠': '㉠ 걸음은 있는데 «재료»가 0 — 재료만 채우면 🅰',
  '㉡': '㉡ 재료는 있고 «걸음»이 1~2 — 걸음을 채운다',
  '㉢': '㉢ 둘 다 거의 없다 — ⚠️앱 대조부터',
  '㉣': '㉣ 재료만 있고 «걸음»이 0 — 만드는 법을 채운다',
}

for (const g of ['㉣', '㉠', '㉢', '㉡']) {
  const 목 = 결과.filter((x) => x.무리 === g)
  if (!목.length) continue
  console.log(`\n━━━ ${이름[g]} (${목.length}편) ━━━`)
  for (const x of 목.sort((a, b) => b.밑감.총 - a.밑감.총)) {
    const 짝 = x.짝.length
      ? `  🔗 앱: ${x.짝.map((p) => `${p.앱제목}(제목${(p.t * 100) | 0}%·재료${(p.i * 100) | 0}%·걸${p.걸})`).join(' / ')}`
      : ''
    const 감 = x.밑감.총
      ? `밑감 ${x.밑감.총}자(${[x.밑감.memo && `메모${x.밑감.memo.length}`, x.밑감.raw && `원문${x.밑감.raw.length}`, x.밑감.desc && `설명${x.밑감.desc.length}`, x.밑감.note && `한줄${x.밑감.note.length}`].filter(Boolean).join('·')})`
      : '⛔밑감 0 — 물어볼 것'
    console.log(`  ${String(x.재).padStart(2)}재 ${x.걸}걸음  ${x.제목.padEnd(22)} ${감}${짝}`)
  }
}

const 밑감없음 = 결과.filter((x) => x.밑감.총 === 0)
const 짝있음 = 결과.filter((x) => x.짝.length)
console.log(`\n━━━ 요약 ━━━`)
console.log(`  🔗 앱에 «비슷한 편»이 있어 먼저 대조할 것 — ${짝있음.length}편`)
console.log(`  ⛔ 밑감(메모·원문)이 0이라 «물어봐야» 하는 편 — ${밑감없음.length}편`)
console.log(`  ✍️ 밑감으로 초안을 쓸 수 있는 편 — ${결과.length - 밑감없음.length}편`)

// ── 내용 덤프는 scratchpad 로만 ────────────────────────────────
if (낼곳) {
  const 줄들 = [`# ${볼무리} 채우기 — 밑감 전문 (⛔저장소에 넣지 말 것)`, '']
  for (const g of ['㉣', '㉠', '㉢', '㉡']) {
    const 목 = 결과.filter((x) => x.무리 === g)
    if (!목.length) continue
    줄들.push(`## ${이름[g]} — ${목.length}편`, '')
    for (const x of 목) {
      const r = 대상.find((v) => (v.title || '').trim() === x.제목)
      줄들.push(`### ${x.제목}   (${x.재}재 ${x.걸}걸음)`)
      if (x.짝.length) 줄들.push(`🔗 앱 후보: ${x.짝.map((p) => `${p.앱제목}(제목${(p.t * 100) | 0}%·재료${(p.i * 100) | 0}%·걸${p.걸}·from ${p.from || '-'})`).join(' / ')}`)
      if (재료줄(r).length) 줄들.push('', '**재료**', ...재료줄(r).map((s) => `- ${s}`))
      if (줄(r.steps).length) 줄들.push('', '**걸음**', ...줄(r.steps).map((s, i) => `${i + 1}. ${s}`))
      for (const [k, v] of [['메모', x.밑감.memo], ['원문', x.밑감.raw], ['설명', x.밑감.desc], ['한줄', x.밑감.note]]) {
        if (v) 줄들.push('', `**${k}**`, '```', v, '```')
      }
      줄들.push('', '---', '')
    }
  }
  writeFileSync(낼곳, 줄들.join('\n'))
  console.log(`\n💾 밑감 전문 → ${낼곳}`)
}
