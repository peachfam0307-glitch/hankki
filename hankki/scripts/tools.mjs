// 🗺 «이거 만드는 도구 이미 있나?» — 만들기 «전»에 저장소를 먼저 본다.
//
// ⭐⭐ 왜 (창업자 2026-08-18 *"할일에 전에 했던거 안했다고 또 들고오고"*)
//   그날 하루에 클로드가 «세 번» 헛돌았다:
//     ⑴ 「한 곳 확정 ↔ 다른 곳 대기」를 잡는 게이트를 만들려 했다 → `doc-guard --decided` 가 «이미» 있었다
//     ⑵ EU·DSA 를 조사해 「새로 알아냈다」고 보고했다 → 문서 114줄에 «이미» 있었다
//     ⑶ 「집 주소 공개」를 새 위기처럼 꺼냈다 → 8/17 에 «이미» 확정돼 있었다
//   ⛔ 셋 다 원인이 같다 — **저장소에 무엇이 있는지 모른다.**
//
// 🔢 실측 = `scripts/` 에 도구가 **176개**다. 목록이 어디에도 없었다.
//   📌 그러니 「길어서 안 읽는 것」이 아니라 **「어디에 뭐가 있는지 몰라서」** 안 읽는 것이다.
//
// ⭐ 손으로 관리하지 «않는다» — 각 파일의 **첫 주석 한 줄**을 설명으로 쓴다.
//   그래서 도구를 새로 만들면 저절로 목록에 뜨고, 목록이 낡을 수가 없다.
//   (2026-08-13 창업자 지적 *"목록을 사람이 관리하면 반드시 낡는다"* 와 같은 방식)
//
// 쓰기
//   node hankki/scripts/tools.mjs              갈래별 요약 (몇 개씩 있나)
//   node hankki/scripts/tools.mjs 확정          «확정» 이 들어간 도구만
//   node hankki/scripts/tools.mjs --all        전부
//   node hankki/scripts/tools.mjs --gate       배포를 «막는» 것만 (smoke 체인)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '..')

