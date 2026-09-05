// 외부 링크를 '정식 새 탭'으로 연다.
// 주의: window.open(url, '_blank', 'noopener,noreferrer') 처럼 features(3번째 인자)에
// 문자열을 주면 브라우저가 '팝업 창'으로 열어 모바일에서 좁게/세로로 깨져 보이고,
// App Link(쿠팡·컬리 등) 앱 열기와 겹쳐 '두 번 열린 것처럼' 보인다.
// 앵커 클릭 방식이면 정식 새 탭(설치된 앱이 있으면 그 앱)으로 깔끔하게 열린다.
// 🛒 쿠팡 «문» — 2026-09-05 창업자 제보: 앱 안 브라우저(커스텀 탭)로 열면 쿠팡이
//   「요청하신 페이지의 사용권한이 없습니다」로 막는다. 직접 상품 링크·검색 둘 다.
//   같은 폰 크롬에선 열렸다 → 링크가 아니라 «여는 창»이 막힌 것.
//   ⭐ 검사 페이지(public/coupang-door-test.html) 7가지 중 창업자 실물 = **④ 크롬 강제만 열렸다**
//     (①지금 방식 ②리퍼러 ③같은 창 ⑤쿠팡 앱 ⑥m.coupang ⑦직접 상품 = 전부 막힘).
//   ⛔ v12.60·61 = 「크롬으로 강제(intent package=com.android.chrome)」 — **둘 다 실패.** ④가 열렸던 자리는
//     카톡 안 브라우저였고, 한끼 앱(TWA)은 «그 자체가 크롬»이라 크롬 강제가 자기 자신으로 돌아와 커스텀 탭이 됐다.
//   ⭐⭐ 검사 2(public/coupang-door-test2.html · 창업자 20:55 실물) = **Ⓔ `coupang://search?q=` 가 쿠팡 앱을 열고 검색 결과까지 떴다.**
//     Ⓒ(intent scheme=https package=com.coupang.mobile)는 스토어 화면으로 갔다 — 쿠팡 앱은 https 를 안 받고 «coupang://» 만 받는다.
//   그래서 «검색 길»은 안드로이드에서 `coupang://search?q=…` 로 쿠팡 앱을 연다.
//   ⛔ 직접 상품 링크(/vp/products/…)는 앱 딥링크 모양을 «아직 모른다»(검사 3 대기) → 그대로 https.
//   ⛔ 안드로이드 밖(아이폰·PC)은 그대로.
const 쿠팡검색 = /^https?:\/\/(www\.|m\.)?coupang\.com\/(np|nm)\/search\?(?:.*&)?q=([^&#]+)/i
export function 쿠팡문(u, ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  if (!/Android/i.test(ua)) return u
  const m = 쿠팡검색.exec(u)
  if (!m) return u
  return `coupang://search?q=${m[3]}`
}
// 쿠팡 앱이 «없는» 폰 = coupang:// 을 아무도 안 받아 화면이 그대로다 → 1.5초 뒤에도 우리 화면이 보이면 웹으로.
//   (앱이 열리면 우리 문서가 hidden 이 된다 — 그걸로 「열렸나」를 안다)
function 앱열고아니면웹(appUrl, webUrl) {
  const t0 = Date.now()
  window.location.assign(appUrl)
  setTimeout(() => {
    if (document.hidden || Date.now() - t0 > 4000) return
    const a = document.createElement('a')
    a.href = webUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'
    document.body.appendChild(a); a.click(); a.remove()
  }, 1500)
}

export function openExternal(url) {
  if (!url) return
  // 이미 스킴이 있으면(https://, intent://, intent:, market: 등) 그대로 쓰고,
  // 'shop.example.com' 같은 맨 도메인만 https:// 를 붙인다.
  // (안드로이드 intent 링크로 쇼핑몰 '앱'을 강제로 열 때 https 로 덮어쓰지 않도록)
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) || /^intent:/i.test(url)
  const web = hasScheme ? url : 'https://' + url
  const u = 쿠팡문(web)
  // ⭐ 앱 스킴(coupang://)·intent 는 «같은 창»으로 보낸다 — 새 창(_blank)으로 던지면 크롬이 조용히 막는다(v12.60 실측).
  //   같은 창 이동이라도 우리 화면은 그대로 남는다 — 앱이 앞으로 나올 뿐 페이지가 바뀌지 않는다.
  if (/^coupang:/i.test(u)) { 앱열고아니면웹(u, web); return }
  if (/^intent:/i.test(u)) { window.location.assign(u); return }
  const a = document.createElement('a')
  a.href = u
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// "N분 전" 형태의 상대 시간. 브라우저 런타임에서 Date.now 사용.
export function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  const dt = new Date(ts)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(
    dt.getDate()
  ).padStart(2, '0')}`
}

// 제목/본문 키워드로 카테고리를 자동 추정. (완전 스마트 분류는 V2의 AI 몫)
const CATEGORY_RULES = [
  { cat: '양식', kw: ['파스타', '스파게티', '리조또', '피자', '스테이크', '카르보나라', '페스토', '그라탕', '샐러드', '수프', '스프', '오믈렛', '버거', '리소토', '뇨끼'] },
  { cat: '일식', kw: ['초밥', '스시', '라멘', '우동', '돈부리', '규동', '가츠', '돈카츠', '텐동', '오코노미', '타코야키', '나베', '소바', '규카츠', '가라아게'] },
  // 🥟 «중식» = 2026-09-03 신설 (창업자 확정 *"중식칩을 만들자."*)
  //    ⛔ 그 전엔 이 낱말들이 전부 «아시안»으로 갔다. 칩을 만들면서 여기를 «같이» 옮기지 않으면
  //       우리 레시피는 중식 칸에 있는데 **유저가 붙여넣은 짬뽕은 아시안으로 가서 갈라진다.**
  //       📌 「같은 음식이 두 칸에」 — 창업자가 2026-08-01 에 짚은 그 병이다(축이 섞이면 중복은 필연).
  //    ⛔ 이 줄은 «한식보다 위»에 있어야 한다 — 아래 한식 줄에 「탕」·「볶음」이 있어서
  //       마라«탕»·고추잡채 같은 것이 한식으로 새 버린다(먼저 맞는 줄이 이긴다).
  { cat: '중식', kw: ['짜장', '짬뽕', '마파', '탕수육', '깐풍', '유린기', '라조기', '양장피', '고추잡채', '꿔바로우', '마라탕', '마라샹궈', '마라', '훠궈', '중식', '중화', '울면', '동파육', '멘보샤', '팔보채'] },
  // 🌏 «아시안» = 한·중·일을 뺀 나머지 아시아(동남아). 위에서 중식을 빼내니 여기가 깨끗해졌다.
  //    ⛔ 여기에 낱말을 «더 넣지 않았다» — 카레·인도 같은 건 일식 카레와 갈려서
  //       안 시킨 갈래 이동이 생긴다. 이번 일은 「중식을 갈라낸다」뿐이다.
  { cat: '아시안', kw: ['팟타이', '팟카파오', '카오팟', '가파오', '똠얌', '똠양', '쌀국수', '쌀국', '분짜', '반미', '월남쌈', '나시고랭', '미고랭', '팟퐁', '태국', '베트남'] },
  { cat: '간식', kw: ['쿠키', '케이크', '빵', '베이킹', '스콘', '마카롱', '와플', '팬케이크', '디저트', '푸딩', '타르트', '브라우니', '떡', '핫도그', '토스트', '샌드위치'] },
  { cat: '한식', kw: ['김치', '된장', '고추장', '찌개', '국', '탕', '볶음', '무침', '조림', '나물', '비빔', '전', '불고기', '갈비', '제육', '떡볶이', '잡채', '미역', '삼겹', '보쌈', '쌈', '백반', '반찬', '덮밥', '죽'] },
]

export function guessCategory(text = '') {
  const s = String(text)
  for (const rule of CATEGORY_RULES) {
    if (rule.kw.some((k) => s.includes(k))) return rule.cat
  }
  return '한식'
}

// 🛒🛒 재료 줄에서 «사러 갈 때 부르는 이름»만 뽑는다 — 분량은 뗀다 (창업자 2026-08-16)
//
// 📮 창업자 원문 = *"장보기에 **두부1/2모 양파1/2개를 사진 않지..**"* ·
//    *"**그냥 두부 양파를 사지. 해물가루육수 1봉을 사진 않잖아**"*
//
// ⭐⭐ **레시피 분량과 장보기 단위는 «다른 말»이다.** 레시피는 「두부 1/2모」가 맞고
//    장보기는 「두부」가 맞다 — 마트에서 반 모를 파는 데는 없다.
//    그런데 「장보기 담기」가 재료 줄을 **글자 그대로** 옮겨서 장바구니에
//    「두부 1/2모」·「양파 1/2개」·「해물가루육수 1봉」이 적혀 있었다.
//
// 📐 규칙 = ⑴괄호 통째로 뗀다(`(약 300g)`·`(일반설탕 1/2작은술)`)
//           ⑵**분량이 시작되는 자리부터** 잘라낸다(숫자·분수기호·「약간」·「한 줌」…)
//   「신김치 1/4포기 (약 300g)」 → 「신김치」  ·  「돼지고기 앞다리살 또는 삼겹살 200g」 → 「돼지고기 앞다리살 또는 삼겹살」
//   「해물가루육수 1봉」 → 「해물가루육수」  ·  「소금 약간」 → 「소금」
//
// ⛔⛔ **잘라서 «남는 게 없으면» 원문을 그대로 쓴다.** 숫자가 이름 «앞»에 오는 재료가 있다
//    (「1등급 한우」·「7분 삶은 계란」). 그런 줄까지 자르면 **장바구니에 빈 칸이 생긴다** —
//    분량이 붙어 있는 게 빈 줄보다 훨씬 낫다.
// ⚠️ 「두부 1/2모」와 「두부 1모」가 둘 다 「두부」가 되어 하나로 합쳐지는 것은 **맞는 동작**이다
//    (`addShopItems` 가 같은 이름을 안 겹치게 담는다). 장은 한 번만 보면 된다.
// ⭐⭐⭐ **다 떼는 게 아니다** — 창업자 *"**양파 1망 돼지고기 600g은 맞지.**"*
//   📌 이 한 마디가 기준을 갈랐다. 창업자가 말한 셋이 전부 이 표로 설명된다:
//     · 뗀다  = 레시피에서 «쓰는 양» → `1/2모` `1/4포기` `1/2개` `1대` **`1봉`** `1큰술` `약간`
//     · 남긴다 = 마트에서 «파는 단위» → **`600g`** `1kg` `500ml` **`1망`** `1단` `1팩` `1병`
//   ⛔ 「해물가루육수 1**봉**」은 떼고 「양파 1**망**」은 남긴다 — 둘 다 창업자가 콕 집어 말한 것이다.
const 분량시작 = /[\s(]*(\d|½|⅓|⅔|¼|¾|⅛|반\s?개|반\s?쪽|반\s?컵|약간|조금|적당량|적당히|넉넉|한\s?줌|두\s?줌|한\s?꼬집|한\s?스푼|한\s?방울|한\s?줄기|한\s?토막)/
// 그 자리부터가 «파는 단위»면 자르지 않는다(무게·부피·묶음)
// ⛔⛔ `\b`(낱말 경계)를 쓰면 **한글 단위가 하나도 안 잡힌다** — `\b` 는 ASCII 기준이라
//    「1망」·「1단」·「1팩」이 전부 빠져나갔다(첫 판에서 실제로 그랬다 · 규칙 12 로 잡았다).
//    ✅ 뒤가 «끝이거나 낱말이 아닌 것»으로 본다.
const 파는단위 = /^\s*\d+(\.\d+)?\s*(g|kg|ml|L|리터|망|단|팩|봉지|박스|판|캔|병|근|줄|손)(?![가-힣a-z])/i
export function ingredientName(line = '') {
  const 원문 = String(line).trim()
  if (!원문) return ''
  const 괄호뗀것 = 원문.replace(/[(（][^)）]*[)）]/g, ' ').replace(/\s+/g, ' ').trim()
  const m = 괄호뗀것.match(분량시작)
  if (!m) return 괄호뗀것
  // 🛒 「돼지고기 600g」·「양파 1망」은 그대로 둔다 — 그 숫자가 «살 때 필요한 정보»다
  if (파는단위.test(괄호뗀것.slice(m.index))) return 괄호뗀것
  const 이름 = 괄호뗀것.slice(0, m.index).replace(/[\s,·/]+$/, '').trim()
  // ⛔ 잘랐더니 «남는 게 없으면» 원문 그대로 — 숫자가 이름 앞에 오는 재료가 있다(「1등급 한우」).
  //    ⚠️ 한 글자도 이름이다(물·꿀·무·파·깨) — 길이로 막으면 「물 500ml」이 통째로 남는다.
  return 이름 ? 이름 : 원문
}

export function dateLabel(ts) {
  if (!ts) return ''
  const dt = new Date(ts)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(
    dt.getDate()
  ).padStart(2, '0')}`
}

