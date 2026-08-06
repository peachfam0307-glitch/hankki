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

// ⭐⭐⭐ **「글자·칸은 코드로 얹는다」 — 이게 처음부터의 약속이다** (문서 2026-08-06)
//   > 글자는 **없어지는 게 아니라 코드로 같은 자리에 얹혀** 화면에선 «똑같이» 보인다.
//   창업자가 시안에서 글자·칸을 다 «빼고» 준 이유가 그거다(오타가 상품이 되는 걸 막으려고).
//   ⛔ 2026-08-06 에 클로드가 그 약속을 안 하고 빈 프레임을 빈 채로 뒀다 →
//      창업자 *"빈 프레임에 제목이랑 줄그어주기로 했잖아. 복기해봐"*. 맞는 지적이다.
//
// 📐 아래 좌표는 **그림을 픽셀로 재서** 넣은 값이다(눈대중 아님 · 규칙 18).
//    `dp_card` 1086×1448 — 사진칸 x 10~56.7% · y 16.4~39.8% · 아래 빈 띠 40.1~85.8%
//    `dp_photo` 1086×1448 — 사진칸 y 13.1~57.4% · 날짜·날씨 줄 y 57.5~64.5%
//                            인쇄된 줄 y 70.5·74.9·79.2·83.5·87.8·92.2% (간격 4.34%)
//
// 단위 = **종이 상자의 %** (left/right = 폭 · top/bottom = 높이).
// `lineH` 만 `cqw`(종이 «폭» 기준) 다 — 글자 크기와 줄 간격이 한 값에 묶여야
// 판이 커지든 작아지든 **글씨가 늘 줄 위에 앉는다**. (px 로 박으면 어긋난다)
const LINE_H = 5.79 // cqw · = 높이의 4.34% → dp_photo 에 인쇄된 줄 간격과 «같은 값»

/** ⑶ 틀 — 창업자가 뽑아 온 그림. ⛔글자 0개·별 0개로 받았다(오타가 상품이 되지 않게). */
export const PAPER_ARTS = [
  {
    key: 'none', label: '없음', src: null,
    // 틀이 없으면 종이 전체가 쓰는 칸. 줄은 종이 전체에 그어진다(지금까지와 같다).
    fields: { rule: 'paper', write: { top: 2 * LINE_H * 0.75, left: 9, right: 9, bottom: 7 } },
  },
  {
    key: 'photo', label: '사진일기', src: dpPhoto, note: '사진 한 장 ＋ 날짜·날씨 ＋ 줄',
    // ⚠️ 줄이 **그림에 이미 인쇄돼 있다** → CSS 줄을 끈다(안 그러면 두 겹).
    //    글줄은 인쇄된 줄에 «정확히» 앉게 top 을 역산했다: 첫 줄 밑 = 70.5% → top = 70.5 − 4.34
    fields: {
      rule: 'none',
      // 📅 그림에 **날짜 밑줄 세 칸이 인쇄돼 있다** — 실측 y 64.6~65.4% · x 17.7·28.2·38.7~46.4%
      //    글자 «밑»이 그 줄에 닿게 top 을 역산했다(65.0 − 줄높이 4.34).
      date: { top: 60.66, left: 17.7, right: 53.6, fit: 0.6 },
      // ☀️ 날씨 — **그림에 아이콘 넷이 이미 인쇄돼 있는데 눌러도 아무 일이 없었다.**
      //    창업자 *"날씨넣는 일기 프레임은 있잖아"* — 맞다. 있는데 «쓸 수가» 없었을 뿐이다.
      //    → 그 위에 투명 버튼을 얹고, 고르면 손으로 친 것 같은 동그라미가 쳐진다.
      //    ⛔ 우리가 아이콘을 새로 그리지 않는다 — 그림에 있는 걸 «고르게만» 한다.
      //    실측 x 가운데 = 58.9 · 67.7 · 76.7 · 86.0% (폭 4.0~4.6%) · y 58.6~65.2%
      // 📐 `y` = 동그라미 «세로 가운데». 아이콘 덩어리 가운데가 63.5% 라 거기 맞췄다
      //    (처음 61.9 로 뒀더니 실물에서 위로 떠 사진틀 선을 물었다 — 캡처로 잡음)
      weather: {
        y: 62.9, size: 10.5,
        items: [
          { key: 'sun', x: 58.9, label: '맑음' },
          { key: 'cloud', x: 67.7, label: '흐림' },
          { key: 'partly', x: 76.7, label: '구름 조금' },
          { key: 'rain', x: 86.0, label: '비' },
        ],
      },
      write: { top: 66.16, left: 10.5, right: 9.5, bottom: 6.5 },
    },
  },
  {
    key: 'card', label: '레시피 기록', src: dpCard, note: '사진 옆에 날짜·줄 · 아래는 비움 · 맨 아래 오늘의 한 줄',
    // ⭐ 창업자 2026-08-06 = *"사진 옆에 줄 긋고 날짜랑 그건 똑같이 하고.
    //    아래는 남겨주고 제일 아래 줄긋고 오늘의 한줄"*
    //    · 사진 «옆»(x60~92%) = 날짜 한 줄 ＋ 글줄 넉 줄
    //    · 아래(40~76%) = **비운다** — 꾸미기 자리다
    //    · 맨 아래(77~84%) = 밑줄 하나 ＋ 「오늘의 한 줄」
    //    ⚠️ 85.8% 아래는 그림의 꽃·마테가 있다 → 한 줄 칸을 그보다 위에 둔다
    fields: {
      rule: 'write', // 줄은 «쓰는 칸 안에만» — 사진칸·빈 자리에 줄이 지나가면 안 된다
      date: { top: 18.4, left: 60, right: 8 },
      write: { top: 23.1, left: 60, right: 8, bottom: 60.3 },
      line: { top: 77, left: 15.5, right: 8, label: '오늘의 한 줄' },
    },
  },
  // ⭐ 이 둘이 «구조 × 스킨»의 실제 예다 — 같은 도트 종이인데 테두리 색만 다르다
  { key: 'dotblue', label: '도트 · 파랑', src: dpDotBlue, dots: true, fields: { rule: 'paper', write: { top: 8.7, left: 9.5, right: 9.5, bottom: 8 } } },
  { key: 'dotwarm', label: '도트 · 갈색', src: dpDotWarm, dots: true, fields: { rule: 'paper', write: { top: 8.7, left: 9.5, right: 9.5, bottom: 8 } } },
]

