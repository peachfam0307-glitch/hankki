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
// ⑩⑪ 칸은 «앱 소스»를 읽는다 — 워커만 맞고 앱이 안 부르면 유저에겐 아무 일도 안 난다(창업자 냉장고 제보).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
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

// ── ⑧ 🎁 «어느 것»을 받았나 — 화면이 줄을 긋는 근거 ──────────────
//   📮 창업자 2026-09-01 = *"받은건 줄이 그어지면 좋겠어. 뭘로 받은지 모르니까"*
//   ⛔ 개수(bonus)만으론 못 긋는다 — 위에서부터 개수만큼 긋는 건 «거짓말»이다.
console.log('  ── ⑧ 받은 목록 ──')
{
  const kv = mkKv()
  const a = await 받기(kv, '일기', { uid: 'g1' })
  잰다(Array.isArray(a.body.left.earned) && a.body.left.earned.length === 1 && a.body.left.earned[0] === '일기',
    '⑧-1 받으면 그 행동 이름이 목록에 온다', JSON.stringify(a.body.left.earned))
  await 받기(kv, '냉장고', { uid: 'g1' })
  const c = await 받기(kv, '레꾸', { uid: 'g1' })
  잰다(['일기', '냉장고', '레꾸'].every((x) => c.body.left.earned.includes(x)) && c.body.left.earned.length === 3,
    '⑧-2 셋을 받으면 셋 다 들어 있다', JSON.stringify(c.body.left.earned))
  잰다(!c.body.left.earned.includes('요리') && !c.body.left.earned.includes('자랑'),
    '⑧-3 ⛔안 받은 것은 «안» 들어간다(안 그러면 화면이 줄을 잘못 긋는다)')
  // ⭐ 사진을 읽는 «보통 길»에서도 와야 한다 — 가져오기 화면은 이 답으로 줄을 긋는다
  const d = await 담기(kv, { uid: 'g1' })
  잰다(Array.isArray(d.body.left.earned) && d.body.left.earned.length === 3,
    '⑧-4 ⭐사진 읽는 길의 답에도 목록이 실린다', JSON.stringify(d.body.left.earned))
}

// ── ⑨ 🕳🕳 로그인하면 다섯을 «또» 받던 구멍 (2026-09-01 에 찾아 막았다) ──
//   ⛔ 표식이 `earn:<통>:<행동>` 인데 로그인하면 통이 `d:uid` → `a:sub` 로 바뀐다.
//      옛 표식을 못 찾아 **전부 다시 줬다** — 보너스가 5 → 10.
//   ⭐ 「1회 한정」은 창업자가 못 박은 약속이라(*"다 1회한정으로"*) 개수가 아니라 «약속»이 깨지는 자리다.
console.log('  ── ⑨ 로그인 재수령 구멍 ──')
{
  const kv = mkKv()
  // 비로그인으로 다섯을 다 받는다
  for (const 행동 of ['일기', '레꾸', '요리', '자랑', '냉장고']) await 받기(kv, 행동, { uid: 'h1' })
  const 전 = await 담기(kv, { uid: 'h1' })
  잰다(전.body.left.bonus === 5, '⑨-1 비로그인으로 다섯을 받았다(보너스 5)', '보너스 ' + 전.body.left.bonus)
  // 같은 기기에서 로그인 — 통 이름이 바뀐다
  const a = await 받기(kv, '일기', { uid: 'h1', sub: 'HSUB' })
  잰다(a.body.준것 === 0, '⑨-2 ⭐⭐로그인 뒤 같은 행동을 보내도 «안 준다»(구멍 막힘)', '준것 ' + a.body.준것)
  for (const 행동 of ['레꾸', '요리', '자랑', '냉장고']) await 받기(kv, 행동, { uid: 'h1', sub: 'HSUB' })
  const 후 = await 담기(kv, { uid: 'h1', sub: 'HSUB' })
  잰다(후.body.left.bonus === 5, '⑨-3 다섯을 또 보내도 보너스는 5 그대로(10 이 아니다)', '보너스 ' + 후.body.left.bonus)
  잰다(후.body.left.earned.length === 5, '⑨-4 로그인해도 받은 목록 다섯이 그대로 보인다', '목록 ' + 후.body.left.earned.length)
  // 🔁 되돌아가는 길도 막혔나 — 로그인해서 받고 로그아웃하면?
  const kv2 = mkKv()
  await 받기(kv2, '일기', { uid: 'h2', sub: 'HSUB2' })
  const 아웃 = await 받기(kv2, '일기', { uid: 'h2' })
  잰다(아웃.body.준것 === 0, '⑨-5 ⭐로그인해서 받고 «로그아웃»해도 또 안 준다(양쪽에 찍는다)', '준것 ' + 아웃.body.준것)
}

