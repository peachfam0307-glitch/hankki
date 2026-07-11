import { useMemo } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'

export default function DiaryScreen() {
  const { recipes } = useStore()
  const nav = useNav()

  const cooked = useMemo(() => recipes.filter((r) => (r.cooked || 0) > 0).sort((a, b) => b.cooked - a.cooked), [recipes])
  const total = cooked.reduce((s, r) => s + (r.cooked || 0), 0)

  return (
    <>
      <div className="topbar">
        <div className="h-title">다이어리</div>
      </div>
      <div className="pad">
        <div className="t-sub" style={{ marginTop: 2, fontSize: 14 }}>만들었어요! 기록이 여기에 쌓여요.</div>

        {/* 요약 카드 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <StatCard icon="star" value={total} label="총 요리 횟수" />
          <StatCard icon="bookmark" value={cooked.length} label="만든 레시피" />
        </div>

        <div className="h-section" style={{ marginTop: 28, marginBottom: 6 }}>많이 만든 레시피</div>
        {cooked.length === 0 ? (
          <div className="empty">{'아직 만든 요리가 없어요.\n레시피 상세에서 “만들었어요!”를 눌러보세요.'}</div>
        ) : (
          <div>
            {cooked.map((r, i) => (
              <div key={r.id}>
                <button className="list-row press" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                  <div style={{ width: 26, textAlign: 'center', fontWeight: 700, color: i < 3 ? 'var(--brown)' : 'var(--sand)', fontSize: 15 }}>{i + 1}</div>
                  <Thumb recipe={r} style={{ width: 54, height: 54, flex: '0 0 auto' }} radius={12} emojiSize="1.4rem" />
                  <div className="meta">
                    <div className="name">{r.title}</div>
                    <div className="t-sub" style={{ marginTop: 3 }}>{r.category}</div>
                  </div>
                  <span className="info-pill" style={{ fontSize: 12 }}>{r.cooked}번</span>
                </button>
                {i < cooked.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div className="card" style={{ flex: 1, padding: 16, background: 'var(--cream)', border: 'none' }}>
      <Icon name={icon} size={22} color="var(--brown)" style={{ fill: icon === 'star' ? 'var(--brown)' : 'none' }} />
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em' }}>{value}</div>
      <div className="t-sub" style={{ marginTop: 2 }}>{label}</div>
    </div>
  )
}
