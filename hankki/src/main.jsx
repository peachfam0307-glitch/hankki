import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import { StoreProvider } from './store'
import { TimerProvider } from './timer'
import { applyTheme, getTheme } from './theme'
import './styles.css'
// 🪞🍎 아이폰 «앱» 안에서만 — 본체가 «키째» 없으면 문서 폴더의 거울로 되살린다(첫 그리기 «전» · 2026-09-08 큰 틀 5)
import { 거울되살리기, 거울귀기울이기 } from './mirror'

// 저장된 테마 적용(인라인 부팅 스크립트와 동일 결과 — 상태바 색까지 확실히 동기화)
applyTheme(getTheme())

// 실제 '보이는' 화면 높이를 재서 앱 높이(--app-height)로 쓴다.
// 모바일 주소창·제스처바 때문에 100dvh와 실제 보이는 높이가 어긋나
// 하단 버튼(하단바·요리시작·가져오기 등)이 화면 밖으로 잘리던 문제의 근본 해결.
// ⌨️🍎 앱(웹뷰)이 알려준 키보드 높이 — 웹·갤럭시에선 늘 0 이라 아래 계산이 예전과 똑같다.
//   ⛔ 이 값이 필요한 까닭 = 앱 웹뷰는 키보드가 떠도 visualViewport 를 «안 줄인다».
//      그래서 아래 setAppHeight 가 「키보드 없다」로 덮어써 버리면 부품이 알려준 값이 지워진다(실제로 그렇게 된다).
let 앱키보드 = 0

function setAppHeight() {
  const vv = window.visualViewport
  const h = (vv ? vv.height : window.innerHeight) - 앱키보드
  document.documentElement.style.setProperty('--app-height', Math.round(h) + 'px')
  // 키보드가 차지한 높이 — 입력칸 위 '계량 버튼 바'를 키보드 바로 위에 띄우는 데 쓴다.
  //   🍎 앱이면 부품이 알려준 값을 그대로 쓴다 — 웹뷰는 visualViewport 를 안 줄여서 아래 계산이 늘 0 이 된다.
  const kb = 앱키보드 || (vv ? Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0)) : 0)
  document.documentElement.style.setProperty('--kb-inset', Math.round(kb) + 'px')
  // ⌨️🍎 [2026-09-20 · 창업자 제보 「달력 보이는 부분이 키보드 속에 가려」]
  //   ⛔ 위 --kb-inset 은 아이폰에서 못 믿는다 — 사파리는 키보드가 뜨면 페이지를 통째로 민다(offsetTop).
  //      그러면 「창높이 − 보이는높이 − 밀린양」이 키보드를 «작게» 재고, 시트가 그만큼만 올라온다.
  //      📌 창업자 캡처(09-20 18:57) = 주소창이 화면 한가운데까지 내려와 있었다 = 밀렸다는 눈에 보이는 증거.
  //   ⭐ 그래서 «키보드 높이»를 계산하지 않고 «지금 보이는 네모»를 그대로 쓴다.
  //      재는 값이 하나(보이는 네모)라 밀든 안 밀든 같다 — 실패의 «모양»이 바뀐다(규칙 34).
  //   ⚠️ 사파리가 미는 방법이 둘이다 — ⓐ visualViewport.offsetTop ⓑ 문서 스크롤(scrollY).
  //      어느 쪽인지 이 환경에선 못 잰다(아이폰이 없다) → 둘을 «더해서» 덮는다.
  //      우리 앱 틀은 overflow:hidden 이라 평소 scrollY = 0 이다 → 갤럭시·PC 는 0 + 0 = 변화 없음.
  const 밀린양 = vv ? (vv.offsetTop || 0) + (window.scrollY || 0) : 0
  document.documentElement.style.setProperty('--vv-top', Math.round(밀린양) + 'px')
  document.documentElement.style.setProperty('--vv-h', Math.round(h) + 'px')
  // 🔬 ?kb=1 일 때만 — 실제 아이폰에서 어느 값이 움직이는지 눈으로 확인하는 창(유저에겐 안 보인다)
  if (typeof location !== 'undefined' && location.search.includes('kb=1')) {
    let 창 = document.getElementById('kb-probe')
    if (!창) {
      창 = document.createElement('div')
      창.id = 'kb-probe'
      창.style.cssText = 'position:fixed;left:0;top:0;z-index:3400;background:#111;color:#0f0;font:700 12px/1.5 monospace;padding:4px 6px;pointer-events:none'
      document.body.appendChild(창)
    }
    창.textContent = `창${window.innerHeight} 보임${Math.round(h)} offTop${vv ? Math.round(vv.offsetTop || 0) : -1} scrollY${Math.round(window.scrollY || 0)} kb${Math.round(kb)}`
  }
}
setAppHeight()

