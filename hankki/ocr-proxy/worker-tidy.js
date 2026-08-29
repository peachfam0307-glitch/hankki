// ═══════════════════════════════════════════════════════════════
// 🤖 한끼 AI 다듬기 — Cloudflare Worker   (2026-08-29 · 1단계)
//
// 하는 일 = 사진에서 «이미 읽은 글자»를 받아 레시피 모양으로 정리해 돌려준다.
//   들어옴 { text: "인스타 캡션 원문…", uid: "기기식별자" }
//   나감   { title, ingredients[], steps[], memo }   ← 실패하면 { error }
//
// ⛔⛔ **이 워커는 「열쇠」를 «안» 센다** — 그게 이 설계의 심장이다.
//   사진 경로는 **`hankki-ocr` 워커가 이미 열쇠를 깎는다.** 그 «뒤»에 이 워커가 불린다.
//   → 깎는 곳이 한 곳이라 **카운트가 갈릴 자리가 없다**(창업자 지시 2026-08-29 「정확하게 카운트」).
//   ⛔ 여기에 열쇠 세는 코드를 «넣지 말 것» — 넣는 순간 두 곳에서 세게 되고 반드시 어긋난다.
//   📄 근거 = docs/AI다듬기-만들기전-리서치-2026-08-28.md 맨 아래(갈래 여덟 검토 · 창업자 확정 ⓗ)
//
// ⛔⛔ **왜 `worker.js` 에 안 넣고 파일을 갈랐나**
//   ⑴ `ocr-proxy/worker.js` 맨 위에 «서버에 안 올린 코드»(묶음 1장 batch) 경고가 있다.
//      거기에 얹으면 창업자가 대시보드에 복붙할 때 **그 함정까지 같이 올라간다.**
//   ⑵ 결제 브랜치(`hold/결제서버-0819`)가 그 파일을 **이미 421줄 고쳤다**(실측) → 합칠 때 충돌.
//   ⭐ 파일을 가르면 사고가 «구조적으로» 불가능해진다. Cloudflare 는 Worker 를 여럿 만들 수 있고 추가 비용이 0이다.
//
// ⛔⛔ **이 서버가 죽어도 앱은 안 죽는다** — 실패하면 앱이 «말없이» 규칙 파서로 떨어진다(3층 구조 1층).
//
// ── 창업자가 대시보드에서 할 것 (5분) ──────────────────────────
//   1. Workers & Pages → Create → Worker → 이름 `hankki-tidy`
//   2. 이 파일 내용을 통째로 붙여넣고 Deploy
//   3. Settings → Bindings → **Workers AI** 추가 · 변수 이름 `AI`
//   4. Settings → Variables and Secrets →
//        Secret `APP_TOKEN`      = (기존 OCR 워커와 «같은» 값)
//        Secret `FOUNDER_SECRET` = (기존 OCR 워커와 «같은» 값 · 운영자 통로)
//        (선택) Variable `TIDY_MODEL` = 모델 이름 — ⛔코드에 박지 않는다
//   5. 나온 주소를 앱 `src/tidy.js` 의 `TIDY_URL` 에 넣는다
//   ⛔ **KV 도 D1 도 필요 없다** — 이 워커는 아무것도 저장하지 않는다.
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://peachfam0307-glitch.github.io',
]

// ── 상한 ── ⭐이건 «열쇠»가 아니라 «우리 무료 통»을 지키는 벽이다
//   Workers AI 무료 = 하루 10,000 뉴런 · glm-4.7-flash 는 한 편 약 38 뉴런 → 하루 약 260편
//   (입력 5,500 / 출력 36,400 뉴런 per 100만 토큰 · 2026-08-28 실측)
//   ⛔ 200 으로 «낮게» 잡는다 — 260 에 닿으면 Cloudflare 가 대신 막는데 그러면 «언제 막혔는지 모른다».
//      우리가 먼저 막으면 그 순간이 응답(`daily_full`)으로 드러난다.
//   ⚠️ 사진 경로는 OCR 워커의 「전역 일 120」이 먼저 막으므로 실제로는 200 에 닿기 어렵다.
const LIMITS = {
  DAILY_GLOBAL: 200,
  PER_IP_PER_MIN: 10,
  MAX_TEXT: 8000,   // ⭐앱 rawText 상한이 4,000자라 그 두 배
}

