// 🏷🏷 창업자 판정 반영 — 「설명을 뗀다」 34 ＋ 「같은 이름 짝」 31 (2026-08-26)
//   판정 원문 = scripts/_판정-이름정리-0826.json (⛔한 글자도 안 바꿨다)
//
// ⭐ 그냥 떼면 «21자리»가 같은 이름이 된다. 세 갈래로 갈라 처리한다 —
//   ⓵ 짝이 «옛 그린 컷» = 그 옛 컷을 픽커에서 내리면 풀린다(창업자 ⓑ「전수로 갈아끼우자」 방향 그대로)
//   ⓶ 겹침 없음 = 그냥 뗀다
//   ⓷ 짝이 «새 사진»끼리 = ⛔손대지 않는다. 어느 쪽을 쓸지는 창업자가 정한다(규칙 11) → 따로 판을 뽑는다
//
// ⛔ 파일은 하나도 안 지운다 — 그 키로 저장한 레시피가 깨진다(v11.14 방식). 픽커·규칙에서만 내린다.
//
// 실행 = node scripts/_적용-이름정리-0826.mjs [--미리보기]
// 🏷 이름표 = 반영됨 (v11.47)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 파일 = path.join(앱, 'src/components/FoodIcon.jsx')
const 미리 = process.argv.includes('--미리보기')
const 판정 = JSON.parse(fs.readFileSync(path.join(앱, 'scripts/_판정-이름정리-0826.json'), 'utf8'))
let src = fs.readFileSync(파일, 'utf8')

