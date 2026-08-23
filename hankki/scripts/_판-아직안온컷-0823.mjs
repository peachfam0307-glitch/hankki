// 📝📝 「아직 새 컷이 «안 온» 음식 목록」 — 창업자 2026-08-23
//   📮 창업자 = *"어차피 전체 다 갈아끼워야하거든. 지금 급한 것부터 한거라.
//      통과한거 제외하고 나머지는 다시 리스트 줘(복사하기 편하게 길게)."*
//
// ⭐⭐ 심장 = **앱에 «실제로 실린» 요리 컷에서 이번에 덮이는 것만 뺀다.**
//    ⛔ 손으로 세지 않는다(규칙 17) — `FOOD_ICON_GROUPS`(픽커가 그리는 그 배열)를 직접 읽는다.
//
// ⛔ 「재료(ig_)·도형」은 애초에 뺀다 — 레꾸 표지에 붙는 «요리» 컷만이 대상이다.
//
// 쓰기:  node scripts/_판-아직안온컷-0823.mjs          갈래별 목록
//        node scripts/_판-아직안온컷-0823.mjs --줄     한 줄에 쉼표로(프롬프트에 붙이기)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')

// ── 갈래 읽기 ──
const gStart = src.indexOf('export const FOOD_ICON_GROUPS = [')
const gBody = src.slice(gStart, src.indexOf('\n]', gStart))
const groups = []
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']+)',([^{}]*?)items:\s*\[([^\]]*)\]/g)) {
  groups.push({
    label: m[1],
    kind: /kind:\s*'([^']+)'/.exec(m[2])?.[1] || '',
    items: m[3].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean),
  })
}
const declared = (gBody.match(/\{\s*label:\s*'/g) || []).length
if (groups.length !== declared) { console.error(`❌ 갈래 ${declared} 중 ${groups.length}만 읽었다`); process.exit(1) }

// ── 이름표 ──
const names = {}
const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
const eStart = src.indexOf('EXTRA_NAMES = {')
if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]

const isPhoto = (k) => /^(fe|fh|fy|fj|fi|fb)_/.test(k)
const 요리갈래 = groups.filter((g) => g.kind !== 'ing' && g.items.some(isPhoto))

// ── 이번 시트가 «덮는» 앱 키 ──
//   ⛔ 손으로 적는다 — 시트 이름표를 읽어 짝지은 것이고, 컷 순서는 컨택트시트로 눈으로 확인했다.
//   ⭐ 시트 ①②③ 은 창업자가 2026-08-23 검수판에서 이름을 줬다.
const 덮는키 = new Set([
  // ④ 파스타
  'fe_321', 'fe_327', 'fe_188', 'fe_24', 'fe_27',
  // ⑤ 밥
  'fe_315', 'fe_290', 'fe_307', 'fe_289', 'fe_217', 'fe_229',
  // ⑥⑨ 면 (그릇 두 판 · 같은 여섯)
  'fe_204', 'fe_218', 'fe_219', 'fe_155', 'fe_122', 'fe_277',
  // ⑦ 파스타
  'fe_43', 'fe_52', 'fe_53', 'fy_yng02', 'fy_y03',
  // ⑧ 밥·면
  'fe_169', 'fe_189', 'fe_97', 'fe_297', 'fe_298', 'fe_265',
  // ⑩ 면
  'fe_231', 'fe_58', 'fb_b04', 'fh_k25',
  // ⑪ 고기 (⛔n11_04 장조림은 창업자가 「안 쓴다」 — 대신 n01_06 이 맡는다)
  'fh_k13', 'fe_25', 'fe_10',
  // ⑫ 고기
  'fe_308', 'fe_268', 'fe_191', 'fe_192', 'fe_197', 'fe_129',
  // ⑬ 면
  'fe_90', 'fj_c09', 'fj_c12', 'fi_j02', 'fi_j04', 'fe_278',
  // ⑭ 면
  'fh_k26', 'fe_18', 'fe_37', 'fe_38', 'fh_k16',
])
// ① 이름 없던 시트 — 창업자가 준 이름으로 짝지은 것
const 창업자이름 = ['팟타이', '장조림', '알탕', '소고기솥밥', '무생채', '부대찌개', '버섯솥밥']
for (const [k, v] of Object.entries(names)) if (창업자이름.includes(v)) 덮는키.add(k)

let 남음 = 0
let 덮임 = 0
const out = []
for (const g of 요리갈래) {
  const 남 = g.items.filter((k) => isPhoto(k) && !덮는키.has(k))
  덮임 += g.items.filter((k) => isPhoto(k) && 덮는키.has(k)).length
  남음 += 남.length
  if (남.length) out.push({ label: g.label, names: 남.map((k) => names[k] || k) })
}

if (process.argv.includes('--줄')) {
  console.log(out.flatMap((g) => g.names).join(', '))
} else {
  for (const g of out) {
    console.log(`\n【${g.label}】 ${g.names.length}컷`)
    console.log(g.names.join(' · '))
  }
  console.log(`\n━━ 남은 것 ${남음}컷 · 이번에 덮이는 것 ${덮임}컷 ━━`)
}
