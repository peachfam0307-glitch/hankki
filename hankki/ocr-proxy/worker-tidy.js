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

// ⭐ 모델 = 설정값. ⛔코드에 박지 않는다(값이 오르면 대시보드에서 한 줄로 갈아탄다)
//   기본값 = 2026-08-28 창업자 실물 판정에서 11/12 를 낸 모델 (지금 파서는 6/12)
//   ID 근거 = developers.cloudflare.com/ai/models/@cf/zai-org/glm-4.7-flash/
const DEFAULT_MODEL = '@cf/zai-org/glm-4.7-flash'

// 🧪 이 지시로 실물 11/12 가 나왔다 (docs/AI다듬기-실물판정-2026-08-28.md 7️⃣)
// ⛔ 1번(지어내지 마라)이 «맨 앞»이다 — 오픈 모델은 긴 지시를 잘 못 따르므로 제일 위험한 것을 먼저.
const PROMPT = `너는 요리 레시피 정리기다. 아래는 인스타그램 캡처를 글자로 읽은 것이다.
화면 글자(통신사·시계·계정명·좋아요 수·댓글·GIF)와 인사말이 섞여 있다.

규칙:
1. 원문에 없는 재료나 순서를 절대 지어내지 마라. 없으면 비워라.
2. "재료"·"만드는 법"·"양념장" 같은 절 이름은 제목이 아니다.
3. 한 글에 요리가 둘이면 «맨 처음 요리»만 정리해라.
4. 재료 목록이 따로 없어도, 조리 문장 안에 나오는 재료를 빠짐없이 ingredients 에 뽑아라.
   분량이 없으면 이름만 적어라.
5. ingredients 에는 손질 상태를 빼고 "이름 분량"만.
6. 순서는 조리 동작만. 인사말·후기·팁은 memo 로. 괄호 안 설명도 버리지 마라.
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

    // ── AI 부르기 ──
    const model = String(env.TIDY_MODEL || DEFAULT_MODEL)
    let out
    try {
      const r = await env.AI.run(model, {
        messages: [{ role: 'user', content: PROMPT + text }],
        // ⭐ 0.2 = 창업자 실물 판정 뒤 권장값. 1.0 에서도 안 지어냈지만 낮을수록 안정적이다.
        temperature: 0.2,
        max_tokens: 2000,
      })
      out = r && (r.response ?? r.result ?? r)
    } catch (e) {
      // ⛔ 실패를 «감추지 않는다» — 앱이 규칙 파서로 떨어지려면 실패를 알아야 한다.
      return json({ error: 'ai_failed', why: String((e && e.message) || e).slice(0, 200) }, 502, cors)
    }

    const parsed = pickJson(out)
    if (!parsed) return json({ error: 'bad_ai_output' }, 502, cors)

    if (kv) {
      await Promise.all([
        inc(kv, `td:${ymd}`, 60 * 60 * 48),
        inc(kv, `ti:${ip}:${minute}`, 120),
      ])
    }

    return json({
      title: str(parsed.title),
      ingredients: arr(parsed.ingredients),
      steps: arr(parsed.steps),
      memo: str(parsed.memo),
      model,
    }, 200, cors)
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
  const s = String(out)
  const cand = []
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)   // ① 울타리 안
  if (fence) cand.push(fence[1])
  const a = s.indexOf('{'), b = s.lastIndexOf('}')        // ② 첫 { ~ 마지막 }
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  cand.push(s)                                            // ③ 통째로
  for (const c of cand) {
    try {
      const o = JSON.parse(c)
      if (o && typeof o === 'object') return o
    } catch { /* 다음 후보 */ }
  }
  return null
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])

async function num(kv, key) {
  const v = await kv.get(key)
  return v ? parseInt(v, 10) || 0 : 0
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
