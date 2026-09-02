// 사진에서 글자 읽기 (OCR)
// 1순위: Google Vision OCR 프록시(Cloudflare Worker) — 한국어 인식 최상. 키는 서버에만 숨김.
// 2순위: 폰 내장 OCR(TextDetector) — 있으면 사용(요즘 크롬은 기본 비활성이라 대개 건너뜀).
// 3순위: tesseract.js (어디서나 동작·오프라인). LSTM 엔진 + 전처리.
import Tesseract, { createWorker } from 'tesseract.js'
import { normalizeNumerals } from './ocrCorrect'
// 🏷 「로그인해 둔 적이 있나」 표식만 읽는다 — ⛔파이어베이스를 «안» 받는다.
//   cloud.js 는 파이어베이스를 `await import` 로 늦게 부르고, 이 함수는 localStorage 한 줄만 본다.
//   (로그인 안 한 사람에게 167KB 를 지우지 않으려고 cloud.js:102 가 바로 그 목적으로 만든 것)
import { 로그인해뒀나, 내구글번호 } from './cloud'

// ── Google Vision OCR 프록시 ──────────────────────────────────
// 서버(Cloudflare Worker)가 API 키를 숨기고 Vision을 호출해 '텍스트'만 돌려준다.
// 프록시엔 6중 방어벽(월 900건 상한 등)이 있어 비용 $0을 물리적으로 보장한다.
// 실패(오프라인·한도초과·오류)하면 아래 폰내장/tesseract로 '조용히' 폴백 → OCR은 늘 동작.
const OCR_PROXY_URL = 'https://hankki-ocr.annyeong-hankki.workers.dev'
const OCR_APP_TOKEN = '0VRNDSjHBhwniTzIDAbnRaJygyfGJ2K2'

// 마지막 프록시 호출의 안내 신호 — 'user_quota'(내 월 무료 소진)·'global_quota'·'rate_limited'.
// 앱(EditorScreen)이 읽어 "무료 다 써서 기본 인식이에요" 안내를 띄운다. 읽으면 소비(초기화).
let _ocrNote = null
export function getOcrNote() {
  const n = _ocrNote
  _ocrNote = null
  return n
}

