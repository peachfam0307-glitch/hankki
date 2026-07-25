# 한끼 OCR 프록시 (Google Vision) — 세팅·운영 메모

레시피 사진 OCR을 **Google Cloud Vision**으로 처리하는 서버리스 프록시.
앱(정적 PWA)은 API 키를 숨길 수 없어서, **Cloudflare Worker**가 키를 숨기고 Vision을 대신 호출한다.
2026-07-25 구축. 앱 연동 = `src/ocr.js`의 `ocrViaProxy()`(Vision 1순위, 실패 시 폰내장/tesseract 폴백).

## 주소·소유 계정
- **프록시 URL**: `https://hankki-ocr.annyeong-hankki.workers.dev`
- **Cloudflare 계정**: 한끼(Annyeong.hankki@gmail.com) · Worker 이름 `hankki-ocr` · 무료 플랜(카드 X)
- **Google Cloud**: 한끼 계정 · 프로젝트 `hankki-ocr` · Cloud Vision API 사용설정 · **$300 무료체험(90일)** + 예산경보 ₩1,000

## 구성 (Cloudflare 대시보드에서 설정)
- **코드**: `worker.js` (이 폴더) — 대시보드 Edit code에 붙여넣고 Deploy.
- **Secret** `VISION_KEY` = Google API 키(AIza…, Vision 전용 제한). *브라우저·채팅·git에 절대 노출 금지.*
- **Secret** `APP_TOKEN` = 앱과 공유하는 토큰. **`src/ocr.js`의 `OCR_APP_TOKEN`과 반드시 동일**해야 함.
- **Secret** `FOUNDER_SECRET` = 🔓 운영자(창업자) 무제한 통로 비밀키. (아래 참고)
- **KV 바인딩** `OCR_KV` → 네임스페이스 `hankki-ocr-kv` (사용량 카운터 저장).

## 🔓 운영자 무제한 모드 (창업자 본인용)
창업자는 개인 한도(월 5회)를 우회해 사실상 무제한으로 쓴다. 유저는 5회 그대로.
- **켜는 법**: 폰 브라우저에서 앱 주소에 `?founder=<FOUNDER_SECRET>` 붙여 1회 접속 → 이 기기에 저장(주소에선 비밀키 자동 삭제). 이후 이 기기만 무제한.
- **동작**: 앱이 `x-hankki-founder` 헤더로 비밀키 전송 → worker가 일치하면 **개인 한도(IP·유저)만 우회**. **전역 상한 900은 운영자도 존중** → 비밀키가 새더라도 비용은 여전히 $0(전역에서 막힘). 새면 Cloudflare에서 `FOUNDER_SECRET` 교체로 즉시 차단.
- ⚠️ 그 `?founder=` 주소는 남한테 공유 금지(공유하면 상대도 무제한 — 단, 비용은 여전히 전역 900으로 보호됨).

## 🔒 6중 방어벽 (결제사고 방지)
`worker.js`의 `LIMITS`:
| 벽 | 값 | 막는 것 |
|---|---|---|
| 전역 월 상한 | **900** | 무료티어(1,000) 아래 → **비용 $0 물리적 보장** ⭐ |
| 전역 일 상한 | 120 | 하루 폭주 |
| 유저당 월 | 5 | 독식(=프리미엄 유도) |
| IP당 분당 | 6 | 두들기기 |
| + 오리진 체크 | 앱 주소만 | 외부 사이트·봇 |
| + Google 예산경보 ₩1,000 | 이메일 | 독립 2차 벽 |

→ 누가 주소 따서 펑펑 눌러도 900에서 막혀 구글 호출 자체가 안 됨 = 청구 불가.

## 자주 하는 변경
- **무료 한도 올리기**(유료 유저 생겼을 때): `worker.js`의 `LIMITS.MONTHLY_GLOBAL`(전역)·`PER_USER_MONTHLY`(유저당) 숫자만 바꿔 Deploy. 900을 넘기면 초과분은 1건 ≈2원 과금(무료티어 초과).
- **키 교체**: Cloudflare → Worker → Settings → Variables and Secrets에서 `VISION_KEY` 값 갱신.

## ⭐ provider는 언제든 교체 가능 (Vision에 락인 아님)
프록시는 "어떤 OCR이든 갈아끼우는" 구조. 만약 Vision이 특정 이미지(손글씨 등)에 약하면
`worker.js`의 **Vision 호출 부분(`fetch(VISION_URL…)`)만 네이버 클로바 등으로 교체**하면 된다.
앱 코드(`src/ocr.js`)·프록시 보안·KV는 그대로 재사용. (인프라는 이미 다 됨)

## 결제(유료 유도) — 다음 단계 (미구현)
창업자 결정(2026-07-25): **무료 5회/월 + 990원에 25장 팩**을 오픈 때 함께. 원가 2원/건이라 마진 95%.
결제(포트원/토스) + KV 크레딧 원장은 다음 패스. 지금은 무료 5회부터.
