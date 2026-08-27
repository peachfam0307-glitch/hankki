// 한 번만 뜨는 안내(넛지)의 '봤음' 기억.
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · 평가하지 않는다 (점수·달성률·"잘했어요" 금지)
//    · 재촉하지 않는다 (한 번 닫으면 다시 묻지 않는다)
//    · 겁주지 않는다 (공포 마케팅은 신뢰를 깎는다 — 쌓였다는 사실 + 다음 행동만)
//
// localStorage 를 못 쓰는 환경(사파리 프라이빗 등)에서도 앱이 안 죽게 전부 try 로 감싼다.
// 못 읽으면 "안 봤음"이 되어 안내가 한 번 더 뜰 뿐, 기능은 그대로 돌아간다.

const K_BACKUP = 'hankki:nudge:backup' // 마지막으로 닫았거나 실제로 백업한 문턱
const K_REVIEW = 'hankki:nudge:review' // '1' = 한 번 물어봤음 (거절 포함)
const K_OPENBK = 'hankki:nudge:openBackup' // 설정 화면에 도착하면 백업 시트를 바로 열라는 쪽지

const read = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k, v) => { try { localStorage.setItem(k, v) } catch { /* 저장 못 해도 앱은 돈다 */ } }
const drop = (k) => { try { localStorage.removeItem(k) } catch { /* noop */ } }

// ─────────────────────────────────────────────────────────────
// 백업 유도 — 레시피가 쌓였을 때 딱 두 번(5개·15개)만 조용히 권한다.
//
// 왜 필요한가: 우리는 데이터를 기기에만 저장한다(`public/privacy.html`).
// 앱을 지우거나 브라우저 데이터를 비우면 레시피가 전부 사라진다.
// `docs/출시전-법무체크.md` §4가 "백업/내보내기를 눈에 띄게 안내"를 이미 요구하는데,
// 지금 안내는 설정 첫 방문 코치마크 한 번 + 저장공간 꽉 찼을 때 토스트뿐이었다.
// ─────────────────────────────────────────────────────────────
export const BACKUP_STEPS = [5, 15]

// ⭐⭐ 「내 것」만 센다 — 기본 레시피는 빼고. (창업자 제보 2026-08-03)
//   *"설치한 사람 사진인데 «레시피 50개가 쌓였어요»는 뭐지?ㅡㅡ"*
//   기본 레시피 50편이 통째로 세어져서 **깔자마자 문턱 15를 넘겨** 백업하라고 떴다.
//   ⛔ 두 가지가 다 틀렸다 — ①아직 백업할 게 없다 ②「50개 쌓였어요」는 사실이 아니다(우리가 넣은 것).
//   ✅ 백업은 «잃으면 아까운 것»이 있을 때 권한다 =
//      ⒜내가 가져온 레시피 ⒝기본이라도 내가 «꾸민» 것 ⒞내가 «고친» 것.
//      기본 레시피는 앱을 다시 깔면 그대로 돌아오니 아깝지 않다.
//   📌 세는 곳이 둘이면 «문구의 숫자»와 «뜨는 문턱»이 어긋난다 → 여기 한 곳에서만 센다.
//   ⚠️ 「우리가 꾸며서 준 것」은 빼야 한다 — 레꾸 샘플 나시고랭(`basic-nasigoreng`)은
//      처음부터 표지가 꾸며진 채로 온다. 안 빼면 갓 깐 사람 화면에도 1 이 세어진다.
const SEED_DECORATED = new Set(['basic-nasigoreng'])

export const myRecipeCount = (recipes = []) =>
  recipes.filter((r) => {
    if (!r) return false
    if (!String(r.id || '').startsWith('basic-')) return true      // 내가 가져오거나 직접 쓴 것
    if (r.touched) return true                                      // 기본인데 내가 고친 것
    if (SEED_DECORATED.has(r.id)) return false                      // 우리가 꾸며서 준 것
    return (Array.isArray(r.decor) && r.decor.length > 0) || (r.decorBg && r.decorBg !== 'none')
  }).length

/** 지금 띄울 문턱을 돌려준다. 0 이면 띄우지 않는다. */
export function backupNudgeStep(recipeN) {
  const done = Number(read(K_BACKUP) || 0)
  const hit = BACKUP_STEPS.filter((s) => recipeN >= s && s > done)
  return hit.length ? hit[hit.length - 1] : 0
}

/** 닫기(X) — 그 문턱은 다시 안 뜬다. 다음 문턱에서 한 번 더. */
export const dismissBackupNudge = (step) => write(K_BACKUP, String(step))

/** 실제로 백업했으면 남은 문턱까지 전부 끝낸다 — 이미 한 사람에게 또 권하지 않는다. */
export const backupDone = () => write(K_BACKUP, String(BACKUP_STEPS[BACKUP_STEPS.length - 1]))

// 홈 → 설정으로 보낼 때 "가서 백업 시트 열어줘"를 전달한다.
// (`nav.go(tab)` 은 인자를 못 받아서 쪽지로 넘긴다. 읽는 쪽이 바로 지운다.)
export const askOpenBackup = () => write(K_OPENBK, '1')
export function takeOpenBackup() {
  const on = read(K_OPENBK) === '1'
  if (on) drop(K_OPENBK)
  return on
}

