// 📌 최신 지도 — «옛 문서·옛 파일을 보고 판단하는 사고»를 구조로 막는다.
//
// 왜 만들었나 (창업자 2026-07-31):
//   *"최근 건 왜 먼저 안보고 계속 옛날꺼보는거야 뭐든 일하기전에 최근 문서보기로 한거아니었어?"*
//   *"이것도 시스템 좀 만들어봐. 규칙만 만들면 뭐해 안지키는데."*
//   *"모든 걸 다 그렇게 만들어줘. 어떤 문서든 관련된 최신문서 미리 읽고 시작하도록"*
//
// 그날 실제로 난 사고 두 개 (둘 다 뿌리가 같다)
//   ① 스토어 스크린샷 — 저장소엔 7/24 PNG가 있는데 스토어엔 이미 새 ④가 올라가 있었다.
//      그런데 **폴더 맨 위에 옛 8장이, 하위 `renders-v3/`에 새 8장이 같은 이름으로** 있었다.
//   ② 문구를 되살릴 때 옛 스크립트(`store_new2.mjs`)를 집어서 폐기한 브랜드명을 도로 넣었다.
//   📌 둘 다 «내가 조심하면 될 일»이 아니라 **폴더가 그렇게 생겨서 난 일**이다.
//
// 그래서 이 파일이 하는 일 = **최신이 뭔지 코드가 안다.**
//   - 파일명에 날짜(YYYY-MM-DD)가 있는 문서는 **같은 주제끼리 묶어 최신 하나**를 고른다.
//     → 손으로 관리하는 목록이 아니라서 **낡지 않는다.** 새 문서를 저장하면 자동으로 최신이 된다.
//   - 날짜 없는 문서(`CLAUDE.md`·`캐릭터-설정집.md` 등)는 «상시 문서» — 세대가 없으니 늘 현행.
//   - 자동으로 못 고르는 것(어느 게 확정본인지 사람만 아는 것)만 `docs/최신-지도.md`에 **핀**으로 박는다.
//
// 쓰기
//   node scripts/latest-map.mjs            주제별 최신 문서 전부 출력
//   node scripts/latest-map.mjs --brief    세션 시작 훅용(짧게)
//   node scripts/latest-map.mjs --for "…"  그 말에 걸리는 주제의 최신 문서만 (프롬프트 훅용)
//   node scripts/latest-map.mjs --check    게이트(`npm run smoke`) — 핀이 낡았거나 옛 세대가 되살아나면 실패
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// ⚠️ 뿌리는 «지금 폴더»가 아니라 **저장소 맨 위**다.
//    앱은 `hankki/` 안에 있고 `android/`·`.github/` 는 그 바깥에 있다 —
//    cwd 기준으로 짰다가 이 게이트가 첫 실행에 그 둘을 «없다»고 잡았다(맞게 잡은 거다).
const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/docs')) ? join(ROOT, 'hankki') : ROOT
const MAP = join(APP, 'docs/최신-지도.md')
// 지도에 적는 경로는 «앱 폴더 기준»(docs/…·design/…)으로 쓰되, 저장소 맨 위 파일(android/…·.github/…)도 찾아준다.
const has = (p) => existsSync(join(APP, p)) || existsSync(join(ROOT, p))
const DATE = /(\d{4}-\d{2}-\d{2})/

// ── 주제 이름이 파일명마다 조금씩 달라서, 같은 뜻은 한 이름으로 모은다.
//    (핀 파일에서 키워드를 더 붙일 수 있다)
const ALIAS = {
  전체복기: '작업복기', 복기: '작업복기',
  할일: '할일', 창업자: '할일',
  저작권상표: '상표', 로고: '상표',
  곰펭: '캐릭터', 복슬곰: '캐릭터', 펭펭: '캐릭터',
  꾸미기팩: '꾸미기', 다꾸: '꾸미기',
  출시전: '출시',
}

