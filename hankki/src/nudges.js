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

export const shouldAskReview = (diaryN) => diaryN === REVIEW_AT && read(K_REVIEW) !== '1'
export const markReviewAsked = () => write(K_REVIEW, '1')

// 스토어 리뷰 주소 — 패키지명은 `CLAUDE.md` 고정 메모 기준.
export const STORE_URL = 'https://play.google.com/store/apps/details?id=io.github.peachfam0307_glitch.twa'