// 🤖🤖 **모델 차례 — 위에서부터 시도하고, 빈손이면 다음으로.**
//
// ⛔⛔ **[2026-08-29 실물] `glm-4.7-flash` 를 «맨 앞»에서 내렸다.**
//   창업자 폰 로그 = `30556ms` · `"content": null` · `"reasoning": "1. **Analyze the Request:** …"`
//   → **생각만 하다가 답 길이를 다 써서 레시피를 한 글자도 안 냈다.** 30초를 태우고 빈손이다.
//   ⭐ 8/28 실물 판정에서 **11/12** 를 낸 건 사실이고(지금 파서는 6/12) 그래서 «지우지 않고 뒤로» 뒀다.
//      앞 모델이 실패하면 이 판이 받는다. ⚠️단 답 길이를 넉넉히 줘도 안 끝날 수 있다 — 그건 실물로 본다.
//
// ⭐ 맨 앞 = **생각을 «안» 하는 판**. 레시피 정리는 추론이 아니라 「글자를 칸에 나눠 담는」 일이라
//   생각하는 모델의 값어치가 낮고 비용(시간·토큰)만 크다.
//   ID 근거 = developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/
//   ✅✅ **[창업자 확정 2026-08-29 14:48] *"얘 품질 좋다"* — 실물로 판정 끝. ⛔재론 금지**
//      14:44 첫 성공(안내에 모델 이름이 그대로 찍혔다) → 창업자가 결과를 열어 보고 판정했다.
//      ⭐ 그러니 이 차례를 «취향으로» 뒤집지 않는다. 뒤집을 땐 실물 판정을 다시 받는다.
//
// ⛔ 최대 두 판까지만 돈다(아래 `모델차례`) — 무료 통도 시간도 유한하다.
const DEFAULT_MODELS = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/zai-org/glm-4.7-flash',
]

// ⭐ `TIDY_MODEL` 을 넣으면 **그것부터** 시도한다(대시보드에서 한 줄로 실험할 수 있게).
//   ⛔ 넣어도 «뒤 후보를 지우지는» 않는다 — 실험이 실패해도 앱은 계속 돌아야 한다.
function 모델차례(env) {
  const 앞 = String((env && env.TIDY_MODEL) || '').trim()
  const 목록 = 앞 ? [앞, ...DEFAULT_MODELS] : [...DEFAULT_MODELS]
  return [...new Set(목록)].slice(0, 2)
}

// ⏳ 답 길이 상한. ⛔2000 이 오늘 사고의 절반이었다 — 생각하는 모델이 이걸 «생각»에 다 썼다.
//   ⭐ 늘려도 «쓴 만큼만» 값이 나가고, 지금은 기다리는 사람이 없어 시간도 손해가 아니다.
const MAX_TOKENS = 4000