// 글자를 '보이는 글자' 단위로 나눈다 — 이모지(👨‍👩‍👧)도 1글자로 세어 중간에 잘리지 않게.
export function graphemes(s) {
  const str = String(s)
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(str)].map((x) => x.segment)
    }
  } catch {
    /* noop */
  }
  return [...str]
}

export const clampGraphemes = (s, n) => graphemes(s).slice(0, n).join('')

// 음식 사진을 아이콘용 정사각형으로 예쁘게 다듬는다.
// 가운데(세로 사진은 살짝 위쪽 — 접시가 보통 화면 위쪽에 오니까)를 잘라
// 적당한 크기 JPEG 로 압축 → 카드에 딱 맞고 저장 용량도 가볍다.
// 사진을 정사각 썸네일로 다듬는다. (레시피 대표사진·프로필 아바타)
// ⚠️ 2026-07-23 두 버그 고침:
//  1) 검정 썸네일 — 새 canvas 는 '투명'이라, 기기(WebView)에서 onload 직후 곧바로
//     drawImage 가 헛돌면 투명인 채 남고 → JPEG 로 저장하면 투명=검정이 된다(데스크톱은
//     항상 성공해 재현 안 됨). → ① 흰색으로 먼저 칠하고(안전망) ② img.decode() 로
//     비트맵이 실제 준비될 때까지 기다린 뒤 그린다.
//  2) 세로 스샷 반만 잘림 — 예전엔 위쪽(0.38)을 잘라 화면 상단 여백만 담겼다.
//     → '가운데'를 잘라 음식이 중앙에 오게 한다.
export async function cropSquare(dataUrl, out = 800, quality = 0.85) {
  try {
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl })
    if (img.decode) { try { await img.decode() } catch {} } // 비트맵 준비 보장(검정 방지)
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return dataUrl
    const s = Math.min(w, h)
    const sx = (w - s) / 2
    const sy = (h - s) / 2 // 가운데 크롭
    const size = Math.min(out, s)
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff' // 안전망: drawImage 가 실패해도 검정 대신 흰색
    ctx.fillRect(0, 0, size, size)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
    return c.toDataURL('image/jpeg', quality)
  } catch {
    return dataUrl
  }
}

