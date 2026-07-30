// ✨ 모션·효과 게이트 — **팩당 딱 1개 규칙**과 **친구들 전원 모션** 을 지킨다.
//
// 왜 만들었나 (창업자 2026-07-30)
//   ① *"여름의꼬르곰펭펭(모션,효과 없어)"* — 여름 곰펭(`sm_`)·가을 곰펭(`au_b`)이
//      `gp_` **접두어 검사**에 안 걸려서 **캐릭터인데 모션·효과가 통째로 안 붙었다.**
//      게다가 같은 접두어 검사가 **세 파일에 복사**돼 있어 셋 다 동시에 빠졌다.
//      → 눈으로는 못 잡는다(서랍엔 멀쩡히 보이고, 붙여서 눌러봐야 안다). 그래서 게이트로 만든다.
//   ② *"유료팩당 효과나 모션 1개. 각각 1개 총 2개가 아니라 그냥 1개씩. 왜냐면 **매달 나오는건데**
//      모션이나 효과가 부족해"* — **돈이 걸린 규칙**이다. 1+1로 주면 재고가 두 배로 빨리 바닥나고,
//      한 팩에 두 개가 몰리면 그 팩만 팔린다. 배분표(`docs/모션-효과-설계.md`)와 코드가
//      어긋난 채로 굳으면, 팩을 팔 때 **뭐가 딸려 가는지 아무도 모르게 된다.**
//
// 보는 것
//   1. 친구들 탭 스티커는 **전부** `FRIEND_IDS` 에 들어간다 (여름·가을 곰펭 포함)
//   2. 모션·효과를 `gp_` 같은 **이름 접두어로 판정하는 코드가 남아 있지 않다**
//   3. 팩 하나당 **모션이거나 효과이거나 딱 1개** (모션+효과 합쳐서 셈)
//   4. 팩용 모션·효과는 **CSS 클래스가 실제로 있다** (정의만 하고 안 만든 것 = 팔면 사고)
//   5. 모든 모션·효과 클래스가 **`hk-m-`/`hk-fx-` 접두어** 다 (움직임 끄기에 같이 걸리게)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const stickers = read('src/components/Stickers.jsx')
const css = read('src/styles.css')
const fails = []
const ok = (m) => console.log(`[motion] ✓ ${m}`)

// ── 배열 하나를 통째로 떠낸다(중첩 대괄호까지) ──
function block(src, name) {
  const i = src.indexOf(`export const ${name} = [`)
  if (i < 0) return ''
  let d = 0
  for (let j = src.indexOf('[', i); j < src.length; j += 1) {
    if (src[j] === '[') d += 1
    else if (src[j] === ']') { d -= 1; if (!d) return src.slice(i, j + 1) }
  }
  return ''
}
const rows = (name) => [...block(stickers, name).matchAll(/\{([^{}]*)\}/g)].map((m) => {
  const s = m[1]
  const g = (re) => (s.match(re) || [])[1]
  return { key: g(/key:\s*'([^']+)'/), base: /base:\s*true/.test(s), pack: g(/pack:\s*'([^']+)'/) }
}).filter((r) => r.key)

const motions = rows('MOTIONS')
const fx = rows('FX_KINDS')
if (motions.length < 3 || fx.length < 3) fails.push('MOTIONS/FX_KINDS 를 못 읽었다 — 이 검사가 헛돌고 있다')

