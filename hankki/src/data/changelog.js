// 📣 «배포로 바뀐 것» — 버전마다 유저 말 «한 줄» (2026-09-17 신설 · 창업자 «②로 가자»)
//
// 📮 창업자 2026-09-17 = *"우리 업데이트 일지 유저들에게 알려줘야하는거 아닐까? 어떤 기능이 업데이트가 되었는지.."*
//    ＋ 아이폰 세션 전달 = *"ASC용 「이 버전의 새로운 기능」 문구도 같은 changelog에서 뽑을 수 있게
//       버전별로 유저 말 한 줄씩 적어달라고. 그럼 내가 밤에 그대로 가져다 써."*
//
// 🌲 왜 생겼나 — `whatsnew.js` 는 «날짜가 여는 문»(레시피·꾸미기·카드·장바구니)만 봤다.
//    «배포로 열리는 것»은 `APP_FEATURES` 에 손으로 적어야 했는데 **8/29 살구 배경 하나 넣고 그 뒤 0건.**
//    🔢 실측 = 8/29 v11.80 → 9/17 v13.65 = **185판**이 나갔는데 유저는 한 줄도 못 들었다.
//    📌 손으로 적는 목록은 반드시 낡는다 — 그래서 **안 적으면 배포가 죽게** 했다(`scripts/check-changelog.mjs`).
//
// ⭐ 이 파일 한 곳이 «두 곳»을 먹인다 (⛔두 곳에 따로 적으면 한쪽이 낡는다)
//    ① 앱 「한끼 소식」 → 「방금 열렸어요」 칸에 「앱이 달라졌어요 · 업데이트 N종」 한 카드로 접혀 뜬다
//       (`whatsnew.js` `updateOpened` · `FRESH_DAYS` 21일 지나면 저절로 빠진다 · 살구 배경과 같은 층)
//    ② App Store Connect 「이 버전의 새로운 기능」 → `node scripts/changelog.mjs --asc --from vX` 로 뽑아 복붙
//
// 📐 한 줄의 꼴
//    { v: 'v13.65', when: '2026-09-17', user: '고친 레시피가 이제 폰에도 와요', who: '창업자', asc: true }
//    · `v`     = `src/version.js` 의 APP_VERSION 그대로 (⛔중복 금지 — 게이트가 죽는다)
//    · `when`  = 배포한 날(KST · YYYY-MM-DD). ⛔`git log` 는 UTC 다 — 9/16 밤 「09:56」이 실제 18:56 KST 였다
//    · `user`  = 유저가 읽는 한 줄. **유저 눈에 안 보이는 판**(게이트·문서·계측)이면 `null`
//    · `who`   = 문장의 주인. `user` 가 있으면 **'창업자' 만 통과** — 클로드가 지은 문장은 못 나간다
//                (`check-benefitwho` 와 같은 결 · 창업자 절대원칙 2026-09-15 「설명을 지어내지 않는다」)
//    · `asc`   = ASC 「새로운 기능」에도 실을 줄이면 true (안드로이드에만 있는 기능은 false)
//
// ⛔ 이 파일은 «맨 node» 로 읽힌다(게이트·뽑기 명령) — Vite 전용 import(`import.meta.glob`·PNG)를 넣지 말 것.
// ⛔ UI 에 유니코드 이모지 금지(절대원칙) — `user` 문장에 이모지를 넣지 말 것.
// 🗄 90일 지난 «null 줄»은 `node scripts/changelog.mjs --보관` 이 `docs/changelog-보관.md` 로 옮긴다(번들을 안 키운다).
//    ⛔ user 있는 줄은 «안» 옮긴다 — 설정 「업데이트 내역」이 전부를 보여준다(창업자 2026-09-17).
//
// ⭐ 아래 12줄(9/1 ~ 9/17)은 2026-09-17 창업자가 표를 보고 «다 ㄱ» 한 소급분이다.
//    ⛔ 살구 배경(8/29)은 `whatsnew.js` `APP_FEATURES` 에 이미 있어 여기 다시 적지 않는다.
export const CHANGELOG = [
  { v: 'v13.66', when: '2026-09-17', user: '한끼 소식에서 무엇이 바뀌었는지 볼 수 있어요', who: '창업자', asc: true },   // 창업자 «그대로 ㄱㄱ»
  { v: 'v13.65', when: '2026-09-17', user: '고친 레시피가 이제 폰에도 와요', who: '창업자', asc: true },
  { v: 'v13.63', when: '2026-09-16', user: null },   // 연구소 설문 열린 물음 — 9/16 표에서 v13.60 줄 하나로 묶었다
  { v: 'v13.62', when: '2026-09-16', user: null },
  { v: 'v13.61', when: '2026-09-16', user: null },
  { v: 'v13.60', when: '2026-09-16', user: '레시피 셋을 다시 손봤어요', who: '창업자', asc: true },
  { v: 'v13.54', when: '2026-09-16', user: '고른 재료만 장보기에 담아요', who: '창업자', asc: true },
  { v: 'v13.53', when: '2026-09-15', user: '재료 링크가 훨씬 많이 붙어요', who: '창업자', asc: true },
  { v: 'v13.51', when: '2026-09-15', user: null },   // 자르기 안내 — 위 줄에 묶음
  { v: '아이폰 1.0', when: '2026-09-15', user: '아이폰에서도 만나요', who: '창업자', asc: false },
  { v: 'v13.47', when: '2026-09-14', user: '레시피 탭에서 종류로 먼저 걸러요', who: '창업자', asc: true },
  { v: 'v13.16', when: '2026-09-11', user: '냉장고 재료 고르기가 깔끔해졌어요', who: '창업자', asc: true },
  { v: 'v13.06', when: '2026-09-10', user: '홈에 추석 장식이 걸렸어요', who: '창업자', asc: true },
  { v: 'v13.00', when: '2026-09-09', user: '같은 사진은 열쇠를 안 써요', who: '창업자', asc: true },
  { v: 'v12.88', when: '2026-09-08', user: '핀을 누르면 해볼 것에서 최애로 돌아요', who: '창업자', asc: true },
  { v: 'v12.79', when: '2026-09-08', user: '재료를 바로 사러 갈 수 있어요', who: '창업자', asc: true },
  { v: 'v12.76', when: '2026-09-08', user: 'AI 다듬기, 앱을 닫아도 끝까지 해둬요', who: '창업자', asc: true },
  { v: 'v12.10', when: '2026-09-01', user: '음식 그림이 새 얼굴로 바뀌었어요', who: '창업자', asc: true },
]

export const UPDATE_KIND = '업데이트'

// 📣 [창업자 2026-09-17] «두 자리»로 갈랐다 —
//    · 「한끼 소식」 = updateLines(today, 21) 중 **최신 한 줄만** (도배 방지 · 21일 지나면 빠짐)
//    · 「설정 → 업데이트 내역」 = allUserLines() **전부** · 날짜별 (창이 없다 · 지난 것도 안 사라진다)
//    ⛔ 그래서 --보관 은 «user 있는 줄»은 안 옮긴다 — 설정 목록이 잘린다. null 줄(게이트용)만 90일 지나면 내린다.
export function allUserLines() {
  return CHANGELOG.filter((c) => c.user).sort((a, b) => b.when.localeCompare(a.when))
}

// 「방금」 창 안에 든 «유저 줄»만 — 최신이 위. `today` 는 KST 'YYYY-MM-DD'.
export function updateLines(today, freshDays) {
  const ms = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
  return CHANGELOG
    .filter((c) => c.user && c.when <= today && ms(c.when, today) <= freshDays)
    .sort((a, b) => b.when.localeCompare(a.when))
}
