// 🍱 창업자가 준 컷 중 «앱에 안 든 것 129개»를 한 번에 넣는다 (2026-08-26 밤)
//
// 📮 창업자 = *"아 잠깐만 우리 반영안된게 너무 많은데(아이콘, 막국수랑, 치킨레터스랩 닭곰탕등등... 이거 중요해 우선)"*
//    · *"삼계탕 불고기 떡갈비등등 내 레시피에서는 다 예전걸로보여."* · *"양념들도 다.."*
//    · *"근데 아까 자른것도 많이 안들어간 것 같아."* · *"떡볶이나 덮밥들,스키야키 등등.."*
//
// 🔢 해시 전수 대조 실측 (2026-08-26)
//    | 8/26 새 컷      |   0 / 104 |  ⛔ 오늘 자른 게 하나도 안 들어갔다
//    | 8/24 유지70     |  61 /  70 |
//    | 8/24 다시뽑을것26 |   0 /  26 |  ⛔
//    | 8/25            |   4 /   6 |
//    → **안 든 것 129개**
//
// ⭐⭐ 넣는 법이 «둘»로 갈린다 — 아무거나 덮으면 «남의 요리»가 바뀐다 (v11.39 에서 검증된 방식)
//   ⒜ **전용 규칙이 있는 것** = `ICON_RULES` 에 그 이름이 «정확히» 적혀 있다
//      → **그 키 파일을 덮는다.** 이미 그 키로 저장된 레시피·냉장고·픽커가 저절로 새 그림이 된다(규칙 18 ⓙ).
//   ⒝ **전용 규칙이 없는 것** = 「덮밥」·「소스」·「탕」 같은 «넓은 규칙»에 걸려 남의 자리를 빌려 쓴다
//      → 덮으면 그 낱말을 쓰는 요리가 «전부» 이 그림이 된다 ⛔
//      → **새 키를 만들고 전용 규칙을 «맨 위»에 넣는다**(구체어 먼저 · v10.89).
//
// ⛔⛔ 창업자가 짚은 「삼계탕·불고기·닭곰탕이 옛것」의 뿌리 = **이름이 어긋나 있다.**
//    창업자 컷은 «구체적»인데(「맑은닭곰탕」·「누룽지삼계탕」) 앱 규칙은 «넓은 이름»(닭곰탕·삼계탕)을
//    옛 키에 묶어 뒀다. 📌 그래서 새 컷을 넣어도 넓은 이름으로는 여전히 옛 그림이 나온다.
//    ✅ 그 짝은 `docs/음식컷-전수검사-2026-08-26.md:29` 「비슷한 이름으로 이미 받은 것 22개」에 적혀 있다.
//       → 새 키를 만든 뒤 **넓은 이름도 그 키를 가리키게** 별칭을 같이 넣는다.
//
// 씀:  node scripts/_넣기-안든것129-0826.mjs [--진짜]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const APP = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 진짜 = process.argv.includes('--진짜')
const 낼곳 = `${APP}/src/assets/stickers/photo`
const FI = `${APP}/src/components/FoodIcon.jsx`
const ST = `${APP}/src/components/Stickers.jsx`

// ── 어디서 가져오나 (앞에 있는 폴더가 이긴다 = 새것 우선)
const 폴더들 = [
  `${APP}/docs/stickers/음식-창업자-2026-08-26/시트02-14`,
  `${APP}/docs/stickers/음식-창업자-2026-08-26/시트01-고기구이`,
  `${APP}/docs/stickers/음식-창업자-2026-08-26/시트15-17`,
  `${APP}/docs/stickers/창업자-2026-08-24/음식-유지70`,
  `${APP}/docs/stickers/창업자-2026-08-24/음식-다시뽑을것26`,
  `${APP}/docs/stickers/음식-창업자-2026-08-25/낱개`,
]

// ⛔ 창업자 컷 이름 ↔ 앱이 쓰는 «넓은 이름» — 없으면 새 컷을 넣어도 옛 그림이 계속 나온다
//    📄 근거 = docs/음식컷-전수검사-2026-08-26.md:29 「비슷한 이름으로 이미 받은 것 22개」
const 별칭 = {
  돼지고기수육: ['수육'], 매운순두부찌개: ['순두부'], 소고기미역국: ['미역국'],
  매운꽃게탕: ['꽃게탕'], 돼지고기김치찜: ['김치찜'], 맑은닭곰탕: ['닭곰탕'],
  해물누룽지탕: ['누룽지탕'], 들깨버섯전골: ['버섯전골'], 공심채볶음: ['공심채'],
  간장깻잎장아찌: ['깻잎장아찌'], 간장마늘쫑장아찌: ['마늘쫑장아찌'],
  고추장황태장아찌: ['황태장아찌'], 베이컨김치볶음밥: ['김치볶음밥'],
  연어포케볼: ['포케볼'], 소고기규동: ['규동'], 야키니쿠덮밥: ['야키니쿠'],
  모듬튀김: ['튀김'], 빨간떡볶이: ['떡볶이'], 아보카도바나나스무디: ['스무디'],
  항정살수육: ['항정수육'], 연근들깨샐러드: ['연근샐러드'],
  사과연근들깨샐러드: ['사과연근샐러드'], 누룽지삼계탕: ['삼계탕'],
}

