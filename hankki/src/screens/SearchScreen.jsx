import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import { POPULAR_SEARCHES, TAG_LIST, INGREDIENT_CHIPS } from '../data/seed'

export default function SearchScreen() {
  const { recipes } = useStore()
  const nav = useNav()
  // 다른 화면(내 레시피의 태그 등)에서 넘겨준 검색어가 있으면 그걸로 시작
  const [q, setQ] = useState(() => {
    try {
      const t = sessionStorage.getItem('hankki:searchQ') || ''
      sessionStorage.removeItem('hankki:searchQ')
      return t
    } catch { return '' }
  })

  const query = q.trim()
  const results = useMemo(() => {
    if (!query) return []
    const k = query.toLowerCase()
    return recipes.filter((r) => {
      const hay = [r.title, r.category, ...(r.tags || []), ...(r.ingredients || [])].join(' ').toLowerCase()
      return hay.includes(k)
    })
  }, [query, recipes])

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="icon-btn press" onClick={() => nav.go('home')} aria-label="뒤로" style={{ marginLeft: -6 }}>
            <Icon name="chevron-left" size={24} />
          </button>
          <div className="h-title">검색</div>
          <TabTips tab="search" />
        </div>
      </div>
      <div className="pad">
        <div className="searchbar" style={{ marginTop: 2 }}>
          <Icon name="search" size={19} color="var(--text-sub)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어를 입력하세요" autoComplete="off" />
          {q && (
            <button className="press" onClick={() => setQ('')} aria-label="지우기">
              <Icon name="x" size={18} color="var(--text-sub)" />
            </button>
          )}
        </div>

        {query ? (
          <div className="fade">
            <div className="t-sub" style={{ margin: '18px 0 12px' }}>
              '{query}' 검색 결과 {results.length}개
            </div>
            {results.length === 0 ? (
              <div className="empty">{'검색 결과가 없어요.\n다른 키워드로 찾아보세요.'}</div>
            ) : (
              <div className="grid2">
                {results.map((r) => (
                  <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                    <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                    <div className="name">{r.title}</div>
                    <div className="date">{r.category} · {r.time}분</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 인기 검색어 */}
            <div className="h-section" style={{ marginTop: 26, marginBottom: 13 }}>인기 검색어</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_SEARCHES.map((t) => (
                <button key={t} className="pill press" onClick={() => setQ(t)}>{t}</button>
              ))}
            </div>

            {/* 태그로 찾기 */}
            <div className="h-section" style={{ marginTop: 28, marginBottom: 13 }}>태그로 찾기</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAG_LIST.slice(0, 6).map((t) => (
                <button key={t} className="tag press" onClick={() => setQ(t)}># {t}</button>
              ))}
            </div>

            {/* 재료로 찾기 */}
            <div className="h-section" style={{ marginTop: 28, marginBottom: 15 }}>재료로 찾기</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px 8px' }}>
              {INGREDIENT_CHIPS.map((c) => (
                <button key={c.name} className="press" onClick={() => setQ(c.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div className="emoji-tile" style={{ width: 56, height: 56, borderRadius: '50%' }}>
                    <FoodIcon name={c.icon || guessFoodIcon(c.name)} size={34} />
                  </div>
                  <span style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--text)' }}>{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
