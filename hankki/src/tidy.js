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

import { politeSteps } from './polish.js'

// ✅ 2026-08-29 워커를 세우고 주소를 넣었다.
//   실물 확인 = 창업자가 주소창에 쳐서 {"error":"method_not_allowed"} 를 봤다(= 우리 코드가 살아 있다).
//   ⛔ 내가 있는 곳의 네트워크는 workers.dev 로 나가는 걸 막는다(403 policy denial · 실측) — **눈으로 보는 건 창업자 쪽뿐이다.**
//   ⭐⭐ **되돌리는 법 = 이 값을 「''」로 비운다.** 비우면 이 파일은 아무 일도 안 하고 늘 규칙 파서로 간다.
//      사고가 나면 이 한 줄이 제일 빠른 비상구다(서버를 안 건드려도 된다).
const TIDY_URL = 'https://hankki-tidy.annyeong-hankki.workers.dev'
const APP_TOKEN = '0VRNDSjHBhwniTzIDAbnRaJygyfGJ2K2'   // OCR 프록시와 같은 값

// ⏱⏱ 얼마나 기다리나 — ⛔이 값이 «유저 체감»을 정한다.
//
// 🔢🔢 **[2026-08-29 실측 · 창업자 폰 → Cloudflare 로그] 24,333ms.**
//   `AI_OK @cf/zai-org/glm-4.7-flash 24333ms` · Wall 24,334ms · **CPU 3ms**
//   → 24초가 통째로 «AI 를 기다린 시간»이다. 우리 코드는 3ms 만 돈다.
//   ⭐ 이 모델은 «생각하고 답하는» 판이라 느리다. 8/28 놀이터에서 빨라 보인 건
//      놀이터가 스트리밍으로 첫 글자를 바로 뿌려서다 — 다 끝나는 시간은 그때도 길었다.
//
// ⛔⛔ **12초는 «최악의 값»이었다** — 24초짜리 일을 12초에 끊으니
//   ⑴유저는 12초를 기다리고도 «아무것도 못 얻고» ⑵워커는 24초까지 계속 돌아 **무료 통은 그대로 먹는다.**
//   즉 **잃기만 하는 12초**였다. 끊을 거면 훨씬 일찍, 기다릴 거면 끝까지여야 한다.
//
// ✅✅ **[2026-08-29 오후] 60초로 «늘렸다» — 늘릴 수 있게 된 이유가 먼저다.**
//   ⭐⭐ 같은 판에서 **「기다리지 않기」(창업자 갈래 ⓒ)를 만들었다**(`App.jsx` 공유받기 · `EditorScreen`).
//      규칙 파서 결과로 화면을 «먼저» 채우고 AI 는 뒤에서 돈다 → **유저가 기다리는 시간이 0초다.**
//      그러니 이 숫자는 이제 「유저를 얼마나 세워두나」가 아니라 **「AI 에게 얼마나 주나」**다.
//
//   ⛔⛔ **30초는 «또» 잃기만 하는 값이었다** — 창업자 폰 실측 2026-08-29 13:44 = `기본 정리예요(timeout)`.
//      워커는 살아 있는데(502 였으면 `http_502` 가 떴다) 30초 안에 못 끝냈다.
//      실측 24.3초는 **한 번 잰 값**이고 이 모델은 «생각하고 답하는» 판이라 편차가 크다.
//      📌 **한 번 잰 값에 여유를 조금 얹는 것으로는 부족하다** — 그게 12 → 30 에서 배운 것이고 또 밟았다.
//
//   ⚠️ 60초를 넘기면 그냥 포기한다 — 그때는 규칙 파서 결과가 이미 화면에 있어 **잃는 게 없다.**
const TIMEOUT_MS = 60000

// 🔢 마지막 결과 — 앱이 「AI가 정리했어요」를 보여줄 때 쓴다
let _마지막 = null

/**
 * 글자를 레시피로 정리한다.
 * @returns {Promise<null | {title, ingredients, steps, memo}>}  못 하면 null (⛔던지지 않는다)
 */
