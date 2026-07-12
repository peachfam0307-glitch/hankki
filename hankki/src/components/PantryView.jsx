import { useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from './Icon'
import Thumb from './Thumb'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import FoodIconPicker from './FoodIconPicker'

function toYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysLeft(expiry) {
  if (!expiry) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(expiry + 'T00:00:00'); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function expiryChip(n) {
  if (n === null) return null
  if (n < 0) return { text: `${-n}일 지남`, cls: 'exp-over' }
  if (n === 0) return { text: '오늘까지', cls: 'exp-soon' }
  if (n <= 3) return { text: `D-${n}`, cls: 'exp-soon' }
  if (n <= 7) return { text: `D-${n}`, cls: 'exp-mid' }
  return { text: `D-${n}`, cls: 'exp-ok' }
}

export default function PantryView() {
  const store = useStore()
  const { pantry, recipes } = store
  const nav = useNav()
  const [adding, setAdding] = useState(false)

  const sorted = [...pantry].sort((a, b) => {
    const da = daysLeft(a.expiry)
    const db = daysLeft(b.expiry)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  // 냉장고 파먹기 — 보유 재료가 들어가는 레시피를 매칭 개수 순으로.
  const matches = recipes
    .map((r) => {
      const ings = (r.ingredients || []).join(' ')
      const n = pantry.filter((p) => p.name && ings.includes(p.name)).length
      return { r, n }
    })
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)

  return (
    <div className="fade">
      <div className="sec-head" style={{ marginTop: 6 }}>
        <div className="h-section">냉장고 재료함</div>
        <button className="t-more press" onClick={() => setAdding(true)}>+ 재료</button>
      </div>

      {adding && <PantryAdd onClose={() => setAdding(false)} />}

      {pantry.length === 0 && !adding && (
        <div className="empty" style={{ padding: '30px 24px' }}>
          {'집에 있는 재료를 넣어두세요.\n유통기한도 챙겨주고, 그 재료로 만들 요리도 추천해줘요.'}
        </div>
      )}

      {sorted.map((p) => {
        const chip = expiryChip(daysLeft(p.expiry))
        return (
          <div key={p.id} className="wish-row">
            <div className="emoji-tile" style={{ width: 46, height: 46, flex: '0 0 auto' }}>
              <FoodIcon name={p.icon || guessFoodIcon(p.name)} size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              {p.expiry && <div className="t-sub" style={{ marginTop: 2 }}>유통기한 {p.expiry.replace(/-/g, '.')}</div>}
            </div>
            {chip && <span className={`exp-chip ${chip.cls}`}>{chip.text}</span>}
            <button className="icon-btn press" onClick={() => store.removePantry(p.id)} aria-label="삭제">
              <Icon name="x" size={17} color="var(--sand)" />
            </button>
          </div>
        )
      })}

      {matches.length > 0 && (
        <>
          <div className="sec-head"><div className="h-section">냉장고 파먹기 🍳</div></div>
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: -2, marginBottom: 12 }}>지금 가진 재료로 만들 수 있어요.</div>
          <div className="grid2">
            {matches.map(({ r, n }) => (
              <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} ratio="1/1" radius={16} />
                <div className="name">{r.title}</div>
                <div className="date">가진 재료 {n}개</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PantryAdd({ onClose }) {
  const { addPantry } = useStore()
  const nav = useNav()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('default')
  const [iconPicked, setIconPicked] = useState(false)
  const [expiry, setExpiry] = useState('')

  const setNm = (v) => { setName(v); if (!iconPicked) setIcon(guessFoodIcon(v)) }
  const quick = (days) => { const d = new Date(); d.setDate(d.getDate() + days); setExpiry(toYMD(d)) }

  const save = () => {
    const nm = name.trim()
    if (!nm) return
    addPantry({ id: newId(), name: nm, icon: iconPicked ? icon : guessFoodIcon(nm), expiry: expiry || null, addedAt: Date.now() })
    nav.showToast('냉장고에 넣었어요 🧊')
    onClose()
  }

  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        <FoodIconPicker value={icon} size={64} onChange={(k) => { setIcon(k); setIconPicked(true) }} />
        <div style={{ flex: 1 }}>
          <input className="wa-inp" value={name} onChange={(e) => setNm(e.target.value)} placeholder="재료 이름 (예: 두부)" autoFocus />
          <input className="wa-inp" style={{ marginTop: 8, color: expiry ? 'var(--text)' : 'var(--text-sub)' }} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['+3일', 3], ['+7일', 7], ['+2주', 14]].map(([label, d]) => (
          <button key={label} className="chip-quick press" onClick={() => quick(d)}>{label}</button>
        ))}
        <button className="chip-quick press" onClick={() => setExpiry('')}>없음</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14 }}>넣기</button>
      </div>
    </div>
  )
}