// 🧪 «11/12» 를 낸 판은 2026-08-28 것이다 (docs/AI다듬기-실물판정-2026-08-28.md 7️⃣)
//    ⚠️ 2026-08-29 에 2·4·6 을 손봤으므로 **그 11/12 는 이 지시문의 성적이 아니다.**
//       ⏳ 다시 재기 전엔 성적을 말하지 않는다(규칙 15 — 확인한 것만).
//
// 🔧 [2026-08-29] 백업 대조(scripts/_대조-원문vs결과-0829.mjs)로 잡은 흠 셋을 녹였다
//    ⑵ 긴 제목 — 「콩나물의 시원함을 최대한 살린 콩나물무침」이 그대로 제목이 됐다
//    ⑷ 곁들임 빠짐 — 미나리 볶음밥의 「+계란후라이」가 재료·순서 어디에도 없었다
//    ⑹ 분량이 순서에서 사라짐 — 「물은 딱 1/3컵만」이 「물」로만 남았다(그 편의 핵심인데)
//    ⭐⭐ **규칙 «개수»를 안 늘리고 기존 줄에 붙였다** — 아래 ⛔ 그대로,
//        규칙이 길어지면 오픈 모델이 «맨 앞»(지어내지 마라)을 놓친다.
//
// ⛔ 1번(지어내지 마라)이 «맨 앞»이다 — 오픈 모델은 긴 지시를 잘 못 따르므로 제일 위험한 것을 먼저.
const PROMPT = `너는 요리 레시피 정리기다. 아래는 인스타그램 캡처를 글자로 읽은 것이다.
화면 글자(통신사·시계·계정명·좋아요 수·댓글·GIF)와 인사말이 섞여 있다.

규칙:
1. 원문에 없는 재료나 순서를 절대 지어내지 마라. 없으면 비워라.
2. title 은 «요리 이름»이다. 절 이름("재료"·"만드는 법"·"양념장")도,
   도구·팁 소제목("만들 수 있는 웍"·"보관법")도 제목이 아니다.
   사람 이름·"초간단"·"레시피"·인분은 떼라.
   (예: "강레오의 초간단 양송이버섯 볶음 레시피"→"양송이버섯 볶음"
        "콩나물의 시원함을 최대한 살린 콩나물무침"→"콩나물무침")
   원문에 요리 이름이 아예 없으면 «주재료＋조리법»으로 지어라.
   ⭐ 제목은 이 한 가지만 지어도 된다 — 재료와 순서는 1번 그대로 절대 지어내지 마라.
   (예: 닭다리·찹쌀을 물에 넣고 40분 끓임 → "닭 찹쌀 백숙")
3. 한 글에 요리가 둘이면 «맨 처음 요리»만 정리해라.
4. 재료 목록이 따로 없어도, 조리 문장 안에 나오는 재료를 빠짐없이 ingredients 에 뽑아라.
   분량이 없으면 이름만 적어라. 곁들임("+계란후라이")도 빠뜨리지 마라.
5. ingredients 에는 손질 상태를 빼고 "이름 분량"만.
6. 순서는 조리 동작만. 인사말·후기·팁은 memo 로. 괄호 안 설명도 버리지 마라.
   원문 순서에 분량·시간이 붙어 있으면 steps 에도 그대로 남겨라 — 지우지 마라.
   (예: "물은 딱 1/3컵만 넣어주세요"에서 "1/3컵"을 빼지 마라)
7. steps 는 모두 "~요"로 끝나는 부드러운 말투로 바꿔라.
   "~습니다/~ㅂ니다"·"~한다"·"~기"로 끝나면 전부 "~요"로.
   (예: "버무려줍니다"→"버무려줘요" · "돌돌 말기"→"돌돌 말아요" · "볶는다"→"볶아요")

아래 JSON 만 출력해라. 설명하지 마라.
{"title":"요리 이름","ingredients":["..."],"steps":["..."],"memo":"..."}

--- 원문 ---
`

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors)

    // ── 문 지키기 (OCR 워커와 «같은» 방식) ──
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden_origin' }, 403, cors)
    if (env.APP_TOKEN && request.headers.get('x-hankki-token') !== env.APP_TOKEN) {
      return json({ error: 'unauthorized' }, 401, cors)
    }
    // 🔓 운영자 통로 — «IP 분당»만 우회한다. ⛔전역 일 상한은 창업자도 존중한다(무료 통을 지키는 벽이라서)
    const founder = !!(env.FOUNDER_SECRET && request.headers.get('x-hankki-founder') === env.FOUNDER_SECRET)

    let body
    try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }

    const text = String(body.text || '')
    if (!text.trim()) return json({ error: 'no_text' }, 400, cors)
    if (text.length > LIMITS.MAX_TEXT) return json({ error: 'too_long' }, 400, cors)

    if (!env.AI) return json({ error: 'no_ai_binding' }, 500, cors)

    // ── 상한 (KV 가 «있으면» 센다. 없어도 돌아간다) ──
    // ⭐ KV 를 «선택»으로 둔 이유 = 이 워커는 돈을 안 쓴다(무료 통 안).
    //   최악이 「Cloudflare 가 대신 막는다」이고 그건 돈이 아니라 «그날 AI 가 쉰다»일 뿐이다.
    //   ⛔ 그러니 창업자에게 KV 를 «만들라고 시키지 않는다»(규칙 8 — 손이 덜 가게).
    const kv = env.TIDY_KV
    const ip = request.headers.get('CF-Connecting-IP') || 'noip'
    const now = new Date()
    const ymd = kstDay(now)                        // ⭐KST 기준 하루 (절대원칙 27)
    const minute = now.toISOString().slice(0, 16)

    if (kv) {
      const [dayC, ipC] = await Promise.all([num(kv, `td:${ymd}`), num(kv, `ti:${ip}:${minute}`)])
      if (dayC >= LIMITS.DAILY_GLOBAL) return json({ error: 'daily_full' }, 429, cors)
      if (!founder && ipC >= LIMITS.PER_IP_PER_MIN) return json({ error: 'too_fast' }, 429, cors)
    }

    // ── AI 부르기 ── ⭐⭐ **모델을 «차례로» 시도한다 (2026-08-29 오후)**
    //
    // 📮 창업자 = 대시보드에서 변수 넣고 Deploy 누르고 로그 새로고침하는 왕복이 반나절 갔다.
    //    ⛔ 그건 규칙 8 위반이다 — **시행착오는 창업자가 아니라 우리가 한다.**
    //
    // 🔬 **실물로 확정된 사고 (창업자 폰 로그 14:25:37)**
    //    `BAD_AI_OUTPUT @cf/zai-org/glm-4.7-flash 30556ms` ＋ 응답 안이
    //    `"content": null` · `"reasoning": "1. **Analyze the Request:** …"`
    //    → **모델이 30.5초 동안 «생각만» 하다가 `max_tokens` 를 다 쓰고 답을 한 글자도 못 냈다.**
    //    ⭐ 오늘 하루의 사슬(502 → timeout → empty_result)이 전부 이 «하나»의 증상이었다.
    //
    // ✅ 그래서 «고르는 일»을 코드가 한다 — 빠른 모델부터 부르고, 빈손이면 다음 모델로.
    //    ⛔ 무한 재시도는 안 한다(최대 두 판) — 무료 통도 시간도 유한하다.
    //    ⭐ 지금은 **기다리는 사람이 0명**이라(v11.85 = 규칙 파서가 먼저 채운다) 재시도가 공짜다.
    //       ⛔ 만약 앱이 다시 «기다리는» 구조로 돌아가면 이 재시도를 줄여야 한다.
    const 모델들 = 모델차례(env)
    const 시작전체 = Date.now()
    let 답 = null
    let 마지막오류 = ''

    for (const model of 모델들) {
      const 시작 = Date.now()
      let out
      try {
        const r = await env.AI.run(model, {
          messages: [{ role: 'user', content: PROMPT + text }],
          // ⭐ 0.2 = 창업자 실물 판정 뒤 권장값. 1.0 에서도 안 지어냈지만 낮을수록 안정적이다.
          temperature: 0.2,
          max_tokens: MAX_TOKENS,
        })
        // ⭐ 흔한 응답 모양을 «전부» 훑는다. ⛔`??` 가 아니라 `첫값` 이다 — `''` 에서 멈추면 안 된다.
        out = 첫값(
          r?.response,
          r?.result?.response,
          r?.result,
          r?.choices?.[0]?.message?.content,
          r?.output_text,
          r,
        )
        // 🧠 **「생각만 하고 답을 안 준 것」에 이름을 붙인다** — 이게 오늘 범인이었다.
        //   이름이 없으면 다음에 또 `BAD_AI_OUTPUT` 안에 숨어 안 보인다.
        const m0 = r?.choices?.[0]?.message
        if (m0 && m0.content == null && (m0.reasoning || m0.reasoning_content)) {
          console.log('THINKING_ONLY', model, (Date.now() - 시작) + 'ms', '(생각하다 답 길이를 다 썼다)')
        }
      } catch (e) {
        마지막오류 = String((e && e.message) || e).slice(0, 200)
        console.log('AI_FAILED', model, (Date.now() - 시작) + 'ms', 마지막오류.slice(0, 300))
        await 통세기(kv, ymd)
        continue
      }
      await 통세기(kv, ymd)   // ⛔ 실패해도 뉴런은 나갔다 — 성공만 세면 통이 조용히 샌다

      const parsed = pickJson(out)
      if (!parsed) {
        // ⛔ 통째로 찍지 않는다(레시피 원문이 로그에 남는다). 400자면 모양을 아는 데 충분하다.
        let 모양; try { 모양 = typeof out === 'object' ? JSON.stringify(out) : String(out ?? '') } catch { 모양 = '(못 읽음)' }
        console.log('BAD_AI_OUTPUT', model, (Date.now() - 시작) + 'ms', typeof out, String(모양).slice(0, 400))
        continue
      }

      const 후보 = {
        title: str(parsed.title),
        ingredients: arr(parsed.ingredients),
        steps: arr(parsed.steps),
        memo: str(parsed.memo),
        model,
      }

      // 🕳 「JSON 인데 비었다」 — 200 으로 나가던 길이라 로그가 한 줄도 없던 자리다(2026-08-29).
      //   📌 규칙 18 ⓘ — 「로그가 있다」와 「로그가 «그것»을 본다」는 다른 말이다.
      if (!후보.ingredients.length && !후보.steps.length) {
        let 모양; try { 모양 = JSON.stringify(parsed) } catch { 모양 = '(못 읽음)' }
        console.log(
          'EMPTY_RESULT', model, (Date.now() - 시작) + 'ms',
          'keys=' + Object.keys(parsed || {}).join(','),
          String(모양).slice(0, 300),
        )
        continue
      }

      console.log('AI_OK', model, (Date.now() - 시작) + 'ms')
      답 = 후보
      break
    }

    if (!답) {
      // ⭐ 「어느 모델을 어떤 차례로 시도했나」를 한 줄로 — 다음 사람이 이 줄만 봐도 다 안다.
      console.log('ALL_MODELS_FAILED', 모델들.join(' → '), (Date.now() - 시작전체) + 'ms')
      return json({ error: 마지막오류 ? 'ai_failed' : 'bad_ai_output', why: 마지막오류 || '' }, 502, cors)
    }

    if (kv) await inc(kv, `ti:${ip}:${minute}`, 120)

    return json(답, 200, cors)
  },
}

