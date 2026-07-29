import { useMemo, useState } from 'react'
import { useLayerBack } from '../useBackHandler'
import FoodIcon, { FOOD_ICON_GROUPS_SORTED, FOOD_NAMES, searchFoodIcons } from './FoodIcon'
import Icon from './Icon'
import Portal from './Portal'

// 🕘 최근에 고른 아이콘 — 결국 쓰던 걸 또 쓴다. 맨 위에 두면 두 번째부터는 스크롤이 없다.
const RECENT_KEY = 'hankki:foodicon:recent'
const RECENT_MAX = 8
function readRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}
function pushRecent(key) {
  try {
    const next = [key, ...readRecent().filter((k) => k !== key)].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* 저장 실패해도 고르기는 되어야 한다 */
  }
}

// 아이콘 고르는 바텀시트만 따로 — 표지처럼 "자기 버튼 없이 시트만 열고 싶은 곳"에서 쓴다.
// (레시피 상세에서 표지 아이콘 바꾸기 — 창업자 2026-07-28 "사진 바꾸기가 갤러리 말고 음식아이콘으로 가야 해")
export function FoodIconSheet({ value, onChange, onClose }) {
  useLayerBack(true, onClose) // 뒤로가기 → 닫기
  const [q, setQ] = useState('')
  // 최근 목록은 시트를 여는 순간의 것으로 고정 — 고를 때마다 위가 움직이면 눈이 어지럽다.
  const [recent] = useState(readRecent)
  const found = useMemo(() => searchFoodIcons(q), [q])

  const pick = (k) => { pushRecent(k); onChange(k); onClose() }
  const cell = (k, prefix) => (
    <button
      key={prefix + k}
      className={`ficon-cell press ${value === k ? 'on' : ''}`}
      onClick={() => pick(k)}
      aria-label={FOOD_NAMES[k] || k}
    >
      <FoodIcon name={k} size={36} />
      <span className="ficon-name">{FOOD_NAMES[k] || ''}</span>
    </button>
  )

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet emoji-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="emoji-sheet-head">
            <span>아이콘 선택</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>

          {/* 🔎 찾기 — 아이콘이 300개 가까워 스크롤로는 못 찾는다(창업자 2026-07-29).
              이름뿐 아니라 별칭('제육'→두루치기)과 초성(ㄱㅊㅉㄱ→김치찌개)으로도 걸린다. */}
          <div className="ficon-search">
            <Icon name="search" size={17} color="var(--text-sub)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="음식 이름으로 찾기 (초성도 돼요)"
              aria-label="아이콘 검색"
            />
            {q && (
              <button className="press" onClick={() => setQ('')} aria-label="검색어 지우기" style={{ display: 'flex', padding: 4 }}>
                <Icon name="x" size={15} color="var(--text-sub)" />
              </button>
            )}
          </div>

          <div className="emoji-scroll">
            {found ? (
              found.length ? (
                <div style={{ marginBottom: 14 }}>
                  <div className="emoji-cat">‘{q}’ 검색 결과 {found.length}개</div>
                  <div className="ficon-grid">{found.map((k) => cell(k, 'q'))}</div>
                </div>
              ) : (
                <div className="empty" style={{ padding: '38px 20px' }}>
                  ‘{q}’으로 찾은 아이콘이 없어요.<br />
                  <span className="t-sub" style={{ fontSize: 12.5 }}>다른 이름으로 찾거나, 아래 목록에서 골라주세요.</span>
                </div>
              )
            ) : (
              <>
                {recent.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="emoji-cat">최근에 쓴 것</div>
                    <div className="ficon-grid">{recent.map((k) => cell(k, 'r'))}</div>
                  </div>
                )}
                {FOOD_ICON_GROUPS_SORTED.map((g) => (
                  <div key={g.label} style={{ marginBottom: 14 }}>
                    <div className="emoji-cat">{g.label}</div>
                    <div className="ficon-grid">{g.items.map((k) => cell(k, g.label))}</div>
                  </div>
                ))}
              </>
            )}
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
