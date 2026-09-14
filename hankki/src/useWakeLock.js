import { useEffect, useRef } from 'react'

// 화면이 꺼지지 않게 유지 (Screen Wake Lock).
// 레시피를 보며·요리하며 손에 물이 묻어 화면을 못 만질 때 꺼지지 않도록.
// 지원 안 하는 브라우저는 조용히 무시하고, 다른 앱 갔다 돌아오면 다시 요청한다.
export function useWakeLock(active = true) {
  const ref = useRef(null)
  useEffect(() => {
    if (!active) return
    let stopped = false
    const req = async () => {
      try {
        if ('wakeLock' in navigator) ref.current = await navigator.wakeLock.request('screen')
      } catch { /* noop */ }
    }
    req()
    const onVis = () => { if (document.visibilityState === 'visible' && !stopped) req() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVis)
      try { ref.current?.release() } catch { /* noop */ }
    }
  }, [active])
}