// ── ⭐ 「오늘」은 «한국시간» 기준 (CLAUDE.md 절대원칙 27) ──
//   ⛔ getTimezoneOffset 을 «더하지» 않는다 — Date.now() 는 이미 UTC 라 그냥 +9시간이다.
//      (2026-08-17 사고: KST 폰에서 0~9시에 «어제»가 나왔다)
function kstDay(d) {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// ── 모델이 JSON «만» 주지 않을 때가 있다 (```json 울타리 · 앞뒤 설명) ──
//   ⛔ JSON.parse 하나만 믿으면 그때마다 통째로 실패한다.
//   ⚠️ Workers AI 에 JSON Mode 가 있지만 «보장은 안 된다»(공식: "JSON Mode couldn't be met" 오류가 온다)
//      ＋ glm-4.7-flash 가 지원 목록에 있는지 확인 못 했다 → 지금은 안 쓰고 여기서 집어낸다.
function pickJson(out) {
  if (!out) return null
  if (typeof out === 'object' && (out.title || out.steps || out.ingredients)) return out
  // ⛔⛔ [2026-08-29 실물] **객체를 «버리지 않는다».**
  //   창업자 폰 로그 = `BAD_AI_OUTPUT … object [object Object]` (24,333ms · Wall 24,334ms · CPU 3ms).
  //   AI 는 답을 «줬는데» 모양이 우리 예상과 달라 위 줄을 못 통과했고,
  //   그다음 `String(out)` 이 **「[object Object]」** 로 만들어 통째로 잃었다.
  //   ⭐ 객체는 `JSON.stringify` 로 펼친다 — 어느 겹에 들어 있든 아래 ①②③이 찾아낸다.
  // ⛔⛔ [2026-08-29 오후] **「객체면 통과」가 «가짜 성공»을 만들고 있었다.**
  //   AI 응답이 `{"response":"{\"title\":…}"}` 처럼 «한 겹 싸여» 오면
  //   아래 ②(첫 { ~ 마지막 })가 **바깥 껍데기를 통째로** 떠서 JSON.parse 에 성공한다.
  //   그러면 `{response:'…'}` 가 «레시피»로 통과하고 → title·ingredients 가 전부 없어
  //   워커는 **200 으로 빈 레시피**를 내보낸다(창업자 폰 = `empty_result`).
  //   📌 「파싱에 성공했다」와 「레시피를 찾았다」는 다른 말이다(규칙 18 ⓘ).
  //   ✅ 그래서 **우리 칸(title·ingredients·steps)이 «있는» 객체만** 받는다.
  //      못 찾으면 껍데기 «안»을 한 겹씩 더 판다(아래 ④).
  const s = typeof out === 'object' ? JSON.stringify(out) : String(out)
  const cand = []
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)   // ① 울타리 안
  if (fence) cand.push(fence[1])
  const a = s.indexOf('{'), b = s.lastIndexOf('}')        // ② 첫 { ~ 마지막 }
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  cand.push(s)                                            // ③ 통째로
  const 껍데기 = []
  for (const c of cand) {
    try {
      const o = JSON.parse(c)
      if (!o || typeof o !== 'object') continue
      if (레시피인가(o)) return o
      껍데기.push(o)     // 객체이긴 한데 우리 칸이 없다 → 안을 더 판다
    } catch { /* 다음 후보 */ }
  }
  // ④ 껍데기 안의 «글자·객체» 값을 한 겹 더 판다 (`{response:"{…}"}` · `{result:{response:"{…}"}}`)
  //   ⛔ 깊이를 2로 묶는다 — 끝없이 파면 엉뚱한 것을 레시피라 우기게 된다.
  for (const o of 껍데기) {
    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') {
        if (레시피인가(v)) return v
        const 안 = pickJson(v)   // ⭐ 두 겹(`{result:{response:"…"}}`)도 판다
        if (안) return 안
        continue
      }
      if (typeof v !== 'string' || v.length < 10) continue
      const 속 = pickJson(v)
      if (속) return 속
    }
  }
  return null
}

