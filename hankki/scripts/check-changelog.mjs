// 📣 «버전을 올렸는데 유저 한 줄을 안 적었나» — 배포 게이트 (2026-09-17 신설)
//
// 📮 창업자 2026-09-17 = *"우리 업데이트 일지 유저들에게 알려줘야하는거 아닐까?"* → ②「안 적으면 배포가 죽는 게이트」로 확정.
//
// 🌲 왜 게이트인가 — `whatsnew.js` `APP_FEATURES` 는 «손으로 적는 자리»라 8/29 살구 하나 넣고 **185판 동안 0건**이었다.
//    규칙(「배포하면 소식에 적자」)은 있어도 샜다 → 장치로 만든다(규칙 19 · `check-basics-version` 과 같은 자리).
//
// 무엇을 보나 (다섯)
//   ① 배포 브랜치 원격판 `version.js` 와 견줘 **번호가 올랐는데** `CHANGELOG` 에 그 번호가 없으면 ⛔
//      (번호가 그대로면 = 문서·게이트만 바뀐 판 → 조용히 통과)
//   ② `v` 중복 ⛔ — 두 세션이 같은 번호를 쓰면 여기서 드러난다(2026-09-16 v13.64 가 실제로 그랬다)
//   ③ `when` 은 YYYY-MM-DD ＋ 오늘(KST) 이하 ⛔ — `git log` 를 UTC 로 읽어 적는 실수를 잡는다
//   ④ `user` 가 있으면 `who: '창업자'` ⛔ — 클로드가 지은 문장은 유저 눈에 못 간다(절대원칙 2026-09-15)
//   ⑤ `user` 에 유니코드 이모지 ⛔ (UI 이모지 금지 절대원칙)
//   ＋ `whatsnew.js` 가 `UPDATE_KIND` 를 알림 층(`openedAlert`)에서 빼는지 — 안 빼면 홈 「새로」가 배포마다 켜진다
//
// ⚠️ 정직하게 — `user: null` 남용(유저 눈에 보이는데 null 로 넘기기)은 기계가 못 잡는다.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { CHANGELOG, UPDATE_KIND } from '../src/data/changelog.js'
import { todayKST } from '../src/today.js'

const 뿌리 = new URL('../', import.meta.url)
const 배포 = 'origin/claude/chatgpt-conversation-link-kvn5ph'
const 번호 = (s) => (s.match(/APP_VERSION = '([^']+)'/) || [])[1]
const bad = []

// ② 중복
const seen = new Set()
for (const c of CHANGELOG) {
  if (seen.has(c.v)) bad.push(`\`${c.v}\` 가 두 번 적혔다 — 두 세션이 같은 번호를 썼나? 하나를 올려라`)
  seen.add(c.v)
}

// ③ 날짜 · ④ 주인 · ⑤ 이모지
const today = todayKST()
for (const c of CHANGELOG) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.when || '')) bad.push(`\`${c.v}\` when 이 YYYY-MM-DD 가 아니다: ${c.when}`)
  else if (c.when > today) bad.push(`\`${c.v}\` when(${c.when}) 이 오늘(${today})보다 뒤다 — UTC 로 읽었나?`)
  if (c.user) {
    if (c.who !== '창업자') bad.push(`\`${c.v}\` 유저 문장이 있는데 who 가 '창업자' 가 아니다 — 창업자가 확정한 문장만 나간다`)
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(c.user)) bad.push(`\`${c.v}\` user 에 이모지가 있다 — UI 이모지 금지`)
  }
}

// ① 번호가 올랐는데 줄이 없다
const 새 = 번호(readFileSync(new URL('src/version.js', 뿌리), 'utf8'))
let 옛 = null
try {
  옛 = 번호(execSync(`git show ${배포}:hankki/src/version.js`, { cwd: new URL('../..', import.meta.url).pathname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
} catch { /* 원격을 못 읽으면 ①만 건너뛴다 */ }
if (옛 && 새 && 옛 !== 새 && !seen.has(새)) {
  bad.push(
    `APP_VERSION 이 ${옛} → ${새} 로 올랐는데 \`src/data/changelog.js\` 에 \`${새}\` 줄이 없다.\n` +
    `   👉 유저가 보는 게 있으면  { v: '${새}', when: '${today}', user: '…한 줄…', who: '창업자', asc: true }\n` +
    `      유저 눈에 안 보이는 판이면  { v: '${새}', when: '${today}', user: null }`
  )
}

// ＋ 알림 층에서 빠지나
const wn = readFileSync(new URL('src/data/whatsnew.js', 뿌리), 'utf8')
if (!/openedAlert:[^\n]*UPDATE_KIND/.test(wn)) {
  bad.push(`whatsnew.js — \`openedAlert\` 가 \`${UPDATE_KIND}\` 를 안 뺀다 → 배포마다 홈 「새로」 알약·팝업이 켜진다`)
}

if (bad.length) {
  console.error(`\n⛔ 업데이트 소식 게이트 — ${bad.length}건\n`)
  bad.forEach((b) => console.error('  · ' + b + '\n'))
  process.exit(1)
}
const 최신 = CHANGELOG.find((c) => c.v === 새)
console.log(`📣 업데이트 소식 게이트 — ${새}${최신 ? (최신.user ? ` 「${최신.user}」` : ' (유저 눈엔 없음)') : ' (번호 그대로)'} ✅`)