export async function tidyRecipe(text) {
  _마지막 = null
  const t = String(text || '').trim()
  // ⛔ 「안 불렀다」와 「불렀는데 실패했다」를 «갈라서» 남긴다 — 처방이 다르다(2026-08-29).
  if (!TIDY_URL) { _마지막 = { ok: false, why: '꺼짐' }; return null }
  if (!t) { _마지막 = { ok: false, why: '글자없음' }; return null }
  // ⛔ 너무 짧으면 AI 를 부를 값어치가 없다(＋우리 무료 통을 아낀다)
  if (t.length < 40) { _마지막 = { ok: false, why: '짧음' }; return null }

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

/**
 * 규칙 파서 결과에 AI 결과를 «골라» 얹는다 — 빈 칸은 규칙 파서 것을 남긴다(둘 중 «있는» 쪽이 이긴다).
 *
 * ⭐⭐ **이 함수가 «한 곳»에 있는 이유** — 2026-08-29 사고.
 *   사진에서 글자를 읽는 문이 «셋»(편집 캡처 · 공유받기/갤러리 · 냉장고 영수증)인데
 *   AI 를 «편집 캡처» 한 곳에만 붙여서, 창업자가 실제로 쓰는 「가져오기 → 사진」에선
 *   **워커가 한 번도 안 불렸다**(Cloudflare Invocations 0 · 실측).
 *   ⛔ 그때 재현판 16칸이 «전부 초록불»이었다 — 검사가 붙인 자리만 봤기 때문이다(규칙 18 ⓘ).
 *   📌 얹는 규칙을 복붙하면 두 경로가 조용히 갈린다. 그래서 함수로 뽑았다.
 *
 * ⛔ 영수증(`PantryView`)엔 «안» 쓴다 — AI 지시가 레시피용이라 재료 목록에 쓰면 오히려 나빠진다.
 */
export function mergeTidy(r, ai) {
  if (!ai) return r
  return {
    ...r,
    title: ai.title || r.title,
    ingredients: ai.ingredients.length ? ai.ingredients : r.ingredients,
    // ✍️✍️ **[2026-08-29 · 창업자가 오타로 찾아낸 구멍] AI 걸음도 «문체 다듬기»를 거친다.**
    //   📮 창업자 = *"오타 한번 정도? 꺼줘요를 끄줘요"*
    //   ⛔⛔ 그 한 글자가 진짜 구멍을 알려줬다 — **규칙 파서 결과는 「politeSteps」 를 거치는데
    //      (parseRecipe.js:910) AI 결과는 여기서 «그대로» 얹혀 한 번도 안 거쳤다.**
    //      우리 앱엔 해요체 표준도 있고 배포 게이트(check-steps.mjs)까지 있는데 **AI 만 그 밖에 있었다.**
    //   ⭐ 얹는 자리가 «한 곳»이라 여기 한 줄이면 두 문(공유받기·편집 캡처)이 같이 고쳐진다.
    //   ⛔ 사전에 없는 말은 «안 건드린다» — 안 바꾸는 게 잘못 바꾸는 것보다 낫다(polish.js 원칙).
    steps: ai.steps.length ? politeSteps(ai.steps) : r.steps,
    memo: ai.memo || r.memo,
  }
}

/**
 * 화면에 붙일 «한 줄 꼬리» — 「AI 가 정리했나」를 유저가 «볼 수 있게» 한다.
 *
 * ⭐⭐ **왜 만들었나 (2026-08-29)** — 표시가 없어서 창업자도 나도 «AI 가 돌았는지» 몰랐다.
 *   제목이 잘 나온 것을 보고 내가 「AI 가 됐다」고 단정했는데, Cloudflare 대시보드를 보니
 *   **워커 호출이 0** 이었다(붙인 자리가 창업자가 쓰는 자리가 아니었다).
 *   ⛔ 그걸 알아내는 데 30분이 걸렸다. **이 한 줄이면 5초다.**
 *
 * ⭐ 유저에겐 단순하게, 창업자(운영자)에겐 «이유»까지 —
 *   운영자 통로(`hankki:founder`)가 이미 있으니 그걸 그대로 쓴다.
 *   ⛔ 유저에게 `http_429`·`timeout` 같은 말을 보이지 않는다.
 */
export function tidyFounder() {
  try { return !!localStorage.getItem('hankki:founder') } catch { return false }
}

export function tidyTail() {
  const v = _마지막
  const 운영자 = tidyFounder()
  if (v && v.ok) return 운영자 ? ` · AI가 정리했어요(${v.model || 'AI'})` : ' · AI가 정리했어요'
  // 실패·안 부름 — 유저에겐 「기본 정리」 하나로 묶는다(⛔「실패」라고 쓰지 않는다. 결과는 멀쩡하다)
  return 운영자 ? ` · 기본 정리예요(${(v && v.why) || '안부름'})` : ' · 기본 정리예요'
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')

const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])
