// 🧪 규칙 12 — 「0컷 저절로 열린다」 고침이 «세 갈래를 다» 맞게 말하나
//   ⛔ 고치기 «전» 코드는 ①②③ 모두 「N컷」으로만 말했다 → ②는 「0컷」, ③은 거짓말이었다.
import { nextGate } from '/home/user/hankki/hankki/scripts/release-calendar.mjs'

// 훅에 넣은 그 식을 그대로 쓴다(흉내가 아니라 같은 식 · 절대원칙 30)
const 문장 = (nx) => {
  const n = nx.reduce((s, g) => s + g.keys.length, 0)
  const 진짜 = nx.filter((g) => !g.todo)
  const 셈 = n ? `${n}컷` : `${진짜.length}개`
  return 진짜.length ? `저절로 열린다 — ${셈}` : '다시 보기로 한 것이 있다'
}

const 칸 = [
  ['① 컷이 열리는 날', '2026-10-01', /저절로 열린다 — [1-9]\d*컷$/],
  ['② 컷은 0인데 «열리는» 날', '2026-09-05', /저절로 열린다 — 3개$/],
  ['③ 약속만 있는 날', '2026-09-30', /다시 보기로 한 것이 있다$/],
]

let 죽음 = 0
for (const [이름, 날, 잣대] of 칸) {
  const nx = nextGate(날)
  const s = 문장(nx)
  const ok = 잣대.test(s)
  if (!ok) 죽음++
  console.log(`${ok ? '✅' : '⛔'} ${이름}  [${nx[0]?.date}]  ${s}`)
  nx.slice(0, 3).forEach((g) => console.log(`      · ${g.where} — ${g.what.slice(0, 46)}`))
}
console.log(죽음 ? `\n⛔ ${죽음}칸 죽었다` : `\n✅ ${칸.length}/${칸.length}`)
process.exit(죽음 ? 1 : 0)
