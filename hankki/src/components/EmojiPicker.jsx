import { useState } from 'react'
import { EMOJI_GROUPS } from '../emoji'

// 이모지 선택기 — 카테고리별 그리드 바텀시트. 사진 없이 통일감 있는 썸네일용.
export default function EmojiPicker({ value, onChange, size = 56 }) {
  const [open, setOpen] = useState(false)
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
        <div className="sheet-mask" onClick={() => setOpen(false)}>
          <div className="sheet emoji-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-sheet-head">
              <span>이모지 선택</span>
              <button className="press" onClick={() => setOpen(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div className="emoji-scroll">
              {EMOJI_GROUPS.map((g) => (
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
      )}
    </>
  )
}
