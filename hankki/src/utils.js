// 외부 링크를 '정식 새 탭'으로 연다.
// 주의: window.open(url, '_blank', 'noopener,noreferrer') 처럼 features(3번째 인자)에
// 문자열을 주면 브라우저가 '팝업 창'으로 열어 모바일에서 좁게/세로로 깨져 보이고,
// App Link(쿠팡·컬리 등) 앱 열기와 겹쳐 '두 번 열린 것처럼' 보인다.
// 앵커 클릭 방식이면 정식 새 탭(설치된 앱이 있으면 그 앱)으로 깔끔하게 열린다.
export function openExternal(url) {
  if (!url) return
  // 이미 스킴이 있으면(https://, intent://, intent:, market: 등) 그대로 쓰고,
  // 'shop.example.com' 같은 맨 도메인만 https:// 를 붙인다.
  // (안드로이드 intent 링크로 쇼핑몰 '앱'을 강제로 열 때 https 로 덮어쓰지 않도록)
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) || /^intent:/i.test(url)
  const u = hasScheme ? url : 'https://' + url
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
  { cat: '아시안', kw: ['팟타이', '팟카파오', '카오팟', '가파오', '똠얌', '똠양', '쌀국수', '쌀국', '분짜', '반미', '월남쌈', '나시고랭', '미고랭', '마라탕', '마라샹궈', '마라', '훠궈', '꿔바로우', '깐풍', '유린기', '라조기', '양장피', '고추잡채', '짜장', '짬뽕', '마파', '탕수육', '팟퐁', '태국', '베트남', '중식'] },
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
