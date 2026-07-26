import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import { timeAgo } from '../utils'

export default function InboxScreen() {
  const { recipes } = useStore()
  const nav = useNav()
  const [filter, setFilter] = useState('all') // all | unsorted | sorted

  const inbox = useMemo(() => [...recipes].sort((a, b) => b.savedAt - a.savedAt), [recipes])
  const unsorted = inbox.filter((r) => r.status === 'unsorted')
  const sorted = inbox.filter((r) => r.status === 'sorted')
  const list = filter === 'unsorted' ? unsorted : filter === 'sorted' ? sorted : inbox

  const pills = [
    { key: 'all', label: '전체', n: inbox.length },
    { key: 'unsorted', label: '미정리', n: unsorted.length },
    { key: 'sorted', label: '정리됨', n: sorted.length },
  ]

  return (
    <div className="screen fade">
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => nav.pop()} aria-label="뒤로">
          <Icon name="chevron-left" size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
          <Icon name="inbox" size={20} /> Inbox
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="hscroll" style={{ marginTop: 4, marginBottom: 6 }}>
        {pills.map((p) => (
          <button key={p.key} className={`pill press ${filter === p.key ? 'active' : ''}`} onClick={() => setFilter(p.key)}>
            {p.label} {p.n}
          </button>
        ))}
      </div>

      <div className="pad">
        {list.length === 0 && (
          <div className="empty">
            {filter === 'unsorted'
              ? '정리할 레시피가 없어요. 깔끔하네요!'
              : 'Inbox가 비어 있어요.\n가져오기로 레시피를 모아보세요.'}
          </div>
        )}
        {list.map((r, i) => (
          <div key={r.id}>
            <button className="inbox-row press" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
              <Thumb recipe={r} style={{ width: 60, height: 60, flex: '0 0 auto' }} radius={14} emojiSize="1.5rem" />
              <div className="meta" style={{ flex: 1, minWidth: 0 }}>
                <SourceBadge source={r.source} />
                <div className="name" style={{ fontSize: 15, fontWeight: 600, margin: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="t-sub">{timeAgo(r.savedAt)}</span>
                  <span className={`badge ${r.status === 'sorted' ? 'badge-sorted' : 'badge-unsorted'}`}>
                    {r.status === 'sorted' ? '정리됨' : '미정리'}
                  </span>
                </div>
              </div>
              <Icon name="chevron-right" size={18} color="var(--sand)" />
            </button>
            {i < list.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>
    </div>
  )
}
