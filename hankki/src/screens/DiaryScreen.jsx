import { useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DiaryEntrySheet, { Stars } from '../components/DiaryEntrySheet'

function fmtDate(ts) {
  const d = new Date(ts)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export default function DiaryScreen() {
  const { diary, recipes, removeDiary } = useStore()
  const nav = useNav()
  const [editing, setEditing] = useState(null)

  const entries = [...diary].sort((a, b) => b.at - a.at)
  const now = new Date()
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  const openRecipe = (e) => {
    if (recipes.some((r) => r.id === e.recipeId)) nav.push({ name: 'detail', id: e.recipeId })
  }

  return (
    <>
      <div className="topbar">
        <div className="h-title">요리 일지</div>
      </div>
      <div className="pad">
        <div className="t-sub" style={{ marginTop: 2, fontSize: 13.5 }}>만든 요리에 별점·팁·사진을 남겨보세요.</div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px 0', background: 'var(--cream)', border: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brown)' }}>{thisMonth}</div>
            <div className="t-sub" style={{ marginTop: 2 }}>이번 달 요리</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px 0', background: 'var(--cream)', border: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brown)' }}>{entries.length}</div>
            <div className="t-sub" style={{ marginTop: 2 }}>총 기록</div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty" style={{ marginTop: 10 }}>{'아직 기록이 없어요.\n레시피에서 “만들었어요”를 누르면 여기에 쌓여요.'}</div>
        ) : (
          <div style={{ marginTop: 22 }}>
            {entries.map((e) => (
              <div key={e.id} className="diary-row">
                <button className="press" onClick={() => openRecipe(e)} style={{ flex: '0 0 auto' }}>
                  {e.photo ? (
                    <img src={e.photo} alt="" style={{ width: 58, height: 58, borderRadius: 14, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="emoji-tile" style={{ width: 58, height: 58 }}><FoodIcon name={guessFoodIcon(e.title)} size={36} /></div>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div className="t-sub" style={{ fontSize: 12, marginTop: 2 }}>{fmtDate(e.at)}</div>
                  {e.rating > 0 && <div style={{ marginTop: 4 }}><Stars value={e.rating} onChange={() => {}} size={14} /></div>}
                  {e.note && <div className="diary-note-preview">{e.note}</div>}
                </div>
                <button className="icon-btn press" onClick={() => setEditing(e)} aria-label="기록 편집">
                  <Icon name="pen" size={17} color="var(--sand)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <DiaryEntrySheet
          entry={editing}
          onClose={() => setEditing(null)}
          onDelete={() => { removeDiary(editing.id); setEditing(null); nav.showToast('기록을 삭제했어요') }}
        />
      )}
    </>
  )
}