// ── 지금 앱에 있는 파일 해시 (이미 든 것은 건너뛴다)
const 해시 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex')
const 앱해시 = new Set(fs.readdirSync(낼곳).filter((f) => f.endsWith('.png')).map((f) => 해시(`${낼곳}/${f}`)))

// ── 넣을 컷 모으기 (같은 이름이 여러 폴더에 있으면 «앞 폴더»가 이긴다)
const 버릴것 = /(-진한판|-빨간판|-실제크기|-크게|^_|-원본$|외\d+$)/
const 컷 = new Map()
for (const d of 폴더들) {
  if (!fs.existsSync(d)) continue
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.png'))) {
    const n = f.slice(0, -4)
    if (버릴것.test(n) || 컷.has(n)) continue
    const p = `${d}/${f}`
    if (앱해시.has(해시(p))) continue    // 이미 그대로 들어 있다
    컷.set(n, p)
  }
}

// ── ICON_RULES 를 «파일 순서대로» 읽는다 (앱이 첫 매칭을 쓴다)
const src0 = fs.readFileSync(FI, 'utf8')
const 규칙 = []
for (const m of src0.matchAll(/^\s*\[\[([^\]]*)\],\s*'([^']+)'\],/gm)) {
  규칙.push({
    말: m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean),
    키: m[2],
  })
}
const 납작 = (s) => s.replace(/\s/g, '')
const 전용규칙 = (이름) => 규칙.find((r) => r.말.some((w) => 납작(w) === 납작(이름)))

// ── 갈래 나누기
const 덮기 = []   // 전용 규칙이 있다 → 그 키 파일만 갈아끼운다
const 새키 = []   // 전용 규칙이 없다 → 새 키 ＋ 규칙을 맨 위에
let 다음번호 = Math.max(
  ...fs.readdirSync(낼곳).map((f) => Number((f.match(/^fe_(\d+)\.png$/) || [])[1] || 0)),
) + 1

// ⛔ 한 규칙에 «두 요리»가 묶여 있어 둘이 같은 키를 덮으려 하는 자리 — 뒤엣것에 새 키를 준다.
//    🔢 실측 = `gr_108` 규칙이 ['뼈없는양념돼지갈비구이','양념돼지갈비구이','뼈없는돼지갈비','돼지갈비구이']
//       인데 창업자가 시트①(돼지갈비구이)·시트②(뼈없는양념돼지갈비구이)로 **서로 다른 컷**을 줬다.
const 억지새키 = new Set(['돼지갈비구이'])

for (const [이름, 소스] of [...컷].sort()) {
  const r = 전용규칙(이름)
  if (r && !억지새키.has(이름)) 덮기.push({ 이름, 키: r.키, 소스 })
  else 새키.push({ 이름, 키: `fe_${다음번호++}`, 소스 })
}

// ⛔ 한 키를 둘이 덮으면 하나가 사라진다
const 셈 = {}
for (const d of 덮기) (셈[d.키] ||= []).push(d.이름)
const 충돌 = Object.entries(셈).filter(([, v]) => v.length > 1)

console.log(`🖼 넣을 것 ${컷.size}개 — 덮기 ${덮기.length} · 새 키 ${새키.length} (fe_${다음번호 - 새키.length} ~ fe_${다음번호 - 1})`)
if (충돌.length) {
  console.error(`\n⛔ 같은 키를 둘이 덮는다 — 먼저 갈라야 한다:`)
  for (const [k, v] of 충돌) console.error(`   ${k} = ${v.join(' + ')}`)
  process.exit(1)
}
console.log(`\n📌 덮어쓸 것(저장된 레시피가 «저절로» 새 그림이 된다):`)
console.log('   ' + 덮기.map((d) => `${d.이름}→${d.키}`).join(' · '))
console.log(`\n📌 새 키를 줄 것(전용 규칙이 없어 남의 자리를 빌려 쓰던 것):`)
console.log('   ' + 새키.map((d) => `${d.이름}→${d.키}`).join(' · '))

const 별칭넣기 = 새키.filter((n) => 별칭[n.이름])
if (별칭넣기.length) {
  console.log(`\n🔗 «넓은 이름»도 같이 가리키게 할 것 ${별칭넣기.length}개 — ⛔이게 없으면 옛 그림이 계속 나온다`)
  for (const n of 별칭넣기) console.log(`   ${n.이름} ← ${별칭[n.이름].join(' · ')}`)
}

if (!진짜) { console.log('\n(연습이다 — 실제로 넣으려면 --진짜)'); process.exit(0) }

