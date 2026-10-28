import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
// 🥕 [2026-08-23 창업자 제보 「홈에서 검색하면 아래 음식아이콘 옛날꺼」]
//   ⛔ 뿌리 = 「재료로 찾기」 칩인데 «요리» 규칙(`guessFoodIcon`)을 불렀다.
//      재료 이름이 요리 규칙에 안 걸리면 옛 SVG 도형으로 떨어진다.
//   ✅ 재료는 «재료» 규칙(`guessIngredientIcon`)을 본다 — 그게 못 찾으면 스스로 요리 규칙으로 넘긴다.
import FoodIcon, { guessIngredientIcon } from '../components/FoodIcon'
import { POPULAR_SEARCHES, TAG_LIST, INGREDIENT_CHIPS } from '../data/seed'
import { 검색빈손 } from '../stats'

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

  // 📊 [2026-09-14] 🔍 「찾았는데 «0건»이었다」
  //   ⭐ 왜 재나 = 「뭘 찾다 못 찾고 나가나」는 «레시피를 더 만들 근거»가 된다. 지금은 통째로 깜깜하다.
  //   ⛔⛔ 검색어는 «한 자도» 안 보낸다 — 나가는 건 「0건이었다」는 사실뿐이다(개인정보 규칙 그대로).
  //   ⛔ 막은 함정 둘 (설계 게이트 2026-09-14)
  //     ⓐ 글자를 칠 때마다 0건이라 «글자마다» 나간다 → 입력이 멎고 800ms 뒤 한 번만
  //     ⓑ 한 방문에서 계속 고쳐 치면 수십 건이 된다 → «3회» 상한
  const 빈손보낸수 = useRef(0)
  useEffect(() => {
    if (!query || results.length > 0) return
    if (빈손보낸수.current >= 3) return
    const t = setTimeout(() => {
      빈손보낸수.current += 1
      try { 검색빈손() } catch { /* 통계가 죽어도 검색은 된다 */ }
    }, 800)
    return () => clearTimeout(t)
  }, [query, results.length])

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
                    <FoodIcon name={c.icon || guessIngredientIcon(c.name)} size={34} />
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
