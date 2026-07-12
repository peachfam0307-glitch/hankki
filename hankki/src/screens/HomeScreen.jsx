import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import TabTips from '../components/TabTips'
import { CATEGORIES } from '../theme'
import { timeAgo } from '../utils'

export default function HomeScreen() {
  const { recipes, profile, pantry } = useStore()
  const nav = useNav()
  const [cat, setCat] = useState('전체')
  const [pick, setPick] = useState(0)

  const sorted = recipes.filter((r) => r.status === 'sorted')

  // 오늘의 추천 — 냉장고 재료로 만들 수 있는 요리 우선, 없으면 자주 해먹는/전체
  const today = useMemo(() => {
    const pool = recipes.filter((r) => r.status !== 'unsorted')
    const withPantry = pool
      .map((r) => {
        const ings = (r.ingredients || []).join(' ')
        const n = (pantry || []).filter((p) => {
          const k = (p.name || '').trim().split(/\s+/)[0]
          return k && ings.includes(k)
        }).length
        return { r, n }
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (withPantry.length) return { list: withPantry.map((x) => x.r), fromFridge: true }
    const cooked = pool.filter((r) => (r.cooked || 0) > 0)
    return { list: cooked.length ? cooked : pool, fromFridge: false }
  }, [recipes, pantry])
  const todayPick = today.list.length ? today.list[pick % today.list.length] : null

  const often = useMemo(
    () => [...recipes].filter((r) => (r.cooked || 0) > 0).sort((a, b) => b.cooked - a.cooked).slice(0, 8),
    [recipes]
  )
  const recent = useMemo(
    () => [...recipes].sort((a, b) => b.savedAt - a.savedAt).slice(0, 4),
    [recipes]
  )
  const all = useMemo(
    () => (cat === '전체' ? sorted : sorted.filter((r) => r.category === cat)),
    [sorted, cat]
  )

  const open = (id) => nav.push({ name: 'detail', id })

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">한끼</div>
          <TabTips tab="home" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="icon-btn press" onClick={() => nav.push({ name: 'inbox' })} aria-label="Inbox">
            <Icon name="inbox" size={22} />
          </button>
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="프로필">
            <Avatar name={profile.name} />
          </button>
        </div>
      </div>

      <div className="pad">
        {/* 1. 검색 */}
        <button
          className="searchbar press"
          style={{ width: '100%', marginTop: 4 }}
          onClick={() => nav.go('search')}
        >
          <Icon name="search" size={19} color="var(--text-sub)" />
          <span style={{ fontSize: 14.5 }}>레시피, 재료, 태그를 검색해 보세요.</span>
        </button>

        {/* 오늘 뭐 해먹지? */}
        {todayPick && (
          <div className="today-card">
            <button className="today-main press" onClick={() => open(todayPick.id)}>
              <Thumb recipe={todayPick} style={{ width: 72, height: 72, flex: '0 0 auto' }} radius={16} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="today-label">오늘 뭐 해먹지?</div>
                <div className="today-title">{todayPick.title}</div>
                <div className="today-reason">{today.fromFridge ? '🧊 냉장고 재료로 만들 수 있어요' : '이건 어때요?'}</div>
              </div>
            </button>
            {today.list.length > 1 && (
              <button className="today-refresh press" onClick={() => setPick((p) => p + 1)}>다른<br />추천</button>
            )}
          </div>
        )}

        {/* 2. 자주 해먹는 요리 */}
        {often.length > 0 && (
          <>
            <div className="sec-head">
              <div className="h-section">자주 해먹는 요리</div>
              <button className="t-more press" onClick={() => nav.go('search')}>
                더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
              </button>
            </div>
            <div className="hscroll">
              {often.map((r) => (
                <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2rem" />
                  <div className="name">{r.title}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3. 최근 저장 */}
        <div className="sec-head">
          <div className="h-section">최근 저장</div>
          <button className="t-more press" onClick={() => nav.go('myrecipes')}>
            더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
          </button>
        </div>
        <div>
          {recent.map((r, i) => (
            <div key={r.id}>
              <button className="list-row press" style={{ width: '100%', textAlign: 'left' }} onClick={() => open(r.id)}>
                <Thumb recipe={r} style={{ width: 62, height: 62, flex: '0 0 auto' }} radius={14} emojiSize="1.5rem" />
                <div className="meta">
                  <div className="name">{r.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <SourceBadge source={r.source} showLabel={false} size={14} />
                    <span className="t-sub">{sourceLabel(r.source)}에서 가져옴 · {timeAgo(r.savedAt)}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size={18} color="var(--sand)" />
              </button>
              {i < recent.length - 1 && <hr className="divider" />}
            </div>
          ))}
        </div>

        {/* 4. 전체 레시피 */}
        <div className="sec-head">
          <div className="h-section">전체 레시피</div>
        </div>
        <div className="hscroll" style={{ paddingBottom: 4 }}>
          {CATEGORIES.map((c) => (
            <button key={c} className={`pill press ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          {all.map((r) => (
            <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => open(r.id)}>
              <Thumb recipe={r} ratio="1/1" radius={16} />
              <div className="name">{r.title}</div>
              <div className="date">{r.category} · {r.time}분</div>
            </button>
          ))}
        </div>
        {all.length === 0 && <div className="empty">이 카테고리에 저장된 레시피가 아직 없어요.</div>}

        {/* 5. 가져오기 */}
        <button className="btn-primary press" style={{ marginTop: 26 }} onClick={() => nav.push({ name: 'import' })}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Icon name="plus" size={20} color="#fff" stroke={2} /> 가져오기
          </span>
        </button>
      </div>
    </>
  )
}

function sourceLabel(s) {
  return { instagram: 'Instagram', youtube: 'YouTube', link: '링크', photo: '사진', manual: '직접 작성' }[s] || '링크'
}

export function Avatar({ name, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#dcdcd3,#c9c8bd)',
        color: '#6b4f3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.42,
      }}
    >
      {(name || '한')[0]}
    </div>
  )
}
