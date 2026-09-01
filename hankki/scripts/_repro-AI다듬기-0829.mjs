// 【✅ 배포됨 v11.81 · 2026-08-29 · smoke 게이트】
// 🤖🤖 「AI 가 죽어도 앱이 «멀쩡한가»」 — 1단계 안전판 (2026-08-29)
//
// 📮 창업자 = *"이게 중요해.. 우리 앱 핵심기능이니까"* · *"카운트 잘 되도록해줘.. 그게 되게 중요해"*
//    → 확정 = **ⓗ 사진 경로만 먼저 AI**(갈래 여덟 검토 · docs/AI다듬기-만들기전-리서치-2026-08-28.md 맨 아래)
//
// ⭐⭐⭐ **이 판의 심장 = 「AI 가 실패해도 지금과 똑같이 나오나」다.**
//    AI 는 «더 좋게 하는 것»이지 «되게 하는 것»이 아니다. 3층 구조의 1층(규칙 파서)이 늘 살아 있어야 한다.
//    ⛔ 그래서 이 판은 «AI 가 잘 되는지»를 재지 않는다 — 그건 창업자가 놀이터에서 이미 쟀다(11/12).
//       여기서 재는 것은 **「AI 가 안 될 때 앱이 안 나빠지나」**다.
//
// ⛔⛔ **이 컨테이너는 Cloudflare AI 를 못 부른다**(api.cloudflare.com = 차단 · 2026-08-28 실측).
//    → 그래서 **워커를 흉내내지 않는다.** 대신 `tidy.js` 가 «부르는 자리»를 가로채
//       ⑴응답 없음 ⑵느림 ⑶쓰레기 답 ⑷정상 답 을 만들어 앱 반응을 본다.
//    ⭐ 절대원칙 30 — 앱 코드(`EditorScreen`·`tidy.js`)는 «진짜»를 쓰고, 바깥 세계만 흉내낸다.
//
// 🔢 재는 것 일곱
//   ① `TIDY_URL` 이 비어 있으면 **fetch 를 아예 안 부른다**   — 배포해도 아무 일이 안 나야 한다
//   ② AI 가 죽어도(네트워크 오류) **재료·걸음이 규칙 파서 결과 그대로**
//   ③ AI 가 «빈 껍데기»를 주면 **안 쓴다**                    — 쓰면 지금보다 «나빠진다»
//   ④ AI 가 느리면 **12초에 끊고** 규칙 파서로                  — 유저를 하염없이 기다리게 하지 않는다
//   ⑤ AI 가 정상 답을 주면 **그 값이 칸에 들어간다**
//   ⑥ AI 가 제목만 주면 **재료·걸음은 규칙 파서 것이 남는다**   — 「있는 쪽이 이긴다」
//   ⑦ ⭐**열쇠를 «두 번» 안 깎는다**                          — 카운트가 갈리면 안 된다(창업자 지시)
//
// 🧪 규칙 12 = `tidy.js` 의 「빈 껍데기면 안 쓴다」를 지우면 ③이 죽는다.
//    `EditorScreen` 의 「AI 가 준 것만 골라 덮는다」를 통째 덮기로 바꾸면 ⑥이 죽는다.
//    `tidy.js` 의 `TIMEOUT_MS` 를 없애면 ④가 죽는다.
//
// 실행: node scripts/_repro-AI다듬기-0829.mjs
// ⛔ (dist 신선도 검사)를 «안» 부른다 — 이 판은 화면을 안 띄우고
//    소스와  자체만 돌린다. 부르면 소스를 고칠 때마다 빌드해야 해서
//    규칙 12(고친 걸 되돌려 보기)를 돌릴 수가 없다.
import { readFileSync } from 'node:fs'

