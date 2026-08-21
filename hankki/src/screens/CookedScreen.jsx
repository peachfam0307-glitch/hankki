import { useStore } from '../store'
import { useNav } from '../App'
import TopBar from '../components/TopBar'
import Thumb from '../components/Thumb'

export default function CookedScreen() {
  const { recipes } = useStore()
  const nav = useNav()
  const cooked = recipes.filter((r) => (r.cooked || 0) > 0).sort((a, b) => b.cooked - a.cooked)

  return (
    <div className="screen fade">
      <TopBar title="만들었어요! 기록" onBack={() => nav.pop()} />
      <div className="pad">
        {cooked.length === 0 ? (
          <div className="empty">{'아직 만든 요리가 없어요.'}</div>
        ) : (
          cooked.map((r, i) => (
            <div key={r.id}>
              <button className="list-row press" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} style={{ width: 54, height: 54, flex: '0 0 auto' }} radius={12} emojiSize="1.4rem" showDecor />
                <div className="meta">
                  <div className="name">{r.title}</div>
                  <div className="t-sub" style={{ marginTop: 3 }}>{r.category}</div>
                </div>
                <span className="info-pill" style={{ fontSize: 14 }}>{r.cooked}번</span>
              </button>
              {i < cooked.length - 1 && <hr className="divider" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
