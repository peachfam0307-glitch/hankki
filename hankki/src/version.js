// 앱 버전 — 배포마다 숫자를 올린다. 설정 화면 맨 아래에 표시되고,
// 새 버전으로 업데이트되면(서비스워커 교체 → 새로고침) 안내 토스트를 띄우는 기준이 된다.
// 사용자가 "지금 몇 버전이야?"를 바로 확인해 알려줄 수 있어, 캐시 문제 진단에도 쓴다.
export const APP_VERSION = 'v13.27'
export const APP_TAGLINE = '꼬르곰·펭펭과 레꾸해요'

// 익명 의견 보내기 채널 — 로그인 없이 익명으로 받는 구글 폼(또는 Tally) 링크.
// 설정 → '의견 보내기'가 이 주소를 연다. 비어 있으면 메뉴에 표시되지 않는다.
// ⚠️ 구글 폼 설정에서 '이메일 주소 수집 안 함'을 꼭 꺼야 진짜 익명.
export const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeLsXdCZ-M_m7NW6qC_S4L7TlqHk9Hs7A3O2Iyt15BdQXs0JQ/viewform'

// 🔬 한끼연구소 — 받는 창구를 셋으로 나눴다(창업자 결정 2026-07-30 *"나누자"*).
// 설문·오류는 폼을 만든 뒤 주소를 넣는다. **비어 있으면 그 칸이 화면에 아예 안 나온다**(죽은 버튼 방지).
// ⚠️ 전송은 전부 구글 폼이 한다 — 앱은 아무것도 수집·전송하지 않으므로
//    `public/privacy.html`("어떤 서버로도 전송되지 않습니다")과 Play 데이터 보안 신고를 건드릴 필요가 없다.
//    (근거: `docs/리텐션-설계원칙-2026-07-30.md` "법무 제약 — 방은 앱 안, 전송은 구글 폼이")
// ⚠️ 2026-08-04 교체 — 옛 주소(…Se6a8xGRKM21…)의 폼이 **다른 구글 계정**에 들어 있어서
//    창업자가 응답을 볼 수 없었다(폼 목록에 3개 중 2개만 떴던 이유). 지금 계정 폼으로 갈아끼웠다.
// ⛔ 이 폼의 «보기»는 아래 lab.js SURVEY.items 와 같아야 한다 — 앱 화면에 보기가 먼저 적혀 있어서
//    폼이 다르면 유저가 「앱에서 본 것과 다르다」를 겪는다. (지금 = 주간 식단표 · 새 꾸미기팩 · 매주 새 레시피)
export const LAB_SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfZjqkFewcS5fDPvnYhgXhVKHqn8NkR4oALlSxS14jalKxWpA/viewform'  // 지금 고민 중인 것(설문)
export const LAB_BUG_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf8bMGM8JlYRy0GJm8Lg-153mpPjVCHDkM_-51ruff-9PIcpg/viewform'     // 오류·안 되는 것 신고
// 오류 폼 주소에 `__VER__` 를 넣어두면 앱 버전으로 바뀐 채 열린다.
// (구글 폼 → 오른쪽 위 ⋮ → '미리 채워진 링크 가져오기' 로 만든 주소의 버전 칸에 `__VER__` 를 써두면 된다)

// 📩📩 **인스타 DM — 「가벼운 것」을 받는 넷째 창구** (창업자 확정 2026-09-08)
//   📮 창업자 = *"구글폼이라 응답하면 일일이 눌러봐야해서 너무 귀찮은데.. 인스타 DM으로 받으면 안되나.."*
//      ＋ *"응답이 오는걸 바로바로 알수도 없고 매일매일 구글폼 3개 일일이 열어보는 것도 일이더라고"*
//   ⭐ **폼을 없애는 게 아니다 — 갈래를 나눈다.**
//      · DM  = 「이런 레시피 올려주세요」·레꾸 자랑·이벤트 인증 → 알림이 폰에 «바로» 오고 답장이 된다
//      · 폼  = 불편·버그·만족도 → ⛔익명이라야 나온다. 이름 걸고 「이거 안 돼요」는 부담이 크다
//        (`docs/테스터-피드백-폼.md` = *"나한테 직접 말하기 부담스러운 사람도"* 가 폼을 만든 이유였다)
//   🔢 계정은 지어낸 게 아니라 창업자가 Play 콘솔에 등록한 그 계정이다
//      (`docs/쿠팡-링크-전수-2026-09-05.md:150` = 인스타 https://www.instagram.com/annyeong_hankki/)
//   ⚠️ **익명이 아니다** — 화면에 그렇게 적는다(LabSheet). 모르고 보내게 두지 않는다.
//   ⚠️ `ig.me/m/<계정>` 은 메타가 주는 「DM 바로 열기」 주소다. 인스타가 깔려 있으면 앱이 열리고,
//      아니면 웹 인스타로 간다(로그인 화면일 수 있다). ⛔그래서 **폼을 대신하지 못한다** — 나란히 둔다.
//   ⚠️ 법무는 그대로다 — **앱은 여전히 아무것도 수집·전송하지 않는다.** 주소를 열어줄 뿐이다.
export const INSTAGRAM_ID = 'annyeong_hankki'
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_ID}/`
export const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_ID}`
