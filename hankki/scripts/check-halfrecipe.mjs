// 🕳🕳 **「반쪽 레시피」를 잡는다** — 만드는 법이 비었거나, 재료 칸에 «메모»가 섞였거나, 시간·인분이 0인 편
//
// 📮 계기 = 창업자 2026-08-19 *"계란장은 뭐야??"*
//    「마늘간장 계란장」을 열어보니 **만드는 법이 0걸음**이고 재료 칸에 이런 게 들어 있었다:
//      「계란 반죽에 간장 크게 1」 · 「팬 돌려가며 바삭하게」 · 「밥 위에 (버터)」
//    → 창업자가 앱에 «급히 적어둔 메모»가 그대로 굳은 것이다. `time = 0` · `servings = 0` 이었다.
//    ⭐ 창업자의 물음 한 마디가 이걸 드러냈다 → *"그래 전수로 한번 훑어보고"*
//
// ⭐⭐ **이 검사가 보는 것 = 「내용이 이상한가」가 아니라 «칸이 비었나»** 다.
//    ⛔ 맛·양이 맞는지는 «사람»만 안다(그건 창업자 검수판이 한다).
//    ✅ 기계가 확실히 잡을 수 있는 것만 본다 — 그래야 시끄럽지 않다(시끄러운 게이트는 죽은 게이트).
//
// ⛔⛔ **이건 배포 게이트가 «아니다»** — `npm run smoke` 에 안 넣었다.
//    이유 = 잡히는 건 대부분 **아직 앱에 안 들어간 백업(내 레시피)**이라, 배포를 막을 일이 아니다.
//    👉 검수판을 뽑기 «전»에 손으로 돌린다:  node scripts/check-halfrecipe.mjs
//       `--backup` 를 붙이면 백업 JSON(내 레시피)까지 본다.
//
// 쓰기:
//   node scripts/check-halfrecipe.mjs            # 앱 레시피(basics.js)만
//   node scripts/check-halfrecipe.mjs --backup   # ＋ docs/_내레시피-백업/*.json
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const APP = existsSync('hankki/src') ? 'hankki' : '.'
const 백업까지 = process.argv.includes('--backup')

// 📌 재료 줄인데 «동작»을 적은 것 — 메모가 재료 칸으로 새어 들어온 신호.
//    ⚠️ 느슨하게 잡으면 시끄럽다. 「~하게」·「~기」로 «끝나는» 줄만 본다.
//    ⛔ 「곱게 갈아서」처럼 괄호 «안»의 설명은 안 본다 — 그건 재료에 붙는 정상 설명이다.
const 동작줄 = [
  /(볶|끓이|부치|굽|썰|섞|담그|졸이|무치|데치|튀기|찌|삶)[가-힣]*(게|기|다|요|세요)\s*$/,
  /(위에|넣고|빼고|올려|돌려가며|뿌려)\s*[(（]?[^)）]*[)）]?\s*$/,
]
// ⛔ 예외 — 절 머리(대괄호)와 「~는 것」류 정상 재료 설명
const 절머리 = /^\s*[\[［]/

function 재료가메모인가(줄) {
  if (절머리.test(줄)) return false
  const s = String(줄).trim()
  if (!s) return false
  return 동작줄.some((re) => re.test(s))
}

const 잡힌것 = []

function 편검사(편, 어디) {
  const 제목 = 편.title || 편.name || '(제목 없음)'
  const 재료 = 편.ingredients || []
  const 순서 = 편.steps || []
  const 탈 = []

  if (순서.length === 0) 탈.push('만드는 법이 «0걸음»')
  if (편.time === 0 || 편.time == null) 탈.push(`시간이 ${편.time === 0 ? '0' : '없음'}`)
  if (편.servings === 0 || 편.servings == null) 탈.push(`인분이 ${편.servings === 0 ? '0' : '없음'}`)

  const 샌줄 = 재료.filter(재료가메모인가)
  if (샌줄.length) 탈.push(`재료 칸에 «동작» ${샌줄.length}줄 — ${샌줄.slice(0, 3).map((s) => `「${String(s).trim()}」`).join(' · ')}`)

  if (재료.length === 0) 탈.push('재료가 «0줄»')

  if (탈.length) 잡힌것.push({ 제목, 어디, 탈 })
}

// ── ① 앱 레시피 (basics.js) — 앱과 «같은 모듈»로 읽는다(절대원칙 30)
const { allBasicRecipes } = await import(`../${APP === '.' ? '' : APP + '/'}src/data/basics.js`)
  .catch(async () => await import(new URL('../src/data/basics.js', import.meta.url)))
const 앱편들 = typeof allBasicRecipes === 'function' ? allBasicRecipes() : allBasicRecipes
for (const 편 of 앱편들) 편검사(편, '앱')

// ── ② 백업 JSON (내 레시피) — 옵션
let 백업수 = 0
if (백업까지) {
  const dir = join(APP, 'docs', '_내레시피-백업')
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort().slice(-1)) {
      const d = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      const 훑기 = (o) => {
        if (Array.isArray(o)) return o.forEach(훑기)
        if (o && typeof o === 'object') {
          if (o.title && (o.ingredients || o.steps)) { 백업수++; 편검사(o, `백업 ${f}`) }
          Object.values(o).forEach(훑기)
        }
      }
      훑기(d)
    }
  }
}

console.log(`\n🕳 반쪽 레시피 검사 — 앱 ${앱편들.length}편${백업까지 ? ` ＋ 백업 ${백업수}편` : ''}`)
if (!잡힌것.length) {
  console.log('   ✅ 반쪽인 편 0개')
  process.exit(0)
}

const 앱것 = 잡힌것.filter((x) => x.어디 === '앱')
const 백업것 = 잡힌것.filter((x) => x.어디 !== '앱')
for (const [이름, 목록] of [['📱 앱에 들어가 있는 것', 앱것], ['📦 백업(내 레시피)', 백업것]]) {
  if (!목록.length) continue
  console.log(`\n${이름} — ${목록.length}편`)
  for (const x of 목록) {
    console.log(`   ⛔ ${x.제목}`)
    for (const t of x.탈) console.log(`      · ${t}`)
  }
}
console.log(`\n📌 ${앱것.length ? '앱에 들어간 것부터 고친다 — 유저가 지금 보고 있다.' : '앱은 깨끗하다.'}`)
console.log('   ⛔ 「맛·양이 맞나」는 이 검사가 «안 본다» — 그건 창업자 검수판이 한다.')
process.exit(앱것.length ? 1 : 0)
