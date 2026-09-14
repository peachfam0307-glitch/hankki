// ✍️✍️ 레시피 «원문»을 해요체로 통일한다 — 창업자 검수 2026-08-17
//
// 📮 창업자 = *"**다 문체이상 해요체로 바꾸기**"* → *"**여름꺼 3개 문체이상이야.**"*
//
// ⭐⭐⭐ **뿌리 = 앱은 멀쩡했고 «내가 보여준 판»이 틀렸다.**
//    앱은 `basics.js` 맨 아래에서 `politeSteps()` 로 **화면에 나갈 때 해요체로 바꾼다.**
//    그런데 내가 만든 검수판은 **원문을 그대로** 그렸다. 원문이 한다체인 편이 71편이라
//    창업자는 **앱에 없는 문제**를 세 편이나 짚느라 시간을 썼다.
//    📌 2026-08-16 「시원한 묵채 샘플」과 «같은 사고»다 — 실물이 아닌 걸 보여줬다.
//
// ⭐ 그래서 두 가지를 같이 한다:
//    ⑴ **원문 자체를 해요체로** → 원문 = 화면. 어느 쪽을 보여줘도 같아진다.
//    ⑵ 게이트(`check-steps` ⑤)가 **원문도 해요체인지** 본다 → 되돌아가면 배포가 막힌다.
//
// ⛔ `politeSteps` 는 «그대로 둔다» — 이미 깔린 폰이 저장한 옛 원문을 다듬는 안전망이다(규칙 18 ⓙ).
//    ✅ 이미 해요체인 문장을 다시 넣어도 안 바뀐다(실측 확인 — idempotent).
//
// ⚠️ 이 도구는 **한 번 쓰고 마는 게 아니다** — 앞으로 원문을 새로 쓸 때도 돌린다.
//    쓰기: node scripts/_문체통일-0817.mjs --확인   (미리보기 · 파일 안 건드림)
//          node scripts/_문체통일-0817.mjs          (실제로 고침)
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { politeSteps } from '../src/polish.js'

const APP = new URL('..', import.meta.url).pathname
const 길 = join(APP, 'src/data/basics.js')
const 미리보기 = process.argv.includes('--확인')

// 🔒 «화면이 안 바뀌었나»를 재려면 고치기 «전» 화면값을 먼저 떠야 한다.
//    ⛔ 같은 프로세스에서 두 번 import 하면 캐시라 같은 값이 나온다 → 자식 프로세스로 뽑는다.
const 화면값 = () => execFileSync(process.execPath, ['--input-type=module', '-e', `
  const { allBasicRecipes } = await import('${join(APP, 'src/data/basics.js')}?t=' + Math.random())
  process.stdout.write(JSON.stringify(allBasicRecipes.map((r) => [r.id, r.steps])))
`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })

const 전 = 화면값()

// ── 고치기 ────────────────────────────────────────────────────────
// ⛔ 통째 정규식으로 `steps: [ … ]` 를 잡으면 **블록 안 주석의 따옴표**에 걸려 망가진다
//    (오늘 창업자 검수 내용을 주석으로 넣어서 실제로 그런 줄이 생겼다).
//    ⭐ 그래서 «줄 단위»로 — steps 블록 안이면서, 주석이 아니고, 통째로 문자열인 줄만 바꾼다.
const 줄들 = readFileSync(길, 'utf8').split('\n')
let steps안 = false
let 바뀜 = 0
const 바뀐것 = []

for (let i = 0; i < 줄들.length; i++) {
  const l = 줄들[i]
  if (/^\s*steps:\s*\[\s*$/.test(l)) { steps안 = true; continue }
  if (steps안 && /^\s*\],\s*$/.test(l)) { steps안 = false; continue }
  if (!steps안) continue
  if (/^\s*\/\//.test(l)) continue                       // 주석 줄은 안 건드린다

  const m = l.match(/^(\s*)'((?:[^'\\]|\\.)*)',(\s*)$/)
  if (!m) continue
  const [, 들여, 안, 뒤] = m
  const 원 = 안.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  const 새 = politeSteps([원])[0]
  if (새 === 원) continue

  줄들[i] = `${들여}'${새.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}',${뒤}`
  바뀜++
  if (바뀐것.length < 8) 바뀐것.push(`   ${원.slice(0, 46)}\n     → ${새.slice(0, 46)}`)
}

console.log(`✍️ 원문 해요체 통일 — 바꿀 줄 ${바뀜}개`)
바뀐것.forEach((s) => console.log(s))
if (바뀜 > 8) console.log(`   … 외 ${바뀜 - 8}줄`)

if (미리보기) { console.log('\n(--확인 이라 파일은 안 건드렸다)'); process.exit(0) }
if (!바뀜) { console.log('\n✅ 이미 다 해요체다'); process.exit(0) }

writeFileSync(길, 줄들.join('\n'))

// ── 🔒 검증: «화면»이 한 글자도 안 바뀌었나 ───────────────────────
//    ⭐ 이게 이 도구의 심장이다. 원문만 바꾸고 화면이 달라지면 그건 «고친 게 아니라 망친 것»이다.
const 후 = 화면값()
if (전 === 후) {
  console.log(`\n✅ 원문 ${바뀜}줄을 바꿨는데 **화면은 한 글자도 안 바뀌었다** — 안전하다`)
  process.exit(0)
}
const a = JSON.parse(전)
const b = JSON.parse(후)
console.error('\n⛔⛔ 화면이 바뀌었다 — 되돌릴 것')
a.forEach(([id, s], i) => {
  if (JSON.stringify(s) !== JSON.stringify(b[i][1])) console.error(`   ${id}\n     전 ${JSON.stringify(s)}\n     후 ${JSON.stringify(b[i][1])}`)
})
process.exit(1)
