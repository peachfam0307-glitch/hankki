// 📋 «창업자가 고른 것을 판이 «기억»하나» — 검수판 게이트
//
// ⭐⭐ 왜 (창업자 2026-08-18)
//   📮 *"아까 검수판에 저장기능 안넣어서 내가 삽질했는데 **지금 또 안넣었어** ㅋ 내가 말해서 그때 넣음. 하.."*
//   ⛔ **두 번 같은 자리다.** 그리고 두 번 다 «창업자가 말해서» 넣었다 — 그게 곧 규칙 8 위반이다
//      (단순반복·시행착오는 클로드가. 창업자는 완성본 판단만).
//
// 🔢 그날 실측 = 판 도구 7개 중 **6개**에 「고른 것을 기억하는 장치」가 없었다.
//   ⚠️ `localStorage` 라는 «낱말»은 여섯 다 있었다 — 그건 **앱 흉내용 시드 주입**(addInitScript)이지
//      «창업자 선택 저장»이 아니다. **낱말만 세면 여섯 다 통과한다.**
//      📌 반복 실수 패턴 🅰 그대로 — 「검사가 «무엇을» 보는지」가 틀리면 초록불이 거짓말이 된다.
//   ✅ 그래서 **판이 «만들어내는 HTML» 안에** 기억 장치가 있나를 본다. 거기 있어야 폰에서 산다.
//
// 무엇이 「기억」인가 = 새로고침·다시 열기 뒤에도 **고른 것이 남아 있는 것.**
//   판은 창업자가 «폰에서» 본다. 스크롤하다 전화가 오거나 링크를 잘못 누르면 처음부터 다시 고른다.
//
// ⛔ 시끄러우면 죽는다 → **고를 것이 있는 판만** 본다.
//   보여주기만 하는 판(그림 나열·비교 캡처)은 기억할 게 없다. 라디오/체크/버튼이 있는 판만 대상.
//
// 쓰기:  node hankki/scripts/check-panmemo.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(APP, 'scripts')

// 판 도구 = `_판-` 으로 시작하는 것 (이 저장소가 실제로 쓰는 이름 규칙)
const files = readdirSync(DIR).filter((f) => /^_판-.*\.m?js$/.test(f))

