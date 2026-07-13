import { useEffect, useRef } from 'react'
import { useNav } from './App'

// 화면이 '뒤로가기'를 먼저 가로채도록 등록한다.
// handler() 가 true 를 반환하면 그 뒤로가기는 소비됨(내부 상태만 닫고 화면은 유지).
// false 면 기본 동작(열린 화면 닫기 → 홈 → 종료 확인)으로 넘어간다.
// 가장 최근에 등록된(=가장 위 레이어) 핸들러만 먼저 물어본다.
export function useBackHandler(handler) {
  const nav = useNav()
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!nav?.registerBack) return undefined
    return nav.registerBack(() => ref.current())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
