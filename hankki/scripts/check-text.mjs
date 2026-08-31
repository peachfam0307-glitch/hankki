// 유저 «화면에 나가는 글»에 코드 부스러기가 새지 않았는지 검사한다.
//
// 왜 있나 (2026-08-02): 레시피 메모에 `\n\n` 이 **글자 그대로** 박혀 나갔다.
//   창업자가 화면에서 보고 *"/n/n 오타인듯"* 이라고 알려줘서 알았다.
//   ⭐ 그런데 더 나빴던 건 **그것 때문에 두부 수정이 조용히 안 먹었다는 것** —
//      문자열이 화면과 한 글자 달라 `replace` 가 못 찾았고, 실패를 아무도 몰랐다.
//
// ⭐ 훅(`.claude/hooks/subst-guard.sh`)이 1차로 막고, 여기가 2차다.
//    훅은 「내가 그렇게 편집하는 것」을 막고, 여기는 「어떤 경로로든 새어 들어온 결과」를 막는다.
//    한 겹만 두면 새 경로가 생겼을 때 그대로 나간다.
//
// ⛔ 시끄러운 게이트는 죽은 게이트다 — 「유저가 읽는 글자」만 본다(키·URL·아이콘 이름은 안 본다).
import { readFileSync } from 'node:fs'
import { basicRecipes } from '../src/data/basics.js'

// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)을 써서 맨 node 로는 import 가 안 된다.
//    그래서 «소스 글자»를 직접 읽는다 — 소스에 `\\n` 이 있으면 런타임엔 `\n` 이 글자로 남는다.
//    (같은 사고를 잡는 데는 이게 오히려 더 곧바르다)
const CUR_SRC = readFileSync(new URL('../src/data/curation.js', import.meta.url), 'utf8')

// 새면 안 되는 부스러기. 전부 «두 글자 이상» 이라 한글 문장에 우연히 안 걸린다.
const JUNK = [
  ['\\n', '줄바꿈이 글자로 샜다'],
  ['\\t', '탭이 글자로 샜다'],
  ['/n/n', '슬래시 n — 창업자가 화면에서 잡아준 그 모양'],
  ['\\u', '유니코드 이스케이프가 글자로 샜다'],
  ['undefined', '값이 비어 undefined 가 글자로 나갔다'],
  ['[object Object]', '객체가 글자로 나갔다'],
  ['NaN', '숫자 계산이 깨졌다'],
]

const bad = []
const look = (where, text) => {
  const s = String(text ?? '')
  if (!s) return
  for (const [j, why] of JUNK) if (s.includes(j)) bad.push({ where, j, why, s })
}

// 레시피 — 유저가 읽는 칸만
for (const r of basicRecipes) {
  look(`레시피 「${r.title}」 제목`, r.title)
  look(`레시피 「${r.title}」 메모`, r.memo)
  for (const [i, x] of (r.ingredients || []).entries()) look(`레시피 「${r.title}」 재료 ${i + 1}`, x)
  for (const [i, x] of (r.steps || []).entries()) look(`레시피 「${r.title}」 순서 ${i + 1}`, x)
}

// 주부의 장바구니 — 제품 이름과 «창업자가 쓴 카피»
// 소스에서 `name:`·`benefit:`·`tag:` 의 따옴표 안만 뽑는다(URL·키·아이콘 이름은 안 본다).
let curCount = 0
for (const m of CUR_SRC.matchAll(/\b(name|benefit|tag)\s*:\s*(['"])((?:\\.|(?!\2).)*)\2/g)) {
  const [, field, , raw] = m
  if (field === 'name') curCount++
  // 소스의 `\\n` 은 런타임에 `\n` 두 글자가 된다 → 소스 글자를 그대로 본다.
  for (const [j, why] of JUNK) {
    const needle = j.startsWith('\\') ? '\\' + j : j   // `\n` → 소스에선 `\\n`
    if (raw.includes(needle)) bad.push({ where: `장바구니 ${field}`, j, why, s: raw })
  }
}

if (bad.length) {
  console.error(`\n⛔ 유저 화면에 나가는 글에 코드 부스러기가 ${bad.length}군데 있다.\n`)
  for (const b of bad) {
    console.error(`   ${b.where}`)
    console.error(`     «${b.j}» — ${b.why}`)
    console.error(`     ${b.s.slice(0, 110)}`)
  }
  console.error(`\n👉 고치는 법: **파일을 먼저 읽어** 실제 글자를 확인하고`)
  console.error(`   python3 tools/subst.py <파일> --old '…' --new '…'  로 바꾼다.`)
  console.error(`   ⛔ 맨손 \`.replace()\` 는 못 찾아도 조용히 통과한다 — 그게 이 사고의 뿌리였다.\n`)
  process.exit(1)
}

console.log(`✅ 화면 글자 깨끗 — 레시피 ${basicRecipes.length}개 · 장바구니 ${curCount}개, 부스러기 0`)
