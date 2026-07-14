import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
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
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
  document.documentElement.style.setProperty('--app-height', Math.round(h) + 'px')
}
setAppHeight()
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight)
}
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 200))

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </StoreProvider>
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