// 기기 식별자 — 유저당 월 무료 횟수 카운트용. 개인정보 아님(임의 난수), 이 브라우저에만 저장.
function deviceId() {
  try {
    let id = localStorage.getItem('hankki:did')
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('hankki:did', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

// 프록시로 OCR 시도 → 성공 시 텍스트, 실패 시 예외를 던져 폴백을 유도.
// batch = 🔢「한 묶음 = 1장」 표식. 같은 값으로 보내면 서버가 «유저 장수»를 한 번만 깎는다.
//   (앱의 편집 화면 한 번 = 레시피 하나 = 한 묶음 · 창업자 확정 2026-08-13)
async function ocrViaProxy(dataUrl, onProgress, batch) {
  _ocrNote = null
  if (typeof dataUrl !== 'string' || !/^data:image\//.test(dataUrl)) throw new Error('not_dataurl')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline')
  if (onProgress) onProgress(8)
  // ⏳⏳ [2026-08-16] **막대가 «기어가게» 한다** — 창업자 *"레시피 2장 안내시 로딩 오래걸리는거"*
  //   🔬 옛 판 = 여기서 35 를 한 번 주고, 서버가 답할 때까지 **막대가 그 자리에 멈춰 있었다.**
  //      올리는 것도 기다리는 것도 «알려줄 게 없어서» 아무 소식이 없다.
  //   ⛔ 멈춘 막대는 「오래 걸린다」가 아니라 **「고장났다」로 읽힌다** — 그게 앱을 끄는 순간이다.
  //   ✅ 그래서 서버를 기다리는 동안 8 → 85 로 «조금씩» 올린다. 85 에서 멈추고, 답이 오면 92 → 100.
  //      ⚠️ 100 까지 밀지 않는다 — 다 찼는데 안 끝나면 그게 더 「고장」처럼 보인다.
  //      ⚠️ 시간을 «맞히려» 하지 않는다. 빠르면 금방 92 로 뛰어넘고, 느리면 85 에서 기다린다.
  let 기어감 = null
  if (onProgress) {
    let p = 8
    기어감 = setInterval(() => {
      p += Math.max(0.6, (85 - p) * 0.06) // 뒤로 갈수록 느려진다 — 끝이 가까운 척하지 않으려고
      if (p >= 85) { p = 85; clearInterval(기어감); 기어감 = null }
      onProgress(Math.round(p))
    }, 220)
  }
  const 그만기어 = () => { if (기어감) { clearInterval(기어감); 기어감 = null } }
  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }
  // 운영자 무제한 모드(이 기기가 ?founder=…로 진입해 둔 경우)면 무제한 헤더를 실어 보낸다.
  try {
    const f = localStorage.getItem('hankki:founder')
    if (f) headers['x-hankki-founder'] = f
  } catch {
    /* noop */
  }
  let resp
  try {
    resp = await fetch(OCR_PROXY_URL, {
      method: 'POST',
      headers,
      // 🔑 로그인했으면 «구글 번호»를 같이 보낸다 — 서버가 그걸로 상한(10 ↔ 30)을 가른다.
      //   ⛔ 없으면 아예 «안 보낸다» — 빈 값을 보내면 서버가 「로그인했는데 번호가 빈 사람」으로 오해한다.
      body: JSON.stringify({ image: dataUrl, uid: deviceId(), batch: batch || '', ...(내구글번호() ? { sub: 내구글번호() } : {}) }),
    })
  } catch (e) {
    그만기어() // ⛔ 던지기 전에 반드시 멈춘다 — 안 그러면 폴백이 도는 내내 막대가 혼자 기어간다
    throw e
  }
  그만기어()
  if (!resp.ok) {
    // 429(한도 초과) → 어느 한도인지 기록(앱이 "무료 다 썼어요" 안내). 전부 폴백으로 넘긴다 — 앱은 늘 동작해야 하니까.
    if (resp.status === 429) {
      const d = await resp.json().catch(() => null)
      _ocrNote = (d && d.error) || 'quota'
    }
    throw new Error('proxy_http_' + resp.status)
  }
  const data = await resp.json().catch(() => null)
  if (onProgress) onProgress(92)
  // 📢 남은 장수 — 서버가 매번 같이 보내준다. ⛔예전엔 이 줄을 «버렸다»(창업자 *"카운트가 안된다고"*).
  if (data && data.left) saveOcrLeft(data.left)
  return (data && data.text) || ''
}

// ── 📢 AI 스캔 남은 장수 ────────────────────────────────────
// 서버(worker)가 응답에 `left` 를 실어 보낸다 — 남은 수 ＋ **상한까지**.
//   welcome = 🎁 웰컴 잔량(달이 바뀌어도 남는다) · month = 웰컴을 다 쓴 뒤의 그 달 잔량
//   cap/anon/acct/signed = 지금 상한 · 비로그인 상한 · 로그인 상한 · 로그인했나
// ⭐ note 와 달리 «읽어도 지우지 않는다» — 화면에 상시 떠 있어야 하니까.
//
// ✅✅ **[창업자 확정 2026-09-01] 비로그인 10 · 로그인 30** — *"10 30 그렇게 가자"*
//   ⭐ 유저가 보는 말 = **「로그인하면 열쇠 20개를 더 드려요」** (못 받는 게 아니라 «받는» 말)
//
// ⛔⛔ **숫자를 여기에 «글자로» 박지 않는다 — 서버가 알려주는 값을 쓴다.**
//   📌 그 전엔 앱과 워커가 «각자» 30 을 적어 두고 손으로 맞췄다. 10/30 이 되며 어긋날 자리가 두 배가 됐다.
//   ⭐ 아래 둘은 **서버 답을 한 번도 못 받았을 때만** 쓰는 «첫 화면용» 값이다.
//      ⛔ 차감·한도 판정에는 절대 안 쓴다 — 그건 언제나 서버가 정한다.
const WELCOME_ANON = 10 // ⛔ worker.js 의 LIMITS.WELCOME_ANON 과 같아야 한다
const WELCOME_ACCT = 30 // ⛔ worker.js 의 LIMITS.WELCOME_ACCT 과 같아야 한다
const MONTHLY_FREE = 5 // ⛔ worker.js 의 LIMITS.PER_USER_MONTHLY 와 같아야 한다
const LEFT_KEY = 'hankki:ocrLeft'
// 📢 「열쇠 값이 바뀌었다」 신호 — 알약과 가져오기 목록이 이걸 듣고 다시 그린다.
//   ⛔ 없으면 서버 답을 새로 받아도 **화면이 그대로다**(부품이 값을 한 번만 읽으니까).
//      2026-09-01 에 정확히 그래서 줄이 안 그어졌다.
export const LEFT_EVENT = 'hankki:left'

// ── 🔑 이 재화의 이름 ────────────────────────────────────────
// ✅✅ 창업자 확정 2026-08-24 = **「레시피열쇠」 · 세는 말 「개」** (⛔재론 금지)
//    📮 후보 10개를 실물 화면에 얹어 본 뒤 *"열쇠나 국자..가 젤 나은것같아"* → 근거를 보고 **"가"**
//    ⭐ 창업자가 콕 집은 장점 = *"횟수제라는 게 자연스럽게 느껴진다"* —
//       열쇠는 자물쇠 하나에 하나라 **쓰면 없어지는 게 당연**하다. (국자는 백 번 퍼도 그대로라 여기서 갈렸다)
//
// ⛔⛔ **이름을 화면 코드에 «글자로» 박지 말 것.** 여기서 읽는다.
//    📌 v11.02 「책갈피」 때 배운 것 — 같은 기능의 이름이 **일곱 곳**이었고 한 곳만 바꾸자 말이 갈라졌다.
//    ＋ 이 파일 주석에 내가 이미 적어뒀던 것: *"문구에 숫자 「5회」가 글자로 박혀 있다 → 한도를 바꾸면 문구만 낡는다."*
//       이름도 똑같다. **한 곳에서 읽으면 다음에 바뀌어도 한 줄만 고친다.**
//
// ⭐ 넓은 자리엔 `KEY_NAME`, 좁은 자리(칸·꼬리말)엔 `KEY_SHORT` — 창업자 잣대가
//    *"좁은 자리에선 줄여 쓸 수 있어야 한다(레시피열쇠 → 열쇠)"* 였다.
export const KEY_NAME = '레시피열쇠'
export const KEY_SHORT = '열쇠'
export const KEY_UNIT = '개'
// 「열쇠 3개」처럼 세어 준다. 좁은 자리용.
export const keyCount = (n) => `${KEY_SHORT} ${n}${KEY_UNIT}`

function saveOcrLeft(left) {
  const w = Math.max(0, parseInt(left.welcome, 10) || 0)
  const m = Math.max(0, parseInt(left.month, 10) || 0)
  // 🔢 상한도 같이 담는다 — 서버가 준 값이 언제나 이긴다(앱이 따로 세지 않는다)
  const 수 = (v, 기본) => (Number.isFinite(parseInt(v, 10)) ? Math.max(0, parseInt(v, 10)) : 기본)
  try {
    localStorage.setItem(LEFT_KEY, JSON.stringify({
      welcome: w,
      month: m,
      cap: 수(left.cap, null),
      bonus: 수(left.bonus, null),   // 🎁 행동으로 받은 개수 — 가져오기 목록이 「몇 개 받았나」에 쓴다
      // 🎁 «어느 것»을 받았나 — 창업자 2026-09-01 *"받은건 줄이 그어지면 좋겠어. 뭘로 받은지 모르니까"*
      //   ⛔ 폰이 «정하지» 않는다. 서버가 표식을 읽어 준 목록을 그대로 담는다.
      //   ⛔ 서버가 안 주면(옛 워커) **빈 배열이 아니라 `null`** 로 둔다 —
      //      빈 배열이면 「하나도 안 받았다」가 되어 **다 받은 사람 화면이 거짓말**을 한다.
      earned: Array.isArray(left.earned) ? left.earned.map(String) : null,
      anon: 수(left.anon, null),
      acct: 수(left.acct, null),
      signed: left.signed === true,
    }))
    // 📢 값이 바뀌었다고 알린다 — 알약·가져오기 목록이 듣고 다시 그린다.
    try { window.dispatchEvent(new Event(LEFT_EVENT)) } catch { /* noop */ }
  } catch {
    /* noop */
  }
}

// ── 🎁🎁 행동으로 받는 열쇠 다섯 (창업자 확정 2026-08-31) ─────────────
// 📮 창업자 = *"4개 왜냐면 우리 기능을 하나씩 써봤으면 좋겠어서"* · *"다 1회한정으로"*
// ⭐ 이건 「열쇠를 주는 일」이 아니라 **「앱을 안내하는 일」**이다.
//
// ⛔⛔ **「처음인가」를 폰이 판정하지 않는다.** 폰은 «했다»만 보내고 처음인지는 **서버가 정한다.**
//    폰이 세면 앱을 지웠다 깔 때마다 다시 받고, 폰 저장소를 만지면 그대로 조작된다.
// ⭐ 서버는 **멱등**이다 — 같은 행동을 몇 번 보내도 한 번만 준다. 그래서 «막 보내도 안전»하다.
export const EARN = { 자랑: '자랑', 레꾸: '레꾸', 일기: '일기', 요리: '요리', 냉장고: '냉장고' }
const 큐칸 = 'hankki:earnQ'
const 큐읽기 = () => { try { const v = JSON.parse(localStorage.getItem(큐칸) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
const 큐쓰기 = (a) => { try { localStorage.setItem(큐칸, JSON.stringify(a.slice(0, 20))) } catch { /* noop */ } }

async function 한번보내기(행동) {
  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }
  try { const f = localStorage.getItem('hankki:founder'); if (f) headers['x-hankki-founder'] = f } catch { /* noop */ }
  const resp = await fetch(OCR_PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ earn: 행동, uid: deviceId(), ...(내구글번호() ? { sub: 내구글번호() } : {}) }),
  })
  if (!resp.ok) throw new Error('earn_http_' + resp.status)
  const d = await resp.json().catch(() => null)
  if (d && d.left) saveOcrLeft(d.left)
  return d
}

// 🎁 행동 하나를 알린다. 되돌려주는 값 = 「방금 받았나」(true 면 토스트를 띄운다).
//   ⛔ 실패해도 «절대 던지지 않는다» — 이건 곁일이라, 이것 때문에 유저 흐름이 끊기면 안 된다.
//   ⭐ 못 보내면 폰에 쌓아 두고 다음에 다시 보낸다(🕳6 — 오프라인·비행기모드).
export async function 열쇠받기(행동) {
  if (!EARN[행동]) return false
  try {
    const d = await 한번보내기(행동)
    return !!(d && d.준것)
  } catch {
    const q = 큐읽기()
    if (!q.includes(행동)) 큐쓰기([...q, 행동])
    return false
  }
}

// 🔁 쌓아둔 것을 다시 보낸다 — 앱을 열 때·OCR 을 부를 때 조용히 돈다.
//   ⛔ 결과를 화면에 안 띄운다 — 유저는 이미 그 행동을 잊었다. 숫자만 조용히 맞춘다.
export async function 밀린열쇠보내기() {
  const q = 큐읽기()
  if (!q.length) return
  const 남은 = []
  for (const 행동 of q) {
    try { await 한번보내기(행동) } catch { 남은.push(행동) }
  }
  큐쓰기(남은)
}

// 🔎 서버에 «내 상태»를 물어 폰에 있는 값을 새로 맞춘다.
//   📮 창업자 2026-09-01 = 워커를 붙였는데도 줄이 안 그어졌다.
//   ⛔⛔ 그 전엔 서버 답을 «열쇠를 쓸 때»와 «행동할 때»만 받았다 →
//      화면은 폰에 저장된 «옛 답»을 그렸다. 서버를 고쳐도 «묻지 않으면» 안 바뀐다.
//   ⛔ 아무것도 주지도 깎지도 않는다(서버가 `조회` 를 그렇게 받는다).
//   ⛔ 실패해도 던지지 않는다 — 곁일이라 이것 때문에 화면이 멈추면 안 된다.
//      (못 받으면 폰에 있던 값을 그대로 쓴다 — 「모른다」로 덮지 않는다 · 규칙 18 ⓙ)
export async function 열쇠새로고침() {
  try {
    const headers = { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }
    try { const f = localStorage.getItem('hankki:founder'); if (f) headers['x-hankki-founder'] = f } catch { /* noop */ }
    const resp = await fetch(OCR_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 조회: 1, uid: deviceId(), ...(내구글번호() ? { sub: 내구글번호() } : {}) }),
    })
    if (!resp.ok) return false
    const d = await resp.json().catch(() => null)
    if (d && d.left) { saveOcrLeft(d.left); return true }
  } catch { /* noop */ }
  return false
}

