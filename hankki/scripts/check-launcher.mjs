// 🏷 런처명 게이트 — **안 보이는 글자의 «개수»를 코드가 센다.**
//
// 왜 (창업자 2026-08-01 *"런쳐아이콘 왼쪽으로 쏠려있잖아"*):
//   홈 화면에서 앱 이름이 **왼쪽으로 18px 쏠려** 보인 사고가 세 번 있었다.
//   원인은 트릭 자체가 아니라 **「안 보이는 글자를 몇 개 넣었는지 눈으로 확인할 방법이 없다」** 는 점이었다.
//   (스크린샷으로도 「넓은 1개」와 「좁은 2개」가 구분이 안 된다.)
//
// ⭐ 그런데 **코드는 셀 수 있다.** 그래서 이걸 게이트로 만든다 — 규칙이 아니라 장치.
//
// 값의 뜻:
//   `short_name` 이 「한끼」 2글자라 PWABuilder 의 **3글자 최소 규칙**에 막힌다.
//   → 한글 채움 문자 `U+3164` 를 **앞뒤 하나씩** 넣어 4글자로 만든다.
//     앞뒤 대칭이라 **폭이 얼마든 가운데**에 온다. (한쪽에만 넣으면 그만큼 쏠린다)
//
// ⚠️ **저장소가 맞아도 폰은 안 바뀐다.** 이 값은 **새 AAB 를 뽑아야** 반영된다.
//    지금 폰에 깔린 건 옛 AAB 라 계속 쏠려 보인다 — 고치는 길은 AAB 재빌드 하나뿐이다.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const FILL = 'ㅤ'                     // 한글 채움 문자(HANGUL FILLER)
const WANT = FILL + '한끼' + FILL         // 총 4글자 · 앞뒤 대칭
const show = (s) => [...s].map((c) => (c === FILL ? '␣(U+3164)' : c)).join(' ')

const p = join(ROOT, 'android/twa-manifest.json')
let m
try { m = JSON.parse(readFileSync(p, 'utf8')) } catch (e) {
  console.error(`⛔ android/twa-manifest.json 을 못 읽었다 — ${e.message}`); process.exit(1)
}
const got = m.launcherName ?? ''
const bad = []

if (got !== WANT) bad.push(`launcherName 이 다르다\n   있어야 할 것: [${show(WANT)}]  (${[...WANT].length}글자)\n   지금:         [${show(got)}]  (${[...got].length}글자)`)
// 개수를 따로도 센다 — 「눈으로 못 세는 것」이 사고의 원인이었으므로 숫자를 남긴다
const fills = [...got].filter((c) => c === FILL).length
if (fills !== 2) bad.push(`채움 문자(U+3164)가 ${fills}개다 — **앞뒤 하나씩 딱 2개**라야 가운데에 온다`)
if (got.startsWith(FILL) !== got.endsWith(FILL)) bad.push('채움 문자가 한쪽에만 있다 — 그만큼 반대로 쏠린다')

if (bad.length) {
  console.error('⛔ 런처명 게이트 실패\n')
  bad.forEach((b) => console.error(`   · ${b}`))
  console.error(`\n👉 고치는 법 = android/twa-manifest.json 의 launcherName 을`)
  console.error('   docs/_대기/런처명-앞뒤투명글자1개씩-총4글자.txt 값으로. ⛔웹·채팅에서 복사 금지.')
  process.exit(1)
}
console.log(`✅ 런처명 통과 — [${show(got)}] · 4글자 · 채움 문자 앞뒤 1개씩(대칭)`)
console.log('   ⚠️ 이 값은 **새 AAB 를 뽑아야** 폰에 반영된다. 지금 폰이 쏠려 보이는 건 옛 AAB 라서다.')
