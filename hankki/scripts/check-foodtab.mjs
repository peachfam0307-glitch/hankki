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
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']+)',\s*items:\s*\[([^\]]*)\]/g)) {
  groups.push({ label: m[1], items: m[2].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean) })
}
if (groups.length < 10) { console.error('[foodtab] ❌ 그룹을 못 읽었다 — FOOD_ICON_GROUPS 모양이 바뀌었나?'); process.exit(1) }

// ── 이름표 읽기 (ICON_RULES 첫 키워드 + EXTRA_NAMES) ──
const names = {}
const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
const eStart = src.indexOf('EXTRA_NAMES = {')
if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]

const isPhoto = (k) => /^(fe|fh|fy|fj|fi|fb)_/.test(k)
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
const broken = [...home.keys()].filter((k) => isPhoto(k) && !existsSync(path.join(PHOTO, `${k}.png`)))
if (broken.length) { console.error(`[foodtab] ❌ 그림이 없는 컷 ${broken.length}개: ${broken.join(', ')}`); fail++ }
else console.log('[foodtab] ✓ 부르는 그림 전부 있다')

// ── ③ 이름표 ──
const noname = [...home.keys()].filter((k) => isPhoto(k) && !names[k])
if (noname.length) { console.error(`[foodtab] ❌ 이름표 없는 컷 ${noname.length}개: ${noname.join(', ')} — 픽커에서 라벨이 빈칸이 된다`); fail++ }
else console.log('[foodtab] ✓ 이름표 전부 있다')

// ── ④ 내려둔 것(정보) ──
const files = readdirSync(PHOTO).filter((f) => /^(fe|fh|fy|fj|fi|fb)_.*\.png$/.test(f)).map((f) => f.replace('.png', ''))
const shelved = files.filter((k) => !home.has(k))
console.log(`[foodtab] · 픽커에 실린 음식 ${files.length - shelved.length}컷 / 파일 ${files.length}장`)
console.log(`[foodtab] · 일부러 내려둔 것 ${shelved.length}컷 — 같은 요리를 두 번 그린 뒷세대. 파일은 보존(저장된 레시피 보호)`)

if (fail) { console.error('\n❌ 음식 탭 게이트 실패'); process.exit(1) }
console.log('✅ 음식 탭 통과 — 중복 0 · 깨진 참조 0 · 빈 이름표 0')
