// 🥄🧪 **`단위통일()` 을 «진짜 줄 전부»에 돌려서 눈으로 본다** (2026-09-03 · smoke)
//
// 📮 창업자 확정 = *"큰술로 통일하자. 스푼 다 빼고"*
//
// ⭐⭐ **잣대의 심장 = 「바꾸면 «안» 되는 것을 안 바꿨나」**다.
//    「다 바꿨나」만 재면 **「계량스푼」이 「계량큰술」이 되어도 초록불**이 된다(규칙 18 ⓘ).
//
// 쓰기:  node scripts/_repro-단위통일-0903.mjs [우리집레시피백업.json]
//        (백업을 안 주면 «박아둔 칸»만 돌린다 — smoke 는 이 꼴로 돈다)
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { 단위통일 } from '../src/parseRecipe.js'

// ── 박아둔 칸 — 전부 «실제 데이터에서 뽑은» 줄이다 ──────────
const 칸 = [
  // ✅ 바뀌어야 하는 것
  ['다진마늘 1T, 액젓 1T', '다진마늘 1큰술, 액젓 1큰술'],
  ['고춧가루 1T~1.5T', '고춧가루 1큰술~1.5큰술'],
  ['다진마늘 1.5-2T', '다진마늘 1.5-2큰술'],
  ['식초 0.3T', '식초 0.3큰술'],
  ['백간장 1t', '백간장 1작은술'],
  ['생강가루 0.5t', '생강가루 0.5작은술'],
  ['다진마늘 1스푼', '다진마늘 1큰술'],
  ['설탕 2/3스푼', '설탕 2/3큰술'],
  ['스리라차 반스푼', '스리라차 1/2큰술'],
  ['설탕 두스푼을 먼저 넣어 5분 끓여줘요.', '설탕 2큰술을 먼저 넣어 5분 끓여줘요.'],
  ['전자레인지 용기에 물 한 스푼 정도 넣고', '전자레인지 용기에 물 1큰술 정도 넣고'],
  ['고춧가루 한스푼 추가해서', '고춧가루 1큰술 추가해서'],
  // ⚠️ 말 끝 고르기 — 「스푼」(ㄴ받침) → 「큰술」(ㄹ받침)
  ['다시다 반 스푼으로 대체할 수 있어요.', '다시다 1/2큰술로 대체할 수 있어요.'],
  ['전분가루 2t를 넣고 버무려', '전분가루 2작은술을 넣고 버무려'],
  // 🚨 바뀌면 «안» 되는 것 — 여기가 이 판의 심장이다
  ['계량스푼기준 1큰술 15ml 1작은술 5ml', '계량스푼기준 1큰술 15ml 1작은술 5ml'],
  ['계랑스푼 기준(1T:15ml, 1t:5ml)', '계량스푼 기준(1큰술:15ml, 1작은술:5ml)'],
  ['티스푼 1개', '작은술 1개'],
  ['1티스푼', '1작은술'],
  ['스푼으로 떠서 올려요', '스푼으로 떠서 올려요'],
  ['소금 2t, 양파1개', '소금 2작은술, 양파1개'],
  // ⛔ 낱말 속 t·T 를 건드리면 안 된다
  ['toast 2개', 'toast 2개'],
  ['버터 100g', '버터 100g'],
  ['물 1.5L', '물 1.5L'],
  ['이미 큰술·작은술이면 그대로', '이미 큰술·작은술이면 그대로'],
]

let 죽음 = 0
console.log('━━━━━━━━ 박아둔 칸 ' + 칸.length + ' ━━━━━━━━')
for (const [넣을것, 바랄것] of 칸) {
  const 난것 = 단위통일(넣을것)
  const 됨 = 난것 === 바랄것
  if (!됨) 죽음++
  console.log(`  ${됨 ? '✅' : '⛔'} ${넣을것}`)
  if (!됨) console.log(`      바람 「${바랄것}」\n      난것 「${난것}」`)
}

