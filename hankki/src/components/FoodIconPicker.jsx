import { useState } from 'react'
import { useLayerBack } from '../useBackHandler'
import FoodIcon, { FOOD_ICON_GROUPS } from './FoodIcon'
import Portal from './Portal'

// 커스텀 재료/요리 아이콘 선택기 — 카테고리별 그리드 바텀시트.
// 이모지 대신 앱 톤과 어울리는 브랜드 아이콘을 고른다.
export default function FoodIconPicker({ value, onChange, size = 64 }) {
  const [open, setOpen] = useState(false)
  useLayerBack(open, () => setOpen(false)) // 뒤로가기 → 닫기
  return (
    <>
      <button
        type="button"
        className="emoji-tile press"
        style={{ width: size, height: size, flex: '0 0 auto' }}
        onClick={() => setOpen(true)}
        aria-label="아이콘 선택"
      >
        <FoodIcon name={value || 'default'} size={size * 0.62} />
      </button>

      {open && (
       <Portal>
        <div className="sheet-mask" onClick={() => setOpen(false)}>
          <div className="sheet emoji-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-sheet-head">
              <span>아이콘 선택</span>
              <button className="press" onClick={() => setOpen(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div className="emoji-scroll">
              {FOOD_ICON_GROUPS.map((g) => (
                <div key={g.label} style={{ marginBottom: 14 }}>
                  <div className="emoji-cat">{g.label}</div>
                  <div className="ficon-grid">
                    {g.items.map((k) => (
                      <button
                        key={g.label + k}
                        className={`ficon-cell press ${value === k ? 'on' : ''}`}
                        onClick={() => {
                          onChange(k)
                          setOpen(false)
                        }}
                        aria-label={k}
                      >
                        <FoodIcon name={k} size={34} />
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
