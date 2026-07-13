import Icon from './Icon'

// 검색 탭은 뺐다 — 홈 상단 검색창이 검색 화면으로 바로 데려가 준다.
// 그 자리엔 앱의 핵심 동작인 '가져오기'를 넣고, 채운 원으로 눈에 띄게 강조한다.
// '일지' 탭은 레시피 탭(요리 기록 세그먼트)으로 합쳤다 — 레시피와 기록이 한 곳에.
const ITEMS = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'import', label: '가져오기', icon: 'plus', action: true },
  { key: 'myrecipes', label: '레시피', icon: 'bookmark' },
  { key: 'shop', label: '장보기', icon: 'cart' },
  { key: 'profile', label: '설정', icon: 'settings' },
]

export default function BottomNav({ active, onChange, onImport }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        if (it.action) {
          return (
            <button
              key={it.key}
              className="nav-item nav-item-import press"
              onClick={onImport}
              aria-label="가져오기"
            >
              <span className="nav-import-circle">
                <Icon name={it.icon} size={22} color="#fff" stroke={2.5} />
              </span>
              <span style={{ color: 'var(--brown)', fontWeight: 700 }}>{it.label}</span>
            </button>
          )
        }
        const on = active === it.key
        return (
          <button
            key={it.key}
            className="nav-item press"
            onClick={() => onChange(it.key)}
            aria-current={on ? 'page' : undefined}
          >
            <Icon
              name={it.icon}
              size={23}
              stroke={on ? 2 : 1.6}
              color={on ? 'var(--brown)' : 'var(--text-sub)'}
            />
            <span style={{ color: on ? 'var(--brown)' : 'var(--text-sub)', fontWeight: on ? 700 : 500 }}>
              {it.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