// ── 📊📊 「기본 인식으로 읽었다」를 서버에 알린다 (창업자 지시 2026-09-01) ────
//
// 📮 창업자 = *"기본인식을 얼마나 썼는지도 알아야 하지 않을까"*
//    ＋ *"우리ai기능 유료 켤때 무료이용률도 알아야 가격이나 장수를 수정하니까"*
//
// ⛔⛔ **그 전엔 셀 방법이 «없었다»** — 기본 인식은 폰 «안»에서 도니까 서버를 안 거친다.
//    그래서 우리가 아는 건 「AI로 읽은 수」와 「막힌 수」뿐이었고 **무료 이용률은 숫자가 없었다.**
//
// ⛔ 보내는 것 = **갈래 하나뿐**이다. 기기 번호도, 사진도, 글자도 «안» 보낸다.
//    📌 「유저 «개인별» 사용량은 안 센다」를 그대로 지킨다 — 서버에도 전역 숫자만 쌓인다.
// ⛔ 실패해도 던지지 않는다 — 이건 곁일이라 유저 흐름을 못 막는다.
// ⭐ 못 보내면 쌓아 뒀다 다음에 보낸다 — ⚠️**오프라인일 때가 곧 「실패」 갈래**라
//    큐가 없으면 하필 그 갈래만 조용히 빠진다(＝값을 정할 때 제일 틀리기 쉬운 자리).
const 기본큐칸 = 'hankki:baseQ'
const 기본큐읽기 = () => { try { const v = JSON.parse(localStorage.getItem(기본큐칸) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
// ⛔ 상한 50 — 오래 오프라인이어도 저장소를 안 먹는다(localStorage 가 차면 저장이 «통째로» 막힌다).
const 기본큐쓰기 = (a) => { try { localStorage.setItem(기본큐칸, JSON.stringify(a.slice(-50))) } catch { /* noop */ } }

async function 기본한번(갈래) {
  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }
  try { const f = localStorage.getItem('hankki:founder'); if (f) headers['x-hankki-founder'] = f } catch { /* noop */ }
  const resp = await fetch(OCR_PROXY_URL, { method: 'POST', headers, body: JSON.stringify({ 기본: 갈래 }) })
  if (!resp.ok) throw new Error('base_http_' + resp.status)
}

export function 기본인식알림(갈래) {
  기본한번(갈래).catch(() => { 기본큐쓰기([...기본큐읽기(), 갈래]) })
}

// 🔁 쌓아둔 것을 다시 보낸다 — 앱을 열 때 조용히 돈다(밀린열쇠보내기 와 같은 자리).
export async function 밀린기본보내기() {
  const q = 기본큐읽기()
  if (!q.length) return
  기본큐쓰기([])                       // ⛔ 먼저 비운다 — 보내는 중에 새로 쌓이는 것과 안 섞이게
  const 남은 = []
  for (const 갈래 of q) {
    try { await 기본한번(갈래) } catch { 남은.push(갈래) }
  }
  if (남은.length) 기본큐쓰기([...기본큐읽기(), ...남은])
}

// 🎁 「그냥 깔면 몇 개 · 로그인하면 몇 개」 — 서버가 준 두 상한을 그대로 돌려준다.
//   📮 창업자 2026-09-01 = *"로그인화면에서 10개 주고 로그인하면 20개준다는 것도 안내붙였어?"*
//      ＋ *"그거 다하면 무료30개 제공(첫 유저 선물) 안내도 적어야 할 것 같아."*
//   ⛔ 숫자를 화면에 «글자로» 박지 않는다 — 상한을 바꾸는 날 문구만 낡는다(`ocr.js` 의 「5회」 교훈).
export function 무료열쇠상한() {
  let v = null
  try { v = JSON.parse(localStorage.getItem(LEFT_KEY) || 'null') } catch { v = null }
  const 비로그인 = v && Number.isFinite(v.anon) ? v.anon : WELCOME_ANON
  const 로그인 = v && Number.isFinite(v.acct) ? v.acct : WELCOME_ACCT
  return { 비로그인, 로그인, 더: Math.max(0, 로그인 - 비로그인) }
}

// 🎁 「로그인하면 몇 개 더 받나」 — ⛔문구에 «20» 을 글자로 박지 않는다.
//   서버가 두 상한을 다 주므로 그 차이를 쓴다. 숫자를 바꿔도 문구가 안 낡는다.
export function 로그인보너스() {
  let v = null
  try { v = JSON.parse(localStorage.getItem(LEFT_KEY) || 'null') } catch { v = null }
  const a = v && Number.isFinite(v.anon) ? v.anon : WELCOME_ANON
  const b = v && Number.isFinite(v.acct) ? v.acct : WELCOME_ACCT
  return Math.max(0, b - a)
}

// 남은 장수 = { welcome, month, total, unknown }
//   total   = 지금 실제로 쓸 수 있는 장수(웰컴이 남았으면 웰컴, 아니면 그 달 잔량)
//   unknown = 서버 응답을 아직 한 번도 못 받았다(=안 써 봤다) → 웰컴 그대로로 본다
export function getOcrLeft() {
  let v = null
  try {
    v = JSON.parse(localStorage.getItem(LEFT_KEY) || 'null')
  } catch {
    v = null
  }
  if (!v || typeof v.welcome !== 'number') {
    // ⚠️ 서버 답을 «한 번도» 못 받았다(＝아직 안 써 봤다) → 첫 화면에 보여줄 값을 고른다.
    //   ⭐ 로그인해 뒀으면 30, 아니면 10. `로그인해뒀나()` 는 파이어베이스를 안 받고 판정하는 «표식»이라
    //      로그인 안 한 사람에게 167KB 를 지우지 않는다(cloud.js:102 가 그 목적으로 만든 것).
    //   ⛔⛔ **표시에만 쓴다. 차감·한도 판정에는 절대 안 쓴다** — 그건 언제나 서버가 정한다.
    const 첫값 = 로그인해뒀나() ? WELCOME_ACCT : WELCOME_ANON
    return { welcome: 첫값, month: MONTHLY_FREE, total: 첫값, unknown: true }
  }
  return { ...v, total: v.welcome > 0 ? v.welcome : v.month, unknown: false }
}

function loadImg(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// 결과가 의미있는 글자(한글·영문·숫자) 위주인지 — 아니면 다른 방법으로 넘어간다.
function looksGibberish(s) {
  const compact = String(s).replace(/\s/g, '')
  if (compact.length < 6) return true
  const good = (compact.match(/[가-힣a-zA-Z0-9]/g) || []).length
  return good / compact.length < 0.5
}

// 폰 세로 캡처(스크린샷)인지 — 맞으면 상태바(위 4.5%)와 하단 바(아래 5%)를 잘라
// "KT 7:38" 같은 상태바 글자나 댓글 입력창이 레시피에 섞이지 않게 한다.
function screenshotCrop(img) {
  const isPhoneShot = img.height / img.width >= 1.7
  const top = isPhoneShot ? Math.round(img.height * 0.045) : 0
  const bottom = isPhoneShot ? Math.round(img.height * 0.05) : 0
  return { top, height: img.height - top - bottom }
}

// 폰 내장 OCR (Shape Detection API). 있으면 이걸 먼저 쓴다 — 한국어에 강하다.
async function detectWithPlatform(dataUrl, noCrop) {
  try {
    if (!('TextDetector' in window)) return null
    const img = await loadImg(dataUrl)
    if (!img) return null
    const crop = noCrop ? { top: 0, height: img.height } : screenshotCrop(img)
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = crop.height
    c.getContext('2d').drawImage(img, 0, crop.top, img.width, crop.height, 0, 0, img.width, crop.height)
    const det = new window.TextDetector()
    const results = await det.detect(c)
    if (!results || !results.length) return null
    // 위→아래, 왼→오른쪽 순으로 정렬해 줄을 재구성
    results.sort((a, b) => {
      const dy = (a.boundingBox?.top || 0) - (b.boundingBox?.top || 0)
      if (Math.abs(dy) > 12) return dy
      return (a.boundingBox?.left || 0) - (b.boundingBox?.left || 0)
    })
    return results.map((r) => r.rawValue).filter(Boolean).join('\n')
  } catch {
    return null
  }
}

// 국소 적응형 이진화(Bradley–Roth) — OCR 정확도의 진짜 승부처.
// 이미지 전체에 같은 기준을 쓰는 대신, 각 픽셀 주변 창(window)의 평균과 비교해
// 글자/배경을 나눈다. 그래서 그림자·구김·불균일 조명(영수증·기울여 찍은 사진)에서도
// 글자가 뭉개지지 않는다. 적분영상(integral image)으로 O(n) 처리.
function bradleyThreshold(gray, w, h) {
  const S = Math.max(16, Math.round(Math.max(w, h) / 20)) // 창 크기 — 글자보다 조금 크게
  const half = S >> 1
  const T = 0.15 // 지역 평균 대비 이만큼 어두우면 글자(잉크)로 본다
  const iw = w + 1
  const integral = new Float64Array(iw * (h + 1))
  for (let y = 1; y <= h; y++) {
    let rowsum = 0
    const rowOff = (y - 1) * w
    const curOff = y * iw
    const upOff = (y - 1) * iw
    for (let x = 1; x <= w; x++) {
      rowsum += gray[rowOff + (x - 1)]
      integral[curOff + x] = integral[upOff + x] + rowsum
    }
  }
  const out = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    const y1 = y - half < 0 ? 0 : y - half
    const y2 = y + half >= h ? h - 1 : y + half
    const rowOff = y * w
    for (let x = 0; x < w; x++) {
      const x1 = x - half < 0 ? 0 : x - half
      const x2 = x + half >= w ? w - 1 : x + half
      const count = (x2 - x1 + 1) * (y2 - y1 + 1)
      const sum =
        integral[(y2 + 1) * iw + (x2 + 1)] -
        integral[y1 * iw + (x2 + 1)] -
        integral[(y2 + 1) * iw + x1] +
        integral[y1 * iw + x1]
      const val = gray[rowOff + x]
      out[rowOff + x] = val * count <= sum * (1 - T) ? 0 : 255
    }
  }
  return out
}

// tesseract용 전처리 — 정확도의 핵심.
//  · 작은 캡처는 키우고(글자 해상도↑), 큰 사진은 적당히 줄여 메모리 부담↓
//  · 흑백 + 밝기 중앙값으로 반전 여부 판단(밝은 음식 사진이 섞여도 안 속음)
//  · mode 'global'  : 반전 + 전역 대비 강화 (오버레이 자막 등 색 배경에 강함)
//  · mode 'adaptive': 국소 적응형 이진화 (문서·영수증·조명 얼룩에 강함)
function preprocess(dataUrl, forceInvert, noCrop, mode = 'global') {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const crop = noCrop ? { top: 0, height: img.height } : screenshotCrop(img)
        const longSide = Math.max(img.width, crop.height)
        // 적응형은 적분영상 메모리(Float64)가 커서 상한을 조금 낮춘다(1600px면 글자 충분).
        const maxDown = mode === 'adaptive' ? 1600 : 2400
        let scale = 1
        if (longSide < 1500) scale = Math.min(3, 1500 / longSide)
        else if (longSide > maxDown) scale = maxDown / longSide
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(crop.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, crop.top, img.width, crop.height, 0, 0, w, h)
        const im = ctx.getImageData(0, 0, w, h)
        const d = im.data
        // 1) 그레이스케일 + 밝기 히스토그램 (반전 판단용)
        const total = w * h
        const gray = new Uint8ClampedArray(total)
        const hist = new Uint32Array(256)
        for (let p = 0, i = 0; p < total; p++, i += 4) {
          const g = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0
          gray[p] = g
          hist[g]++
        }
        let acc = 0
        let median = 127
        for (let v = 0; v < 256; v++) {
          acc += hist[v]
          if (acc >= total / 2) { median = v; break }
        }
        const invert = forceInvert !== undefined ? forceInvert : median < 110
        // 필요하면 먼저 반전해 '검은 글씨 / 흰 배경'으로 통일
        if (invert) for (let p = 0; p < total; p++) gray[p] = 255 - gray[p]

        if (mode === 'adaptive') {
          const bin = bradleyThreshold(gray, w, h)
          for (let p = 0, i = 0; p < total; p++, i += 4) {
            d[i] = d[i + 1] = d[i + 2] = bin[p]
          }
        } else {
          // 전역 대비 강화
          const contrast = 1.5
          for (let p = 0, i = 0; p < total; p++, i += 4) {
            let g = (gray[p] - 128) * contrast + 128
            g = g < 0 ? 0 : g > 255 ? 255 : g
            d[i] = d[i + 1] = d[i + 2] = g
          }
        }
        ctx.putImageData(im, 0, 0)
        resolve({ url: c.toDataURL('image/png'), inverted: invert })
      } catch {
        resolve({ url: dataUrl, inverted: false })
      }
    }
    img.onerror = () => resolve({ url: dataUrl, inverted: false })
    img.src = dataUrl
  })
}

