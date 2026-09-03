// 🥄🔧 **이미 담긴 레시피의 단위를 「큰술·작은술」 한 말로** (2026-09-03)
//
// 📮 창업자 확정 = *"**큰술로 통일하자. 스푼 다 빼고**"*
//
// ⭐⭐ **앱과 «같은 함수»를 부른다** — `src/parseRecipe.js` 의 `단위통일()`(절대원칙 30).
//    흉내 내서 다시 짜면 **앞으로 담기는 것과 이미 담긴 것이 달라진다.**
//
// ⛓ 이건 «데이터 쪽»이다. 뿌리는 따로 고쳤다 —
//    ① `parseRecipe.js` = 붙여넣기로 들어오는 글을 담을 때 고른다
//    ② `tidy.js`        = AI 가 낸 결과도 고른다(여태 «한 번도» 안 거쳤다)
//    ③ `EditorScreen`   = 고르는 칸에서 「T」·「t」를 뺐다(같은 뜻인데 답이 둘이던 자리)
//    📌 ①②③ 없이 데이터만 바꾸면 **내일 담는 레시피에서 또 갈린다**(절대원칙 34).
//
// 쓰기:  node scripts/_고침-단위통일-0903.mjs <넣을백업.json> <낼백업.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { 단위통일 } from '../src/parseRecipe.js'

function 굴리기 (넣을것, 낼것) {
  const d = JSON.parse(readFileSync(넣을것, 'utf8'))
  const 편수전 = d.recipes.length
  const 손댈칸 = new Set(['ingredients', 'steps'])
  const 도장 = (r) => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !손댈칸.has(k))))
  const 전도장 = new Map(d.recipes.map((r) => [r.id, 도장(r)]))

  let 줄 = 0
  const 편 = new Set()
  for (const r of d.recipes) {
    for (const 칸 of 손댈칸) {
      if (!Array.isArray(r[칸])) continue
      r[칸] = r[칸].map((x) => {
        const 새 = 단위통일(x)
        if (새 !== String(x)) { 줄++; 편.add(r.title) }
        return 새
      })
    }
  }

  // ── 안전 검사 ──────────────────────────────────────────
  const 탈 = []
  if (d.recipes.length !== 편수전) 탈.push(`편 수가 ${편수전} → ${d.recipes.length}`)
  let 그밖 = 0
  for (const r of d.recipes) if (전도장.get(r.id) !== 도장(r)) 그밖++
  if (그밖) 탈.push(`재료·걸음 칸 «밖»이 ${그밖}곳 바뀌었다`)

  // 🚨 남은 것은 «도구 이름»뿐이라야 한다
  const 남 = []
  for (const r of d.recipes) {
    for (const x of [...(r.ingredients || []), ...(r.steps || [])]) {
      const s = String(x)
      if (/스푼|\d\s*[Tt]\b/.test(s) && !/(계량|계랑)\s?스푼/.test(s)) 남.push(`${r.title} — ${s.trim().slice(0, 110)}`)
    }
  }
  if (남.length) { 탈.push(`「스푼·T·t」가 ${남.length}줄 남았다 — 도구 이름이 아니다`); 남.forEach((x) => 탈.push('     · ' + x)) }
  // ⛔ 「티큰술」은 티스푼을 잘못 바꾼 자국이다 — 하나라도 나오면 죽는다
  for (const r of d.recipes) {
    for (const x of [...(r.ingredients || []), ...(r.steps || [])]) {
      if (/티큰술|계량큰술|계랑큰술/.test(String(x))) 탈.push(`${r.title} — 잘못 바뀌었다: ${String(x).slice(0, 80)}`)
    }
  }

  console.log(`🥄 ${줄}줄 · ${편.size}편 · 편 수 ${편수전} → ${d.recipes.length} · 손댈 칸 밖 변경 ${그밖}곳`)
  console.log('   고친 편 = ' + [...편].join(' · '))

  if (탈.length) {
    console.error('\n⛔ 안전 검사 실패 — 저장하지 않는다')
    for (const t of 탈) console.error('   · ' + t)
    process.exit(1)
  }
  writeFileSync(낼것, JSON.stringify(d))
  console.log(`\n💾 ${낼것}`)
}

const 내가시작 = import.meta.url === pathToFileURL(process.argv[1] || '/dev/null').href
if (내가시작) {
  const [, , 넣을것, 낼것] = process.argv
  if (!넣을것 || !낼것) { console.error('⛔ 쓰기: node scripts/_고침-단위통일-0903.mjs <넣을백업.json> <낼백업.json>'); process.exit(1) }
  굴리기(넣을것, 낼것)
}