/** 줄 간격(cqw) — 글자 크기·줄 간격·CSS 줄이 전부 이 하나에 묶인다. */
export const PAPER_LINE_H = LINE_H

/** 그 틀이 어떤 칸을 갖고 있나. 모르는 키면 「없음」의 것을 준다. */
export const paperFields = (art) =>
  (PAPER_ARTS.find((x) => x.key === art) || PAPER_ARTS[0]).fields

/**
 * 고른 값들을 `.paper` 클래스와 배경 그림으로 바꾼다.
 * ⚠️ 틀 그림에 도트가 «이미 그려져» 있으면 CSS 도트를 끈다 — 안 그러면 점이 두 겹으로 찍힌다.
 */
export function paperStyle({ rule = 'plain', skin = 'ivory', art = 'none' } = {}) {
  const a = PAPER_ARTS.find((x) => x.key === art) || PAPER_ARTS[0]
  const r = PAPER_RULES.find((x) => x.key === rule) || PAPER_RULES[0]
  const s = PAPER_SKINS.find((x) => x.key === skin) || PAPER_SKINS[0]
  const drawRule = a.dots && r.key === 'dots' ? '' : r.cls // 도트 틀 + 도트 선 = 두 겹 → 끈다
  // 📔📔 **줄을 어디에 긋나** (창업자 2026-08-06 *"줄눈을 그어주는게 좋을까...? 그건 잘 모르겠네"*)
  //   → 우리가 정하지 않는다. 「선」 탭에서 «고른 것»이 그어진다. 다만 **어디에** 긋는지는 틀이 정한다:
  //   · `paper` = 종이 전체(틀이 없거나 도트 틀)
  //   · `write` = **쓰는 칸 안에만** — 사진칸·비워둔 자리에 줄이 지나가면 안 된다
  //   · `none`  = 안 긋는다(그림에 이미 인쇄돼 있다)
  const where = (a.fields || {}).rule || 'paper'
  const onPaper = where === 'paper' ? drawRule : ''
  return {
    className: ['paper', onPaper, s.cls, a.src ? 'art' : ''].filter(Boolean).join(' '),
    // ⚠️ `backgroundImage` 로 주면 줄·모눈을 «덮는다» — 둘 다 같은 속성이라. 틀은 `--art` 로 넘겨
    //    `.paper.art::after` 가 «위 층»에 그린다.
    style: a.src ? { '--art': `url(${a.src})` } : undefined,
    // 쓰는 칸이 직접 그어야 할 때만 값이 있다
    rule: where === 'write' ? drawRule : '',
    fields: a.fields || PAPER_ARTS[0].fields,
  }
}
