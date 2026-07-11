import { useEffect, useState } from 'react'
import { useNav } from '../App'
import TopBar from '../components/TopBar'
import Icon from '../components/Icon'

const KEY = 'hankki:shopping'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export default function ShoppingScreen() {
  const nav = useNav()
  const [items, setItems] = useState(load)
  const [text, setText] = useState('')

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = () => {
    const t = text.trim()
    if (!t) return
    setItems((s) => [{ id: 'i' + Date.now().toString(36), name: t, done: false }, ...s])
    setText('')
  }
  const toggle = (id) => setItems((s) => s.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  const remove = (id) => setItems((s) => s.filter((i) => i.id !== id))
  const clearDone = () => setItems((s) => s.filter((i) => !i.done))

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="screen fade">
      <TopBar
        title="장보기 리스트"
        onBack={() => nav.pop()}
        right={doneCount > 0 ? (
          <button className="press" onClick={clearDone} style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>완료 지우기</button>
        ) : null}
      />
      <div className="pad">
        <div className="searchbar" style={{ marginTop: 2 }}>
          <Icon name="cart" size={19} color="var(--text-sub)" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="살 재료를 입력하고 Enter"
          />
          {text && (
            <button className="press" onClick={add} aria-label="추가"><Icon name="plus" size={20} color="var(--brown)" /></button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty">{'장보기 목록이 비어 있어요.\n필요한 재료를 담아보세요.'}</div>
        ) : (
          <div style={{ marginTop: 14 }}>
            {items.map((it) => (
              <div key={it.id} className="shop-row">
                <button className="check-box press" onClick={() => toggle(it.id)} data-on={it.done}>
                  {it.done && <Icon name="check" size={15} color="#fff" stroke={2.4} />}
                </button>
                <span style={{ flex: 1, fontSize: 15, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? 'var(--text-sub)' : 'var(--text)' }}>
                  {it.name}
                </span>
                <button className="icon-btn press" onClick={() => remove(it.id)} aria-label="삭제"><Icon name="x" size={18} color="var(--sand)" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
