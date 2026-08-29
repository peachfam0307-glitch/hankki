// 【⏳ 판정대기 · hold/AI다듬기-0829 · smoke 게이트】
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

console.log('\n── ⓐ 소스가 지켜야 할 약속 ──')

// ① 배포해도 안전한가 — 주소가 비어 있으면 아무 일도 안 한다
chk('① TIDY_URL 이 비면 fetch 를 안 부른다',
  /if\s*\(!TIDY_URL[^)]*\)\s*return null/.test(tidySrc),
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
const m = tidySrc.match(/TIMEOUT_MS\s*=\s*(\d+)/)
chk('④ 시간 제한이 있고 20초 이하다', !!m && Number(m[1]) <= 20000, m ? `(${m[1]}ms)` : '(없다)')
chk('④-b 끊는 장치를 실제로 쓴다(AbortController)',
  /AbortController/.test(tidySrc) && /signal:/.test(tidySrc))

// ③ 빈 껍데기 방어
chk('③ 재료도 걸음도 없으면 «안 쓴다»',
  /!결과\.ingredients\.length\s*&&\s*!결과\.steps\.length/.test(tidySrc),
  '(AI 가 빈 JSON 을 주면 규칙 파서가 낫다)')

// ② 실패해도 안 던진다
chk('② 실패해도 오류를 «안 던진다»(null 을 준다)',
  !/throw\s/.test(tidySrc), '(던지면 편집 화면이 통째로 죽는다)')

// ⑥ 있는 쪽이 이긴다
chk('⑥ AI 가 준 것만 골라 덮는다',
  /ai\.ingredients\.length\s*\?\s*ai\.ingredients\s*:\s*r\.ingredients/.test(edSrc) &&
  /ai\.steps\.length\s*\?\s*ai\.steps\s*:\s*r\.steps/.test(edSrc),
  '(AI 가 제목만 줘도 재료·걸음은 규칙 파서 것이 남는다)')

// ⭐ 순서 — 규칙 파서를 «먼저» 돌린다
const 파서줄 = edSrc.indexOf('let r = parseRecipeText(combined')
const AI줄 = edSrc.indexOf('await tidyRecipe(combined)')
chk('⭐ 규칙 파서를 «먼저» 돌린다', 파서줄 > 0 && AI줄 > 파서줄,
  '(AI 를 먼저 기다렸다 실패하면 그만큼 유저가 더 기다린다)')

console.log('\n── ⓑ 진짜로 그렇게 도나 (tidy.js 를 실제로 실행) ──')

// ⛔ 이 컨테이너는 Cloudflare 를 못 부른다 → «바깥 세계»만 흉내낸다.
//   앱 코드는 진짜 tidy.js 를 그대로 쓴다(절대원칙 30).
globalThis.localStorage = { getItem: () => null, setItem: () => {} }

async function 실험(이름, fetch흉내, 기대) {
  globalThis.fetch = fetch흉내
  // ⭐ 모듈을 매번 새로 읽어 상태가 안 섞이게(쿼리로 캐시 우회)
  const mod = await import(`../src/tidy.js?t=${Date.now()}${Math.random()}`)
  const 결과 = await mod.tidyRecipe('된장크림파스타\n스파게티 200g\n된장 1큰술\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다')
  return chk(이름, 기대(결과), 결과 ? '(값이 왔다)' : '(null — 규칙 파서로 간다)')
}

let 부른횟수 = 0
const 세는fetch = (...a) => { 부른횟수++; return Promise.reject(new Error('network')) }

// ① 주소가 비어 있으니 fetch 를 아예 안 부른다
await 실험('① 주소가 비면 fetch 를 «한 번도» 안 부른다', 세는fetch, (r) => r === null)
chk('①-b 진짜로 안 불렀다', 부른횟수 === 0, `(${부른횟수}번)`)

console.log('\n  ⚠️ 아래는 TIDY_URL 을 채운 판으로 잰다 — 실제 파일은 안 고친다')

// TIDY_URL 을 채운 «임시 판»을 만들어 같은 코드를 돌린다
const 임시 = ROOT + 'scripts/.tmp-tidy-test.mjs'
const { writeFileSync, unlinkSync } = await import('node:fs')
writeFileSync(임시, tidySrc.replace("const TIDY_URL = ''", "const TIDY_URL = 'https://x.invalid/tidy'"))

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
  // 시간 제한을 잠깐 줄이는 대신, 끊기는지만 본다(12초를 진짜로 기다리면 스모크가 느려진다)
  const p = mod.tidyRecipe('된장크림파스타\n스파게티 200g\n된장 1큰술\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다')
  const 결과 = await Promise.race([p, new Promise((r) => setTimeout(() => r('아직'), 14000))])
  const 걸린 = Date.now() - 시작
  chk('④-c 답이 없으면 «스스로 끊고» null 을 준다', 결과 === null && 걸린 < 13500, `(${(걸린 / 1000).toFixed(1)}초)`)
}

try { unlinkSync(임시) } catch { /* noop */ }

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) { console.log('실패:', 실패목록.join(' · ')); process.exit(1) }
