// 🧩🧩 워커가 AI 답에서 «레시피를 꺼내는» 자리 — 재현판 (2026-08-29 오후)
//
// ⛔⛔ **이 판이 태어난 사고**
//   창업자 폰 = `기본 정리예요(empty_result)` — 워커가 **200 으로 «빈 레시피»**를 내보냈다.
//   502 도 timeout 도 아니었다. AI 는 답을 «했는데» 우리가 못 꺼냈다.
//
//   🕳 뿌리 둘 —
//   ⑴ `pickJson` 이 **「객체면 통과」**였다. AI 답이 `{"response":"{\"title\":…}"}` 처럼
//      한 겹 싸여 오면 「첫 { ~ 마지막 }」이 **바깥 껍데기**를 떠서 파싱에 성공한다.
//      → `{response:'…'}` 가 레시피 행세를 하고 title·ingredients 가 전부 빈 채로 나갔다.
//      📌 「파싱에 성공했다」와 「레시피를 찾았다」는 다른 말이다(규칙 18 ⓘ).
//   ⑵ `??` 가 **빈 글자(`''`)를 통과**시켜, `{response:'', reasoning_content:'…'}` 같은 답에서
//      뒤 후보를 하나도 안 봤다.
//
// ⚠️ **정직하게 — 이 판이 «못» 하는 것**
//   진짜 Workers AI 응답이 «어떤 모양»인지는 여기서 확인할 수 없다(workers.dev 로 못 나간다).
//   그래서 이 판은 「모양이 이러면 꺼낸다」를 지킬 뿐이고,
//   **실제 모양은 워커 로그(`EMPTY_RESULT` · `BAD_AI_OUTPUT`)가 알려준다.** 둘이 짝이다.
//
// 실행: node scripts/_repro-워커JSON꺼내기-0829.mjs

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = ROOT + 'ocr-proxy/worker-tidy.js'
const 임시 = ROOT + 'scripts/.tmp-worker-tidy.mjs'

// ⭐ 워커 파일을 «고치지 않고» 이름만 내보내 불러온다 — 흉내가 아니라 그 코드 자체다(절대원칙 30).
const src = readFileSync(SRC, 'utf8')
for (const 이름 of ['function pickJson', 'function 첫값', 'function 레시피인가']) {
  if (!src.includes(이름)) {
    console.error(`\n⛔ 워커에서 「${이름}」 을 못 찾았다 — 검사를 먼저 고쳐야 한다`)
    process.exit(1)
  }
}
writeFileSync(임시, src + '\nexport { pickJson, 첫값, 레시피인가 }\n')
const { pickJson, 첫값 } = await import(임시 + '?v=' + Date.now())

let 실패 = 0
const chk = (이름, ok, 꼬리 = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${이름}${꼬리 ? '  ' + 꼬리 : ''}`)
  if (!ok) 실패++
}

const 레시피 = { title: '김치찌개', ingredients: ['묵은지 200g', '두부 1모'], steps: ['볶아요', '끓여요'] }
const 글자 = JSON.stringify(레시피)

console.log('\n── 꺼내기 ──')
chk('① 날것 JSON 글자', pickJson(글자)?.title === '김치찌개')
chk('② ```json 울타리', pickJson('네 정리했어요\n```json\n' + 글자 + '\n```')?.title === '김치찌개')
chk('③ 앞뒤 설명이 붙은 글자', pickJson('결과: ' + 글자 + ' 끝!')?.title === '김치찌개')
chk('④ 이미 객체', pickJson(레시피)?.title === '김치찌개')

// ⭐⭐ 여기가 이 판의 심장 — 사고가 난 «그 모양»
const 껍데기 = { response: 글자, usage: { total_tokens: 300 } }
chk('⑤ ⭐ 한 겹 싸인 답 `{response:"…"}`', pickJson(껍데기)?.title === '김치찌개',
  '(옛 판은 껍데기를 «레시피»라 우겼다 → 200 · 빈 레시피)')
chk('⑥ 두 겹 `{result:{response:"…"}}`',
  pickJson({ result: { response: 글자 } })?.title === '김치찌개')
chk('⑦ 껍데기 «안»이 객체', pickJson({ response: 레시피 })?.title === '김치찌개')

console.log('\n── 안 속는다 ──')
chk('⑧ 레시피가 «없는» 껍데기는 null', pickJson({ response: '', reasoning_content: '음…' }) === null,
  '(여기서 객체를 돌려주면 빈 레시피가 200 으로 나간다)')
chk('⑨ 빈 값·글자 아님', pickJson('') === null && pickJson(null) === null)
chk('⑩ JSON 이 아니면 null', pickJson('레시피를 찾지 못했습니다') === null)

console.log('\n── 첫값 (`??` 함정) ──')
chk('⑪ 빈 글자를 «건너뛴다»', 첫값('', null, '진짜') === '진짜',
  '(`??` 는 `\'\'` 를 통과시켜 뒤 후보를 못 본다)')
chk('⑫ 앞이 있으면 앞을 쓴다', 첫값('먼저', '나중') === '먼저')
chk('⑬ 전부 비면 null', 첫값('', null, undefined) === null)

// 🧪 규칙 12 — 옛 잣대(「객체면 통과」)로 되돌리면 ⑤⑧이 «실제로» 죽나
console.log('\n── 🧪 옛 판이면 죽나 (규칙 12) ──')
const 옛판 = (out) => {
  if (!out) return null
  if (typeof out === 'object' && (out.title || out.steps || out.ingredients)) return out
  const s = typeof out === 'object' ? JSON.stringify(out) : String(out)
  const a = s.indexOf('{'), b = s.lastIndexOf('}')
  const cand = []
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  cand.push(s)
  for (const c of cand) {
    try { const o = JSON.parse(c); if (o && typeof o === 'object') return o } catch { /* 다음 */ }
  }
  return null
}
chk('⑭ 옛 판은 ⑤에서 «껍데기»를 레시피라 우긴다', 옛판(껍데기)?.title === undefined,
  '(그래서 200 · 빈 레시피 → 앱에 empty_result)')
chk('⑮ 옛 판은 ⑧에서도 객체를 돌려준다', 옛판({ response: '', reasoning_content: '음…' }) !== null)

try { unlinkSync(임시) } catch { /* noop */ }
console.log(실패 ? `\n⛔ ${실패}칸 실패` : '\n✅ 15/15 통과')
process.exit(실패 ? 1 : 0)
