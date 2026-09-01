// ✅ ═══ 이 파일 = 지금 도는 서버 (2026-09-01 부터) ═══════════════════
//
//   ⭐ **그대로 복붙해도 된다.** 예전엔 아니었다 — 아래를 읽어라.
//
//   🗑 **「한 묶음 = 1장」(batch) 코드를 2026-09-01 에 «걷어냈다».**
//      📮 창업자 «최종» 확정 (2026-08-13 밤) = *"그냥 1장당 1장 카운트하기로 정했어"*
//         · *"2장레시피 잘없기도하고 있어도 50원이야"* · *"그정도는 유저가 부담해도 충분해"*
//      → 그 확정 뒤에도 **코드는 파일에 남아 있었고 서버엔 안 올라가 있었다.** 그게 사고를 냈다.
//
//   ⛔⛔ **걷어낸 이유 = 「거짓 초록불」** (이게 제일 컸다)
//      게이트 `_repro-묶음1장-0813.mjs` 가 스모크에서 **매일 통과하면서**
//      *"캡처 3장을 한 묶음으로 읽어도 유저 장수는 1장만 빠진다"* 고 **단언했다.**
//      그런데 서버엔 그 코드가 없어서 **실제로는 3장이 빠졌다.**
//      📌 2026-08-21 에 이 파일만 읽고 «묶음 1장이 잘 돌고 있다»고 창업자에게
//         잘못 보고한 사고가 «같은 날 둘» 났다(클로드 · 외부 AI 검토판).
//         경고문을 26줄 붙였지만 **경고는 사람만 읽고 게이트는 계속 반대로 말했다.**
//      ⭐ 그래서 **경고를 지우고 «코드를 없앴다».**
//         「하지 마라」를 적는 것보다 **「할 수 없게」 만드는 게 낫다**(2026-08-14 옛 곰 컷과 같은 방법).
//
//   🔙 **되살리는 법** — git 이 갖고 있다. 「묶음 1장」으로 다시 정하는 날:
//        `git show 6b196c44:hankki/ocr-proxy/worker.js`
//      ＋ 그날 «같이» 뒤집을 것 둘 =
//        · 화면 문구 둘 (ImportScreen · 캡처 안내 — 「사진 1장에 열쇠 1개」)
//        · hankki/scripts/_repro-묶음1장-0813.mjs 의 잣대
//      ⚠️ 되살리기 «전»에 창업자가 물린 이유부터 다시 잴 것 —
//         유저가 열쇠 1개로 구글 호출 3번을 쓰면 **전역 900 이 열쇠 대비 3배 빨리 닳는다.**
//         유료로 팔기 시작하면 그건 **「산 사람이 못 쓴다」**가 된다.
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
  // 🎁🎁 웰컴 — 첫 1회만. 다 쓸 때까지 «달이 바뀌어도» 남는다
  //   ✅✅ **[창업자 확정 2026-09-01] 비로그인 10 · 로그인 30** — *"10 30 그렇게 가자"*
  //      📮 창업자 걱정 = *"앱지웠다가 깔면 또 가져가고 그렇게 되지 않을까;;"*
  //      ⭐ 유저가 보는 말은 **「로그인하면 열쇠 20개를 더 드려요」** — 못 받는 게 아니라 «받는» 말이다.
  //      ⭐ 지웠다 깔아도 10개뿐이라 어뷰징이 줄고, 로그인하면 계정에 묶여 리셋이 안 된다.
  //      ⛔ 창업자 첫 안은 「비로그인 5」였는데 접었다 — 30 → 5는 여섯 배 낙차라
  //         「한 번 준 것은 빼앗지 않는다」에 닿고, 5개면 AI 가 한두 번 실패하면 앱을 겪어보지도 못한다.
  //   ✅✅ [옛 확정 2026-08-31] 20 → 30 — *"30장으로 하자 넉넉하게 지금 유저 얼마 없으니까"*
  //      ⭐ 마진을 안 깎는다 — 웰컴은 **1회성**이고 «매월 반복량 5»는 그대로다(창업자가 정한 유일한 레버).
  WELCOME_ANON: 10,      // 그냥 깐 사람
  WELCOME_ACCT: 30,      // 로그인한 사람 (＝＋20)
  // 🎁 행동으로 받는 열쇠 — 각 **평생 1회** (창업자 확정 2026-08-31)
  //   📮 *"4개 왜냐면 우리 기능을 하나씩 써봤으면 좋겠어서"* · *"냉장고 써보면 1개 더 줄까 싶기도"* · *"다 1회한정으로"*
  //   ⭐ 이건 「열쇠를 주는 일」이 아니라 **「앱을 안내하는 일」**이다 — 창업자 이유가 그거였다.
  //   ⛔ 서버는 「진짜 했는지」 확인할 길이 없다. **상한(다섯 × 1개 = 5)이 그 자리를 막는다.**
  EARN_ACTIONS: ['자랑', '레꾸', '일기', '요리', '냉장고'],
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
      // 👤 [창업자 지시 2026-09-01] 창업자 몫을 갈라 보여준다 — 그래야 「유저가 얼마나 쓰나」가 보인다.
      //   ⛔ 유저 «개인별»은 여전히 안 준다(바로 위 주석 그대로).
      const [월, 일, 월창, 일창, 막힘] = await Promise.all([
        num(kvq, `m:${ymq}`), num(kvq, `d:${ymdq}`),
        num(kvq, `mf:${ymq}`), num(kvq, `df:${ymdq}`),
        num(kvq, `q:${ymq}`),
      ])
      return json({
        달: ymq,
        월: {
          쓴것: 월, 상한: LIMITS.MONTHLY_GLOBAL, 남음: Math.max(0, LIMITS.MONTHLY_GLOBAL - 월),
          퍼센트: Math.round((월 / LIMITS.MONTHLY_GLOBAL) * 100),
          창업자: 월창, 유저: Math.max(0, 월 - 월창),   // ⭐ 여기가 창업자가 물은 그 칸이다
        },
        오늘: {
          쓴것: 일, 상한: LIMITS.DAILY_GLOBAL, 남음: Math.max(0, LIMITS.DAILY_GLOBAL - 일),
          창업자: 일창, 유저: Math.max(0, 일 - 일창),
        },
        웰컴: { 비로그인: LIMITS.WELCOME_ANON, 로그인: LIMITS.WELCOME_ACCT },
        매월: LIMITS.PER_USER_MONTHLY,
        // 🚧🚧 **「막힘」 = 무료 한도에 부딪힌 횟수** — 유료를 «언제» 켤지 정하는 숫자다.
        //   ⭐ 「유저 몇 명」이 아니라 **「더 쓰고 싶은데 막힌 횟수」**가 살 사람의 직접 증거다.
        //   📌 잣대(창업자와 정할 것) = **한 달 20번**쯤이면 켤 때가 된 것.
        //      ⚠️ 20 은 «추정»이다(한 사람이 막히면 보통 2~4번 부딪힌다 → 5~10명). 실측이 아니다.
        //   ⛔ 누가 막혔는지는 «안» 센다 — 전역 숫자 하나뿐이다.
        막힘: { 이번달: 막힘, 켤때: 20 },
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
    // ── 🔑🔑 열쇠 통 — 「남은 수」가 아니라 «쓴 수»를 센다 ───────────────
    //
    // ⭐⭐ **왜 «쓴 수»인가** — 「남은 수」로 저장하면 10↔30 전환이 깨진다.
    //    비로그인으로 7개 쓰고(남은 3) 로그인하면 계정 통을 30으로 «새로» 만들게 되어
    //    **총 37개**가 되고, 로그아웃·로그인을 되풀이하면 **무한**이다.
    //    ✅ 쓴 수로 두면 `남은 = 상한 + 보너스 − 쓴수` 라 **로그인하는 순간 상한만 바뀌어 저절로 ＋20** 된다.
    //       로그아웃도 저절로 맞는다(상한이 10으로 돌아가고 쓴 수는 그대로라 «잃는 게 없다»).
    //
    // ⛔ **로그인했다는 걸 서버가 «확인하지는» 못한다**(앱이 보낸 번호를 믿는다).
    //    제대로 막으려면 Firebase ID 토큰을 RS256 으로 검증해야 한다.
    //    이번 판엔 안 넣는다 — ⑴무료라 돈이 안 걸렸고 ⑵기기 번호를 갈면 10개씩 받는 더 큰 구멍이 이미 있고
    //    ⑶전역 월 900·일 120 이 청구를 0원으로 막는다.
    //    🚨 **결제를 켜는 날엔 «반드시» 넣는다.** 그날 이 줄을 다시 읽는다.
    const sub = String(body.sub || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
    const 로그인 = !!sub
    const 통 = 로그인 ? `a:${sub}` : `d:${uid}`
    // 🎁🎁 행동 열쇠 표식을 찾을 통들 — 로그인했으면 «기기 통»도 같이 본다.
    //   ⛔⛔ **이게 없으면 로그인만 하면 다섯을 «또» 받는다** — 통 이름이 `d:` → `a:` 로 바뀌어
    //      옛 표식을 못 찾기 때문이다. 🔢 비로그인으로 다섯 받고 로그인하면 보너스 5 → 10.
    //      (무한은 아니다 — 통이 둘뿐이라 최대 두 벌. 그래도 「1회 한정」 약속이 깨진다.)
    //      2026-09-01 에 「어느 것을 받았나」를 붙이다 드러났다.
    const 통들 = 로그인 ? [통, `d:${uid}`] : [통]

    let 웰컴상한 = 로그인 ? LIMITS.WELCOME_ACCT : LIMITS.WELCOME_ANON
    let 쓴수 = 0
    let 보너스 = 0
    let 받은행동 = []            // 다섯 중 «어느 것»을 받았나 — 화면이 그 줄에 줄을 긋는다(창업자 2026-09-01)
    let 옛표식 = null            // 옛 키 `w:<uid>` 의 값 — 있으면 「이 판 전부터 쓰던 사람」
    if (kv) {
      // ⭐⭐ 표식을 «그대로» 읽는다 — 「받은 목록」을 따로 한 키에 캐시해 두지 않는다.
      //    캐시는 표식과 어긋날 수 있고, 어긋나면 **둘 중 하나는 반드시 틀린 값**이 된다.
      //    🔢 읽는 수 = 다섯(비로그인) / 열(로그인). 한 번에 병렬이라 왕복은 그대로다.
      const 표식키 = []
      for (const t of 통들) for (const 행동 of LIMITS.EARN_ACTIONS) 표식키.push(`earn:${t}:${행동}`)
      const [rawWu, rawBo, 옛남음, ...표식값] = await Promise.all([
        kv.get(`wu:${통}`), kv.get(`bo:${통}`), kv.get(`w:${uid}`),
        ...표식키.map((k) => kv.get(k)),
      ])
      받은행동 = LIMITS.EARN_ACTIONS.filter((행동, i) =>
        통들.some((_, t) => 표식값[t * LIMITS.EARN_ACTIONS.length + i] !== null))
      보너스 = rawBo === null ? 0 : (parseInt(rawBo, 10) || 0)
      옛표식 = 옛남음
      if (rawWu !== null) {
        쓴수 = parseInt(rawWu, 10) || 0
      } else if (옛남음 !== null) {
        // 🔁 옛 판에서 갈아타기 — 옛 키 `w:<uid>` 엔 «남은 수»가 들어 있다.
        //   ⛔ **한 개도 줄면 안 된다**(창업자 절대 규칙 「한 번 준 것은 빼앗지 않는다」).
        쓴수 = Math.max(0, LIMITS.WELCOME_ACCT - (parseInt(옛남음, 10) || 0))
      }
      // ⭐⭐ **이 판 «전»에 열쇠를 써 본 사람은 상한 30 을 그대로 지킨다.**
      //    안 그러면 「남은 25」이던 사람이 상한 10 에 걸려 **남은 5** 가 된다 = 뺏는 것이다.
      //    ⛔ 옛 키 `w:` 는 이 판부터 «더는 쓰지 않으므로» 그 사람 집합은 더 늘지 않는다(닫힌 집합).
      if (옛남음 !== null) 웰컴상한 = LIMITS.WELCOME_ACCT
      // 🔗 로그인했으면 «기기 통»과 큰 쪽으로 맞춘다 — 폰·패드를 갈아가며 안 쓴 척 못 하게.
      if (로그인) {
        const [기기Wu, 기기Bo] = await Promise.all([kv.get(`wu:d:${uid}`), kv.get(`bo:d:${uid}`)])
        if (기기Wu !== null) 쓴수 = Math.max(쓴수, parseInt(기기Wu, 10) || 0)
        if (기기Bo !== null) 보너스 = Math.max(보너스, parseInt(기기Bo, 10) || 0)
      }
    }
    const welcomeLeft = Math.max(0, 웰컴상한 + 보너스 - 쓴수)

    // ── 🔎🔎 «물어보기»만 — 아무것도 주지도 깎지도 않는다 ────────────────
    //   📮 창업자 2026-09-01 = 워커를 붙였는데도 줄이 안 그어졌다(캡처 19:11).
    //   ⛔⛔ 원인 = **앱이 서버 답을 「열쇠를 쓸 때」와 「행동할 때」만 받았다.**
    //      화면을 열며 「내 상태가 뭐예요」를 물어볼 길이 «없었다» → 폰에 저장된 옛 답을 그린다.
    //      📌 서버를 고쳐도 **묻지 않으면 안 바뀐다.** 「서버가 준다」와 「앱이 받는다」는 다른 말이다.
    //   ⛔ 이 길로 열쇠를 «주지 않는다** — 행동 열쇠는 그 행동을 해야 받는 것이다.
    //      earn 길로 대신 쓰면(멱등이라 답은 같다) **안 한 사람에게도 줘 버린다.** 그래서 길을 따로 냈다.
    //   ⛔ Vision 을 안 부른다 → 전역 통(`d:`·`m:`)·막힘(`q:`)을 **하나도 안 건드린다.**
    if (body.조회) {
      return json({
        ok: true,
        left: {
          welcome: welcomeLeft, month: LIMITS.PER_USER_MONTHLY,
          cap: 웰컴상한 + 보너스, bonus: 보너스,
          earned: 받은행동,
          anon: LIMITS.WELCOME_ANON, acct: LIMITS.WELCOME_ACCT,
          monthly: LIMITS.PER_USER_MONTHLY, signed: 로그인,
        },
      }, 200, cors)
    }

    // ── 🎁🎁 행동으로 받는 열쇠 (창업자 확정 2026-08-31) ───────────────
    //   📮 *"4개 왜냐면 우리 기능을 하나씩 써봤으면 좋겠어서"* · *"다 1회한정으로"*
    //   ⭐ 이건 「열쇠를 주는 일」이 아니라 **「앱을 안내하는 일」**이다.
    //
    //   ⛔⛔ **여기가 사진 검사보다 «앞»이어야 한다** — 이 요청엔 사진이 없다.
    //   ⛔ **멱등(idempotent)** = 같은 행동을 몇 번 보내도 «한 번만» 준다.
    //      ⭐ 그래야 앱이 «못 보낸 것을 나중에 다시 보내도» 안전하다(오프라인 대비).
    //   ⛔ **Vision 을 안 부른다 → 전역 통(`d:`·`m:`)을 «안» 올린다.** 실제로 나간 양이 아니니까.
    //   ⛔ 「진짜 일기를 썼나」는 서버가 확인할 길이 없다 — **상한(다섯 × 1개)이 그 자리를 막는다.**
    if (body.earn !== undefined) {
      const 행동 = String(body.earn || '')
      if (!LIMITS.EARN_ACTIONS.includes(행동)) return json({ error: 'bad_earn' }, 400, cors)
      if (!kv) return json({ error: 'no_kv' }, 500, cors)
      // ⭐⭐ 「이미 받았나」는 위에서 «통들 전부»를 훑어 만든 `받은행동` 이 정한다.
      //    ⛔ `earn:${통}:${행동}` «하나»만 보면 로그인하는 순간 또 준다(위 통들 주석 참조).
      let 준것 = 0
      if (!받은행동.includes(행동)) {
        준것 = 1
        보너스 += 1
        받은행동 = 받은행동.concat([행동])
        await Promise.all([
          // ⛔ 표식엔 만료를 안 준다 — **평생 1회**라 영원히 남아야 한다.
          // 🔗 로그인 중이면 «두 통 모두»에 찍는다 — 로그아웃해서 또 받지 못하게.
          ...통들.map((t) => kv.put(`earn:${t}:${행동}`, '1')),
          kv.put(`bo:${통}`, String(보너스), { expirationTtl: 60 * 60 * 24 * 365 }),
          // 🔗 로그인 중이면 기기 통에도 같이 — 로그아웃해도 숫자가 안 헛돈다
          ...(로그인 ? [kv.put(`bo:d:${uid}`, String(보너스), { expirationTtl: 60 * 60 * 24 * 365 })] : []),
        ])
      }
      const 남음 = Math.max(0, 웰컴상한 + 보너스 - 쓴수)
      return json({
        ok: true,
        준것,                                   // 1 = 방금 받았다 · 0 = 이미 받았던 행동이다
        left: {
          welcome: 남음, month: LIMITS.PER_USER_MONTHLY,
          cap: 웰컴상한 + 보너스, bonus: 보너스,
          earned: 받은행동,                     // 다섯 중 «어느 것»을 받았나(화면이 줄을 긋는다)
          anon: LIMITS.WELCOME_ANON, acct: LIMITS.WELCOME_ACCT,
          monthly: LIMITS.PER_USER_MONTHLY, signed: 로그인,
        },
      }, 200, cors)
    }

    // ⑤-c 사진 크기 제한 — ⛔행동 열쇠 길을 지난 «뒤»에 본다(그 길엔 사진이 없다)
    const b64 = String(body.image || '').replace(/^data:image\/\w+;base64,/, '')
    if (!b64 || b64.length > MAX_B64) return json({ error: 'bad_image' }, 400, cors)

    // 🔢 **사진 «한 장마다» 열쇠 1개** (창업자 최종 확정 2026-08-13 밤)
    //   ⛔ 앱이 아직 `body.batch` 를 실어 보내지만 **여기서 안 본다** — 무시한다.
    //      (앱 쪽을 안 건드리는 게 맞다. 나중에 「묶음 1장」으로 되돌릴 때 앱까지 다시 손댈 일이 없다)
    //   🔙 묶음 코드를 되살리려면 → 파일 맨 위 「되살리는 법」

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
      if (!founder && welcomeLeft <= 0 && userC >= LIMITS.PER_USER_MONTHLY) {
        // 🚧🚧 **[2026-09-01] 「막힘」을 센다 — 유료를 «언제» 켤지 판정하는 숫자다.**
        //   ⭐⭐ 「유저 몇 명」은 잘못된 잣대다 — 100명이어도 아무도 무료 한도를 안 넘으면 팔 게 없고,
        //      30명인데 다섯이 매달 넘으면 그게 시장이다.
        //      **「더 쓰고 싶은데 막힌 횟수」가 곧 「돈 낼 이유가 생긴 사람」의 직접 증거다.**
        //   ⛔ 그 전엔 막을 때 «아무것도 안 남겨서» 이 숫자가 존재하지 않았다.
        //   ⛔ **전역 숫자 하나뿐이다** — 누가 막혔는지는 안 센다(그건 개인정보다 · worker.js:112 취지 그대로).
        //   ⛔ 전역 통(`d:`·`m:`)은 «안» 올린다 — Vision 을 안 불렀으니 실제로 나간 양이 아니다.
        await Promise.all([
          inc(kv, `q:${ym}`, 60 * 60 * 24 * 40),
          // ⏳ 막힌 사람의 「쓴 수」를 같은 값으로 다시 써서 만료를 민다(🕳1 — 1년마다 리필되던 구멍).
          //    ⭐ 안 그러면 «계속 쓰려다 계속 막히는 사람»의 기록만 조용히 만료돼 웰컴이 되살아난다.
          kv.put(`wu:${통}`, String(쓴수), { expirationTtl: 60 * 60 * 24 * 365 }),
        ])
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
        // 👤👤 **[창업자 지시 2026-09-01] 창업자 몫을 «따로» 센다.**
        //   📮 *"나와 유저들을 분리해서 얼마나 어떻게 사용하는지를 볼 수 있어야 정확한 판단이돼."*
        //   ⭐ 새로 «모으는» 정보가 0이다 — 열쇠(FOUNDER_SECRET)로 이미 갈라 알고 있다(위 `founder`).
        //      칸을 하나 더 셀 뿐이라 Play 데이터 보안 신고를 안 건드린다.
        //   ⛔ 전체(`d:`·`m:`)는 «그대로» 둔다 — 상한이 그 값을 보므로 잣대를 흔들면 안 된다.
        //   ⛔ 유저 개인별은 안 본다(`u:` 는 한도용이지 «보려고» 만든 게 아니다 — 위 주석 참조).
        ...(founder ? [
          inc(kv, `df:${ymd}`, 60 * 60 * 26),
          inc(kv, `mf:${ym}`, 60 * 60 * 24 * 40),
        ] : []),
        // ⭐ 웰컴을 쓰는 동안에도 «월 카운터를 같이» 올린다 —
        //    그래야 웰컴 20장을 다 쓴 순간 월 카운터가 5를 넘어 「그 달은 끝」이 된다.
        //    (창업자 확정: *"웰컴20장 다쓰면 무료5장은 소진한거니까 기본인식으로"*)
        // 🔢 유저 몫 — **사진 한 장마다** 깎는다(창업자 최종 확정 2026-08-13 밤)
        inc(kv, `u:${uid}:${ym}`, 60 * 60 * 24 * 40),
        // 🎁 웰컴 차감 = 「쓴 수」를 하나 올린다. ⚠️만료 «1년»(달이 바뀌어도 남아야 한다 · 창업자 Ⓐ)
        //   ⭐ **웰컴이 남아 있을 때만 올린다** — 다 쓴 뒤의 「월 5장」은 여기서 안 센다.
        //      안 그러면 나중에 로그인해서 상한이 30 이 될 때 월 몫까지 웰컴에서 깎인 셈이 된다.
        //   🔗 로그인 중이면 **계정 통과 기기 통에 «둘 다»** 쓴다 — 로그아웃해도 숫자가 안 헛돈다(🕳9·🕳10).
        ...(welcomeLeft > 0
          ? [
            kv.put(`wu:${통}`, String(쓴수 + 1), { expirationTtl: 60 * 60 * 24 * 365 }),
            ...(로그인 ? [kv.put(`wu:d:${uid}`, String(쓴수 + 1), { expirationTtl: 60 * 60 * 24 * 365 })] : []),
            // 🔁 옛 표식은 «같은 값으로» 다시 써서 살려 둔다 — 이게 「상한 30 을 지킬 사람」의 표식이다.
            //    ⚠️ 1년 넘게 아예 안 쓰면 이 표식과 쓴 수가 «같이» 사라진다 → 그때는 새 사람처럼 10 부터.
            //       둘이 같이 사라지므로 «남은 수가 줄어드는» 일은 없다(손해가 아니다).
            ...(옛표식 !== null ? [kv.put(`w:${uid}`, 옛표식, { expirationTtl: 60 * 60 * 24 * 365 })] : []),
          ]
          : []),
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
    const leftWelcome = Math.max(0, welcomeLeft - 1)
    let leftMonth = LIMITS.PER_USER_MONTHLY           // 웰컴을 쓰는 동안엔 월 몫이 아직 안 줄었다
    if (kv && leftWelcome <= 0) {
      leftMonth = Math.max(0, LIMITS.PER_USER_MONTHLY - (await num(kv, `u:${uid}:${ym}`)))
    }
    // 🔢🔢 **상한을 «같이» 실어 보낸다** — 앱이 숫자를 따로 안 갖게(🕳7).
    //   ⛔ 그 전엔 앱(`src/ocr.js`)과 워커가 «각자» 30 을 적어 두고 손으로 맞췄다.
    //      10/30 이 되면서 어긋날 자리가 두 배가 됐다 — 서버가 알려주면 어긋날 수가 없다.
    //   ⭐ `anon`·`acct` 도 준다 — 앱이 「로그인하면 몇 개 더 받나」를 스스로 계산해 문구를 만든다
    //      (문구에 20 을 «글자로» 박으면 숫자를 바꿀 때 문구만 낡는다).
    return json({
      text,
      left: {
        welcome: leftWelcome,
        month: leftMonth,
        cap: 웰컴상한 + 보너스,   // 지금 이 사람의 웰컴 상한(＋행동으로 받은 것)
        bonus: 보너스,
        earned: 받은행동,         // 다섯 중 «어느 것»을 받았나(화면이 그 줄에 줄을 긋는다)
        anon: LIMITS.WELCOME_ANON,
        acct: LIMITS.WELCOME_ACCT,
        monthly: LIMITS.PER_USER_MONTHLY,
        signed: 로그인,
      },
    }, 200, cors)
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
