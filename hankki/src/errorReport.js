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

export const 켜짐 = true   // ✅ 2026-11-05 창업자 「켜자」 — Play 데이터 보안·ASC 진단 신고 «뒤에» 켬 · 방침 6-2·8-바 같은 판

const 직전 = []   // 최근 10개 — 폰 메모리에만(저장 안 함)
export function 행동적기(무엇) {
  try { 직전.push(String(무엇).slice(0, 60)); if (직전.length > 10) 직전.shift() } catch { /* 무시 */ }
}

let 보던화면 = ''
export function 화면적기(이름) { 보던화면 = String(이름 || ''); 행동적기(`화면:${보던화면}`) }

function 기기() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return 'ios'
    // ⛔ 「홈 화면에 설치」만으로 갤럭시라 하지 않는다 — 아이폰 사파리·컴퓨터 설치판도 standalone 이다(2026-11-02 검토)
    if (document.referrer.startsWith('android-app://') || (/Android/i.test(navigator.userAgent) && matchMedia('(display-mode: standalone)').matches)) return 'android'
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
    // ⛔ 따옴표 안은 가린다 — 크롬 JSON.parse 오류는 «입력 앞부분»(레시피 글·붙여넣은 글)을 메시지에 싣는다(2026-11-02 검토)
    const 메시지 = String(err?.message || err || '').replace(/"[^"]*"/g, '"…"').replace(/'[^']{12,}'/g, "'…'").slice(0, 300)
    const 위치 = String(err?.stack || '').split('\n').slice(0, 8).join('\n').slice(0, 1500)
    // 📦 [2026-11-06] 바로 보내지 않고 «2초 모아» 한 번에 — 11/6 02:29 한 폰이 2초에 17번 보내 받는 쪽(KV)이 429 로 튕겼다
    //    같은 오류는 묶음 안에서 «몇번»만 늘린다 · 앱을 켜서 끌 때까지 최대 20가지(세션 상한)
    const 같은것 = 대기.find((x) => x.종류 === 종류 && x.메시지 === 메시지)
    if (같은것) { 같은것.몇번++; return true }
    if (오늘몇번(`${종류}|${메시지}`.slice(0, 120)) > 3) return false
    if (보낸수 >= 세션상한) return false
    보낸수++
    대기.push({ 판: APP_VERSION, 기기: 기기(), 화면: 보던화면, 종류, 메시지, 위치, 직전: [...직전], 몇번: 1 })
    if (!타이머) 타이머 = setTimeout(내보내기, 2000)
    return true
  } catch { return false }
}

const 대기 = []
let 타이머 = null
let 보낸수 = 0
const 세션상한 = 20
function 내보내기() {
  타이머 = null
  try {
    const 묶음 = 대기.splice(0, 대기.length)
    if (!묶음.length) return
    const 몸 = JSON.stringify({ 묶음 })
    import('./ocr.js').then(({ OCR_APP_TOKEN }) => fetch(`${PUSH_URL}/error`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }, body: 몸 })).catch(() => {})
  } catch { /* 무시 */ }
}

