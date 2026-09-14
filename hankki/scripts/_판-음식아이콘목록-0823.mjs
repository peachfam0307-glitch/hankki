// 🍱🍱 음식 아이콘 «종류별» 전체 목록 — 창업자 2026-08-23
//   📮 *"우리 음식아이콘 종류별로 길게 정리해줘(앱에들어간것)"*
//
// ⭐⭐ 심장 = **「앱에 들어간 것」만 센다.**
//   파일이 있어도 «픽커에 안 실렸으면» 유저는 못 고른다 → 그건 「앱에 들어간 것」이 아니다.
//   그래서 파일 목록이 아니라 `FOOD_ICON_GROUPS`(픽커가 그리는 바로 그 배열)를 읽는다.
//   ⛔ 손으로 세지 말 것(규칙 17) — 개수는 반드시 낡는다.
//
// ⛔ 파서는 `check-foodtab.mjs` 의 것을 그대로 쓴다(2026-08-16 에 `kind:` 가 끼어 갈래 7개를
//    통째로 놓쳤던 그 함정이 이미 고쳐져 있는 판이다). 새로 짜면 그 함정을 또 밟는다.
//
// 쓰는 법
//   node scripts/_판-음식아이콘목록-0823.mjs              글로 뽑는다(갈래별 이름 전부)
//   node scripts/_판-음식아이콘목록-0823.mjs --json <경로>  판 만들 재료(JSON)
//
// 🏷 이름표는 지어내지 않는다 — `ICON_RULES` 의 «첫 낱말»이 곧 앱이 쓰는 이름이다
//    (`FoodIcon.jsx` 가 `FOOD_NAMES` 를 그렇게 만든다). 재료는 `ING_RULES`.
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')
const PHOTO = path.join(root, 'src/assets/stickers/photo')
const ING = path.join(root, 'src/assets/stickers/ing')

// ── 갈래 읽기 (check-foodtab.mjs 와 같은 정규식) ──
const gStart = src.indexOf('export const FOOD_ICON_GROUPS = [')
const gBody = src.slice(gStart, src.indexOf('\n]', gStart))
const groups = []
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']+)',([^{}]*?)items:\s*\[([^\]]*)\]/g)) {
  const mid = m[2]
  groups.push({
    label: m[1],
    kind: /kind:\s*'([^']+)'/.exec(mid)?.[1] || '',
    items: m[3].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean),
  })
}
// ⭐ 상한을 손으로 적지 않는다 — 적힌 수와 읽은 수를 대조한다
const declared = (gBody.match(/\{\s*label:\s*'/g) || []).length
if (groups.length !== declared) {
  console.error(`❌ 갈래를 다 못 읽었다 — 적힌 건 ${declared}개인데 읽은 건 ${groups.length}개.`)
  process.exit(1)
}

// ── 이름표 읽기 ──
const names = {}
const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
const eStart = src.indexOf('EXTRA_NAMES = {')
if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]
{
  const ingSrc = readFileSync(path.join(root, 'src/data/ingIcons.js'), 'utf8')
  const st = ingSrc.indexOf('export const ING_RULES = [')
  const body = ingSrc.slice(st, ingSrc.indexOf('\n]', st))
  // ⛔ ING_RULES 는 [이름, 키] 순서다 (ICON_RULES 와 반대)
  for (const m of body.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) if (!names[m[2]]) names[m[2]] = m[1]
}

const isIng = (k) => /^ig_/.test(k)
const isPhoto = (k) => /^(fe|fh|fy|fj|fi|fb)_/.test(k)
const 파일 = (k) => (isIng(k) ? path.join(ING, `${k}.png`) : path.join(PHOTO, `${k}.png`))

// ── 갈래를 성격으로 묶는다 ──
//   ⛔ 라벨 «글자»로 가르지 않는다(2026-07-30 교훈 — 표시용 이름은 분류 기준이 아니다).
//      `kind: 'ing'` 은 코드에 적힌 값이고, 나머지는 «컷이 사진이냐 도형이냐»로 가른다.
const 묶음 = (g) => {
  if (g.kind === 'ing') return '재료'
  if (g.items.every((k) => !isPhoto(k))) return '도형'
  return '요리'
}

const out = groups.map((g) => ({
  label: g.label,
  kind: g.kind,
  band: 묶음(g),
  items: g.items.map((k) => ({ key: k, name: names[k] || '', ing: isIng(k), photo: isPhoto(k), 있나: existsSync(파일(k)) })),
}))

const jsonAt = process.argv.indexOf('--json')
if (jsonAt > 0 && process.argv[jsonAt + 1]) {
  writeFileSync(process.argv[jsonAt + 1], JSON.stringify({ groups: out }, null, 0))
  console.log(`✅ ${process.argv[jsonAt + 1]}`)
}

// ── 글로 뽑기 ──
const 밴드순 = ['요리', '재료', '도형']
let 총 = 0
for (const band of 밴드순) {
  const gs = out.filter((g) => g.band === band)
  if (!gs.length) continue
  const n = gs.reduce((a, g) => a + g.items.length, 0)
  총 += n
  console.log(`\n━━━━ ${band} — ${gs.length}갈래 · ${n}컷 ━━━━`)
  for (const g of gs) {
    console.log(`\n【${g.label}】 ${g.items.length}컷`)
    console.log('  ' + g.items.map((it) => it.name || `?${it.key}`).join(' · '))
    const 빈 = g.items.filter((it) => !it.name)
    if (빈.length) console.log(`  ⚠️ 이름표 없음 ${빈.length}개 = ${빈.map((i) => i.key).join(', ')}`)
    const 없 = g.items.filter((it) => !it.있나)
    if (없.length) console.log(`  ⛔ 그림 없음 ${없.length}개 = ${없.map((i) => i.key).join(', ')}`)
  }
}
console.log(`\n합계 = ${총}컷 · ${out.length}갈래`)
