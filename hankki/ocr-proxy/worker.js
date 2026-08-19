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
//   Secret  VISION_KEY     = Google API 키(AIza...)
//   Secret  APP_TOKEN      = 앱과 공유하는 임의 비밀
//   Secret  FOUNDER_SECRET = 🔓 운영자 무제한 통로 비밀키(개인한도만 우회, 전역은 존중)
//   KV 바인딩 OCR_KV       = 사용량 카운터 저장소
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://peachfam0307-glitch.github.io',
]

// ── 상한값(원하면 여기 숫자만 바꾸면 됨) ──
const LIMITS = {
  MONTHLY_GLOBAL: 900,   // 전체 월 상한 (무료티어 아래 → 비용 $0 보장)
  DAILY_GLOBAL: 120,     // 전체 일 상한
  PER_USER_MONTHLY: 5,   // 유저당 «월» 무료 횟수 (웰컴을 다 쓴 뒤부터)
  PER_IP_PER_MIN: 6,     // IP당 분당 상한
  WELCOME_FREE: 20,      // 🎁 웰컴 — 첫 1회만. 다 쓸 때까지 «달이 바뀌어도» 남는다
}

// 🎁🎁 웰컴 20장 (창업자 2026-07-26 확정 · 2026-08-13 «드디어» 구현)
//   📮 창업자 *"무료장수는 없으면 답답하니까 바로 열어야한다고 했었어"*
//   ⛔ 2026-07-26 에 확정하고 **18일** 동안 «코드에 한 줄도 없었다» — 새로 깐 사람은 월 5장만 받고 있었다.
//      ⚠️ 내가 여기에 「1년 가까이」라고 적었었다(2026-08-13 창업자가 잡음). 확정 7/26 → 구현 8/13 = 18일이다.
//      ⛔ 기간·개수는 «세어보고» 적을 것. 한번 적히면 다음 사람이 그대로 믿는다.
//
//   ⭐⭐ **「＋」가 아니다** (창업자 *"웰컴20장 다쓰면 무료5장은 소진한거니까 기본인식으로"*)
//      첫 달 = 25장이 아니라 **20장**. 웰컴이 그 달의 5장을 «대신한다».
//      → 그래서 웰컴을 쓸 때 **월 카운터도 같이 올린다.** 20장을 쓰면 월 카운터가 20이 되어
//        `PER_USER_MONTHLY(5)` 를 넘으므로 **그 달은 저절로 끝난다.** 다음 달엔 리셋되어 5장.
//
//   ⭐ **이월 = 다 쓸 때까지 남는다**(창업자 Ⓐ 확정) — 그래서 키에 «달»을 안 넣는다(`w:<uid>`).
//      웰컴은 «초기 임포트»용인데 레시피 20개를 한 달에 넣는 사람은 드물다.
//
//   ⚠️⚠️ **전역 900 이 조기 소진될 수 있다** — 지금 설치 31명이 전부 20장을 쓰면 620장이다.
//      ⭐ 그래도 **돈은 안 나간다**(무료티어 1,000 아래에서 막힌다) — 최악은 「그 달 남은 기간 전원 기본 인식」.
//      📌 실제로는 활성이 8명 안팎이라 그럴 일이 드물지만, **`m:<월>` 값을 한 번은 보고** 필요하면 상한을 올린다.

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'
const MAX_B64 = 8_000_000 // base64 최대 ~6MB

// ═══════════════════════════════════════════════════════════════
// 💳💳 결제 검증 (Google Play Developer API) — 2026-08-19 신설
//
// ⭐⭐ 왜 서버가 필요한가 (창업자 *"우리서버하는거 너믿고하는거니까 진짜 리스크 없이 가야해"*)
//   공식(크롬) = *"구매를 acknowledge 하지 않으면 «3일 뒤 유저에게 환불되고 Google Play 가 구매를 회수»한다"*
//              ＋ *"사기 방지를 위해 이 단계는 «반드시 백엔드»로 구현해야 한다"*
//   ⛔ Digital Goods API v2.1 의 메서드는 넷뿐이고(`getDetails`·`listPurchases`·`listPurchaseHistory`·`consume`)
//      **`acknowledge()` 는 v1.0 에만 있었고 삭제됐다** → **앱 쪽으로는 확인해 줄 방법이 «아예 없다».**
//   📌 즉 이 파일이 없으면 **꾸미기 팩을 산 사람 전원이 3일 뒤 팩을 잃는다.**
//
// ⛔⛔ **지금은 «꺼져 있다».** `PLAY_SA_JSON` 시크릿이 없으면 `/billing/*` 는 `billing_off` 만 돌려준다.
//   창업자 확정 ⓑ(2026-08-19) = **서비스 계정 초대는 프로덕션 «승인 뒤»** (권한 전파에 최대 24시간).
//   ⭐ 그래서 이 코드는 «검증된 코드»가 아니라 «작성된 코드»다. 판매 스위치는 실물 검증 뒤에만 켠다.
//
// 🔒 OCR 은 한 줄도 안 건드렸다 — 라우터가 `/billing/` 로 «시작하는 길»만 가로채고
//   나머지(앱이 쓰는 루트 POST)는 지금까지와 «똑같이» OCR 로 간다.
//
// 필요한 것(대시보드에서 추가):
//   Secret  PLAY_SA_JSON = 서비스 계정 키 JSON «통째로» (client_email ＋ private_key)
//   D1 바인딩 HANKKI_DB  = 결제 원장 (schema.sql 참고)
// ═══════════════════════════════════════════════════════════════

