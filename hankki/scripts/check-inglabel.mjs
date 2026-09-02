// 🏷🏷 재료 아이콘 이름표에 «금지된 이름»이 없나 (2026-08-16 신설)
//
// 📮 창업자 2026-08-11 *"광고붙는 이름으로하자. 가루육수나 육수가루나 그게 그거라서"*
//    ⭐⭐ 이름이 미감이 아니라 «돈» 문제다 — 장바구니 연결(`picksForIngredients`)이
//       **낱말 «시작»**으로만 맞아서, 순서가 뒤집히면 그 편 광고가 통째로 0이 된다:
//         「해물가루육수」✅ ·「가루육수」✅   ／   「육수가루」⛔ ·「해물육수가루」⛔
//
// 🔒 `check-picks` ⑤ 가 **레시피 재료 줄**을 이미 본다. 그런데 **재료 아이콘 이름표는 아무도 안 봤다** —
//    이름표는 2026-08-12 에 들어왔고 그 규칙은 2026-08-11 에 정해졌다. 한 달도 안 돼 사각이 생긴 것.
//    ⭐ 이름표도 유저가 «읽는 글자»이고, 새 시트가 올 때마다 늘어난다. 그래서 같은 그물을 여기도 친다.
//
// ⛔⛔ 첫 판은 이게 아니었다 — **「아이콘 이름표 ↔ 레시피 재료 줄이 갈렸나」를 통째로 재려 했고
//    7건이 나왔는데 «7건 다 거짓»이었다**(양배추↔배추 · 멸치액젓↔멸치 · 콘옥수수↔옥수수 …).
//    📌 **시끄러운 게이트는 죽은 게이트다.** CLAUDE.md 그대로 — «두 번 밟은 것»만 못 박는다.
//    📌 그리고 실제로 「가루육수」는 고칠 게 아니었다 — 그 그림은 해물/야채 구분이 없는
//       «가루 육수 일반»이고, 레시피엔 「야채가루육수」도 따로 있다. 바꿨으면 틀린 이름이 됐다.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/data/ingIcons.js'), 'utf8')

const st = src.indexOf('export const ING_RULES = [')
const body = src.slice(st, src.indexOf('\n]', st))
const 이름 = []
for (const m of body.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) 이름.push({ n: m[1], key: m[2] })
if (이름.length < 100) {
  console.error('[inglabel] ❌ 이름표를 못 읽었다 — ING_RULES 모양이 바뀌었나?')
  process.exit(1)
}

// ⛔ 쓰면 안 되는 이름 — «왜» 안 되는지 같이 적는다
const 금지 = [
  ['육수가루', '「가루육수」로 — 장바구니 연결이 낱말 시작으로만 맞아 광고가 통째로 끊긴다 (창업자 2026-08-11)'],
  ['해물육수가루', '「해물가루육수」로 — 같은 이유'],
]

let fail = 0
const 걸린것 = []
for (const { n, key } of 이름)
  for (const [나쁜, 왜] of 금지)
    if (n.includes(나쁜)) 걸린것.push({ n, key, 왜 })

if (걸린것.length) {
  console.error(`[inglabel] ❌ 재료 이름표에 «금지된 이름» ${걸린것.length}건`)
  for (const g of 걸린것) console.error(`   「${g.n}」 (${g.key}) — ${g.왜}`)
  console.error('   👉 src/data/ingIcons.js 의 ING_RULES 에서 고친다.')
  fail++
} else console.log(`[inglabel] ✓ 재료 이름표 ${이름.length}개 — 금지된 이름 0`)

process.exit(fail ? 1 : 0)
