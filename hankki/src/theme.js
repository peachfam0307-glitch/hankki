// 한끼 디자인 토큰 — 미니멀 · 따뜻함 · 고급스러움
// 컬러 팔레트는 시안 하단의 '컬러 & 타이포'에서 그대로 가져옴.
export const colors = {
  bg: '#F7F4EE', // 따뜻한 크림 배경 (홍보 세트 톤과 일치)
  surface: '#FFFDF9', // 카드 표면 — 살짝 웜한 화이트
  cream: '#EFEAE0', // 연한 웜크림 (pill, 태그 배경)
  creamDeep: '#E7DECD', // 진한 웜크림 (선택된 pill)
  sand: '#CDC7BB', // 샌드 (아이콘, 보조)
  brown: '#6B4F3A', // 딥 브라운 (텍스트, 강조, 버튼) — 따뜻한 포인트
  text: '#3D3830', // 본문 텍스트
  textSub: '#8F887B', // 보조 텍스트 (웜 뉴트럴)
  line: '#ECE5DA', // 아주 얇은 웜한 구분선
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

export const CATEGORIES = ['전체', '한식', '양식', '일식', '간식', '아시안']

// ── 테마(팔레트) ── 설정에서 고를 수 있는 색 조합.
// bg/point 는 설정 화면 스와치 미리보기용. 실제 색은 styles.css 의 :root[data-theme] 에서.
export const THEMES = [
  { key: 'greige', label: '뮤트로 그레이지', desc: '기본 · 차분한 오트밀 배경', bg: '#eeebe3', point: '#5878a0', dark: false },
  { key: 'cream', label: '크림', desc: '밝고 화사한 웜 배경', bg: '#fdfbf7', point: '#5878a0', dark: false },
  { key: 'dark', label: '다크', desc: '세련된 차콜 밤', bg: '#17171b', point: '#7093c0', dark: true },
]

export const THEME_KEY = 'hankki-theme'
// 포인트색은 전 테마 더스티 블루로 통일(브랜드 일관성). 테마는 배경으로만 구분.
const THEME_COLOR = { greige: '#eeebe3', cream: '#fdfbf7', dark: '#17171b' }

export function getTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return THEMES.some((x) => x.key === t) ? t : 'greige'
  } catch {
    return 'greige'
  }
}

// data-theme 속성 + 상태바(theme-color) 적용. 렌더 없이 DOM 만 바꾼다.
export function applyTheme(key) {
  const t = THEMES.some((x) => x.key === key) ? key : 'greige'
  document.documentElement.dataset.theme = t
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[t] || THEME_COLOR.greige)
}

export function setTheme(key) {
  try {
    localStorage.setItem(THEME_KEY, key)
  } catch {
    /* 저장 실패해도 적용은 한다 */
  }
  applyTheme(key)
}