// tesseract 워커는 한 번만 만들어 재사용(여러 장 연속 인식이 빠르다).
let _workerPromise = null
let _progressCb = null

function getWorker() {
  if (!_workerPromise) {
    _workerPromise = createWorker('kor+eng', 1, {
      logger: (m) => {
        if (m && m.status === 'recognizing text' && _progressCb) {
          _progressCb(Math.round((m.progress || 0) * 100))
        }
      },
    })
      .then(async (w) => {
        try {
          await w.setParameters({
            tessedit_pageseg_mode: '6', // 단일 텍스트 블록(캡처 레시피에 적합)
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
          })
        } catch {
          /* noop */
        }
        return w
      })
      .catch((e) => {
        _workerPromise = null
        throw e
      })
  }
  return _workerPromise
}

// 인식 직전에 페이지 분할 모드(PSM)를 바꾼다.
//  · 6 = 단일 텍스트 블록 (레시피 캡처처럼 문단이 뭉쳐 있을 때)
//  · 4 = 여러 크기의 단일 컬럼 (영수증처럼 '품목 … 금액'이 줄줄이 있을 때 더 정확)
let _curPsm = '6'
async function setPsm(worker, psm) {
  if (_curPsm === psm) return
  try {
    await worker.setParameters({ tessedit_pageseg_mode: psm })
    _curPsm = psm
  } catch {
    /* noop */
  }
}

