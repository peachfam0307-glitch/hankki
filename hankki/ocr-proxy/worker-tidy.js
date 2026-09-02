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
//   6. 📊 **[2026-09-01 신설] Settings → Bindings → KV 네임스페이스 · 변수 이름 `TIDY_KV`**
//      📮 창업자 = *"나와 유저들을 분리해서 얼마나 어떻게 사용하는지를 볼 수 있어야 정확한 판단이돼."*
//      ⭐ 이걸 붙여야 `?quota=1` 이 **「전체 / 창업자 / 유저 / 사진까지 본 것」**을 갈라 보여준다.
//      ⛔ 안 붙여도 «앱은 그대로 돈다» — 세는 것만 못 한다(정직하게 「셀 수가 없어요」라고 답한다).
//      ⛔ D1 은 여전히 필요 없다.
//   ⚠️ 위 3번(`AI` 바인딩)이 **사진까지 본다** — 2026-09-01 부터 이 워커는 ⓒ(사진＋글자)를 쓴다.
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
  // 👁 [2026-09-01] 사진(ⓒ)이 붙는다. 창업자 실측 캡처가 **485KB** 였고 base64 는 약 4/3 로 부푼다.
  //   ⛔ 너무 좁게 잡으면 «큰 캡처만 조용히 ⓒ가 안 되는» 사고가 난다 → 넉넉히 3MB(base64 글자 수).
  MAX_IMAGE: 3_000_000,
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
5. ingredients 는 반드시 "이름 분량" 꼴로 적어라. 손질 상태만 빼고 분량은 «그대로» 남겨라.
   ⛔ 분량을 지우지 마라. (예: "무 1/3개"→"무 1/3개" ⛔"무" 아님 · "물 200ml"→"물 200ml" ⛔"물" 아님)
   ⛔ "조금"·"약간"도 분량이다. 지우지 마라. (예: "생강즙 조금"→"생강즙 조금")
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

    // 📊📊 **[창업자 확정 2026-08-31] 「오늘 몇 편 / 200」을 볼 수 있게 한다** — *"tidy도 붙여줘"*
    //   ⭐ OCR 워커에 붙인 것과 **같은 모양·같은 열쇠**다(두 워커가 다르면 창업자가 두 번 배운다).
    //   ⛔ 그 전엔 이 통도 아무도 못 봤다 — 200 이 차면 AI 다듬기가 조용히 멎고
    //      유저는 「기본 정리예요」만 본다. 우리는 그게 «통이 찬 것»인지 «AI 가 죽은 것»인지 몰랐다.
    //   🔒 운영자 열쇠(FOUNDER_SECRET)가 맞아야 한다. 폰 브라우저로 열 수 있게 **GET ＋ `?key=`** 도 받는다.
    //   ⛔ AI 를 «안» 부른다 — 세는 값만 읽는다.
    //   ⚠️ KV(`TIDY_KV`)가 안 붙어 있으면 셀 수가 없다 → 그때는 «모른다»고 정직하게 답한다(0 이라고 하지 않는다).
    //   📖 쓰는 법 = `https://<이 워커 주소>/?quota=1&key=<FOUNDER_SECRET>`
    //      ⛔ 그 주소를 채팅·저장소에 적지 않는다(열쇠가 딸려 간다).
    if (new URL(request.url).searchParams.get('quota') === '1') {
      if (!env.FOUNDER_SECRET) return json({ error: 'no_secret' }, 500, cors)
      const 준열쇠 = request.headers.get('x-hankki-founder') || new URL(request.url).searchParams.get('key') || ''
      if (준열쇠 !== env.FOUNDER_SECRET) return json({ error: 'unauthorized' }, 401, cors)
      const kvq = env.TIDY_KV
      const 날 = kstDay(new Date())   // ⭐ 세는 쪽과 «같은 잣대»(KST) — 여긴 카운터도 KST 다
      if (!kvq) return json({ 날, 오늘: null, 왜: 'KV 가 안 붙어 있어 셀 수가 없어요', 상한: LIMITS.DAILY_GLOBAL }, 200, cors)
      // 👤👤 **[창업자 지시 2026-09-01] 창업자 몫과 유저 몫을 «갈라» 본다.**
      //   📮 *"나와 유저들을 분리해서 얼마나 어떻게 사용하는지를 볼 수 있어야 정확한 판단이돼."*
      //   ⭐ 새로 «모으는» 정보는 0이다 — 이 워커는 어차피 열쇠로 창업자를 알아본다(아래 `founder`).
      //      칸을 하나 더 셀 뿐이라 Play 데이터 보안 신고를 안 건드린다.
      //   ⛔ 유저 «개인별»은 세지 않는다 — 그건 곧 개인정보가 된다(OCR 워커와 같은 원칙).
      const [오늘, 오늘창] = await Promise.all([num(kvq, `td:${날}`), num(kvq, `tdf:${날}`)])
      const 눈오늘 = await num(kvq, `tv:${날}`)
      return json({
        날,
        오늘: {
          쓴것: 오늘, 상한: LIMITS.DAILY_GLOBAL, 남음: Math.max(0, LIMITS.DAILY_GLOBAL - 오늘),
          퍼센트: Math.round((오늘 / LIMITS.DAILY_GLOBAL) * 100),
          // ⭐ 여기가 창업자가 물은 그 칸이다
          창업자: 오늘창,
          유저: Math.max(0, 오늘 - 오늘창),
        },
        // 👁 그중 «사진까지 본」 편수(ⓒ). 나머지는 글자만 본 것이다.
        눈: { 사진까지본것: 눈오늘, 글자만: Math.max(0, 오늘 - 눈오늘) },
      }, 200, cors)
    }

    // 👁👁👁 **[2026-09-01 · 재는 판] `?vision=1` — 시험용 길이다. ⛔앱은 이 길을 안 쓴다.**
    //
    //   📮 창업자 = *"해먹으리랑 레시피브로는 정확하던데 왜 우리는 ai를 넣어도 부정확할까..ㅠ"*
    //   ⭐⭐ 천장을 찾았다 — **우리 AI 는 사진을 «못 본다».** 깨진 글자만 받고 뜻을 짐작한다.
    //      그래서 프롬프트로 「오독을 고쳐라」를 시켰더니 멀쩡한 말까지 바꿨다
    //      (「끼얹어가며」→「끓여가며」 · 「찐득해질」→「걸릴」). **그날 바로 되돌렸다.**
    //   📌 그러니 다음은 «만드는 일»이 아니라 **«재는 일»**이다(규칙 15 — 숫자를 보고 움직인다).
    //
    //   ⛔⛔ **본 경로(`POST /`)는 한 글자도 안 건드렸다** — 이 길이 통째로 실패해도 앱은 그대로 돈다.
    //   🔒 운영자 열쇠(`FOUNDER_SECRET`)가 있어야 한다. ⛔그 주소를 채팅·저장소에 적지 않는다.
    //
    //   받는 것 = { image: "data:image/...;base64,…", text?: "Vision 이 읽은 글자", model?, budget? }
    //   돌려주는 것 = 모델 답 ＋ **응답의 `usage` 그대로**(⭐추정이 아니라 진짜 토큰 수) ＋ 걸린 시간
    //                 ＋ **어느 「보내는 모양」이 통했나**
    //
    //   ⛔⛔ **모르는 것을 «모른다»고 적어 둔다** — Cloudflare 가 이 모델에 사진을 받는 «요청 모양»을
    //      확인하지 못했다(문서를 열 수 없는 자리에서 만들었다).
    //      ✅ 그래서 짐작해서 하나만 넣지 않고 **흔한 네 모양을 차례로 시도하고 통한 것을 알려준다.**
    //      ⭐ 시행착오는 창업자가 아니라 코드가 한다(규칙 8) — **복붙은 한 번으로 끝난다.**
    if (new URL(request.url).searchParams.get('vision') === '1') {
      if (!env.FOUNDER_SECRET) return json({ error: 'no_secret' }, 500, cors)
      const 눈열쇠 = request.headers.get('x-hankki-founder') || new URL(request.url).searchParams.get('key') || ''
      if (눈열쇠 !== env.FOUNDER_SECRET) return json({ error: 'unauthorized' }, 401, cors)
      if (request.method !== 'POST') {
        return json({ error: 'post_only', 쓰는법: 'POST { image, text?, model?, budget? }' }, 405, cors)
      }
      if (!env.AI) return json({ error: 'no_ai_binding' }, 500, cors)
      let 눈몸
      try { 눈몸 = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }
      return await 눈시험(env, 눈몸, cors)
    }

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

    // 👁👁 **[창업자 판정 2026-09-01] ⓒ — 사진을 «같이» 준다.**
    //   📮 창업자 = *"c로 하되 …"* (삼치 실물 대조에서 ⓒ가 ④「멀쩡한 말 안 건드리기」를 유일하게 지켰다)
    //   ⛔⛔ **사진은 «덤»이다 — 없으면 지금과 «한 글자도 다르지 않게» 돈다.**
    //      사진이 커서 못 받는 경우에도 «막지 않고» 글자만으로 간다(아래에서 그냥 비운다).
    //      📌 새 기능이 옛 기능을 죽이면 안 된다 — 그게 v11.00 `noBuy` 사고의 모양이었다.
    const image = (() => {
      const v = String(body.image || '')
      if (!v) return ''
      if (!v.startsWith('data:image/')) return ''          // ⛔모르는 모양은 안 보낸다
      if (v.length > LIMITS.MAX_IMAGE) {
        console.log('IMAGE_TOO_BIG', v.length)             // ⭐조용히 버리지 않는다 — 로그로 남긴다
        return ''
      }
      return v
    })()

    if (!env.AI) return json({ error: 'no_ai_binding' }, 500, cors)

    // ⏱⏱⏱ **[2026-09-02 · 창업자 「기본 정리예요(timeout)」] 앱이 준 «예산» 안에서만 모델을 부른다.**
    //
    // 📮 창업자 = *"불안정하다.. ai가 읽을때가 있고 못읽을때가 있고"* → 폰 실물 이유 = `timeout`
    // 📮 그리고 못 박았다 = *"**땜빵하는 설계는 절대금지**"* → 그래서 앱 대기를 늘리는 길을 접었다.
    //
    // ⛔⛔ **여태 이 워커는 「시간이 무한하다」고 여기고 돌았다.**
    //    아래 모델 차례 주석에 내가 이렇게 적어 놨었다 —
    //    *"지금은 기다리는 사람이 0명이라 재시도가 공짜다."*
    //    ⭐ **그 전제가 반쪽이었다.** 유저는 안 기다리는 게 맞는데 **앱은 60초를 기다린다.**
    //       앱이 끊은 «뒤»에 부른 모델은 **아무도 못 받는 답에 뉴런을 태운다** —
    //       전역 하루 통이 우리 돈이라 그대로 손해다(절대원칙 32).
    //
    // ✅ 그래서 앱이 `budgetMs`(내가 기다릴 수 있는 시간)를 실어 보내고,
    //    여기서 **다음 모델을 부르기 «전»에 남은 예산을 본다.** 모자라면 안 부른다.
    // ⛔ **못 받으면 무한대로 둔다** — 옛 앱과 섞여도 예전과 «한 글자도 다르지 않게» 돈다.
    //    📌 새 값이 옛 동작을 죽이면 안 된다(v11.00 `noBuy` 사고의 모양).
    // 🔢 여유 3초 = 답을 만들어 돌려보내는 시간. 이건 «잰 값이 아니라 안전분»이라고 밝혀 둔다.
    const 예산 = Number(body.budgetMs) > 0 ? Number(body.budgetMs) : Infinity
    const 예산여유 = 3000

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
    // 👁 **차례 = 사진이 있으면 «눈 모델»을 맨 앞에 세운다.**
    //   ⭐⭐ 그 뒤에 «지금 쓰던 글자 전용 모델»이 그대로 남는다 —
    //      눈이 실패해도 **오늘까지와 똑같은 결과**로 떨어진다. ⛔ⓒ가 앱을 나쁘게 만들 길이 없다.
    const 차례 = [
      ...(image ? [{ model: VISION_MODEL, 눈: true }] : []),
      ...모델차례(env).map((m) => ({ model: m, 눈: false })),
    ]
    const 모델들 = 차례.map((c) => c.model)
    const 시작전체 = Date.now()
    let 답 = null
    let 마지막오류 = ''

    let 예산끊김 = false
    // 📢📢 **[2026-09-02 · 창업자 「매번 저걸 켜둬야해??」] 「어디서 멈췄나」를 «응답»에 실어 보낸다.**
    //   ⛔ 그 전엔 이 정보가 **로그에만** 있었다 → 창업자가 «로그 스트림을 켜 놓고 기다려야» 알 수 있었다.
    //      그건 규칙 8 위반이다(반복 노가다는 우리가 한다). 창업자가 그 자리에서 짚었다.
    //   ✅ 앱이 이 값을 받아 **운영자 토스트 꼬리**에 붙인다 → 로그를 아예 안 열어도 된다.
    //   ⛔ 유저에겐 안 보인다 — `tidyTail()` 이 운영자일 때만 꼬리를 붙인다.
    let 멈춘모델 = ''
    for (const { model, 눈 } of 차례) {
      멈춘모델 = model
      // ⏱ **부르기 «전»에 남은 예산을 본다** — 모자라면 안 부른다(위 「예산」 절).
      //   ⛔ 첫 모델은 «무조건» 부른다 — 안 그러면 예산이 빠듯할 때 한 번도 안 부르고 끝난다.
      //      그건 「아껴서 아무것도 못 하는」 꼴이라 유저에게 제일 나쁘다.
      const 쓴시간 = Date.now() - 시작전체
      if (쓴시간 > 0 && 쓴시간 + 예산여유 >= 예산) {
        예산끊김 = true
        console.log('BUDGET_OUT', model, `쓴 ${쓴시간}ms / 예산 ${예산}ms`, '(안 부르고 멈춘다)')
        break
      }
      const 시작 = Date.now()
      let out
      try {
        const r = await env.AI.run(model, 눈 ? {
          // 👁 ⛔ **모양은 ①(OpenAI 꼴 image_url) «하나»뿐이다** — 2026-09-01 에 넷을 다 재서 닫았다.
          //   ②바이트 꼴 = 사진을 안 본다 · ③input_image = 5006 스키마 오류 · ④바깥 image = 모델이 «못 받았다»고 말했다
          //   ⛔재론 금지.
          messages: [{ role: 'user', content: [
            { type: 'text', text: 눈지시_둘다 + '\n\n--- 기계가 읽은 글자 ---\n' + text },
            { type: 'image_url', image_url: { url: image } },
          ] }],
          temperature: 0.2,
          max_tokens: VISION_MAX_TOKENS,
        } : {
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
        await 통세기(kv, ymd, founder, 눈)
        continue
      }
      await 통세기(kv, ymd, founder, 눈)   // ⛔ 실패해도 뉴런은 나갔다 — 성공만 세면 통이 조용히 샌다

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
      // ⏱ **왜 못 했는지를 «갈라서» 돌려준다** — 앱이 이걸 보고 「나중에 한 번 더」를 정한다.
      //   ⛔ 전부 `ai_failed` 로 뭉치면 앱은 「모델이 나쁜 것」과 「시간이 모자란 것」을 못 가른다.
      //      처방이 다르다 — 앞은 프롬프트·모델 문제고, 뒤는 다시 걸면 되는 것이다.
      // 📢 `model`·`ms` = 「어디서 몇 초 쓰고 멈췄나」. 앱이 운영자 토스트에 그대로 붙인다(위 「멈춘모델」 절).
      const 어디서 = { model: 멈춘모델, ms: Date.now() - 시작전체 }
      if (예산끊김) return json({ error: 'budget_out', why: 마지막오류 || '', ...어디서 }, 502, cors)
      return json({ error: 마지막오류 ? 'ai_failed' : 'bad_ai_output', why: 마지막오류 || '', ...어디서 }, 502, cors)
    }

    if (kv) await inc(kv, `ti:${ip}:${minute}`, 120)

    return json(답, 200, cors)
  },
}

