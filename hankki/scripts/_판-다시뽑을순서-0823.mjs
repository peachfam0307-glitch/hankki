// 🥇🥇 「어느 컷부터 다시 뽑나」 — 우선순위 (창업자 2026-08-23)
//   📮 창업자 = *"우선순위로(내 레시피 저장된 것 위주로) 리스트줄래
//      특히 고기류, 면류가 징그럽거든?? 고기류 면류+내 리스트에 들어간 것들먼저 리스트주면 뽑을게."*
//
// ⭐⭐ 심장 = **「레시피가 실제로 쓰는 그림」이 1순위다.**
//    픽커에만 있는 컷은 유저가 «골라야» 보이지만, 레시피에 붙은 그림은 **가만히 있어도 뜬다.**
//    징그러운 게 거기 있으면 그게 제일 먼저 보인다.
//
// ⛔ 절대원칙 30 — 앱과 «같은 모듈»에서 읽는다(`recipe.mjs` → `allBasicRecipes`).
//    ⚠️ 레시피에 `icon` 이 박혀 있으면 그게 이기고(`Thumb.jsx`), 없으면 제목으로 규칙이 고른다.
//
// 쓰기:  node scripts/_판-다시뽑을순서-0823.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { 레시피들 } from './recipe.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')

// ── 갈래 ──
const gStart = src.indexOf('export const FOOD_ICON_GROUPS = [')
const gBody = src.slice(gStart, src.indexOf('\n]', gStart))
const 집 = {}
const 갈래순 = []
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']+)',([^{}]*?)items:\s*\[([^\]]*)\]/g)) {
  if (/kind:\s*'ing'/.test(m[2])) continue
  갈래순.push(m[1])
  for (const k of m[3].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean)) 집[k] = m[1]
}

// ── 이름표 ──
const names = {}
const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
const eStart = src.indexOf('EXTRA_NAMES = {')
if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]

// ── 이번 시트가 덮는 키 (2026-08-23 · 76컷) ──
const 덮음 = new Set([
  'fe_321', 'fe_327', 'fe_188', 'fe_24', 'fe_27',
  'fe_315', 'fe_290', 'fe_307', 'fe_289', 'fe_217', 'fe_229',
  'fe_204', 'fe_218', 'fe_219', 'fe_155', 'fe_122', 'fe_277',
  'fe_43', 'fe_52', 'fe_53', 'fy_yng02', 'fy_y03',
  'fe_169', 'fe_189', 'fe_97', 'fe_297', 'fe_298', 'fe_265',
  'fe_231', 'fe_58', 'fb_b04', 'fh_k25',
  'fh_k13', 'fe_25', 'fe_10',
  'fe_308', 'fe_268', 'fe_191', 'fe_192', 'fe_197', 'fe_129',
  'fe_90', 'fj_c09', 'fj_c12', 'fi_j02', 'fi_j04', 'fe_278',
  'fh_k26', 'fe_18', 'fe_37', 'fe_38', 'fh_k16',
  'fe_09', 'fe_34', 'fe_80', 'fe_112', 'fe_04',
])

// ── 레시피가 «실제로» 쓰는 그림 ──
const 쓰임 = new Map()   // 키 → [레시피 제목…]
for (const r of 레시피들()) {
  const k = r.icon
  if (!k) continue
  if (!쓰임.has(k)) 쓰임.set(k, [])
  쓰임.get(k).push(r.title)
}

const isPhoto = (k) => /^(fe|fh|fy|fj|fi|fb)_/.test(k)
const 고기면 = new Set(['면', '볶음·조림', '구이·튀김', '회·수육'])

const 줄 = []
for (const [k, ts] of 쓰임) {
  if (!isPhoto(k) || 덮음.has(k)) continue
  const g = 집[k] || '(픽커에 없음)'
  줄.push({ key: k, name: names[k] || k, g, n: ts.length, ts })
}
// 순서 = ①고기·면 갈래 먼저 ②레시피 많이 쓰는 것 먼저
줄.sort((a, b) => (고기면.has(b.g) - 고기면.has(a.g)) || (b.n - a.n) || a.name.localeCompare(b.name))

const 묶음 = new Map()
for (const r of 줄) {
  if (!묶음.has(r.g)) 묶음.set(r.g, [])
  묶음.get(r.g).push(r)
}
const 갈래정렬 = [...묶음.keys()].sort((a, b) => (고기면.has(b) - 고기면.has(a)) || 묶음.get(b).length - 묶음.get(a).length)

console.log(`🥇 레시피가 «실제로 쓰는» 그림 중 아직 새 컷이 안 온 것 = ${줄.length}컷\n`)
for (const g of 갈래정렬) {
  const rs = 묶음.get(g)
  console.log(`\n【${g}】 ${rs.length}컷${고기면.has(g) ? '   ⭐고기·면' : ''}`)
  console.log(rs.map((r) => r.name).join(', '))
}
console.log(`\n━━ 레시피 ${레시피들().length}편 · 그림 붙은 것 ${쓰임.size}종 · 그중 안 온 것 ${줄.length}종 ━━`)