const BILLING = {
  // ⚠️ AAB 의 패키지명과 «한 글자도» 달라선 안 된다 (`android/twa-manifest.json`)
  PACKAGE: 'io.github.peachfam0307_glitch.twa',

  // 📷 소모성 = 다 쓰면 또 사는 것. 상품 ID 는 `src/billing.js` 의 SKU 와 같아야 한다.
  CONSUMABLE: { ocr_pack_20: 20 },   // 상품 ID → 주는 장수

  // 🎨 영구 = 한 번 사면 계속. ⛔consume 하지 않는다(하면 복원이 깨진다).
  DURABLE: ['deco_chuseok', 'deco_halloween', 'deco_autumn', 'deco_xmas', 'deco_winter'],

  // 🔢 소모성 팩을 «언제» 비우나(consume).
  //   ⛔⛔ **'exhausted'(다 쓸 때까지 미루기) 는 «죽은 길»이다 — 다시 넣지 말 것.**
  //      공식(안드로이드 개발자 문서) = *"소모하지 않으면 «보유 중»이라 다시 살 수 없고
  //      `ITEM_ALREADY_OWNED` 가 돌아온다"* → **다 쓰기 전엔 한 팩도 더 못 판다.**
  //      📌 우리 문서가 이미 그렇게 닫아 뒀다 = `docs/구글에-물어볼것-결제-2026-08-16.md` 7️⃣ 「바」
  //         (*"「다 쓸 때까지 미룬다」 안은 죽었다. 잔량은 서버(Worker＋D1)로"*)
  //   ✅ 그래서 'now' = **사자마자 비운다.** 언제든 또 살 수 있다.
  //      ⭐ 그 대신 「폰을 바꾸면 남은 장수가 사라진다」를 우리가 막아야 한다 —
  //         잔량을 «구매 토큰»에 매달아 두고, 앱이 그 토큰을 다시 들고 오면 새 기기로 옮긴다.
  //         (`listPurchaseHistory()` 는 **소모된 구매도** 토큰째 돌려준다 · 공식 확인 2026-08-19)
  CONSUME_WHEN: 'now',
}