// ═══════════════════════════════════════════════════════════════
// 👁 눈 시험 — 사진을 «직접» 주고 재는 길 (2026-09-01)
// ⛔ 여기 아래는 전부 «시험용»이다. 본 경로는 이 함수를 부르지 않는다.
// ═══════════════════════════════════════════════════════════════

// 후보 모델 — 공식 문구에 `screen and UI understanding` ＋ `OCR (including multilingual)` 가 있다.
// ⛔ 죽은 후보 재론 금지 = Gemma 3 12B(Deprecated) · Llama 4 Scout · Llama 3.2 11B Vision(영어 전용)
const VISION_MODEL = '@cf/google/gemma-4-26b-a4b-it'

// ⏳ 눈 시험 전용 답 길이 — 본 경로(4000)보다 넉넉하다.
//   ⛔⛔ [2026-09-01 실물] ⓒ(사진＋글자)가 `finish_reason: "length"` 로 잘렸다.
//      모델이 «내 지시문을 분석»하느라 4,000 토큰을 다 쓰고 레시피를 한 글자도 못 냈다.
//      📌 2026-08-29 `THINKING_ONLY`(glm 이 30초 생각만 하다 빈손)와 **같은 모양**이다 — 또 밟았다.
const VISION_MAX_TOKENS = 8000

