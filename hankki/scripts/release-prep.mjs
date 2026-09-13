// 📅🛒 「그날 열리는 레시피에 «내가 올려야 할 것»」을 한 판에 — 검수 · 재료 링크 · 음식 아이콘
//
// 📮 창업자 2026-09-13 = *"**레시피 날짜에 맞게 내가 올려야한 것 그에따른 쿠팡링크나
//    음식아이콘있는지도 한번에 네가 안내해줘야해**"*
//
// ⛔⛔ **왜 만들었나** — 그 전엔 셋이 «따로» 떨어져 있었다:
//    ① `release-calendar.mjs --pending` = 검수 안 받은 편
//    ② `_판-재료링크목록.mjs` = 링크 없는 재료 (⛔날짜를 모른다 — 전체 레시피를 뭉쳐서 센다)
//    ③ 음식 아이콘 = 아무 도구도 안 봤다
//    → 창업자가 «세 번» 물어야 했고, ②는 급한 날짜와 안 급한 날짜를 못 갈랐다.
//
// ⭐ 이 도구는 **날짜를 축으로** 셋을 한 줄에 놓는다. 창업자는 «가까운 날부터» 채우면 된다.
//
// ⛔ 재료 링크 판정은 **앱과 같은 함수**(`ingLink`·`담을만한가`)로만 한다 —
//    글자로 다시 파싱하면 앱보다 덜 보게 된다(2026-09-12 사고: 「버터 15g」).
//
// 쓰기:
//   node hankki/scripts/release-prep.mjs            ← 앞으로 열릴 것 전부
//   node hankki/scripts/release-prep.mjs --일 90     ← 90일 안에 열리는 것만
//   node hankki/scripts/release-prep.mjs --on 2026-11-02
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { todayKST } from '../src/today.js'
import { allBasicRecipes } from '../src/data/basics.js'
import { execFileSync, } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const { ingredientName } = await import(join(뿌리, 'src/utils.js'))
const 안만드는것 = new Set(JSON.parse(readFileSync(join(뿌리, 'scripts/안만드는재료.json'), 'utf8')).안만드는것)

// 🍱 음식 아이콘 판정은 «앱 소스 그대로» 쓴다 (규칙 30) — 노드가 .jsx 를 못 읽으니 esbuild 로 옮겨 담는다.
//    ⛔ 규칙 표를 글자로 베껴 파싱하지 말 것 — 앱이 바뀌면 그 순간 갈린다.
//    ⭐ 재료 링크 판정(`ingLink`·`담을만한가`)도 같은 이유로 여기서 같이 담는다 —
//       `ingLinks.js` 가 `curation` 을 확장자 없이 부르는데 그것도 Vite 문법이다.
const 담을곳 = join(뿌리, 'node_modules/.cache')
mkdirSync(담을곳, { recursive: true })
const 들머리 = join(담을곳, '앱값.entry.jsx')
writeFileSync(들머리, "export { guessFoodIconStrict } from '" + join(뿌리, 'src/components/FoodIcon.jsx') + "'\n"
  + "export { ingLink, 담을만한가, 안파는것 } from '" + join(뿌리, 'src/data/ingLinks.js') + "'\n")
const 담은곳 = join(담을곳, '앱값.mjs')
execFileSync('npx', ['esbuild', 들머리, '--bundle', '--format=esm',
  '--platform=node', '--loader:.png=empty', '--loader:.svg=empty', '--loader:.jpg=empty',
  '--loader:.webp=empty', '--loader:.gif=empty',
  // Vite 전용 `import.meta.glob` 과 React 는 아이콘 «판정»에 안 쓰인다 — 빈 껍데기로 채운다
  '--banner:js=import.meta.glob = () => ({}); var React = { createElement: () => null, Fragment: null };',
  '--outfile=' + 담은곳], { cwd: 뿌리, stdio: 'pipe' })
const { guessFoodIconStrict, ingLink, 담을만한가, 안파는것 } = await import(담은곳)

const 오늘 = todayKST()
const 인자 = process.argv.slice(2)
const 값 = (키) => { const i = 인자.indexOf(키); return i >= 0 ? 인자[i + 1] : null }
const 하루 = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000)

const 날 = 값('--on')
const 일수 = Number(값('--일') || 0)