// 📐📐 **자르지 않고 «줄이기만»** — 틀 사진칸용 (창업자 2026-08-08 *"사진 위치조정이 안되네"*)
//
// ⛔ `cropSquare` 는 «고르는 순간» 가운데 정사각만 남기고 나머지를 버린다.
//    세로로 긴 사진을 넣으면 위·아래가 그때 사라져서, 나중에 아무리 끌어도 못 살린다.
//    **위치 조정은 원본이 다 남아 있어야 되는 일이다.**
// ⭐ 그래서 화면에 보일 부분은 «자를 때»가 아니라 «볼 때»(objectPosition) 정한다.
// ⚠️ 안전망 둘은 `cropSquare` 와 똑같이 유지한다 — ①흰색 먼저(검정 방지) ②`decode()` 로 비트맵 대기
//    (2026-07-23 폰에서 «검정 사진» 사고를 여기서 이미 겪었다).
export async function fitImage(dataUrl, max = 1200, quality = 0.85) {
  try {
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl })
    if (img.decode) { try { await img.decode() } catch {} }
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return dataUrl
    const s = Math.min(1, max / Math.max(w, h)) // 큰 사진만 줄인다 — 작은 건 그대로
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(w * s))
    c.height = Math.max(1, Math.round(h * s))
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', quality)
  } catch {
    return dataUrl
  }
}

