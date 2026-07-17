import { useState } from 'react'
import { useBackHandler } from '../useBackHandler'
import { EMOJI_GROUPS } from '../emoji'
import Portal from './Portal'

// 이모지 선택기 — 카테고리별 그리드 바텀시트. 사진 없이 통일감 있는 썸네일용.
// only: 특정 카테고리 라벨 배열만 보이게 (예: 냉장고 재료엔 식재료 그룹만).
export default function EmojiPicker({ value, onChange, size = 56, only }) {
  const [open, setOpen] = useState(false)
  useBackHandler(() => { if (open) { setOpen(false); return true } return false }) // 뒤로가기 → 픽커 닫기
  const groups = only ? EMOJI_GROUPS.filter((g) => only.includes(g.label)) : EMOJI_GROUPS
  return (
    <>
      <button
        type="button"
        className="emoji-chip press"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        onClick={() => setOpen(true)}
        aria-label="이모지 선택"
      >
        {value || '🍽️'}
      </button>

      {open && (
       <Portal>
        <div className="sheet-mask" onClick={() => setOpen(false)}>
          <div className="sheet emoji-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-sheet-head">
              <span>이모지 선택</span>
              <button className="press" onClick={() => setOpen(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div className="emoji-scroll">
              {groups.map((g) => (
                <div key={g.label} style={{ marginBottom: 14 }}>
                  <div className="emoji-cat">{g.label}</div>
                  <div className="emoji-grid">
                    {g.items.map((e, i) => (
                      <button
                        key={g.label + i}
                        className={`emoji-cell press ${value === e ? 'on' : ''}`}
                        onClick={() => {
                          onChange(e)
                          setOpen(false)
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
       </Portal>
      )}
    </>
  )
}