// ── 문서 훑기 ─────────────────────────────────────────────────
// 주제 = 파일명 첫 토큰(`상표-출원완료-2026-07-27.md` → `상표`). 거칠지만 «옛 세대»를 잡기엔 충분하다.
// ⚠️ `_archive`·`_대기`는 이미 치워둔 곳이라 세대 비교에서 뺀다.
export function scanDocs(dir = join(APP, 'docs'), out = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith('_') || f.name === 'demo') continue
    const p = join(dir, f.name)
    if (f.isDirectory()) { scanDocs(p, out); continue }
    if (!f.name.endsWith('.md')) continue
    const d = f.name.match(DATE)
    const head = f.name.replace(/\.md$/, '').split('-')[0]
    out.push({ path: relative(APP, p), topic: ALIAS[head] || head, date: d ? d[1] : null })
  }
  return out
}

// ── 핀 읽기 ───────────────────────────────────────────────────
// `## 주제` 아래 `- 키워드:` `- 현행:` `- 구판:` `- 저장소밖:` 줄만 본다.
export function readPins() {
  if (!existsSync(MAP)) return []
  const pins = []
  let cur = null
  for (const raw of readFileSync(MAP, 'utf8').split('\n')) {
    const h = raw.match(/^##\s+(.+?)\s*$/)
    if (h) { cur = { name: h[1], words: [], now: [], old: [], outside: [] }; pins.push(cur); continue }
    if (!cur) continue
    const m = raw.match(/^\s*-\s*(키워드|현행|구판|저장소밖)\s*:\s*(.+?)\s*$/)
    if (!m) continue
    const [, kind, val] = m
    if (kind === '키워드') cur.words.push(...val.split(/[,·]/).map((s) => s.trim()).filter(Boolean))
    else if (kind === '현행') cur.now.push(val)
    else if (kind === '구판') cur.old.push(val)
    else cur.outside.push(val)
  }
  return pins
}

// ── 주제별 최신 ───────────────────────────────────────────────
// 날짜 있는 문서만 세대가 있다. 같은 주제면 **가장 늦은 날짜 하나만 현행**, 나머지는 옛 것.
export function byTopic() {
  const t = new Map()
  for (const d of scanDocs()) {
    if (!d.date) continue
    if (!t.has(d.topic)) t.set(d.topic, [])
    t.get(d.topic).push(d)
  }
  for (const [, v] of t) v.sort((a, b) => b.date.localeCompare(a.date))
  return t
}

// 이 문서보다 **더 새 문서가 같은 주제에 있으면** 그걸 돌려준다(없으면 null).
export function newerThan(relPath) {
  const me = scanDocs().find((d) => d.path === relPath)
  if (!me || !me.date) return null
  const group = byTopic().get(me.topic) || []
  const top = group[0]
  return top && top.path !== relPath && top.date > me.date ? top : null
}

// 말에서 주제 뽑기 — 핀 키워드 + 주제 이름이 그대로 들어있는지만 본다(가볍게).
export function topicsIn(text) {
  const hit = new Set()
  const pins = readPins()
  for (const p of pins) for (const w of [p.name, ...p.words]) if (w.length > 1 && text.includes(w)) hit.add(p.name)
  for (const [k] of byTopic()) if (k.length > 1 && text.includes(k)) hit.add(k)
  return [...hit]
}

// ── 같은 이름이 두 곳에 있는가 (=옛 세대가 되살아났다) ─────────
// ⭐ 이게 스토어 스샷 사고의 «진짜» 원인이다. `01-히어로.png`가 맨 위에도, `renders-v3/`에도 있었다.
//    `_구판/` 안에 있는 건 격리된 것이라 괜찮다.
function dupes(base) {
  const seen = new Map()
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name === '_구판' || f.name.startsWith('.')) continue
      const p = join(dir, f.name)
      if (f.isDirectory()) { walk(p); continue }
      if (!/\.(png|jpg|mjs|js)$/.test(f.name)) continue
      if (!seen.has(f.name)) seen.set(f.name, [])
      seen.get(f.name).push(relative(APP, p))
    }
  }
  if (existsSync(base)) walk(base)
  return [...seen].filter(([, v]) => v.length > 1 && new Set(v.map(dirname)).size > 1)
}

// ── 출력 ──────────────────────────────────────────────────────
// ⚠️ 훅에서 `import` 로 불러다 쓰기 때문에, **직접 실행했을 때만** 출력한다.
const MAIN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
const arg = MAIN ? (process.argv[2] || '') : ''
const pins = readPins()

