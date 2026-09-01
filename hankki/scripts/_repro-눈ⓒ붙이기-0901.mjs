#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 👁 ⓒ(사진＋글자) 붙이기 재현판 — 2026-09-01
//
// 📮 창업자 판정 = *"c로 하되 …"* (삼치 실물 대조에서 ⓒ만 ④「멀쩡한 말 안 건드리기」를 지켰다)
//
// ⭐⭐ **이 판의 심장 = 「사진이 «진짜로» 실려 나가나」 ＋ 「없어도 옛 길이 그대로 도나」**
//    ⛔ 소스를 grep 하면 «주석에 적어둔 말»까지 걸려 고쳐놓고도 통과한다(규칙 18 ⓘ).
//       그래서 **워커에 실제로 나가는 body 를 가로채서** 본다.
//
// ⛔ 여기서 «안» 재는 것 = AI 답의 품질. 그건 창업자 실물 판정 몫이다(규칙 11).
//    이 판은 «배관»만 본다 — 사진이 실리나 · 안 실릴 때 옛 길인가 · 통계가 갈리나.
// ═══════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const 앱 = join(__dir, '..')
let 통과 = 0, 실패 = 0
const ok = (m, v) => { console.log('  ✅ ' + m + (v !== undefined ? '  ' + v : '')); 통과++ }
const no = (m, v) => { console.log('  ⛔ ' + m + (v !== undefined ? '  ' + v : '')); 실패++ }
const 잰다 = (조건, m, v) => (조건 ? ok(m, v) : no(m, v))

console.log('\n👁 ⓒ(사진＋글자) 붙이기 — 배관을 잰다\n')

// ── ① tidy.js 가 사진을 «진짜로» 싣나 ────────────────────────────
// ⭐ 흉내내지 않고 «그 파일»을 불러 fetch 를 가로챈다(절대원칙 30 — 앱과 같은 코드)
console.log('  ── ① 앱 → 워커로 나가는 몸통 ──')
const 원본fetch = globalThis.fetch
let 마지막몸통 = null
globalThis.fetch = async (url, opt) => {
  마지막몸통 = JSON.parse(opt.body)
  return { ok: true, json: async () => ({ title: '삼치간장조림', ingredients: ['무 1/3개'], steps: ['구워요.'], memo: '' }) }
}
globalThis.localStorage = { getItem: () => null, setItem: () => {} }

const { tidyRecipe } = await import(join(앱, 'src/tidy.js'))
const 긴글 = '삼치간장조림 레시피\n[재료]\n무 1/3개\n비비고 순살 삼치 2팩\n식용유 2스푼\n물 200ml\n[만드는 법]\n팬에 식용유를 두르고 무를 구워주세요.'
const 사진 = 'data:image/jpeg;base64,' + 'A'.repeat(500)

마지막몸통 = null
await tidyRecipe(긴글, 사진)
잰다(마지막몸통 && 마지막몸통.image === 사진, '①-1 사진을 주면 «몸통에 실려» 나간다')
잰다(마지막몸통 && 마지막몸통.text === 긴글.trim(), '①-2 글자도 그대로 같이 간다')

마지막몸통 = null
await tidyRecipe(긴글)
잰다(마지막몸통 && !('image' in 마지막몸통), '①-3 ⛔사진이 없으면 image 칸이 «아예 없다»(옛 길 그대로)')

마지막몸통 = null
await tidyRecipe(긴글, 'https://남의주소/사진.jpg')
잰다(마지막몸통 && !('image' in 마지막몸통), '①-4 ⛔dataURL 이 아니면 «안 싣는다»(모르는 모양은 안 보낸다)')

마지막몸통 = null
await tidyRecipe(긴글, 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000))
잰다(마지막몸통 && !('image' in 마지막몸통), '①-5 ⛔너무 크면 «빼고 글자만» 보낸다(막지 않는다)')
잰다(마지막몸통 && 마지막몸통.text === 긴글.trim(), '①-6 ⭐그때도 정리는 «된다» — 새 기능이 옛 기능을 안 죽인다')
globalThis.fetch = 원본fetch