const OAUTH_URL = 'https://oauth2.googleapis.com/token'
const PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
const SA_SCOPE = 'https://www.googleapis.com/auth/androidpublisher'

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

    // ── 💳 갈림길 ────────────────────────────────────────────
    // ⭐ `/billing/` 으로 «시작하는 길»만 결제로 보낸다. 그 밖은 전부 지금까지처럼 OCR.
    //   앱(`src/ocr.js`)은 «루트»로 POST 하므로 **OCR 동작은 한 톨도 안 바뀐다.**
    //   ⛔ 위의 오리진·앱토큰 벽을 «지나온 뒤»라 결제도 같은 벽을 그대로 쓴다.
    {
      const path = new URL(request.url).pathname
      if (path.startsWith('/billing/')) return billingRoute(path, request, env, cors)
    }

    // 🔓 운영자(창업자) 통로 — 비밀키(FOUNDER_SECRET) 일치 시 '개인 한도'(IP·유저)만 우회(전역 900은 존중).
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
    // 🎁 웰컴 잔량 — KV 에 «없으면» 아직 안 받은 사람이라 WELCOME_FREE 로 시작한다.
    //    ⭐ 그래서 이미 쓰던 유저·테스터도 이 판이 올라가는 순간 웰컴을 받는다(창업자 「바로 열자」 취지).
    let welcomeLeft = 0
    if (kv) {
      const raw = await kv.get(`w:${uid}`)
      welcomeLeft = raw === null ? LIMITS.WELCOME_FREE : (parseInt(raw, 10) || 0)
    }

    // 🔢🔢 «한 묶음 = 1장» (창업자 확정 2026-08-13 · *"2장 썼는데 4장 나오면 문제"*)
    //   묶음 = 앱의 «편집 화면 한 번» = 레시피 하나를 만드는 동안. 앱이 같은 `batch` 를 실어 보낸다.
    //   ⭐ 그 안에서 캡처를 몇 장 읽든, 잘못 잘라 다시 읽든 **유저 장수는 1장만** 빠진다.
    //   ⛔ 비용 방어(전역 월900·일120·IP분당6)는 «호출당» 그대로다 — 구글엔 부른 만큼 돈이 나가니까.
    //      즉 «유저 카운트만» 묶음당으로 가른다(`docs/AI-레시피추출-기능계획.md` §9-4-③ 설계 그대로).
    //   ⚠️ KV 는 최종 일관성이라 방금 쓴 값이 바로 안 보일 수 있다. 다만 우리 앱은 장마다
    //      «사람이 자르는 화면»이 끼어 요청 사이에 초 단위 간격이 있어 실제로는 거의 문제되지 않는다.
    //      설령 못 읽어도 그 묶음이 1장 더 세질 뿐 — 지금(장당 차감)보다 나빠지지 않는다.
    const batch = String(body.batch || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
    let sameBatch = false
    if (kv && batch) sameBatch = (await kv.get(`b:${uid}:${batch}`)) !== null

    // 💳 산 장수(유료). `null` = «아직 안 봤다» — 0 과 다르다(0 은 「다 썼다」).
    let paidLeft = null
    let usePaid = false

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
      // ③ 유저 한도 — ⭐**웰컴이 남아 있으면 월 한도를 안 본다.** 웰컴을 다 쓴 뒤부터 월 5장이다.
      //   ⭐ `sameBatch` = 이 묶음은 «이미 1장 값을 치렀다» → 한도를 다시 보지 않는다.
      //      (1장 남았는데 캡처 3장을 고른 사람이 두 번째 장에서 막히면 안 된다)
      if (!founder && welcomeLeft <= 0 && userC >= LIMITS.PER_USER_MONTHLY) {
        // 💳💳 **막기 «전»에 「산 장수」를 본다** (창업자 2026-08-13
        //   *"이거 진짜 중요해 유료결제라서 «유저가 몇장남았는지 스스로 알아야해»"*)
        //   ⛔ 이게 없으면 **돈을 내고도 좋은 인식을 못 쓴다** — worker 가 결제를 모르니 그냥 막는다.
        //   🔒 `paidCredits()` 는 무슨 일이 나든 **0** 을 돌려준다(D1 없음·오류·결제 꺼짐) →
        //      그러면 아래 줄이 그대로 돌아 **지금과 «똑같이»** 막힌다. 새로 생기는 위험이 0이다.
        paidLeft = await paidCredits(env, uid)
        if (!sameBatch) {
          if (paidLeft <= 0) return json({ error: 'user_quota' }, 429, cors)
          usePaid = true
        }
      }
    }

    // ── Vision 호출 직전에 카운터 증가(먼저 올려 폭주 시 초과 방지) ──
    // 운영자도 전역 카운트엔 포함(전역 상한이 비용을 지키니까). 유저별 카운트는 무의미하지만 함께 올려도 무방.
    if (kv) {
      await Promise.all([
        inc(kv, `ip:${ip}:${minute}`, 120),          // 2분 뒤 만료
        inc(kv, `d:${ymd}`, 60 * 60 * 26),           // ~26시간
        inc(kv, `m:${ym}`, 60 * 60 * 24 * 40),       // ~40일
        // ⭐ 웰컴을 쓰는 동안에도 «월 카운터를 같이» 올린다 —
        //    그래야 웰컴 20장을 다 쓴 순간 월 카운터가 5를 넘어 「그 달은 끝」이 된다.
        //    (창업자 확정: *"웰컴20장 다쓰면 무료5장은 소진한거니까 기본인식으로"*)
        // ⭐ 유저 몫(월 카운터·웰컴)은 «묶음의 첫 장에서만» 깎는다. 두 번째 장부터는 공짜.
        ...(sameBatch ? [] : [
          inc(kv, `u:${uid}:${ym}`, 60 * 60 * 24 * 40),
          // 🎁 웰컴 차감 — ⚠️만료를 «1년»으로 둔다(달이 바뀌어도 남아야 하니까 · 창업자 Ⓐ)
          ...(welcomeLeft > 0
            ? [kv.put(`w:${uid}`, String(welcomeLeft - 1), { expirationTtl: 60 * 60 * 24 * 365 })]
            : []),
          // 🔢 이 묶음은 값을 치렀다는 표식 — 6시간이면 레시피 한 편 쓰기엔 충분하고도 남는다
          ...(batch ? [kv.put(`b:${uid}:${batch}`, '1', { expirationTtl: 60 * 60 * 6 })] : []),
        ]),
      ])
    }


    // 💳 산 장수에서 «한 장» 깎는다 — 묶음의 첫 장에서만(위 `usePaid` 가 그때만 켜진다).
    //   ⭐ 무료 카운터와 «같은 자리»에서, Vision 을 부르기 «전»에 깎는다(폭주 시 초과 방지 · 위와 같은 원칙).
    //   ⭐ 다만 Vision 이 «대놓고 실패»하면 아래에서 되돌려 준다 — 돈 낸 장이니까.
    let spentToken = null
    if (usePaid) {
      const spent = await spendCredit(env, uid)
      spentToken = spent.token
      paidLeft = spent.left
      // ⛔⛔ **못 깎았으면 «쓰지 않는다».** (2026-08-19 재검토에서 찾은 구멍)
      //   두 요청이 «동시에» 마지막 한 장을 노리면 하나는 못 깎는데, 그래도 그냥 진행하면
      //   **장수가 0인 채로 한 장을 더 써 버린다.** 여기서 한 번 더 막는다.
      if (!spentToken) return json({ error: 'user_quota' }, 429, cors)
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
    } catch {
      await refundCredit(env, spentToken)   // 💳 돈 낸 장은 되돌려 준다
      return json({ error: 'vision_fetch_failed' }, 502, cors)
    }

    if (!vr.ok) {
      const detail = (await vr.text().catch(() => '')).slice(0, 300)
      await refundCredit(env, spentToken)   // 💳 돈 낸 장은 되돌려 준다
      return json({ error: 'vision_error', status: vr.status, detail }, 502, cors)
    }
    const data = await vr.json().catch(() => null)
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || ''
    // 남은 무료 횟수도 함께 알려줘(앱이 "N회 남음" 표시 가능)
    // 📢 **남은 장수를 같이 돌려준다** (창업자 2026-08-13 *"유저가 몇장남았는지 스스로 알아야해"*)
    //   ⭐ 서버가 «세는 쪽»이므로 서버가 알려주는 게 맞다 — 앱이 따로 세면 반드시 어긋난다.
    //   · `welcome` = 웰컴 남은 장수(다 쓸 때까지 유지) · `month` = 이번 달 남은 장수
    //   ⚠️ 이 호출 «자신»이 이미 차감됐으므로 1을 뺀 값을 보낸다(유저가 보는 것과 맞춘다).
    //   ⚠️ `kv` 는 «없을 수도 있다»(바인딩 누락·로컬) — 없이 `num()` 을 부르면 죽는다. 반드시 가드.
    //   ⭐ 같은 묶음의 두 번째 장부터는 «안 깎았으므로» 1을 빼지 않는다 — 안 그러면 화면 숫자가 헛돈다.
    const leftWelcome = Math.max(0, sameBatch ? welcomeLeft : welcomeLeft - 1)
    let leftMonth = LIMITS.PER_USER_MONTHLY           // 웰컴을 쓰는 동안엔 월 몫이 아직 안 줄었다
    if (kv && leftWelcome <= 0) {
      leftMonth = Math.max(0, LIMITS.PER_USER_MONTHLY - (await num(kv, `u:${uid}:${ym}`)))
    }
    // 💳 `paid` = **산 장수.** ⭐무료를 다 쓴 사람에게만 붙는다(`paidLeft` 가 null 이면 안 본 것).
    //   ⛔ 없는 칸을 0으로 보내면 앱이 「다 썼다」로 읽는다 → 아예 «안 보낸다».
    const left = { welcome: leftWelcome, month: leftMonth }
    if (paidLeft !== null) left.paid = paidLeft
    return json({ text, left }, 200, cors)
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
    'Access-Control-Allow-Headers': 'Content-Type, x-hankki-token, x-hankki-founder',
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

