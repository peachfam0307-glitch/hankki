// 【🔴 살아있는 할 일 · 9월 결제】 ⛔보관소 아님. **진짜 버그 둘을 찾아뒀고 아직 안 고쳤다**(Vision 실패해도 깎임 · 동시요청 2건이 1건). 고치는 날 smoke 에 넣는다.
// 💰💰 「돈 낸 사람 카운트가 정확한가」 재현 — 창업자 2026-08-21
//
// 📮 창업자 원문 = *"나는 유료를 켜면 돈 낸 사람들한테 **잘못카운트되거나
//    (안썼는데 썼다, 썼는데 안썼다) 이게 제일 중요한거라** 지금 그게 문제가 없는지가 중요한거야"*
//    ＋ *"9월에는 켜야해 유료버전. 20장 다쓰는 사람들 분명있을텐데 OCR쓰면 답답하잖아"*
//
// ⭐⭐⭐ 이 판이 앞의 두 재현판(_repro-묶음1장-0813 · _repro-잔량표시-0813)과 «다른» 점
//   ⑴ 그 둘은 worker 로직을 **베껴 적어** 돌린다 → 원본이 바뀌면 거짓 초록이 된다
//      (그 파일 134줄이 스스로 그렇게 적어 뒀다)
//   ⑵ 그 둘은 **「묶음 1장」 방식**을 잰다 — 그건 창업자가 «안 쓴다»고 확정했고 서버에도 안 올라갔다
//   👉 그래서 **지금 실제로 도는 것**을 재는 판이 없었다. 이 파일이 그 자리다.
//
// ✅ 여기서는 **`ocr-proxy/worker.js` 를 «그대로 import 해서» 돌린다.** 흉내가 아니다(절대원칙 30).
//    · KV = 가짜(Map) — Cloudflare KV 의 규칙(문자열 저장·없으면 null)을 그대로 흉내
//    · Vision = globalThis.fetch 를 가로채서 성공/실패를 «내가» 정한다
//
// ⚠️⚠️ **배포본 재현법** — 지금 Cloudflare 에 올라간 판엔 batch 코드가 «없다»(창업자 확정 「사진 1장 = 1장」).
//    ⭐ 저장소 코드에 **batch 를 안 실어 보내면** `sameBatch` 가 늘 false 라 **장당 차감** = 배포본과 같은 동작.
//    → 그래서 아래 「지금」 칸은 batch 없이, 「켰을 때」 칸은 batch 를 실어 돌린다. 한 파일에서 둘 다 잰다.
//
// 🔢 창업자 물음을 그대로 두 갈래로 나눠 잰다
//    Ⓐ **안 썼는데 썼다**(과다 차감) — 돈 낸 사람이 «잃는다». 제일 나쁘다.
//    Ⓑ **썼는데 안 썼다**(과소 차감) — 우리가 «손해». 유저는 이득이라 조용히 샌다.
//    Ⓒ **화면 숫자가 실제와 다르다** — 분쟁 1순위(「샀는데 어디 갔지」)

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const worker = (await import(path.join(여기, '../ocr-proxy/worker.js'))).default

// ── 가짜 KV — Cloudflare KV 의 성질을 그대로 ──────────────────────
//   · 값은 «문자열»로만 저장된다(정수를 넣어도 문자열로 나온다)
//   · 없는 키는 null (undefined 가 아니다 — worker 가 `raw === null` 로 웰컴을 판정한다)
function 가짜KV() {
  const 통 = new Map()
  return {
    통,
    async get(k) { return 통.has(k) ? String(통.get(k)) : null },
    async put(k, v) { 통.set(k, String(v)) },
    보기: (k) => (통.has(k) ? parseInt(통.get(k), 10) : null),
  }
}

// ── 가짜 요청 ─────────────────────────────────────────────────────
// ⚠️ `ip` 를 왜 갈아끼우나 — worker 에 **IP 당 분당 6회** 벽이 있다(`PER_IP_PER_MIN`).
//    같은 IP 로 7번 넘게 쏘면 카운트가 아니라 «그 벽»에 걸려서, 카운트만 재려던 칸이 헛돈다.
//    📌 규칙 18 ⓘ — 검사가 «무엇을 보고 있는지». 순수 카운트를 잴 땐 IP 를 흩는다.
let ip번호 = 0
function 요청({ uid = 'u1', batch = '', ip = null, origin = 'https://peachfam0307-glitch.github.io' } = {}) {
  const h = new Map([['Origin', origin], ['CF-Connecting-IP', ip || `10.0.0.${++ip번호}`]])
  return {
    // ⛔ url 이 없으면 워커가 `new URL(request.url)` 에서 죽는다(?quota 판정 자리).
    //    2026-09-01 에 이 판이 그래서 «돌지도 않았다» — 「버그가 있다」가 아니라 「판이 깨졌다」였다.
    url: 'https://hankki-ocr.example/',
    method: 'POST',
    headers: { get: (k) => h.get(k) ?? h.get(k.toLowerCase()) ?? null },
    async json() { return { image: 'data:image/png;base64,AAAA', uid, batch } },
  }
}

