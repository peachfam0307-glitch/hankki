#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔑 「사진 한 장 = 열쇠 한 개」 — 진짜 워커를 «불러서» 잰다  (2026-09-01)
//
// 📮 창업자 «최종» 확정 (2026-08-13 밤) = *"그냥 1장당 1장 카운트하기로 정했어"*
//    · *"2장레시피 잘없기도하고 있어도 50원이야"* · *"그정도는 유저가 부담해도 충분해"*
//
// ⛔⛔ **이 판이 «옛 판(_repro-묶음1장-0813.mjs)»을 대신한다. 그 판은 반대를 단언했다.**
//    옛 판은 스모크에서 매일 통과하면서
//      *"캡처 3장을 한 묶음으로 읽어도 유저 장수는 1장만 빠진다"*
//    고 말했는데 **서버엔 그 코드가 없어서 실제로는 3장이 빠졌다.**
//    📌 2026-08-21 에 그 파일만 읽고 «묶음 1장이 잘 돌고 있다»고 창업자에게
//       잘못 보고한 사고가 «같은 날 둘» 났다(클로드 · 외부 AI 검토판).
//
// ⭐⭐ **왜 판을 새로 짰나 = 옛 판이 워커를 «옮겨 적어» 재고 있었다**(절대원칙 30 위반).
//    🔢 그 복사본은 `LIMITS.WELCOME_FREE: 20` 이라고 적고 있었다 — **워커는 30이다.**
//       복사본이 이미 «조용히» 어긋나 있었고, 그래도 초록불이었다.
//    ✅ 이 판은 `ocr-proxy/worker.js` 를 **직접 import 해서 진짜로 부른다.** 흉내가 아니다.
//       → 워커가 바뀌면 이 판이 «먼저» 안다.
//
// 🔙 「묶음 1장」으로 다시 정하는 날 = 이 판을 뒤집고 worker 를 `git show 6b196c44` 에서 꺼낸다.
// ═══════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs'

let 통과 = 0, 실패 = 0
const ok = (m, v) => { console.log('  ✅ ' + m + (v !== undefined ? '  ' + v : '')); 통과++ }
const no = (m, v) => { console.log('  ⛔ ' + m + (v !== undefined ? '  ' + v : '')); 실패++ }
const 잰다 = (조건, m, v) => (조건 ? ok(m, v) : no(m, v))

console.log('\n🔑 사진 한 장 = 열쇠 한 개 (진짜 워커를 부른다)\n')

// ── 가짜 KV — Cloudflare KV 와 같은 모양(get/put) ──────────────
const mkKv = () => {
  const m = new Map()
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v) },
    _m: m,
  }
}
const num = async (kv, k) => { const v = await kv.get(k); return v ? parseInt(v, 10) || 0 : 0 }
// 🔑🔑 **워커가 «실제로 쓴» 키를 앞글자로 찾는다 — 날짜를 여기서 다시 «계산하지» 않는다.**
//   ⛔ 처음엔 `d:${new Date().toISOString().slice(0,10)}` 로 키를 만들어 읽었는데 두 가지가 나빴다:
//      ⑴ 그건 **워커를 흉내내는 것**이다 — 워커가 키 모양을 바꾸면 이 판이 «못 찾고 0» 을 읽어 조용히 통과한다
//      ⑵ 절대원칙 27(「오늘」은 `today.js` 한 곳에서만)에 걸린다 — `check-kst` 게이트가 «맞게» 잡았다
//   ✅ 앞글자로 찾으면 **워커가 무슨 이름으로 쓰든 그 값을 그대로 읽는다.** 날짜 계산이 0줄이다.
const 앞글자 = async (kv, 앞) => {
  let 합 = 0
  for (const [k, v] of kv._m) if (k.startsWith(앞)) 합 += parseInt(v, 10) || 0
  return 합
}

// ── Vision 을 «부르지 않는다» — 전역 fetch 를 가로챈다 ───────────
// ⛔ 진짜로 부르면 돈이 나가고, 이 판이 통을 축낸다
let vision부른수 = 0
const 진짜fetch = globalThis.fetch
globalThis.fetch = async (url) => {
  if (String(url).includes('vision.googleapis.com')) {
    vision부른수++
    return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '연근 400g' } }] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  return 진짜fetch(url)
}

const worker = (await import('../ocr-proxy/worker.js')).default

const APP_TOKEN = 'TESTTOKEN'
const ORIGIN = 'https://peachfam0307-glitch.github.io'   // ⛔ ALLOWED_ORIGINS 와 같아야 한다

// 진짜 워커를 한 번 부른다
async function 부르기(kv, { uid = 'u1', batch = '', founder = false } = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN, Origin: ORIGIN }
  if (founder) headers['x-hankki-founder'] = 'FOUNDERKEY'
  const req = new Request('https://hankki-ocr.example/', {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: 'data:image/png;base64,QUJDRA==', uid, batch }),
  })
  const res = await worker.fetch(req, { VISION_KEY: 'k', APP_TOKEN, FOUNDER_SECRET: 'FOUNDERKEY', OCR_KV: kv })
  return { status: res.status, body: await res.json() }
}

// ── ① ⭐⭐ 이 판의 심장 — 같은 묶음이어도 «장마다» 깎인다 ────────
console.log('  ── ① 사진 3장 = 열쇠 3개 ──')
{
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await 부르기(kv, { uid: 'u1', batch: 'BATCH1' })
  const 유저 = await 앞글자(kv, 'u:u1:')
  잰다(유저 === 3, '①-1 ⭐⭐같은 묶음으로 3장을 읽어도 «3개» 깎인다', '깎인 수 ' + 유저)
  const 웰컴남음 = parseInt(await kv.get('w:u1'), 10)
  잰다(웰컴남음 === 27, '①-2 웰컴이 30 → 27 이 된다', '남은 ' + 웰컴남음)
  잰다(vision부른수 === 3, '①-3 Vision 도 3번 불렸다(구글엔 부른 만큼 나간다)', vision부른수 + '번')
}

