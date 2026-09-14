// ⏰⏰⏰ **「오늘(KST)」을 «한 곳»에서만 만들게 강제한다 — 배포 게이트** (창업자 절대원칙 2026-08-17)
//
// 📮 창업자 원문 = *"한국시간은 정확하게 고쳐. **반복되지않게. 절대원칙. 강제할수있게 만들어**"*
//
// ⛔⛔ **왜 규칙이 아니라 장치인가 — 규칙으론 이미 두 번 샜다.**
//    `CLAUDE.md` 에 *"⏰ 모든 날짜·시각 기준 = 한국시간(KST, UTC+9)"* 라고 **오래 적혀 있었다.**
//    그런데도 날짜 만드는 공식이 **네 곳에 흩어졌고 셋이 틀렸다.** 적어두는 걸로는 안 됐다.
//
// ⛔ **뿌리 = `getTimezoneOffset()` 을 더한 것.** 그러면 KST 폰(−540)에서 +9시간이 «상쇄»돼
//    0~9시엔 어제 날짜가 나온다. **내 컨테이너(UTC)에선 멀쩡히 맞아서 영영 안 들킨다.**
//
// ⭐ 이 게이트가 보는 것 셋:
//    ① `getTimezoneOffset` 이 «코드»에 있으면 ⛔ (주석은 안 본다 — 경위를 적어두려고 쓴다)
//    ② `toISOString().slice(0, 10)` 은 **`src/today.js` 안에서만** — 나머지는 `todayKST()` 를 부른다
//    ③ `new Date(… toLocaleString(… Asia/Seoul …))` 로 «KST Date 를 만드는» 꼼수 ⛔
//       (문자열을 다시 파싱하면 «로컬 시간대»로 읽혀 KST 머신에서 또 어긋난다 — 같은 뿌리의 버그다)
//
// 🚪 예외는 `scripts/kst-allow.json` 에 **이유와 함께.** ⛔이유 없이 늘리지 말 것.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const APP = new URL('..', import.meta.url).pathname
const 예외 = JSON.parse(readFileSync(join(APP, 'scripts/kst-allow.json'), 'utf8'))
const 봐준다 = new Map(예외.허용.map((e) => [e.파일, e.이유]))

// ⛔ 주석은 «코드»가 아니다 — 「옛 공식은 이랬다」고 적어둔 설명을 진짜 코드로 읽어 실패한 적이 있다
//    (2026-08-16 `check-hookinline` · 2026-08-17 재현판 · **그리고 이 게이트도 만들자마자 밟았다**)
//    ⭐ 줄번호를 지키려고 «빈 줄로 바꾼다» — 지우면 줄번호가 밀려 어디인지 못 짚는다.
//
// ⛔⛔ **만들고 바로 오탐이 났다 — 「줄 «끝»에 붙은 주석」을 안 봤다.**
//    `export const BASICS_VERSION = 65 // … getTimezoneOffset 을 더해 …` 이 줄은
//    **코드로 시작하니 「주석 줄」에 안 걸리는데** 정작 금지어는 뒤쪽 설명에 있었다.
//    ⭐ 그래서 **줄 끝 `//` 뒤도 잘라낸다.** 단 문자열 안의 `//`(URL)은 자르면 안 되니
//       먼저 문자열 «속»을 같은 길이로 덮어 위치를 지킨 뒤 자른다.
//    📌 규칙 12 그대로 — 만든 게이트는 «돌려봐야» 무엇을 보는지 알 수 있다.
const 문자열덮기 = (l) =>
  l.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g,
    (m) => m[0] + 'x'.repeat(Math.max(0, m.length - 2)) + m[m.length - 1])

const 코드만 = (s) => s.split('\n').map((l) => {
  if (/^\s*(\/\/|\*|\/\*)/.test(l)) return ''            // 통째로 주석인 줄
  const i = 문자열덮기(l).indexOf('//')                   // 줄 끝에 붙은 주석
  return i === -1 ? l : l.slice(0, i)
})

