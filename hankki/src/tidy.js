// 🤖 AI 다듬기 — 사진에서 «읽은 글자»를 레시피 모양으로 정리해 온다
//
// ⭐⭐ **이 파일의 심장 = 「실패하면 말없이 규칙 파서로 떨어진다」**
//   `parseRecipeText()` 는 3층 구조의 1층이고 «절대 안 죽는다».
//   AI 가 안 되든, 느리든, 이상한 답을 주든 — **앱은 지금과 똑같이 돌아간다.**
//   ⛔ 그래서 여기서 오류를 «던지지 않는다». 못 하면 `null` 을 돌려주고 부르는 쪽이 규칙 파서를 쓴다.
//
// ⛔⛔ **열쇠를 여기서 «안» 깎는다** — 사진 경로는 `ocr.js` 가 이미 깎았다.
//   깎는 곳이 한 곳이라 카운트가 갈릴 자리가 없다(창업자 지시 2026-08-29 「정확하게 카운트」).
//   📄 근거 = docs/AI다듬기-만들기전-리서치-2026-08-28.md 맨 아래(창업자 확정 ⓗ)
//
// ⛔ 앱 «밖»으로 나가는 것 = 사진에서 읽은 «글자»뿐이다(사진 자체는 안 나간다).
//   Cloudflare 공식 = 프롬프트·응답을 **보관하지 않고 학습에도 안 쓴다**(2026-08-28 확인).
// ⛔⛔ **기기 번호(uid)를 «안 보낸다»** — 이 워커는 열쇠를 안 세므로 누구인지 알 필요가 없다.
//   ⭐ 안 쓰는 것은 보내지 않는다 — Play 데이터 보안 신고가 그만큼 단순해진다.
//   ⏳ 2단계(붙여넣기 AI ＋ 보너스 열쇠)에서 열쇠를 세게 되면 그때 uid 를 싣는다.

// ✅ 2026-08-29 워커를 세우고 주소를 넣었다.
//   실물 확인 = 창업자가 주소창에 쳐서 {"error":"method_not_allowed"} 를 봤다(= 우리 코드가 살아 있다).
//   ⛔ 내가 있는 곳의 네트워크는 workers.dev 로 나가는 걸 막는다(403 policy denial · 실측) — **눈으로 보는 건 창업자 쪽뿐이다.**
//   ⭐⭐ **되돌리는 법 = 이 값을 「''」로 비운다.** 비우면 이 파일은 아무 일도 안 하고 늘 규칙 파서로 간다.
//      사고가 나면 이 한 줄이 제일 빠른 비상구다(서버를 안 건드려도 된다).
const TIDY_URL = 'https://hankki-tidy.annyeong-hankki.workers.dev'
const APP_TOKEN = '0VRNDSjHBhwniTzIDAbnRaJygyfGJ2K2'   // OCR 프록시와 같은 값

// ⏱ 얼마나 기다리나 — ⛔이 값이 «유저 체감»을 정한다.
//   AI 응답 속도를 아직 실측 못 했다(다른 제공자 기준 첫 글자 0.75초 · 초당 200토큰대).
//   우리 출력이 750토큰쯤이라 **몇 초** 예상. 12초를 넘으면 «기다리느니 규칙 파서»가 낫다.
const TIMEOUT_MS = 12000

// 🔢 마지막 결과 — 앱이 「AI가 정리했어요」를 보여줄 때 쓴다
let _마지막 = null
export function lastTidyInfo() { const v = _마지막; return v }

/**
 * 글자를 레시피로 정리한다.
 * @returns {Promise<null | {title, ingredients, steps, memo}>}  못 하면 null (⛔던지지 않는다)
 */
export async function tidyRecipe(text) {
  _마지막 = null
  const t = String(text || '').trim()
  if (!TIDY_URL || !t) return null
  // ⛔ 너무 짧으면 AI 를 부를 값어치가 없다(＋우리 무료 통을 아낀다)
  if (t.length < 40) return null

  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN }
  try {
    const f = localStorage.getItem('hankki:founder')
    if (f) headers['x-hankki-founder'] = f
  } catch { /* noop */ }

  // ⏱ 오래 걸리면 끊는다 — ⛔안 끊으면 유저가 빈 화면을 하염없이 본다
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ac ? setTimeout(() => ac.abort(), TIMEOUT_MS) : null

  let data = null
  try {
    const resp = await fetch(TIDY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: t }),
      signal: ac ? ac.signal : undefined,
    })
    if (!resp.ok) {
      // 429 = 그날 통이 찼다 · 502 = AI 가 이상한 답 → 둘 다 «조용히» 규칙 파서로
      _마지막 = { ok: false, why: 'http_' + resp.status }
      return null
    }
    data = await resp.json()
  } catch (e) {
    _마지막 = { ok: false, why: (e && e.name === 'AbortError') ? 'timeout' : 'network' }
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }

  if (!data || data.error) {
    _마지막 = { ok: false, why: (data && data.error) || 'empty' }
    return null
  }

  const 결과 = {
    title: str(data.title),
    ingredients: arr(data.ingredients),
    steps: arr(data.steps),
    memo: str(data.memo),
  }
  // ⛔⛔ **빈 껍데기면 «안 쓴다»** — 재료도 걸음도 없으면 규칙 파서가 낫다.
  //   AI 가 「모르겠다」로 빈 JSON 을 주는 경우가 있는데, 그걸 그대로 쓰면
  //   지금보다 «나빠진다». 규칙 18 ⓘ — 「응답이 왔다」와 「쓸 만하다」는 다른 말이다.
  if (!결과.ingredients.length && !결과.steps.length) {
    _마지막 = { ok: false, why: 'empty_result' }
    return null
  }

  _마지막 = { ok: true, model: str(data.model) }
  return 결과
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])
