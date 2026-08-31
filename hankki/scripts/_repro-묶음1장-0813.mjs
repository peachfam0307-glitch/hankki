// 🔢 「한 묶음 = 1장」 재현 — 창업자 확정 2026-08-13 (*"2장 썼는데 4장 나오면 문제"*)
//
// ⛔⛔⛔ **[결론] 이 방식은 «쓰지 않기로 정해졌다».** 창업자 최종 확정 = 「사진 1장 = 1장」 (2026-08-13 밤 *"그냥 1장당 1장 카운트하기로 정했어"*). 코드는 지우지 않고 남겨만 둔다 — 나중에 숫자가 나와 다시 논의하게 되면 그때 꺼내 쓴다. **서버엔 안 올렸으므로 지금 아무 영향도 없다.**
//   그래서 «지금 실제 동작»은 여전히 «사진 한 장마다 1장 차감»이다.
//   📮 창업자 2026-08-13 *"리스크를 감수하고싶진않은데"* → *"그래 원래대로 1장에 1장 하자.
//      2장레시피 잘없기도하고 있어도 50원이야"* · *"그정도는 유저가 부담해도 충분해"*
//      → 8/16 재신청이 사흘 앞이라 서버를 안 건드린다. 대신 **화면 안내를 정확히** 달았다.
//   ⭐ 아래 ①~⑥ 은 «올린 뒤 어떻게 되는가»의 재현이고,
//      🔒 잠금 검사 중 «화면 문구» 쪽은 «지금(안 올린 상태)» 기준이다. 올리는 날 그 두 줄을 뒤집는다.
//   👉 켜는 법 = `ocr-proxy/worker.js` 를 Cloudflare 에 붙여넣고 Deploy. 앱은 이미 묶음 표시를 보내고 있다.
//
// 무엇이 문제였나 = 여태 **사진 한 장 읽을 때마다** 유저 장수가 1장씩 빠졌다.
//   긴 레시피라 캡처 3장으로 «레시피 하나»를 만들면 3장이 나갔다.
//   유저 눈엔 레시피 하나 저장했는데 3장이 사라진 것 → 990원 20장팩이 7편밖에 못 만드는 셈.
//
// 어떻게 고쳤나 = 앱이 «편집 화면 한 번»마다 같은 `batch` 를 실어 보내고,
//   worker 는 그 묶음의 **첫 장에서만** 유저 몫(월 카운터·웰컴)을 깎는다.
//   ⛔ 비용 방어(전역 월900·일120·IP분당6)는 «호출당» 그대로다 — 구글엔 부른 만큼 돈이 나가니까.
//
// 여기서 확인하는 것 (전부 «돈»이 걸린 것)
//   ① 캡처 3장을 한 묶음으로 읽으면 유저 장수는 «1장»만 빠진다
//   ② 그래도 전역·일 카운터는 «3번» 다 오른다 (비용 방어는 호출당)
//   ③ 묶음이 다르면(=다른 레시피) 따로 센다
//   ④ 1장 남았는데 3장 묶음을 보내도 두 번째 장에서 «안» 막힌다 (이미 값을 치렀으니)
//   ⑤ 응답의 남은 장수가 헛돌지 않는다 (안 깎은 장에서 또 1을 빼면 안 된다)
//   ⑥ batch 를 «안» 보내는 옛 앱도 그대로 돈다 (장당 차감 — 후퇴가 아니다)
//
// ⛔ worker.js 의 판정을 바꾸면 여기도 같이 고칠 것.

import { readFileSync } from 'node:fs'

const LIMITS = { PER_USER_MONTHLY: 5, WELCOME_FREE: 20 }

const mkKv = () => {
  const m = new Map()
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v) },
    _m: m,
  }
}
const num = async (kv, k) => { const v = await kv.get(k); return v ? parseInt(v, 10) || 0 : 0 }
const inc = async (kv, k) => { await kv.put(k, String((await num(kv, k)) + 1)) }

