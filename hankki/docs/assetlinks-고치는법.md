# assetlinks.json 고치는 법 (주소창 뜨는 문제) — 완전 설명서 ✅ 해결 완료

> **상태: 2026-07-17 해결됨.** 도장 2개 다 들어간 것 실제 파일에서 확인 완료.
> (`raw.githubusercontent.com/.../오답끝/.well-known/assetlinks.json` → 지문 2개 확인)

> **왜 이게 필요한가:** 곰곰이 앱(TWA)을 깔았을 때 화면 위에 주소창이 뜨면,
> 이 파일에 **앱 서명 도장(지문)이 빠져** 있는 것. 도장 2개를 다 넣으면
> 설치자들이 자동으로 **풀스크린(주소창 없이)** 으로 앱이 열린다.
> (이미 깔린 사람은 앱을 지웠다 다시 깔거나 며칠 뒤 자동 반영)

---

## ⚡ TL;DR — 다음에 또 고칠 땐 이것만 하면 됨 (5분)

1. **컴퓨터**(폰 말고!)에서 크롬으로 이 주소 열기:
   `github.com/peachfam0307-glitch/peachfam0307-glitch.github.io`
2. 페이지 로드되면 키보드 **마침표 `.`** 누르기 → 브라우저 안에 **VS Code(github.dev)** 열림
3. 인증창 뜨면 **허용 → Authorize → (sudo 확인은 이메일 코드)** 통과
4. **Ctrl+P** → `assetlinks` 입력 → 파일 열기
5. **Ctrl+A → Delete →** 아래 JSON 붙여넣기 → **Ctrl+S**
6. 왼쪽 **소스 제어(가지 아이콘)** → 메시지 입력 → **커밋 및 푸시**
7. "커밋할 변경내용이 없습니다" 가 뜨면 **이미 올라간 것 = 성공**

---

## ⚠️ 매번 헤매던 핵심 이유 3가지 (이거 모르면 또 헤맴)

1. **파일은 이 앱 레포(hankki)에 있는 게 아니다.**
   → 도메인 루트 레포 **`peachfam0307-glitch/peachfam0307-glitch.github.io`** 에 있다.
2. **브랜치 이름이 `main`도 `master`도 아니고 한글 `오답끝` 이다.**
   → `main`으로 열면 "404 - page not found". 정확한 브랜치는 `오답끝`.
3. **⭐ GitHub 일반 편집기(`/edit/` 화면)는 한글 브랜치를 못 읽고 뻗는다.**
   → 폰이든 PC든 "Error loading page"가 뜬다. **그래서 github.dev(VS Code)로 열어야 한다.**

---

## ✅ 붙여넣을 최종 내용 (도장 2개 — 이게 정답)

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

## 도장(지문) 뜻
- `63:89:0D:...F6:92` = **업로드 키** 지문 (원래 있던 것)
- `28:DF:DB:74:...28:4D` = **Google Play 앱 서명 키** 지문 ← **이게 빠져서** 주소창이 떴다
  - 확인처: Play Console → 설정 → 앱 무결성 → 앱 서명 탭 → SHA-256
  - (또는 "Asset Links Tool" 앱으로도 뽑을 수 있음)

---

## 🔍 반영·검증 방법
- **실제 서비스 파일 확인**(WebFetch는 이 도메인에서 403 나므로 raw로):
  `raw.githubusercontent.com/peachfam0307-glitch/peachfam0307-glitch.github.io/오답끝/.well-known/assetlinks.json`
  → 지문 **2개** 다 보이면 성공.
- 앱 반영: 새로 설치 시 자동 풀스크린. 기존 설치자는 재설치 or 며칠 뒤 자동.

---

## 🧭 2026-07-17 실제로 겪은 삽질 기록 (다음엔 이 길로 가지 말 것)

| 시도 | 결과 | 왜 |
|---|---|---|
| 폰 크롬 `.../edit/main/...` | 404 page not found | 브랜치가 `main`이 아니라 `오답끝` |
| 폰 크롬 폴더 탭 이동 | Error loading page | 한글 브랜치라 SPA가 뻗음 |
| 폰 크롬 `.../edit/오답끝/...` | Error loading page | 편집기 SPA가 한글 브랜치 못 읽음 |
| 폰 크롬 "데스크톱 사이트" + 편집 | 잠깐 뜨다 Error loading page | 위와 동일 |
| **PC 크롬** `.../edit/오답끝/...` | Error loading page | **편집기 자체 문제 (폰 탓 아님 확정)** |
| 클로드가 `add_repo`로 직접 수정 | 승인창 떠도 반영 안 됨 | 이 환경의 MCP 승인 연결이 먹통 |
| GitHub 모바일 앱 | 파일 대신 폰 사진첩 열림 | `+` 눌러 업로드 창이 뜬 것 |
| **✅ PC에서 github.dev(`.` 키)** | **성공** | **다른 편집기라 한글 브랜치 OK** |

**교훈:**
- 이 레포 편집은 무조건 **PC + github.dev(`.` 키)**. 일반 연필 편집기 쓰지 말 것.
- "컴퓨터로?" 얘기 나오면 폰에서 붙잡지 말고 **바로 컴퓨터로** 넘어갈 것.
- 근본 대안: 언젠가 브랜치 이름을 `오답끝`→`main`으로 바꾸면 일반 편집기도 정상화됨
  (단, 이 레포는 GitHub Pages 소스라 바꾼 뒤 Settings→Pages 소스 브랜치 확인 필요).

---

## 클로드가 직접 못 고치는 이유 (기록용)
- 이 세션 스코프는 `peachfam0307-glitch/-` (hankki)뿐 → 도메인 루트 레포는 GitHub 도구 접근 차단("Access denied").
- `add_repo` 승인이 이 환경에서 도구까지 전달되지 않음.
- → 결론: 이 파일은 **창업자가 PC github.dev로 직접** 고치는 게 가장 확실. (5분)
