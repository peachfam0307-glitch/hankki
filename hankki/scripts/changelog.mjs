// 📣 changelog 뽑기·보관 (2026-09-17 신설)
//
//   node scripts/changelog.mjs                       # 최근 줄 전부 (사람이 훑는 용)
//   node scripts/changelog.mjs --asc --from v13.48   # 🍎 ASC 「이 버전의 새로운 기능」에 «그대로 복붙»할 덩이
//   node scripts/changelog.mjs --asc --from v13.48 --to v13.65
//   node scripts/changelog.mjs --보관                 # 90일 지난 줄을 docs/changelog-보관.md 로 옮긴다(번들을 안 키운다)
//
// 📮 아이폰 세션(2026-09-17) = *"ASC용 문구도 같은 changelog에서 뽑을 수 있게 … 그럼 내가 밤에 그대로 가져다 써."*
//    → `--asc` 는 «asc: true ＋ user 있음» 줄만, 최신이 위, 줄마다 「· 」로. 그대로 붙여넣으면 된다.
//    ⚠️ ASC 글자 한도는 **모른다** — 아이폰 세션이 ASC 실물에서 본다. 여기선 글자 수만 같이 찍는다.
//
// 🔢 왜 보관이 필요한가 — 8/29→9/17 = 185판/20일 ≈ 연 3,400줄. 줄당 ~80B 면 연 270KB 가 번들에 실린다.
//    앱은 최근 21일치만 쓴다. 그래서 90일 지난 줄은 문서로 내린다(`doc-trim` 과 같은 생각 · 지우지 않는다).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { CHANGELOG } from '../src/data/changelog.js'
import { todayKST } from '../src/today.js'

const args = process.argv.slice(2)
const has = (k) => args.includes(k)
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }

const vnum = (v) => { const m = String(v).match(/^v(\d+)\.(\d+)/); return m ? Number(m[1]) * 1000 + Number(m[2]) : -1 }

if (has('--asc')) {
  const from = val('--from'), to = val('--to')
  const lo = from ? vnum(from) : -1, hi = to ? vnum(to) : Infinity
  const 줄 = CHANGELOG
    .filter((c) => c.asc && c.user && vnum(c.v) >= lo && vnum(c.v) <= hi)
    .sort((a, b) => vnum(b.v) - vnum(a.v))
  if (!줄.length) { console.log(`(asc 줄 없음 — ${from || '처음'} ~ ${to || '최신'})`); process.exit(0) }
  const 덩이 = 줄.map((c) => `· ${c.user}`).join('\n')
  console.log(덩이)
  console.error(`\n— ${줄.length}줄 · ${[...덩이].length}자 (${줄[줄.length - 1].v} ~ ${줄[0].v}) · ⚠️ ASC 한도는 실물에서 확인`)
  process.exit(0)
}

if (has('--보관')) {
  const today = todayKST()
  const days = (a) => Math.round((Date.parse(today) - Date.parse(a)) / 86400000)
  // ⛔ user 있는 줄은 «안» 옮긴다 — 설정 「업데이트 내역」이 전부를 보여준다(창업자 2026-09-17). null 줄만 내린다.
  const 남길 = CHANGELOG.filter((c) => c.user || days(c.when) <= 90)
  const 옮길 = CHANGELOG.filter((c) => !c.user && days(c.when) > 90)
  if (!옮길.length) { console.log('🗄 90일 지난 줄 없음 — 옮길 것 없다'); process.exit(0) }
  const 문서 = new URL('../docs/changelog-보관.md', import.meta.url)
  if (!existsSync(문서)) writeFileSync(문서, '# 📣 changelog 보관 — 90일 지난 줄 (⛔지우지 않는다 · 아래로 이어붙인다)\n')
  appendFileSync(문서, `\n## 옮김 ${today}\n` + 옮길.map((c) => `- ${c.when} · ${c.v} · ${c.user ?? '(유저 눈엔 없음)'}${c.asc ? ' · asc' : ''}`).join('\n') + '\n')
  // 소스 파일에서 그 줄들을 «통째로» 뺀다 — 줄 단위라 다른 글자는 안 건드린다
  const src = new URL('../src/data/changelog.js', import.meta.url)
  let text = readFileSync(src, 'utf8')
  let 뺀 = 0
  for (const c of 옮길) {
    const re = new RegExp(`^\\s*\\{ v: '${c.v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^\\n]*\\n`, 'm')
    if (re.test(text)) { text = text.replace(re, ''); 뺀++ }
  }
  if (뺀 !== 옮길.length) { console.error(`⛔ 옮길 ${옮길.length}줄 중 ${뺀}줄만 찾았다 — 소스를 안 건드린다`); process.exit(1) }
  writeFileSync(src, text)
  console.log(`🗄 ${옮길.length}줄을 docs/changelog-보관.md 로 옮겼다 · 남은 줄 ${남길.length}`)
  process.exit(0)
}

for (const c of [...CHANGELOG].sort((a, b) => b.when.localeCompare(a.when))) {
  console.log(`${c.when}  ${c.v.padEnd(9)}  ${c.user ?? '(유저 눈엔 없음)'}${c.asc ? '  [asc]' : ''}`)
}