// 뜻있는 글자 수 — 두 인식 결과 중 나은 쪽 고르는 기준
function goodChars(s) {
  return (String(s).match(/[가-힣a-zA-Z0-9]/g) || []).length
}

// 신뢰도 기반 조립 — tesseract 가 음식 사진·아이콘에서 '지어낸' 단어는 신뢰도가
// 낮다. 줄 평균이 낮으면 통째로 버리고, 살아남은 줄에서도 저신뢰 단어만 도려낸다.
// (외계어의 최대 원인: 캡처 속 영상 화면을 글자로 착각하는 것)
// 줄 텍스트는 tesseract 원문(ln.text)을 쓴다 — 단어를 이어붙이면 한글 띄어쓰기가 깨진다.
const WORD_MIN_CONF = 40
const LINE_MIN_CONF = 55

function assembleFromBlocks(data) {
  if (!data || !Array.isArray(data.blocks)) return null
  const lines = []
  for (const b of data.blocks) {
    for (const par of b.paragraphs || []) {
      for (const ln of par.lines || []) {
        const words = (ln.words || []).filter((w) => w && w.text && w.text.trim())
        const kept = words.filter((w) => (w.confidence || 0) >= WORD_MIN_CONF)
        if (!kept.length) continue
        const avg = kept.reduce((s, w) => s + w.confidence, 0) / kept.length
        if (avg < LINE_MIN_CONF) continue
        let text = String(ln.text || '').replace(/\n/g, ' ')
        for (const w of words) {
          // 한글 단어는 남긴다 — 진짜 단어의 낮은 음절 하나를 파내면 "고추가루"가 "고 가루"가 된다.
          if ((w.confidence || 0) < WORD_MIN_CONF && !/[가-힣]/.test(w.text)) text = text.replace(w.text, ' ')
        }
        text = text.replace(/\s{2,}/g, ' ').trim()
        if (text) lines.push(text)
      }
    }
  }
  return lines.join('\n')
}

