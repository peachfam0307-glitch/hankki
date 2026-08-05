// 💳 구글 인앱결제(Google Play Billing) — TWA 에서 Digital Goods API 로 붙인다.
//
// ⭐⭐ 왜 이 길인가 (창업자 확정 2026-08-05 — *"인앱으로 하자. 배보다 배꼽이 더 크겠어"*)
//   웹 PG 아웃링크는 **가입비 33만원 ＋ 연회비 11만원 ＋ 심사 3개월**인데
//   990원 팩 하나에서 아끼는 돈이 **2.6원**이다. 33만원을 뽑으려면 12만 6천 팩을 팔아야 한다.
//   ＋ 유선전화 개통·통신판매업번호·집주소 공개·이용약관·환불정책이 전부 딸려온다.
//   전문 = `docs/결제경로-재검토-2026-08-05.md`
//
// 🔌 기술 근거 (전부 공식 문서)
//   developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
//   · TWA ＋ **Chrome 101 이상**에서 `getDigitalGoodsService('https://play.google.com/billing')`
//   · 결제창은 **Payment Request API** 로 띄운다
//     (`total` 은 형식상 필요할 뿐 «실제 금액은 Play 가 정한다» — 공식 원문: *"is not used when
//      using Google Play Billing. We can set it up with bogus details."*)
//   · ⚠️ `android/twa-manifest.json` 에 **두 줄**이 있어야 한다(지금은 없다 · 재심사 뒤에 넣는다):
//       "features": { "playBilling": { "enabled": true } }
//       "alphaDependencies": { "enabled": true }
//   · bubblewrap **1.8.2 이상** — 우리 워크플로는 `npm i -g @bubblewrap/cli`(항상 최신)라 통과
//   · Digital Asset Links — ✅ 이미 돼 있다
//
// ⛔⛔ **웹(PWA)·구버전 크롬엔 이 API 가 «아예» 없다.**
//   그래서 이 파일의 모든 함수는 없으면 **조용히 「못 함」을 돌려준다**. 앱은 그대로 돌아야 한다 —
//   결제가 안 되는 것과 앱이 깨지는 것은 다르다. (v9.48 훅 사고와 같은 원칙)
//
// 🧪 테스트 = Play Console **「설정 → 수익 창출 → 라이선스 테스트」** (창업자 캡처 2026-08-05)
//   *"라이선스 및 결제 통합을 테스트하세요"* — **신청·심사·비용 0.** 토스는 이걸 받으려고
//   3개월 심사를 통과해야 했다.

// ── 상품 ID ────────────────────────────────────────────────
// ⚠️⚠️ **Play Console 에 «똑같은 글자»로 등록해야 한다.** 한 글자만 달라도 안 붙는다.
//   등록 자리 = Play Console → 앱 → 수익 창출 → 상품 → **인앱 상품** → 상품 만들기
//
// 🔑 소모성 / 영구 — Play 는 상품에 이 표시가 없다. **`consume()` 을 부르냐로 갈린다.**
//   · `consume()` 을 부르면  → 목록에서 사라지고 **다시 살 수 있다**(＝소모성)
//   · 안 부르면              → `listPurchases()` 에 **영영 남는다**(＝영구·복원 자동)
export const SKU = {
  // 🎨 꾸미기 팩 — **영구.** ⛔consume 하지 않는다.
  //   ⭐ 그래서 폰을 바꿔도 **구글 계정만 같으면 저절로 돌아온다** = 「구매 → 복원」 완성.
  //      우리가 이메일을 받을 필요가 없다(#63 이 이 방식으로 풀린다).
  chuseok: 'deco_chuseok',
  halloween: 'deco_halloween',
  autumn: 'deco_autumn',
  xmas: 'deco_xmas',
  winter: 'deco_winter',
  // 📷 글자인식 20장 — **소모성.** 다 쓰면 또 사야 하니 `consume()` 을 부른다.
  //   ⚠️ 소모성은 구조상 **폰을 바꾸면 「남은 장수」가 안 따라온다**(구글도 안 세어준다).
  //      → 그래서 이건 꾸미기 팩보다 **나중에** 붙인다. 아래 「붙이는 순서」 참고.
  ocr20: 'ocr_pack_20',
}

