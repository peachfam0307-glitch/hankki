// 🏷🔒 **고르는 칸(칩)용 글꼴이 이름표를 «다» 덮나** — 배포 게이트(`npm run smoke`)
//
// ⛔⛔ 왜 필요한가 (2026-08-07)
//    글씨체 고르는 칸은 이름을 «그 글씨체로» 보여준다. 그래서 「글자」 탭을 여는 것만으로
//    **열두 벌을 통째로 내려받았다 — 실측 4.45MB**(`scripts/_measure-글씨무게.mjs`).
//    → 이름 몇 글자만 든 «칩» 벌을 따로 만들어 칸에만 쓴다(12벌 합쳐 80KB).
//
// ⚠️⚠️ **이 처방엔 조용한 구멍이 하나 있다** — 칩 벌에 없는 글자가 이름표에 들어오면
//    브라우저가 뒤에 적어둔 «진짜 글꼴»로 넘어간다. 화면은 멀쩡해 보이는데
//    **그 칸 하나 때문에 수백 KB 를 다시 받는다.** 아무도 모르고 지나간다.
//    ⭐ 그래서 「이름표 글자가 칩 벌 안에 다 있나」를 배포 전에 «글리프로» 확인한다.
//    📌 우리가 늘 하는 것 — 규칙이 아니라 장치로 막는다.
//
// 고치는 법 = 이름표를 바꿨으면 칩 벌을 다시 만든다:
//   python3 tools/font-subset.py hankki/src/assets/fonts/<key>-korean-400.woff2 <key> \
//     --chars '<모든 이름표 글자>' --only chip --out hankki/src/assets/fonts
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const FONTS = join(ROOT, 'src/assets/fonts')

// 📖 코드에서 읽는다 — 손으로 적으면 반드시 낡는다
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const TBL = SRC.slice(SRC.indexOf('export const TEXT_FONTS = ['))
const rows = [...TBL.slice(0, TBL.indexOf('\n]')).matchAll(/key: '([\w]+)', label: '([^']+)', family: "'([^']+)'/g)]
  .map((m) => ({ key: m[1], label: m[2], family: m[3] }))

if (rows.length < 6) {
  console.log(`⛔ TEXT_FONTS 를 못 읽었다 (${rows.length}개) — 읽는 방식부터 의심할 것`)
  process.exit(1)
}

// 🔗 글꼴 이름 → 파일 앞머리. `styles.css` 의 @font-face 에서 «읽어» 맞춘다(적어두면 어긋난다)
const CSS = readFileSync(join(ROOT, 'src/styles.css'), 'utf8')
const fileOf = {}
for (const m of CSS.matchAll(/font-family: '([^']+)';\s*src: url\('\.\/assets\/fonts\/([\w-]+)-(korean|latin|chip)-\d+\.woff2'/g)) {
  if (m[3] === 'korean') fileOf[m[1]] = m[2]
}

// 🔤🔤 칩 벌이 담은 글자 — **자를 때 옆에 적어 둔 목록**(`chip-chars.json`)을 읽는다.
//
// ⛔⛔ **첫 판은 파이썬 `fontTools` 로 woff2 를 열었다 → CI 에 fontTools 가 없어 «배포가 죽었다»**
//    (run 1128 · `ModuleNotFoundError: No module named 'fontTools'`). v9.91 이 안 나갔다.
//    📌 2026-08-03 `globSync` 사고와 **똑같은 종류**다 — 「내 자리에 있는 것」을 CI 에도 있다고 여겼다.
//    ⭐ 배포를 막는 게이트는 **노드만으로** 돌아야 한다. 저장소 밖 도구에 기대면 안 된다.
// ⚠️ 이 목록은 손으로 적는 게 아니라 `tools/font-subset.py` 가 **자를 때 자동으로 쓴다**
//    → 파일과 어긋날 수가 없다. (없으면 「칩을 안 만들었다」는 뜻이라 그것도 잡힌다)
const MAN = join(FONTS, 'chip-chars.json')
let manifest = null
try { manifest = JSON.parse(readFileSync(MAN, 'utf8')) } catch { /* 아래에서 잡는다 */ }
if (!manifest) {
  console.log('⛔ src/assets/fonts/chip-chars.json 이 없다 — 칩 벌을 만들 때 같이 써진다.')
  console.log("   python3 tools/font-subset.py hankki/src/assets/fonts/<key>-korean-400.woff2 <key> --chars '…' --only chip --out hankki/src/assets/fonts")
  process.exit(1)
}
const charsOf = (key) => new Set([...(manifest[key] || '')])

// 「글자 넣기」 단추도 고른 글씨체로 그린다 — 그 글자도 칩에 있어야 한다
const EXTRA = '글자 넣기'

let bad = 0
console.log(`\n🏷 고르는 칸용 칩 글꼴 — 글씨체 ${rows.length}개`)
let total = 0
for (const r of rows) {
  const key = fileOf[r.family]
  if (!key) { console.log(`   ⛔ ${r.label} — styles.css 에 '${r.family}' 의 한글 @font-face 가 없다`); bad++; continue }
  const chip = join(FONTS, `${key}-chip-400.woff2`)
  if (!existsSync(chip)) { console.log(`   ⛔ ${r.label} — 칩 벌이 없다 (${key}-chip-400.woff2)`); bad++; continue }
  // 칩 @font-face 선언도 있어야 한다 — 파일만 있고 선언이 없으면 아무 소용이 없다
  if (!CSS.includes(`${key}-chip-400.woff2`)) { console.log(`   ⛔ ${r.label} — 칩 파일은 있는데 styles.css 에 @font-face 가 없다`); bad++; continue }
  const cs = charsOf(key)
  const need = [...new Set([...r.label, ...EXTRA])].filter((c) => !/\s/.test(c))
  const miss = need.filter((c) => !cs.has(c))
  const kb = readFileSync(chip).length / 1024
  total += kb
  if (miss.length) { console.log(`   ⛔ ${r.label} — 칩에 없는 글자 「${miss.join('')}」 → 그 칸이 «진짜 글꼴»을 통째로 부른다`); bad++ }
  else console.log(`   ✅ ${r.label.padEnd(4)} ${kb.toFixed(1)}KB · 이름표 ${need.length}자 다 있다`)
}
console.log(`   📦 칩 벌 합계 ${total.toFixed(0)}KB (진짜 글꼴을 다 받으면 4.45MB 였다)`)

if (bad) {
  console.log(`\n⛔⛔ ${bad}건 — 이름표를 바꿨으면 칩 벌을 다시 만들 것:`)
  console.log(`   python3 tools/font-subset.py hankki/src/assets/fonts/<key>-korean-400.woff2 <key> --chars '<이름표 글자 전부>' --only chip --out hankki/src/assets/fonts\n`)
  process.exit(1)
}
console.log('✅ 칩 글꼴 검사 통과 — 고르는 칸이 큰 파일을 안 부른다\n')
