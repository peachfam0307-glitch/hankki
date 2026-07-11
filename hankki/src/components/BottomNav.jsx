import Icon from './Icon'

const ITEMS = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'search', label: '검색', icon: 'search' },
  { key: 'myrecipes', label: '내 레시피', icon: 'bookmark' },
  { key: 'diary', label: '다이어리', icon: 'diary' },
  { key: 'profile', label: '설정', icon: 'settings' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
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