// worker.js 의 순서 그대로 — 묶음 판정 → 한도 → 카운터 → 응답
async function call(kv, uid, ym, batch = '') {
  const raw = await kv.get(`w:${uid}`)
  const welcomeLeft = raw === null ? LIMITS.WELCOME_FREE : (parseInt(raw, 10) || 0)
  const sameBatch = batch ? (await kv.get(`b:${uid}:${batch}`)) !== null : false
  const userC = await num(kv, `u:${uid}:${ym}`)

  if (!sameBatch && welcomeLeft <= 0 && userC >= LIMITS.PER_USER_MONTHLY) {
    return { ok: false, error: 'user_quota' }
  }

  // 비용 방어 — «호출당» 그대로 (구글엔 부른 만큼 돈이 나간다)
  await inc(kv, `m:${ym}`)
  await inc(kv, `d:${ym}-15`)

  // 유저 몫 — «묶음의 첫 장에서만»
  if (!sameBatch) {
    await inc(kv, `u:${uid}:${ym}`)
    if (welcomeLeft > 0) await kv.put(`w:${uid}`, String(welcomeLeft - 1))
    if (batch) await kv.put(`b:${uid}:${batch}`, '1')
  }

  const leftWelcome = Math.max(0, sameBatch ? welcomeLeft : welcomeLeft - 1)
  let leftMonth = LIMITS.PER_USER_MONTHLY
  if (leftWelcome <= 0) leftMonth = Math.max(0, LIMITS.PER_USER_MONTHLY - (await num(kv, `u:${uid}:${ym}`)))
  return { ok: true, left: { welcome: leftWelcome, month: leftMonth } }
}

let ok = 0
let ng = 0
const chk = (설명, got, want) => {
  if (String(got) === String(want)) { console.log(`   ✅ ${설명}`); ok++ }
  else { console.log(`   ⛔ ${설명}\n        기대 ${want} · 실제 ${got}`); ng++ }
}

console.log('\n🔢 한 묶음 = 1장 재현\n')

{
  // ①② 캡처 3장을 «한 레시피»로 — 장수는 1장, 구글 호출은 3번
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await call(kv, 'u1', '2026-08', 'recipeA')
  chk('① 캡처 3장을 한 묶음으로 읽어도 유저 장수는 1장만 빠진다', await num(kv, 'u:u1:2026-08'), 1)
  chk('①-b 웰컴도 1장만 빠진다 (20 → 19)', parseInt(await kv.get('w:u1'), 10), 19)
  chk('② 그래도 전역 카운터는 3번 다 오른다 (비용 방어는 호출당)', await num(kv, 'm:2026-08'), 3)
  chk('②-b 일 카운터도 3번', await num(kv, 'd:2026-08-15'), 3)
}

{
  // ③ 묶음이 다르면 따로 센다 = 레시피 2개면 2장
  const kv = mkKv()
  await call(kv, 'u2', '2026-08', 'recipeA')
  await call(kv, 'u2', '2026-08', 'recipeA')
  await call(kv, 'u2', '2026-08', 'recipeB')
  chk('③ 레시피 둘(묶음 둘)이면 2장 빠진다', await num(kv, 'u:u2:2026-08'), 2)
  chk('③-b 창업자 기준 — 「2장 썼는데 4장 나오면 문제」가 안 난다', parseInt(await kv.get('w:u2'), 10), 18)
}

{
  // ④ 1장 남았는데 캡처 3장 묶음 — 두 번째 장에서 막히면 안 된다(이미 값을 치렀다)
  const kv = mkKv()
  await kv.put('w:u3', '0')                   // 웰컴 다 씀
  await kv.put('u:u3:2026-08', '4')           // 월 5장 중 4장 씀 = 1장 남음
  const r1 = await call(kv, 'u3', '2026-08', 'last')
  const r2 = await call(kv, 'u3', '2026-08', 'last')
  const r3 = await call(kv, 'u3', '2026-08', 'last')
  chk('④ 1장 남았을 때 3장 묶음 — 첫 장 통과', r1.ok, 'true')
  chk('④-b 두 번째 장도 통과 (이미 값을 치렀다)', r2.ok, 'true')
  chk('④-c 세 번째 장도 통과', r3.ok, 'true')
  chk('④-d 그래도 깎인 건 1장뿐', await num(kv, 'u:u3:2026-08'), 5)
  // 다음 «다른» 묶음은 막혀야 한다
  chk('④-e 다음 레시피(새 묶음)는 막힌다', (await call(kv, 'u3', '2026-08', 'next')).error, 'user_quota')
}

