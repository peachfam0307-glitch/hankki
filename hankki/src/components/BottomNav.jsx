import Icon from './Icon'

// 검색 탭은 뺐다 — 홈 상단 검색창이 검색 화면으로 바로 데려가 준다.
// 그 자리엔 앱의 핵심 동작인 '가져오기'를 넣고, 채운 원으로 눈에 띄게 강조한다.
// '일지' 탭은 레시피 탭(요리 기록 세그먼트)으로 합쳤다 — 레시피와 기록이 한 곳에.
// '설정'은 하단 탭에서 뺐다 — 홈 상단 톱니(예전 Inbox 자리)가 설정으로 감. 그 자리에 바이럴 핵심인 '레꾸자랑'을 넣는다.
// 이름 '레꾸자랑' = 내가 꾸민 표지(레꾸=레시피 꾸미기, 브랜드 단어) 자랑. 탭 주인공이 꾸민 표지라 카드자랑→레꾸자랑(창업자 확정).
const ITEMS = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'import', label: '가져오기', icon: 'plus', action: true },
  { key: 'myrecipes', label: '레시피', icon: 'bookmark' },
  { key: 'shop', label: '장보기', icon: 'cart' },
  { key: 'brag', label: '레꾸자랑', icon: 'share' },
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
