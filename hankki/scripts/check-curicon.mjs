// 🚫🚫 배포 게이트 — 큐레이션 아이콘 **두 겹**으로 막는다.
//   ① 파일이 «없는» 갈래·품목이 있으면 → 유니코드 이모지가 뜬다 → **배포 막힘**
//   ② 파일이 있어도 «창업자가 안 본» 아이콘이면 → **배포 막힘**
//
// 📮 창업자 2026-08-17 = *"치즈이미지가 저거줬었나? **그림체가 다른데**"*
//                      → *"**어기지마. 절대원칙이야.**"* → *"**장치 완벽하게 만들어.**"*
//
// ⛔⛔ 무슨 일이 있었나 — 내가 「유제품 > 치즈」 갈래를 만들며 `icon: 'cu_cheese'` 라고 **이름만 쓰고
//    파일이 있는지 확인하지 않았다.** 없으면 `curIcon()` 이 null 을 주고 **`emoji` 로 폴백**해서
//    화면에 **시스템 이모지 🧀** 가 떴다. CLAUDE.md 절대원칙 위반이다:
//      *"⛔ UI에 유니코드 이모지 금지 — 우리 커스텀 스티커만."*
//
// ⛔⛔⛔ **「그림체」는 기계가 못 가른다 — 두 번 재보고 둘 다 실패했다(2026-08-17 실측).**
//    ⓐ **아주 어두운 픽셀 비율**(굵은 검은 외곽선을 잡으려 했다)
//       기존 큐레이션 27개 = **0.05% ~ 32.79%** ↔ 스티커 문법 `food_cheese` = **7.88%** → 한가운데. ⛔못 가른다
//    ⓑ **색 수**(납작한 벡터는 색이 적을 것이라 봤다)
//       기존 = **58 ~ 317** ↔ `food_cheese` = **97** → 또 한가운데. ⛔못 가른다
//    📌 둘 다 「그림체」가 아니라 **「제품이 원래 어떤 색인가」**를 쟀다(간장병은 원래 어둡다).
//       ⭐ **그래서 잣대를 바꿨다 — 기계가 «판정»하지 말고, «창업자 눈을 반드시 거치게» 한다.**
//
// ⭐⭐ 그게 ②다. 아이콘을 새로 넣으면 `curation-icons.json` 에 없어서 **배포가 막히고**,
//    창업자가 실물을 본 뒤에만 그 파일에 줄이 는다. **그림체든 잘림이든 오타든 전부 이 관문을 지난다.**
//    (같은 생각 = `docs/stickers/아이콘-이름표-창업자.json` · 절대원칙 13 「올라가는 건 전부 창업자 검수」)
//
// 🧪 규칙 12 검증 = ⓐ`cu_cheese` 살려두면 **exit 1** ⓑ승인 목록에서 아무거나 빼면 **exit 1** ⓒ되돌리면 exit 0

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 아이콘폴더 = join(여기, '../src/assets/curation')
const 큐레이션 = join(여기, '../src/data/curation.js')
const 승인표 = join(여기, 'curation-icons.json')

if (!existsSync(아이콘폴더)) { console.error('⛔ 아이콘 폴더가 없다:', 아이콘폴더); process.exit(1) }
const 있는키 = new Set(readdirSync(아이콘폴더).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)))
const 소스 = readFileSync(큐레이션, 'utf8')

// 🔒 「제대로 읽었나」를 스스로 확인한다 — 못 읽고도 조용히 통과하는 게 제일 나쁘다(규칙 18 ⓘ).
const 갈래 = [...소스.matchAll(/cat:\s*'([^']+)',\s*group:\s*'([^']+)'[^}]*?icon:\s*'([^']*)'/g)]
if (갈래.length < 15) {
  console.error(`⛔ 갈래를 ${갈래.length}개밖에 못 읽었다 — 읽는 방식이 깨졌다(curation.js 모양이 바뀌었나?)`)
  process.exit(1)
}