// ═══════════════════════════════════════════════════════════════
// 💳 결제 — 아래는 전부 «결제 길»에서만 쓴다. OCR 은 여기를 한 번도 안 지나간다.
// ⛔ 열쇠·토큰·JWT 는 «절대 로그로 찍지 않는다» (콘솔에 한 줄만 남아도 사고다)
// ═══════════════════════════════════════════════════════════════

// ── 갈림길 ────────────────────────────────────────────────
// `/billing/sync`  = 앱이 «가진 구매를 통째로» 보낸다 → 확인·acknowledge·이어붙이기 → 지금 상태
// `/billing/state` = 그냥 지금 상태만 (확인 없이 · 값싸다)
async function billingRoute(path, request, env, cors) {
  // 🔒 꺼짐 판정 — 서비스 계정이나 D1 이 없으면 «아무것도 안 한다».
  //   ⭐ 창업자 확정 ⓑ = 서비스 계정은 프로덕션 «승인 뒤»에 만든다 → 그때까진 늘 여기서 돌아선다.
  if (!env.PLAY_SA_JSON || !env.HANKKI_DB) return json({ error: 'billing_off' }, 503, cors)

  let body
  try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }
  const uid = String(body.uid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
  if (!uid) return json({ error: 'bad_uid' }, 400, cors)

  if (path === '/billing/state') return json({ ok: true, ...(await billingState(env, uid)) }, 200, cors)

  if (path === '/billing/sync') {
    // 앱이 `listPurchases()` 로 받은 것 그대로. 하나만 산 직후에도 «배열 하나»로 보낸다.
    const list = Array.isArray(body.purchases) ? body.purchases.slice(0, 30) : []
    const results = []
    for (const p of list) {
      const sku = String(p && p.sku || '')
      const token = String(p && p.token || '')
      results.push({ sku, ...(await handlePurchase(env, uid, sku, token)) })
    }
    // ⭐ 다 쓴 소모성 팩을 여기서 consume 한다 — «또 살 수 있게» 풀어 주는 자리.
    //   ⛔ OCR 길에서 하지 않는다(구글 API 를 부르면 사진 읽기가 그만큼 느려진다).
    await consumeExhausted(env, uid)
    return json({ ok: true, results, ...(await billingState(env, uid)) }, 200, cors)
  }

  return json({ error: 'not_found' }, 404, cors)
}

