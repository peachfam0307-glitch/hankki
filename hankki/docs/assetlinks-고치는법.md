# assetlinks.json 고치는 법 (주소창 뜨는 문제) — 완전 설명서

> **왜 이게 필요한가:** 곰곰이 앱(TWA)을 깔았을 때 화면 위에 주소창이 뜨면,
> 이 파일에 **앱 서명 도장(지문)이 빠져** 있는 것이다. 도장 2개를 다 넣으면
> 설치자들이 자동으로 **풀스크린(주소창 없이)** 으로 앱이 열린다.
> (이미 깔린 사람은 앱을 지웠다 다시 깔거나 며칠 뒤 자동 반영)

---

## ⚠️ 매번 헤매던 핵심 이유 3가지 (이거만 알면 안 헤맨다)

1. **파일은 이 앱 레포(hankki)에 있는 게 아니다.**
   → 도메인 루트 레포 **`peachfam0307-glitch/peachfam0307-glitch.github.io`** 에 있다.
2. **브랜치 이름이 `main`도 `master`도 아니고 한글 `오답끝` 이다.**
   → 그래서 `main`으로 열면 "404 - page not found"가 뜬다.
3. **폴더를 손으로 탭해 들어가면 "Error loading page"가 뜬다** (GitHub 모바일 웹 버그, 한글 브랜치라 더 심함).
   → 폴더 타고 들어가지 말고 **파일 주소를 통째로 입력**해서 바로 간다.

---

## ✅ 고치는 순서 (핸드폰 크롬 기준, 로그인 상태)

### 1) 편집 화면으로 바로 가기
크롬 주소창에 아래를 **통째로 복사·입력**:
```
github.com/peachfam0307-glitch/peachfam0307-glitch.github.io/edit/오답끝/.well-known/assetlinks.json
```

### 2) 내용 전체 지우고 아래 내용 붙여넣기 (도장 2개)
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.peachfam0307_glitch.twa",
      "sha256_cert_fingerprints": [
        "63:89:0D:57:D5:84:C6:9F:9F:CE:84:C4:AB:43:AE:5C:E9:52:53:B9:65:E7:4B:CF:C5:BD:1B:BD:98:EC:F6:92",
        "28:DF:DB:74:2E:7C:67:A7:9D:F6:61:8F:C5:6F:88:82:73:95:A8:98:CE:42:BF:01:AE:06:20:98:76:29:28:4D"
      ]
    }
  }
]
```

### 3) 초록색 **Commit changes** → 다시 **Commit** 확인

---

## 도장(지문) 뜻
- `63:89:0D:...F6:92` = **업로드 키** 지문 (원래 있던 것)
- `28:DF:DB:74:...28:4D` = **Google Play 앱 서명 키** 지문 ← **이게 빠져서** 주소창이 떴다
  - 확인처: Play Console → 설정 → 앱 무결성 → 앱 서명 탭 → SHA-256
  - (또는 "Asset Links Tool" 앱으로도 뽑을 수 있음)

---

## 안 될 때 대체 주소
- **파일 내용만 보기**(편집 주소가 에러날 때):
  ```
  github.com/peachfam0307-glitch/peachfam0307-glitch.github.io/blob/오답끝/.well-known/assetlinks.json
  ```
  열리면 오른쪽 위 **연필 ✏️** 로 편집.
- **실제 서비스되는 내용 확인**(앱이 진짜 읽는 곳):
  ```
  peachfam0307-glitch.github.io/.well-known/assetlinks.json
  ```
  여기서 도장이 **2개** 다 보이면 성공. 1개만 보이면 아직 반영 전.

---

## 클로드가 직접 못 고치는 이유 (기록용)
- 이 세션은 `peachfam0307-glitch/-` (hankki) 레포만 열려 있어서,
  도메인 루트 레포는 GitHub 도구로 접근이 막힌다("Access denied").
- `add_repo` 도구로 추가하려면 **승인창**이 떠야 하는데, 창업자 폰에서 그게 안 보였다.
- → 결론: 이 파일은 **창업자가 위 순서대로 직접** 고치는 게 가장 확실하다. (30초)
