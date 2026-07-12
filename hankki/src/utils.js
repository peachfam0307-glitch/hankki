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
export function cropSquare(dataUrl, out = 800, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const s = Math.min(img.width, img.height)
        const sx = (img.width - s) / 2
        const sy = img.height > img.width ? (img.height - s) * 0.38 : (img.height - s) / 2
        const size = Math.min(out, s)
        const c = document.createElement('canvas')
        c.width = size
        c.height = size
        const ctx = c.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
        resolve(c.toDataURL('image/jpeg', quality))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
