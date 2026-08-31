// 🔎 «이거 정한 적 있나?» — 대답하기 전에 저장소를 «먼저» 뒤진다.
//
// ⭐⭐ 왜 (창업자 2026-08-03)
//   창업자: *"우리 유료팩에 캐릭터 몇개까지 넣기로 했어?"*
//   클로드: *"정한 적이 없어."*  ← ⛔ **틀렸다.**
//   창업자: *"뭐래 정한적이 왜없어 확인하고 와 지금 내가 보고 있는데"*
//           *"내가 그거 정하래서 다 정하고 문서로 저장해뒀는데 없데 ㅋㅋ"*
//           *"**넌 왜 안읽고 니 멋대로 대답해?**"*
//
// ⛔ 무엇을 잘못했나 — 문서 «두 개»만 grep 하고 「없다」고 결론냈다.
//   정답은 `docs/자산현황-자동집계.md` §정원 대조 ＋ `scripts/asset-map.mjs` 의 `QUOTA` 에 있었고,
//   **`npm run assets` 한 번이면 나왔다.**
//   📌 더 나쁜 건 CLAUDE.md 핀에 *"`npm run assets` … 정원 대조 … **손으로 세지 말 것**"* 이라고
//      박혀 있었다는 것이다. **읽고도 안 썼다.**
//
// ⭐ 규칙이 아니라 장치인 이유 — *"규칙만 만들면 뭐해 안지키는데"*(창업자 2026-07-31).
//   「없다」고 말하기 전에 **이걸 돌린다.** 아무것도 안 나와야 비로소 「없다」고 말할 수 있다.
//
// 쓰기:  node hankki/scripts/decided.mjs "캐릭터 정원"
//        node hankki/scripts/decided.mjs 마테 개수
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(APP, '..')
const words = process.argv.slice(2).filter(Boolean)
if (!words.length) {
  console.log('쓰기: node hankki/scripts/decided.mjs "캐릭터 정원"')
  process.exit(0)
}

// 뒤지는 곳 — ⛔문서만 보면 안 된다. **결정은 코드 상수로도 산다**(이번이 그랬다).
const ROOTS = [
  join(APP, 'CLAUDE.md'),
  join(APP, 'docs'),
  join(APP, 'scripts'),
  join(APP, 'src/data'),
  join(ROOT, '.claude'),
]
const SKIP = /node_modules|\.git|_archive|낱개|원본시트|assets/
const OK_EXT = /\.(md|mjs|js|jsx|json|sh|txt)$/

const files = []
const walk = (p) => {
  if (SKIP.test(p)) return
  let s
  try { s = statSync(p) } catch { return }
  if (s.isDirectory()) { for (const e of readdirSync(p)) walk(join(p, e)); return }
  if (OK_EXT.test(p)) files.push(p)
}
for (const r of ROOTS) walk(r)

// 한 줄에 «찾는 말이 전부» 있고, ⭐**숫자가 함께 있으면** 「정해진 값」일 확률이 높다.
const hits = []
for (const f of files) {
  let txt
  try { txt = readFileSync(f, 'utf8') } catch { continue }
  txt.split('\n').forEach((line, i) => {
    const l = line.toLowerCase()
    if (!words.every((w) => l.includes(w.toLowerCase()))) return
    const hasNum = /\d/.test(line)
    hits.push({ f: relative(ROOT, f), n: i + 1, line: line.trim().slice(0, 160), hasNum })
  })
}

// ⭐⭐ [2026-08-18] 커밋 로그도 «같이» 뒤진다 (창업자 *"했던일 또 하라고 하는 것도..(안읽거나 저장안하고)"*)
//   📌 이 저장소는 커밋 메시지가 «무엇을 왜 했는지»까지 적혀 있어 **제일 좋은 「했던 일」 기록**이다.
//      그런데 여태 문서·코드만 뒤졌다 → 「이미 한 일」을 못 찾고 또 하자고 들고 왔다.
//   ⛔ 새 도구를 «만들지» 않았다 — 도구가 이미 179개다. 늘리면 그것도 못 찾게 된다(오늘 배운 것).
let did = []
try {
  const { execFileSync } = await import('node:child_process')
  const log = execFileSync('git', ['-C', ROOT, 'log', '--since=120 days ago', '--date=short',
    '--pretty=format:%ad\t%h\t%s'], { encoding: 'utf8', maxBuffer: 8 << 20 })
  did = log.split('\n').filter((l) => {
    const s = l.toLowerCase()
    return words.every((w) => s.includes(w.toLowerCase()))
  }).slice(0, 8)
} catch { /* git 이 없으면 조용히 넘어간다 */ }

console.log(`\n🔎 «${words.join(' ')}» — 저장소에서 찾은 것 ${hits.length}줄\n`)
if (did.length) {
  console.log(`  🕘 **이미 «한» 일** — 커밋 ${did.length}건 (여기 있으면 다시 하자고 하지 말 것)`)
  for (const d of did) { const [ad, h, s] = d.split('\t'); console.log(`     ${ad}  ${h}  ${s}`) }
  console.log('')
}
if (!hits.length) {
  console.log('  (아무것도 없다 — 이제야 「정한 적 없다」고 말할 수 있다)')
  console.log('  ⚠️ 단, 말을 바꿔 한 번 더 찾아볼 것: 정원·상한·기준·개수·몇 개·최대\n')
  process.exit(0)
}
// ⭐ 숫자 있는 줄을 먼저 — 「결정」은 거의 숫자로 남는다.
hits.sort((a, b) => (b.hasNum - a.hasNum))
for (const h of hits.slice(0, 25)) console.log(`  ${h.hasNum ? '🔢' : '  '} ${h.f}:${h.n}\n     ${h.line}`)
if (hits.length > 25) console.log(`\n  … ${hits.length - 25}줄 더`)

console.log(`
⛔ **여기 나온 게 「이미 정한 것」이다. 다시 정하자고 하지 말 것.**
⭐ 자산 개수·정원은 손으로 세지 말고 → \`npm run assets\` (docs/자산현황-자동집계.md 가 자동 갱신된다)
`)