// 🔍 한글 «초성» 찾기 — 「ㄱㅈ」으로 「간장」이 걸리게.
//
// ⭐ 창업자가 미리 짚어 둔 다음 단계다 — 2026-08-03
//   *"일단 이렇게 해두고 또 많아지면 검색이나 그런걸 추가하자."* (ShopScreen 주석에 남아 있다)
//   폰에서 「고추장」을 다 치는 것보다 「ㄱㅊㅈ」이 빠르다. 초성은 한국 앱의 기본 습관이다.
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
export function chosungOf(s) {
  let out = ''
  for (const ch of String(s || '')) {
    const c = ch.charCodeAt(0) - 0xac00
    out += c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
  }
  return out
}

// 글자로도 찾고, «초성만» 쳤으면 초성으로도 찾는다.
// ⚠️ 초성 판정은 «검색어가 전부 자음일 때»만 — 「간ㅈ」처럼 섞여 있으면 글자 그대로 본다
//    (한글 입력 중간 상태가 자꾸 초성으로 새면 엉뚱한 게 걸린다).
export function matchKo(text, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  const t = String(text || '').toLowerCase()
  if (t.includes(q)) return true
  return /^[ㄱ-ㅎ]+$/.test(q) ? chosungOf(t).includes(q) : false
}