// ─────────────────────────────────────────────────────────────
// 리뷰 요청 — 요리 기록 3번째를 남긴 직후 딱 한 번.
//
// 왜 3번째인가: 세 번 해먹은 사람은 진짜 쓰는 사람이라 별점이 높고,
// 요리를 막 끝낸 순간이 가장 기분 좋은 자리다("오늘도 해냈어요" 바로 다음).
// ⛔ "별점 5개 부탁드려요" 금지 — 별점을 구걸하면 브랜드가 싸구려가 된다.
// ⛔ 한 번 거절하면 다시 묻지 않는다.
// ─────────────────────────────────────────────────────────────
export const REVIEW_AT = 3

// ⚠️ 「딱 3번째」가 아니라 «3번째부터»다.
//    예전엔 「만들었어요」를 누른 «그 순간»에 물었으니 숫자가 정확히 3을 지나갔다.
//    2026-08-06 부터 「만들었어요」는 토스트만 띄우고(창업자 확정 ①),
//    묻는 자리는 «기록을 직접 열었다 닫는 순간»으로 옮겼다 — 그땐 이미 4개일 수 있다.
//    === 로 두면 그 사람에겐 영영 안 물어보게 된다.
//    (한 번 물으면 K_REVIEW 가 막으니 >= 로 둬도 두 번 묻지 않는다)
export const shouldAskReview = (diaryN) => diaryN >= REVIEW_AT && shouldAskReviewNow()
export const markReviewAsked = () => write(K_REVIEW, '1')

// 🎴🎴 [창업자 확정 2026-08-27 = ㉠] 레꾸자랑을 «실제로 보낸» 순간에도 청한다.
//
// 📮 창업자 = *"우리 리뷰자동으로띄우는거 만들어야해. **사람들이 쓰다가 리뷰쓰게끔.**"*
//    → *"해먹으리에서 갑자기 리뷰가 뜨더라고"* → 자리 판정 = **㉠(레꾸자랑 공유 직후)**
//
// ⛔⛔ **왜 필요했나 = 위 `shouldAskReview` 로 가는 문이 «사실상 닫혀 있었다».**
//    실측(`scripts/_repro-리뷰띄우기-0827.mjs` 7/7) = 리뷰창까지 가려면 다섯을 다 밟아야 한다 —
//    ⑴기록 3장 ⑵그 레시피에 한 줄을 «직접 써넣기» ⑶그 상세로 가기 ⑷포스트잇 «누르기» ⑸시트 «닫기».
//    그런데 「만들었어요」가 만드는 기록은 **메모가 빈 칸**(`note: ''`)이라 ⑵가 저절로는 절대 안 채워지고,
//    `MemoNote` 가 null 을 돌려줘 **문 자체가 안 생긴다.** → 보통 유저에겐 **영영 안 떴다.**
//
// ⛔ 「만들었어요」 직후에는 못 둔다 — **창업자 확정 2026-08-06 「토스트만, 시트 안 뜬다」**.
//    그 자리를 이 시트가 물려받으면 마찰이 하나도 안 줄어든다(`RecipeDetailScreen.jsx` 760줄 주석).
//
// ⭐ 그래서 공유다 — **자랑 카드를 친구에게 «보낸» 사람은 이미 이 앱을 좋다고 말한 사람**이다.
//    게다가 「레꾸자랑 탭 → 레시피 고르기 → 카드 기다리기 → 공유창 → 받을 사람 고르기」
//    다섯을 스스로 밟아야 도달한다. **문턱이 이미 충분히 높아서 횟수를 더 세지 않는다(첫 공유부터).**
//    ⚠️ 너무 이르다 싶으면 여기 한 줄에 「N번째부터」를 넣으면 된다 — 자리는 안 바뀐다.
//
// ⛔ 「리뷰를 쓰면 열쇠 1개」 같은 걸 **여기 붙이지 말 것** — 정책 위반이고 «앱 자체»가 조치받는다
//    (말뚝 2026-08-22 · `docs/바깥갈래-ABCD-조사-2026-08-22.md`).
export const shouldAskReviewNow = () => read(K_REVIEW) !== '1'

// 스토어 리뷰 주소 — 패키지명은 `CLAUDE.md` 고정 메모 기준.
export const STORE_URL = 'https://play.google.com/store/apps/details?id=io.github.peachfam0307_glitch.twa'

// ─────────────────────────────────────────────────────────────
// 🎁 출시기념 팩 안내 — 꾸미기 서랍을 열면 «딱 한 번».
//
// 왜 여기냐: 팩은 꾸미기 서랍 안에 있다. **선물은 받는 자리에서 알려줘야** 바로 써본다.
// (홈에 띄우면 "그게 어디 있는데?"가 되고, 찾다 지치면 안 쓴다)
//
// ⛔ 설계원칙(`docs/리텐션-설계원칙-2026-07-30.md`)
//    · 「축하합니다!」·뱃지·트로피 없음 — 우리는 게임이 아니라 다이어리 문법
//    · 닫으면 다시 안 뜬다 (재촉하지 않는다)
//    · 캐릭터는 한 마디만
// ─────────────────────────────────────────────────────────────
const K_GIFT = 'hankki:nudge:giftpack' // '1' = 한 번 보여줬음(닫기·구경하기 둘 다 포함)

/** 출시기념 팩 안내를 아직 안 봤나? */
export const needsGiftPack = () => read(K_GIFT) !== '1'
/** 봤음으로 표시 — 어떻게 닫아도 다시 안 뜬다. */
export const markGiftPackSeen = () => write(K_GIFT, '1')
