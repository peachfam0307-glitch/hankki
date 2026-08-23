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