// 꾸미기 팩 키(`src/data/paidPacks.js` 의 `key`) → 상품 ID
// ⚠️ 모션·효과가 쓰는 `pack` 키는 또 다르다(`chuseok2026` 처럼 연도가 붙는다 · `Stickers.jsx`).
//    세 벌이 어긋나면 「샀는데 모션이 안 열리는」 상태가 된다 → `packSkus()` 한 곳에서만 잇는다.
export const PACK_SKU = {
  chuseok: SKU.chuseok,
  halloween: SKU.halloween,
  autumn: SKU.autumn,
  xmas: SKU.xmas,
  winter: SKU.winter,
}

// 꾸미기 팩 키 → **모션·효과의 잠금 키**(`Stickers.jsx` 의 `MOTIONS[].pack` · `FX_KINDS[].pack`)
// ⛔⛔ **이름이 세 벌이라 어긋나기 쉽다** — 팩 키 `chuseok` · 상품 ID `deco_chuseok` · 잠금 키 `chuseok2026`.
//   규칙으로 못 만든다(겨울만 `winter2027` 이다) → **표로 둔다.**
//   어긋나면 「돈 냈는데 모션이 안 열리는」 상태가 된다 → `scripts/test-billing.mjs` 가 배포를 막는다.
export const PACK_UNLOCK = {
  chuseok: 'chuseok2026',
  halloween: 'halloween2026',
  autumn: 'autumn2026',
  xmas: 'xmas2026',
  winter: 'winter2027',
}

// ⭐ 붙이는 순서 (내가 정한 것 · 이유가 있다)
//   ① **꾸미기 팩 5종 먼저** — 영구라 「구매 → 복원」이 코드 없이 완성된다.
//      창업자 원칙(*"구매 → 복원이 한 흐름이 되기 전엔 실결제 스위치를 안 켠다"*)을 그냥 만족한다.
//   ② **글자인식 20장은 그다음** — 소모성이라 「남은 장수를 어디에 둘까」를 먼저 정해야 한다.
//      (지금은 기기마다 다른 임의 uid 로 세고 있다 · `src/ocr.js` `deviceId()`)

const PLAY = 'https://play.google.com/billing'

// ── 밑바닥 ────────────────────────────────────────────────
let _svc = null       // 한 번 잡으면 다시 안 잡는다
let _tried = false    // 못 잡은 것도 기억한다(매번 다시 시도하면 느려진다)

// 이 기기에서 인앱결제가 되나. ⛔던지지 않는다 — 안 되면 그냥 null.
export async function service() {
  if (_svc) return _svc
  if (_tried) return null
  _tried = true
  try {
    if (typeof window === 'undefined') return null
    if (!('getDigitalGoodsService' in window)) return null    // 웹·구버전 크롬
    _svc = await window.getDigitalGoodsService(PLAY)
    return _svc
  } catch {
    // Play 결제를 못 쓰는 상태(스토어 앱이 아니거나 계정 문제). 조용히 넘어간다.
    return null
  }
}

// 결제 버튼을 «보여줘도 되나». 안 되면 버튼 자체를 안 그린다 — ⛔죽은 버튼을 만들지 않는다.
//   (`LAB_*_URL` 이 비면 그 칸을 아예 안 그리는 것과 같은 방식)
export async function canBuy() {
  return !!(await service())
}

// ── 값 읽기 ────────────────────────────────────────────────
// 상품 정보(제목·설명·가격). ⭐가격은 **Play 가 준 값**을 그대로 쓴다 —
// 나라·환율·세금이 붙으므로 우리가 「990원」이라고 박아 쓰면 언젠가 틀린다.
export async function details(skus) {
  const s = await service()
  if (!s) return []
  try {
    const list = await s.getDetails(Array.isArray(skus) ? skus : [skus])
    return (list || []).map((it) => ({
      sku: it.itemId,
      title: it.title,
      desc: it.description,
      // 화면에 쓸 글자 — 유저 지역 표기로(1,000원 / ￦990 …)
      price: fmtPrice(it.price),
      raw: it,
    }))
  } catch {
    return []
  }
}