// ── 1. 친구들 탭 전원이 FRIEND_IDS 에 들어가나 ──
// (그룹 정의가 여러 줄에 걸쳐 있어 줄바꿈을 먼저 편다 — asset-map.mjs 와 같은 방식)
const flat = stickers.replace(/\n\s*/g, ' ')
const buddyIds = new Set()
for (const m of flat.matchAll(/\{\s*key:\s*'[^']+',\s*tab:\s*'buddies'[^}]*?items:\s*\[([^\]]*)\]/g)) {
  for (const raw of m[1].split(',')) {
    const k = raw.trim().replace(/^'|'$/g, '')
    if (/^[a-z][\w]*$/i.test(k)) buddyIds.add(k)
  }
}
// ⚠️ 부엌 식구들 그룹은 items 가 `kfItems('kf_')` 라 이 정규식에 **안 걸린다.**
//    앱에서는 `FRIEND_IDS` 가 실제 배열을 펼쳐 만들므로 문제 없다 — 여기 숫자만 그만큼 적다.
if (buddyIds.size < 30) fails.push(`친구들 탭 아이디를 ${buddyIds.size}개밖에 못 읽었다 — 파서가 깨졌다`)
else ok(`친구들 탭 ${buddyIds.size}컷 읽음 (부엌 식구들 kf_ 8종은 함수로 만들어져 여기선 제외)`)

for (const need of ['sm_duo_watergun', 'sm_gom_tube', 'sm_peng_beach', 'au_b01', 'gp_gomft']) {
  if (!buddyIds.has(need)) fails.push(`${need} 가 친구들 탭에 없다 — 모션·효과가 안 붙는다`)
}
if (buddyIds.has('sm_duo_watergun') && buddyIds.has('au_b01')) ok('여름·가을 꼬르곰·펭펭도 친구들 탭에 있다')

const friendDecl = /export const FRIEND_IDS = new Set\(\s*STICKER_GROUPS\.filter\(\(g\) => g\.tab === 'buddies'\)/
if (!friendDecl.test(stickers)) fails.push('FRIEND_IDS 가 친구들 탭에서 만들어지지 않는다')
else ok('FRIEND_IDS = 친구들 탭 전부에서 만들어진다')

// ── 2. 이름 접두어로 모션 대상을 고르는 코드가 남아 있으면 안 된다 ──
// 📌 교훈: 이름 규칙으로 분류하지 말고, 이미 있는 분류(탭)를 쓴다.
for (const f of ['src/components/Stickers.jsx', 'src/components/DecorEditor.jsx', 'src/components/DecorLayer.jsx']) {
  const src = read(f)
  for (const [i, line] of src.split('\n').entries()) {
    if (line.trimStart().startsWith('//') || line.includes('*')) continue
    if (/startsWith\('gp_'\)/.test(line) && /motion|fx|Fx|Motion/.test(line)) {
      fails.push(`${f}:${i + 1} — 모션·효과 대상을 'gp_' 접두어로 고르고 있다 (FRIEND_IDS 를 쓸 것)`)
    }
  }
}
if (!fails.some((f) => f.includes('gp_'))) ok("모션·효과 대상을 이름 접두어로 고르는 코드 없음")

// ── 3. 팩 하나당 딱 하나 — 모션이거나 효과이거나 (⭐ 돈이 걸린 규칙) ──
// 창업자 2026-07-30 *"유료팩당 효과나 모션 1개. 각각 1개 총 2개가 아니라 그냥 1개씩.
//   왜냐면 매달 나오는건데 모션이나 효과가 부족해."*
// → **모션과 효과를 합쳐서** 센다. 한 팩에 모션 1 + 효과 1 이어도 **위반**이다.
const cnt = {}
for (const r of [...motions, ...fx]) if (r.pack) (cnt[r.pack] ||= []).push(r.key)
for (const [p, keys] of Object.entries(cnt)) {
  if (keys.length > 1) {
    fails.push(`팩 '${p}' 에 ${keys.length}개(${keys.join('·')}) — **팩당 딱 1개**여야 한다 (docs/모션-효과-설계.md)`)
  }
}
const packN = Object.keys(cnt).length
if (packN < 8) fails.push(`팩에 붙은 모션·효과가 ${packN}개뿐 — 매달 하나씩이면 ${packN}개월치밖에 안 된다`)
else ok(`팩당 1개 지켜짐 — ${packN}개 팩에 배정(＝${packN}개월치) · 미배정 예비 ${[...motions, ...fx].filter((r) => !r.base && !r.pack).length}개`)

// ── 4. 정의만 하고 CSS 를 안 만든 모션·효과가 없나 (팔면 사고) ──
for (const m of motions) {
  if (m.key === 'none') continue
  if (!css.includes(`.hk-m-${m.key}`)) fails.push(`모션 '${m.key}' 의 CSS(.hk-m-${m.key})가 없다`)
}
for (const f of fx) {
  if (f.key === 'none') continue
  if (!css.includes(`.hk-fx-${f.key}`)) fails.push(`효과 '${f.key}' 의 CSS(.hk-fx-${f.key})가 없다`)
}
if (!fails.some((f) => f.includes('CSS'))) ok(`모션 ${motions.length - 1}종 · 효과 ${fx.length - 1}종 CSS 전부 있음`)

// ── 5. 움직임 끄기(prefers-reduced-motion)에 전부 걸리나 ──
// 접두어를 안 지킨 클래스는 저 한 줄을 빠져나가 **끄기를 켠 사람에게도 계속 움직인다.**
if (!/prefers-reduced-motion[\s\S]*?\[class\*="hk-m-"\][\s\S]*?\.hk-fx/.test(css)) {
  fails.push('움직임 끄기(prefers-reduced-motion) 규칙이 hk-m-/hk-fx 를 둘 다 안 끈다')
} else ok('움직임 끄기 켜면 모션·효과 전부 멈춘다')

if (fails.length) {
  console.error(`\n❌ 모션·효과 검사 실패 — ${fails.length}건`)
  fails.forEach((f) => console.error(`   ✗ ${f}`))
  console.error('\n배분표·규칙: docs/모션-효과-설계.md')
  process.exit(1)
}
console.log(`✅ 모션·효과 통과 — 친구들 ${buddyIds.size}컷 전원 모션 가능 · 팩당 1개(${packN}개월치)`)
