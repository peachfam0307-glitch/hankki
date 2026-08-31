// 🍱 창업자 판정 「갈아끼자」 64컷을 앱에 넣는다 (2026-08-26)
//
// 📮 창업자 = *"갈아끼우자 앱에 넣고 배포하고, 모르겠다는 그냥 둔다야."*
//    (88칸 전수 판정 = 갈아끼자 64 · 다시뽑자 20 · 모르겠다 4)
//
// ⭐⭐ 넣는 법이 «둘»로 갈린다 — 아무거나 덮으면 «남의 요리»가 바뀐다.
//   ⒜ **전용 규칙이 있는 것** = `ICON_RULES` 에 그 이름이 «정확히» 적혀 있다
//      → **그 키 파일을 덮는다.** 이미 그 키로 저장된 레시피·냉장고·픽커가 저절로 새 그림이 된다(규칙 18 ⓙ).
//   ⒝ **넓은 규칙에 걸린 것** = 「소스」·「덮밥」·「샐러드」처럼 «남의 자리»를 빌려 쓰고 있었다
//      → 덮으면 그 낱말을 쓰는 요리가 «전부» 이 그림이 된다 ⛔
//      → **새 키를 만들고 전용 규칙을 «위»에 넣는다**(구체어 먼저 · v10.89).
//
// ⛔ 「뼈없는순살갈비조림」은 **이미 전용 키 `fe_319` 가 있는데** 규칙 순서 때문에
//    「갈비조림」(fe_328)에 먼저 걸리고 있었다 — **앱에 원래 있던 버그다.** 순서를 고쳐서 푼다.
// ⛔ 「순살찜닭」과 「찜닭」은 한 규칙에 묶여 `fe_283` 을 같이 쓴다 → 「순살찜닭」에 새 키를 준다.
//
// 씀:  node scripts/_넣기-갈아끼자64-0826.mjs [--진짜]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 진짜 = process.argv.includes('--진짜')
const 판정 = JSON.parse(fs.readFileSync('/tmp/판정/0826.json', 'utf8'))
const 앱키 = JSON.parse(fs.readFileSync('/tmp/판정/앱키64.json', 'utf8'))
const 낼곳 = `${APP}/src/assets/stickers/photo`
const FI = `${APP}/src/components/FoodIcon.jsx`
const ST = `${APP}/src/components/Stickers.jsx`