function fmtPrice(p) {
  if (!p || p.value == null) return ''
  try {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: p.currency,
      maximumFractionDigits: 0,   // 원화는 소수점이 없다
    }).format(p.value)
  } catch {
    return `${p.value} ${p.currency || ''}`.trim()
  }
}

// 이미 산 것들. ⭐**이게 「복원」이다** — 구글이 계정에 기억해 두므로
//   폰을 바꾸든 앱을 지웠다 깔든 여기서 그대로 돌아온다. 우리가 저장할 게 없다.
export async function purchases() {
  const s = await service()
  if (!s) return []
  try {
    const list = await s.listPurchases()
    return (list || []).map((p) => ({ sku: p.itemId, token: p.purchaseToken }))
  } catch {
    return []
  }
}

// 지금 이 사람이 가진 꾸미기 팩 키들 — `ownedPacks()` 에 그대로 물린다.
//   ⚠️ `Stickers.jsx` 의 `ownedPacks()` 는 «동기» 함수라 여기서 바로 못 쓴다.
//      앱 시작할 때 한 번 읽어 캐시에 넣고, 그 캐시를 `ownedPacks()` 가 읽게 한다.
export async function ownedPackKeys() {
  const bought = new Set((await purchases()).map((p) => p.sku))
  return Object.keys(PACK_SKU).filter((k) => bought.has(PACK_SKU[k]))
}

// ── 사기 ────────────────────────────────────────────────
// 구매. 돌려주는 값 = { ok, token?, reason? }
//   reason: 'unavailable'(이 기기에서 결제 불가) · 'cancel'(유저가 닫음) · 'fail'(그 외)
// ⛔ 예외를 밖으로 던지지 않는다 — 부르는 쪽에서 try/catch 를 빠뜨리면 화면이 통째로 죽는다.
export async function buy(sku) {
  const s = await service()
  if (!s) return { ok: false, reason: 'unavailable' }
  if (typeof PaymentRequest === 'undefined') return { ok: false, reason: 'unavailable' }

  // 공식 예시 그대로. `total` 은 형식상 필요할 뿐 실제 금액은 Play 가 정한다.
  const methods = [{ supportedMethods: PLAY, data: { sku } }]
  const detail = { total: { label: 'Total', amount: { currency: 'KRW', value: '0' } } }

  let resp = null
  try {
    resp = await new PaymentRequest(methods, detail).show()
  } catch (e) {
    // AbortError = 유저가 닫은 것. 그건 «실패»가 아니라 «안 삼»이다 — 오류 문구를 띄우지 않는다.
    return { ok: false, reason: e && e.name === 'AbortError' ? 'cancel' : 'fail' }
  }

  const token = resp && resp.details && resp.details.purchaseToken
  if (!token) {
    try { await resp.complete('fail') } catch { /* noop */ }
    return { ok: false, reason: 'fail' }
  }
  // ⚠️ 여기서 「서버 검증」을 하는 게 정석이다(Play Developer API 로 토큰 확인).
  //    ⏳ 아직 안 붙였다 — 붙이기 전엔 **폰에서 조작될 수 있다.**
  //    다만 우리 손해는 막혀 있다: OCR 은 Worker 에 **전역 월 900건 상한**이 있어
  //    크레딧이 조작돼도 «우리 돈»은 안 나간다(`ocr-proxy/worker.js`). 꾸미기 팩은 원가 0.
  //    📌 그래도 매출이 붙으면 검증을 넣는다 — 그때까진 이 주석이 빚 문서다.
  try { await resp.complete('success') } catch { /* noop */ }
  return { ok: true, token }
}

// 소모성 상품 소진 — ⛔**꾸미기 팩엔 절대 부르지 말 것.** 부르면 복원이 깨진다.
export async function consume(token) {
  const s = await service()
  if (!s || !token) return false
  try {
    await s.consume(token)
    return true
  } catch {
    return false
  }
}

// 테스트에서만 쓴다 — 캐시를 비워 다시 잡게 한다.
export function _reset() {
  _svc = null
  _tried = false
}
