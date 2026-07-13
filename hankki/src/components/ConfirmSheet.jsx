import Portal from './Portal'

// 앱 안에서 쓰는 확인 시트 — window.confirm 대체.
// window.confirm 도 설치형 PWA에선 사이트 주소가 박힌 검은 시스템 창을 띄운다.
// 삭제·초기화 같은 되돌리기 어려운 동작 확인에 쓴다(danger=빨강 버튼).
export default function ConfirmSheet({ title, message, confirmLabel = '확인', danger = false, onConfirm, onClose }) {
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>{title}</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            {message && (
              <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{message}</div>
            )}
            <button
              className="btn-primary press"
              style={{ marginBottom: 8, ...(danger ? { background: 'var(--danger)' } : null) }}
              onClick={() => { onConfirm(); onClose() }}
            >
              {confirmLabel}
            </button>
            <button className="btn-ghost press" style={{ width: '100%' }} onClick={onClose}>취소</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
