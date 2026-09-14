import { createPortal } from 'react-dom'

// 바텀시트·전체화면 오버레이를 body 최상단에 띄운다.
// (화면 전환 애니메이션이 만드는 stacking context에 갇혀 하단 탭 아래로
//  깔리는 문제를 막는다 — 시트 버튼이 탭에 가려 안 눌리던 버그 해결)
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
