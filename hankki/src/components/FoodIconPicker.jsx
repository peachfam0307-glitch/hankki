import { useMemo, useState } from 'react'
import { useLayerBack } from '../useBackHandler'
import FoodIcon, { FOOD_ICON_GROUPS_ING_FIRST, FOOD_ICON_GROUPS_SORTED, FOOD_NAMES, searchFoodIcons } from './FoodIcon'
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
// 🥕 mode='ing' = 「재료를 고르는 자리」 (냉장고 재료 담기). 재료 갈래가 맨 위로 온다.
//    📮 창업자 폰 제보 2026-08-16 *"냉장고에 유통기한넣을때 아이콘바꾸는거 음식이 먼저다떠"*
//    ⛔ 기본값은 그대로 'dish' — 레시피 표지·프로필·쇼핑몰은 아무것도 안 바뀐다.
// 📷 `onPhoto` = **「내 사진 올리기」를 이 시트에서 바로** (창업자 2026-08-17
//    *"아이콘 바꾸기에 바로 내가 사진 올릴 수 있는 버튼도 있었으면 좋겠다고"* · *"이것도 반영아직이네"*)
//    ⛔ 그 전엔 이 파일 28줄 주석처럼 **「사진 쓰고 싶으면 편집 화면에서」** 였다 —
//       표지를 바꾸러 왔는데 사진은 다른 화면으로 가야 했다. 그래서 아무도 안 썼다.
//    ⭐ prop 을 «받았을 때만» 단추를 그린다 — 냉장고 재료 픽커(`mode='ing'`)엔 사진이 뜻이 없다.
//       **부르는 쪽이 「여긴 사진이 되는 자리」인지 안다.** ⛔여기서 mode 로 갈라 판단하지 말 것.
export function FoodIconSheet({ value, onChange, onClose, mode = 'dish', onPhoto }) {
  useLayerBack(true, onClose) // 뒤로가기 → 닫기
  const ing = mode === 'ing'
  const groups = ing ? FOOD_ICON_GROUPS_ING_FIRST : FOOD_ICON_GROUPS_SORTED
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
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>

          {/* 🔎 찾기 — 아이콘이 300개 가까워 스크롤로는 못 찾는다(창업자 2026-07-29).
              이름뿐 아니라 별칭('제육'→두루치기)과 초성(ㄱㅊㅉㄱ→김치찌개)으로도 걸린다. */}
          <div className="ficon-search">
            <Icon name="search" size={17} color="var(--text-sub)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ing ? '재료 이름으로 찾기 (초성도 돼요)' : '음식 이름으로 찾기 (초성도 돼요)'}
              aria-label="아이콘 검색"
            />
            {q && (
              <button className="press" onClick={() => setQ('')} aria-label="검색어 지우기" style={{ display: 'flex', padding: 4 }}>
                <Icon name="x" size={15} color="var(--text-sub)" />
              </button>
            )}
          </div>

          {/* 📷 내 사진으로 — 검색창 «바로 아래». 아이콘 격자 위라 스크롤 없이 눈에 든다.
              ⛔ 여기서 시트를 닫지 않는다 — 파일 고르기를 «취소»하면 아무 일도 안 했는데 시트만 사라진다.
                 닫는 건 사진이 실제로 들어온 뒤에 부르는 쪽이 한다. */}
          {onPhoto && (
            <button
              className="press"
              onClick={onPhoto}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 'calc(100% - 32px)', margin: '0 16px 10px', padding: '10px 0', borderRadius: 12, background: 'var(--cream)', color: 'var(--brown)', fontSize: 15.5, fontWeight: 800, border: 'none' }}
            >
              <Icon name="camera" size={17} color="var(--brown)" />
              내 사진으로 하기
            </button>
          )}

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
                  <span className="t-sub" style={{ fontSize: 14.5 }}>다른 이름으로 찾거나, 아래 목록에서 골라주세요.</span>
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
                {groups.map((g) => (
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
export default function FoodIconPicker({ value, onChange, size = 64, mode = 'dish' }) {
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
      {open && <FoodIconSheet value={value} onChange={onChange} onClose={() => setOpen(false)} mode={mode} />}
    </>
  )
}
