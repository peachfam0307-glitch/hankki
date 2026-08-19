import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import { StoreProvider } from './store'
import { TimerProvider } from './timer'
import { applyTheme, getTheme } from './theme'
import './styles.css'

// 저장된 테마 적용(인라인 부팅 스크립트와 동일 결과 — 상태바 색까지 확실히 동기화)
applyTheme(getTheme())

// 실제 '보이는' 화면 높이를 재서 앱 높이(--app-height)로 쓴다.
// 모바일 주소창·제스처바 때문에 100dvh와 실제 보이는 높이가 어긋나
// 하단 버튼(하단바·요리시작·가져오기 등)이 화면 밖으로 잘리던 문제의 근본 해결.
function setAppHeight() {
  const vv = window.visualViewport
  const h = vv ? vv.height : window.innerHeight
  document.documentElement.style.setProperty('--app-height', Math.round(h) + 'px')
  // 키보드가 차지한 높이 — 입력칸 위 '계량 버튼 바'를 키보드 바로 위에 띄우는 데 쓴다.
  const kb = vv ? Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0)) : 0
  document.documentElement.style.setProperty('--kb-inset', Math.round(kb) + 'px')
}
setAppHeight()
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight)
  window.visualViewport.addEventListener('scroll', setAppHeight)
}
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 200))

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

// 💳🔁 **미확인 구매 재전송** — 앱을 켤 때마다 한 번. (2026-08-19)
//   ⭐⭐ 「돈 냈는데 못 받는다」를 막는 장치다. 살 때 인터넷이 끊겨 서버에 못 알렸어도
//      구글은 그 구매를 계속 기억하므로 여기서 다시 보내 acknowledge·장수 지급이 따라붙는다.
//   ⛔ 안 하면 공식대로 **3일 뒤 구글이 환불하고 구매를 회수한다**(＝산 사람이 팩을 잃는다).
//   ⭐ 결제를 못 쓰는 기기(웹·구버전 크롬)에선 `listPurchases()` 가 빈 배열이라 **아무 일도 안 일어난다.**
//   ⭐ 서버 결제가 아직 안 켜져 있으면 503 을 받고 조용히 넘어간다(지금이 그 상태다).
//   ⏱ 첫 화면을 늦추지 않도록 그리기가 끝난 뒤로 미룬다.
setTimeout(() => {
  import('./billing')
    .then((m) => m.syncPurchases())
    .catch(() => { /* 결제가 안 되는 것과 앱이 깨지는 것은 다르다 */ })
}, 3000)