// ── 소스 파일 찾기
const 폴더들 = [
  `${APP}/docs/stickers/창업자-2026-08-24/음식-유지70`,
  `${APP}/docs/stickers/음식-창업자-2026-08-25/낱개`,
]
const 소스길 = (이름) => {
  for (const d of 폴더들) {
    const p = `${d}/${이름}.png`
    if (fs.existsSync(p)) return p
  }
  return null
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
const 전용규칙 = (이름, 키) =>
  규칙.find((r) => r.키 === 키 && r.말.some((w) => 납작(w) === 납작(이름)))

// ── 갈래 나누기
const 덮기 = []       // {이름, 키, 소스}
const 새키 = []       // {이름, 키, 소스}
let 다음번호 = 495     // fe_494 가 지금 최대

// ⛔ 「순살찜닭」은 「찜닭」과 키를 같이 쓴다 → 새 키로 뗀다
const 억지새키 = new Set(['순살찜닭'])
// ⛔ 「뼈없는순살갈비조림」은 전용 키가 이미 있다 — 규칙 순서만 고치면 된다
const 고쳐쓸키 = { 뼈없는순살갈비조림: 'fe_319' }

for (const 이름 of 판정['갈아끼자']) {
  const 소스 = 소스길(이름)
  if (!소스) { console.error(`⛔ 원본 못 찾음: ${이름}`); process.exit(1) }
  if (고쳐쓸키[이름]) { 덮기.push({ 이름, 키: 고쳐쓸키[이름], 소스 }); continue }
  const k = 앱키[이름]
  if (!억지새키.has(이름) && 전용규칙(이름, k)) 덮기.push({ 이름, 키: k, 소스 })
  else 새키.push({ 이름, 키: `fe_${다음번호++}`, 소스, 옛키: k })
}

console.log(`🖼 덮어쓸 것 ${덮기.length}개 · 새 키를 줄 것 ${새키.length}개 (합 ${덮기.length + 새키.length})`)
console.log(`   새 키 = fe_495 ~ fe_${다음번호 - 1}`)
for (const n of 새키) console.log(`   · ${n.이름.padEnd(16)} ${n.옛키} → ${n.키}`)

// ⛔ 한 키를 둘이 덮으면 하나가 사라진다
const 셈 = {}
for (const d of 덮기) (셈[d.키] ||= []).push(d.이름)
const 충돌 = Object.entries(셈).filter(([, v]) => v.length > 1)
if (충돌.length) {
  console.error(`⛔ 같은 키를 둘이 덮는다: ${충돌.map(([k, v]) => `${k}=${v.join('+')}`).join(' | ')}`)
  process.exit(1)
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

// ── ② PHOTO_RATIO — 있으면 그 줄에서 값만 바꾸고, 없으면 새 줄
let s = fs.readFileSync(ST, 'utf8')
let 고침 = 0, 새줄 = []
for (const [k, r] of Object.entries(비율)) {
  const re = new RegExp(`(\\b${k}\\s*:\\s*)[0-9.]+`)
  if (re.test(s)) { s = s.replace(re, `$1${r}`); 고침++ }
  else 새줄.push(`  ${k}: ${r},`)
}
if (새줄.length) {
  // PHOTO_RATIO 안 마지막 줄 뒤에 끼운다
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
const 새규칙 = 새키.map((n) => `  [['${n.이름}'], '${n.키}'],`).join('\n')
f = f.replace(표식, `${표식}
  // 🍱 2026-08-26 창업자 판정 「갈아끼자」 — 넓은 규칙(「소스」·「덮밥」·「샐러드」…)에 걸려
  //   «남의 자리»를 빌려 쓰던 것들에 전용 키를 줬다. ⛔ 여기가 «맨 위»여야 한다(구체어 먼저).
${새규칙}`)

// ── ④ 「뼈없는순살갈비조림」이 「갈비조림」에 먼저 걸리던 것 — 순서를 뒤집는다
const 갈비살 = f.match(/^\s*\[\['갈비살조림'[^\n]*\n/m)
const 뼈없는 = f.match(/^\s*\[\['뼈없는순살갈비조림'[^\n]*\n/m)
if (갈비살 && 뼈없는 && f.indexOf(갈비살[0]) < f.indexOf(뼈없는[0])) {
  f = f.replace(뼈없는[0], '')
  f = f.replace(갈비살[0], 뼈없는[0] + 갈비살[0])
  console.log('🔧 「뼈없는순살갈비조림」을 「갈비살조림」 위로 올렸다 (구체어 먼저)')
}

// ── ⑤ 「순살찜닭」을 「찜닭」 규칙에서 뗀다
f = f.replace(/\[\['순살찜닭', '찜닭', '안동찜닭'\], 'fe_283'\]/, "[['찜닭', '안동찜닭'], 'fe_283']")

// ── ⑥ 픽커(FOOD_ICON_GROUPS)에 새 키를 실는다 — 안 실으면 유저가 고를 수 없다
for (const n of 새키) {
  const 옛 = n.옛키
  const re = new RegExp(`('${옛}')`)
  if (re.test(f)) f = f.replace(re, `'${n.키}', $1`)      // 옛 키 «앞»에 나란히
  else console.error(`   ⚠️ 픽커에 ${옛} 가 없어 ${n.키} 를 못 실었다`)
}
fs.writeFileSync(FI, f)
console.log(`🏷 ICON_RULES 에 전용 규칙 ${새키.length}개 · 픽커에도 실었다`)

// ── ⑦ 이름표 — ICON_RULES 첫 낱말이 곧 이름표라 저절로 붙는다(FOOD_NAMES 는 손대지 않는다)
fs.writeFileSync('/tmp/판정/넣은키.json', JSON.stringify({ 덮기, 새키 }, null, 1))
console.log('\n📌 다음 = node scripts/check-foodtab.mjs · npm run build · npm run smoke')
