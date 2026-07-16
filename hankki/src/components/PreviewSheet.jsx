import Portal from './Portal'

// 업데이트 예고 — '준비 중인 기능'을 보여줘 기대감을 준다.
// 정직 원칙: 없는 걸 '됩니다'라 하지 않고 '준비 중/곧'으로만 안내.
const UPCOMING = [
  { emoji: '🤖', title: '사진 한 장이면 AI가 레시피로', desc: '캡처·손글씨도 자동 정리. 옮겨적기 끝.', tag: '곧' },
  { emoji: '🎀', title: '꾸미기 새 아이템', desc: '도장·컨페티·내 사진 프레임까지.', tag: '준비 중' },
  { emoji: '📖', title: '내 레시피북, PDF로 소장', desc: '꾸민 표지 그대로 예쁜 책 한 권.', tag: '준비 중' },
  { emoji: '🍯', title: '주부의 장바구니 확장', desc: '18년 안목의 살림템을 계속 채워가요.', tag: '계속' },
  { emoji: '💬', title: '내 꾸민 레시피 자랑', desc: '취향 비슷한 사람들과 구경하고 나눠요.', tag: '나중에' },
]

export default function PreviewSheet({ onClose }) {
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}>
          <div className="emoji-sheet-head">
            <span>🎁 곧 만나요</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <p className="t-sub" style={{ fontSize: 13, margin: '0 0 14px', lineHeight: 1.55 }}>
              한끼가 이런 걸 준비하고 있어요.<br />준비되면 가장 먼저 보여드릴게요 :)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UPCOMING.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--cream)', borderRadius: 14, padding: '12px 13px' }}>
                  <span style={{ fontSize: 24, lineHeight: 1, flex: '0 0 auto' }}>{f.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800 }}>{f.title}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brown)', background: 'var(--surface)', borderRadius: 999, padding: '2px 8px' }}>{f.tag}</span>
                    </div>
                    <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, textAlign: 'center', margin: '14px 0 2px', color: 'var(--sand)' }}>
              지금 쌓아둔 레시피는 새 기능이 나와도 그대로 이어져요.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  )
}
