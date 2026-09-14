import { useEffect, useRef } from 'react'
import { useNav } from './App'

// 화면이 '뒤로가기'를 먼저 가로채도록 등록한다.
// handler() 가 true 를 반환하면 그 뒤로가기는 소비됨(내부 상태만 닫고 화면은 유지).
// false 면 기본 동작(열린 화면 닫기 → 홈 → 종료 확인)으로 넘어간다.
// 가장 최근에 등록된(=가장 위 레이어) 핸들러만 먼저 물어본다.
// opts.tabLevel=true 로 등록하면, 위에 스택 화면(상세·요리 등)이 있을 때 이 핸들러는 잠재워진다.
// (탭 화면의 필터·세그먼트 같은 '항상 마운트된' 상태가 스택 화면의 뒤로가기를 가로채지 않게)
export function useBackHandler(handler, opts) {
  const nav = useNav()
  const ref = useRef(handler)
  ref.current = handler
  const tabLevel = !!(opts && opts.tabLevel)
  useEffect(() => {
    if (!nav?.registerBack) return undefined
    return nav.registerBack(() => ref.current(), { tabLevel })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// 모달·시트 전용 — 조건부 렌더(마운트=열림)되는 컴포넌트용.
// 마운트될 때(사용자 터치 직후) 진짜 히스토리 칸을 하나 쌓고(gesture-backed), 뒤로가기는 그 칸을
// 소비하며 close() 로 닫는다. 닫기 버튼으로 닫히면 쌓아둔 칸을 되돌려 정리한다(App.openModal).
// → popstate 안에서 gesture-less pushState 를 하지 않아 크롬 intervention 재종료 버그가 사라진다.
export function useModalBack(close) {
  const nav = useNav()
  const ref = useRef(close)
  ref.current = close
  useEffect(() => {
    if (!nav?.openModal) return undefined
    return nav.openModal(() => { if (typeof ref.current === 'function') ref.current() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// 상태로 여닫는 인라인 오버레이용(컴포넌트는 항상 마운트, isOpen 으로 표시).
// isOpen 이 true 가 되는 순간(터치 직후)에만 히스토리 칸을 쌓고, false 가 되면 정리한다.
export function useLayerBack(isOpen, close) {
  const nav = useNav()
  const ref = useRef(close)
  ref.current = close
  useEffect(() => {
    if (!isOpen || !nav?.openModal) return undefined
    return nav.openModal(() => { if (typeof ref.current === 'function') ref.current() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])
}