// ── ① 파일 넣기
const 비율재기 = (p) => {
  const out = execFileSync('python3', ['-c',
    `from PIL import Image;im=Image.open(${JSON.stringify(p)});print(im.width,im.height)`],
    { encoding: 'utf8' })
  const [w, h] = out.trim().split(' ').map(Number)
  return Number((w / h).toFixed(4))
}
const 비율 = {}
for (const d of [...덮기, ...새키]) {
  fs.copyFileSync(d.소스, `${낼곳}/${d.키}.png`)
  비율[d.키] = 비율재기(d.소스)
}
console.log(`\n✅ 파일 ${덮기.length + 새키.length}개 넣었다`)

// ── ② PHOTO_RATIO — 있으면 값만 바꾸고, 없으면 새 줄 (검수 절대원칙 ④)
let s = fs.readFileSync(ST, 'utf8')
let 고침 = 0
const 새줄 = []
for (const [k, r] of Object.entries(비율)) {
  const re = new RegExp(`(\\b${k}\\s*:\\s*)[0-9.]+`)
  if (re.test(s)) { s = s.replace(re, `$1${r}`); 고침++ }
  else 새줄.push(`  ${k}: ${r},`)
}
if (새줄.length) {
  const m = s.match(/const PHOTO_RATIO = \{[\s\S]*?\n\}/)
  if (!m) { console.error('⛔ PHOTO_RATIO 를 못 찾았다'); process.exit(1) }
  s = s.replace(m[0], m[0].replace(/\n\}$/, `\n${새줄.join('\n')}\n}`))
}
fs.writeFileSync(ST, s)
console.log(`📐 비율 — 고친 것 ${고침}개 · 새로 넣은 것 ${새줄.length}개`)

// ── ③ ICON_RULES — 새 키의 전용 규칙을 «맨 위»에 (구체어 먼저 · v10.89)
let f = fs.readFileSync(FI, 'utf8')
const 표식 = 'const ICON_RULES = ['
if (!f.includes(표식)) { console.error('⛔ ICON_RULES 를 못 찾았다'); process.exit(1) }
const 새규칙 = 새키.map((n) => {
  const 말 = [n.이름, ...(별칭[n.이름] || [])].map((w) => `'${w}'`).join(', ')
  return `  [[${말}], '${n.키}'],`
}).join('\n')
f = f.replace(표식, `${표식}
  // 🍱🍱 2026-08-26 밤 — 창업자가 준 컷 중 «앱에 안 들어가 있던 것»을 한 번에 넣었다.
  //   📮 창업자 = *"삼계탕 불고기 떡갈비등등 내 레시피에서는 다 예전걸로보여."*
  //   ⛔ 여기가 «맨 위»여야 한다(구체어 먼저 · v10.89) — 아래 넓은 규칙이 먼저 잡으면 옛 그림이 나온다.
  //   ⭐ 낱말이 여럿인 줄은 «넓은 이름»(닭곰탕·삼계탕…)도 새 컷을 가리키게 한 것이다.
${새규칙}`)

// ── ④ 픽커(FOOD_ICON_GROUPS)에 새 키를 실는다 — 안 실으면 유저가 고를 수 없다
const 갈래 = (이름) => {
  if (/소스|양념장|드레싱|간장|종지/.test(이름)) return '볶음·조림'
  if (/국|탕|찌개|전골/.test(이름)) return '국·찌개'
  if (/면|국수|파스타|우동|소바|라면/.test(이름)) return '면'
  if (/밥|덮밥|솥밥|죽|비빔밥|김밥/.test(이름)) return '밥'
  if (/김치|장아찌|무침|나물|절임|피클|겉절이/.test(이름)) return '반찬'
  if (/구이|스테이크|전|튀김|가라아게|치킨/.test(이름)) return '구이·전'
  if (/쿠키|케이크|빙수|디저트|스무디|슬러시|티라미수|팬케이크|호떡|찰떡/.test(이름)) return '디저트'
  return '볶음·조림'
}
let 실음 = 0, 못실음 = []
for (const n of 새키) {
  const g = 갈래(n.이름)
  const re = new RegExp(`(\\{ label: '${g}', items: \\[)`)
  if (re.test(f)) { f = f.replace(re, `$1'${n.키}', `); 실음++ }
  else 못실음.push(`${n.이름}(${g})`)
}
fs.writeFileSync(FI, f)
console.log(`🏷 ICON_RULES 전용 규칙 ${새키.length}개 · 픽커에 ${실음}개 실었다`)
if (못실음.length) console.error(`   ⚠️ 못 실은 것 ${못실음.length}: ${못실음.join(' · ')}`)

fs.writeFileSync('/tmp/넣은키-129.json', JSON.stringify({ 덮기, 새키 }, null, 1))
console.log('\n📌 다음 = node scripts/check-foodtab.mjs · npm run build · npm run smoke')