// ── ⑩ 🧊 냉장고 — 유저가 쓰는 길이 «둘»이다 (창업자 제보 2026-09-01) ──
//   📮 창업자 = *"냉장고에 재료 넣어도 열쇠 안차. 다른거 4개는 다 되고"*
//   ⛔⛔ 원인 = 영수증 스캔 길(saveFound)에만 붙이고 **직접 넣기(PantryForm.save)를 빠뜨렸다.**
//      📌 「붙였다」와 「유저가 가는 길에 붙였다」는 다른 말이다.
//   ⭐ 그래서 여기서 재는 것은 워커가 아니라 **앱 소스에 부르는 자리가 «둘 다» 있나**이다.
console.log('  ── ⑩ 냉장고 두 길 ──')
{
  const src = fs.readFileSync(path.join(여기, '../src/components/PantryView.jsx'), 'utf8')
  // 주석에 적어둔 것까지 세면 고쳐놓고도 통과한다 → «코드 줄»만 센다(규칙 18 ⓘ)
  const 부르는줄 = src.split('\n').filter((l) => /열쇠받기\(EARN\.냉장고\)/.test(l) && !/^\s*\/\//.test(l))
  잰다(부르는줄.length === 2, '⑩-1 ⭐냉장고 열쇠를 부르는 자리가 «둘»이다(영수증 ＋ 직접 넣기)', '자리 ' + 부르는줄.length)
  // 직접 넣기 자리인가 — `addPantry` 를 부른 갈래 안에 있어야 한다
  const 직접 = /addPantry\(\{ id: newId\(\), addedAt: Date\.now\(\), \.\.\.data \}\)[\s\S]{0,700}?열쇠받기\(EARN\.냉장고\)/.test(src)
  잰다(직접, '⑩-2 ⭐«직접 넣기» 갈래 안에 있다(창업자가 쓴 그 길)')
  const 영수증 = /store\.addPantry\(\{[\s\S]{0,400}?열쇠받기\(EARN\.냉장고\)/.test(src)
  잰다(영수증, '⑩-3 영수증 스캔 갈래도 그대로 살아 있다')
  // 나머지 넷도 여전히 붙어 있나 — 하나를 고치다 다른 걸 떨어뜨리지 않게
  const 자리 = {
    레꾸: 'src/screens/RecipeDetailScreen.jsx', 자랑: 'src/screens/BragScreen.jsx',
    일기: 'src/screens/DiaryScreen.jsx', 요리: 'src/screens/CookScreen.jsx',
  }
  for (const [행동, 파일] of Object.entries(자리)) {
    const s = fs.readFileSync(path.join(여기, '..', 파일), 'utf8')
    잰다(new RegExp(`열쇠받기\\(EARN\\.${행동}\\)`).test(s), `⑩-4 ${행동} 부르는 자리가 살아 있다 (${파일.split('/').pop()})`)
  }
}

// ── ⑪ 🖥 화면이 «개수»가 아니라 «목록»으로 줄을 긋나 ────────────────
//   ⛔ 개수만큼 위에서부터 긋는 코드가 되살아나면 화면이 거짓말을 한다.
console.log('  ── ⑪ 가져오기 목록 화면 ──')
{
  const s = fs.readFileSync(path.join(여기, '../src/components/EarnList.jsx'), 'utf8')
  잰다(/left\.earned/.test(s), '⑪-1 서버가 준 «목록»을 읽는다')
  잰다(/받은수 >= 줄들\.length\) return null/.test(s), '⑪-2 ⭐다섯을 다 받으면 카드가 «사라진다»(창업자 확정)')
  잰다(/slice\(0,\s*받은수\)|index <\s*받은수|i <\s*받은수/.test(s) === false,
    '⑪-3 ⛔개수만큼 «위에서부터» 긋지 않는다(그건 거짓말이다)')
  const css = fs.readFileSync(path.join(여기, '../src/styles.css'), 'utf8')
  잰다(/\.earn-list li\.done[^}]*line-through/.test(css), '⑪-4 받은 줄에 «줄»이 그어진다')
  잰다(/\.earn-got[^}]*text-decoration:\s*none/.test(css), '⑪-5 「받았어요」 이름표엔 줄이 안 그어진다(읽혀야 한다)')
}

globalThis.fetch = 진짜fetch
console.log('\n' + (실패 ? `⛔ ${실패}칸 실패 (통과 ${통과})` : `✅ ${통과}/${통과} 통과`) + '\n')
process.exit(실패 ? 1 : 0)
