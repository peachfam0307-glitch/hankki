// 📌✂️ [1회용 · 2026-09-03] CLAUDE.md 의 「고정 메모(핀)」 절을 갈라낸다
//
// 📮 창업자 = *"도대체 프롬프트창은 왜저렇게 빨리차는거야."* → 실측하니 CLAUDE.md 461,814 B.
//    그중 **핀 한 절이 357,076 B = 파일의 77%.** 세션이 `hankki/` 안 파일을 하나만 읽어도
//    이게 통째로 들어온다. 정작 매번 필요한 「창업자와 일하는 규칙」이 그 뒤에 묻혀 있다.
//
// ⭐ 가르는 기준 = **「매 세션 필요한가」**
//    · 매번 필요 → CLAUDE.md 에 남는다 (일하는 규칙 · 자주 쓰는 사실 · 절대원칙)
//    · 찾을 때만 → `docs/고정메모-핀.md` 로. `/메모` 가 그때 연다.
//    · 이미 지난 판 → 🗄`docs/_archive/버전기록-전체.md` 로 (8/13 에 623줄을 옮긴 그 자리)
//
// ⛔ **한 글자도 안 지운다.** 뺀 줄과 넣은 줄이 같은지 세서 확인하고, 안 맞으면 아무것도 안 한다.
// ⭐ CLAUDE.md 에는 **색인**(핀 하나당 첫 줄)을 남긴다 — 뭐가 있는지 모르면 찾지도 못한다.
//    (규칙 24 의 교훈 = 「자리만 옮기고 위험은 그대로」를 뒤집은 것. 여기선 «못 찾게» 되는 게 위험이다)
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

const APP = existsSync('hankki/docs') ? 'hankki' : '.'
const 실행 = process.argv.includes('--옮김')
const CM = join(APP, 'CLAUDE.md')
const 핀파일 = join(APP, 'docs/고정메모-핀.md')
const 버전파일 = join(APP, 'docs/_archive/버전기록-전체.md')

const 원본 = readFileSync(CM, 'utf8')
const 줄 = 원본.split('\n')

const 시작 = 줄.findIndex((l) => /^## 📌 고정 메모/.test(l))
if (시작 < 0) { console.error('⛔ 「## 📌 고정 메모」 절을 못 찾았다. 아무것도 안 했다.'); process.exit(1) }
let 끝 = 줄.length
for (let i = 시작 + 1; i < 줄.length; i++) if (/^## /.test(줄[i])) { 끝 = i; break }

// ── 핀 = 최상위 불릿(`- `) 하나가 덩어리 하나. 그 아래 들여쓴 줄은 그 덩어리에 딸린다 ──
const 몸 = 줄.slice(시작 + 1, 끝)
const 덩이 = []
for (const l of 몸) {
  if (/^- /.test(l) || 덩이.length === 0) 덩이.push([l])
  else 덩이[덩이.length - 1].push(l)
}
const 머리 = /^- /.test(덩이[0][0]) ? [] : 덩이.shift()          // 절 바로 밑 설명줄(「> 창업자가…」)

const 옛버전 = 덩이.filter((d) => /^- \*\*옛 버전\*\*/.test(d[0]))
const 남길핀 = 덩이.filter((d) => !/^- \*\*옛 버전\*\*/.test(d[0]))

const B = (a) => Buffer.byteLength(a.join('\n'))
const 첫줄 = (d) => d[0].replace(/^- /, '').replace(/\s+/g, ' ').slice(0, 88)

console.log(`📌 CLAUDE.md ${Buffer.byteLength(원본).toLocaleString()} B · 핀 절 ${시작 + 1}~${끝}행 (${B(몸).toLocaleString()} B)`)
console.log(`   핀 덩어리 ${덩이.length}개  →  📄 남길 핀 ${남길핀.length}개 (${B(남길핀.flat()).toLocaleString()} B) · 🗄 옛 버전 ${옛버전.length}개 (${B(옛버전.flat()).toLocaleString()} B)`)

// ── CLAUDE.md 에 남을 것 = 절 머리 ＋ 색인 ──
const 색인 = [
  줄[시작],
  ...머리,
  '',
  `> 📄 **전문 = \`${핀파일}\`** — \`/메모\` 가 그 파일을 연다.`,
  `> ⛔ **여기에 핀 본문을 다시 붙이지 말 것.** 2026-09-03 에 이 절이 357KB 까지 자라서`,
  `>    대화를 열자마자 창이 찼다. 지금은 \`scripts/check-docsize.mjs\` 가 배포를 막는다.`,
  `> 🗄 옛 버전 기록 = \`${버전파일}\` (⛔보관소 — 창업자가 지시할 때만 연다)`,
  '',
  `### 🔎 색인 — 무엇이 들어 있나 (${남길핀.length}개)`,
  '',
  ...남길핀.map((d) => `- ${첫줄(d)}`),
  '',
]

const 새CLAUDE = [...줄.slice(0, 시작), ...색인, ...줄.slice(끝)].join('\n')

console.log(`   → CLAUDE.md ${Buffer.byteLength(원본).toLocaleString()} → ${Buffer.byteLength(새CLAUDE).toLocaleString()} B`)
if (!실행) { console.log('\n👀 «보여만» 줬다. 실제로 옮기려면 → --옮김'); process.exit(0) }

// ── ⛔ 검산: 뺀 줄 == 넣을 줄 ──
const 넣을 = 남길핀.flat().length + 옛버전.flat().length + 머리.length
if (넣을 !== 몸.length) {
  console.error(`⛔ 줄 수가 안 맞는다 — 몸통 ${몸.length} · 나눈 합 ${넣을}. 아무것도 안 했다.`)
  process.exit(1)
}

writeFileSync(핀파일,
  '> 📌 **고정 메모(핀)** — 창업자가 「고정」해 둔 것. `/메모` 로 소환한다.\n' +
  '> 🧹 2026-09-03 에 `CLAUDE.md` 에서 갈라냈다(그 절이 357KB 라 대화 창을 먹었다).\n' +
  '> ⛔ 보관소가 아니다 — 언제든 읽어도 된다. 다만 **CLAUDE.md 로 되돌려 붙이지 말 것.**\n\n' +
  '# 📌 고정 메모 (핀)\n\n' + [...머리, ...남길핀.flat()].join('\n') + '\n')

appendFileSync(버전파일,
  '\n\n<!-- 🧹 2026-09-03 CLAUDE.md 핀 절에서 옮김 (그 뒤로 다시 쌓인 v11.x 판들) -->\n' +
  옛버전.flat().join('\n') + '\n')

writeFileSync(CM, 새CLAUDE)
console.log(`\n✅ 갈랐다 — CLAUDE.md ${Buffer.byteLength(원본).toLocaleString()} → ${Buffer.byteLength(readFileSync(CM, 'utf8')).toLocaleString()} B`)
console.log('   ⛔ 한 글자도 안 지웠다. 👉 다음: node scripts/check-docsize.mjs')