// ── ② 워커가 사진을 받아 «눈 모델»을 맨 앞에 세우나 ──────────────
console.log('\n  ── ② 워커(hankki-tidy) ──')
const 티디 = readFileSync(join(앱, 'ocr-proxy/worker-tidy.js'), 'utf8')
잰다(/const image = \(\(\) => \{/.test(티디), '②-1 본 경로가 body.image 를 받는다')
잰다(/\.\.\.\(image \? \[\{ model: VISION_MODEL, 눈: true \}\] : \[\]\)/.test(티디),
  '②-2 사진이 있으면 «눈 모델»이 맨 앞에 선다')
잰다(/\.\.\.모델차례\(env\)\.map/.test(티디),
  '②-3 ⭐그 «뒤»에 글자 전용 모델이 그대로 남는다 — 눈이 실패해도 오늘까지와 같은 결과')
잰다(/MAX_IMAGE/.test(티디), '②-4 사진 크기 상한이 있다')
잰다(/IMAGE_TOO_BIG/.test(티디), '②-5 ⭐너무 크면 «조용히 버리지 않고» 로그로 남긴다')
잰다(/type: 'image_url'/.test(티디) && !/type: 'input_image'/.test(티디),
  '②-6 ⛔모양은 ①(image_url) 하나뿐 — 죽은 셋을 되살리지 않았다')

// ── ③ 창업자 ↔ 유저 갈라 세기 ────────────────────────────────
console.log('\n  ── ③ 창업자 ↔ 유저 (창업자 지시 2026-09-01) ──')
잰다(/async function 통세기\(kv, ymd, founder, 눈\)/.test(티디), '③-1 통세기가 창업자·눈을 받는다')
잰다(/if \(founder\) await inc\(kv, `tdf:\$\{ymd\}`/.test(티디), '③-2 창업자 몫을 «따로» 센다')
잰다(/if \(눈\) await inc\(kv, `tv:\$\{ymd\}`/.test(티디), '③-3 «사진까지 본」 편수를 따로 센다')
잰다(!/await 통세기\(kv, ymd\)(?!,)/.test(티디), '③-4 ⛔옛 호출(인자 둘)이 안 남았다')
잰다(/창업자: 오늘창/.test(티디) && /유저: Math\.max\(0, 오늘 - 오늘창\)/.test(티디),
  '③-5 quota 가 창업자·유저를 갈라 답한다')

const 옥알 = readFileSync(join(앱, 'ocr-proxy/worker.js'), 'utf8')
잰다(/inc\(kv, `df:\$\{ymd\}`/.test(옥알) && /inc\(kv, `mf:\$\{ym\}`/.test(옥알),
  '③-6 OCR 워커도 창업자 몫을 따로 센다')
잰다(/창업자: 월창, 유저: Math\.max\(0, 월 - 월창\)/.test(옥알), '③-7 OCR quota 도 갈라 답한다')
잰다(/inc\(kv, `d:\$\{ymd\}`, 60 \* 60 \* 26\)/.test(옥알),
  '③-8 ⛔전체 카운터는 «안 건드렸다» — 상한이 그 값을 본다')

// ── ④ 앱이 «사진을 들고 있다가» 넘기나 ──────────────────────────
console.log('\n  ── ④ 앱 두 길 (편집 캡처 · 공유받기) ──')
const 에디터 = readFileSync(join(앱, 'src/screens/EditorScreen.jsx'), 'utf8')
잰다(/const shotAccum = useRef\(''\)/.test(에디터), '④-1 사진을 들 자리가 있다(useRef)')
잰다(/if \(!shotAccum\.current && typeof img === 'string'\) shotAccum\.current = img/.test(에디터),
  '④-2 자른 «첫 장»만 들고 있는다')
잰다(/tidyRecipe\(combined, shotAccum\.current\)/.test(에디터), '④-3 정리할 때 사진을 같이 넘긴다')
잰다(/shotAccum\.current = ''/.test(에디터), '④-4 ⭐새로 고르면 앞 판 사진을 버린다(옛 사진 ✕ 새 글자 방지)')
잰다(!/localStorage[\s\S]{0,80}shotAccum/.test(에디터) && !/shotAccum[\s\S]{0,80}localStorage/.test(에디터),
  '④-5 ⛔사진을 localStorage 에 넣지 않는다 (store.jsx:698 — 저장이 통째로 막힌다)')

const 앱제이 = readFileSync(join(앱, 'src/App.jsx'), 'utf8')
잰다(/tidyRecipe\(text, 장들\[0\]\)/.test(앱제이),
  '④-6 ⭐공유받기(창업자 1순위 길)에도 사진이 붙었다')
// 🏷 [2026-09-01 저녁 · 창업자 실물] AI 제목이 버려지던 자리 — 잣대를 «한 번만» 정하고 안 흔든다
//   ⚠️ 정직하게 = 이건 «소스 모양»을 보는 칸이다(공유받기 경로는 브라우저 없이 못 돌린다).
//      그래도 옛 줄이 되살아나면 여기서 죽는다 — 그게 이 칸이 하는 일이다.
잰다(/const 자동제목인가 = !처음제목 \|\| 처음제목 === '사진 레시피'/.test(앱제이),
  '④-7 ⭐제목 잣대를 «담을 때» 한 번만 정한다')
잰다(/const 새제목 = 자동제목인가 \? \(r\.title \|\| 현재\.title\) : 처음제목/.test(앱제이),
  '④-8 ⭐⭐자동으로 붙인 제목이면 AI 것이 이긴다 (＝ⓒ 답이 화면까지 온다)')
잰다(!/현재\.title && 현재\.title !== '사진 레시피' \?/.test(앱제이),
  '④-9 ⛔옛 줄(첫 판이 제목을 굳혀 AI 를 막던 것)이 안 남았다')

// ── ⑤ 📷 «사진이 실렸나»를 창업자 화면이 말해주나 (2026-09-01 저녁 신설) ──
//   ⛔⛔ 왜 필요한가 = 실물에서 워커 quota 가 「눈: 사진까지본것 0」이라 «안 갔다»까지는 알았는데
//      **앱 어디서 빠졌는지**를 알 길이 없었다. 앱 안이 조용해서 창업자도 나도 못 봤다.
//   ⭐ 이 꼬리 한 조각이면 다음 한 번에 답이 나온다(규칙 8 — 시행착오는 코드가 한다).
console.log('\n  ── ⑤ 사진이 실렸나를 «말해주나» ──')
globalThis.localStorage = { getItem: () => '열쇠있다', setItem: () => {} }
const { tidyTail: 꼬리 } = await import(join(앱, 'src/tidy.js'))
globalThis.fetch = async (url, opt) => {
  마지막몸통 = JSON.parse(opt.body)
  return { ok: true, json: async () => ({ title: 'ㄱ', ingredients: ['무 1개'], steps: ['구워요.'], model: '@cf/google/gemma-4-26b-a4b-it' }) }
}
await tidyRecipe(긴글, 사진)
const 꼬리1 = 꼬리()
잰다(/📷실음\(/.test(꼬리1), '⑤-1 ⭐사진을 실었으면 「📷실음(N k)」이 붙는다', 꼬리1)
await tidyRecipe(긴글)
const 꼬리2 = 꼬리()
잰다(/📷없음/.test(꼬리2), '⑤-2 사진이 없었으면 「📷없음」', 꼬리2)
await tidyRecipe(긴글, 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000))
const 꼬리3 = 꼬리()
잰다(/📷너무큼\(/.test(꼬리3), '⑤-3 ⭐너무 커서 뺐으면 «크기까지» 말한다', 꼬리3)
await tidyRecipe(긴글, 'https://남의주소/사진.jpg')
잰다(/📷모양아님/.test(꼬리()), '⑤-4 dataURL 이 아니면 「모양아님」')
globalThis.localStorage = { getItem: () => null, setItem: () => {} }
잰다(!/📷/.test(꼬리()), '⑤-5 ⛔열쇠 없는 «유저»에겐 안 보인다')
// ── ⑥ 🔁 「되다 안 되다」를 줄이는 둘 (2026-09-01 저녁 · 창업자 «1.2 둘다하자») ──
//   ⭐ 심장 = **network 일 때만 다시 건다.** timeout·5xx 는 워커가 이미 뉴런을 썼으므로 ⛔재시도 금지.
console.log('\n  ── ⑥ network 만 다시 걸기 ──')
let 부른수 = 0
globalThis.fetch = async () => { 부른수++; throw new TypeError('Failed to fetch') }
await tidyRecipe(긴글)
잰다(부른수 === 2, '⑥-1 ⭐network 면 «한 번» 더 건다', '부른 수 ' + 부른수)

부른수 = 0
globalThis.fetch = async () => { 부른수++; return { ok: false, status: 502, json: async () => ({}) } }
await tidyRecipe(긴글)
잰다(부른수 === 1, '⑥-2 ⛔502 는 다시 안 건다 (워커가 이미 뉴런을 썼다)', '부른 수 ' + 부른수)

부른수 = 0
globalThis.fetch = async () => { 부른수++; const e = new Error('aborted'); e.name = 'AbortError'; throw e }
await tidyRecipe(긴글)
잰다(부른수 === 1, '⑥-3 ⛔timeout 도 다시 안 건다 (시간이 다한 것이라 또 끊긴다)', '부른 수 ' + 부른수)

// 🤖 「AI로 다시 다듬기」 단추 — ⚠️정직하게 = 소스 모양 칸이다(편집 화면은 브라우저가 있어야 돈다)
const 에디터2 = readFileSync(join(앱, 'src/screens/EditorScreen.jsx'), 'utf8')
잰다(/const 다시다듬기 = async \(\) => \{/.test(에디터2), '⑥-4 「다시 다듬기」가 있다')
잰다(/if \(다듬는중 \|\| !rawText\) return/.test(에디터2), '⑥-5 ⛔두 번 눌러 두 판이 겹치지 않는다')
잰다(/'AI로 다시 다듬기'/.test(에디터2), '⑥-6 단추 글자가 있다')
잰다(!/'🤖 AI로 다시 다듬기'/.test(에디터2) && !/<br \/>🤖/.test(에디터2),
  '⑥-6b ⛔화면 글자에 유니코드 이모지가 없다 (창업자 절대 금지 · 우리 스티커만)')
잰다(/열쇠를 안 써요/.test(에디터2), '⑥-7 ⭐열쇠가 «안» 든다고 화면에 적혀 있다')

globalThis.fetch = 원본fetch

console.log(`\n${실패 ? '⛔⛔ ' + 실패 + '건 어긋남' : '✅ 전부 통과'}  ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