// 🖼 사진을 «주어진 모양»으로 가운데 자르기 — 프레임 창에 딱 맞게 끼울 때 쓴다.
//   창업자 2026-08-06 *"프레임 꾸미기에 넣어서 프레임잡으려면 사진 넣을수(스티커처럼) 있으면 좋겠어"*
//   ⭐ `cropSquare` 는 정사각 전용이라 세로 폴라로이드·가로 액자에 끼우면 창이 남거나 넘친다.
//      `ar` = 가로÷세로. 1 을 주면 `cropSquare` 와 같은 결과.
//   ⚠️ 위 `cropSquare` 의 두 안전망을 그대로 쓴다 — ①흰색 먼저 칠하고 ②`decode()` 로 비트맵을 기다린다
//      (안 그러면 폰에서 «검정 사진»이 나온다. 2026-07-23 사고).
// 📐 사진의 «원래» 가로÷세로. 자르지 않고 통째로 붙일 때 쓴다
//   (창업자 폰 제보 2026-08-07 *"무지 내사진넣기에서 크롭기능있으면"* — 세로 사진이 정사각으로 잘렸다).
//   ⚠️ 못 읽으면 1(정사각)로 — 값이 없다고 화면이 깨지면 안 된다.
export async function imageRatio(dataUrl) {
  try {
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl })
    if (img.decode) { try { await img.decode() } catch {} }
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    return (w > 0 && h > 0) ? w / h : 1
  } catch { return 1 }
}

export async function cropRatio(dataUrl, ar = 1, outW = 800, quality = 0.85) {
  try {
    if (!(ar > 0)) ar = 1
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl })
    if (img.decode) { try { await img.decode() } catch {} }
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return dataUrl
    // 원본에서 «ar 모양의 가장 큰 사각형»을 가운데로 오려낸다
    let sw = w, sh = w / ar
    if (sh > h) { sh = h; sw = h * ar }
    const sx = (w - sw) / 2
    const sy = (h - sh) / 2
    const cw = Math.max(1, Math.round(Math.min(outW, sw)))
    const ch = Math.max(1, Math.round(cw / ar))
    const c = document.createElement('canvas')
    c.width = cw
    c.height = ch
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, cw, ch)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
    return c.toDataURL('image/jpeg', quality)
  } catch {
    return dataUrl
  }
}

// 📐 사진의 «치수»만 잰다 — 다시 굽기 «전»에 「이미 작나」를 보려고.
//   ⛔ 글자 수(용량)로는 못 가른다 — 치수는 작은데 화질만 높아 무거운 사진이 있다.
export async function imageSize(dataUrl) {
  try {
    const img = new Image()
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl })
    if (img.decode) { try { await img.decode() } catch {} }
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    return w && h ? { w, h } : null
  } catch { return null }
}