let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(이름, 조건, 덧말 = '') {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}${덧말 ? '  ' + 덧말 : ''}`)
  return !!조건
}

const ROOT = new URL('..', import.meta.url).pathname
const tidySrc = readFileSync(ROOT + 'src/tidy.js', 'utf8')
const edSrc = readFileSync(ROOT + 'src/screens/EditorScreen.jsx', 'utf8')
const appSrc = readFileSync(ROOT + 'src/App.jsx', 'utf8')   // ⭐창업자가 실제로 쓰는 문(공유받기·갤러리)

console.log('\n── ⓐ 소스가 지켜야 할 약속 ──')

// ① 배포해도 안전한가 — 주소가 비어 있으면 아무 일도 안 한다
chk('① TIDY_URL 이 비면 fetch 를 안 부른다',
  /if\s*\(!TIDY_URL\)/.test(tidySrc) && /return null/.test(tidySrc),
  '(주소를 안 넣은 채 배포해도 지금과 똑같이 돈다)')

// ⑦ 열쇠를 여기서 안 깎는다 — ⭐카운트가 한 곳에서만 돌아야 한다
// ⛔⛔ **주석을 «걷어내고» 본다.** 처음엔 그냥 grep 했다가 파일 «주석»에 적어둔
//    「열쇠를 여기서 안 깎는다」가 걸려 «고쳐놓고도 빨간불»이 났다.
//    📌 CLAUDE.md 에 여러 번 적어둔 함정인데 또 밟았다(규칙 18 ⓘ — 검사가 «무엇을» 보는지).
const 코드만 = tidySrc.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
const 열쇠흔적 = /consume|saveOcrLeft|deductKey|useKey\s*\(|열쇠/.test(코드만)
chk('⑦ tidy.js 가 열쇠를 «안» 깎는다', !열쇠흔적,
  '(사진 경로는 ocr.js 가 이미 깎았다 — 두 곳에서 세면 반드시 어긋난다)')

// ④ 시간 제한이 있다
// ⛔⛔ 상한을 20초로 «손으로» 적어뒀다가 2026-08-29 에 게이트가 맞게 걸렸다 —
//    실측이 24.3초(Cloudflare 로그)라 30초로 올리자 이 칸이 죽었다.
//    ⭐ 그때 「검사가 시끄럽다」고 상한을 없애지 않았다. 이 칸이 지키려는 건 «값»이 아니라
//       **「유저를 하염없이 기다리게 하지 않는다」**이고 그건 여전히 옳다.
//    ✅ 실측(24.3초)에 여유를 얹어 **35초**로 올렸다.
//
// ⭐⭐ **[2026-08-29 오후 · 이 칸의 «뜻»이 바뀌었다 — 90초로 올린다]**
//    같은 날 오후에 30초짜리도 죽었다(창업자 폰 = `기본 정리예요(timeout)`). 그때 또 숫자만 올렸으면
//    다음에 또 걸렸을 것이다 — **뿌리는 숫자가 아니라 「기다린다」는 구조였다.**
//    ✅ 그래서 두 문(`App.jsx` 공유받기 · `EditorScreen` 캡처)을 **기다리지 않게** 고쳤다
//       (규칙 파서로 «즉시» 채우고 AI 는 뒤에서 → 갈아끼운다).
//    📌 그러니 이 값은 이제 **「유저를 얼마나 세워두나」가 아니라 「AI 에게 얼마나 주나」**다.
//       세워두는 시간이 0초라 90초까지 줘도 유저가 잃는 게 없다.
//    ⛔ **그래도 상한은 «안» 없앤다** — 안 끊으면 요청이 영영 안 닫히고 워커 통만 먹는다.
//    ⛔⛔ **이 칸이 또 죽으면 숫자를 올리기 «전»에 아래 ⑧을 먼저 본다** — 「기다리지 않나」가 참인데도
//       90초를 넘긴다면 그건 시간 문제가 아니라 모델·워커 문제다.
const m = tidySrc.match(/TIMEOUT_MS\s*=\s*(\d+)/)
chk('④ 시간 제한이 있고 90초 이하다', !!m && Number(m[1]) <= 90000, m ? `(${m[1]}ms)` : '(없다)')
chk('④-b 끊는 장치를 실제로 쓴다(AbortController)',
  /AbortController/.test(tidySrc) && /signal:/.test(tidySrc))

// ③ 빈 껍데기 방어
chk('③ 재료도 걸음도 없으면 «안 쓴다»',
  /!결과\.ingredients\.length\s*&&\s*!결과\.steps\.length/.test(tidySrc),
  '(AI 가 빈 JSON 을 주면 규칙 파서가 낫다)')

// ② 실패해도 안 던진다
// ⛔ [2026-09-01] 재시도가 들어오면서 «안에서만» 다시 던지는 자리가 하나 생겼다
//    (network 는 다시 걸고, AbortError 는 바로 포기 — 둘 다 바깥 catch 가 받아 null 이 된다).
//    ⭐ 그래서 「throw 가 0개」가 아니라 **「그 하나 말고는 없다」**로 잰다. 새 throw 가 생기면 여기서 죽는다.
//    ⛔ 느슨해진 게 아니다 — 「던지지 않는다」는 ⓑ② 가 «실제로 돌려서» 다시 증명한다.
const throw수 = (tidySrc.match(/\bthrow\b/g) || []).length
chk('② 실패해도 오류를 «안 던진다»(null 을 준다)',
  throw수 <= 1 && /if \(e && e\.name === 'AbortError'\) throw e/.test(tidySrc),
  '(던지면 편집 화면이 통째로 죽는다 · throw ' + throw수 + '개)')

// ⑥ 있는 쪽이 이긴다
// ⛔ 2026-08-29 부터 이 규칙은 «tidy.js 의 mergeTidy» 한 곳에 산다 — 화면마다 복붙하면 조용히 갈린다.
//    (그날 「사진 읽는 문이 셋인데 한 곳에만 AI 를 붙인」 사고를 겪고 함수로 뽑았다)
chk('⑥ AI 가 준 것만 골라 덮는다',
  // 🥄 2026-08-31 부터 재료는 «분량을 되살려서» 얹는다 — 그래도 「AI 가 안 주면 파서 것」은 그대로다
  /ai\.ingredients\.length\s*\?\s*분량되살리기\(ai\.ingredients, r\.ingredients\)\s*:\s*r\.ingredients/.test(tidySrc) &&
  /ai\.steps\.length\s*\?[^:]*:\s*r\.steps/.test(tidySrc),
  '(AI 가 제목만 줘도 재료·걸음은 규칙 파서 것이 남는다)')

// ✍️ [2026-08-29 · 창업자가 오타로 찾아낸 구멍] AI 걸음도 «문체 다듬기»를 거치나
//   📮 창업자 = *"오타 한번 정도? 꺼줘요를 끄줘요"*
//   ⛔⛔ 규칙 파서 결과는 `politeSteps` 를 거치는데(`parseRecipe.js`) **AI 결과만 그 밖에 있었다.**
//      우리 앱엔 해요체 표준도 배포 게이트(`check-steps`)도 있는데 AI 가 그걸 통째로 비껴갔다.
//   ⭐ 얹는 자리가 한 곳이라 여기서 지키면 두 문(공유받기·편집 캡처)이 같이 지켜진다.
chk('⑥-c AI 걸음도 «해요체 다듬기»를 거친다',
  /politeSteps\s*\(\s*ai\.steps\s*\)/.test(tidySrc),
  '(AI 만 문체 표준 밖에 있으면 화면에서 말투가 갈린다)')
// ✍️✍️ [2026-08-29 오후 · 백업 대조로 잡았다] «소스가 아니라 진짜 돌려서» 잰다
//   ⛔ 바로 위 ⑥-c 는 「politeSteps 를 «부르나»」만 본다 — 부르기만 하고 못 고치면 그대로 통과한다.
//      실제로 그랬다: 「완성해요」는 politeSteps 를 «거치고도» 안 고쳐졌다(사전에 없는 말이라).
//      📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나».
//   🔢 재는 말은 전부 **AI 가 실제로 낸 것**이다(창업자 백업 2026-08-29 · 진미채볶음).
const { politeSteps: 다듬기 } = await import('../src/polish.js')
const 문체판 = [
  ['통깨를 솔솔 뿌리면 완성해요', '통깨를 솔솔 뿌리면 완성이에요'],  // AI 가 낸 말
  ['불을 끄줘요', '불을 꺼줘요'],                                     // 창업자가 잡은 그것
  ['뭉근하게 끓이시면 완성입니다', '뭉근하게 끓이시면 완성이에요'],
  ['중불에서 볶아요', '중불에서 볶아요'],                             // ⛔멀쩡한 말은 안 건드린다
  ['재료를 섞어요', '재료를 섞어요'],
]
const 문체틀림 = 문체판.filter(([들, 나]) => 다듬기([들])[0] !== 나)
chk('⑥-d 그 다듬기가 «실제로» AI 말투를 고친다',
  문체틀림.length === 0,
  문체틀림.length ? `(못 고친 것: ${문체틀림.map(([들]) => 들).join(' / ')})` : '(완성해요·끄줘요 ＋ 멀쩡한 말은 그대로)')

chk('⑥-b 레시피를 담는 «모든» 문이 그 한 곳을 쓴다',
  /mergeTidy\s*\(/.test(edSrc) && /mergeTidy\s*\(/.test(appSrc),
  '(편집 캡처 ＋ 공유받기·갤러리 — 둘 다)')

// ⭐ 순서 — 규칙 파서를 «먼저» 돌린다
const 파서줄 = edSrc.indexOf('let r = parseRecipeText(combined')
// ⛔ [2026-09-01] 인자가 늘어도(사진이 붙었다) 안 죽게 «앞머리»만 본다 — 지키려는 건 «차례»다
const AI줄 = edSrc.indexOf('tidyRecipe(combined')
chk('⭐ 규칙 파서를 «먼저» 돌린다', 파서줄 > 0 && AI줄 > 파서줄,
  '(AI 를 먼저 기다렸다 실패하면 그만큼 유저가 더 기다린다)')

// ⑧⑧ ⭐⭐ **[2026-08-29 오후 · 이 판에서 제일 중요한 칸] 「AI 를 «기다리지» 않는다」**
//   📮 창업자 폰 실측 13:44 = 30초를 세워두고 `기본 정리예요(timeout)` — **기다리고도 아무것도 못 얻었다.**
//   ⛔⛔ 그날 아침 12초 → 30초로 «숫자만» 올렸는데 같은 자리에서 또 죽었다.
//      뿌리는 **`await tidyRecipe()` 가 앞을 막아 «이미 손에 쥔 규칙 파서 결과»를 안 내놓은 것**이었다.
//      숫자를 아무리 올려도 이 구조인 한 유저는 늘 그만큼 빈 화면을 본다.
//   ⭐ 위 「⭐ 순서」 칸만으로는 이걸 «못 잡는다» — 파서가 먼저 돌아도 결과를 화면에 안 내면 같은 일이다.
//      📌 규칙 18 ⓘ — 「검사가 있다」와 「검사가 «그것»을 본다」는 다른 말이다.
//   ⛔ `await tidyRecipe(` 가 «한 글자라도» 되살아나면 여기서 죽는다.
for (const [이름, src] of [['EditorScreen', edSrc], ['App(공유받기)', appSrc]]) {
  const 코드 = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  chk(`⑧ ${이름} 이 AI 를 «기다리지» 않는다`,
    // ⛔ [2026-09-01] 잣대를 «담는 길»로 좁혔다 — (편집 캡처)·(공유받기)가 그 길이다.
    //    ⭐ 창업자가 «직접 누르는» 「AI로 다시 다듬기」는 기다려야 맞다(단추가 「다듬는 중…」으로 바뀐다).
    //       거기까지 막으면 이 칸이 «지키려는 것»(담을 때 유저를 세워두지 않는다)과 상관없는 걸 막게 된다.
    !/await\s+tidyRecipe\s*\(\s*(combined|text)\b/.test(코드) && /tidyRecipe\s*\([^)]*\)\s*\.then\s*\(/.test(코드),
    '(기다리면 규칙 파서 결과를 손에 쥐고도 안 내놓는다 — 창업자 폰 30초 timeout)')
}

console.log('\n── ⓑ 진짜로 그렇게 도나 (tidy.js 를 실제로 실행) ──')

// ⛔ 이 컨테이너는 Cloudflare 를 못 부른다 → «바깥 세계»만 흉내낸다.
//   앱 코드는 진짜 tidy.js 를 그대로 쓴다(절대원칙 30).
globalThis.localStorage = { getItem: () => null, setItem: () => {} }

const 맛보기 = '된장크림파스타\n스파게티 200g\n된장 1큰술\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다'

// ⛔⛔ **검사가 「그날의 설정값」에 기대면 안 된다** — 2026-08-29 사고.
//   처음엔 진짜 `src/tidy.js` 를 그대로 불러 ①(주소가 비면 안 부른다)을 쟀다.
//   그날 워커를 세우고 주소를 «채우자» ①-b 가 죽었다 — **코드는 멀쩡한데 검사가 죽었다.**
//   ⭐ 그래서 두 판을 «직접 만들어» 잰다. 실제 파일에 주소가 있든 없든 둘 다 재진다.
//      ⑴ 비운 판 = 주소 ''        → fetch 를 «한 번도» 안 부르나
//      ⑵ 채운 판 = 가짜 주소      → 바깥 세계가 죽었을 때 어떻게 되나
const { writeFileSync, unlinkSync } = await import('node:fs')
const 주소줄 = /^const TIDY_URL = '[^']*'/m
// ⛔ 못 찾으면 «죽는다». 조용히 지나가면 채운 판이 «진짜 워커 주소»를 들고 돌게 된다.
if (!주소줄.test(tidySrc)) {
  console.error('\n⛔ tidy.js 에서 TIDY_URL 줄을 못 찾았다 — 검사를 먼저 고쳐야 한다')
  process.exit(1)
}
// ⏱⏱ **시간 제한도 «바꿔치기»한다** (2026-08-29)
//   ⛔ 전엔 앱의 TIMEOUT_MS 를 그대로 두고 「14초 기다려 본다」로 쟀다.
//      그래서 실측(24.3초) 뒤 12초 → 30초로 올리자 **이 칸이 죽었다** — 30초를 진짜로 기다려야 하니까.
//   ⭐ 값에 기대지 않는다 — 시험판에선 1.2초로 줄여 «끊기는 동작»만 본다.
//      → 앱이 몇 초로 잡든 검사가 안 죽고, 스모크도 30초 느려지지 않는다.
//   📌 위 ④ 칸이 「값이 35초 이하인가」를 따로 지키므로 둘이 겹치지 않는다.
const 시간줄 = /^const TIMEOUT_MS = \d+/m
if (!시간줄.test(tidySrc)) {
  console.error('\n⛔ tidy.js 에서 TIMEOUT_MS 줄을 못 찾았다 — 검사를 먼저 고쳐야 한다')
  process.exit(1)
}
const 판만들기 = (파일, 주소, 시간) => {
  let src = tidySrc.replace(주소줄, `const TIDY_URL = '${주소}'`)
  // ⛔ 이 판은 tidy.js 를 «scripts/» 로 베껴서 돌린다 — 그러면 tidy.js 안의 상대경로가 깨진다.
  //   (2026-08-29 실측 = mergeTidy 가 문체 다듬기를 부르게 되면서 './polish.js' 를 못 찾아 죽었다)
  //   ⭐ 베끼는 자리가 바뀐 만큼 «경로도 같이» 옮긴다.
  src = src.replace(/from '\.\/([^']+)'/g, "from '../src/$1'")
  if (시간) src = src.replace(시간줄, `const TIMEOUT_MS = ${시간}`)
  writeFileSync(ROOT + 'scripts/' + 파일, src)
  return 파일
}
const 비운판 = 판만들기('.tmp-tidy-비움.mjs', '')
const 임시 = ROOT + 'scripts/.tmp-tidy-test.mjs'
판만들기('.tmp-tidy-test.mjs', 'https://x.invalid/tidy', 1200)   // ⏱ 1.2초로 줄여 «끊기는지»만 본다

// ① 주소가 비어 있으면 fetch 를 아예 안 부른다
let 부른횟수 = 0
globalThis.fetch = () => { 부른횟수++; return Promise.reject(new Error('network')) }
{
  const mod = await import(`./${비운판}?t=${Date.now()}${Math.random()}`)
  const 결과 = await mod.tidyRecipe(맛보기)
  chk('① 주소가 비면 null (규칙 파서로 간다)', 결과 === null)
  chk('①-b 진짜로 fetch 를 «한 번도» 안 불렀다', 부른횟수 === 0, `(${부른횟수}번)`)
}

console.log('\n  ⚠️ 아래는 TIDY_URL 을 «가짜 주소»로 채운 판으로 잰다 — 실제 파일은 안 고친다')

async function 실험2(이름, fetch흉내, 기대, 덧말) {
  globalThis.fetch = fetch흉내
  const mod = await import(`./.tmp-tidy-test.mjs?t=${Date.now()}${Math.random()}`)
  const 결과 = await mod.tidyRecipe('된장크림파스타\n스파게티 200g\n된장 1큰술\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다')
  return chk(이름, 기대(결과), 덧말 || (결과 ? `(재료 ${결과.ingredients.length} · 걸음 ${결과.steps.length})` : '(null)'))
}

const 응답 = (obj, ok = true, status = 200) => () =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(obj) })

// ② 네트워크가 죽으면
await 실험2('② 네트워크가 죽으면 null (앱은 규칙 파서로)', () => Promise.reject(new Error('boom')), (r) => r === null)

// ③ 빈 껍데기
await 실험2('③ AI 가 «빈 껍데기»를 주면 안 쓴다',
  응답({ title: '뭔가', ingredients: [], steps: [], memo: '' }), (r) => r === null)

// ⑤ 정상 답
await 실험2('⑤ 정상 답이면 그 값을 쓴다',
  응답({ title: '된장크림파스타', ingredients: ['스파게티 200g', '된장 1큰술'], steps: ['면을 삶아요', '된장을 풀어요'], memo: '' }),
  (r) => r && r.ingredients.length === 2 && r.steps.length === 2)

// 429 / 502
await 실험2('② -b 한도가 차면(429) null', 응답({ error: 'daily_full' }, false, 429), (r) => r === null)
await 실험2('② -c 이상한 답(502) 이면 null', 응답({ error: 'bad_ai_output' }, false, 502), (r) => r === null)

// ④ 느리면 끊는다 — ⭐진짜로 12초를 기다리지 않고 «끊는 신호»가 오는지만 본다
{
  globalThis.fetch = (url, opt) => new Promise((res, rej) => {
    if (opt && opt.signal) opt.signal.addEventListener('abort', () => {
      const e = new Error('aborted'); e.name = 'AbortError'; rej(e)
    })
    // ⛔ 일부러 아무 답도 안 준다
  })
  const mod = await import(`./.tmp-tidy-test.mjs?t=${Date.now()}x`)
  const 시작 = Date.now()
  // ⭐ 시험판은 TIMEOUT_MS 가 1.2초로 바꿔치기돼 있다 — 앱이 몇 초로 잡든 여기선 빨리 끝난다
  const p = mod.tidyRecipe('된장크림파스타\n스파게티 200g\n된장 1큰술\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다')
  const 결과 = await Promise.race([p, new Promise((r) => setTimeout(() => r('아직'), 4000))])
  const 걸린 = Date.now() - 시작
  chk('④-c 답이 없으면 «스스로 끊고» null 을 준다', 결과 === null && 걸린 < 3500, `(${(걸린 / 1000).toFixed(1)}초)`)
}

try { unlinkSync(임시) } catch { /* noop */ }
try { unlinkSync(ROOT + 'scripts/' + 비운판) } catch { /* noop */ }

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) { console.log('실패:', 실패목록.join(' · ')); process.exit(1) }