/** 앱 시작에 한 번 — 잡히지 않은 오류 · 놓친 약속(promise) · 누른 것의 종류 */
export function 오류받기시작() {
  try {
    // 🖼 그림을 못 불러온 것도 «error» 로 온다(바깥 자원 오류 · 잡으려면 capture) — 오류 글이 비어서 따로 갈라 보낸다
    //    ⛔ 유저 사진(data:·blob:)은 주소를 안 싣는다 — 우리 그림 주소만(파일 이름까지)
    window.addEventListener('error', (e) => {
      const t = e.target
      if (t && t !== window && t.tagName) {
        // 🖼 그림·스크립트·글씨체 같은 «자원» 못 불러옴 — 오류 글이 비어 있으니 우리가 이름을 붙인다
        //   ⛔ 우리 사이트의 /assets/ 주소만 싣는다 — 남의 주소(레시피 썸네일·SNS)는 «어떤 레시피를 담았나»가 드러나서 고정 글로(2026-11-02 검토)
        if (t.tagName !== 'IMG' && t.tagName !== 'SCRIPT' && t.tagName !== 'LINK') return
        const 주소 = String(t.currentSrc || t.src || t.href || '')
        if (!주소 || /^(data|blob):/.test(주소)) return
        let 우리것 = ''
        try { const u = new URL(주소, location.href); if (u.origin === location.origin && u.pathname.includes('/assets/')) 우리것 = u.pathname.replace(/^.*\/assets\//, 'assets/').slice(-120) } catch { /* 무시 */ }
        // 🌐 [2026-11-06] 남의 사이트 그림(SNS 썸네일·링크 미리보기)을 못 불러온 건 «보고 안 한다» — 우리 고장이 아니고, 레시피가 많으면 한꺼번에 수십 개가 터진다
        if (!우리것) return
        // 🔁 [창업자 2026-11-11 「조치해볼래」] 우리 그림은 «한 번 더» 불러본다 — 잠깐 끊긴 거면 유저 화면 빈칸이 저절로 메워진다.
        //    다시 해도 안 될 때만 보고하고, 그때 인터넷이 켜져 있었는지를 같이 싣는다(원인 가르기).
        if (t.tagName === 'IMG' && !t.dataset.한번더) {
          t.dataset.한번더 = '1'
          const 원주소 = t.getAttribute('src') || 주소
          setTimeout(() => { try { t.src = 원주소 + (원주소.includes('?') ? '&' : '?') + 'r=1' } catch { /* 무시 */ } }, 1500)
          return
        }
        const 인터넷 = navigator.onLine === false ? ' · 인터넷 꺼짐' : ' · 인터넷 켜짐'
        // 🖼 우리 그림 여러 장이 한꺼번에 안 뜨면(인터넷 끊김 등) «한 가지»로 묶는다 — 파일 이름은 위치 칸에
        return 오류보내기({ message: `${t.tagName === 'IMG' ? '그림' : '자원'} 못 불러옴(다시 해도)${인터넷}`, stack: 우리것 }, t.tagName === 'IMG' ? '그림' : '자원')
      }
      오류보내기(e.error || e.message, 'error')
    }, true)
    // 💾 저장 실패(서랍 가득) — store.jsx 가 이미 알리는 신호를 그대로 받는다(store.jsx:1559)
    window.addEventListener('hankki:storagefull', () => 오류보내기({ message: '저장 실패(폰 서랍 가득)' }, '저장실패'))
    window.addEventListener('unhandledrejection', (e) => 오류보내기(e.reason, 'promise'))
    document.addEventListener('click', (e) => {
      const t = e.target?.closest?.('button, a, [role="button"]')
      if (t) 행동적기(`누름:${t.tagName.toLowerCase()}.${String(t.className || '').split(' ').filter((c) => c && c !== 'press')[0] || ''}`)
    }, { capture: true, passive: true })
  } catch { /* 무시 */ }
}

/** ✉️ 「도움말 및 문의」 메일 아래에 붙일 꾸러미 — 유저가 «직접» 보내는 메일이라 켜짐과 무관하다(보기 전에 지울 수 있다)
 *  ⛔ 개인 내용 없음 — 판 · 기기 · 보던 화면 · 직전 행동(화면 이름·누른 것의 종류)뿐 */
export function 문의꾸러미() {
  try {
    return [
      '', '', '───────────',
      '▼ 문제를 빨리 찾도록 자동으로 붙은 정보예요 (그대로 보내 주세요)',
      `앱 버전 ${APP_VERSION} · ${{ ios: '아이폰', android: '갤럭시', web: '웹' }[기기()] || 기기()}`,
      `확인용 기록: ${보던화면 || '-'} / ${직전.slice(-6).join(' > ') || '-'}`,
    ].join('\n')
  } catch { return '' }
}