const 승인 = existsSync(승인표) ? JSON.parse(readFileSync(승인표, 'utf8')) : { 승인됨: {} }
const 승인키 = new Set(Object.keys(승인.승인됨 || {}))

const 없음 = [], 미승인 = []
const 본키 = new Set()
for (const [, cat, group, key] of 갈래) {
  본키.add(key)
  if (!key) 없음.push(`갈래 「${cat}」(${group}) — icon 이 비어 있다`)
  else if (!있는키.has(key)) 없음.push(`갈래 「${cat}」(${group}) — icon: '${key}' 파일이 없다`)
  else if (!승인키.has(key)) 미승인.push(`갈래 「${cat}」(${group}) — '${key}'`)
}
for (const m of 소스.matchAll(/\{\s*name:\s*'([^']+)'[^}]*?icon:\s*'([^']+)'/g)) {
  본키.add(m[2])
  if (!있는키.has(m[2])) 없음.push(`품목 「${m[1]}」 — icon: '${m[2]}' 파일이 없다`)
  else if (!승인키.has(m[2])) 미승인.push(`품목 「${m[1]}」 — '${m[2]}'`)
}

if (없음.length) {
  console.error(`\n⛔ ① 파일이 없어서 «유니코드 이모지»가 뜰 자리 ${없음.length}곳\n`)
  없음.forEach((t) => console.error('   ·', t))
  console.error(`\n   📌 CLAUDE.md 절대원칙 = "UI에 유니코드 이모지 금지 — 우리 커스텀 스티커만"`)
  console.error(`   ✅ 길 둘 = ⑴ PNG 를 ${아이콘폴더} 에 넣는다  ⑵ 그림이 없으면 **그 갈래를 내지 않는다**\n`)
}
if (미승인.length) {
  console.error(`\n⛔ ② 창업자가 «아직 안 본» 아이콘 ${미승인.length}곳\n`)
  미승인.forEach((t) => console.error('   ·', t))
  console.error(`\n   ⭐ 「그림체가 맞나」는 기계가 못 가른다(위 주석 실측). **창업자 눈이 유일한 관문이다.**`)
  console.error(`   ✅ 창업자가 실물을 보고 OK 하면 → scripts/curation-icons.json 에 줄을 넣는다:`)
  console.error(`        "<키>": { "본날": "YYYY-MM-DD", "무엇": "…" }`)
  console.error(`   ⚠️⚠️ 큐레이션 아이콘 «규격» — 2026-08-17 창업자와 실물로 맞춘 값:`)
  console.error(`      · 수채화 톤 · 부드러운 그림자 · ⛔굵은 검은 외곽선 없이(스티커 문법을 가져오면 튄다)`)
  console.error(`      · 제품 «하나»만 · 여백 적게 · 배경 흰색(여백은 넣을 때 잘라 낸다)`)
  console.error(`      · 접시에 담아도 되고(cu_ham_slice·cu_tofu) 포장/병째여도 된다(cu_soy·cu_sugar·cu_oligo)`)
  console.error(`      · ⛔⛔ **포장 글자는 낱말 «하나»까지** — 화면 표시가 42px 이라 여러 줄이면 통째로 뭉갠다`)
  console.error(`        (기존 = 「간장」·「맛술」·「굴소스」 한 낱말. 5줄짜리 라벨은 안 읽히고 지저분해진다)`)
  console.error(`      · ⛔ 그림 속 글자가 «제품과 다르면» 안 된다 — 하바티인데 「체다」라고 적힌 컷이 실제로 왔다(반려)\n`)
}
if (없음.length || 미승인.length) process.exit(1)

const 안쓰는것 = [...있는키].filter((k) => !본키.has(k))
console.log(`✅ 큐레이션 아이콘 — 갈래 ${갈래.length}개 전부 파일 있음·전부 창업자 확인됨 (파일 ${있는키.size}개${안쓰는것.length ? ` · 안 쓰는 재고 ${안쓰는것.length}` : ''})`)