// ⭐⭐⭐ [2026-09-01] **맨 앞에 「생각하지 마라」를 박는다** — 이게 위 사고의 직접 처방이다.
//   ⛔ 규칙 목록 «뒤»에 두면 늦다. 모델은 앞부터 읽고 거기서 「분석 모드」를 켠다.
const 즉답못박기 = `⛔ 생각·분석·계획을 글로 쓰지 마라. 설명하지 마라.
⛔ 아래 JSON «한 덩어리»만 즉시 출력해라. 다른 글자는 한 자도 쓰지 마라.

`

// ⭐⭐ 지시문은 **본 경로와 «같은 규칙»을 쓴다** — 안 그러면 ⓐ와 ⓑⓒ 를 나란히 못 놓는다.
//   (규칙 7개는 창업자 실물 판정을 거친 것이다 — 여기서 새로 쓰면 그 판정이 날아간다)
const 규칙본문 = PROMPT.slice(PROMPT.indexOf('규칙:'))

// ⓑ 사진만 준다 — ✅2026-09-01 실물 18.5초 · 62 뉴런 · 볼 것 넷 중 셋 통과
const 눈지시_사진만 = 즉답못박기 + `너는 요리 레시피 정리기다. 아래 사진은 인스타그램 요리 레시피 화면 캡처다.
사진의 글자를 «직접 읽어» 정리해라. 화면 글자(통신사·시계·계정명·좋아요 수·댓글)는 버려라.

` + 규칙본문.replace('--- 원문 ---', '--- 사진 ---')

