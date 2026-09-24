#!/usr/bin/env node
// 🕳🧪 계측 구멍 셋 — 2026-09-22
//
// 📮 창업자 = *"요 며칠 통계에 레꾸자랑 보낸 사람있어?"* → *"혹시 다른 것들중에 안되는거 있나 좀 찾아봐"*
//
// 🔢 찾은 것 셋
//   ① 레꾸자랑을 보내는 길이 «넷»인데 한 길만 세고 있었다 → brag_shared 가 늘 0.
//      (9/21 에 고친 건 BragScreen 의 이름 겹침 하나뿐이었다 — 나머지 셋은 그대로였다)
//   ② `push_open`(알림 눌러 들어옴)이 «만들어만 놓고 부르는 곳이 0곳»이었다.
//   ③ 🌲 뿌리 = 계측-구멍검사가 `export function` 만 보고 `export const`(관문 17개)를 통째로 안 봤다.
//      ＝ 검사가 못 보는 꼴이 생기면, 그 꼴로 쓴 것은 전부 «안 재진 채» 늘어난다.
//
// ⛔ 되돌리면 여기서 죽는다.
import { readFileSync } from 'node:fs'

let 죽음 = 0
const 재다 = (이름, 받은, 바란) => {
  const ok = 받은 === 바란
  if (!ok) 죽음++
  console.log(`${ok ? '✅' : '⛔'} ${이름} — 받은 ${받은} · 바란 ${바란}`)
}
const 읽기 = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const 세기 = (글, 찾) => (글.match(new RegExp(찾, 'g')) || []).length

console.log('🕳 계측 구멍 — 12칸\n')

const brag = 읽기('../src/screens/BragScreen.jsx')
const detail = 읽기('../src/screens/RecipeDetailScreen.jsx')

// ═══ ① 레꾸자랑 — 보내는 길 «넷 다» 센다 ═══
재다('BragScreen 이 자랑보냄을 가져온다', /import \{[^}]*자랑보냄/.test(brag), true)
재다('RecipeDetail 이 자랑보냄을 가져온다', /import \{[^}]*자랑보냄/.test(detail), true)
// 🔢 BragScreen 2곳 = sendCover 하나 ＋ SendNowSheet onShared 하나 ＋ ShareDrawCard onShared 하나 = 3
// [2026-09-24] 자랑보냄('표지'|'랜덤') 으로 갈래를 넘기게 됐다 — 괄호 안 인자까지 센다
재다('BragScreen 이 자랑보냄을 부르는 곳', 세기(brag, "자랑보냄\\((?:'표지'|'랜덤')?\\)") >= 3, true)
// 🔢 RecipeDetail 2곳 = 꾸민 표지 ＋ onShared 둘 = 3
재다('RecipeDetail 이 자랑보냄을 부르는 곳', 세기(detail, "자랑보냄\\((?:'표지'|'랜덤')?\\)") >= 3, true)
재다('RecipeDetail 이 자랑고름을 부른다', 세기(detail, '자랑고름\\(\\)') >= 1, true)

// ⛔⛔ 같은 이름으로 «덮는» 사고를 다시 만들지 않는다 — 이게 9/21 버그의 뿌리였다
재다('BragScreen 에 자랑보냄 ref 가 없다', /const 자랑보냄 = useRef/.test(brag), false)
재다('RecipeDetail 에 자랑보냄 ref 가 없다', /const 자랑보냄 = useRef/.test(detail), false)

// ⛔ 조건을 넓히지 않는다 — 취소·사진저장(shared:false)에는 안 센다
재다('자랑보냄은 shared === true 자리에만', /shared === true\) \{ try \{ 자랑보냄/.test(brag) && /shared === true\) \{ try \{ 자랑보냄/.test(detail), true)

// ═══ ② push_open — 웹과 아이폰 둘 다 ═══
const sw = 읽기('../src/sw.js')
const app = 읽기('../src/App.jsx')
// 🍎 [2026-09-22] pushNative.js 는 «아이폰 갈래에만» 있다 — 배포(웹) 갈래엔 없다.
//   ⛔ 그래서 무턱대고 읽으면 웹 갈래에서 판이 «터진다». 있을 때만 잰다.
//   📌 이걸 몰라서 2026-09-22 에 실제로 한 번 죽었다(배포 갈래에 얹는 중에 드러났다).
let native = ''
try { native = 읽기('../src/pushNative.js') } catch { native = '' }
재다('서비스워커가 주소에 push 표를 남긴다', /searchParams\.set\('push', '1'\)/.test(sw), true)
재다('앱이 그 표를 읽고 알림으로들어옴을 부른다', /get\('push'\) !== '1'/.test(app) && /알림으로들어옴\(\)/.test(app), true)
재다('앱이 표를 지운다(두 번 안 세게)', /searchParams\.delete\('push'\)/.test(app), true)
// ⛔ 파일이 없는 갈래(웹)에서는 「없다」가 정답이다 — 그걸 실패로 세지 않는다.
if (native) 재다('아이폰은 애플 사건을 듣는다', /pushNotificationActionPerformed/.test(native), true)
else console.log('⏭ 아이폰 칸 건너뜀 — 이 갈래엔 pushNative.js 가 없다(웹 갈래)')

console.log(죽음 ? `\n⛔ ${죽음}칸 죽었다` : '\n✅ 12칸 통과')
process.exit(죽음 ? 1 : 0)
