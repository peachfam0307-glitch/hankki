// 🎁 유료팩 배분표 게이트 — **문서와 코드가 다른 말을 하는 것**을 막는다.
//
// ⭐⭐ 왜 만들었나 (2026-08-05 하루에 같은 뿌리로 네 번 틀렸다)
//   ① 창업자 *"가을팩에 모션이랑 효과가 다 들어가? 각 팩당 모션 or 효과잖아"*
//      → **창업자 말이 맞았다.** 코드는 처음부터 팩당 하나였는데
//        `CLAUDE.md` 핀에 내가 「모션 1개 ＋ 효과 1개」라고 **틀리게** 적어뒀다.
//        창업자가 2026-07-30 에 이미 바로잡아 준 것을(*"각각 1개 총 2개가 아니라 그냥 1개씩"*)
//        내가 다시 틀리게 옮겨 적고 그걸로 판을 만들었다.
//   ② 창업자 *"추석에 아장아장은 처음들어. 할로윈 빙글도.."*
//      → 배분표는 `docs/모션-효과-설계.md` 에 **「⏳창업자 최종 확정 대기」** 라고 적혀 있었다.
//        그런데 내가 초안을 **코드에 먼저 넣어뒀고**, 나중에 그 코드를 보고
//        *"이미 정해져 있었다 — 코드가 진짜다"* 라며 `paidPacks.js` 에 **확정처럼 굳혔다.**
//   ③ `paidPacks.js` 의 `fx: '폭죽'`·`'안개'`·`'비'` — **코드에 그런 효과가 0개다.** 문서에만 있는 유령.
//      그걸 근거로 창업자에게 판을 만들어 보여줬다.
//   ④ 「가을 팩 모션이 비었다」고 보고 — 실제론 효과 `슝` 이 있었다(＝택1 규칙을 이미 지키고 있었다).
//
// 📌 넷 다 뿌리가 하나다 — **문서를 보고 코드를 안 봤다.** 그래서 코드로 잰다.
//
// 무엇을 막나
//   Ⓐ 팩 하나에 「모션이거나 효과」가 **정확히 하나**인가 (창업자 확정 규칙)
//   Ⓑ `paidPacks.js` 의 `motion`·`fx` 에 적은 이름이 **코드에 실제로 있는가** (유령 금지)
//   Ⓒ `Stickers.jsx` 의 `pack:` 키가 **팔 팩을 가리키는가** (고아 금지 — 두리번이 안 파는 팩에 잠겨 있었다)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
let fail = 0
const bad = (m) => { console.log(`  ❌ ${m}`); fail++ }
const ok = (m) => console.log(`  ✅ ${m}`)

// ── 코드에서 «실제 배정»을 읽는다 (주석 줄은 뺀다 — 설명문이 값으로 잡힌다) ──
const jsx = readFileSync(join(SRC, 'components', 'Stickers.jsx'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')

const grab = (constName) => {
  const i = jsx.indexOf(`export const ${constName} = [`)
  if (i < 0) return []
  const body = jsx.slice(i, jsx.indexOf('\n]', i))
  return [...body.matchAll(/\{\s*key:\s*'([^']+)'[^}]*?label:\s*'([^']+)'[^}]*?\}/g)]
    .map((m) => {
      const line = m[0]
      const pk = line.match(/pack:\s*'([^']+)'/)
      return { key: m[1], label: m[2], pack: pk ? pk[1] : null, base: /base:\s*true/.test(line) }
    })
}
const MOTIONS = grab('MOTIONS')
const FX = grab('FX_KINDS')
if (!MOTIONS.length || !FX.length) {
  console.log('❌ Stickers.jsx 에서 MOTIONS/FX_KINDS 를 못 읽었다 — 검사가 눈이 멀었다')
  process.exit(1)
}

const paid = await import(join(SRC, 'data', 'paidPacks.js'))
const PACKS = paid.PAID_PACKS

// 팩 키(chuseok) → 잠금 키(chuseok2026). ⚠️ 겨울만 2027 이라 규칙으로 못 만든다 → 표.
const UNLOCK = {
  chuseok: 'chuseok2026', halloween: 'halloween2026', autumn: 'autumn2026',
  xmas: 'xmas2026', winter: 'winter2027',
}

