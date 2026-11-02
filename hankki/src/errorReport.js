// ⚠️ 앱 오류 보내기 (운영 2단계 · 2026-11-02 · 창업자 「문제가 발생했을때 즉각대응 · 원인파악이 바로」)
//
// 하는 일 = 앱에서 오류가 «터지면» 꾸러미 하나를 푸시 워커(/error)로 보낸다.
//   꾸러미 = 판 · 기기 갈래 · 보던 화면 · 직전 행동 10개 · 오류 글 · 위치(압축된 줄:칸 → scripts/오류위치풀기.mjs 로 푼다)
//
// ⛔⛔ «켜는 날»이 따로 있다 — `켜짐` 이 false 인 동안은 아무것도 안 보낸다(직전 행동만 폰 메모리에 적는다).
//    켜는 날 = Play 데이터 보안 · 애플 개인정보 · privacy.html 세 곳을 «같은 날» 고치는 날(창업자 결정 · 설계안 §2단계).
//    ⛔ 신고를 고치기 전에 켜면 «신고와 다른 앱»이 된다. 켜는 건 창업자가 「켜」라고 할 때만.
// ⛔ 통계 끄기를 켠 사람 = 안 보낸다 (창업자 결정 3 · 2026-11-02)
// ⛔ 개인 내용은 «담지 않는다» — 글·사진·레시피 제목·메일. 직전 행동은 «화면 이름»과 «누른 것의 종류»(태그·첫 class)뿐.
// ⛔ 이 코드가 터져도 앱은 안 죽는다 — 전부 try 로 감싸고, 보내기는 답을 안 기다린다.
import { APP_VERSION } from './version.js'   // ⛔ .js 를 붙인다 — 재현판이 node 로 직접 불러온다(안 붙이면 스모크 10여 판이 죽는다 · 2026-11-02 실측)
import { todayKST } from './today.js'
// ⛔ stats·ocr·pushSubscribe 를 «위에서» 부르지 않는다 — main 조각이 무거워진다(ocr = tesseract · stats 는 늦게 불러오는 조각)
//    통계 끔은 같은 열쇠를 직접 읽고(stats.js:35 와 같은 값), 앱 열쇠는 보낼 때만 불러온다
const PUSH_URL = 'https://hankki-push.annyeong-hankki.workers.dev'   // pushSubscribe.js:16 · sw.js:173 과 같은 값
const 통계꺼짐 = () => { try { return localStorage.getItem('hankki:stats:off') === '1' } catch { return true } }

export const 켜짐 = false   // ⛔ 켜는 날에만 true (위 참고)

const 직전 = []   // 최근 10개 — 폰 메모리에만(저장 안 함)
export function 행동적기(무엇) {
  try { 직전.push(String(무엇).slice(0, 60)); if (직전.length > 10) 직전.shift() } catch { /* 무시 */ }
}

let 보던화면 = ''
export function 화면적기(이름) { 보던화면 = String(이름 || ''); 행동적기(`화면:${보던화면}`) }

function 기기() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return 'ios'
    if (document.referrer.startsWith('android-app://') || matchMedia('(display-mode: standalone)').matches) return 'android'
  } catch { /* 무시 */ }
  return 'web'
}

// 같은 오류는 하루 3번까지만 보낸다(폰 하나 기준) — 고장 난 화면에서 계속 터져도 워커가 안 넘친다
function 오늘몇번(지문) {
  try {
    const 날 = todayKST()
    const 칸 = JSON.parse(localStorage.getItem('hankki:err:cnt') || '{}')
    const 오늘 = 칸.날 === 날 ? 칸 : { 날 }
    오늘[지문] = (오늘[지문] || 0) + 1
    localStorage.setItem('hankki:err:cnt', JSON.stringify(오늘))
    return 오늘[지문]
  } catch { return 1 }
}

export function 오류보내기(err, 종류 = 'error') {
  try {
    if (!켜짐 || 통계꺼짐()) return false
    const 메시지 = String(err?.message || err || '').slice(0, 300)
    const 위치 = String(err?.stack || '').split('\n').slice(0, 8).join('\n').slice(0, 1500)
    if (오늘몇번(`${종류}|${메시지}`.slice(0, 120)) > 3) return false
    const 몸 = JSON.stringify({ 판: APP_VERSION, 기기: 기기(), 화면: 보던화면, 종류, 메시지, 위치, 직전: [...직전] })
    import('./ocr.js').then(({ OCR_APP_TOKEN }) => fetch(`${PUSH_URL}/error`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }, body: 몸 })).catch(() => {})
    return true
  } catch { return false }
}

/** 앱 시작에 한 번 — 잡히지 않은 오류 · 놓친 약속(promise) · 누른 것의 종류 */
export function 오류받기시작() {
  try {
    window.addEventListener('error', (e) => 오류보내기(e.error || e.message, 'error'))
    window.addEventListener('unhandledrejection', (e) => 오류보내기(e.reason, 'promise'))
    document.addEventListener('click', (e) => {
      const t = e.target?.closest?.('button, a, [role="button"]')
      if (t) 행동적기(`누름:${t.tagName.toLowerCase()}.${String(t.className || '').split(' ').filter((c) => c && c !== 'press')[0] || ''}`)
    }, { capture: true, passive: true })
  } catch { /* 무시 */ }
}
