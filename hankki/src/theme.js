// 한끼 디자인 토큰 — 미니멀 · 따뜻함 · 고급스러움
// 컬러 팔레트는 시안 하단의 '컬러 & 타이포'에서 그대로 가져옴.
export const colors = {
  bg: '#F5F6F4', // 쿨 뉴트럴 오프화이트 배경 (peachy 웜기 제거)
  surface: '#FFFFFF', // 카드 표면 (그림자 거의 없음)
  cream: '#EDEEE9', // 연한 크림-뉴트럴 (pill, 태그 배경)
  creamDeep: '#E0E3DC', // 진한 크림-뉴트럴 (선택된 pill)
  sand: '#CDC7BB', // 샌드 (아이콘, 보조) — 살짝 쿨하게
  brown: '#6B4F3A', // 딥 브라운 (텍스트, 강조, 버튼) — 따뜻한 포인트 유지
  text: '#3D3830', // 본문 텍스트
  textSub: '#8E8F88', // 보조 텍스트 (뉴트럴 그레이)
  line: '#E8E9E4', // 아주 얇은 연한 구분선
  danger: '#C2703F',
}

export const radius = {
  sm: '10px',
  md: '16px',
  lg: '22px',
  pill: '999px',
}

// 카드 그림자는 '거의 없음' — 아주 미세하게만.
export const shadow = {
  none: 'none',
  soft: '0 1px 2px rgba(107, 79, 58, 0.04)',
  card: '0 6px 20px rgba(107, 79, 58, 0.06)',
}

export const CATEGORIES = ['전체', '한식', '양식', '일식', '간식']

// ── 테마(팔레트) ── 설정에서 고를 수 있는 색 조합.
// bg/point 는 설정 화면 스와치 미리보기용. 실제 색은 styles.css 의 :root[data-theme] 에서.
export const THEMES = [
  { key: 'cream', label: '크림', desc: '따뜻한 기본', bg: '#f5f6f4', point: '#6b4f3a', dark: false },
  { key: 'sage', label: '세이지', desc: '연한 그린', bg: '#f1f3ee', point: '#6f7c63', dark: false },
  { key: 'dark', label: '다크', desc: '아이콘 톤', bg: '#20261f', point: '#8fa07f', dark: true },
]

export const THEME_KEY = 'hankki-theme'
const THEME_COLOR = { cream: '#f5f6f4', sage: '#f1f3ee', dark: '#1b201a' }

export function getTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return THEMES.some((x) => x.key === t) ? t : 'cream'
  } catch {
    return 'cream'
  }
}

// data-theme 속성 + 상태바(theme-color) 적용. 렌더 없이 DOM 만 바꾼다.
export function applyTheme(key) {
  const t = THEMES.some((x) => x.key === key) ? key : 'cream'
  document.documentElement.dataset.theme = t
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[t] || THEME_COLOR.cream)
}

export function setTheme(key) {
  try {
    localStorage.setItem(THEME_KEY, key)
  } catch {
    /* 저장 실패해도 적용은 한다 */
  }
  applyTheme(key)
}
