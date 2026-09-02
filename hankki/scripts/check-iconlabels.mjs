// 🏷🏷 아이콘 이름표 게이트 — 「그림과 이름표가 같은 음식인가」를 눈으로 본 기록이 없으면 배포를 막는다
//
// 왜 만들었나 — **같은 사고를 두 번 냈다**:
//   · v9.31  「달걀·두부」에 넣은 `ni_25` 가 계란이 아니라 **식빵**이었다
//   · v9.38  `fe_124`(궁채나물) ↔ `fe_128`(소스) 가 **통째로 뒤바뀐 채** 나갔다
//            → 창업자 폰의 「고마다래소스」에 나물 그림이 떴다
//   두 번 다 원인이 같다 — *"컷을 «번호만 보고» 골랐고, 넣은 뒤 이름표를 붙여 «다시 안 봤다»."*
//   ⛔ 그때 **규칙으로 적어뒀는데 안 지켜졌다.** 그래서 규칙 19 대로 «장치»로 만든다.
//
// 막는 것 (= 사람이 눈으로 봐야만 통과한다)
//   ① 픽커에 **새로** 등록됐는데 판독 기록이 없는 컷
//   ② 판독은 했는데 그 뒤 **PNG 가 바뀐** 컷 (해시 대조 — 키만 두고 그림을 갈아끼우는 일이 실제로 있었다)
// 알려만 주는 것
//   · 「옛것」 = 2026-08-08 전부터 있던 미판독분. 개수만 센다.
//     ⛔ 시끄러운 게이트는 죽은 게이트다 — 178개를 한꺼번에 막으면 아무도 안 본다.
//
// 통과시키려면
//   앱 뿌리에서  python3 tools/icon-labels.py --new
//   → 판을 눈으로 보고  scripts/icon-checked.json  의 「판독」에 키·본날·해시를 적는다
//
// ✅ 규칙 12 — 「옛 값으로 진짜 걸리는지」 2026-08-08 에 돌려서 확인했다 (원상복구까지)
//   ⓐ 기록 없는 컷을 픽커에 슬쩍 등록  → ❌ 「판독 기록 없이 들어온 컷 1개」  rc=1
//   ⓑ **v9.38 사고를 그대로 재현** — `fe_124` ↔ `fe_128` 을 다시 맞바꿈
//      → ❌ 「판독 뒤 그림이 바뀐 컷 2개」 · 해시가 서로 뒤집힌 것까지 찍힘  rc=1
//   ⓒ 되돌리면 rc=0
//   📌 ⓑ 가 이 게이트의 존재 이유다 — **그때 이 검사가 있었으면 배포가 막혔다.**
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')
const PHOTO = path.join(root, 'src/assets/stickers/photo')
const RECORD = path.join(root, 'scripts/icon-checked.json')

// ── 픽커가 «부르는» 컷 (폴더에 있는 게 아니라) ──
const gStart = src.indexOf('export const FOOD_ICON_GROUPS = [')
if (gStart < 0) { console.error('[iconlabels] ❌ FOOD_ICON_GROUPS 를 못 읽었다 — 모양이 바뀌었나?'); process.exit(1) }
const gBody = src.slice(gStart, src.indexOf('\n]', gStart))
const keys = []
for (const m of gBody.matchAll(/items:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].split(',')) {
    const k = s.trim().replace(/^'|'$/g, '')
    if (/^(fe|fh|fy|fj|fi|fb)_/.test(k)) keys.push(k)
  }
}
const uniq = [...new Set(keys)]
// ⛔ 「못 읽었다」를 「없다」로 바꿔 말하지 않는다(규칙 17) — 파서가 깨지면 조용히 통과시키지 말고 죽는다
if (uniq.length < 100) { console.error(`[iconlabels] ❌ 등록 컷이 ${uniq.length}개뿐 — 파서가 깨졌다`); process.exit(1) }

if (!existsSync(RECORD)) { console.error(`[iconlabels] ❌ 판독 기록이 없다: scripts/icon-checked.json`); process.exit(1) }
const rec = JSON.parse(readFileSync(RECORD, 'utf8'))
const seen = rec['판독'] || {}
const old = new Set(rec['옛것'] || [])

const hash = (k) => createHash('sha1').update(readFileSync(path.join(PHOTO, `${k}.png`))).digest('hex').slice(0, 10)

let fail = 0

// ── ① 새로 들어왔는데 안 봤다 ──
const unseen = uniq.filter((k) => !seen[k] && !old.has(k))
if (unseen.length) {
  console.error(`[iconlabels] ❌ 판독 기록 없이 픽커에 들어온 컷 ${unseen.length}개`)
  console.error(`   ${unseen.join(', ')}`)
  console.error('   👉 앱 뿌리에서: python3 tools/icon-labels.py --new')
  console.error('      판을 «눈으로» 보고 scripts/icon-checked.json 「판독」에 키·본날·해시를 적는다')
  fail++
}

// ── ② 판독 뒤 그림이 바뀌었다 ──
const moved = []
for (const [k, v] of Object.entries(seen)) {
  if (!existsSync(path.join(PHOTO, `${k}.png`))) { moved.push(`${k} (그림이 없어졌다)`); continue }
  const now = hash(k)
  if (v['해시'] && v['해시'] !== now) moved.push(`${k} — 기록 ${v['해시']} ≠ 지금 ${now}`)
}
if (moved.length) {
  console.error(`[iconlabels] ❌ 판독 뒤 그림이 바뀐 컷 ${moved.length}개 — 옛 판독은 무효다`)
  for (const s of moved) console.error(`   ${s}`)
  console.error('   👉 다시 보고 「해시」를 갱신할 것 (PHOTO_RATIO 도 같이 — v8.90 교훈)')
  fail++
}

if (!fail) {
  const backlog = uniq.filter((k) => old.has(k) && !seen[k]).length
  console.log(`[iconlabels] ✓ 판독 ${Object.keys(seen).length}컷 · 그림 그대로` +
    (backlog ? ` (옛것 ${backlog}컷은 아직 미판독 — 배포는 안 막는다)` : ''))
}
process.exit(fail ? 1 : 0)
