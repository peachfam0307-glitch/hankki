// 🔒 「팩에 배정된 모션·효과에 «확정» 표시가 있나」 — 대기인지 확정인지 코드만 봐도 알게.
//
// ⛔⛔ 왜 만들었나 (2026-08-05 사고 · #81)
//   `docs/모션-효과-설계.md` 에 **「⏳창업자 최종 확정 대기」** 라고 적혀 있는데
//   클로드가 «초안»을 코드에 먼저 넣어두고, 나중에 그 코드를 보고
//   *"이미 정해져 있었다 — 코드가 진짜다"* 며 **확정으로 굳혔다.**
//   창업자: *"추석에 아장아장은 처음들어. 할로윈 빙글도.."*
//   📌 **「대기」인 것을 코드에 «먼저» 넣지 않는다. 넣어야 하면 확정 표시 없이 예비로.**
//
// ⛔ 반대 사고도 있다 — **확정인데 표시가 없는 것.** 2026-08-10 에 실제로 잡았다:
//   CLAUDE.md 엔 창업자 확정이 **다섯**(추석·핼러윈·가을·크리스마스·겨울)인데
//   코드엔 「✅확정」이 **셋**뿐이었다(가을 `zoom` 누락). 그대로 두면 다음에 코드를 보고
//   *"가을은 아직 안 정했나?"* 로 되돌아간다.
//
// 재는 것 = `pack:` 이 붙은 MOTIONS·FX_KINDS 항목에 **「확정」이라는 말**이
//   ⒜ 그 줄 끝 주석에 있나  ⒝ 바로 위 주석 줄들에 있나
//
// ⚠️ 「표시가 없다」는 실패로 안 만든다(경고만) — 「아직 확정 안 된 것」도 정상적으로 여기 걸린다.
//   ⭐ 이 목록은 **「창업자에게 물어야 할 것」 목록**으로 읽는다. 다 확정되면 저절로 조용해진다.
//   ⛔ 다만 **정규식이 낡아 아무것도 못 읽으면 «실패»한다** — 그게 없으면 「실패할 줄 모르는 검사」가 되어
//      초록불이 거짓이 된다(`check-mistakes.mjs` ③ 이 2026-08-10 에 실제로 이 파일을 잡았다).
//
// ✅ 규칙 12 — **옛 값으로 진짜 걸리는지 확인했다** (2026-08-10, 만들자마자):
//   · 가을 `zoom`(슝) — CLAUDE.md 엔 창업자 확정인데 코드엔 표시가 없어 **⛔ 로 잡혔다** → 「✅확정」 붙임
//   · 출시기념 `wave`(찰랑) — 이미 무료로 열린 확정인데 표시가 없어 **⛔ 로 잡혔다** → 붙임
//   · 붙인 뒤 다시 돌리니 둘 다 사라지고 **진짜 미확정 5건만** 남았다(봄·심플·카페·소풍·여름27)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8').split('\n')

// ⛔ 정규식이 낡아 «아무것도 못 읽으면» 실패한다 — 그게 없으면 이 검사는 영원히 초록불이다
let 본것 = 0
const 걸린것 = []
for (let i = 0; i < src.length; i++) {
  const line = src[i]
  // 배열 항목이면서 pack 이 붙은 줄만 — 주석 줄(`//` 로 시작)은 뺀다
  if (!/^\s*\{.*\bpack:\s*'/.test(line)) continue
  const key = (line.match(/key:\s*'([^']+)'/) || [])[1] || '?'
  const label = (line.match(/label:\s*'([^']+)'/) || [])[1] || ''
  const pack = (line.match(/pack:\s*'([^']+)'/) || [])[1]
  // 배경(`bg`·`bgpaper`)은 자리표시라 뺀다 — 코드 주석이 그렇게 못 박고 있다
  if (pack === 'bg' || pack === 'bgpaper') continue
  본것++

  // ⒜ 그 줄 · ⒝ 바로 위 주석 줄들(빈 줄이나 코드 나올 때까지)
  let 확정 = /확정/.test(line)
  for (let j = i - 1; j >= 0 && !확정; j--) {
    const 앞 = src[j]
    if (!/^\s*\/\//.test(앞)) break     // 주석이 아니면 멈춘다
    if (/확정/.test(앞)) 확정 = true
  }
  if (!확정) 걸린것.push({ key, label, pack, line: i + 1 })
}

if (본것 < 5) {
  console.error(`⛔ Stickers.jsx 에서 pack 붙은 모션·효과를 ${본것}개밖에 못 읽었다 — 정규식이 낡았다`)
  process.exit(1)
}
if (!걸린것.length) {
  console.log(`✅ 팩 배정 표시 검사 — pack 붙은 모션·효과 ${본것}개에 확정 표시가 전부 있다`)
  process.exit(0)
}
console.log(`⚠️  팩에 배정됐는데 「확정」 표시가 없는 모션·효과 ${걸린것.length}건`)
for (const c of 걸린것) {
  console.log(`   · ${c.label}(${c.key}) → ${c.pack}   Stickers.jsx:${c.line}`)
}
console.log('\n   👉 «아직 안 정한 것»이면 그대로 두면 된다 — 이 목록이 곧 「창업자에게 물을 것」이다.')
console.log('   👉 «이미 정했는데» 표시만 없는 것이면 줄 끝에 「✅확정」을 붙인다.')
console.log('   ⛔ 확정 전엔 코드를 «근거»로 읽지 말 것 — 2026-08-05 에 그렇게 굳혔다가 창업자가 잡았다.')
process.exit(0)
