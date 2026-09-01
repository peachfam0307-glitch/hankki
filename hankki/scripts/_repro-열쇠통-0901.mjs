#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔑 열쇠 통 — 「비로그인 10 · 로그인 30」 ＋ 행동 열쇠 다섯 ＋ 막힘 세기 (2026-09-01)
//
// 📮 창업자 확정 = *"10 30 그렇게 가자. **구멍없이 설계 잘해줘 부탁해.**"*
//    그 앞 걱정 = *"앱지웠다가 깔면 또 가져가고 그렇게 되지 않을까;;"*
//
// ⭐⭐ **이 판도 `ocr-proxy/worker.js` 를 «직접 import 해서 진짜로 부른다»**(절대원칙 30).
//    옛 판들이 워커를 «옮겨 적어» 재다가 조용히 어긋난 적이 있다
//    (복사본은 `WELCOME_FREE: 20` 인데 워커는 30이었다 — 그래도 초록불이었다).
//
// 🕳 이 판이 지키는 구멍 (설계 = docs/무료열쇠-10-30-설계-2026-09-01.md)
//    🕳2  「남은 수」로 저장하면 로그아웃·로그인을 되풀이해 «무한»으로 받는다 → 「쓴 수」로 센다
//    🕳3  이미 30 받아 쓰던 사람이 **한 개도 줄면 안 된다**
//    🕳5  「일기 썼어」를 서버가 확인 못 한다 → **평생 1회**가 그 자리를 막는다
//    🕳6  오프라인이라 못 보낸 것을 나중에 다시 보내도 **한 번만** 준다(멱등)
//    🕳9·🕳10 로그아웃·기기 둘에서도 숫자가 안 헛돈다
// ═══════════════════════════════════════════════════════════════
let 통과 = 0, 실패 = 0
const ok = (m, v) => { console.log('  ✅ ' + m + (v !== undefined ? '  ' + v : '')); 통과++ }
const no = (m, v) => { console.log('  ⛔ ' + m + (v !== undefined ? '  ' + v : '')); 실패++ }
const 잰다 = (조건, m, v) => (조건 ? ok(m, v) : no(m, v))

console.log('\n🔑 열쇠 통 — 비로그인 10 · 로그인 30 ＋ 행동 열쇠\n')

const mkKv = () => {
  const m = new Map()
  return { get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v) }, _m: m }
}
// ⛔ 날짜를 여기서 만들지 않는다 — 워커가 «실제로 쓴» 키를 앞글자로 찾는다(절대원칙 27·30)
const 앞글자 = (kv, 앞) => {
  let 합 = 0
  for (const [k, v] of kv._m) if (k.startsWith(앞)) 합 += parseInt(v, 10) || 0
  return 합
}

const 진짜fetch = globalThis.fetch
globalThis.fetch = async (url) => {
  if (String(url).includes('vision.googleapis.com')) {
    return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '연근 400g' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return 진짜fetch(url)
}

const worker = (await import('../ocr-proxy/worker.js')).default
const APP_TOKEN = 'TESTTOKEN'
const ORIGIN = 'https://peachfam0307-glitch.github.io'
const ENV = (kv) => ({ VISION_KEY: 'k', APP_TOKEN, FOUNDER_SECRET: 'FOUNDERKEY', OCR_KV: kv })

// 사진 한 장을 읽는다(＝열쇠 1개를 쓴다)
// ⛔ **IP 를 칸마다 갈라 준다** — 안 그러면 「IP 분당 6회」 방어벽에 걸려
//    일곱 번째 호출부터 rate_limited 가 나고 «엉뚱한 이유로» 판이 죽는다(2026-09-01 실제로 겪음).
//    ⭐ 진짜 워커를 부르니 진짜 방어벽도 같이 도는 것이다 — 흉내였으면 안 걸렸다.
let ip번호 = 0
async function 담기(kv, { uid = 'u1', sub = '', ip = 'ip' + (++ip번호) } = {}) {
  const req = new Request('https://hankki-ocr.example/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN, Origin: ORIGIN, 'CF-Connecting-IP': ip },
    body: JSON.stringify({ image: 'data:image/png;base64,QUJDRA==', uid, ...(sub ? { sub } : {}) }),
  })
  const res = await worker.fetch(req, ENV(kv))
  return { status: res.status, body: await res.json() }
}
// 행동으로 열쇠를 받는다
async function 받기(kv, 행동, { uid = 'u1', sub = '', ip = 'ip' + (++ip번호) } = {}) {
  const req = new Request('https://hankki-ocr.example/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN, Origin: ORIGIN, 'CF-Connecting-IP': ip },
    body: JSON.stringify({ earn: 행동, uid, ...(sub ? { sub } : {}) }),
  })
  const res = await worker.fetch(req, ENV(kv))
  return { status: res.status, body: await res.json() }
}