// opts.noCrop: 영수증처럼 폰 캡처가 아닌 사진은 상태바 자르기를 건너뛴다(내용이 잘리니까).
//
// 🆓🆓 [창업자 확정 2026-08-29] **opts.noVision — 열쇠를 «안 쓰고» 기본 인식으로만 읽는다.**
//   📮 창업자 = *"한끼에서 가져오기를 무료ocr로 읽게하면 안돼??"* →
//      *"3번은 열쇠다썼지만 무료로 쓰고싶은 사용자들이 거의 쓰겠네 안내도 잘해줘야 할 듯."*
//
//   ⭐⭐ **새로 만드는 길이 아니다 — 이미 매일 돌고 있는 길이다.**
//      열쇠를 다 쓴 사람은 서버가 429 를 주고, 그러면 아래 `catch` 가 그대로 2)3) 으로 내려보낸다.
//      이 옵션은 **「그 자리로 «처음부터» 보낸다」**일 뿐이다. 그래서 위험이 거의 없다.
//
//   🔑 **왜 필요한가 = 말과 동작을 맞추려고.** 「무료로 읽기」라고 적어놓고 열쇠를 깎으면
//      그게 곧 분쟁이다(*"샀는데 어디 갔지"* = 환불 1순위 · CLAUDE.md 결제 절).
//
//   ⛔⛔ **차감은 «서버»가 한다** — 우리가 프록시를 안 부르면 서버는 이 일을 아예 모른다.
//      그러니 이 한 줄이 곧 「열쇠 0개」다. 앱에서 따로 빼거나 되돌릴 것이 없다.
//
//   ⛔ 이 옵션을 ①②(공유로 들어오는 사진)에 붙이지 말 것 — 거기선 «물어볼 화면이 없다».
//      창업자 확정(2026-08-29) = 열쇠 쓰는 길과 공짜 길이 «둘 다» 살아 있어야 한다.
export async function ocrImage(image, onProgress, opts = {}) {
  // 0) Google Vision 프록시 우선 — 한국어 인식 최상. 실패하면 폰내장→tesseract로 폴백.
  //    🆓 `opts.noVision` 이면 이 칸을 통째로 건너뛴다 = 열쇠가 안 깎인다.
  if (typeof image === 'string' && !opts.noVision) {
    try {
      const t = await ocrViaProxy(image, onProgress, opts.batch)
      if (t && !looksGibberish(t)) {
        if (onProgress) onProgress(100)
        return normalizeNumerals(t)
      }
    } catch {
      /* 폴백 계속 (오프라인·한도·오류) */
    }
  }
  // 📊📊 **여기부터는 «열쇠를 안 쓰는» 길이다** — 유료를 켤 때 「무료로 얼마나 읽히나」의 잣대가 된다.
  //   📮 창업자 2026-09-01 = *"우리ai기능 유료 켤때 무료이용률도 알아야 가격이나 장수를 수정하니까"*
  //   ⭐ 갈래를 «여기서» 가른다 — 여기가 이유를 아는 유일한 자리다(더 아래로 가면 왜 떨어졌는지 잊는다).
  //      **고름** = 유저가 「그냥 읽기」를 골랐다 · **막힘** = 열쇠가 모자라 서버가 429 를 줬다 ·
  //      **실패** = 그 밖(오프라인 · AI 오류 · 결과가 외계어)
  //   ⛔ `getOcrNote()` 를 부르지 않는다 — 그건 «읽으면 지우는» 값이라 화면 안내가 사라진다.
  //      모듈 안이라 `_ocrNote` 를 그냥 들여다본다.
  //   ⛔ 사진이 아닌 것(Blob·Canvas)으로 부른 경우엔 세지 않는다 — 그건 유저가 담는 흐름이 아니다.
  //   ⚠️⚠️ **정직하게 — 이건 「읽으려 한 횟수」이지 「읽어낸 횟수」가 아니다.**
  //      여기서 세는 이유 = **왜 떨어졌는지 아는 자리가 여기뿐**이다(더 아래로 가면 이유를 잊는다).
  //      ⭐ 값을 정하는 데는 이게 맞다 — 우리가 알고 싶은 건 「열쇠 없이 읽으려 한 일이 얼마나 잦나」다.
  if (typeof image === 'string') {
    기본인식알림(opts.noVision ? '고름' : (_ocrNote === 'user_quota' ? '막힘' : '실패'))
  }
  // 1) 폰 내장 OCR (있으면 정확, 요즘 크롬은 기본 비활성이라 대개 건너뜀)
  if (typeof image === 'string') {
    if (onProgress) onProgress(15)
    const platform = await detectWithPlatform(image, opts.noCrop)
    if (platform && !looksGibberish(platform)) {
      if (onProgress) onProgress(100)
      return platform
    }
  }
  // 2) tesseract (전처리 + LSTM 엔진 + 신뢰도 필터). 숫자 오독은 마지막에 교정.
  const finish = (t) => normalizeNumerals(t)
  try {
    const worker = await getWorker()
    const recognize = async (src, psm = '6') => {
      await setPsm(worker, psm)
      _progressCb = onProgress || null
      const { data } = await worker.recognize(src, {}, { blocks: true, text: true })
      _progressCb = null
      const raw = (data && data.text) || ''
      // 영수증은 파서(receipt.js)가 헤더·노이즈를 스스로 거른다 — 신뢰도 필터로
      // 품목 줄을 잃지 않게 원문(raw)을 그대로 넘긴다. (인식률 저하의 숨은 원인)
      if (opts.receipt) return raw
      const filtered = assembleFromBlocks(data)
      // 필터가 과하게 지웠으면(진짜 글자까지) 원문으로 폴백 — 파서가 걸러준다.
      if (filtered && goodChars(filtered) >= Math.min(20, goodChars(raw) * 0.3)) return filtered
      return raw
    }
    if (typeof image !== 'string') return finish(await recognize(image))

    if (opts.receipt) {
      // 영수증: 적응형 이진화 + 컬럼(PSM 4)이 1순위 — 그림자·구김·조명 얼룩에 강하다.
      const a = await preprocess(image, undefined, opts.noCrop, 'adaptive')
      let text = await recognize(a.url, '4')
      // 살아난 품목 줄이 적으면 전역 대비(PSM 6)로 한 번 더 — 둘 중 나은 쪽.
      if (looksGibberish(text) || goodChars(text) < 12) {
        const g = await preprocess(image, undefined, opts.noCrop, 'global')
        const t2 = await recognize(g.url, '6')
        if (goodChars(t2) > goodChars(text)) text = t2
      }
      return finish(text)
    }

    // 레시피(캡처): 전역 대비가 1순위 — 인스타·유튜브 색 배경 자막에 강하다.
    const p1 = await preprocess(image, undefined, opts.noCrop, 'global')
    let text = await recognize(p1.url, '6')
    // 외계어면 적응형(자동 반전)으로 구제 — 조명 얼룩·저대비 캡처 대비.
    if (looksGibberish(text)) {
      const a = await preprocess(image, undefined, opts.noCrop, 'adaptive')
      const t2 = await recognize(a.url, '6')
      if (goodChars(t2) > goodChars(text)) text = t2
    }
    // 그래도 외계어면 반전을 뒤집어 마지막 시도 — 다크모드 자막 대비.
    if (looksGibberish(text)) {
      const p3 = await preprocess(image, !p1.inverted, opts.noCrop, 'global')
      const t3 = await recognize(p3.url, '6')
      if (goodChars(t3) > goodChars(text)) text = t3
    }
    return finish(text)
  } catch {
    _progressCb = null
    // 워커 생성 실패 등 — 편의 함수로 한 번 더 시도
    try {
      const processed = typeof image === 'string' ? (await preprocess(image, undefined, opts.noCrop)).url : image
      const res = await Tesseract.recognize(processed, 'kor+eng')
      return finish((res && res.data && res.data.text) || '')
    } catch {
      return ''
    }
  }
}
