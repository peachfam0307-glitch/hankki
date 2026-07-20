// 앱 버전 — 배포마다 숫자를 올린다. 설정 화면 맨 아래에 표시되고,
// 새 버전으로 업데이트되면(서비스워커 교체 → 새로고침) 안내 토스트를 띄우는 기준이 된다.
// 사용자가 "지금 몇 버전이야?"를 바로 확인해 알려줄 수 있어, 캐시 문제 진단에도 쓴다.
export const APP_VERSION = 'v8.0'
export const APP_TAGLINE = '흩어진 레시피를, 한곳에.'

// 익명 의견 보내기 채널 — 로그인 없이 익명으로 받는 구글 폼(또는 Tally) 링크.
// 설정 → '의견 보내기'가 이 주소를 연다. 비어 있으면 메뉴에 표시되지 않는다.
// ⚠️ 구글 폼 설정에서 '이메일 주소 수집 안 함'을 꼭 꺼야 진짜 익명.
export const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeLsXdCZ-M_m7NW6qC_S4L7TlqHk9Hs7A3O2Iyt15BdQXs0JQ/viewform'