if (arg === '--for') {
  const text = process.argv.slice(3).join(' ')
  const hits = topicsIn(text)
  if (hits.length) {
    const lines = []
    for (const h of hits.slice(0, 4)) {
      const pin = pins.find((p) => p.name === h)
      if (pin) { pin.now.forEach((n) => lines.push(`   · ${n}${has(n) ? '' : '  ⛔없는 파일'}`)); pin.outside.forEach((o) => lines.push(`   ⚠️ 저장소 밖: ${o}`)) }
      const g = byTopic().get(h)
      if (g?.length) lines.push(`   · ${g[0].path}${g.length > 1 ? `   (같은 주제 옛 문서 ${g.length - 1}개 — 그건 보지 말 것)` : ''}`)
    }
    if (lines.length) {
      console.log('📌 이 주제의 **최신 문서**다. 일 시작하기 전에 먼저 읽어라 (옛 문서로 판단하는 게 반복된 사고다):')
      console.log([...new Set(lines)].join('\n'))
    }
  }
  process.exit(0)
}

if (arg === '--brief') {
  const t = byTopic()
  const rows = [...t].filter(([, v]) => v.length).sort((a, b) => b[1][0].date.localeCompare(a[1][0].date)).slice(0, 12)
  console.log('📌 주제별 «최신» 문서 (옛 문서 말고 이걸 먼저 읽는다):')
  for (const [k, v] of rows) console.log(`   ${k} → ${v[0].path}${v.length > 1 ? ` (옛 ${v.length - 1})` : ''}`)
  for (const p of pins) if (p.outside.length) p.outside.forEach((o) => console.log(`   ⚠️ ${p.name} — 저장소 밖: ${o}`))
  process.exit(0)
}

if (arg === '--check') {
  const bad = []
  for (const p of pins) for (const n of p.now) if (!has(n)) bad.push(`핀이 낡았다 — «${p.name}»의 현행 «${n}» 이 없다`)
  for (const p of pins) for (const o of p.old) if (!has(o)) bad.push(`«${p.name}»의 구판 «${o}» 가 없다 (지우지 말고 격리만)`)
  for (const [name, where] of dupes(join(APP, 'design'))) {
    bad.push(`같은 이름이 두 곳에 있다 — «${name}»\n        ${where.join('\n        ')}\n        → 옛 세대를 그 영역의 «_구판/» 으로 옮길 것 (지우지 말고)`)
  }
  const outside = pins.flatMap((p) => p.outside.map((o) => `${p.name} — ${o}`))
  if (outside.length) {
    console.log('⚠️  저장소가 «모르는» 자리 — 여기는 파일로 확인할 수 없다. 반드시 창업자에게 물어볼 것:')
    outside.forEach((o) => console.log(`     ${o}`))
  }
  if (bad.length) {
    console.error(`\n❌ 최신 지도 점검 실패 — ${bad.length}건`)
    bad.forEach((b) => console.error(`   ✗ ${b}`))
    console.error('\n고치는 법: docs/최신-지도.md 를 실제와 맞추거나, 옛 세대를 «_구판/» 으로 옮길 것.')
    process.exit(1)
  }
  const t = byTopic()
  console.log(`✅ 최신 지도 통과 — 주제 ${t.size}개 · 핀 ${pins.length}개 · 같은 이름 겹침 0`)
  process.exit(0)
}

if (!MAIN) { /* 훅이 불러 쓴 것 — 출력하지 않는다 */ } else {
const t = byTopic()
console.log('📌 주제별 최신 문서\n')
for (const [k, v] of [...t].sort((a, b) => b[1][0].date.localeCompare(a[1][0].date))) {
  console.log(`${k}`)
  v.forEach((d, i) => console.log(`   ${i === 0 ? '✅ 최신' : '   옛것'}  ${d.date}  ${d.path}`))
}
if (pins.length) {
  console.log('\n📍 핀 (사람만 아는 확정본)')
  for (const p of pins) {
    console.log(`${p.name}`)
    p.now.forEach((n) => console.log(`   ✅ ${n}`))
    p.outside.forEach((o) => console.log(`   ⚠️ 저장소 밖 — ${o}`))
  }
}
}