// ⓒ 사진 ＋ Vision 이 읽은 글자를 «같이» 준다
//   ⛔ 「오독을 고쳐라」를 넓게 시키면 멀쩡한 말까지 바꾼다(2026-08-31 사고) → «사진과 다를 때만»으로 못 박는다.
//   ⛔⛔ 여기 설명을 길게 쓰면 모델이 그걸 «분석»한다(2026-09-01 사고) → **두 줄로 줄였다.**
const 눈지시_둘다 = 즉답못박기 + `너는 요리 레시피 정리기다. 사진과, 그 사진을 기계가 읽은 글자를 같이 준다.
⛔ 글자가 «사진과 다를 때만» 고쳐라. 사진으로 확인이 안 되면 어색해도 그대로 둬라.

` + 규칙본문
// ⛔ [2026-09-01] 바이트로 보내는 모양이 죽어서 이 함수도 쓸 데가 없어졌다 — 아래 「죽은 모양 셋」 참조.
async function 눈시험(env, 몸, cors) {
  const image = String(몸.image || '')
  if (!image) return json({ error: 'no_image' }, 400, cors)
  const text = String(몸.text || '')
  const model = String(몸.model || '').trim() || VISION_MODEL
  const budget = 몸.budget ? Number(몸.budget) : null
  const 지시 = text ? (눈지시_둘다 + '\n\n--- 기계가 읽은 글자 ---\n' + text) : 눈지시_사진만

  // 🧪🧪 **[2026-09-01 실물로 닫혔다] 사진이 진짜로 가는 모양은 «하나»뿐이다.**
  //   ⛔⛔ 죽은 셋 — ⛔재론 금지(창업자 폰에서 한 번에 다 재봤다)
  //     ② Cloudflare 꼴 `image` 바이트 → 사진을 «안 본다». 응답이 `text` 로 와서
  //        채팅이 아니라 «이어쓰기»로 처리됐다(「퓨삼치…」 뒤에 "de de de…" 헛소리)
  //     ③ `input_image` 꼴 → 0.03초 만에 **5006 스키마 오류**. 이 모델이 안 받는다
  //     ④ `messages` ＋ 바깥 `image` → 모델이 «직접» 말했다: *"One image (not provided in text…)"*
  //   ⭐ 넷을 다 돌면 **74초 ＋ 뉴런 네 배**다. 하나만 남겨 시간도 값도 1/4로 줄인다.
  //   ⚠️ `budget` 은 «이름을 모른다» — 주면 그대로 실어 보내고, 안 먹으면 그 사실이 드러난다.
  const 모양들 = [
    ['① OpenAI 꼴 image_url', {
      messages: [{ role: 'user', content: [
        { type: 'text', text: 지시 },
        { type: 'image_url', image_url: { url: image } },
      ] }],
      max_tokens: VISION_MAX_TOKENS, temperature: 0.2,
      ...(budget ? { budget } : {}),
    }],
  ]
  const 시도 = []
  for (const [이름, 입력] of 모양들) {
    const 시작 = Date.now()
    let r
    try {
      r = await env.AI.run(model, 입력)
    } catch (e) {
      시도.push({ 모양: 이름, 결과: '오류', 왜: String((e && e.message) || e).slice(0, 300), ms: Date.now() - 시작 })
      continue
    }
    const out = 첫값(r?.response, r?.result?.response, r?.result, r?.choices?.[0]?.message?.content, r?.output_text)
    if (!out) {
      // 🧠🧠 [2026-09-01] **「생각만 하다 길이를 다 썼다」에 이름을 붙인다.**
      //   ⛔ 그 전엔 `빈손` 안에 숨어서, 로그를 한참 읽어야 범인이 보였다.
      //      (2026-08-29 `THINKING_ONLY` 와 같은 사고인데 이름이 없어 또 못 알아봤다)
      const ch = r?.choices?.[0] || {}
      const 생각 = ch?.message?.reasoning || ch?.message?.reasoning_content || ch?.reasoning || ''
      if (ch.finish_reason === 'length') {
        시도.push({
          모양: 이름, 결과: '생각만 하다 잘림',
          왜: `답 길이 ${VISION_MAX_TOKENS} 토큰을 «생각»에 다 썼다(finish_reason=length). 생각 앞머리: ` + String(생각).slice(0, 200),
          ms: Date.now() - 시작,
        })
        continue
      }
      let 모습; try { 모습 = JSON.stringify(r) } catch { 모습 = '(못 읽음)' }
      시도.push({ 모양: 이름, 결과: '빈손', 왜: String(모습).slice(0, 400), ms: Date.now() - 시작 })
      continue
    }
    const 파싱 = pickJson(out)
    // ⭐⭐ **여기가 이 길의 값어치다** — 추정이 아니라 «워커가 돌려준 진짜 usage» 를 그대로 얹는다.
    return json({
      ok: true,
      model,
      모양: 이름,
      ms: Date.now() - 시작,
      budget: budget || null,
      갈래: text ? 'ⓒ 사진＋글자' : 'ⓑ 사진만',
      usage: r?.usage || r?.result?.usage || null,
      결과: 파싱 || null,
      원문답: 파싱 ? null : String(typeof out === 'object' ? JSON.stringify(out) : out).slice(0, 2000),
      앞선시도: 시도,
    }, 200, cors)
  }
  // ⛔ 네 모양이 다 실패하면 «무엇이 왜 실패했는지»를 전부 돌려준다 — 그래야 다음 판을 한 번에 짠다.
  return json({ ok: false, error: 'all_shapes_failed', model, 시도 }, 502, cors)
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
//   👤 [2026-09-01] 창업자 몫(`tdf:`)과 «사진까지 본」 편수(`tv:`)를 «따로» 센다.
//      ⭐ 전체(`td:`)는 그대로 둔다 — 상한이 그 값을 보므로 잣대를 흔들면 안 된다.
//      ⛔ 유저 개인별은 안 센다(그건 곧 개인정보가 된다).
async function 통세기(kv, ymd, founder, 눈) {
  if (!kv) return
  await inc(kv, `td:${ymd}`, 60 * 60 * 48)
  if (founder) await inc(kv, `tdf:${ymd}`, 60 * 60 * 48)
  if (눈) await inc(kv, `tv:${ymd}`, 60 * 60 * 48)
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