// ── 진짜 데이터 전수 ─────────────────────────────────────
const 백업 = process.argv[2]
if (백업 && existsSync(백업)) {
  const d = JSON.parse(readFileSync(백업, 'utf8'))
  const 바뀐것 = []
  for (const r of d.recipes) {
    for (const [칸이름, 목록] of [['재료', r.ingredients || []], ['걸음', r.steps || []]]) {
      for (const x of 목록) {
        const 새 = 단위통일(x)
        if (새 !== String(x)) 바뀐것.push([r.title, 칸이름, String(x), 새])
      }
    }
  }
  console.log(`\n━━━━━━━━ 진짜 데이터에서 바뀌는 줄 ${바뀐것.length} ━━━━━━━━`)
  for (const [편, 칸이름, 옛, 새] of 바뀐것) {
    console.log(`  [${편}·${칸이름}]`)
    console.log(`     − ${옛.slice(0, 150)}`)
    console.log(`     + ${새.slice(0, 150)}`)
  }
  // 🚨 바꾼 «뒤»에 스푼·T·t 가 남아 있으면 — 왜 남았는지 봐야 한다
  const 남은것 = []
  for (const r of d.recipes) {
    for (const x of [...(r.ingredients || []), ...(r.steps || [])]) {
      const 새 = 단위통일(x)
      if (/스푼|\d\s*[Tt]\b/.test(새)) 남은것.push(`${r.title} — ${새.trim().slice(0, 110)}`)
    }
  }
  console.log(`\n🔎 바꾼 뒤에도 「스푼·T·t」가 남은 줄 ${남은것.length} (계량스푼·도구 자리면 정상)`)
  for (const s of 남은것) console.log('   · ' + s)
}

// ── 앱 파서·정리기가 이 함수를 «부르나» ────────────────────
const 여기 = dirname(fileURLToPath(import.meta.url))
const pr = readFileSync(join(여기, '..', 'src', 'parseRecipe.js'), 'utf8')
const td = readFileSync(join(여기, '..', 'src', 'tidy.js'), 'utf8')
const ed = readFileSync(join(여기, '..', 'src', 'screens', 'EditorScreen.jsx'), 'utf8')
const UNITS = (ed.match(/const UNITS\s*=\s*\[([^\]]*)\]/) || [, ''])[1]
  .split(',').map((x) => x.replace(/['"\s]/g, '')).filter(Boolean)
const 부름 = [
  ['parseRecipe.js 가 재료에', /ingredients:[^\n]*단위통일|단위통일[^\n]*ingredients/.test(pr) || /map\(단위통일\)/.test(pr)],
  ['parseRecipe.js 가 걸음에', (pr.match(/단위통일/g) || []).length >= 3],
  ['tidy.js 가 부른다', /단위통일/.test(td)],
  // 🚨 뿌리 — 고르는 칸에 「T」·「t」가 «다시 생기면» 창업자가 말한 그 헷갈림이 그대로 돌아온다
  ['고르는 칸에 T·t 가 없다', !UNITS.includes('T') && !UNITS.includes('t')],
  ['고르는 칸에 큰술·작은술은 있다', UNITS.includes('큰술') && UNITS.includes('작은술')],
  // ⛔ 파서가 「스푼·티스푼·T·t」를 여전히 «읽는가» — 빼면 붙여넣기 재료가 통째로 사라진다
  ['파서가 스푼·티스푼을 아직 읽는다', /티스푼/.test(pr) && (pr.match(/스푼/g) || []).length >= 6],
]
console.log('\n━━━━━━━━ 붙어 있나 ━━━━━━━━')
for (const [이름, 됨] of 부름) { console.log(`  ${됨 ? '✅' : '⛔'} ${이름}`); if (!됨) 죽음++ }

console.log(`\n${죽음 ? `⛔ ${죽음}칸 죽었다` : '✅ 전부 통과'}`)
process.exit(죽음 ? 1 : 0)