// ⭐ 「레시피 모양인가」 — 우리 칸이 하나라도 «진짜로» 들어 있어야 한다.
//   ⛔ 열쇠만 있고 값이 없는 것(`{title:undefined}`)은 통과시키지 않는다.
function 레시피인가(o) {
  if (!o || typeof o !== 'object') return false
  return (typeof o.title === 'string' && o.title.trim() !== '') ||
    Array.isArray(o.ingredients) || Array.isArray(o.steps)
}

// ⭐ 「값이 있는 첫 번째」 — `??` 는 «빈 글자»를 통과시켜 뒤 후보를 못 보게 만든다(2026-08-29).
function 첫값(...vs) {
  for (const v of vs) {
    if (v === null || v === undefined) continue
    if (typeof v === 'string' && v.trim() === '') continue
    return v
  }
  return null
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])

async function num(kv, key) {
  const v = await kv.get(key)
  return v ? parseInt(v, 10) || 0 : 0
}
// 🔢 무료 통 세기 — ⛔실패해도 «뉴런은 나갔다». 성공만 세면 통이 조용히 샌다.
async function 통세기(kv, ymd) {
  if (!kv) return
  await inc(kv, `td:${ymd}`, 60 * 60 * 48)
}

async function inc(kv, key, ttl) {
  const v = (await num(kv, key)) + 1
  await kv.put(key, String(v), { expirationTtl: ttl })
  return v
}
function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-hankki-token, x-hankki-founder',
    'Access-Control-Max-Age': '86400',
  }
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  })
}