// 아직 `PAID_PACKS` 엔 없지만 **낼 예정인 팩** — 여기 적힌 것은 고아로 안 본다.
// ⛔ 여기에도 없고 PAID_PACKS 에도 없으면 = **죽은 팩에 잠긴 것 = 영영 안 열린다.**
//   실제 사고 = `watercolor2026`(두리번). 창업자가 가을 수채화를 가을 팩에 «통합»해서
//   그 팩은 영영 안 나오는데, 두리번은 거기 잠긴 채 남아 있었다.
// ⚠️ 시끄러우면 아무도 안 본다 — 미래 팩까지 빨간불로 띄우지 않는다.
const PLANNED = new Set([
  'summer2026',   // 출시기념 여름 (무료 · 이미 열림)
  'spring2027', 'simple2027', 'cafe2027', 'picnic2027', 'summer2027',
])

console.log('\n🎁 유료팩 배분표 — 문서 ↔ 코드')

// ── Ⓐ 팩당 «정확히 하나» ──────────────────────────────────
// 창업자 2026-07-30: *"유료팩당 효과나 모션 1개. 각각 1개 총 2개가 아니라 그냥 1개씩.
//   왜냐면 매달 나오는건데 모션이나 효과가 부족해."*
for (const p of PACKS) {
  const unlock = UNLOCK[p.key]
  if (!unlock) { bad(`'${p.key}' 의 잠금 키를 표(UNLOCK)에 안 적었다 — 팩을 늘렸으면 여기도 적을 것`); continue }
  const ms = MOTIONS.filter((m) => m.pack === unlock && !m.base)
  const fs = FX.filter((f) => f.pack === unlock && !f.base)
  const n = ms.length + fs.length
  const what = [...ms.map((m) => `🎬${m.label}`), ...fs.map((f) => `✨${f.label}`)].join(' ＋ ') || '없음'
  if (n === 1) ok(`${p.label} — ${what}`)
  else if (n === 0) bad(`${p.label} — 붙은 게 «없다». 팩을 사는 이유가 그림뿐이 된다`)
  else bad(`${p.label} — ${n}개다 (${what}). ⛔팩당 하나 규칙 위반 · 매달 나오는데 재고가 마른다`)
}

// ── Ⓑ 문서에 적은 이름이 코드에 실제로 있나 (유령 금지) ────
const names = new Set([...MOTIONS, ...FX].map((x) => x.label))
console.log('\n📄 paidPacks.js 의 motion·fx 이름이 코드에 있나')
let ghost = 0
for (const p of PACKS) {
  for (const [field, v] of [['motion', p.motion], ['fx', p.fx]]) {
    if (!v) continue
    if (!names.has(v)) {
      bad(`${p.label} ${field}: '${v}' — 코드에 그런 것이 «없다»(유령). 있는 것으로 고치거나 만들 것`)
      ghost++
    }
  }
}
if (!ghost) ok('유령 없음')

// ── Ⓒ 코드의 pack 키가 «팔 팩»을 가리키나 (고아 금지) ──────
console.log('\n🔑 잠금 키가 팔 팩을 가리키나')
const alive = new Set([...Object.values(UNLOCK), ...PLANNED])
const orphan = [...MOTIONS, ...FX].filter((x) => x.pack && !alive.has(x.pack))
if (orphan.length) {
  orphan.forEach((x) => bad(`${x.label} → '${x.pack}' — 그런 팩이 «없다». 영영 안 열린다.\n     ⛔ 팩을 만들거나 · PLANNED 에 적거나 · pack 을 떼서 «예비»로 내릴 것`))
} else ok('고아 없음')
const planned = [...MOTIONS, ...FX].filter((x) => x.pack && PLANNED.has(x.pack) && !x.base)
if (planned.length) console.log(`  ℹ️ 아직 안 파는 팩에 예약된 것 ${planned.length}개 — ${planned.map((x) => x.label).join(' ')}`)

