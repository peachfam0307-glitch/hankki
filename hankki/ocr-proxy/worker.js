// ═══════════════════════════════════════════════════════════════
// 한끼 OCR 프록시 — Cloudflare Worker  [요새(fortress) 버전]
// 브라우저(PWA)에서 이미지를 받아 Google Vision으로 OCR → 텍스트만 반환.
// ⭐ Vision API 키는 이 서버(Secret)에만 있고 브라우저엔 절대 안 나간다.
//
// ── "결제사고 절대 방지" 다중 방어벽 ──────────────────────────────
//  ① 전역 월 상한 900건  → 무료티어(1,000) 아래라 비용이 물리적으로 $0
//                          (KV가 살짝 느슨해도 100건 버퍼가 흡수)
//  ② 전역 일 상한 120건  → 하루 폭주로 한 달치를 태우는 것 차단
//  ③ 유저당 월 5회       → 한 사람이 pool 독식 못 함 (= 프리미엄 유도)
//  ④ IP당 분당 6회       → 한 곳에서 두들기기 차단
//  ⑤ 우리 앱 주소만 통과 + 앱 토큰 확인 + 이미지 크기 제한
//  ⑥ (구글쪽) 예산경보 ₩1000 + 분당 할당량 → 독립된 2차 벽
//  → 어느 하나 뚫려도 ①이 900에서 막아서 청구 자체가 불가능.
//
// 필요한 것(대시보드에서 설정):
//   Secret  VISION_KEY = Google API 키(AIza...)
//   Secret  APP_TOKEN  = 앱과 공유하는 임의 비밀(내가 만들어 줌)
//   KV 바인딩 OCR_KV   = 사용량 카운터 저장소(내가 만드는 법 안내)
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://peachfam0307-glitch.github.io',
]

// ── 상한값(원하면 여기 숫자만 바꾸면 됨) ──
const LIMITS = {
  MONTHLY_GLOBAL: 900,   // 전체 월 상한 (무료티어 아래 → 비용 $0 보장)
  DAILY_GLOBAL: 120,     // 전체 일 상한
  PER_USER_MONTHLY: 5,   // 유저당 월 무료 횟수 (프리미엄 생기면 상향)
  PER_IP_PER_MIN: 6,     // IP당 분당 상한
}

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'
const MAX_B64 = 8_000_000 // base64 최대 ~6MB

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors)

    // ⑤-a 오리진 체크
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden_origin' }, 403, cors)
    // ⑤-b 앱 토큰 체크
    if (env.APP_TOKEN && request.headers.get('x-hankki-token') !== env.APP_TOKEN) {
      return json({ error: 'unauthorized' }, 401, cors)
    }

    // 🔓 운영자(창업자) 무제한 통로 — 비밀키(FOUNDER_SECRET) 일치 시 모든 한도 우회(카운트도 안 함).
    // 앱은 이 기기가 운영자 모드일 때만 x-hankki-founder 헤더를 보낸다(URL ?founder=…로 1회 진입).
    const founder = !!(env.FOUNDER_SECRET && request.headers.get('x-hankki-founder') === env.FOUNDER_SECRET)

    // 본문 파싱: { image: dataURL, uid: 기기식별자 }
    let body
    try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }
    const b64 = String(body.image || '').replace(/^data:image\/\w+;base64,/, '')
    if (!b64 || b64.length > MAX_B64) return json({ error: 'bad_image' }, 400, cors) // ⑤-c 크기 제한
    const uid = String(body.uid || 'anon').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'anon'

    const kv = env.OCR_KV
    const ip = request.headers.get('CF-Connecting-IP') || 'noip'
    const now = new Date()
    const ym = now.toISOString().slice(0, 7)        // 2026-07
    const ymd = now.toISOString().slice(0, 10)       // 2026-07-25
    const minute = now.toISOString().slice(0, 16)    // 2026-07-25T09:31

    // ── 방어벽 검사(막혔으면 Vision 호출 없이 즉시 반려) ──
    // 운영자(founder)는 '개인 한도'(IP·유저)만 우회하고, '전역 상한'(비용 $0 보장)은 그대로 존중한다.
    // → 비밀키가 새더라도 전역 900에서 막혀 비용은 여전히 $0. (모든 한도 우회보다 이게 안전)
    if (kv) {
      const [ipC, dayC, monC, userC] = await Promise.all([
        num(kv, `ip:${ip}:${minute}`),
        num(kv, `d:${ymd}`),
        num(kv, `m:${ym}`),
        num(kv, `u:${uid}:${ym}`),
      ])
      if (!founder && ipC >= LIMITS.PER_IP_PER_MIN) return json({ error: 'rate_limited' }, 429, cors)   // ④
      if (monC >= LIMITS.MONTHLY_GLOBAL) return json({ error: 'global_quota' }, 429, cors)              // ① 운영자도 존중
      if (dayC >= LIMITS.DAILY_GLOBAL) return json({ error: 'global_quota' }, 429, cors)                // ② 운영자도 존중
      if (!founder && userC >= LIMITS.PER_USER_MONTHLY) return json({ error: 'user_quota' }, 429, cors) // ③
    }

    // ── Vision 호출 직전에 카운터 증가(먼저 올려 폭주 시 초과 방지) ──
    // 운영자도 전역 카운트엔 포함(전역 상한이 비용을 지키니까). 유저별 카운트는 무의미하지만 함께 올려도 무방.
    if (kv) {
      await Promise.all([
        inc(kv, `ip:${ip}:${minute}`, 120),          // 2분 뒤 만료
        inc(kv, `d:${ymd}`, 60 * 60 * 26),           // ~26시간
        inc(kv, `m:${ym}`, 60 * 60 * 24 * 40),       // ~40일
        inc(kv, `u:${uid}:${ym}`, 60 * 60 * 24 * 40),
      ])
    }

    // ── Google Vision (문서 OCR + 한/영 힌트) ──
    let vr
    try {
      vr = await fetch(`${VISION_URL}?key=${env.VISION_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: b64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: { languageHints: ['ko', 'en'] },
          }],
        }),
      })
    } catch { return json({ error: 'vision_fetch_failed' }, 502, cors) }

    if (!vr.ok) {
      const detail = (await vr.text().catch(() => '')).slice(0, 300)
      return json({ error: 'vision_error', status: vr.status, detail }, 502, cors)
    }
    const data = await vr.json().catch(() => null)
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || ''
    // 남은 무료 횟수도 함께 알려줘(앱이 "N회 남음" 표시 가능)
    return json({ text }, 200, cors)
  },
}

// KV 정수 읽기
async function num(kv, key) {
  const v = await kv.get(key)
  return v ? parseInt(v, 10) || 0 : 0
}
// KV 정수 +1 (만료시간 지정) — KV는 완전 원자적이진 않아 소폭 오차 가능하나 ①의 100 버퍼가 흡수
async function inc(kv, key, ttl) {
  const v = (await num(kv, key)) + 1
  await kv.put(key, String(v), { expirationTtl: ttl })
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-hankki-token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
