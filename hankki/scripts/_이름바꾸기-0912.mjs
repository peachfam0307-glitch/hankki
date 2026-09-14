#!/usr/bin/env node
// 🫒 재료 이름 바꾸기 — «창업자가 콕 집은 편»만 (2026-09-12)
//
// 📮 창업자 = *"sns랑 튀김빼고 다 올리브유. 고구마맛탕은 올리브유해도돼. 나머지13편 다 올리브유.
//    물엿4편도 다 올리고당."* ＋ *"튀김은 식용유가 맞아"*
//
// ⛔⛔ **편 이름을 하나하나 적는다 — 낱말로 싹 바꾸지 않는다.**
//    창업자가 편마다 갈랐다(튀김은 식용유가 맞고, SNS 레시피는 우리 것이 아니라 원문 그대로).
//    낱말 치환은 그 판단을 통째로 뭉갠다.
// ⛔ 레시피 글자가 바뀐다 = **창업자 전수 검수 대상**(규칙 13) · `BASICS_VERSION` 도 올려야 한다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 진짜 = process.argv.includes('--바꿈')

// 편 이름 → [옛 재료, 새 재료]
const 할일 = [
  // 🫒 식용유 → 올리브유 (11편) — ⛔ 튀김 3편(새우튀김·한판 탕수육·버섯전)과
  //    SNS 3편(어남선생 두부조림·어남선생 오징어볶음·정호영 셰프 닭볶음탕)은 **뺀다**
  ...['팟타이', '마늘쫑 비빔밥', '계란후라이조림', '갈치구이', '고등어구이', '어묵볶음',
      '수육', '어묵 당면볶음', '돼지고기 고추장찌개', '간장진미채볶음',
      '고구마맛탕'].map((t) => [t, '식용유', '올리브유']),
  // 🍯 물엿 → 올리고당 (4편) — 창업자 = "물엿4편도 다"
  ...['꽈리고추 멸치볶음', '양념게장', '매콤 닭다리살 볶음', '어남선생 갈비치킨'].map((t) => [t, '물엿', '올리고당']),
]

const 길 = join(뿌리, 'src/data/basics.js')
let src = readFileSync(길, 'utf8')
const 편 = [...src.matchAll(/title:\s*'([^']+)'/g)]
const 바뀐 = [], 못찾음 = []

// ⛔⛔ 뒤에서부터 고친다 — 앞에서 고치면 길이가 바뀌어 뒤 자리가 밀린다
//    (2026-09-10 초피액젓 때 정확히 그래서 37편 중 12편만 붙었다)
//    ⛔ 그런데 **「할일에 적은 순서」로 뒤집으면 소용없다** — 내가 적은 차례는 파일 차례가 아니다.
//       실제로 그래서 5편이 «없다»고 나왔다(멀쩡히 있었다). **파일 «위치»로 정렬해서 뒤에서부터.**
const 차례 = 할일
  .map(([제목, 옛, 새]) => ({ 제목, 옛, 새, 자리: 편.find((x) => x[1] === 제목)?.index ?? -1 }))
  .sort((a, b) => b.자리 - a.자리)
for (const { 제목, 옛, 새, 자리 } of 차례) {
  const t = 자리 >= 0 ? 편.find((x) => x[1] === 제목) : null
  if (!t) { 못찾음.push(`⛔ 「${제목}」 편을 못 찾았다`); continue }
  const 다음 = 편.find((x) => x.index > t.index)
  const 시작 = t.index, 끝 = 다음 ? 다음.index : src.length
  const 덩 = src.slice(시작, 끝)
  // ⭐ 따옴표 «안»에서 그 재료로 «시작하는» 줄만 — 만드는 법 설명에서도 같은 말을 쓰므로 둘 다 본다
  let 센것 = 0
  const 새덩 = 덩.replace(/'((?:[^'\\]|\\.)*)'/g, (전체, 안) => {
    const 줄 = 안.replace(/\\'/g, "'")
    if (!줄.includes(옛)) return 전체
    const 고침 = 줄.split(옛).join(새)
    센것++
    바뀐.push(`${제목}  ${줄.slice(0, 46)}  →  ${고침.slice(0, 46)}`)
    return `'${고침.replace(/'/g, "\\'")}'`
  })
  if (!센것) { 못찾음.push(`⛔ 「${제목}」 편에 「${옛}」 이 없다 — 이미 바뀌었거나 편을 잘못 짚었다`); continue }
  src = src.slice(0, 시작) + 새덩 + src.slice(끝)
}

for (const l of 바뀐.reverse()) console.log('   ' + l)
console.log(`\n합쳐서 ${바뀐.length}줄 · ${할일.length}편`)
if (못찾음.length) { console.error('\n' + 못찾음.join('\n') + '\n'); process.exit(1) }
if (!진짜) { console.log('👀 아직 «안» 바꿨다 — 맞으면 `--바꿈` 을 붙여 다시 돌린다.'); process.exit(0) }
writeFileSync(길, src)
console.log('✍️ 바꿨다. ⛔ `BASICS_VERSION` 을 올려야 이미 깔린 폰이 새 글자를 받는다.')
