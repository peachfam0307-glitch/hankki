// 🚨🚨🚨 ═══ 이 파일을 «그대로» Cloudflare 에 올리지 말 것 ═══════════
//
//   ⛔ **이 파일 ≠ 지금 도는 서버.** 아래 「한 묶음 = 1장」(batch) 코드는
//      **만들어만 두고 서버엔 «안 올렸다».** 창업자가 리스크를 듣고 물렸다.
//
//   📮 창업자 «최종» 확정 (2026-08-13 밤) = *"그냥 1장당 1장 카운트하기로 정했어"*
//      → **지금 실제 동작 = 사진 «한 장마다» 1장 차감.** 그게 맞는 동작이다.
//      → *"2장레시피 잘없기도하고 있어도 50원이야"* · *"그정도는 유저가 부담해도 충분해"*
//
//   ⛔ 그대로 올리면 «묶음 1장»이 켜져서 —
//      ① 화면 문구 「사진 1장에 AI 스캔 1장씩 써요」가 **거짓말이 된다**
//      ② 전역 월 900 이 **더 빨리 찬다**(호출 3번인데 유저는 1장만 깎임)
//         → 돈은 $0 그대로지만 **그 달에 다른 사람이 못 쓴다** = 창업자가 물린 바로 그 이유
//
//   ✅ 올려야 한다면 «batch 부분을 뺀 판»을 만들어 올린다.
//      혹시 «묶음 1장을 켜기로» 다시 정했다면, 그날 아래 셋을 **같이** 뒤집는다:
//        · 화면 문구 둘 (ImportScreen · 캡처 안내)
//        · hankki/scripts/_repro-묶음1장-0813.mjs 의 🔒 문구 검사 두 줄
//        · 이 경고 블록
//
//   📌 왜 이 경고가 여기 있나 (2026-08-21) — 이 파일만 읽고 «묶음 1장이 잘 돌고 있다»고
//      창업자에게 보고한 사고가 «같은 날 둘» 났다(클로드 · 외부 AI 검토판).
//      문서(hankki/docs/결제-준비상태-2026-08-07.md ⑩)엔 적혀 있었지만 «파일엔» 없었다.
//      ⭐ 파일을 읽는 사람은 파일만 읽는다.
// ═══════════════════════════════════════════════════════════════════
//
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
  WELCOME_FREE: 30,      // 🎁 웰컴 — 첫 1회만. 다 쓸 때까지 «달이 바뀌어도» 남는다
  //   ✅✅ **[창업자 확정 2026-08-31] 20 → 30** — *"30장으로 하자 넉넉하게 지금 유저 얼마 없으니까"*
  //      ⭐ 마진을 안 깎는다 — 웰컴은 **1회성**이고 «매월 반복량 5」는 그대로다(그게 창업자가 정한 유일한 레버).
  //      ⭐ 원가도 전역 월 900 이 막는다. ⛔ 「매월 5장」은 «건드리지 않았다».
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    // 📊📊 **[창업자 확정 2026-08-31] 「이번 달 몇 건 / 900」을 볼 수 있게 한다 — *"이건 꼭 해야해"***
    //
    //   ⛔⛔ 그 전엔 **통이 얼마나 찼는지 아무도 못 봤다.** 900이 차면 유저는 조용히 기본 인식으로
    //      떨어지고 우리는 그 사실조차 모른다. 그러면 「무료 열쇠를 더 줄까 · 카드를 붙일까」를
    //      **감으로** 정하게 된다 — 그게 제일 비싼 판정이다. 이 길 하나면 그 판정이 «숫자»가 된다.
    //
    //   ❓ 창업자 물음 = *"이거는 호출아니라 정확히 사용한 열쇠갯수는 보는거지?"*
    //   ✅ **지금 구조에선 그 둘이 «같은 수»다.** 창업자 최종 확정이 「사진 1장 = 열쇠 1개」라서
    //      Vision 을 부른 횟수가 곧 유저가 쓴 열쇠 개수다(묶음 코드는 안 올렸다 · 맨 위 경고).
    //      ⚠️ 다만 이 값은 **온 앱을 통틀어 «전역»**이다 — 「누가 몇 개」가 아니라 「다 합쳐 몇 개」.
    //      ⚠️ 그리고 **창업자 폰이 쓴 것도 포함**된다(운영자는 개인 한도만 우회하고 전역엔 센다).
    //         그게 맞다 — 통은 «실제로 나간 양»을 세야 하니까.
    //      ⛔ 「묶음 1장」을 나중에 켜면 그날부터 이 둘이 갈린다. 그때 이 주석도 같이 고칠 것.
    //
    //   🔒 **운영자만 본다** — 열쇠(FOUNDER_SECRET)가 맞아야 한다. 없으면 401.
    //      ⭐ 창업자가 «폰 브라우저로» 열어 보는 길이라 **GET 도 받고**, 헤더 대신 `?key=` 로도 받는다.
    //         (폰 브라우저는 헤더를 못 붙인다 — 그래서 이 길만 예외로 열어 둔다)
    //      ⛔ 그래서 아래 method·오리진 검사보다 «먼저» 온다.
    //   ⛔ 이 길은 **Vision 을 안 부른다** — 세는 값만 읽는다. 통을 축내지 않는다.
    //   ⛔ 유저별 값은 안 준다 — 볼 이유가 없고, 보면 그게 곧 개인정보가 된다.
    //
    //   📖 쓰는 법 = `https://<워커주소>/?quota=1&key=<FOUNDER_SECRET>`
    //      ⛔ 그 주소를 채팅·저장소에 적지 않는다(열쇠가 딸려 간다).
    if (new URL(request.url).searchParams.get('quota') === '1') {
      if (!env.FOUNDER_SECRET) return json({ error: 'no_secret' }, 500, cors)
      const 준열쇠 = request.headers.get('x-hankki-founder') || new URL(request.url).searchParams.get('key') || ''
      if (준열쇠 !== env.FOUNDER_SECRET) return json({ error: 'unauthorized' }, 401, cors)
      const kvq = env.OCR_KV
      if (!kvq) return json({ error: 'no_kv' }, 500, cors)
      // ⏰⏰ **세는 쪽과 «같은 잣대»를 쓴다** — 아래 카운터가 `new Date().toISOString()`(UTC)으로 키를 만든다.
      //   ⛔ 여기만 한국시간으로 바꾸면 **달이 바뀌는 자정 무렵에 «다른 칸»을 읽어** 0으로 보인다.
      //      («맞는 시간»보다 «같은 칸»이 먼저다 — 우리가 볼 것은 「그 카운터가 얼마나 찼나」다)
      const t = new Date()
      const ymq = t.toISOString().slice(0, 7)
      const ymdq = t.toISOString().slice(0, 10)
      const [월, 일] = await Promise.all([num(kvq, `m:${ymq}`), num(kvq, `d:${ymdq}`)])
      return json({
        달: ymq,
        월: { 쓴것: 월, 상한: LIMITS.MONTHLY_GLOBAL, 남음: Math.max(0, LIMITS.MONTHLY_GLOBAL - 월), 퍼센트: Math.round((월 / LIMITS.MONTHLY_GLOBAL) * 100) },
        오늘: { 쓴것: 일, 상한: LIMITS.DAILY_GLOBAL, 남음: Math.max(0, LIMITS.DAILY_GLOBAL - 일) },
        웰컴: LIMITS.WELCOME_FREE,
        매월: LIMITS.PER_USER_MONTHLY,
      }, 200, cors)
    }

    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors)

    // ⑤-a 오리진 체크
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden_origin' }, 403, cors)
    // ⑤-b 앱 토큰 체크
    if (env.APP_TOKEN && request.headers.get('x-hankki-token') !== env.APP_TOKEN) {
      return json({ error: 'unauthorized' }, 401, cors)
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

    // 🚨 ⛔ 아래 batch/sameBatch 는 **서버에 안 올린 코드**다 (파일 맨 위 경고 참고).
    //    창업자 «최종» 확정은 「사진 1장 = 1장」이고, 지금 도는 서버엔 이 부분이 «없다».
    //    ⛔ 이걸 보고 「묶음 1장이 돌고 있다」고 말하지 말 것 — 2026-08-21 에 그 사고가 났다.
    //
    // 🔢🔢 «한 묶음 = 1장» (창업자 확정 2026-08-13 · *"2장 썼는데 4장 나오면 문제"*)
    //    ⚠️ 이 확정은 같은 날 밤 «뒤집혔다» → 「사진 1장 = 1장」(위 경고)
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
      if (!founder && !sameBatch && welcomeLeft <= 0 && userC >= LIMITS.PER_USER_MONTHLY) {
        return json({ error: 'user_quota' }, 429, cors)
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
    return json({ text, left: { welcome: leftWelcome, month: leftMonth } }, 200, cors)
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
