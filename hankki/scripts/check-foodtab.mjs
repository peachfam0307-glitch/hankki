// 🍱 음식 탭 게이트 — 「한 컷은 한 집에만 산다」를 코드가 강제한다
//
// 왜 만들었나 (창업자 2026-08-01):
//   *"우리 꾸미기 음식탭에 중복도 많고 한식에 중식들어가있고 한식에 있는거 해산물에 있고
//     뭔가 중구난방이야. 확인 후 완벽 수정."*
//   → 손으로 정리하면 **다음에 또 어긋난다.** 규칙이 아니라 장치로 만든다(규칙 8·12와 같은 생각).
//
// 막는 것
//   ① 같은 키가 두 그룹에 (= 스크롤하면 똑같은 게 또 나온다)
//   ② 그룹이 부르는데 그림이 없다 (= 빈 칸)
//   ③ 이름표 없는 컷 (= 픽커에서 라벨이 빈칸으로 나온다)
// 알려만 주는 것
//   · PNG 는 있는데 픽커에 없는 것 = **일부러 내린 뒷세대**(파일은 보존 — 저장된 레시피 보호)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')
const PHOTO = path.join(root, 'src/assets/stickers/photo')

// ── 그룹 읽기 ──
const gStart = src.indexOf('export const FOOD_ICON_GROUPS = [')
const gBody = src.slice(gStart, src.indexOf('\n]', gStart))
const groups = []
// ⛔⛔ [2026-08-16] `label` 과 `items` 사이에 «다른 필드가 와도» 읽는다.
//   그날 `kind: 'ing'` 을 7개 갈래에 넣었더니 옛 정규식(label 바로 뒤에 items)이 그 일곱을 통째로 놓쳤다.
//   → 게이트는 **초록불인데** 보는 범위가 466컷·22갈래 → 411컷·15갈래로 줄었다(재료 갈래 55컷이 사라짐).
//   📌 규칙 18 ⓘ 그대로 — **「통과했나」가 아니라 「무엇을 보고 통과했나」**를 봐야 한다.
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']+)',[^{}]*?items:\s*\[([^\]]*)\]/g)) {
  groups.push({ label: m[1], items: m[2].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean) })
}
// ⭐ 상한을 «손으로 적지 않는다» — 적힌 `{ label:` 수를 세서 읽은 수와 대조한다.
//   ⛔ 옛 검사는 `< 10` 이라 15개만 읽어도 통과했다. **고정 숫자는 반드시 낡는다.**
const declared = (gBody.match(/\{\s*label:\s*'/g) || []).length
if (groups.length !== declared) {
  console.error(`[foodtab] ❌ 갈래를 다 못 읽었다 — 적힌 건 ${declared}개인데 읽은 건 ${groups.length}개.`)
  console.error('   FOOD_ICON_GROUPS 의 모양이 바뀌었다(필드 추가·줄바꿈 등). 위 정규식을 그 모양에 맞춰라.')
  process.exit(1)
}
if (groups.length < 10) { console.error('[foodtab] ❌ 그룹을 못 읽었다 — FOOD_ICON_GROUPS 모양이 바뀌었나?'); process.exit(1) }

// ── 이름표 읽기 (ICON_RULES 첫 키워드 + EXTRA_NAMES) ──
const names = {}
const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
const eStart = src.indexOf('EXTRA_NAMES = {')
if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]

// 🥕🥕 [2026-08-16] 재료 컷(`ig_`)도 «같이 본다» — 이게 없어서 3일 넘게 조용히 샜다.
//   ⛔ 2026-08-12 에 재료 171컷을 넣었는데 **픽커에 한 컷도 안 실렸고**, 이 검사는
//      `fe|fh|fy|fj|fi|fb` 만 봐서 **있든 없든 아무 말도 안 했다.**
//   📌 검사가 «안 보는 것»은 언제든 조용히 비어 있을 수 있다.
const ING = path.join(root, 'src/assets/stickers/ing')
const ingSrc = readFileSync(path.join(root, 'src/data/ingIcons.js'), 'utf8')
{
  const st = ingSrc.indexOf('export const ING_RULES = [')
  const body = ingSrc.slice(st, ingSrc.indexOf('\n]', st))
  // ⛔ ING_RULES 는 [이름, 키] 순서다 (ICON_RULES 와 반대)
  for (const m of body.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
}
const isIng = (k) => /^ig_/.test(k)
const isPhoto = (k) => /^(fe|fh|fy|fj|fi|fb)_/.test(k)
const 그림있나 = (k) => (isIng(k) ? existsSync(path.join(ING, `${k}.png`)) : existsSync(path.join(PHOTO, `${k}.png`)))
let fail = 0

// ── ① 한 컷 = 한 집 ──
const home = new Map()
for (const g of groups) for (const k of g.items) {
  if (!home.has(k)) home.set(k, [])
  home.get(k).push(g.label)
}
const dup = [...home].filter(([, gs]) => gs.length > 1)
if (dup.length) {
  console.error(`[foodtab] ❌ 같은 컷이 여러 그룹에 = ${dup.length}건 — 스크롤하면 똑같은 게 또 나온다`)
  for (const [k, gs] of dup) console.error(`   ${k} (${names[k] || '?'}) → ${gs.join(' · ')}`)
  fail++
} else console.log(`[foodtab] ✓ 한 컷 = 한 집 (${home.size}컷 · 그룹 ${groups.length}개)`)

// ── ② 부르는데 그림이 없다 ──
const broken = [...home.keys()].filter((k) => (isPhoto(k) || isIng(k)) && !그림있나(k))
if (broken.length) { console.error(`[foodtab] ❌ 그림이 없는 컷 ${broken.length}개: ${broken.join(', ')}`); fail++ }
else console.log('[foodtab] ✓ 부르는 그림 전부 있다')

// ── ③ 이름표 ──
const noname = [...home.keys()].filter((k) => (isPhoto(k) || isIng(k)) && !names[k])
if (noname.length) { console.error(`[foodtab] ❌ 이름표 없는 컷 ${noname.length}개: ${noname.join(', ')} — 픽커에서 라벨이 빈칸이 된다`); fail++ }
else console.log('[foodtab] ✓ 이름표 전부 있다')

// ── ④ 내려둔 것(정보) ──
const files = readdirSync(PHOTO).filter((f) => /^(fe|fh|fy|fj|fi|fb)_.*\.png$/.test(f)).map((f) => f.replace('.png', ''))
const shelved = files.filter((k) => !home.has(k))
console.log(`[foodtab] · 픽커에 실린 음식 ${files.length - shelved.length}컷 / 파일 ${files.length}장`)
console.log(`[foodtab] · 일부러 내려둔 것 ${shelved.length}컷 — 같은 요리를 두 번 그린 뒷세대. 파일은 보존(저장된 레시피 보호)`)

// ── ⑤ 🥕 재료 컷이 «픽커에 실렸나» (2026-08-16 신설 — 이번 사고를 직접 막는 검사) ──
//   ⛔ 그림을 넣고 「이름 치면 붙기」만 잇고 **픽커 목록에 안 실으면**, 유저는 손으로 못 고른다.
//      2026-08-12 에 정확히 그랬고 **아무 검사도 그걸 안 봤다**(3일 넘게 조용했다).
//   ⭐ 「이름 치면 붙나」와 「골라서 바꿀 수 있나」는 «다른 것»이다. 둘 다 봐야 한다.
{
  const ingFiles = readdirSync(ING).filter((f) => f.endsWith('.png')).map((f) => f.replace('.png', ''))
  const 안실림 = ingFiles.filter((k) => !home.has(k))
  if (안실림.length) {
    console.error(`[foodtab] ❌ 재료 그림인데 「아이콘 선택」 목록에 없는 컷 ${안실림.length}개`)
    console.error(`   ${안실림.slice(0, 12).map((k) => `${names[k] || '?'}(${k})`).join(', ')}${안실림.length > 12 ? ' …' : ''}`)
    console.error('   👉 FOOD_ICON_GROUPS 의 재료 갈래(kind: \'ing\')에 넣어라 — 안 넣으면 유저가 손으로 못 고른다.')
    fail++
  } else console.log(`[foodtab] ✓ 재료 ${ingFiles.length}컷 전부 픽커에 실렸다`)
}

if (fail) { console.error('\n❌ 음식 탭 게이트 실패'); process.exit(1) }
console.log('✅ 음식 탭 통과 — 중복 0 · 깨진 참조 0 · 빈 이름표 0')

// ── ⑦ ⛔ 「구체어 먼저」 — 긴 이름이 짧은 이름에 «먼저» 먹히는 것 (2026-08-15) ──
//    📮 창업자 *"탕수육1줄은 고치자"*
//    ⛔⛔ **같은 자리를 두 번 밟았다.** 「탕수육」은 ⑴`fried`(튀김 도형)에 먹혔고(고침)
//       ⑵ 바로 위 **「수육」**에 먹혀 **수육(보쌈 고기) 그림**이 떴다. ①을 고치며 «아래»만 보고
//       **바로 위는 안 봤다.** 규칙(*"구체어 먼저"*)은 파일에 이미 적혀 있었는데도 그랬다.
//    ⭐ 그래서 규칙이 아니라 **장치로 막는다**(규칙 19).
//    ⚠️ 전수로 막지 «않는다» — 지금 저장소에 이런 자리가 65곳이고, 대부분 일부러 그런 것이거나
//       해가 없다. **65곳에서 실패하는 게이트는 아무도 안 보는 죽은 게이트다.**
//       📌 CLAUDE.md 그대로 = **«두 번 밟은 것»만 사전에 넣는다.**
const 못박기 = [
  ['탕수육', 'fe_91'],      // ⛔ 「수육」에 먹혀 보쌈 고기가 떴다
  ['찹쌀탕수육', 'fe_47'],   // ⛔ 꿔바로우가 맞다 — 「탕수육」보다 구체적이라 위에 있어야 한다
  ['수육', 'fe_125'],       // ✅ 이건 그대로여야 한다(고치다 반대로 깨뜨리지 않게)
  // 🍲 2026-08-18 — 창업자 *"누룽지 삼계탕에 이모지같은게 들어있어"* 를 파다 나왔다.
  //    「누룽지삼계탕」이 «누룽지»(fe_114 오징어누룽지)에 먹혀 엉뚱한 그림이 붙고 있었다.
  //    📌 「탕수육 ↔ 수육」과 **같은 모양**이라 사전에 넣는다(두 번 밟은 자리다).
  ['누룽지삼계탕', 'fh_k06'],
  ['누룽지백숙', 'fh_k06'],
  ['누룽지탕', 'fe_114'],    // ✅ 이건 그대로여야 한다 — 누룽지 규칙을 통째로 밀어내지 않게
]
{
  const body = src.slice(src.indexOf('const ICON_RULES = ['), src.indexOf('export function guessFoodIcon'))
  const rules = []
  for (const m of body.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([\w]+)'\s*\]/g))
    rules.push([[...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]), m[2]])
  const 붙는것 = (n) => { for (const [ks, k] of rules) if (ks.some((x) => n.includes(x))) return k; return 'default' }
  const 틀린것 = 못박기.filter(([이름, 키]) => 붙는것(이름) !== 키)
  if (틀린것.length) {
    console.error('\n⛔ 「구체어 먼저」가 깨졌다 — 짧은 이름이 긴 이름을 먼저 먹는다.')
    for (const [이름, 키] of 틀린것) console.error(`     「${이름}」 → ${붙는것(이름)} (맞는 것 = ${키})`)
    console.error('   👉 «더 구체적인» 규칙을 그 위로 올릴 것 (ICON_RULES 는 위에서부터 첫 매칭이 이긴다).')
    console.error('   📌 2026-08-15: 「탕수육」이 「수육」에 먹혀 보쌈 고기 그림이 떴다. 같은 자리를 두 번 밟았다.\n')
    process.exit(1)
  }
  console.log(`✅ 구체어 먼저 — 못 박은 ${못박기.length}자리 정상`)
}
