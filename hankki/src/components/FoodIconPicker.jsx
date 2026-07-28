import { useState } from 'react'
import { useLayerBack } from '../useBackHandler'
import FoodIcon, { FOOD_ICON_GROUPS, FOOD_NAMES } from './FoodIcon'
import Portal from './Portal'

// 아이콘 고르는 바텀시트만 따로 — 표지처럼 "자기 버튼 없이 시트만 열고 싶은 곳"에서 쓴다.
// (레시피 상세에서 표지 아이콘 바꾸기 — 창업자 2026-07-28 "사진 바꾸기가 갤러리 말고 음식아이콘으로 가야 해")
export function FoodIconSheet({ value, onChange, onClose }) {
  useLayerBack(true, onClose) // 뒤로가기 → 닫기
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet emoji-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="emoji-sheet-head">
            <span>아이콘 선택</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
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
                      onClick={() => { onChange(k); onClose() }}
                      aria-label={FOOD_NAMES[k] || k}
                    >
                      <FoodIcon name={k} size={36} />
                      <span className="ficon-name">{FOOD_NAMES[k] || ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}

// 커스텀 재료/요리 아이콘 선택기 — 타일 버튼 + 위 시트.
// 이모지 대신 앱 톤과 어울리는 브랜드 아이콘을 고른다.
export default function FoodIconPicker({ value, onChange, size = 64 }) {
  const [open, setOpen] = useState(false)
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
      {open && <FoodIconSheet value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  )
}
