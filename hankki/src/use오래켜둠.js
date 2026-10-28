import { useEffect, useRef } from 'react'
import { 오래켜둠 } from './stats'

// ⏱⏱ 「이 화면을 5분 넘게 «앞에 두고» 있었나」 — 2026-09-14
//
// 📮 창업자 = *"레시피상세 51초면 요리를 안했다는건데"* · *"레시피상세에서 5분넘게 켜두는 것도 보고 만드는 거야"*
//
// ⛔⛔ 「요리한 사람」이 아니다 — **「5분 넘게 켜 둔 사람」**이다.
//    레시피를 꼼꼼히 읽기만 한 사람도 섞인다. 그래서 `cook_done` 과 이름을 다르게 뒀다.
//
// 🔎 잣대를 GA4 와 «같게» 맞췄다 — GA4 참여 시간은 「화면이 앞에 있을 때」만 쌓인다(상호작용 불필요).
//    https://www.analyticsmania.com/post/user_engagement-event-in-google-analytics-4/ (열람 2026-09-14)
//
// ⛔ 막은 함정 셋 (설계 게이트 2026-09-14)
//   ⓐ 재료 사러 나갔다 30분 뒤 돌아오면? → 뒤로 간 동안은 «안» 쌓는다(visibilitychange 로 멈춘다)
//   ⓑ 상세 → 요리모드로 넘어가면 두 번 세지나? → 화면당 «한 번»만 보낸다(보냈나 깃발)
//   ⓒ 화면을 떠난 뒤에도 타이머가 살아 잘못 보내나? → 정리(cleanup)에서 반드시 끈다
//
// ⭐ 두 화면 다 화면 꺼짐 방지가 걸려 있어(useWakeLock) 폰을 세워 두고 요리해도 시간이 쌓인다.
const 오분 = 5 * 60 * 1000

export function 오래켜둠재기(자리) {
  const 쌓인시간 = useRef(0)
  const 켜진때 = useRef(0)
  const 보냈나 = useRef(false)
  const 타이머 = useRef(null)

  useEffect(() => {
    // ⛔ 화면이 «뒤로» 간 상태로 들어올 수도 있다 — 앞에 있을 때만 시작한다.
    const 앞인가 = () => document.visibilityState === 'visible'

    const 멈춘다 = () => {
      if (켜진때.current) { 쌓인시간.current += Date.now() - 켜진때.current; 켜진때.current = 0 }
      if (타이머.current) { clearTimeout(타이머.current); 타이머.current = null }
    }
    const 간다 = () => {
      if (보냈나.current || 켜진때.current) return
      켜진때.current = Date.now()
      const 남은 = 오분 - 쌓인시간.current
      if (남은 <= 0) { 보낸다(); return }
      타이머.current = setTimeout(보낸다, 남은)
    }
    function 보낸다() {
      if (보냈나.current) return
      보냈나.current = true
      멈춘다()
      try { 오래켜둠(자리) } catch { /* 통계가 죽어도 화면은 그대로 돈다 */ }
    }

    const onVis = () => { if (앞인가()) 간다(); else 멈춘다() }
    if (앞인가()) 간다()
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); 멈춘다() }
  }, [자리])
}