// 📦 앞으로 열릴 편만 — 이미 열린 건 「올려야 할 것」이 아니다
let 것 = allBasicRecipes.filter((r) => r.from && r.from > 오늘)
if (날) 것 = 것.filter((r) => r.from === 날)
else if (일수) 것 = 것.filter((r) => 하루(오늘, r.from) <= 일수)

const 날짜별 = new Map()
for (const r of 것) {
  if (!날짜별.has(r.from)) 날짜별.set(r.from, [])
  날짜별.get(r.from).push(r)
}

// 🚱 링크가 «필요한» 재료만 골라낸다 — 앱과 같은 잣대로
const 필요한재료 = (r) => {
  const 낼것 = []
  for (const 줄 of r.ingredients || []) {
    if (/^[-—=]|^\[|:$/.test(String(줄).trim())) continue     // 묶음 머리·소제목은 재료가 아니다
    const n = ingredientName(줄)
    if (!n) continue
    if (!담을만한가(n)) continue                               // 🚱 물·밥 같은 물류
    if (ingLink(n)) continue                                   // ✅ 이미 붙는다 (앱과 같은 함수)
    const 짧게 = n.replace(/\s+[0-9]+([./][0-9]+)?\s*[a-zA-Z가-힣]*$/, '').trim()
    if (안만드는것.has(n) || 안만드는것.has(짧게)) continue      // 🚫 창업자가 못 만든다고 한 것
    // 🚱 「물 종이컵」처럼 안 사는 것이 «낱말»로 든 것 — 앱 ingLinks 의 낱말 경계와 같은 글자
    if (짧게.split(/[\s,()·/+—-]/).filter(Boolean).some((t) => 안파는것.has(t))) continue
    // 🚫 무엇을 살지 «못 고르는» 말 — 창업자가 링크를 만들 수 없다 (창업자 = *"그런거 다 추려서 줘야지.."*)
    if (/(좋아하는|남은|취향껏|여러 종류|가득|듬뿍|모듬|또는|이나 )/.test(n)) continue
    낼것.push(짧게 || n)
  }
  return [...new Set(낼것)]
}

let 총검수 = 0, 총링크 = new Set(), 총아이콘 = 0
const 줄들 = []
for (const [날, 편들] of [...날짜별].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
  const D = 하루(오늘, 날)
  줄들.push(`\n📅 ${날} (D-${D}) — ${편들.length}편`)
  for (const r of 편들) {
    const 검수 = r.review ? '✅검수' : '⛔검수필요'
    if (!r.review) 총검수++
    // 🍱 음식 아이콘 — ①직접 박아둔 것이 있나 ②없으면 제목으로 자동으로 붙나
    // ⛔⛔ [2026-09-13 · 규칙 12 검증이 잡았다] 이 함수는 못 찾으면 «'default'» 를 돌려준다 —
    //    truthy 라서 처음엔 「자동으로 붙었다」로 셌다. 그러면 아이콘 없는 편을 «영영» 못 잡는다.
    const 딴것 = guessFoodIconStrict(r.title)
    const 자동 = 딴것 && 딴것 !== 'default' ? 딴것 : ''
    const 아이콘 = r.icon ? `✅${r.icon}` : (자동 ? `🔸자동 ${자동}` : '⛔아이콘없음')
    if (!r.icon && !자동) 총아이콘++
    const 재료 = 필요한재료(r)
    재료.forEach((x) => 총링크.add(x))
    줄들.push(`   ${검수.padEnd(10)} ${아이콘.padEnd(16)} ${r.title}`)
    if (재료.length) 줄들.push(`      🛒 링크 없는 재료 ${재료.length}개 — ${재료.join(' · ')}`)
  }
}

console.log(`📅🛒 앞으로 열릴 레시피에 «올려야 할 것» — 오늘(KST) ${오늘} 기준`)
console.log(줄들.join('\n') || '\n   ✅ 앞으로 열릴 편이 없다')
console.log(`\n━━ 한 줄 요약 ━━`)
console.log(`   ⛔ 창업자 검수가 필요한 편 = ${총검수}편`)
console.log(`   🛒 링크를 만들어야 할 재료 = ${총링크.size}개 ${총링크.size ? `— ${[...총링크].join(' · ')}` : ''}`)
console.log(`   🍱 음식 아이콘이 없는 편 = ${총아이콘}편`)
console.log(`\n   ⛔ 「링크 없는 재료」는 «앱과 같은 함수»로 판정했다 — 글자로 다시 세지 말 것.`)
