// 한끼 디자인 토큰 — 실제 색·라운드·그림자는 styles.css 의 CSS 변수(:root[data-theme])에서 관리.
// (예전 JS colors/radius/shadow 토큰은 어디서도 안 써서 제거 — 2026-07 청소.)

export const CATEGORIES = ['전체', '한식', '양식', '일식', '간식', '아시안']

// ── 테마(팔레트) ── 설정에서 고를 수 있는 색 조합.
// bg/point 는 설정 화면 스와치 미리보기용. 실제 색은 styles.css 의 :root[data-theme] 에서.
export const THEMES = [
  // ⛔⛔ **`bg` 는 «미리보기 스와치»다 — 진짜 색은 styles.css 에 있다.**
  //    2026-08-29 에 «어긋난» 것을 찾았다: 그레이지가 여기선 `#eeebe3` 인데 진짜는 `#f4f1ea` 였다.
  //    v11.21 「톤D」에서 styles.css 만 밝히고 여기를 안 고쳐서, **설정 화면이 틀린 색을 보여주고 있었다.**
  //    📌 테마 색을 바꾸면 «두 곳»을 같이 고친다. (한 곳만 고치면 조용히 어긋난다)
  { key: 'greige', label: '뮤트로 그레이지', desc: '기본 · 차분한 오트밀 배경', bg: '#f4f1ea', point: '#5878a0', dark: false },
  { key: 'cream', label: '크림', desc: '밝고 화사한 웜 배경', bg: '#fdfbf7', point: '#5878a0', dark: false },
  // 🍑 창업자 확정 2026-08-29 = *"살구로"* · *"누리끼리하지 않은 느낌으로"*
  //    ⭐ 아무것도 «안 뺐다» — 창업자 = *"파랑은 그대로 두고 오렌지를 하나 추가할지.. 배경 선택지가 많으면 좋잖아."*
  { key: 'apricot', label: '살구', desc: '연한 오렌지 · 가을 햇살', bg: '#fdf1e8', point: '#5878a0', dark: false },
  { key: 'dark', label: '다크', desc: '세련된 차콜 밤', bg: '#17171b', point: '#7093c0', dark: true },
]

export const THEME_KEY = 'hankki-theme'
// 포인트색은 전 테마 더스티 블루로 통일(브랜드 일관성). 테마는 배경으로만 구분.
//    ⚠️ 이 값은 «폰 상태바» 색이라 배경과 «같아야» 한다 — 다르면 위쪽에 띠가 생긴다.
//    ⛔ 여기도 그레이지가 `#eeebe3` 로 낡아 있었다(위 주석 참조). 진짜 배경값으로 맞췄다.
const THEME_COLOR = { greige: '#f4f1ea', cream: '#fdfbf7', apricot: '#fdf1e8', dark: '#17171b' }

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
