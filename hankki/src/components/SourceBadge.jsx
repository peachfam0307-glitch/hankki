import Icon from './Icon'
import { SOURCES } from '../data/seed'

const COLOR = {
  instagram: '#C13584',
  youtube: '#E33',
  link: '#9B8B79',
  photo: '#8AA07A',
  manual: '#B98A4E',
}

// Inbox / 상세에서 '어디서 가져왔는지'를 보여주는 작은 출처 표시.
export default function SourceBadge({ source, showLabel = true, size = 15 }) {
  const s = SOURCES[source] || SOURCES.link
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-sub)', fontSize: 12.5, fontWeight: 500 }}>
      <Icon name={s.icon} size={size} color={COLOR[source] || '#9B8B79'} stroke={1.7} />
      {showLabel && s.label}
    </span>
  )
}
