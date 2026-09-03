// 🥄🔎 **「스푼」·「T」·「t」가 «실제로» 어떻게 쓰였나 — 바꾸기 «전»에 열어서 본다** (2026-09-03)
//
// 📮 창업자 확정 = *"**큰술로 통일하자. 스푼 다 빼고**"*
//
// ⛔⛔ **기계로 「스푼 → 큰술」을 밀면 «안 되는» 자리가 있다** — 먼저 눈으로 본다(절대원칙 21).
//    · 「**티**스푼」 = 작은술이다. 큰술로 바꾸면 **3배 틀린다.**
//    · 「스푼으로 떠서」처럼 **단위가 아니라 «도구»**인 자리.
//    · 「밥스푼」·「큰스푼」·「작은스푼」 같은 겹말.
//    ⭐ T·t 도 같다 — 「1T」는 단위지만 「T자」·영어 낱말 속 t 는 아니다.
//
// 쓰기:  node scripts/_probe-스푼실물-0903.mjs [우리집레시피백업.json]
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 앱 = join(여기, '..', 'src')

// ⚠️ 「스푼」 앞에 무엇이 붙어 있나 — 이게 판정을 가른다
const 앞말 = (줄) => {
  const 것 = []
  const re = /(.{0,4})스푼/g
  let m
  while ((m = re.exec(줄))) 것.push(m[1])
  return 것
}

function 모으기 (줄들, 어디) {
  const 스푼줄 = [], T줄 = [], t줄 = []
  for (const s of 줄들) {
    const x = String(s)
    if (/스푼/.test(x)) 스푼줄.push([어디, x])
    if (/\d\s*T\b/.test(x)) T줄.push([어디, x])
    if (/\d\s*t\b/.test(x)) t줄.push([어디, x])
  }
  return { 스푼줄, T줄, t줄 }
}

const 모두 = { 스푼줄: [], T줄: [], t줄: [] }
const 담기 = (r) => { for (const k of Object.keys(모두)) 모두[k].push(...r[k]) }

// ── 우리집레시피 ─────────────────────────────────────────
const 백업 = process.argv[2]
if (백업 && existsSync(백업)) {
  const d = JSON.parse(readFileSync(백업, 'utf8'))
  for (const r of d.recipes) {
    담기(모으기(r.ingredients || [], `우리집·재료·${r.title}`))
    담기(모으기(r.steps || [], `우리집·걸음·${r.title}`))
  }
}
// ── 앱 레시피 ────────────────────────────────────────────
담기(모으기(readFileSync(join(앱, 'data', 'basics.js'), 'utf8').split('\n'), '앱·basics.js'))
// ── 파서 ─────────────────────────────────────────────────
담기(모으기(readFileSync(join(앱, 'parseRecipe.js'), 'utf8').split('\n'), '코드·parseRecipe.js'))

// ── 🥄 스푼 — 앞말로 갈라서 본다 ──────────────────────────
console.log('━━━━━━━━ 🥄 「스푼」 ' + 모두.스푼줄.length + '줄 ━━━━━━━━')
const 위험 = /티스푼|큰스푼|작은스푼|밥스푼|숟가락/
const 안전 = [], 살펴볼것 = []
for (const [어디, 줄] of 모두.스푼줄) {
  const 숫자붙음 = /[\d½¼¾/.]\s*스푼/.test(줄)
  if (위험.test(줄) || !숫자붙음) 살펴볼것.push([어디, 줄])
  else 안전.push([어디, 줄])
}
console.log(`\n🚨 **손으로 봐야 하는 것 ${살펴볼것.length}줄** (앞에 「티/큰/작은/밥」이 붙었거나 숫자가 «안» 붙은 것)`)
for (const [어디, 줄] of 살펴볼것) console.log(`   · [${어디}]\n     ${줄.trim().slice(0, 160)}`)
console.log(`\n✅ 「숫자＋스푼」이라 그냥 큰술로 바꿔도 되는 것 = ${안전.length}줄`)
const 앞말셈 = {}
for (const [, 줄] of 안전) for (const a of 앞말(줄)) { const k = (a.match(/[\d½¼¾/.]+\s*$/) || ['(숫자)'])[0].trim(); 앞말셈[k] = (앞말셈[k] || 0) + 1 }
console.log('   붙은 숫자 = ' + Object.entries(앞말셈).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k}×${v}`).join(' · '))

// ── T · t ────────────────────────────────────────────────
for (const [이름, 목록, 뜻] of [['T', 모두.T줄, '큰술'], ['t', 모두.t줄, '작은술']]) {
  console.log(`\n━━━━━━━━ 「${이름}」 ${목록.length}줄  → ${뜻} ━━━━━━━━`)
  for (const [어디, 줄] of 목록) console.log(`   · [${어디}]  ${줄.trim().slice(0, 140)}`)
}
