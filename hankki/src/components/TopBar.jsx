import Icon from './Icon'

// 뒤로가기가 있는 화면용 상단바. right 로 액션 버튼을 넣을 수 있다.
export default function TopBar({ title, onBack, right, transparent }) {
  return (
    <div className="topbar-back" style={transparent ? { background: 'transparent' } : undefined}>
      <button className="icon-btn press" onClick={onBack} aria-label="뒤로">
        <Icon name="chevron-left" size={24} />
      </button>
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  )
}