// ── 구매 한 건 처리 ────────────────────────────────────────
// 되는 일 = ①구글에 «진짜냐» 묻고 ②원장에 적고 ③acknowledge 한다.
// ⭐⭐ **몇 번을 보내도 결과가 같다(멱등)** — 토큰이 기본키라 두 번 적히지 않는다.
//   그래서 앱은 «앱을 켤 때마다» 통째로 다시 보내도 된다 = 「돈 냈는데 못 받는다」가 막힌다.
async function handlePurchase(env, uid, sku, token) {
  if (!sku || !token || token.length > 512) return { ok: false, reason: 'bad_args' }
  const isConsumable = Object.prototype.hasOwnProperty.call(BILLING.CONSUMABLE, sku)
  const isDurable = BILLING.DURABLE.includes(sku)
  if (!isConsumable && !isDurable) return { ok: false, reason: 'unknown_sku' }

  const db = env.HANKKI_DB
  const now = Math.floor(Date.now() / 1000)

  // ① 구글에 묻는다 (⛔앱 말을 믿지 않는다 — 이게 서버가 있는 이유다)
  const v = await playGet(env, `${PLAY_API}/${BILLING.PACKAGE}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(token)}`)
  if (!v.ok) {
    // ⛔⛔ **여기서 «회수하지 않는다».** 특히 404(token_unknown) —
    //   구글이 오래된 기록을 지웠을 수도 있어서, 회수하면 **멀쩡한 사람의 장수를 뺏는다.**
    //   「없다」와 「취소됐다」는 다른 말이다(규칙 18).
    return { ok: false, reason: v.reason }
  }
  const g = v.data || {}

  // ②🚨 **환불·취소된 구매는 «이미 준 것»을 거둬들인다.** (2026-08-19 재검토에서 찾은 구멍)
  //   purchaseState 0=구매됨 1=취소됨 2=보류중
  //   ⛔ 이게 없으면 「20장 받고 환불」이 그대로 통한다 — 앱이 sync 를 계속 보내니 여기서 잡힌다.
  //   ⚠️ 2(보류)는 아직 «준 적이 없는» 상태라 회수할 것도 없다. 그래도 같이 0으로 맞춰 둔다(중복 결제 방지).
  if (g.purchaseState !== 0) {
    try {
      await db.prepare('UPDATE credits SET remaining=0, updated_at=? WHERE token=?').bind(now, token).run()
      await db.prepare('DELETE FROM entitlements WHERE token=?').bind(token).run()
      await db.prepare('UPDATE purchases SET state=?, updated_at=? WHERE token=?').bind(g.purchaseState, now, token).run()
    } catch { /* 못 거둬도 다음 sync 에서 또 시도한다 */ }
    return { ok: false, reason: g.purchaseState === 2 ? 'pending' : 'revoked' }
  }

  // ③ 원장. ⭐**「처음 보는 토큰인가」로 갈리지 않는다.**
  //   ⛔⛔ 갈랐다가 구멍이 났었다 — `purchases` 는 들어갔는데 `credits` 가 실패하면
  //      다음 번엔 「처음이 아니다」로 판정돼 **장수를 영영 안 준다**(＝돈 내고 0장).
  //   ✅ 그래서 **넣는 문장 자체를 멱등**(`INSERT OR IGNORE`)으로 두고 **매번 그냥 다시 넣는다.**
  //      이미 있으면 무시되고, 없으면 그제야 생긴다. 몇 번을 보내도 결과가 같다.
  let fresh = false
  try {
    // 옛 주인을 «넣기 전»에 봐 둔다 — 없으면 이번이 처음이다.
    const old = isConsumable
      ? await db.prepare('SELECT uid FROM credits WHERE token=?').bind(token).first()
      : null
    fresh = isConsumable ? !old : false

    await db.prepare(
      'INSERT OR IGNORE INTO purchases (token, sku, uid, order_id, state, acked, created_at, updated_at) VALUES (?,?,?,?,?,0,?,?)',
    ).bind(token, sku, uid, String(g.orderId || ''), g.purchaseState, now, now).run()

    if (isConsumable) {
      // ⚠️ `quantity` = 한 번에 여러 개 산 경우(보통 1). ⛔값을 그대로 믿지 말고 1~50 으로 자른다.
      const qty = Math.max(1, Math.min(50, parseInt(g.quantity, 10) || 1))
      const give = BILLING.CONSUMABLE[sku] * qty
      await db.prepare(
        'INSERT OR IGNORE INTO credits (token, sku, uid, remaining, needs_consume, consumed, created_at, updated_at) VALUES (?,?,?,?,0,0,?,?)',
      ).bind(token, sku, uid, give, now, now).run()

      // ⭐⭐⭐ **아는 토큰인데 주인이 다르다 = 폰을 바꿨거나 앱을 지웠다 깐 것.**
      //   남은 장수를 «새 기기로 옮겨 준다». **이메일도 로그인도 없이 복원되는 자리다.**
      //   ⭐ 앱은 `listPurchases()` ＋ **`listPurchaseHistory()`** 를 같이 보낸다 —
      //      뒤엣것은 **이미 비운(consumed) 구매까지** 토큰째 돌려주므로, 사자마자 비워도 복원이 산다.
      if (old && old.uid && old.uid !== uid) {
        await db.prepare('UPDATE credits SET uid=?, updated_at=? WHERE token=?').bind(uid, now, token).run()
        // ⚠️⚠️ `listPurchaseHistory()` 는 **상품마다 «가장 최근» 한 건만** 준다(공식).
        //   그래서 팩을 두 번 산 사람은 옛 토큰이 안 돌아온다 →
        //   ⭐ 돌아온 토큰의 «옛 주인»을 찾아 **그 기기에 있던 남은 팩을 전부 같이 옮긴다.**
        await db.prepare('UPDATE credits SET uid=?, updated_at=? WHERE uid=? AND remaining>0')
          .bind(uid, now, old.uid).run()
        await db.prepare('UPDATE purchases SET uid=?, updated_at=? WHERE token=?').bind(uid, now, token).run()
      }
    } else {
      // 영구 팩 — uid 마다 한 줄. ⛔consume 하지 않는다(하면 복원이 깨진다).
      //   ⭐ 기기가 바뀌어도 앱이 `listPurchases()` 로 다시 들고 오므로 새 uid 에 그냥 다시 생긴다.
      await db.prepare('INSERT OR REPLACE INTO entitlements (uid, sku, token, created_at) VALUES (?,?,?,?)')
        .bind(uid, sku, token, now).run()
    }
  } catch { return { ok: false, reason: 'db_error' } }

  // ④ acknowledge — ⭐⭐**이걸 3일 안에 안 하면 구글이 «환불하고 회수»한다.**
  //   멱등이라 여러 번 불러도 안전하다. 이미 돼 있으면(1) 아예 안 부른다.
  //   ⭐ 장수를 «먼저» 주고 여기서 ack 한다 — 순서가 반대면 「ack 은 됐는데 장수는 없는」 상태가 생기고
  //      그건 3일 환불로도 안 풀린다(구글은 ack 된 걸 회수하지 않는다).
  let acked = g.acknowledgementState === 1
  if (!acked) {
    const a = await playPost(env, `${PLAY_API}/${BILLING.PACKAGE}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(token)}:acknowledge`, {})
    acked = a.ok
    if (!acked) return { ok: false, reason: 'ack_failed' }   // ⛔ 실패를 «성공»으로 말하지 않는다 — 앱이 다시 보낸다
  }
  try { await db.prepare('UPDATE purchases SET acked=1, updated_at=? WHERE token=?').bind(now, token).run() } catch { /* 원장 표시일 뿐 */ }

  return { ok: true, acked: true, fresh }
}

