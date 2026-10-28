// 🥄🥄 **창업자 저장 레시피 A 15편을 `basics.js` 에 넣는다** (2026-09-11)
//
// 📮 창업자 = *"어제 안나간 15편 레시피 한번에 올리자. 아이콘 달고"* → *"일단 15편. 픽커. 장바구니 배포부터 가자"*
// 📄 원본 = `hold/창업자레시피-0910` 의 `docs/_검수대기/창업자레시피-0910/A-5판.json`
//    ⛔⛔ 1판에서 «A-다듬음.json»(옛 판)을 썼다 — 창업자 판정이 통째로 안 밀린 판이었다
//       (참치액·알룰로스·식용유가 그대로였다). **판을 눈으로 열어서** 잡았다(규칙 21·12).
//       📌 같은 폴더에 판이 여럿이면 «이름»으로 짐작하지 말고 «내용»을 열어 본다.
//    ⭐ 그 판은 창업자 검수판을 거쳐 판정이 세 번 반영됐다 —
//       아우노슈가 ×1.5 · 알룰로스 ×1.5 · 「우리 재료 없으면 …」 안내.
//
// 🖼 아이콘 = 오늘 자른 새 컷 8개(n3001~n3008) ＋ 이미 앱에 있던 7개
//    ⛔ 짝은 «내가 짐작하지 않는다» — 창업자가 시트마다 이름을 적어 줬고 그대로 옮긴다.
//
// ⛔ 넣기만 하고 **배포하지 않는다** — 검수판을 만들어 창업자 ㄱㄱ 를 받은 뒤다(규칙 13).
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = '/home/user/hankki/hankki'
const 원본 = JSON.parse(execSync('git show hold/창업자레시피-0910:hankki/docs/_검수대기/창업자레시피-0910/A-5판.json', { cwd: '/home/user/hankki', maxBuffer: 1 << 24 }).toString())

// 🖼 편 ↔ 아이콘 (창업자 시트 이름표 그대로)
const 아이콘 = {
  'basic-own-001': 'n3001', // 가지 소고기 덮밥      — 창업자 컷 2026-09-11
  'basic-own-002': 'n2801', // 닭가슴살 피자 브리또  — 이미 앱에 있던 컷
  'basic-own-003': 'n2704', // 보쌈 무김치           — 이미 앱에 있던 컷
  'basic-own-004': 'n3002', // 닭가슴살 오이 샐러드  — 창업자 컷 2026-09-11
  'basic-own-005': 'gr_231', // 파기름 간장국수      — ⚠️창업자 = "간장국수는 그댜로가자(국수가 뽑기가 빡쎄)"
  'basic-own-006': 'n3007', // 우삼겹 두부조림       — 창업자 컷 2026-09-11 (2쌍 중 «아래 판» 확정)
  'basic-own-007': 'n3003', // 대파 소스 목살 덮밥   — 창업자 컷 2026-09-11
  'basic-own-008': 'n3004', // 닭목살 불고기         — 창업자 컷 2026-09-11
  'basic-own-009': 'n3005', // 달래 대패삼겹 덮밥    — 창업자 컷 2026-09-11
  'basic-own-010': 'fe_156', // 새송이버섯 들깨무침  — 이미 앱에 있던 컷
  'basic-own-011': 'n3008', // 들깨 궁채나물         — 창업자 컷 2026-09-11 (2쌍 중 «아래 판» 확정)
  'basic-own-012': 'gr_448', // 미나리 오징어무침    — 이미 앱에 있던 컷
  'basic-own-013': 'gr_101', // 간장 목살스테이크    — 이미 앱에 있던 컷
  'basic-own-014': 'n3006', // 육회 깻잎무침         — 창업자 컷 2026-09-11
  'basic-own-015': 'gr_007', // 구움찰떡             — 이미 앱에 있던 컷
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const 줄 = []
for (const r of 원본) {
  const ic = 아이콘[r.id]
  if (!ic) throw new Error(`아이콘이 없다: ${r.id} ${r.title}`)
  줄.push(`  {
    ...base,
    id: ${q(r.id)},
    title: ${q(r.title)},
    origin: '창업자',
    icon: ${q(ic)},
    category: ${q(r.category)}, folder: ${q(r.folder)}, tags: [${(r.tags || []).map(q).join(', ')}],
    time: ${r.time}, servings: ${r.servings}, difficulty: ${q(r.difficulty)},
    ingredients: [
${(r.ingredients || []).map((x) => `      ${q(x)},`).join('\n')}
    ],
    steps: [
${(r.steps || []).map((x) => `      ${q(x)},`).join('\n')}
    ],
  },`)
}

const 머리 = `  // 🥄🥄 [2026-09-11] **창업자가 «직접 저장해 둔» 레시피 15편** — 창업자 폰에서 옮겨 왔다.
  //   📮 창업자 = "어제 안나간 15편 레시피 한번에 올리자. 아이콘 달고"
  //   ⭐ 창업자 판정을 규칙으로 세워 15편 전체에 밀었다(2026-09-10):
  //      참치액·액젓→초피액젓 / 설탕·알룰로스·흑설탕→아우노슈가(×1.5) / 물엿→올리고당 /
  //      국간장→백간장 / 식용유·현미유→올리브유 / 청피망→파프리카 / 라오간마·노두유 뺌
  //   ⛔ 분량은 창업자가 준 것만 바꿨다 — 안 준 줄은 원래 분량 그대로다.
  //   🖼 아이콘 8개는 오늘 창업자가 뽑아 준 새 컷(n3001~n3008), 7개는 이미 앱에 있던 컷이다.
  //   ⛔ \`from\` 을 «안» 붙였다 = **바로 열린다**(게이트가 \`!r.from || r.from <= today\`).
  //      창업자가 "지금 올리자"라고 했고, 검수판 ㄱㄱ 를 받은 뒤에 배포한다.`

const p = `${ROOT}/src/data/basics.js`
const s = readFileSync(p, 'utf8')
const 끝 = s.lastIndexOf('\n]')
if (끝 < 0) throw new Error('RAW_BASICS 끝을 못 찾았다')
writeFileSync(p, s.slice(0, 끝) + '\n' + 머리 + '\n' + 줄.join('\n') + s.slice(끝))
console.log(`✅ ${원본.length}편을 basics.js 에 넣었다`)
원본.forEach((r) => console.log(`   · ${r.title} → ${아이콘[r.id]}`))
