#!/usr/bin/env node
// 🙋‍♀️🙋‍♀️ 「누가 AI 다듬기를 시켰나」 — 2026-09-14
//
// 📮 창업자 = *"이것도 확실히 잴수있는 걸 만들어야해..."*
//
// ⛔⛔ 왜 = 다듬기는 **사람이 안 눌러도 «저절로» 돈다**(앱이 레시피를 열 때 실패한 편을 만회한다).
//    그래서 「오늘 16건」이 사람이 쓴 것인지 앱이 돈 것인지 못 갈랐다.
//    👉 **유료를 켤지·값을 얼마로 할지가 이 숫자에 달려 있다.**
//
// ⭐ 소스를 «읽어서» 잰다 — 워커를 실제로 부를 수 없고(우리 돈), 네 자리가 «갈려 있나»가 핵심이라서.
//    📌 실제로 나가는지는 `앱 → 워커` 두 쪽이 같은 글자를 쓰는지로 지킨다(아래 ④).

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => readFileSync(join(뿌리, p), 'utf8')

let 나쁨 = 0
const 잰다 = (참, 무엇, 값 = '') => {
  console.log(`  ${참 ? '✅' : '⛔'} ${무엇}${값 ? '  ' + 값 : ''}`)
  if (!참) 나쁨++
}

console.log('\n🙋‍♀️ 누가 시켰나\n')

const tidy = 읽기('src/tidy.js')
const app = 읽기('src/App.jsx')
const inbox = 읽기('src/screens/InboxScreen.jsx')
const detail = 읽기('src/screens/RecipeDetailScreen.jsx')
const worker = 읽기('ocr-proxy/worker-tidy.js')

// ── ① 앱이 까닭을 «실어 보낸다»
잰다(/까닭:\s*이번까닭/.test(tidy), '① 요청 본문에 까닭을 싣는다 (tidy.js)')
잰다(/\['user',\s*'auto'\]\.includes/.test(tidy), '① 모르는 값은 «모름» 으로 접는다 — ⛔막지 않는다')

// ── ② 사람이 «누른» 두 자리 = user
잰다(/까닭:\s*'user'/.test(inbox), '② 보관함 「AI로 다듬기」 단추 = user (InboxScreen)')
잰다(/까닭:\s*'user'/.test(detail), '② 상세 「다시 해보기」 단추 = user (RecipeDetailScreen)')

// ── ③ 앱이 «저절로» 도는 두 자리 = auto
//    ⛔⛔ 이 둘을 user 로 세면 「사람이 AI 를 쓴다」가 거짓으로 부푼다. 여기가 이 재현판의 핵심이다.
잰다(/까닭:\s*'auto'/.test(app), '③ 공유받기 직후 저절로 = auto (App.jsx)')
잰다(/까닭:\s*'auto'/.test(detail), '③ ⭐레시피 열 때 «저절로 만회» = auto (RecipeDetailScreen)')
잰다((detail.match(/까닭:\s*'(user|auto)'/g) || []).length === 2, '③ 상세 화면의 두 자리가 «갈려» 있다', JSON.stringify(detail.match(/까닭:\s*'(user|auto)'/g) || []))

// ── ④ 앱과 워커가 «같은 글자»를 쓴다 — 하나만 고치면 영영 '모름' 만 쌓인다
const 앱갈래 = new Set([...tidy.matchAll(/'(user|auto|retry)'/g)].map((m) => m[1]))
const 워커갈래 = worker.match(/\['user',\s*'auto',\s*'retry'\]\.includes/)
잰다(앱갈래.has('user') && 앱갈래.has('auto') && 앱갈래.has('retry'), '④ 앱이 세 갈래를 다 쓴다', [...앱갈래].join('·'))
잰다(!!워커갈래, '④ ⭐워커의 허용목록이 앱과 «같다» (user·auto·retry)')
잰다(/tr:\$\{ymd\}:\$\{갈\}/.test(worker), '④ 워커가 갈래별로 «따로» 센다')
잰다(/누가시켰나:\s*\{\s*사람이누름/.test(worker), '④ 통계 답에 「사람이누름」 이 한 줄로 나온다')

// ── ⑤ 재시도가 사람 수를 부풀리지 않는다
잰다(/한판\('retry'\)/.test(tidy), '⑤ ⭐재시도는 retry 로 «따로» 센다 — 안 그러면 한 사람이 2건이 된다')

// ── ⑥ 옛 앱을 «막지 않는다»
잰다(!/까닭[^\n]*return json\(\{\s*error/.test(worker), '⑥ ⛔까닭이 없다고 요청을 막지 않는다 (옛 앱 보호)')

console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 누가 시켰나 통과')
process.exit(나쁨 ? 1 : 0)
