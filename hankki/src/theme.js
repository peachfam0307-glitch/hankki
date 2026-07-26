// 한끼 디자인 토큰 — 실제 색·라운드·그림자는 styles.css 의 CSS 변수(:root[data-theme])에서 관리.
// (예전 JS colors/radius/shadow 토큰은 어디서도 안 써서 제거 — 2026-07 청소.)

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
