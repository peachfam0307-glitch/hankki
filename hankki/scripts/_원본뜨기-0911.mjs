// 📜 원본 레시피를 «글자로» 떠서 딱지 붙여 저장한다 (2026-09-11)
//
// 📮 창업자 = "원본이 있어야 비교를하니까 꼭 원본은 문자화시켜서 따로 원본딱지붙여서 저장해줘."
//    ＋ "앞으로는 창업자 레시피는 창. 내가 가져온레시피는 가.로 구분해서 적자."
//    ＋ "딱지를 붙여달라는거야. 원본레시피는 지키고(용량이 크진않잖아 글자만있으니까)"
//
// ⛔ 왜 필요한가 — 2026-09-11 에 「새우장이 누구 레시피냐」를 답하는 데 git 이력을 파야 했다.
//    앱 데이터에는 «어디서 왔는지»가 안 적혀 있어서다. 그 사이 창업자가
//    「내가 안 만든 레시피 15편」을 알게 됐다. 원본이 글자로 남아 있으면 그런 일이 없다.
//
// 🏷 딱지 셋
//    창 = 창업자가 쓴 것            (origin: '창업자')
//    가 = 창업자가 «가져온» 것       (sourceUrl/sourceName 이 있다 — 유튜브·인스타)
//    클 = ⛔클로드가 «지어낸» 것      (둘 다 없고 창업자 백업에도 없다)
//    ? = 표시가 없는데 창업자 백업에는 있다 → 「창」으로 봐야 하지만 확인 전이다
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 백업칸 = path.join(ROOT, 'docs/_내레시피-백업')

// 창업자 폰 백업의 제목을 모은다 — 「표시만 빠진 것」을 갈라내는 잣대
const 백업제목 = new Set()
for (const f of readdirSync(백업칸).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(path.join(백업칸, f), 'utf8'))
  const 목 = Array.isArray(d) ? d : Object.values(d).find((v) => Array.isArray(v)) || []
  for (const r of 목) if (r && r.title) 백업제목.add(String(r.title).replace(/\s/g, ''))
}
if (백업제목.size < 100) { console.error(`⛔ 백업 제목을 ${백업제목.size}개밖에 못 읽었다 — 파서가 깨졌다`); process.exit(1) }

// ⛔ 2026-09-11 실측으로 «확인된» 클로드 작성 편 — 커밋 메시지로 갈랐다
//    39752e5b 「10월 넉 주 추가 … 12편」 · 「가을 주간 레시피 13편」 · 「주간 레시피 1월 4주 9편(초안)」
const 클로드가쓴것 = new Set([
  '갈치조림', '갈치구이', '갈치국', '전찌개', '나물비빔밥',
  '고구마 그라탕', '고구마맛탕', '고구마크룽지',
  '대하소금구이', '새우장', '새우튀김',
  '고등어조림', '고등어구이', '고등어김치찜',
  '우엉조림', '어묵볶음',
])

const 딱지 = (r) => {
  if (클로드가쓴것.has(r.title)) return '클'
  if (r.sourceUrl || r.sourceName) return '가'
  if (r.origin === '창업자') return '창'
  return 백업제목.has(String(r.title).replace(/\s/g, '')) ? '창?' : '?'
}

const { allBasicRecipes } = await import(path.join(ROOT, 'src/data/basics.js'))

const 셈 = {}
const 줄 = ['# 📜 레시피 원본 — 딱지 붙인 전문 (2026-09-11)', '',
  '> 📮 창업자 = *"원본이 있어야 비교를하니까 꼭 원본은 문자화시켜서 따로 원본딱지붙여서 저장해줘."*',
  '',
  '## 🏷 딱지',
  '| 딱지 | 뜻 | 잣대 |',
  '|---|---|---|',
  "| **창** | 창업자가 쓴 것 | `origin: '창업자'` |",
  '| **가** | 창업자가 «가져온» 것 | `sourceUrl`·`sourceName` 이 있다(유튜브·인스타) |',
  '| **⛔클** | 클로드가 «지어낸» 것 | 2026-09-11 에 커밋 이력으로 확인한 16편 |',
  '| **창?** | 창업자 것으로 보이나 표시가 없다 | 창업자 폰 백업에 제목이 있다 |',
  '| **?** | 모른다 | 표시도 없고 백업에도 없다 |',
  '']

for (const r of allBasicRecipes) {
  const t = 딱지(r)
  셈[t] = (셈[t] || 0) + 1
  줄.push(`## [${t}] ${r.title}`)
  줄.push('')
  줄.push(`- id: \`${r.id}\` · 열리는 날: ${r.from || '(없음 — 바로 열림)'}`)
  줄.push(`- ${r.time || '?'}분 · ${r.servings || '?'}인분 · ${r.difficulty || '?'}` +
    (r.origin ? ` · origin: ${r.origin}` : '') +
    (r.sourceName ? ` · 출처: ${r.sourceName}` : '') +
    (r.sourceUrl ? ` · ${r.sourceUrl}` : '') +
    (r.review ? ` · review: ${r.review}` : ''))
  줄.push('')
  줄.push('**재료**')
  for (const x of r.ingredients || []) 줄.push(`- ${x}`)
  줄.push('')
  줄.push('**만드는 법**')
  ;(r.steps || []).forEach((x, i) => 줄.push(`${i + 1}. ${x}`))
  if (r.memo) {
    줄.push('')
    줄.push('**메모**')
    for (const w of String(r.memo).split('\n')) 줄.push(`> ${w}`)
  }
  줄.push('')
}

줄.splice(13, 0, '## 🔢 딱지별 편수', '',
  ...Object.entries(셈).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- **${k}** ${v}편`), '')

const 밖 = path.join(ROOT, 'docs/_원본/레시피-원본-딱지-2026-09-11.md')
mkdirSync(path.dirname(밖), { recursive: true })
writeFileSync(밖, 줄.join('\n'))

// 🔒 딱지가 하나라도 안 붙으면 죽는다
const 합 = Object.values(셈).reduce((a, b) => a + b, 0)
if (합 !== allBasicRecipes.length) { console.error(`⛔ ${합} ≠ ${allBasicRecipes.length}`); process.exit(1) }

console.log(`✅ ${밖}  (${Math.round(Buffer.byteLength(줄.join('\n')) / 1024)}KB · ${합}편)`)
for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1])) console.log(`   ${k}  ${v}편`)