// ── ① 그냥 깐 사람 = 10 ─────────────────────────────────────────
console.log('  ── ① 비로그인 = 10 ──')
{
  const kv = mkKv()
  const r = await 담기(kv, { uid: 'n1' })
  잰다(r.body.left.cap === 10, '①-1 상한이 10 이다', '상한 ' + r.body.left.cap)
  잰다(r.body.left.welcome === 9, '①-2 한 장 쓰면 9 남는다', '남은 ' + r.body.left.welcome)
  잰다(r.body.left.signed === false, '①-3 로그인 안 한 것으로 본다')
  // ⭐ 앱이 문구에 20 을 «글자로» 박지 않게 서버가 두 값을 다 준다
  잰다(r.body.left.anon === 10 && r.body.left.acct === 30, '①-4 두 상한을 같이 알려준다(앱이 「20개 더」를 스스로 만든다)')
}

// ── ② ⭐⭐ 이 판의 심장 — 로그인하면 «＋20» 되고 쓴 수는 그대로 ────
console.log('  ── ② 로그인하면 ＋20 ──')
{
  const kv = mkKv()
  let r
  for (let i = 0; i < 3; i++) r = await 담기(kv, { uid: 'm1' })
  잰다(r.body.left.welcome === 7, '②-1 비로그인으로 3장 쓰면 7 남는다', '남은 ' + r.body.left.welcome)
  const 쓴수전 = 앞글자(kv, 'wu:d:m1')
  r = await 담기(kv, { uid: 'm1', sub: 'GOOGLE1' })    // 같은 기기에서 로그인
  잰다(r.body.left.cap === 30, '②-2 상한이 30 으로 오른다', '상한 ' + r.body.left.cap)
  // 7 + 20 = 27 에서 이 판이 한 장을 썼으니 26
  잰다(r.body.left.welcome === 26, '②-3 ⭐⭐남은 게 «＋20» 된다(7 → 27, 이 판에서 1 써서 26)', '남은 ' + r.body.left.welcome)
  잰다(쓴수전 === 3, '②-4 로그인 «전» 쓴 수는 3 이었다')
  잰다(앞글자(kv, 'wu:a:GOOGLE1') === 4, '②-5 ⭐쓴 수가 «이어진다»(0 으로 안 돌아간다)', '계정 쓴 수 ' + 앞글자(kv, 'wu:a:GOOGLE1'))
  잰다(앞글자(kv, 'wu:d:m1') === 4, '②-6 🔗기기 통에도 같이 적는다(로그아웃해도 안 헛돈다)')
}

// ── ③ 로그아웃·로그인을 되풀이해도 «안 늘어난다» (🕳2) ────────────
console.log('  ── ③ 로그아웃·로그인 되풀이 ──')
{
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await 담기(kv, { uid: 'x1' })                 // 비로그인 3
  for (let i = 0; i < 3; i++) await 담기(kv, { uid: 'x1', sub: 'G2' })      // 로그인 3
  const r = await 담기(kv, { uid: 'x1' })                                    // 로그아웃
  // 쓴 수 7 · 상한 10 → 남은 3
  잰다(r.body.left.cap === 10, '③-1 로그아웃하면 상한이 10 으로 돌아온다', '상한 ' + r.body.left.cap)
  잰다(r.body.left.welcome === 3, '③-2 ⭐쓴 수(7)가 살아 있어 «남은 3» — 되풀이해도 안 늘어난다', '남은 ' + r.body.left.welcome)
}

// ── ④ 🕳3 이미 30 받아 쓰던 사람 — 한 개도 줄면 안 된다 ──────────
console.log('  ── ④ 옛 유저를 안 뺏는다 ──')
{
  const kv = mkKv()
  await kv.put('w:old1', '25')          // 옛 판이 남긴 「남은 25」
  const r = await 담기(kv, { uid: 'old1' })
  잰다(r.body.left.cap === 30, '④-1 ⭐옛 유저는 상한 30 을 그대로 지킨다', '상한 ' + r.body.left.cap)
  잰다(r.body.left.welcome === 24, '④-2 ⭐⭐남은 25 에서 한 장 써서 24 — «한 개도 안 줄었다»', '남은 ' + r.body.left.welcome)
  잰다(앞글자(kv, 'w:old1') === 25, '④-3 옛 표식을 살려 둔다(1년 뒤에도 상한 30 을 지키게)')
}

