# 한끼 홍보 카드 · 폰트 자산

출시 홍보 이미지(인스타/스토어/카톡)와, 거기 쓰는 **따뜻한 한글 손글씨/둥근 폰트**를 한곳에 보관해 둔 폴더.
매번 폰트 새로 받지 말고 여기서 꺼내 쓴다.

## 폴더 구성

```
design/promo/
├─ fonts/                  # 원본 woff2 (npm @fontsource, OFL 오픈라이선스)
│   ├─ jua-korean-400.woff2 / jua-latin-400.woff2            (Jua·둥근 제목체)
│   ├─ gaegu-korean-400.woff2 / gaegu-latin-400.woff2        (Gaegu·손글씨)
│   ├─ gowun-dodum-korean-400.woff2 / -latin-400.woff2       (GowunDodum·본문)
│   └─ nanumpen-korean-400.woff2 / nanumpen-latin-400.woff2  (NanumPen·펜글씨)
├─ fonts-embed.css         # 위 폰트를 base64 인라인한 즉시사용 CSS (HTML 한 줄 링크용)
├─ mkfonts.mjs             # fonts/ → fonts-embed.css 재생성기
├─ render.mjs              # HTML → PNG(2배) 렌더러
└─ templates/
    └─ launch-1080x1350.html   # 출시 홍보 시안(확정본): "이제 한끼에 다 모여요"
```

## 왜 base64 인라인인가
이 환경의 아웃바운드 프록시가 Google Fonts·jsdelivr 같은 외부 CDN을 **차단(403)**한다.
그래서 웹폰트를 `<link href="https://fonts...">` 로 못 불러온다.
→ 폰트를 woff2 로 받아 base64 로 CSS 안에 심어두면(=`fonts-embed.css`) 오프라인/차단 환경에서도 100% 렌더된다.
(폰트는 npm 레지스트리가 프록시 허용 목록이라 `@fontsource/*` 패키지로 받았다.)

## 홍보 이미지 만들기
```bash
cd design/promo
node render.mjs templates/launch-1080x1350.html launch.png
```
- 새 시안: `templates/` 에 HTML 추가 → 첫 줄에 `<link rel="stylesheet" href="../fonts-embed.css">`,
  `.card` 요소(width×height 고정)로 감싸면 render.mjs 가 그 요소만 캡처한다.
- 폰트 추가/교체: `@fontsource` woff2 를 `fonts/` 에 넣고 `mkfonts.mjs` 의 defs 등록 → `node mkfonts.mjs`.

## 디자인 원칙 (창업자 미감 반영)
- **이모지 금지** — 커스텀 라인 아이콘(둥근 사각 배경)으로 통일. 이모지는 촌스럽게 읽힌다.
- **따뜻한 폰트** — 시스템 한글 폰트는 딱딱함. Jua(제목)·Gaegu(손글씨)·GowunDodum(본문) 조합.
- **에디토리얼 여백** — 꽉 채우지 말고 숨 쉬는 레이아웃. 톤: 크림(#f4efe6)·먹(#4a4136)·clay(#c47a58).
- **정직** — 아직 없는 기능(공유 링크 등)은 광고에 넣지 않는다.
- 셀링포인트(꾸미기)는 **작게 꾸민 표지 목업**으로 시각화해서 여백에 곁들인다.