// 다 쓴 소모성 팩을 consume 한다 = 「또 살 수 있게」 푼다.
// ⛔ `CONSUME_WHEN === 'now'` 면 사자마자, `'exhausted'` 면 다 쓴 뒤에.
async function consumeExhausted(env, uid) {
  const db = env.HANKKI_DB
  const now = Math.floor(Date.now() / 1000)
  let rows
  try {
    const q = BILLING.CONSUME_WHEN === 'now'
      ? 'SELECT token, sku FROM credits WHERE uid=? AND consumed=0 LIMIT 10'
      : 'SELECT token, sku FROM credits WHERE uid=? AND consumed=0 AND needs_consume=1 LIMIT 10'
    rows = (await db.prepare(q).bind(uid).all()).results || []
  } catch { return }
  for (const r of rows) {
    const c = await playPost(env, `${PLAY_API}/${BILLING.PACKAGE}/purchases/products/${encodeURIComponent(r.sku)}/tokens/${encodeURIComponent(r.token)}:consume`, {})
    // ⛔ consume 이 실패하면 «표시를 안 남긴다» — 다음에 다시 시도한다.
    //   ⭐ 남은 장수는 그대로 두므로 유저가 손해 볼 일은 없다.
    if (c.ok) {
      try { await db.prepare('UPDATE credits SET consumed=1, updated_at=? WHERE token=?').bind(now, r.token).run() } catch { /* 다음에 다시 */ }
    }
  }
}