// ── ⑤ 🎁 행동 열쇠 다섯 — 평생 1회 · 멱등 ───────────────────────
console.log('  ── ⑤ 행동 열쇠 ──')
{
  const kv = mkKv()
  const a = await 받기(kv, '일기', { uid: 'e1' })
  잰다(a.body.준것 === 1 && a.body.left.cap === 11, '⑤-1 일기를 처음 쓰면 1개 준다(상한 10 → 11)', '상한 ' + a.body.left.cap)
  const b = await 받기(kv, '일기', { uid: 'e1' })
  잰다(b.body.준것 === 0 && b.body.left.cap === 11, '⑤-2 ⭐⭐같은 행동을 또 보내도 «안 준다»(멱등 · 오프라인 재전송 대비)')
  const c = await 받기(kv, '일기', { uid: 'e1' })
  잰다(c.body.left.cap === 11, '⑤-3 세 번을 보내도 그대로다')
  await 받기(kv, '레꾸', { uid: 'e1' }); await 받기(kv, '요리', { uid: 'e1' })
  await 받기(kv, '자랑', { uid: 'e1' })
  const e = await 받기(kv, '냉장고', { uid: 'e1' })
  잰다(e.body.left.cap === 15, '⑤-4 다섯을 다 하면 상한 15(＝10＋5)', '상한 ' + e.body.left.cap)
  const bad = await 받기(kv, '없는행동', { uid: 'e1' })
  잰다(bad.status === 400 && bad.body.error === 'bad_earn', '⑤-5 모르는 행동은 400 으로 막는다')
  잰다(앞글자(kv, 'm:') === 0 && 앞글자(kv, 'd:') === 0, '⑤-6 ⛔Vision 을 안 불렀으니 «전역 통을 안 축낸다»')
}

// ── ⑥ 🚧 막힘 세기 — 유료를 언제 켤지 정하는 숫자 ────────────────
console.log('  ── ⑥ 막힘 세기 ──')
{
  const kv = mkKv()
  await kv.put('w:q1', '0')                                  // 웰컴을 다 쓴 사람
  for (let i = 0; i < 5; i++) await 담기(kv, { uid: 'q1' })   // 그 달 5장도 다 쓴다
  잰다(앞글자(kv, 'q:') === 0, '⑥-1 막히기 전엔 0 이다')
  const r = await 담기(kv, { uid: 'q1' })
  잰다(r.status === 429 && r.body.error === 'user_quota', '⑥-2 막힌다')
  잰다(앞글자(kv, 'q:') === 1, '⑥-3 ⭐막힘이 1 올라간다(「살 사람」의 직접 증거)')
  await 담기(kv, { uid: 'q1' })
  잰다(앞글자(kv, 'q:') === 2, '⑥-4 또 막히면 2')
  잰다(앞글자(kv, 'm:') === 5, '⑥-5 ⛔막힌 것은 전역 통에 «안» 들어간다', '전역 ' + 앞글자(kv, 'm:'))
}

// ── ⑦ 🛡 IP 분당 6회 — «일부러» 같은 IP 로 두들겨 본다 ──────────
//   ⛔ 위 칸들은 IP 를 갈라 쓴다(안 그러면 엉뚱한 이유로 죽는다) → 이 방어벽을 아무도 안 재게 된다.
//      ⭐ 그래서 여기서 «콕 집어» 잰다. 검사가 «안 보는 것»은 언제든 조용히 비어 있을 수 있다(규칙 18 ⓘ).
console.log('  ── ⑦ IP 분당 6회 ──')
{
  const kv = mkKv()
  let 막힌수 = 0
  for (let i = 0; i < 8; i++) {
    const r = await 담기(kv, { uid: 'ipu' + i, ip: 'SAMEIP' })
    if (r.status === 429 && r.body.error === 'rate_limited') 막힌수++
  }
  잰다(막힌수 === 2, '⑦-1 여덟 번 두들기면 일곱·여덟 번째가 막힌다', '막힌 수 ' + 막힌수)
  잰다(앞글자(kv, 'q:') === 0, '⑦-2 ⛔IP 로 막힌 건 「막힘」에 «안» 센다(그건 무료 한도가 아니다)')
}

globalThis.fetch = 진짜fetch
console.log('\n' + (실패 ? `⛔ ${실패}칸 실패 (통과 ${통과})` : `✅ ${통과}/${통과} 통과`) + '\n')
process.exit(실패 ? 1 : 0)