// ── Vision 흉내 — 성공·실패를 내가 정한다 ─────────────────────────
let 비전모드 = 'ok'
const 진짜fetch = globalThis.fetch
globalThis.fetch = async (url) => {
  if (!String(url).includes('vision.googleapis.com')) return 진짜fetch(url)
  if (비전모드 === 'throw') throw new Error('network down')      // vision_fetch_failed 경로
  if (비전모드 === 'http500') return new Response('boom', { status: 500 })  // vision_error 경로
  return new Response(JSON.stringify({
    responses: [{ fullTextAnnotation: { text: '재료 두부 300g' } }],
  }), { status: 200 })
}

const env = { APP_TOKEN: '', FOUNDER_SECRET: 'x', VISION_KEY: 'k' }

async function 한번(kv, opts) {
  const r = await worker.fetch(요청(opts), { ...env, OCR_KV: kv })
  let body = null
  try { body = await r.json() } catch { /* noop */ }
  return { status: r.status, body }
}

// ── 채점 ──────────────────────────────────────────────────────────
let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(갈래, 이름, 값, 기대) {
  const ok = String(값) === String(기대)
  if (ok) 통과++
  else { 실패++; 실패목록.push(`${갈래} ${이름} — 나온 값 ${값} · 기대 ${기대}`) }
  console.log(`  ${ok ? '✅' : '❌'} [${갈래}] ${이름}${ok ? '' : `  → ${값} (기대 ${기대})`}`)
}

const 웰컴 = (kv, uid = 'u1') => kv.보기(`w:${uid}`)
const 이달 = (kv, uid = 'u1') => {
  const ym = new Date().toISOString().slice(0, 7)
  return kv.보기(`u:${uid}:${ym}`)
}
const 전역월 = (kv) => kv.보기(`m:${new Date().toISOString().slice(0, 7)}`)

console.log('\n💰 카운트 정확성 재현 — 「안 썼는데 썼다 / 썼는데 안 썼다」\n')

// ═══════════════════════════════════════════════════════════════
console.log('Ⓐ 안 썼는데 «썼다» — 과다 차감 (돈 낸 사람이 잃는다)')
// ═══════════════════════════════════════════════════════════════

// ① 정상 한 장 = 정확히 1장
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  const r = await 한번(kv, {})
  chk('Ⓐ①', '정상 1장 → 웰컴 19', 웰컴(kv), 19)
  chk('Ⓐ①', '정상 1장 → 응답이 19라고 말한다', r.body?.left?.welcome, 19)
}

// ② ⛔ Vision 이 «연결 자체가 안 될 때» — 글자를 한 자도 못 받았는데 깎였나
{
  const kv = 가짜KV()
  비전모드 = 'throw'
  const r = await 한번(kv, {})
  chk('Ⓐ②', '502 로 실패한다', r.status, 502)
  chk('Ⓐ②', '⭐결과를 못 받았는데 웰컴이 안 깎였나', 웰컴(kv), 20)
}

// ③ ⛔ Vision 이 «에러로 답할 때»(할당량·키 문제 등)
{
  const kv = 가짜KV()
  비전모드 = 'http500'
  await 한번(kv, {})
  chk('Ⓐ③', '⭐구글이 에러를 줬는데 웰컴이 안 깎였나', 웰컴(kv), 20)
}

// ④ 실패한 뒤 다시 시도 — 두 번 실패하면 두 장이 사라지나
{
  const kv = 가짜KV()
  비전모드 = 'throw'
  await 한번(kv, {})
  await 한번(kv, {})
  비전모드 = 'ok'
  await 한번(kv, {})
  chk('Ⓐ④', '⭐두 번 실패 뒤 한 번 성공 = 1장만 빠져야 한다', 웰컴(kv), 19)
}

// ⑤ 사진 3장(= 지금 배포본: 장당 차감) — 창업자 확정대로 «3장» 이어야 한다
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  for (let i = 0; i < 3; i++) await 한번(kv, {})
  chk('Ⓐ⑤', '사진 3장 → 3장 차감(창업자 확정 「1장=1장」)', 웰컴(kv), 17)
}

// ═══════════════════════════════════════════════════════════════
console.log('\nⒷ 썼는데 «안 썼다» — 과소 차감 (조용히 새는 쪽)')
// ═══════════════════════════════════════════════════════════════

// ① 같은 순간에 두 장이 겹쳐 들어오면 둘 다 세지나
//    ⚠️ IP 를 갈라 준다 — 안 그러면 「분당 6회」 벽에 걸려 카운트가 아닌 걸 재게 된다
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  await Promise.all([한번(kv, { ip: '2.0.0.1' }), 한번(kv, { ip: '2.0.0.2' })])
  chk('Ⓑ①', '⭐동시에 2장 → 웰컴이 18 인가(2장 다 세졌나)', 웰컴(kv), 18)
  chk('Ⓑ①', '⭐동시에 2장 → 전역 월 카운터도 2', 전역월(kv), 2)
}

