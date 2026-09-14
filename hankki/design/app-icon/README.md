# 한끼 앱 아이콘 (deep charcoal-green + 고운돋움 + 입체 실버 스푼)

두 가지 버전을 모두 보관합니다. 현재 **배포본은 frameless(테두리 없음)** 입니다.

## frameless/ — 현재 배포본 ✅
- 프레임 없이 글자(한끼)+스푼만. 더 미니멀·모던하고 글자가 더 또렷하게 보임.
- 소스: `frameless/icon-final-frameless.html`
- 실제 배포 에셋: `hankki/public/icons/icon-{192,512}-v3.png`, `icon-maskable-512-v3.png`, `apple-touch-icon-180-v3.png`

## framed/ — 보관용 (되살리려면 이걸로 재생성)
- 은은한 실버 라운드 프레임 버전. "배지" 같은 정갈한 느낌.
- 소스: `framed/icon-final-framed.html`
- 스냅샷 PNG: `framed/icon-*-framed.png`

## 공통 스펙
- 배경: 딥 차콜그린 라디얼 그라디언트 `#3a4139 → #20261f`
- 글자: 고운돋움(@fontsource/gowun-dodum), `#eef1ec`, letter-spacing -6px
- 심볼: 드롭섀도우 넣은 입체 실버 스푼(정중앙)
- maskable 은 두 버전 모두 프레임 없이 여백을 더 줘서 세이프존 안에 들어감

## 재생성 방법
`scratchpad/gen-icons.cjs` 가 `icon-final.html` 을 Playwright 로 512 캡처 후
캔버스로 192·180 다운스케일. frameless/framed 는 `icon-final.html` 안의
`<div class="frame">` 유무만 다름.