// ── 읽기 ──
const 규칙읽기 = (s) => {
  const out = []
  const rB = s.slice(s.indexOf('const ICON_RULES = ['))
  for (const m of rB.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)) {
    const keys = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])
    if (keys.length) out.push({ 통줄: m[0], keys, 키: m[2] })
  }
  return out
}
const 이름표읽기 = (s) => {
  const 규칙첫 = {}
  for (const r of 규칙읽기(s)) if (!(r.키 in 규칙첫)) 규칙첫[r.키] = r.keys[0]
  const extra = {}
  const eS = s.indexOf('EXTRA_NAMES = {')
  for (const m of s.slice(eS, s.indexOf('\n}', eS)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) extra[m[1]] = m[2]
  return { 규칙첫, extra, 이름: (k) => 규칙첫[k] || extra[k] || '' }
}
const 픽커읽기 = (s) => {
  const g = s.slice(s.indexOf('FOOD_ICON_GROUPS'), s.indexOf('const ICON_RULES'))
  const ks = []
  for (const m of g.matchAll(/\{\s*label:\s*'([^']*)'([^}]*?)items:\s*\[([^\]]*)\]/g)) {
    if (/kind:\s*'ing'/.test(m[0])) continue
    for (const x of m[3].matchAll(/'([^']*)'/g)) ks.push(x[1])
  }
  return ks
}

const 사진키 = /^(fe|fh|fy|fj|fi|fb|gr)_/
const { 이름: 이름0, 규칙첫: 규칙첫0 } = 이름표읽기(src)

// ── ① 같은 이름 짝 → 안 고른 쪽을 내린다 ──
const 픽커0 = 픽커읽기(src)
const 이름별 = new Map()
for (const k of 픽커0) {
  if (!사진키.test(k)) continue
  const n = 이름0(k)
  if (!n || /모둠\s*\(\d가지\)/.test(n)) continue
  ;(이름별.get(n) || 이름별.set(n, []).get(n)).push(k)
}
const 내릴것 = new Set()
for (const [n, 쓸것] of Object.entries(판정.같은이름_쓸것)) {
  const ks = 이름별.get(n) || []
  if (!ks.includes(쓸것)) throw new Error(`⛔ 「${n}」 짝에 ${쓸것} 이 없다 — ${ks.join(',')}`)
  for (const k of ks) if (k !== 쓸것) 내릴것.add(k)
}

// ── ② 설명을 뗀 이름 ──
const 씻기 = (s) => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim()
const 맛 = ['맑은', '매운', '얼큰', '매콤', '빨간', '하얀']
const 새이름 = {}
for (const [k, 옛] of 판정.설명이라뗀다) {
  let n = 씻기(옛)
  const w = 맛.find((x) => 옛.startsWith(x))
  if (w) n = 옛.slice(w.length)
  if (옛 === '얼큰한국') n = '국'            // 「얼큰한국」의 맨 이름은 「국」이다
  if (옛 === '뚝딱버섯볶음밥') n = '버섯볶음밥'
  if (/^범용소스-종지/.test(옛)) n = `소스 종지${옛.slice(-1)}`
  새이름[k] = n
}

// ── ③ 뗀 뒤에 겹치는가 — 짝의 «세대»로 갈래를 가른다 ──
// ⛔ 세대 판정은 2026-08-26 에 «눈으로» 확인한 목록이다(컨택트시트 6장 · 절대원칙 21).
//    짝이 옛 그림이면 그 옛 컷을 내린다. 새 사진끼리면 손대지 않는다.
const 옛짝을내린다 = ['fe_29', 'fe_31', 'fe_159', 'fe_220', 'fe_144', 'fe_201', 'fe_145', 'fe_282']
// 「뗀다」 목록에 있지만 «그 자신이 옛 그림»이라 이름을 갈 게 아니라 내려야 하는 것
const 자기가옛이라내린다 = ['fe_148', 'fe_227', 'fe_265', 'fe_171', 'fe_184']
// ⛔ 손대지 않는 것 — 창업자 판정 대기
//   ⑴ 새 사진끼리 이름이 겹친다(어느 쪽을 쓸지는 창업자가 정한다 · 규칙 11)
//   ⑵ ⭐「맑은국·얼큰한국·매운양념장」은 «범용 바닥 컷»이다 — 떼면 둘 다 「국」이 되어
//      맑은지 얼큰한지 고를 때 «구분할 방법이 사라진다». 이름이 곧 그 컷의 쓸모다.
const 판정대기 = new Set([
  'gr_317', 'fe_474', 'fe_513', 'fe_476', 'fe_478', 'gr_311', 'gr_312', 'gr_074', 'fe_514',
  'gr_255', 'fe_420', 'gr_263', 'fe_415', 'fe_75', 'fe_527', 'gr_037',
  'fe_79', 'fe_80', 'fe_185',
])

for (const k of [...옛짝을내린다, ...자기가옛이라내린다]) 내릴것.add(k)
const 이름갈것 = Object.entries(새이름).filter(([k]) => !내릴것.has(k) && !판정대기.has(k))

// ── 적용 ⑴ 픽커에서 내린다 ──
let 내린수 = 0
src = src.replace(/^(\s*\{ label: '[^']*',(?: kind: '\w+',)? items: \[)([^\]]*)(\] \},)$/gm, (all, a, mid, z) => {
  const ks = [...mid.matchAll(/'([^']*)'/g)].map((m) => m[1])
  const 남 = ks.filter((k) => !내릴것.has(k))
  내린수 += ks.length - 남.length
  return a + 남.map((k) => `'${k}'`).join(', ') + z
})

// ── 적용 ⑵ 이름을 간다 ──
// ⭐ 이름표는 «규칙의 첫 낱말»이 이긴다(FOOD_NAMES). 규칙이 있으면 첫 낱말을 갈고,
//    없으면 EXTRA_NAMES 를 고친다. ⛔옛 이름은 뒤에 별칭으로 남긴다 — 그 이름으로 저장한 사람이 있다.
const 바꾼것 = []
for (const [키, 새] of 이름갈것) {
  const 규칙들 = 규칙읽기(src).filter((r) => r.키 === 키)
  if (규칙들.length) {
    const r = 규칙들[0]
    const 남 = r.keys.filter((x) => x !== 새)
    const 새키들 = [새, ...남]
    const 새줄 = `[[${새키들.map((x) => `'${x}'`).join(', ')}], '${키}']`
    if (!src.includes(r.통줄)) throw new Error(`⛔ ${키} 규칙 줄을 못 찾았다`)
    src = src.replace(r.통줄, 새줄)
  } else {
    const re = new RegExp(`(${키}\\s*:\\s*)'[^']*'`)
    if (!re.test(src)) throw new Error(`⛔ ${키} 이름표를 못 찾았다(규칙도 EXTRA 도 없다)`)
    src = src.replace(re, `$1'${새}'`)
  }
  바꾼것.push(`${이름0(키)} → ${새} (${키})`)
}

// ── 적용 ⑶ 내린 컷이 «이름을 가로채지» 않게 ──
// ⛔ 픽커에서 내려도 `ICON_RULES` 는 살아 있어서, 제목을 치면 여전히 옛 그림이 붙는다.
//    새 컷이 그 이름을 가져갔으면 옛 컷 규칙에서 그 낱말을 뺀다(그 줄이 비면 줄째 뺀다).
const 새가가져간이름 = new Set(이름갈것.map(([, n]) => n))
let 가로채기뺀수 = 0
for (const r of 규칙읽기(src)) {
  if (!내릴것.has(r.키)) continue
  const 남 = r.keys.filter((x) => !새가가져간이름.has(x))
  if (남.length === r.keys.length) continue
  가로채기뺀수 += r.keys.length - 남.length
  // ⛔⛔ [2026-08-26 사고] 빈 줄을 «블록 주석»으로 바꿨더니 뒤의 쉼표가 남아
  //    `[a, /* … */, b]` = **배열에 «구멍»(elision)** 이 생겼다 → `ICON_RULES` 에 `undefined` 원소가 끼고
  //    `for (const [keys, key] of ICON_RULES)` 가 터져 **앱이 백지**가 됐다.
  //    ⭐ 게이트 56개가 전부 초록불이었다 — 글자만 읽지 «돌려보지» 않으니까. 화면을 열어보고 잡았다(절대원칙 21).
  //    ✅ 그래서 줄 주석(`//`)으로 바꾸고 «뒤의 쉼표까지» 같이 먹는다.
  if (남.length) src = src.replace(r.통줄, `[[${남.map((x) => `'${x}'`).join(', ')}], '${r.키}']`)
  else src = src.replace(`${r.통줄},`, `// ⬇️ [2026-08-26] 픽커에서 내렸고 이름도 새 컷이 가져갔다 — 규칙 줄째 뺐다. 파일은 보존 · ${r.키}`)
}

if (미리) {
  console.log(`내릴 컷 ${내릴것.size}개\n  ${[...내릴것].join(', ')}`)
  console.log(`\n이름 갈 것 ${이름갈것.length}개\n  ${바꾼것.join('\n  ')}`)
  console.log(`\n⛔ 창업자 판정 대기(새 사진끼리 겹친다) ${판정대기.size}개\n  ${[...판정대기].join(', ')}`)
  process.exit(0)
}
fs.writeFileSync(파일, src)
console.log(`✅ ${path.relative(앱, 파일)}`)
console.log(`   픽커에서 내림 ${내린수}컷 · 이름 갈아낌 ${이름갈것.length}개 · 옛 규칙 낱말 뺌 ${가로채기뺀수}개`)
console.log(`   ⏳ 창업자 판정 대기 ${판정대기.size}컷 — 새 사진끼리 이름이 겹쳐 손대지 않았다`)
