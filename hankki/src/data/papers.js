// 📔 다이어리 속지 — 「고르는」 것이지 「박는」 것이 아니다.
//
// ⭐ 창업자 확정 2026-08-06 — *"다이어리 전용이 있어야지"* · *"속지 예쁜걸로 하자"* ·
//    *"이거랑 네가 만든 도트 무지 크라프트 등등 속지도 넣자"*
//
// ⛔ 표지 배경 탭(`DECOR_BACKGROUNDS`)과 «다른 물건»이다.
//    2026-07-30 결정 = *"기본배경에는 색깔만"* (마테에 이미 무늬가 있어 표지가 무늬 천지가 된다).
//    그건 **표지** 기준이고, 다이어리 종이는 **글 쓰는 판**이라 줄·모눈이 장식이 아니라 «도구»다.
//    → 표지 배경 탭·유료팩(`bgpaper`)은 손대지 않는다.
//
// ── 층이 셋이다 ────────────────────────────────────────────────────────────
//   ⑴ **선**(무지·줄·모눈·도트) = CSS  → 파일 0KB · 무한 확대해도 안 깨짐
//   ⑵ **스킨**(종이색·선색)     = CSS  → ⭐**변수 두 줄**. 그림이 한 장도 안 는다
//   ⑶ **틀**(테두리·칸·장식)    = 그림 → 이건 그림이 이긴다
//
// ⭐⭐ 창업자 조사 결론이 *"구조 12개를 «여러 감성 스킨으로»"* 였는데,
//    ⑴⑵가 CSS 라서 그게 **공짜로** 된다. 통짜 그림이면 스킨마다 전부 다시 뽑아야 했다.
//
// 📦 그림은 **WebP** 다 — 원본 PNG 2,148KB → **117KB**(30배). 선그림이라 WebP 가 특히 잘 듣는다.
//    화면에 뜨는 크기(폭 328·DPR3 = 984px)로 줄여 원본과 비교하니 **평균차 0.5/255** = 눈에 안 보인다.
//    ⚠️ `assets/**` 은 첫 다운로드(precache)에서 이미 빠져 있다(2026-08-05) → **쓸 때 받는다.**
import dpPhoto from '../assets/paper/dp_photo.webp'
import dpCard from '../assets/paper/dp_card.webp'
import dpDotBlue from '../assets/paper/dp_dot_blue.webp'
import dpDotWarm from '../assets/paper/dp_dot_warm.webp'

/** ⑴ 선 — 무지가 기본. 「양식을 안 정한다」는 확정 그대로 빈 종이에서 시작한다. */
export const PAPER_RULES = [
  { key: 'plain', label: '무지', cls: '' },
  { key: 'lined', label: '줄', cls: 'lined' },
  { key: 'grid', label: '모눈', cls: 'grid' },
  { key: 'dots', label: '도트', cls: 'dots' },
]

/** ⑵ 스킨 — 종이색·선색. CSS 변수라 그림이 안 는다. */
export const PAPER_SKINS = [
  { key: 'ivory', label: '아이보리', cls: '' },
  { key: 'linen', label: '리넨', cls: 'linen' },
  { key: 'greige', label: '그레이지', cls: 'greige' },
  { key: 'kraft', label: '크라프트', cls: 'kraft' },
]

/** ⑶ 틀 — 창업자가 뽑아 온 그림. ⛔글자 0개·별 0개로 받았다(오타가 상품이 되지 않게). */
export const PAPER_ARTS = [
  { key: 'none', label: '없음', src: null },
  { key: 'photo', label: '사진일기', src: dpPhoto, note: '사진 한 장 ＋ 날짜·날씨 ＋ 줄' },
  { key: 'card', label: '사진 한 칸', src: dpCard, note: '위에 사진칸 하나 · 아래는 통째로 비움' },
  // ⭐ 이 둘이 «구조 × 스킨»의 실제 예다 — 같은 도트 종이인데 테두리 색만 다르다
  { key: 'dotblue', label: '도트 · 파랑', src: dpDotBlue, dots: true },
  { key: 'dotwarm', label: '도트 · 갈색', src: dpDotWarm, dots: true },
]

/**
 * 고른 값들을 `.paper` 클래스와 배경 그림으로 바꾼다.
 * ⚠️ 틀 그림에 도트가 «이미 그려져» 있으면 CSS 도트를 끈다 — 안 그러면 점이 두 겹으로 찍힌다.
 */
export function paperStyle({ rule = 'plain', skin = 'ivory', art = 'none' } = {}) {
  const a = PAPER_ARTS.find((x) => x.key === art) || PAPER_ARTS[0]
  const r = PAPER_RULES.find((x) => x.key === rule) || PAPER_RULES[0]
  const s = PAPER_SKINS.find((x) => x.key === skin) || PAPER_SKINS[0]
  const drawRule = a.dots && r.key === 'dots' ? '' : r.cls // 도트 틀 + 도트 선 = 두 겹 → 끈다
  return {
    className: ['paper', drawRule, s.cls, a.src ? 'art' : ''].filter(Boolean).join(' '),
    // ⚠️ `backgroundImage` 로 주면 줄·모눈을 «덮는다» — 둘 다 같은 속성이라. 틀은 `--art` 로 넘겨
    //    `.paper.art::after` 가 «위 층»에 그린다.
    style: a.src ? { '--art': `url(${a.src})` } : undefined,
  }
}
