import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import ConfirmSheet from '../components/ConfirmSheet'
import { timeAgo } from '../utils'

export default function InboxScreen() {
  const { recipes, removeRecipe } = useStore()
  const nav = useNav()
  const [filter, setFilter] = useState('all') // all | unsorted | sorted
  // 미정리함은 "버릴 것"이 쌓이는 곳 — 상세까지 안 들어가고 여기서 바로 지운다(창업자 요청).
  const [delAsk, setDelAsk] = useState(null)

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
          {/* 🏷 [2026-08-21] 「Inbox」 → 「임시보관함」. 창업자 = *"**INBOX나도 어딨는지 모르는데**"*
              ⭐ 못 찾은 이유가 둘이었다 — ⑴입구가 조건부라 사라졌다(홈에서 고쳤다) ⑵**이름이 영어**라
                 홈에서 찾아도 화면 제목이 Inbox 라 같은 곳인지 알 수 없었다.
              ⛔ 처음엔 「보관함」으로 했는데 창업자가 물렸다 — *"**임시보관함으로 바꾸던가.. 그냥 보관함은 애매**"*
              ⭐⭐ 맞는 지적이다. 「보관함」은 **오래 두는 곳**으로 읽혀서 «레시피 탭»과 뜻이 겹친다.
                 여기는 **「담아만 두고 나중에 정리할 곳」**이라 「임시」가 그 성격을 그대로 말한다.
              ⛔ 화면에 보이는 영어 낱말을 늘리지 않는다(v11.02 「my pick」을 접은 것과 같은 이유). */}
          <Icon name="inbox" size={20} /> 임시보관함
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
              : '임시보관함이 비어 있어요.\n가져오기로 레시피를 모아보세요.'}
          </div>
        )}
        {list.map((r, i) => (
          <div key={r.id}>
            {/* 행 전체=열기, 오른쪽 휴지통=바로 삭제(상세 ⋯메뉴까지 안 가게) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button className="inbox-row press" style={{ flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} style={{ width: 60, height: 60, flex: '0 0 auto' }} radius={14} emojiSize="1.5rem" showDecor />
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
              </button>
              <button className="icon-btn press" aria-label={`${r.title} 삭제`} onClick={() => setDelAsk(r)} style={{ flex: '0 0 auto' }}>
                <Icon name="trash" size={18} color="var(--text-sub)" />
              </button>
            </div>
            {i < list.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>

      {delAsk && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${delAsk.title}』 레시피를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeRecipe(delAsk.id); nav.showToast('레시피를 삭제했어요') }}
          onClose={() => setDelAsk(null)}
        />
      )}
    </div>
  )
}