// ── Ⓓ 팩 배경이 앱에 «실제로» 있나 ───────────────────────
//   ⛔⛔ **2026-08-05 에 이 검사가 없어서 놓친 것** — 창업자 *"배경이랑 효과도 있어?"* 로 잡혔다.
//      Ⓑ가 motion·fx 만 보고 **bg 는 안 봤다.** 세어 보니 **다섯 팩 배경이 전부 앱에 없었다**
//      (클레이-가을밤 · 클레이-핼러윈밤 · 비 오는 창 · 크림 유칼립투스 · 흰 눈·파란 트리).
//      창업자 원문이 *"**배경부터** 싹 다 보여줘야한다고"* 였는데 그 배경이 통째로 비어 있었다.
//   📌 배운 것 = **검사를 만들 때 «항목을 다 세었나»를 확인한다.** 반만 만든 검사는 「통과」라고 거짓말한다.
//   ⚠️ 파는 팩(sellable)은 **막고**, 아직 안 파는 팩은 **경고만** 한다 — 배경은 팔기 직전에 채워도 된다.
console.log('\n🖼 팩 배경이 앱에 있나')
const bgLabels = new Set([...jsx.slice(jsx.indexOf('DECOR_BACKGROUNDS = [')).matchAll(/label: '([^']+)'/g)].map((m) => m[1]))
let bgMiss = 0
for (const p of PACKS) {
  if (!p.bg) continue
  if (bgLabels.has(p.bg)) { ok(`${p.label} 배경 '${p.bg}' 있다`); continue }
  bgMiss++
  if (p.sellable) bad(`${p.label} 배경 '${p.bg}' — 앱에 «없다». 파는 팩인데 배경이 비었다`)
  else console.log(`  ⏳ ${p.label} 배경 '${p.bg}' — 아직 앱에 없다 (안 파는 팩이라 경고만)`)
}
if (!bgMiss) ok('배경 전부 있다')

// ── Ⓔ 유료팩 배경이 «진짜로» 잠기나 ─────────────────────
//   ⛔⛔ **2026-08-05, AAB 굽기 직전에 잡은 구멍.**
//      「비 오는 창」(가을 유료팩 배경)에 `pack: 'autumn2026'` 을 붙여 놓고
//      **거르는 곳을 안 만들었다.** 배경 피커는 `!b.hidden` 만 보고 있었다.
//      → 그대로 나갔으면 **파는 배경이 무료로 풀렸다.**
//      📌 절대원칙 = *"파는건 공유카드로도 안내보내는게 맞지"* (창업자 2026-08-03)
//      📌 배운 것 = **꼬리표를 붙이는 것과 그 꼬리표를 «읽는 것»은 다른 일이다.**
//         꼬리표만 붙이면 코드는 «아무 말 없이» 통과시킨다.
console.log('\n🔒 유료팩 배경이 잠기나')
const dec = readFileSync(join(SRC, 'components', 'DecorEditor.jsx'), 'utf8')
const packedBg = [...jsx.slice(jsx.indexOf('DECOR_BACKGROUNDS = [')).matchAll(/label: '([^']+)'[^}]*?pack: '(\w+)'|pack: '(\w+)'[^}]*?label: '([^']+)'/g)]
if (!packedBg.length) ok('pack 이 붙은 배경이 아직 없다')
// ⚠️ `[^)]*` 로 쓰면 `(b) =>` 의 닫는 괄호에서 멈춰 b.pack 에 못 닿는다(2026-08-05 실제로 그랬다)
else if (/DECOR_BACKGROUNDS\.filter\([\s\S]{0,120}?b\.pack/.test(dec)) ok('pack 붙은 배경을 피커가 거른다')   // ⚠️개수는 정규식이 겹쳐 잡아 부정확하다 — 「있나 없나」만 본다
else bad('배경 피커가 b.pack 을 «안 본다» — 유료팩 배경이 무료로 풀린다.\n     👉 DecorEditor.jsx 의 DECOR_BACKGROUNDS.filter 에 (!b.pack || ownedPacks().has(b.pack)) 를 넣을 것')

console.log(fail ? `\n❌ 팩 배분표 검사 실패 ${fail}건\n` : '\n✅ 팩 배분표 통과\n')
process.exit(fail ? 1 : 0)