// 지금 이 사람이 가진 것 — 앱이 화면에 그대로 쓴다.
async function billingState(env, uid) {
  const out = { credits: 0, entitlements: [] }
  try {
    const c = await env.HANKKI_DB.prepare('SELECT COALESCE(SUM(remaining),0) AS n FROM credits WHERE uid=?').bind(uid).first()
    out.credits = (c && c.n) || 0
    const e = await env.HANKKI_DB.prepare('SELECT sku FROM entitlements WHERE uid=?').bind(uid).all()
    out.entitlements = ((e && e.results) || []).map((r) => r.sku)
  } catch {
    // ⛔⛔ **「못 읽었다」와 「없다」는 다른 말이다.** (2026-08-19 재검토에서 찾은 구멍)
    //   조용히 0·[] 로 답하면 앱이 **「산 게 없네」로 읽고 산 팩을 도로 잠근다.**
    //   → 표를 세워 알린다. 앱은 `stale` 이면 **화면을 건드리지 않는다.**
    out.stale = true
  }
  return out
}

// ── OCR 길에서 부르는 둘 ──────────────────────────────────
// ⭐⭐ 이 둘은 **무슨 일이 나도 던지지 않는다.** 던지면 사진 읽기가 통째로 죽는다.
//   결제가 안 되는 것과 앱이 깨지는 것은 다르다(`src/billing.js` 와 같은 원칙).
//
// ⛔⛔ **`consumed` 와 `remaining` 을 헷갈리지 말 것 — 2026-08-19 에 실제로 헷갈려 버그를 냈다.**
//   · `consumed=1` = **구글 쪽에서 비웠다**(＝또 살 수 있게 풀었다). 우리 장수와 아무 상관이 없다.
//   · `remaining`  = **우리가 줘야 할 남은 장수.**
//   📌 그래서 잔량을 셀 때 `consumed` 를 보면 안 된다 — 보면 **사자마자 잔량이 0이 된다**
//      (`CONSUME_WHEN: 'now'` 이라 구매 즉시 consumed=1 이 되니까). 재현판 ⑤가 이걸 잡았다.

// 산 장수가 몇 장 남았나. ⛔D1 이 없거나 오류면 **0** → 지금과 «똑같이» 막힌다.
async function paidCredits(env, uid) {
  if (!env.HANKKI_DB) return 0
  try {
    const r = await env.HANKKI_DB.prepare('SELECT COALESCE(SUM(remaining),0) AS n FROM credits WHERE uid=?').bind(uid).first()
    return (r && r.n) || 0
  } catch { return 0 }
}

