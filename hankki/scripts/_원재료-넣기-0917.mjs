// 🛒 대조 끝난 원재료 전사를 curation.js 에 «끼워 넣는다» (2026-09-17)
//
//   입력 = docs/장바구니-원재료-전사-2026-09-17.json 의 「목록에_있는_편」 (클로드가 사진을 키워 두 번 대조한 것)
//   찾기 = 카드에 뜨는 이름(brand + name · 파는 곳 brand 는 뺌) 이 «딱 하나» 맞는 덩이에만 넣는다. 둘이거나 없으면 건너뛰고 찍는다.
//   넣는 칸 = ingredients · allergen · nutrition · checked · ingWho:'창업자' (사진 출처가 창업자 · check-benefitwho 통과)
//   이미 ingredients 가 있는 덩이(굴소스)는 건드리지 않는다. 원재료 글자가 비어 있으면(뒷면 사진 없음) 넣지 않는다.
//
// 실행: cd hankki && node scripts/_원재료-넣기-0917.mjs           # 미리보기
//       node scripts/_원재료-넣기-0917.mjs --써               # 실제로 쓴다
import { readFileSync, writeFileSync } from 'node:fs'

const 쓰기 = process.argv.includes('--써')
const d = JSON.parse(readFileSync(new URL('../docs/장바구니-원재료-전사-2026-09-17.json', import.meta.url), 'utf8'))
const P = new URL('../src/data/curation.js', import.meta.url)
let s = readFileSync(P, 'utf8')
const 파는곳 = ['쿠팡', '컬리', '오아시스', '네이버', '한살림', '자연드림', '산지톡']
const esc = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

let 넣음 = 0, 이미 = 0
const 건너뜀 = []
for (const it of d['목록에_있는_편']) {
  if (!it.ingredients || it.ingredients.trim() === '?') { 건너뜀.push(`${it.name} — 원재료 비어 있음`); continue }
  const re = /\{\s*name:\s*'([^']+)'(?:,\s*who:\s*'[^']*')?(?:,\s*brand:\s*'([^']+)')?/g   // who: 가 name 과 brand 사이에 끼는 덩이가 있다(안심햄)
  const hits = []
  let m
  while ((m = re.exec(s))) {
    const disp = (m[2] && !파는곳.includes(m[2]) ? m[2] + ' ' : '') + m[1]
    if (disp === it.name) hits.push({ index: m.index, len: m[0].length, text: m[0] })
  }
  if (hits.length !== 1) { 건너뜀.push(`${it.name} — 덩이 ${hits.length}개`); continue }
  const h = hits[0]
  // 이 덩이 «안»만 본다 — 다음 덩이가 시작되기 전까지 (그 전엔 600자 창이 다음 덩이의 새 글자를 «이미 있음»으로 잘못 셌다)
  const 끝 = s.slice(h.index).search(/\n\s*(\{\s*name:|\])/)
  if (s.slice(h.index, h.index + (끝 < 0 ? 600 : 끝)).includes('ingredients:')) { 이미++; continue }
  // ⛔ «?»·«잘림»이 남은 편은 유저에게 못 나간다 — 캡처로 채운 뒤에
  if (/\?|잘림/.test(it.ingredients + (it.allergen || ''))) { 건너뜀.push(`${it.name} — 잘림·? 남음(캡처 대기)`); continue }
  const nut = /\?|잘림/.test(it.nutrition || '') ? '' : it.nutrition
  const 추가 = `, ingredients: '${esc(it.ingredients)}'` +
    (it.allergen ? `, allergen: '${esc(it.allergen)}'` : '') +
    (nut ? `, nutrition: '${esc(nut)}'` : '') +
    `, checked: '${d.checked}', ingWho: '창업자'`
  s = s.slice(0, h.index) + h.text + 추가 + s.slice(h.index + h.len)
  넣음++
  console.log(`  ✅ ${it.name}`)
}
console.log(`\n넣음 ${넣음} · 이미 있음 ${이미} · 건너뜀 ${건너뜀.length}`)
건너뜀.forEach((x) => console.log('  ⏭ ' + x))
if (쓰기) { writeFileSync(P, s); console.log('\n💾 curation.js 에 썼다') } else console.log('\n(미리보기 — --써 를 붙이면 쓴다)')