// ── 훑을 파일 모으기 ────────────────────────────────────────────────
const 볼것 = []
const 훑기 = (dir, 확장) => {
  for (const n of readdirSync(join(APP, dir))) {
    const p = join(dir, n)
    if (n.startsWith('.') || n === 'node_modules' || n === '_archive' || n === 'assets') continue
    if (statSync(join(APP, p)).isDirectory()) { 훑기(p, 확장); continue }
    if (확장.some((e) => n.endsWith(e))) 볼것.push(p)
  }
}
훑기('src', ['.js', '.jsx'])
훑기('scripts', ['.mjs', '.js'])

// ⛔⛔ **첫 판이 시끄러웠다 — 「한 줄에 둘 다 있으면」으로 세서 멀쩡한 코드 셋을 잡았다.**
//   `new Date(entry.at).toLocaleDateString('ko-KR')` = 저장된 시각을 «표시»하는 것이고
//   `new Date().toLocaleString('ko-KR', {timeZone})` = 사람이 읽을 시각을 찍는 것이다. 둘 다 맞다.
//   ⭐ 진짜 꼼수는 **`toLocale…` 의 결과가 `new Date(…)` 의 «인자 안»에 들어간 것**이다
//      (문자열을 다시 파싱하면 로컬 시간대로 읽힌다). 그래서 «괄호 균형»으로 인자 범위를 재서 본다.
//   📌 시끄러운 게이트는 죽은 게이트다.
const 되파싱 = (l) => {
  let i = 0
  while ((i = l.indexOf('new Date(', i)) !== -1) {
    let 깊이 = 0
    let j = i + 8
    for (; j < l.length; j++) {
      if (l[j] === '(') 깊이++
      else if (l[j] === ')') { 깊이--; if (깊이 === 0) break }
    }
    if (/toLocale(String|DateString)/.test(l.slice(i + 9, j))) return true
    i = j > i ? j : i + 9
  }
  return false
}

let bad = 0
const 잡힘 = []
const no = (파일, 줄, 왜, 글) => {
  잡힘.push({ 파일, 줄, 왜, 글 })
  bad++
}

const 한곳 = 'src/today.js'

for (const 파일 of 볼것) {
  const 줄들 = 코드만(readFileSync(join(APP, 파일), 'utf8'))
  const 봐줄이유 = 봐준다.get(파일)

  줄들.forEach((l, i) => {
    const 줄 = i + 1
    const 글 = l.trim().slice(0, 90)

    // ① 뿌리 — 오프셋 더하기
    if (/getTimezoneOffset/.test(l)) {
      if (봐줄이유) return
      no(파일, 줄, '⛔ getTimezoneOffset — 2026-08-17 사고의 뿌리다. KST 폰에서 +9시간이 상쇄된다', 글)
      return
    }

    // ③ KST 문자열을 다시 Date 로 파싱하는 꼼수
    if (되파싱(l)) {
      if (봐줄이유) return
      no(파일, 줄, '⛔ KST 문자열을 다시 Date 로 파싱 — 「로컬 시간대」로 읽혀 KST 머신에서 또 어긋난다', 글)
      return
    }

    // ② 날짜 문자열 만들기 — today.js 안에서만
    if (/toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(l)) {
      if (파일 === 한곳) return
      if (봐줄이유) return
      no(파일, 줄, `⛔ 날짜를 여기서 만든다 — 「${한곳}」의 todayKST() 를 부를 것`, 글)
    }
  })
}

console.log(`⏰ 「오늘(KST)」은 «한 곳»에서만 — ${볼것.length}개 파일`)

if (!bad) {
  console.log(`   ✅ 날짜를 만드는 곳 = ${한곳} 하나 (예외 ${봐준다.size}개는 이유가 적혀 있다)`)
  process.exit(0)
}

for (const b of 잡힘) console.log(`   ${b.파일}:${b.줄}\n      ${b.왜}\n      ${b.글}`)
console.log(`\n⛔⛔ ${bad}곳 — 배포를 막는다.`)
console.log(`   👉 고치는 법 = import { todayKST } from '<상대경로>/today.js'  →  todayKST()`)
console.log(`   👉 정말 예외라면 scripts/kst-allow.json 에 «이유와 함께» 적을 것 (⛔이유 없이 늘리지 말 것)`)
process.exit(1)