// ── 판이 «만들어내는» HTML 덩어리만 뽑는다 ────────────────────────────
//   ⛔ 파일 전체를 보면 안 된다 — playwright 로 «앱»에 시드를 넣는 코드까지 세어 거짓 통과가 난다.
const htmlBlocks = (t) =>
  (t.match(/`[^`]{200,}`/gs) || []).filter((b) => /<(div|html|body|label|input|button)/i.test(b))

// 「고를 것이 있나」 = 창업자가 누르는 것
const PICKABLE = /<input[^>]*type=["']?(radio|checkbox)|<button|onclick=|addEventListener\(\s*['"]click/i
// 「기억하나」 = 다시 열어도 남는 자리
// ⛔⛔ 첫 판은 `localStorage` 만 찾았다 → **아티팩트 판을 「저장 없음」으로 잘못 잡았다.**
//    이 저장소의 검수판은 `<artifact-sync>` 로 감싸면 아티팩트 런타임이 «손짓»을 저장한다.
//    📌 만들자마자 **반복 실수 패턴 🅰(검사가 «무엇을» 보는지 틀렸다)를 내가 또 밟은 것**이다.
//       규칙 12 로 실물을 열어보고서야 잡았다 — 안 열어봤으면 창업자에게 「없다」고 잘못 보고했다.
const MEMORY = /localStorage|sessionStorage|indexedDB|artifact-sync/i

const bad = []
const ok = []
const skip = []            // ⭐ 건너뛴 것도 «밝힌다» — 조용히 넘어가면 「거짓 통과」와 구분이 안 된다
for (const f of files) {
  let t = ''
  try { t = readFileSync(join(DIR, f), 'utf8') } catch { continue }
  const blocks = htmlBlocks(t)
  // ⛔ 이름이 `_판-` 이어도 HTML 을 «안 만드는» 것이 섞여 있다 — 앱을 띄워 찍는 캡처 도구다.
  //    거기엔 «고를 것»이 없으니 기억할 것도 없다. 건너뛰되 **왜 건너뛰었는지 적는다.**
  if (!blocks.length) { skip.push([f, 'HTML 을 안 만든다(앱 캡처 도구)']); continue }
  const html = blocks.join('\n')
  if (!PICKABLE.test(html)) { skip.push([f, '고를 것이 없다(보여주기만)']); continue }
  if (MEMORY.test(html)) ok.push(f)
  else bad.push(f)
}

console.log(`\n📋 검수판 — 창업자가 «고른 것»을 기억하나\n`)
if (!files.length) { console.log('   (판 도구가 없다)\n'); process.exit(0) }

if (!bad.length) {
  console.log(`   ✅ 고를 것이 있는 판 ${ok.length}개 — 전부 기억한다\n`)
  process.exit(0)
}

console.log(`   🔢 판 ${files.length}개 — 본 것 ${ok.length + bad.length} · 건너뛴 것 ${skip.length}`)
for (const [f, why] of skip) console.log(`      · ${f}  — ${why}`)
if (ok.length) console.log(`   ✅ 기억한다 — ${ok.join(' · ')}`)
// ⛔⛔ 옛 판까지 배포를 막으면 «시끄러운 게이트»가 되어 아무도 안 본다(이 저장소 원칙).
//    ✅ **새로 손댄 판만** 막는다 — 앞으로 만드는 것에 습관이 붙으면 옛것은 저절로 줄어든다.
let 새것 = new Set()
try {
  const { execFileSync } = await import('node:child_process')
  // ⛔ core.quotepath 를 끄지 않으면 **한글 파일명이 \\355\\214\\220 로 이스케이프**돼 하나도 안 맞는다.
  //    2026-08-18 에 그래서 «어제 만든» _판-검수.mjs 가 「옛 판」으로 빠졌다 — 거짓 안전이었다.
  const out = execFileSync('git', ['-C', APP, '-c', 'core.quotepath=false', 'log', '--since=14 days ago', '--name-only', '--pretty=format:'],
    { encoding: 'utf8', maxBuffer: 8 << 20 })
  새것 = new Set(out.split('\n').map((l) => l.trim().replace(/^.*\//, '')).filter(Boolean))
  // ⛔⛔ git log 만 보면 **아직 커밋 안 된 판**이 빠진다 — 그게 «지금 만드는 것»이라 제일 위험한데.
  //    2026-08-18 규칙 12 로 지뢰를 심어보니 그대로 새어 나갔다. status 도 같이 본다.
  const st = execFileSync('git', ['-C', APP, '-c', 'core.quotepath=false', 'status', '--porcelain'],
    { encoding: 'utf8', maxBuffer: 8 << 20 })
  for (const l of st.split('\n')) {
    const p = l.slice(3).trim().replace(/^"|"$/g, '').replace(/^.*\//, '')
    if (p) 새것.add(p)
  }
} catch { /* git 이 없으면 전부 막는다(안전한 쪽) */ 새것 = new Set(bad) }
// 🗂 예외 — «이유와 함께»만 (이 저장소 방식: cutout-allow · kst-allow 와 같다)
let 허용 = new Set()
try {
  const a = JSON.parse(readFileSync(join(DIR, 'panmemo-allow.json'), 'utf8'))
  허용 = new Set((a.허용 || []).map((x) => x.파일))
} catch { /* 없으면 예외 0개 */ }
const 막을것 = bad.filter((f) => 새것.has(f) && !허용.has(f))
const 옛것 = bad.filter((f) => !새것.has(f))

console.log(`\n   ⛔ ${bad.length}개 — 고를 것은 있는데 **기억하는 자리가 없다**\n`)
for (const f of 막을것) console.log(`      🔴 scripts/${f}   ← 최근 14일에 손댄 것. **이건 막는다**`)
for (const f of 옛것) console.log(`      🟡 scripts/${f}   (옛 판 · 세기만 한다)`)
console.log(`
   📮 창업자 2026-08-18 = *"검수판에 저장기능 안넣어서 내가 삽질했는데 지금 또 안넣었어"*
   ⭐ 창업자는 판을 **폰에서** 본다. 전화가 오거나 링크를 잘못 누르면 **처음부터 다시 고른다.**

   ✅ 고치는 법 — 판 HTML 안에 세 줄이면 된다:
      · 누를 때  localStorage.setItem('판이름', JSON.stringify(고른것))
      · 열 때    JSON.parse(localStorage.getItem('판이름') || '{}') 로 되살리기
      · 「처음부터」 단추 하나 (지우기)

   ⛔ 앱에 시드를 넣는 addInitScript 는 «이것과 다르다» — 그건 앱 흉내지 창업자 선택 저장이 아니다.
`)
process.exit(막을것.length ? 1 : 0)
