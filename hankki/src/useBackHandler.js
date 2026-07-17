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

// 모달·시트 전용 — 이 컴포넌트가 떠 있는 동안 안드로이드 뒤로가기(버튼·제스처)를 가로채
// close() 로 닫는다. 조건부 렌더(마운트=열림)라 마운트 동안만 등록된다.
// 나중에 뜬 시트가 위 레이어라 먼저 닫힌다(App 의 registerBack 이 최근 등록부터 물어봄).
export function useModalBack(close) {
  const nav = useNav()
  const ref = useRef(close)
  ref.current = close
  useEffect(() => {
    if (!nav?.registerBack) return undefined
    return nav.registerBack(() => {
      if (typeof ref.current !== 'function') return false // 닫기 함수 없으면 소비하지 않음(먹통 방지)
      ref.current()
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
