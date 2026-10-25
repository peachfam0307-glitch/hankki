// 🐛🐛 재현 — 「만드는 법이 없는 원문인데 AI 가 만드는 법을 지어냈다」 (창업자 제보 2026-10-24 · 두부참치조림)
//
// 📮 창업자 = *"인스타캡쳐(원본) 만드는법이 없었어 지어낸 것 같아"* ＋ 앱 화면에 오징어 그림
//
// ⭐ 재는 자리 = 얹는 자리(`mergeTidy`) — AI 답이 화면 값이 되는 «한 곳»이다.
// 🧪 규칙 12 = `mergeTidy` 의 `원문걸음만` 줄을 빼면 ①이 죽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-지어낸걸음-1025.mjs
import { mergeTidy, 걸음근거, 근거문턱 } from '../src/tidy.js'
import { parseRecipeText } from '../src/parseRecipe.js'
import { readFileSync } from 'node:fs'

let 통과 = 0, 전체 = 0
const chk = (이름, 좋나, 덧 = '') => { 전체++; if (좋나) 통과++; console.log(`  ${좋나 ? '✅' : '❌'} ${이름}${덧 ? '  ' + 덧 : ''}`) }

// 📄 창업자 캡처(인스타 글) 글자 그대로 — 만드는 법이 «없다». 첫 줄은 영상 자막.
const 두부원문 = `먼저 두부 한 모 잘라주고
First, slice one block of tofu.
[재료]
두부 1모
통조림 참치 1캔
양파 1개
대파 1대
청양고추 취향껏
물 300ml
식용유 약간
통깨 약간
[양념장 레시피]
간장 4스푼
고춧가루 4스푼
올리고당 2스푼
맛술2스푼
고추장 2스푼
다진마늘 2 스푼
참치액 1스푼
후추 적당히
(원래 레시피는 간장과 고춧가루는 5스푼씩인데 제
입맛에는 너무 자극적이라 한스푼씩 줄였어요.
부족하시면 추가해주세요.)`

// 🤖 AI 가 지어낼 법한 걸음 — 재료 이름은 다 원문에 있다(그래서 재료를 빼고 재야 한다)
const 지어낸 = [
  '두부는 먹기 좋은 크기로 썰어요',
  '양파와 대파, 청양고추를 썰어요',
  '양념장 재료를 모두 섞어요',
  '팬에 식용유를 두르고 두부를 노릇하게 구워요',
  '냄비에 두부와 양파를 깔고 참치를 올려요',
  '물 300ml와 양념장을 붓고 중불에서 10분 끓여요',
  '대파와 청양고추, 통깨를 올려 마무리해요',
]
const AI두부 = {
  title: '두부 참치 조림',
  ingredients: ['두부 1모', '통조림 참치 1캔', '양파 1개', '대파 1대', '청양고추 취향껏', '물 300ml', '식용유 약간', '통깨 약간',
    '간장 4스푼', '고춧가루 4스푼', '올리고당 2스푼', '맛술 2스푼', '고추장 2스푼', '다진마늘 2스푼', '참치액 1스푼', '후추 적당히'],
  steps: [...지어낸, '두부 한 모를 잘라요'],
  memo: '',
}

console.log('\n🐛 「지어낸 만드는 법」 — 창업자 두부참치조림 원문으로 잰다\n')

const 파서 = parseRecipeText(두부원문, { fromOcr: true })
const 합친 = mergeTidy(파서, AI두부, 두부원문)
const 남은지어낸 = 합친.steps.filter((s) => 지어낸.some((f) => s.startsWith(f.slice(0, 6))))
chk('① 원문에 없는 걸음 7개가 화면에 «안» 남는다', 남은지어낸.length === 0, JSON.stringify(남은지어낸))
chk('② 원문에 있는 걸음(영상 자막 「두부 한 모 잘라주고」)은 남는다',
  합친.steps.some((s) => /두부 한 모/.test(s)), JSON.stringify(합친.steps))
chk('③ 재료는 AI 것 그대로 (걸음 거르기가 재료를 안 건드린다)', 합친.ingredients.length === 16, String(합친.ingredients.length))

// ── 진짜 걸음은 살아야 한다 — 삼치 원문(`_repro-AI분량-0831.mjs` 와 같은 원문) ──
const 삼치원문 = `#삼치간장조림 레시피
[재료]
무 1/3개
식용유 2스푼
물 200ml
[만드는 법]
1 팬에 식용유 2스푼을 두르고
중약불에서 무를 앞뒤로 3분씩 구워주세요.
2 물을 자작하게 붓고
미림 15스푼, 청주 12스푼, 간장 3스푼,
생강즙 조금을 넣어 강불에서 한소끔 끓여주세요.`
const AI삼치 = {
  title: '삼치간장조림', ingredients: ['무', '식용유', '물'],
  steps: ['팬에 식용유 2스푼을 두르고 중약불에서 무를 앞뒤로 3분씩 구워요',
    '물을 자작하게 붓고 미림, 청주, 간장, 생강즙을 넣어 강불에서 한소끔 끓여요'],
  memo: '',
}
const 삼치 = mergeTidy(parseRecipeText(삼치원문, { fromOcr: true }), AI삼치, 삼치원문)
chk('④ 원문에 있는 걸음(AI 가 해요체로 고친 것)은 «다» 남는다', 삼치.steps.length === 2, JSON.stringify(삼치.steps))
const 최저진짜 = Math.min(...AI삼치.steps.map((s) => 걸음근거(s, 삼치원문)))
const 최고가짜 = Math.max(...지어낸.map((s) => 걸음근거(s, 두부원문, AI두부.ingredients)))
chk(`⑤ 문턱(${근거문턱})이 가짜 최고와 진짜 최저 «사이»에 있다`, 최고가짜 < 근거문턱 && 근거문턱 <= 최저진짜,
  `(가짜 최고 ${최고가짜.toFixed(2)} · 진짜 최저 ${최저진짜.toFixed(2)})`)

// ── ⛔ 원문을 못 받은 옛 호출은 «예전 그대로» ──
chk('⑥ 원문 없이 부르면 AI 걸음을 그대로 둔다 (근거 없이 버리지 않는다)',
  mergeTidy(파서, AI두부).steps.length === AI두부.steps.length)
chk('⑦ 걸음이 전부 걸러지면 규칙 파서 걸음으로 물러난다',
  JSON.stringify(mergeTidy({ ...파서, steps: ['원래 걸음'] }, { ...AI두부, steps: 지어낸 }, 두부원문).steps) === JSON.stringify(['원래 걸음']))

// ── 네 입구가 다 원문을 넘기나 (한 곳이라도 빠지면 그 입구로는 또 지어낸다) ──
const 입구 = [
  ['src/App.jsx', /mergeTidy\(기본, ai, text\)/],
  ['src/screens/EditorScreen.jsx', /mergeTidy\(r, ai, combined\)/],
  ['src/screens/EditorScreen.jsx', /mergeTidy\(기본, ai, rawText\)/],
  ['src/retidy.js', /mergeTidy\(기본, ai, 원문\)/],
]
for (const [f, re] of 입구) chk(`⑧ ${f} 가 원문을 넘긴다 ${re.source}`, re.test(readFileSync(new URL('../' + f, import.meta.url), 'utf8')))

console.log(`\n${통과 === 전체 ? '✅' : '❌'} ${통과}/${전체}`)
process.exit(통과 === 전체 ? 0 : 1)