// ── smoke 체인에 물린 도구 = 「깨지면 배포가 막히는 것」 ──
let SMOKE = ''
try { SMOKE = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')).scripts?.smoke || '' } catch { /* 없으면 표시만 못 한다 */ }

// ── 갈래 — 이름 앞머리로 가른다(이 저장소가 실제로 쓰는 규칙) ──
const KIND = [
  { re: /^check-/,  tag: '🔒', name: '게이트', why: '깨지면 배포가 막힌다' },
  { re: /^_repro-/, tag: '🧪', name: '재현판', why: '그 사고가 다시 나는지 잰다' },
  { re: /^_probe-/, tag: '🔬', name: '재봄', why: '화면을 실제로 재서 값을 낸다' },
  { re: /^test-/,   tag: '🧫', name: '검사', why: '기능이 도는지 본다' },
  { re: /^_shot-/,  tag: '📸', name: '캡처', why: '앱을 띄워 눈으로 볼 판을 찍는다' },
  { re: /^_판-/,    tag: '📋', name: '검수판', why: '창업자가 폰에서 볼 판을 만든다' },
  // ⚠️ 「한번쓴것」은 «찾을 때만» 보인다 — 갈래 요약에서 빼야 목록이 안 흐려진다(2026-08-18 재검수)
  { re: /^_/,       tag: '🛠', name: '한번쓴것', why: '그날 일회용 · 요약에선 숨긴다', quiet: true },
  { re: /./,        tag: '⚙️', name: '상시도구', why: '언제든 부르는 것' },
]
const kindOf = (f) => KIND.find((k) => k.re.test(f))

// ── 설명 = 파일 «첫 주석 한 줄» / 찾기 = «머리 주석 덩어리 전부» (손으로 안 적는다) ──
//   ⛔⛔ 첫 판은 «첫 한 줄»만 찾았다 → 정작 그날 찾던 `doc-guard --decided` 가 **안 나왔다.**
//      그 파일의 첫 줄엔 「확정」이 없고, 쓰는 법 주석 아래에 있었기 때문이다.
//      📌 만든 그 자리에서 규칙 12 로 걸렸다 — **「잡나」를 안 재봤으면 또 헛돌 뻔했다.**
const headOf = (path) => {
  let t = ''
  try { t = readFileSync(path, 'utf8') } catch { return { desc: '', head: '' } }
  const lines = t.split('\n')
  const head = []
  let desc = ''
  for (const ln of lines.slice(0, 60)) {
    const m = ln.match(/^\s*(?:\/\/|#)\s?(.*)$/)
    if (!m) { if (head.length && ln.trim() && !/^\s*(import|const|let|from)/.test(ln)) break; if (head.length) break; continue }
    const s = m[1].trim()
    head.push(s)
    if (!desc && s && !/^[-=─━]+$/.test(s)) desc = s.replace(/\s+/g, ' ').slice(0, 96)
  }
  return { desc, head: head.join(' ') }
}

const files = readdirSync(join(APP, 'scripts'))
  .filter((f) => /\.(mjs|js)$/.test(f))
  .sort()

const rows = files.map((f) => {
  const k = kindOf(f)
  const h = headOf(join(APP, 'scripts', f))
  return { f, ...k, desc: h.desc, head: h.head, smoke: SMOKE.includes(`scripts/${f}`) }
})

// ── 인자 ──
const args = process.argv.slice(2)
const wantAll = args.includes('--all')
const wantGate = args.includes('--gate')
const words = args.filter((a) => !a.startsWith('--'))

let show = rows
if (wantGate) show = rows.filter((r) => r.smoke)
if (words.length) {
  const w = words.map((x) => x.toLowerCase())
  show = show.filter((r) => w.every((x) => (r.f + ' ' + r.head).toLowerCase().includes(x)))
}

const line = (r) => `  ${r.tag} ${r.smoke ? '🚦' : '  '} ${r.f}\n        ${r.desc || '(설명 주석 없음)'}`

// ── 아무 인자도 없으면 «갈래 요약»만 — 176줄을 통째로 쏟지 않는다 ──
if (!words.length && !wantAll && !wantGate) {
  console.log(`\n🗺 이 저장소의 도구 ${rows.length}개 — **만들기 «전»에 여기부터**\n`)
  for (const k of KIND) {
    const n = rows.filter((r) => r.name === k.name).length
    if (!n || k.quiet) continue
    console.log(`  ${k.tag} ${k.name.padEnd(6)} ${String(n).padStart(3)}개   ${k.why}`)
  }
  const g = rows.filter((r) => r.smoke).length
  console.log(`\n  🚦 그중 ${g}개는 **smoke 체인**에 물려 있다 — 깨지면 배포가 막힌다.`)
  console.log(`
  👉 찾기   node hankki/scripts/tools.mjs 확정        «확정»이 들어간 도구
     막는것 node hankki/scripts/tools.mjs --gate     배포를 막는 것만
     전부   node hankki/scripts/tools.mjs --all

  ⛔ **「없다」고 말하기 «전»에 이걸 돌린다.** 2026-08-18 에 세 번 헛돌았다 —
     만들려던 게 이미 있었고(--decided), 조사한 게 문서에 있었고, 위기라 한 게 이미 확정이었다.\n`)
  process.exit(0)
}

if (!show.length) {
  console.log(`\n🗺 «${words.join(' ')}» — 이름·설명에 그 말이 든 도구가 없다.`)
  console.log(`   ⚠️ 말을 바꿔 한 번 더: 검수·판정·확정·대기·개수·날짜·자르기\n`)
  console.log(`   ⛔ 그래도 없으면 「내가 아직 못 찾았다」이지 「없다」가 아니다 — \`--all\` 로 훑어볼 것.\n`)
  process.exit(0)
}

// ⭐⭐ [2026-09-03] **한 갈래당 몇 개까지만 «설명까지» 찍는다.**
//    📮 창업자 = *"토큰도 너무 빨리 닳고, 대화 진행도 안되고 스트레스받더라고..."*
//    🔢 실측 = `tools.mjs "카드"` 가 79개를 설명까지 전부 찍어 **13,031 B**.
//       ask-guard 가 «매번 돌리라»고 시키는 도구라, 질문 열 번이면 이것만 130KB 가 대화에 쌓인다.
//    ⭐ 도구를 찾는 데 필요한 건 «이름»이지 설명 전문이 아니다. 넘치면 이름만 줄줄이 준다.
//    ⛔ 잘라내지 «않는다» — 개수도 이름도 다 보여준다. `--전부` 면 설명까지 그대로.
const 전부 = args.includes('--전부') || args.includes('--all')
const 한갈래 = 4
console.log(`\n🗺 ${show.length}개${words.length ? ` — «${words.join(' ')}»` : ''}${wantGate ? ' (배포를 막는 것)' : ''}\n`)
let 접힘 = 0
for (const k of KIND) {
  const g = show.filter((r) => r.name === k.name)
  if (!g.length) continue
  console.log(`  ── ${k.tag} ${k.name} ${g.length}개 — ${k.why}`)
  const 보일 = 전부 ? g : g.slice(0, 한갈래)
  for (const r of 보일) console.log(line(r))
  if (g.length > 보일.length) {
    const 나머지 = g.slice(보일.length).map((r) => r.f).filter(Boolean)
    접힘 += 나머지.length
    console.log(`     … ${나머지.length}개 더 (이름만): ${나머지.join(' · ')}`)
  }
  console.log('')
}
console.log(`  🚦 = smoke 체인(배포를 막는다)`)
if (접힘) console.log(`  📌 설명을 접은 게 ${접힘}개 — 전문이 필요하면 \`--전부\``)
console.log('')