// 한 장 깎는다. 돌려주는 값 = { left, token }
//   ⭐ 오래 산 팩부터 쓴다(먼저 산 것이 먼저 없어져야 유저가 헷갈리지 않는다).
//   ⚠️ `remaining>0` 조건을 «UPDATE 안»에 두어, 두 요청이 겹쳐도 마이너스로 안 내려간다.
async function spendCredit(env, uid) {
  if (!env.HANKKI_DB) return { left: 0, token: null }
  const now = Math.floor(Date.now() / 1000)
  try {
    const row = await env.HANKKI_DB.prepare(
      'SELECT token FROM credits WHERE uid=? AND remaining>0 ORDER BY created_at LIMIT 1',
    ).bind(uid).first()
    if (!row) return { left: 0, token: null }
    const u = await env.HANKKI_DB.prepare(
      'UPDATE credits SET remaining=remaining-1, needs_consume=CASE WHEN remaining-1<=0 THEN 1 ELSE 0 END, updated_at=? WHERE token=? AND remaining>0',
    ).bind(now, row.token).run()
    const ok = !!(u && u.meta && u.meta.changes === 1)
    return { left: await paidCredits(env, uid), token: ok ? row.token : null }
  } catch { return { left: 0, token: null } }
}

// Vision 이 «대놓고 실패»했을 때 한 장 되돌려 준다 — 돈 낸 장이니까.
async function refundCredit(env, token) {
  if (!env.HANKKI_DB || !token) return
  try {
    await env.HANKKI_DB.prepare('UPDATE credits SET remaining=remaining+1, updated_at=? WHERE token=?')
      .bind(Math.floor(Date.now() / 1000), token).run()
  } catch { /* 되돌리기 실패는 유저에게 손해가 없다(장수가 한 장 덜 남을 뿐) */ }
}

// ── Google Play Developer API ─────────────────────────────
let _saTok = null       // 이 isolate 안에서만 산다. ⛔KV·D1 에 «절대» 저장하지 않는다(그대로 열쇠다)
let _saExp = 0

// 서비스 계정 → OAuth 액세스 토큰. RS256 JWT 를 Web Crypto 로 직접 서명한다.
// ⭐ 라이브러리를 안 쓴다 — Worker 에 npm 을 넣으면 대시보드 복붙이 안 된다.
async function saAccessToken(env) {
  const now = Math.floor(Date.now() / 1000)
  if (_saTok && _saExp > now + 60) return _saTok
  let sa
  try { sa = JSON.parse(env.PLAY_SA_JSON) } catch { return null }
  if (!sa || !sa.client_email || !sa.private_key) return null

  const head = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64urlStr(JSON.stringify({
    iss: sa.client_email,
    scope: SA_SCOPE,
    aud: OAUTH_URL,
    iat: now,
    exp: now + 3600,
  }))
  let jwt
  try {
    const key = await importPk(sa.private_key)
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claim}`))
    jwt = `${head}.${claim}.${b64urlBytes(new Uint8Array(sig))}`
  } catch { return null }

  let r
  try {
    r = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })
  } catch { return null }
  if (!r.ok) return null
  const j = await r.json().catch(() => null)
  if (!j || !j.access_token) return null
  _saTok = j.access_token
  _saExp = now + (parseInt(j.expires_in, 10) || 3600)
  return _saTok
}

// PEM(pkcs8) → CryptoKey. JSON.parse 가 `\n` 을 진짜 줄바꿈으로 바꿔 주므로 그대로 쓰면 된다.
async function importPk(pem) {
  const body = String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const bin = atob(body)
  const der = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i)
  return crypto.subtle.importKey('pkcs8', der.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

function b64urlBytes(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlStr(str) { return b64urlBytes(new TextEncoder().encode(str)) }

async function playGet(env, url) {
  const tok = await saAccessToken(env)
  if (!tok) return { ok: false, reason: 'no_service_account' }
  let r
  try { r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } }) } catch { return { ok: false, reason: 'net' } }
  if (r.status === 401 || r.status === 403) { _saTok = null; return { ok: false, reason: 'sa_denied' } }
  if (r.status === 404) return { ok: false, reason: 'token_unknown' }   // 없는 구매 = 가짜이거나 이미 사라진 것
  if (!r.ok) return { ok: false, reason: `play_${r.status}` }
  const data = await r.json().catch(() => null)
  if (!data) return { ok: false, reason: 'bad_reply' }
  return { ok: true, data }
}

async function playPost(env, url, bodyObj) {
  const tok = await saAccessToken(env)
  if (!tok) return { ok: false, reason: 'no_service_account' }
  let r
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj || {}),
    })
  } catch { return { ok: false, reason: 'net' } }
  if (r.status === 401 || r.status === 403) { _saTok = null; return { ok: false, reason: 'sa_denied' } }
  // ⭐ 이미 acknowledge/consume 된 것은 400 으로 온다 — 그건 «실패가 아니라 이미 됨»이다.
  if (r.status === 400) {
    const t = (await r.text().catch(() => '')).toLowerCase()
    if (t.includes('already')) return { ok: true, already: true }
    return { ok: false, reason: 'play_400' }
  }
  if (!r.ok) return { ok: false, reason: `play_${r.status}` }
  return { ok: true }
}