// ② 웰컴을 다 쓴 뒤 월 카운터로 넘어가는 «경계»
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  for (let i = 0; i < 20; i++) await 한번(kv, {})
  chk('Ⓑ②', '20장 쓰면 웰컴 0', 웰컴(kv), 0)
  chk('Ⓑ②', '⭐그동안 월 카운터도 같이 20 (창업자 확정 = 한 통)', 이달(kv), 20)
  const r = await 한번(kv, {})
  chk('Ⓑ②', '21번째는 막힌다(월 5 를 넘었으므로)', r.status, 429)
  chk('Ⓑ②', '막힌 요청은 «안» 깎는다', 이달(kv), 20)
}

// ═══════════════════════════════════════════════════════════════
console.log('\nⒸ 화면 숫자가 실제와 같은가 (분쟁 1순위)')
// ═══════════════════════════════════════════════════════════════

// ① 매 요청마다 응답 숫자 = KV 실제값
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  let 어긋남 = 0
  for (let i = 0; i < 5; i++) {
    const r = await 한번(kv, {})
    if (r.body?.left?.welcome !== 웰컴(kv)) 어긋남++
  }
  chk('Ⓒ①', '⭐5번 내내 화면 숫자 = 서버 실제값', 어긋남, 0)
}

// ② 웰컴이 0이 된 «그 순간» 월 잔량을 정직하게 말하나
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  let 마지막 = null
  for (let i = 0; i < 20; i++) 마지막 = await 한번(kv, {})
  chk('Ⓒ②', '20장째 응답 = 웰컴 0', 마지막.body?.left?.welcome, 0)
  chk('Ⓒ②', '⭐20장째 응답 = 이번 달도 0 (한 통이라 같이 소진)', 마지막.body?.left?.month, 0)
}

// ③ 실패한 요청은 숫자를 안 흔든다
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  await 한번(kv, {})            // 19
  비전모드 = 'throw'
  await 한번(kv, {})            // 실패
  비전모드 = 'ok'
  const r = await 한번(kv, {})  // 18 이어야 한다
  chk('Ⓒ③', '⭐성공 → 실패 → 성공 = 18 (실패는 안 센다)', r.body?.left?.welcome, 18)
}

// ═══════════════════════════════════════════════════════════════
console.log('\nⒹ 「켰을 때」 — batch(묶음 1장)를 올리면 어떻게 되나')
//   ⛔ 지금은 «안 올린» 상태다(창업자 확정). 나중에 켤 때를 대비해 같이 재 둔다.
// ═══════════════════════════════════════════════════════════════
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  for (let i = 0; i < 3; i++) await 한번(kv, { batch: 'b1' })
  chk('Ⓓ', '한 묶음 3장 → 유저 몫은 1장만', 웰컴(kv), 19)
  chk('Ⓓ', '그래도 전역(비용 방어)은 3번 다 오른다', 전역월(kv), 3)
}
{
  const kv = 가짜KV()
  비전모드 = 'throw'
  await 한번(kv, { batch: 'b9' })   // 실패
  비전모드 = 'ok'
  await 한번(kv, { batch: 'b9' })   // 같은 묶음 재시도
  chk('Ⓓ', '⭐실패 뒤 같은 묶음 재시도 = 1장만', 웰컴(kv), 19)
}

// ═══════════════════════════════════════════════════════════════
console.log('\nⒺ 캡처를 «여러 장» 한 번에 골랐을 때 — 분당 6회 벽')
//   ⛔ 앱은 사진 장수를 «안» 막는다(`EditorScreen.jsx:483` = multiple, 상한 없음)
//   ⛔ 그리고 `pumpOcr` 이 `while` 루프라 **사람 손이 안 낀다** — 연속으로 쏜다(`:304`)
//   → 한 사람이 한 IP 로 1분 안에 7장을 넘길 수 있다.
// ═══════════════════════════════════════════════════════════════
{
  const kv = 가짜KV()
  비전모드 = 'ok'
  const 결과 = []
  for (let i = 0; i < 9; i++) 결과.push(await 한번(kv, { ip: '3.3.3.3' }))
  const 성공 = 결과.filter((r) => r.status === 200).length
  const 막힘 = 결과.filter((r) => r.status === 429).length
  chk('Ⓔ', '9장 중 AI 로 읽힌 것 = 6장', 성공, 6)
  chk('Ⓔ', '9장 중 막힌 것 = 3장 (기본 인식으로 떨어진다)', 막힘, 3)
  chk('Ⓔ', '⭐막힌 3장은 «안» 깎였다 — 돈은 안 잃는다', 웰컴(kv), 14)
}

// ═══════════════════════════════════════════════════════════════
console.log('\n──────── 결과 ────────')
console.log(`통과 ${통과} · 실패 ${실패}`)
if (실패목록.length) {
  console.log('\n⛔ 실패한 것:')
  실패목록.forEach((s) => console.log('   · ' + s))
}
process.exit(실패 ? 1 : 0)
