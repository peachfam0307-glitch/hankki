// 🆓🤖 무료로 읽으면 AI 정리도 «없다» — 재현판 (2026-09-14)
//
// 📮 창업자 = *"열쇠쓰기를 안했는데 ai가 읽는거 되는거 고쳐야해"*
//
// ✅✅ **근거 = 창업자 확정 2026-08-29 00:25 (⛔재론 금지)**
//    📄 `docs/_archive/2026-08/AI다듬기-만들기전-리서치-2026-08-28.md`
//    📮 원문 = *"열쇠1개-중국AI회사가 읽어주고, 정리해줌. **열쇠다 쓰면 읽고 정리하는 것 tesseract얘가 함.**
//       불편해진 유저는 AI열쇠를 삼. **이 두가지만 있는거야.**"*
//
//    | | 사진 → 글자 | 글자 → 레시피 | 열쇠 |
//    |---|---|---|---|
//    | 잘 되는 쪽 | 구글 Vision | **AI** | **1개** |
//    | 불편한 쪽 | tesseract | **규칙 파서** | 0개 |
//
//    ⛔ **「열쇠 없이도 AI 정리」를 어디에도 열지 않는다** — 열면 그 순간 열쇠가 안 팔린다.
//    📌 심장 = **「열쇠 값어치가 반쪽이면 안 된다」.**
//
// 🌲 **뿌리** — 「그냥 읽기」는 그 확정 «뒤»에 생겼고(창업자 *"한끼에서 가져오기를 무료ocr로 읽게하면 안돼??"*),
//    그때 AI 다듬기를 어떻게 할지는 **정한 적이 없어** 기존 흐름이 그대로 이어졌다.
//    → 열쇠 0개인데 AI 정리가 됐다. 확정이 «없애라»고 한 바로 그 중간 조합이다.
//
// ⭐⭐ **무엇으로 재나 = 「다듬기 워커를 불렀나」.**
//    ⛔ 「팝업이 떴나」로 재지 않는다 — 떠도 안 돌 수 있고 안 떠도 돌 수 있다.
//    ⛔ 화면 흐름으로도 안 잰다 — 이 컨테이너는 tesseract CDN 을 못 열어 **무료 길이 글자를 못 얻는다.**
//       그러면 「안 불렀다」가 나와도 **앱이 막아서가 아니라 글자가 없어서**다(가짜 초록불 · 규칙 18 ⓘ).
//       📌 실제로 `_repro-무료읽기-0829` 에 칸을 더했다가 이 함정을 밟았다.
//    ✅ 그래서 **막는 문(`tidyRecipe`)을 직접 부르고 fetch 를 가로채** 나갔나를 센다.
//       막는 자리를 «한 곳»에 둔 이유가 이것이다 — 부르는 곳이 넷이라 호출부마다 막으면 한 곳만 빠져도 샌다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-무료면AI없다-0914.mjs

// 🕸 fetch 를 가로챈다 — 진짜로 나가게 두지 않는다(이 환경은 workers.dev 를 막는다)
const 나간것 = []
globalThis.fetch = async (url, opt) => {
  나간것.push(String(url))
  return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { 'content-type': 'application/json' } })
}
// 🔐 AI 동의를 미리 심는다 — 안 심으면 동의 시트가 앞을 막아 «어느 갈래에서도» 0 번이 된다(가짜 초록불)
const 통 = new Map([['hankki:ai:consent', 'yes']])
globalThis.localStorage = {
  getItem: (k) => (통.has(k) ? 통.get(k) : null),
  setItem: (k, v) => 통.set(k, String(v)),
  removeItem: (k) => 통.delete(k),
}
globalThis.window = globalThis
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
globalThis.dispatchEvent = () => true

const { tidyRecipe } = await import('../src/tidy.js')

// 📄 40자를 넘는 «레시피 모양» 글자 — `tidy.js` 는 40자 미만이면 AI 를 아예 안 부른다.
//   ⛔ 이걸 모르고 짧은 글자를 주면 어느 갈래든 0 번이 되어 판이 아무것도 안 잰다.
const 글 = '김치찌개\n재료\n신김치 200g\n돼지고기 150g\n두부 반 모\n만드는 법\n김치를 볶아요\n물을 붓고 끓여요\n두부를 넣어요'

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}  ·  기대 = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}
const 다듬기횟수 = () => 나간것.filter((u) => u.includes('hankki-tidy')).length

console.log('\n🆓🤖 무료로 읽으면 AI 정리도 없다\n')

// ───────── ① ⭐심장 — 무료면 워커를 «한 번도» 안 부른다 ─────────
console.log('① 무료로 읽었으면 AI 다듬기 워커를 안 부른다')
나간것.length = 0
const 무료답 = await tidyRecipe(글, '', { 무료: true })
chk('⭐ 다듬기 워커 0번 (＝열쇠 없이 AI 정리가 안 열린다)', 다듬기횟수(), 0)
chk('   답이 null 이다 (화면은 규칙 파서 결과를 그대로 쓴다)', 무료답, null)

// ───────── ② 되짚기 — 열쇠를 쓴 쪽은 «불러야» 한다 ─────────
//   ⛔ 이 칸이 없으면 ①이 «아무것도 안 재고» 통과할 수 있다(무언가 다른 이유로 0 번일 수 있다).
console.log('\n② ⛔되짚기 — 열쇠로 읽은 쪽은 그대로 돈다 (열쇠 값어치가 반쪽이 아니다)')
나간것.length = 0
await tidyRecipe(글, '')
chk('⭐ 다듬기 워커 1번 이상', 다듬기횟수() >= 1, 'true')

// ───────── ③ 문이 «하나»인지 — opts 없이 불러도 무료면 막히나 ─────────
console.log('\n③ 막는 문이 한 곳이다 (부르는 곳이 넷이라 호출부마다 막으면 한 곳만 빠져도 샌다)')
나간것.length = 0
await tidyRecipe(글, '', { 무료: 1 })
chk('무료 값이 1(숫자)이어도 막힌다', 다듬기횟수(), 0)
나간것.length = 0
await tidyRecipe(글, '', {})
chk('⛔빈 옵션이면 «안» 막힌다 (옛 편·공유받기가 조용히 멈추면 안 된다)', 다듬기횟수() >= 1, 'true')

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) console.log('   ' + 실패목록.join('\n   '))
console.log()
process.exit(실패 ? 1 : 0)