{
  // ⑤ 응답의 남은 장수가 헛돌지 않는다
  const kv = mkKv()
  const a = await call(kv, 'u4', '2026-08', 'r1')
  const b = await call(kv, 'u4', '2026-08', 'r1')
  chk('⑤ 첫 장 뒤 웰컴 19장', a.left.welcome, 19)
  chk('⑤-b 같은 묶음 두 번째 장도 «그대로» 19장 (안 깎았으니 안 뺀다)', b.left.welcome, 19)
}

{
  // ⑥ batch 를 안 보내는 옛 앱 — 예전처럼 장당 차감(후퇴가 아니라 그대로)
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await call(kv, 'u5', '2026-08', '')
  chk('⑥ batch 없이 보내면 예전처럼 3장 빠진다(옛 앱도 안 깨진다)', await num(kv, 'u:u5:2026-08'), 3)
}

// ⭐⭐ 위는 «옮겨 적은 것»이라 원본이 바뀌면 거짓 초록이 된다 — 원본을 직접 읽어 잠근다.
const wk = readFileSync(new URL('../ocr-proxy/worker.js', import.meta.url), 'utf8')
const ocr = readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
const ed = readFileSync(new URL('../src/screens/EditorScreen.jsx', import.meta.url), 'utf8')

chk('🔒 worker 가 batch 를 읽는다', /body\.batch/.test(wk), 'true')
chk('🔒 worker 가 같은 묶음인지 본다', /sameBatch = \(await kv\.get\(`b:\$\{uid\}:\$\{batch\}`\)\)/.test(wk), 'true')
chk('🔒 유저 몫이 «묶음 첫 장에서만» 깎인다', /\.\.\.\(sameBatch \? \[\] : \[/.test(wk), 'true')
// ⛔⛔ 전역·일·IP 는 «반드시» 호출당이어야 한다 — 묶음으로 묶으면 비용 방어가 뚫린다
chk('🔒⛔ 전역 월 카운터는 묶음 밖(=호출당)에 있다', /inc\(kv, `m:\$\{ym\}`/.test(wk.split('...(sameBatch ? [] : [')[0]), 'true')
chk('🔒⛔ 전역 일 카운터도 호출당', /inc\(kv, `d:\$\{ymd\}`/.test(wk.split('...(sameBatch ? [] : [')[0]), 'true')
chk('🔒⛔ IP 분당 카운터도 호출당', /inc\(kv, `ip:/.test(wk.split('...(sameBatch ? [] : [')[0]), 'true')
chk('🔒 한도 검사가 sameBatch 를 존중한다(두 번째 장이 막히면 안 된다)', /!sameBatch && welcomeLeft <= 0/.test(wk), 'true')
chk('🔒 안 깎은 장에서 잔량을 또 빼지 않는다', /sameBatch \? welcomeLeft : welcomeLeft - 1/.test(wk), 'true')

chk('🔒 앱이 batch 를 실어 보낸다', /batch: batch \|\| ''/.test(ocr), 'true')
chk('🔒 편집 화면이 «화면당 하나»의 묶음을 만든다', /const ocrBatch = useRef\(/.test(ed), 'true')
chk('🔒 그 묶음을 ocrImage 에 넘긴다', /batch: ocrBatch\.current/.test(ed), 'true')
// ⛔⛔⛔ **worker 를 아직 서버에 안 올렸다** — 그래서 «지금 실제»는 여전히 «장당 차감»이다.
//   📮 창업자 2026-08-13 *"리스크를 감수하고싶진않은데"* → *"그래 원래대로 1장에 1장 하자.
//      2장레시피 잘없기도하고 있어도 50원이야"* · *"그정도는 유저가 부담해도 충분해"*
//      → 8/16 재신청 사흘 앞이라 서버를 안 건드린다. 코드는 다 만들어 뒀으니 그날 붙여넣기 한 번이면 켜진다.
//   ⭐ 그래서 화면 문구는 «장당 차감»이 맞다. 서버를 올리는 날 이 두 줄을 «뒤집는다».
// ⛔⛔ [2026-08-21 잣대 고침] 여기 두 줄이 «낡아서» 죽었다 — **앱이 아니라 검사가 틀렸다.**
//    옛 잣대 = ⑴`ed.includes('사진 1장에 AI 스캔 1장씩')` ⑵`/', '사진 1장에 AI 스캔 1장씩', '/`
//    그날 화면이 「긴 레시피는 여러 장을 한꺼번에 골라도 돼요 — **사진 1장에 AI 스캔 1장씩** 써요」
//    한 줄이라 «배열 세 조각의 가운데가 굵다»를 그대로 잰 것이다. 모양에 잣대를 매달았다.
//    ⭐ 2026-08-21 에 창업자 지시로 값을 «따로 떼어 맨 위·빨강»으로 올렸다(*"1장 스캔하면 1장 까인다는걸"*).
//       화면은 더 정확해졌는데 «모양»이 달라져 옛 잣대가 죽었다.
//    ⛔⛔ 그리고 ⑴은 죽지도 않았다 — **거짓으로 통과했다.**
//       내가 이 변경을 설명하며 주석에 옛 문구를 그대로 인용했고, `includes` 가 그 «주석»에 걸렸다.
//       📌 소스를 통째로 grep 하는 검사는 «주석에 경위를 길게 적는» 우리 방식과 구조적으로 안 맞는다.
//    ✅ 그래서 ⓐ주석을 걷어내고 보고 ⓑ「모양」이 아니라 «뜻»을 잰다.
//       모양(어디가 굵나·어느 배열 몇 번째나)은 `_repro-장수안내-0821.mjs` 가
//       **화면에 그려진 글자와 computed style 로** 잰다 — 그쪽이 훨씬 세다(순서·색까지 본다).
const ed본문 = ed.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
// 🔑 이름은 «앱에서 읽는다» — 2026-08-24 「AI 스캔 1회」→「열쇠 1개」로 갈 때 이 잣대가 죽어서 드러났다.
//    ⭐ 뜻(＝장당 차감)은 그대로다. 바뀐 건 이름뿐이라 잣대만 옮긴다.
const OCR봉 = readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
const KEY_SHORT = (OCR봉.match(/export const KEY_SHORT = '([^']+)'/) || [])[1]
if (!KEY_SHORT) { console.log('⛔ src/ocr.js 에서 KEY_SHORT 를 못 찾았다'); process.exit(1) }
chk('🔒⭐ 화면 문구가 아직 «장당 차감»이다 (주석 뺀 진짜 코드에서)', new RegExp(`사진 1장에 \\{keyCount\\(1\\)\\}|사진 1장에 ${KEY_SHORT} 1`).test(ed본문), 'true')
// ⛔ 서버를 올리는 날 뒤집을 자리 = 이 줄이다. 그때 「몇 장을 골라도 1장」으로 바꾸고 아래를 뒤집는다.
chk('🔒⛔ 「몇 장을 골라도 1장」은 아직 «안» 적혀 있다 (서버가 옛 판이라 거짓말이 된다)',
  !/몇 장을 골라도|여러 장을 올려도 1장|묶음 1장/.test(ed본문), 'true')
chk('🔒⛔ 「AI 스캔은 1장만 써요」는 아직 쓰지 않는다(서버가 옛 판이라 거짓말이 된다)', ed.includes('AI 스캔은 1장만 써요'), 'false')

console.log(`\n   ── ${ok}칸 통과 · ${ng}칸 어긋남 ──\n`)
process.exit(ng ? 1 : 0)