// ── ② 비용 방어는 «호출당» 그대로 ───────────────────────────────
console.log('  ── ② 전역 방어벽은 호출당 ──')
{
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await 부르기(kv, { uid: 'u2', batch: 'b' })
  잰다(await 앞글자(kv, 'm:') === 3, '②-1 전역 «월» 카운터 3')
  잰다(await 앞글자(kv, 'd:') === 3, '②-2 전역 «일» 카운터 3')
}

// ── ③ 웰컴을 다 쓰면 그 달 5장으로 넘어가고, 그 뒤엔 막힌다 ───────
console.log('  ── ③ 웰컴을 다 쓴 뒤 ──')
// ⭐ 「이미 다 쓴 사람」을 만들 때도 키를 손으로 짓지 않는다 —
//   **웰컴을 0으로 두고 «진짜로 5번 부른다».** 그러면 워커가 자기 키 모양으로 알아서 쌓는다.
{
  const kv = mkKv()
  await kv.put('w:u3', '0')                       // 웰컴을 이미 다 쓴 사람
  for (let i = 0; i < 5; i++) await 부르기(kv, { uid: 'u3' })   // 그 달 5장도 다 쓴다
  잰다(await 앞글자(kv, 'u:u3:') === 5, '③-0 다섯 번 부르면 그 달 몫이 5가 된다')
  const 막히기전 = await 앞글자(kv, 'm:')
  const r = await 부르기(kv, { uid: 'u3' })       // 여섯 번째 — 막혀야 한다
  잰다(r.status === 429 && r.body.error === 'user_quota', '③-1 다 쓰면 user_quota 로 막는다', r.status + ' ' + r.body.error)
  // ⭐ 막혔을 때 «카운터가 안 오른다» — 안 그러면 막힌 사람이 남의 통을 축낸다
  잰다(await 앞글자(kv, 'm:') === 막히기전, '③-2 ⭐막힌 요청은 전역 통을 «안» 축낸다', '전역 ' + 막히기전 + ' 그대로')
}

// ── ④ 창업자는 개인 한도만 우회하고 전역엔 «센다» ───────────────
console.log('  ── ④ 창업자 통로 ──')
{
  const kv = mkKv()
  await kv.put('w:f1', '0')
  for (let i = 0; i < 5; i++) await 부르기(kv, { uid: 'f1' })   // 개인 한도를 다 쓴다
  const 전역 = await 앞글자(kv, 'm:')
  const r = await 부르기(kv, { uid: 'f1', founder: true })
  잰다(r.status === 200, '④-1 창업자는 개인 한도를 지나간다(유저면 막힐 자리)', String(r.status))
  잰다(await 앞글자(kv, 'm:') === 전역 + 1, '④-2 ⛔그래도 전역엔 센다(통은 실제로 나간 양을 센다)')
  잰다(await 앞글자(kv, 'mf:') === 1, '④-3 창업자 몫을 따로도 센다(?quota 가 갈라 보여준다)')
}

// ── ⑤ 🔒 소스 잠금 — 묶음 코드가 «되살아나지» 않았나 ──────────────
//   ⛔ 위 ①~④ 는 «동작»을 재고, 이 칸은 «코드가 다시 들어왔나»를 본다.
//      동작만 재면 누가 묶음 코드를 넣고 조건을 꺼두는 식으로 되살릴 수 있다.
console.log('  ── ⑤ 묶음 코드가 되살아나지 않았나 ──')
const wk = readFileSync(new URL('../ocr-proxy/worker.js', import.meta.url), 'utf8')
// ⛔ 주석까지 세면 «되살리는 법»을 적어둔 설명에 걸린다(규칙 18 ⓘ) → 주석을 걷고 잰다
const wk코드 = wk.replace(/^\s*\/\/.*$/gm, '')
잰다(!/sameBatch/.test(wk코드), '⑤-1 ⭐`sameBatch` 가 코드에 0곳')
잰다(!/`b:\$\{uid\}/.test(wk코드), '⑤-2 묶음 표식 키(`b:`)를 안 쓴다')
잰다(/inc\(kv, `u:\$\{uid\}:\$\{ym\}`/.test(wk코드), '⑤-3 유저 몫이 «조건 없이» 깎인다')

// ── ⑥ 🔒 화면 문구가 «장당»으로 남아 있나 ──────────────────────
//   ⭐ 옛 판에서 가져온 칸이다 — 이건 여전히 값을 한다.
//      서버가 장당인데 화면이 「몇 장을 골라도 1장」이라 말하면 그게 거짓말이 된다.
console.log('  ── ⑥ 화면 문구가 서버와 같은 말을 하나 ──')
const 화면 = ['src/screens/EditorScreen.jsx', 'src/screens/ImportScreen.jsx']
  .map((f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''))
  .join('\n')
잰다(!/몇 장을 골라도/.test(화면), '⑥-1 ⛔「몇 장을 골라도 1장」이 화면에 «없다»')
잰다(!/1장만 써요|한 장만 써요/.test(화면), '⑥-2 ⛔「1장만 써요」가 화면에 «없다»')

globalThis.fetch = 진짜fetch
console.log('\n' + (실패 ? `⛔ ${실패}칸 실패 (통과 ${통과})` : `✅ ${통과}/${통과} 통과`) + '\n')
process.exit(실패 ? 1 : 0)
