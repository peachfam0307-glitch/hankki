// 🛒 주부의 장바구니 — 「우리 레시피가 쓰는데 앱에 제품이 없는 재료」를 «세서» 뽑는다
//
// ⛔ 왜 만드나 — `docs/장바구니-창업자자료-2026-08-09.md` 3️⃣ 에
//    「다시 세는 법 = 재료 낱말을 allBasicRecipes 에 대고 세고, curation.js 에 그 제품이 있나 본다」
//    라고 «글로만» 적혀 있어서, 필요할 때마다 손으로 세게 된다. 손으로 세면 반드시 낡는다.
//
// ⭐ 규칙 30 — 앱과 «같은 모듈»(allBasicRecipes)에서 읽는다. 파일을 글자로 다시 파싱하지 않는다.
//
// 쓰는 법:
//   node scripts/_장바구니-빈칸-0817.mjs           // 빈칸 큰 순서
//   node scripts/_장바구니-빈칸-0817.mjs --있는것   // 이미 앱에 있는 것도 같이

import { 레시피들 } from './recipe.mjs'
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 데이터 = join(여기, '../src/data')

// ⛔ `curation.js` 는 Vite 전용 `import.meta.glob` 을 쓴다 → Node 가 그대로는 못 읽는다.
// ⭐ 그렇다고 정규식으로 파싱하면 또 틀린다(규칙 30 정신) → **glob 줄만 갈아끼우고 «진짜 JS 를 실행»한다.**
//    상대 import 는 절대경로로 바꿔 임시 폴더에서도 살게 한다.
const CURATION = await (async () => {
  const 원본 = readFileSync(join(데이터, 'curation.js'), 'utf8')
  const 고친것 = 원본
    .replace(/import\.meta\.glob\([^)]*\)/g, '{}')
    .replace(/from\s+'\.\/([^']+)'/g, (_, p) => `from '${pathToFileURL(join(데이터, p)).href}'`)
  if (고친것 === 원본) throw new Error('⛔ glob 줄을 못 찾았다 — curation.js 가 바뀌었나 확인할 것')
  const 임시 = join(mkdtempSync(join(tmpdir(), 'hankki-')), 'curation.mjs')
  writeFileSync(임시, 고친것)
  try {
    const m = await import(pathToFileURL(임시).href)
    return m.CURATION
  } finally { unlinkSync(임시) }
})()

// 🔒 규칙 12 — 「제대로 읽었나」를 스스로 확인한다. 못 읽고도 조용히 도는 게 제일 나쁘다.
{
  const 품목수 = CURATION.reduce((n, c) => n + (c.items || []).length, 0)
  if (품목수 < 30) throw new Error(`⛔ 큐레이션을 ${품목수}개밖에 못 읽었다 — 읽는 방식이 깨졌다`)
  console.log(`  (큐레이션 ${CURATION.length}갈래 · ${품목수}품목을 실제로 읽었다)`)
}

// 창업자가 준 93개 목록에서 «재료로 쓰이는» 것만 추렸다(간식·베이커리·완제품 제외).
// [재료 낱말(레시피에서 찾을 말), 제품 이름, 몰, 설명 있나]
const 후보 = [
  ['올리고당', '우리밀 올리고당', '자연드림', true],
  ['당면', '납작당면', '한살림', true],
  ['단무지', '꼬들단무지', '자연드림', true],
  ['새우젓', '참새우젓', '자연드림', true],
  ['또띠아', '담백한우리밀또띠아', '자연드림', true],
  ['도토리묵', '도토리묵', '한살림', true],
  ['옥수수', '옥수수병조림', '한살림', true],
  ['콩국물', '무농약콩으로만든 콩국물', '한살림', true],
  ['치즈', '알라 하바티치즈', '컬리', false],
  ['떡국떡', '칠갑농산 우리쌀 떡국떡', '컬리', false],
  ['연두부', '빠르게한끼 오리엔탈연두부', '컬리', false],
  ['닭가슴살', '청정원 그레인보우 닭가슴살', '컬리', false],
  ['난백', '요리란 난백', '컬리', false],
  ['베이컨', '베이컨리얼리즘 무설탕 삼겹 베이컨', '쿠팡', false],
  ['우유', '연세우유 소화가잘되는 우유', '쿠팡', false],
  ['요거트', '또요 또먹는 플레인 요거트', '쿠팡', false],
  ['목이버섯', '국내산 무농약인증 생목이버섯', '쿠팡', false],
  ['김치', '종가 석박지', '쿠팡', false],
  ['계란', '자연애찬 반숙이', '쿠팡', false],
  ['두부면', '농협식품 우리콩 두부면 넓은면', '쿠팡', false],
  ['메밀면', '세끼판다 메밀면 샐러드', '쿠팡', false],
  ['참치', '리오마레 / 동원 참치인 워터', '그 외', false],
  ['된장', '미소된장(네이버)', '그 외', false],
  ['버터', '마야항아리 기버터', '그 외', false],
  ['원두', '그라도스 콜롬비아 디카페인 원두', '쿠팡', false],
]

const 레시피 = 레시피들()

// ① 재료 낱말이 몇 «편»에 나오나 (한 편 안에서 여러 번 나와도 1)
const 편수 = (낱말) =>
  레시피.filter((r) => (r.ingredients || []).some((줄) => String(줄).includes(낱말))).length

// ② 그 재료를 이미 «앱 큐레이션»이 덮고 있나 (matches 로 연결됐나)
const 앱에있나 = (낱말) => {
  for (const cat of CURATION)
    for (const it of cat.items || [])
      if ((it.matches || []).some((m) => m.includes(낱말) || 낱말.includes(m))) return it.name
  return null
}

const 보여줄것있는것도 = process.argv.includes('--있는것')

const 결과 = 후보
  .map(([낱말, 제품, 몰, 설명]) => ({ 낱말, 제품, 몰, 설명, 편: 편수(낱말), 앱: 앱에있나(낱말) }))
  .sort((a, b) => b.편 - a.편)

console.log(`\n🛒 주부의 장바구니 — 빈칸 큰 순서 (기본 레시피 ${레시피.length}편 기준)\n`)
console.log('  편수  설명  몰        재료        제품')
console.log('  ' + '─'.repeat(72))
for (const r of 결과) {
  if (r.앱 && !보여줄것있는것도) continue
  const 편 = String(r.편).padStart(4)
  const 설명 = r.설명 ? ' ✅ ' : ' ⏳ '
  const 몰 = r.몰.padEnd(8)
  const 재료 = r.낱말.padEnd(10)
  const 꼬리 = r.앱 ? `   ⛔이미 앱에: ${r.앱}` : ''
  console.log(`  ${편}   ${설명} ${몰}  ${재료}  ${r.제품}${꼬리}`)
}

const 빈칸 = 결과.filter((r) => !r.앱)
console.log(`\n  📊 앱에 «없는» 재료 ${빈칸.length}개 · 그중 설명 대기 ${빈칸.filter((r) => !r.설명).length}개`)
if (!보여줄것있는것도) console.log('  (이미 앱에 있는 것도 보려면 --있는것)\n')
else console.log('')
