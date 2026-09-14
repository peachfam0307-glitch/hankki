# 🍽️ 한끼 (HANKKI)

> **흩어진 레시피를, 한곳에.**
> 인스타·유튜브·블로그·사진에 흩어진 레시피를 **모으고 정리하는** 나만의 레시피 아카이브.

한끼는 레시피를 *찾는* 앱이 아니라, 레시피를 *모으는* 앱입니다.
"인스타에 저장은 해놨는데 못 찾겠다" — 이 문제를 해결합니다.

이 저장소는 기획서(Project HANKKI)를 바탕으로 만든 **설치형 웹앱(PWA)** 입니다.
휴대폰 홈 화면에 설치하면 독립된 앱처럼 전체화면으로 실행되고, 오프라인에서도 동작합니다.
(향후 Flutter 네이티브 앱으로 확장할 수 있도록 화면·기능·디자인 시스템을 그대로 구현했습니다.)

---

## ✨ V1 기능

- **가져오기(Import)** — Instagram · YouTube · 링크 · 사진 · 직접 작성
- **Inbox** — 가져온 레시피는 바로 저장되지 않고 임시 보관 → 나중에 제목·태그·폴더 정리
- **검색** — 음식명 · 재료 · 태그로 찾기
- **레시피 저장/상세** — 사진·재료·만드는 법·메모·원본 링크·태그·조리시간·인분
- **즐겨찾기**
- **자주 해먹는 요리** — "만들었어요!"를 누를수록 자동으로 모임
- **다이어리** — 요리 기록, **장보기 리스트**

모든 데이터는 기기의 `localStorage`에 저장됩니다. (V2에서 클라우드 백업·AI 자동 정리·가족 공유 예정)

---

## 🎨 디자인 시스템

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| 웜 화이트 | `#FFF8F1` | 배경 |
| 크림 | `#F3ECE2` | 카드/태그 배경 |
| 진한 크림 | `#EBDCC6` | 선택된 요소 |
| 샌드 | `#D7C4A8` | 아이콘/보조 |
| 딥 브라운 | `#6B4F3A` | 텍스트/강조/버튼 |

- 폰트: **Pretendard**
- 무드: 미니멀 · 따뜻함 · 고급스러움 · 사진 중심 · 여백이 많은 UI
- 얇은 선, 아주 옅은 카드 그림자

---

## 🚀 실행 방법

```bash
cd hankki
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

> 앱 아이콘은 `npm run build` 전 `node scripts/gen-icons.mjs` 로 다시 생성할 수 있습니다.
> (이미 `public/icons/`에 생성되어 있습니다.)

---

## 📱 휴대폰에 설치하기 (PWA)

배포된 주소를 휴대폰 브라우저로 연 뒤,

- **Android (Chrome):** 메뉴 → **홈 화면에 추가**
- **iPhone (Safari):** 공유 → **홈 화면에 추가**

설치하면 자체 아이콘으로 전체화면 실행되고 오프라인에서도 동작합니다.

---

## ☁️ 배포 (GitHub Pages)

이 저장소에는 GitHub Pages 자동 배포 워크플로(`.github/workflows/deploy-hankki.yml`)가 포함되어 있습니다.

1. GitHub 저장소 → **Settings → Pages → Build and deployment → Source: GitHub Actions** 선택
2. 워크플로가 실행되면 `https://<사용자>.github.io/<저장소>/` 에서 앱이 열립니다.

`vite.config.js`의 `base: './'` 설정 덕분에 어떤 하위 경로에서도 정상 동작합니다.

---

## 🗺️ 폴더 구조

```
hankki/
├─ index.html
├─ vite.config.js          # Vite + PWA(manifest·service worker) 설정
├─ scripts/gen-icons.mjs   # 앱 아이콘 생성기 (외부 라이브러리 없이 PNG 생성)
├─ public/
│  ├─ favicon.svg
│  └─ icons/               # 192 / 512 / maskable 아이콘
└─ src/
   ├─ main.jsx
   ├─ App.jsx              # 내비게이션 스택 + 토스트
   ├─ store.jsx           # localStorage 상태 관리
   ├─ theme.js            # 디자인 토큰
   ├─ styles.css
   ├─ utils.js
   ├─ data/seed.js        # 예시 레시피·태그·재료
   ├─ components/         # Icon · Thumb · BottomNav · TopBar · SourceBadge
   └─ screens/            # Home · Search · MyRecipes · Diary · Profile
                          # Import · Inbox · RecipeDetail · Editor
                          # Favorites · Cooked · Shopping
```
