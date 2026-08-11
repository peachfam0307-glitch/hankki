// 🍱 창업자 36편 — 「음식 사진」이 붙나, 「범용 도형」이 붙나
//
// 📮 창업자 2026-08-11 *"오징어새우전은 음식사진이 없네.."* → *"음식사진 없는거 다 알려줘 다시뽑게."*
//    시안에서 「오징어 새우전」에 **오징어 «재료» 그림**이 붙었다(제목 자동매칭이 `squid` 로 갔다).
//
// ⭐ 판정은 «앱과 똑같은 로직»으로 한다 — `guessFoodIcon` 은 아주 단순하다:
//      for (const [keys, key] of ICON_RULES) if (keys.some(k => 제목.includes(k))) return key
//    → `ICON_RULES` 를 파일 «순서대로» 읽어 첫 매칭을 고른다. 흉내가 아니라 같은 규칙이다.
// ⭐ 「사진인가」 = `src/assets/stickers/photo/<키>.png` 가 실제로 있나. 없으면 SVG 도형이다.
//
// ⛔⛔ 처음엔 «앱 화면»에 36편을 시드로 넣어 재려 했는데 세 번 헛돌았다:
//    ⑴온보딩이 덮음 ⑵코치마크가 클릭을 가로챔 ⑶시드가 안 들어가 화면엔 기본 레시피만 44개.
//    그때마다 결과는 「0편」이었고 그건 **「레시피가 없다」가 아니라 「내가 못 봤다」**였다(규칙 18).
import { readFileSync, existsSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const 편 = JSON.parse(readFileSync(new URL('docs/_대기/레시피-정리-초안-2026-08-10.json', 뿌리), 'utf8'))
const src = readFileSync(new URL('src/components/FoodIcon.jsx', 뿌리), 'utf8')

// ── ICON_RULES 를 «순서대로» 뽑는다 ──
const 본문 = src.slice(src.indexOf('const ICON_RULES = ['))
const 규칙 = [...본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 100) {
  console.error(`⛔ ICON_RULES 를 ${규칙.length}개밖에 못 읽었다 — 파일 모양이 바뀌었다. 이 검사를 고칠 것.`)
  process.exit(1)
}

const 고르기 = (제목) => 규칙.find((r) => r.keys.some((k) => 제목.includes(k)))?.key || 'default'
const 사진있나 = (키) => existsSync(new URL(`src/assets/stickers/photo/${키}.png`, 뿌리))

// ── 검사가 «맞게 재는지» 먼저 확인한다(규칙 12) ──
// ⚠️ 2026-08-11 갱신 — 「오징어 새우전」은 원래 `false`(사진 없음) 시험값이었는데
//    창업자가 새 컷(`fe_163`)을 줘서 **사진이 생겼다.** 이 검사가 스스로 걸려서 알았다(규칙 12가 값을 했다).
//    ⛔ 시험값을 지우지 말고 «지금 참인 것»으로 바꾼다 — false 칸이 없으면 「늘 통과하는 검사」가 된다.
//    「브로콜리」 홑낱말은 재료 도형(`broccoli`)으로 가고 그건 사진이 없다(「브로콜리 구이」라야 fe_162).
const 시험 = [['깻잎전', true], ['브로콜리', false], ['오징어 새우전', true], ['콩국수', true]]
for (const [t, 기대] of 시험) {
  const k = 고르기(t)
  if (사진있나(k) !== 기대) {
    console.error(`⛔ 검사가 틀렸다 — 「${t}」 → ${k} (사진 ${사진있나(k)}, 기대 ${기대})`)
    process.exit(1)
  }
}

const 잰것 = 편.map((r) => { const k = 고르기(r.title); return { 제목: r.title, 키: k, 사진: 사진있나(k) } })
const 없는것 = 잰것.filter((r) => !r.사진)

console.log(`\n🍱 창업자 36편 — 음식 사진이 붙나\n`)
console.log(`  ✅ 사진 있음 : ${잰것.length - 없는것.length}편`)
console.log(`  ⛔ 사진 없음 : ${없는것.length}편   ← 다시 뽑을 것\n`)
if (없는것.length) {
  console.log('  ── 음식 사진이 없는 편 (붙은 그림) ──')
  없는것.forEach((r, i) => console.log(`   ${String(i + 1).padStart(2)}. ${r.제목.padEnd(16)} → ${r.키}`))
}
