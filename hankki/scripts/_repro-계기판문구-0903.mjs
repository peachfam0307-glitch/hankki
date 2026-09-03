#!/usr/bin/env node
// 📅📅 「저절로 열리는 문」을 «안 열리는 것»처럼 말하지 않나 — 재현판 (2026-09-03) 〔반영됨〕
//
// 📮 뿌리 = 절대원칙 28(창업자 2026-08-01) = *"자동으로 올라가기 전날에 꼭 검수하고 내보내자."*
//    그 절대원칙을 지키려면 «내일 뭐가 열리나»를 계기판이 «맞게» 말해줘야 한다.
//
// ⛔⛔ 2026-09-03 에 실제로 이렇게 떠 있었다 (장바구니 제품 셋이 D-2 인 날):
//        🚨 2026-09-05(D-2) 에 **다시 보기로 한 것**이 있다
//           · 주부의 장바구니 · 젓갈·액젓 — 양념낙지젓 (0)
//    ⭐ 「저절로 열린다」여야 하는데 「다시 보기로 한 것」으로 갈렸다.
//       ＝ **저절로 열리는데 «안 열리는 것»처럼 읽힌다** → 전날 검수를 건너뛴다.
//
// 🔎 원인 = 「몇 개 열리나」를 `keys.length` 로 셌다. 그런데 문은 단위가 셋이다 —
//    서랍·카드 «컷» / 레시피 «편» / 주부의 장바구니 «제품»(keys 가 아예 비어 있다).
//    → 장바구니만 열리는 날은 0 이 되어 문장이 통째로 갈렸다.
//
// ⛔ 그리고 이 사고는 «두 번째»다. 2026-09-02 에 `latest-hook.mjs` 하나만 고치면서
//    그 주석에 *"--brief 는 이미 문장을 갈라 쓰고 있었다"* 라고 적었는데 **사실이 아니었다.**
//    같은 주석이 스스로 경고한 그대로 = *"같은 말을 두 곳에서 만들면 한쪽은 반드시 낡는다."*
//
// ✅ 그래서 숫자를 안 키우고 **모양을 바꿨다**(절대원칙 34) — 문이 `n`·`unit` 을 들고 다니고
//    `열리는양()` «하나»가 센다. 이 판은 그 하나가 살아 있는지 잰다.
//
// 🧪 규칙 12 = `몇개()` 를 옛 판(`g.keys.length`)으로 되돌리면 ①③⑤⑥ 이 죽는다.

import { gates, 열리는양 } from './release-calendar.mjs'
import { execFileSync } from 'node:child_process'

let ok = 0, bad = 0
const chk = (label, cond, got) => {
  if (cond) { ok++; console.log(`  ✅ ${label}`) }
  else { bad++; console.log(`  ⛔ ${label}   ← 나온 값: ${got}`) }
}

console.log('\n📅 「저절로 열리는 문」을 맞게 말하나\n')

const gs = gates()
const 날짜별 = new Map()
for (const g of gs) 날짜별.set(g.date, [...(날짜별.get(g.date) || []), g])

console.log('① 문마다 «몇 개»와 «무슨 단위»를 들고 있다')
const cart = gs.filter((g) => g.kind === 'cart')
const rec = gs.filter((g) => g.kind === 'recipe')
chk('  장바구니 문이 있다 (＝이 칸의 전제)', cart.length > 0, cart.length)
chk('  ⭐ 장바구니 문은 «1개» 이상이다 — 0 이면 문장이 갈린다', cart.every((g) => g.n >= 1), cart.map((g) => g.n).slice(0, 5))
chk('  ⭐ 장바구니 단위 = 「개」 (제품이지 컷이 아니다)', cart.every((g) => g.unit === '개'), [...new Set(cart.map((g) => g.unit))])
chk('  ⭐ 레시피 단위 = 「편」 (컷이 아니다)', rec.length > 0 && rec.every((g) => g.unit === '편'), [...new Set(rec.map((g) => g.unit))])

console.log('\n② ⛔ 「0」으로 찍히는 문이 하나도 없다 — 0 은 「안 열린다」로 읽힌다')
const 영 = gs.filter((g) => !g.todo && !g.n)
chk('  저절로 열리는 문인데 개수가 0 인 것 = 0건', 영.length === 0, 영.map((g) => `${g.date} ${g.where}`).slice(0, 5))

console.log('\n③ ⭐⭐ 저절로 열리는 문이 있는 날은 «반드시» 「저절로」라고 말한다')
let 갈린날 = []
for (const [date, g] of 날짜별) {
  const 저절로있다 = g.some((x) => !x.todo)
  const 말한다 = 열리는양(g) !== ''
  if (저절로있다 !== 말한다) 갈린날.push(date)
}
chk('  「열리는 게 있다」와 「열린다고 말한다」가 어긋난 날 = 0', 갈린날.length === 0, 갈린날.slice(0, 5))

console.log('\n④ 「그날 같이 볼 것」(약속)만 있는 날은 «안» 센다 — 그건 열리는 게 아니다')
const todo만 = [...날짜별.values()].filter((g) => g.every((x) => x.todo))
chk('  약속만 있는 날은 열리는양이 빈칸이다', todo만.every((g) => 열리는양(g) === ''), todo만.length)

console.log('\n⑤ ⭐⭐ 계기판 «둘»이 같은 말을 하나 — 이게 이 사고의 뿌리였다')
const R = new URL('.', import.meta.url).pathname
const brief = execFileSync('node', [`${R}release-calendar.mjs`, '--brief'], { encoding: 'utf8' })
const hook = execFileSync('node', [`${R}latest-hook.mjs`], {
  encoding: 'utf8', input: JSON.stringify({ hook_event_name: 'SessionStart' }),
})
const 뽑기 = (s) => (s.match(/에 \*\*(저절로\*\* 열린다 — [^\n]+|다시 보기로 한 것\*\*이 있다)/) || [, ''])[1].trim()
const b = 뽑기(brief), h = 뽑기(hook)
chk('  --brief 가 문장을 찍었다 (＝이 칸의 전제)', b !== '', JSON.stringify(b))
chk('  ⭐⭐ 훅과 --brief 가 «한 글자도 안 다르다»', b === h, `brief=${JSON.stringify(b)} / hook=${JSON.stringify(h)}`)

console.log('\n⑥ ⛔ 저절로 열리는 게 있는데 「다시 보기로 한 것」이라 말하지 않는다')
const 다음 = [...날짜별.entries()].filter(([d]) => d >= new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10)).sort()[0]
if (다음) {
  const [d, g] = 다음
  const 저절로 = g.filter((x) => !x.todo)
  chk(`  가장 가까운 문(${d}) — 저절로 ${저절로.length}개 · 문장 = ${b || '(없음)'}`,
    저절로.length === 0 || /저절로/.test(b), `저절로=${저절로.length} 문장=${JSON.stringify(b)}`)
} else chk('  앞으로 열릴 문이 있다', false, '없음')

console.log(`\n${bad ? '⛔' : '✅'} ${ok}/${ok + bad}\n`)
console.log('📌 ①②③⑥ = 「저절로 열리는데 «안 열린다»고 말하나」. 죽으면 전날 검수를 건너뛴다(절대원칙 28).')
console.log('   ⑤ = 계기판 «둘»이 갈리나. 2026-09-02 에 훅만 고쳐 하루를 갈라 놨던 그 자리다.')
process.exit(bad ? 1 : 0)
