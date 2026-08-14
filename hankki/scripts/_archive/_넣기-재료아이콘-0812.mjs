// 🥕 재료 아이콘 171컷 → `src/data/ingIcons.js` 를 «만든다».
//   ⛔ 이름·비율을 손으로 적지 않는다(171 × 2 = 342칸 · 규칙 8).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')  // ⛔ import.meta.dirname 은 Node 21+ · CI 는 20
const 표 = JSON.parse(readFileSync(path.join(뿌리, 'docs/stickers/재료아이콘-창업자-2026-08-12/앱등록.json'), 'utf8'))
const 것 = Object.entries(표)
// ⭐ 이름이 긴 것부터 — 「모짜렐라치즈」가 「치즈」보다 먼저 걸려야 한다
const 줄 = [...것].sort((a, b) => b[1].name.length - a[1].name.length).map(([k, v]) => `  ['${v.name}', '${k}'],`)
const 비 = [...것].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `  ${k}: ${v.ratio},`)
const G = '${...}'.slice(0, 0) // (형식용 · 아래 템플릿에서 백틱을 안 쓴다)
const src = [
  `// 🥕🥕 냉장고·장보기 «재료» 아이콘 — 창업자 시트 11장(2026-08-12) 낱개 ${것.length}컷.`,
  '//',
  '// ✅✅ 창업자 확정 *"냉장고(장보기)에 넣자. **주부장바구니는 그림체가 달라 따로 뽑아야해.**"*',
  "//   ⛔ 큐레이션(주부의 장바구니)엔 쓰지 않는다 — 거긴 assets/curation/cu_* 제품 일러다.",
  '//',
  '// ⛔⛔ **「요리 제목」 규칙(ICON_RULES)에 얹지 않는다.** 2026-08-12 아침에 정확히 그 사고가 났다 —',
  '//   냉장고에 「애호박」을 담으면 「애호박새우젓볶음」 규칙에 걸려 **완성 접시 사진**이 붙었다.',
  '//   재료와 요리는 «다른 축»이라 표를 따로 둔다. guessIngredientIcon 이 이 표를 «먼저» 본다.',
  '//',
  '// ⛔ 이름·비율은 손으로 적지 않는다 — scripts/_넣기-재료아이콘-0812.mjs 가 앱등록.json 에서 낸다.',
  "const 그림 = import.meta.glob('../assets/stickers/ing/*.png', { eager: true, query: '?url', import: 'default' })",
  'export const ING_SRC = Object.fromEntries(',
  '  Object.entries(그림).map(([p, url]) => [키뽑기(p), url]),',
  ')',
  '// 경로에서 파일 이름만 — ⛔ 확장자를 떼는 방식을 바꾸면 키가 통째로 어긋난다',
  'function 키뽑기(p) {',
  "  const f = p.split('/').pop()",
  "  return f.slice(0, f.lastIndexOf('.'))",
  '}',
  '',
  '// [재료 이름, 아이콘 키] — ⭐긴 이름 먼저(「모짜렐라치즈」 > 「치즈」)',
  'export const ING_RULES = [',
  ...줄,
  ']',
  '',
  '// 가로÷세로 — 실제 PNG 에서 잰 값(⛔짐작 아님)',
  'export const ING_RATIO = {',
  ...비,
  '}',
  '',
  '// 재료 이름 → 아이콘 키. 못 찾으면 null(그때 옛 SVG 도형으로 간다).',
  '//   ⭐ 「돼지고기 앞다리살 300g」처럼 «수식어＋분량»이 붙어도 걸리게 «포함»으로 본다.',
  '//',
  '// ⛔⛔ **한 글자 이름은 «포함»으로 보면 안 된다** (CLAUDE.md 핀 — 게·굴·김으로 스파게티·바게트가 해산물이 된 그 함정).',
  '//   여기서도 그대로 터진다: 「김」이 «김치»에 · 「무」가 «단무지»에 · 「배」가 «배추»에 · 「감」이 «감자»에.',
  '//   ⭐ 긴 이름을 먼저 보니 「배추」·「감자」는 저절로 피해지지만, 목록에 «없는» 말(김치·단무지 아닌 것)엔 안 통한다.',
  '//   ✅ 그래서 한 글자는 **분량을 뗀 이름이 정확히 그것일 때만** 건다.',
  "const 분량떼기 = (s) => s.replace(/[0-9]+([.,/~-][0-9]+)?\\s*(g|kg|ml|l|개|장|알|쪽|대|줌|팩|봉|캔|컵|큰술|작은술|스푼|모|마리|통|단|포기|주먹)?/gi, '').trim()",
  "export function ingIconOf(name = '') {",
  "  const s = String(name).split(/\\s+/).join('')",
  '  const 알맹이 = 분량떼기(s)',
  '  for (const [이름, 키] of ING_RULES) {',
  '    if (이름.length === 1) { if (알맹이 === 이름) return 키; continue }   // ⛔ 한 글자는 «정확히 같을 때»만',
  '    if (s.includes(이름)) return 키',
  '  }',
  '  return null',
  '}',
  '',
].join('\n')
writeFileSync(path.join(뿌리, 'src/data/ingIcons.js'), src, 'utf8')
console.log(`✅ src/data/ingIcons.js — ${것.length}컷`)