// ⌨️🍎 [2026-09-20 밤 · 창업자 딸 폰 실물] **앱 안에서는 위 계산이 통째로 안 먹는다.**
//   🔎 왜 = 사파리는 키보드가 뜨면 visualViewport 높이를 줄여 알려주는데, 앱 속 웹뷰는 «아무것도 안 알려준다».
//      그래서 앱은 키보드가 뜬 줄을 모르고, 시트가 화면 맨 아래에 붙어 키보드에 깔린다.
//      📌 22:02 캡처 = 알림 시트의 「괜찮아요」가 키보드 도구줄에 덮여 있었다(사파리에선 멀쩡한 판인데).
//   ✅ 그래서 앱에서는 «부품이 알려주는 키보드 높이»를 그대로 쓴다 — 계산이 아니라 값을 받는 것이다.
//   ⛔ 웹·갤럭시는 이 코드가 아예 안 돈다(부품이 없다) → 한 글자도 안 바뀐다.
function 앱키보드듣기() {
  try {
    const K = window.Capacitor?.Plugins?.Keyboard
    if (!K || !window.Capacitor?.isNativePlatform?.()) return
    // ⭐ 값을 «한 곳»에 넣고 setAppHeight 를 다시 돌린다 — 계산식이 두 벌이 되면 반드시 갈린다(규칙 28).
    const 넣기 = (높이) => { 앱키보드 = Math.max(0, Math.round(높이 || 0)); setAppHeight() }
    K.addListener('keyboardWillShow', (e) => 넣기(e?.keyboardHeight))
    K.addListener('keyboardWillHide', () => 넣기(0))
  } catch { /* 부품이 없어도 앱은 그대로 돈다 */ }
}
앱키보드듣기()

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight)
  window.visualViewport.addEventListener('scroll', setAppHeight)
}
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 200))

function 그리기 () {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      {/* 🛟 울타리는 «맨 바깥»에 — 저장소(StoreProvider)보다 밖이라야 그 안에서 뭐가 터져도 잡는다 */}
      <ErrorBoundary>
        <StoreProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </StoreProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

// 🪞 되살리기 판정은 «첫 그리기 전»에 — 그려 놓고 되살리면 StoreProvider 가 빈 판을 먼저 저장해 거울을 못 쓴다.
//    앱 밖(웹·안드로이드)에선 'skip' 이 바로 와서 그리기가 한 틱만 늦다(눈에 안 보인다).
//    'restored' 면 안에서 새로고침하므로 여기선 안 그린다(깜빡임 한 번이 빈 화면보다 낫다).
Promise.resolve()
  .then(() => 거울되살리기())
  .catch(() => 'skip')
  .then((결과) => { if (결과 !== 'restored') { 그리기(); try { 거울귀기울이기() } catch { /* noop */ } } })

// 📊 [2026-09-08] 이용 통계 — ⛔ 화면을 «그린 뒤에» 켠다(첫 화면을 늦추지 않는다 · 절대원칙 32).
//   ⭐ 안에서 requestIdleCallback 으로 한 번 더 미룬다. measurementId 가 비어 있으면 아무 일도 안 한다.
//   ⛔ 여기서 await 하거나 오류를 위로 던지지 않는다 — 통계가 죽어도 앱은 그대로 돌아야 한다.
import('./stats').then((m) => m.통계시작()).catch(() => {})

// 새 버전 자동 반영 — 새 서비스워커가 활성화되면 페이지를 한 번 새로고침하고,
// 앱을 다시 열 때마다 업데이트를 확인한다. (앱 껐다 켜면 최신으로)
if ('serviceWorker' in navigator) {
  let refreshing = false
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return // 첫 설치 때의 clientsClaim 은 새로고침 안 함
    refreshing = true
    try { sessionStorage.setItem('hankki:updated', '1') } catch { /* noop */ } // 새로고침 후 안내 토스트
    window.location.reload()
  })
  navigator.serviceWorker.ready.then((reg) => {
    const check = () => reg.update().catch(() => {})
    check()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    setInterval(check, 30 * 60 * 1000)
  })
}

// 💾💾 **「이 앱 데이터는 함부로 지우지 마세요」를 브라우저에 요청한다.** (2026-08-19 · 🅱-5)
//   ⭐⭐ 왜 = 창업자 *"저장한거 초기화되면 나같으면 앱지워"* · *"이거 되게 큰거야."*
//      폰 저장 공간이 모자라면 크롬은 «안 쓰는 사이트 데이터»부터 지운다. 그때 우리가 1순위가 될 수 있다.
//      이 한 줄이 켜지면 **우리 데이터를 먼저 지우지 않는다.** 클라우드 저장이 나오기 전까지의 보험이다.
//   ✅ 창업자 폰에서 실물로 확인됨(2026-08-19 · `logintest.html` → `persist: 켜짐 ✅`).
//      ⚠️ 다만 그건 «그 폰 하나»다 — 이 줄이 있어야 **다른 유저 폰에도** 걸린다.
//
//   ⛔⛔ **아무한테나 부르면 안 된다** — 브라우저마다 반응이 다르다.
//      · 크롬(우리 앱·TWA) = 조건이 맞으면 **아무 창도 안 띄우고** 조용히 켜 준다
//      · 파이어폭스 등    = **권한 팝업**을 띄운다 → 웹으로 잠깐 구경 온 사람에게 뜬금없는 창이 뜬다
//   ✅ 그래서 **「앱으로 깔아 쓰는 사람」에게만** 요청한다(홈화면 앱·TWA = `standalone`).
//      ⭐ 데이터가 쌓여서 잃으면 아까운 사람이 정확히 그 사람들이다. 구경 온 사람은 잃을 게 없다.
//   ⛔ 실패해도 아무 일 없다 — 조용히 넘어간다(앱이 깨지는 것보다 안 켜지는 게 낫다).
setTimeout(() => {
  ;(async () => {
    try {
      if (!navigator.storage || !navigator.storage.persist) return
      const installed = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || document.referrer.startsWith('android-app://')
      if (!installed) return
      if (await navigator.storage.persisted()) return   // 이미 켜져 있으면 다시 안 묻는다
      await navigator.storage.persist()
    } catch { /* 안 되는 브라우저도 있다 — 앱은 그대로 돈다 */ }
  })()
}, 4000)
