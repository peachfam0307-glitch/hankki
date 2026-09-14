// 🍜 카와이 36장 철거 — 창업자 전수 판정(2026-08-29)을 규칙·픽커에 반영한다.
//   📮 창업자 = *"카와이는 전부 삭제하고, 새컷을 앱에 반영해줘."*
//   ⛔ 손으로 고치지 않는다 — 36장 × (규칙 + 픽커 + 확인) 은 반드시 몇 개가 빠진다.
import fs from 'node:fs'
const P = 'src/components/FoodIcon.jsx'
let src = fs.readFileSync(P, 'utf8')

// 옛 카와이 → 새 컷 (실물을 눈으로 보고 골랐다 · 절대원칙 21)
const 바꾼다 = {
  fb_b08:'fe_503', fe_100:'gr_108', fe_110:'fe_270', fe_129:'gr_387', fe_144:'gr_056',
  fe_145:'gr_414', fe_15:'gr_014',  fe_154:'gr_406', fe_160:'gr_385', fe_164:'gr_388',
  fe_185:'gr_375', fe_191:'gr_365', fe_203:'fe_325', fe_220:'gr_359', fe_265:'fe_395',
  fe_29:'gr_370',  fe_36:'gr_037',  fe_67:'gr_343',  fe_68:'gr_238',  fe_84:'gr_008',
  fe_86:'gr_299',  fe_87:'fe_456',  fh_k03:'gr_351', fh_k33:'gr_042', fi_j09:'gr_279',
  fj_jsk15:'gr_084',
}
// 대체 컷이 없다 → 규칙 줄을 지운다
const 줄삭제 = {
  fb_b06:'김말이 — 대체 컷 없음', fe_126:'죽은 규칙(무생채(옛 컷))', 
  fe_159:'해물전골 — 아래 「전골」 규칙(gr_368)이 받는다',
  fe_39:'붕어빵 — 빵·간식은 레시피 아이콘 대상이 아니다', fe_51:'도넛 — 같음',
  fe_82:'모닝빵·식빵 — 같음', fe_83:'소보로·단팥빵 — 같음',
}
// 규칙이 아예 없고 픽커에만 있는 것
const 픽커만 = ['fe_128','fe_142','fe_149']
const 전부 = [...Object.keys(바꾼다), ...Object.keys(줄삭제), ...픽커만]

// ① 규칙 치환 / 삭제
const lines = src.split('\n')
const out = []
let 친것 = 0, 지운것 = 0
for (const l of lines) {
  const m = l.match(/^(\s*)\[\[(.*?)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\](,?)(.*)$/)
  if (!m) { out.push(l); continue }
  const k = m[3]
  if (줄삭제[k]) { 지운것++; continue }
  if (바꾼다[k]) {
    out.push(`${m[1]}[[${m[2]}], '${바꾼다[k]}']${m[4]}${m[5]}`)
    친것++; continue
  }
  out.push(l)
}
src = out.join('\n')

// ② 픽커에서 내린다
const gi = src.indexOf('export const FOOD_ICON_GROUPS')
const gE = src.indexOf('\nexport const', gi + 10)
let picker = src.slice(gi, gE)
let 내린것 = 0
for (const k of 전부) {
  const before = picker
  picker = picker.replace(new RegExp(`'${k}',\\s*`, 'g'), '').replace(new RegExp(`,\\s*'${k}'`, 'g'), '')
  if (picker !== before) 내린것++
}
src = src.slice(0, gi) + picker + src.slice(gE)

fs.writeFileSync(P, src)
console.log(`규칙 치환 ${친것} · 규칙 삭제 ${지운것} · 픽커에서 내림 ${내린것}`)

// ③ 검산 — 카와이 키가 규칙·픽커에 «한 개도» 남으면 안 된다
const after = fs.readFileSync(P, 'utf8')
const gi2 = after.indexOf('export const FOOD_ICON_GROUPS'), gE2 = after.indexOf('\nexport const', gi2+10)
const pick2 = new Set()
for (const m of after.slice(gi2,gE2).matchAll(/'([a-z]+_[A-Za-z0-9_]+)'/g)) pick2.add(m[1])
const rule2 = new Set()
for (const l of after.split('\n')) { const m = l.match(/^\s*\[\[.*?\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/); if(m) rule2.add(m[1]) }
const 남음 = 전부.filter(k => pick2.has(k) || rule2.has(k))
console.log('남은 카와이 =', 남음.length, 남음.join(' ') || '✅ 없음')
// 대체 컷이 픽커에 실려 있나 (없으면 마이그레이션이 못 갈아끼운다)
const 없는대체 = [...new Set(Object.values(바꾼다))].filter(k => !pick2.has(k))
console.log('대체 컷인데 픽커에 «없는» 것 =', 없는대체.length, 없는대체.join(' ') || '✅ 전부 있음')
