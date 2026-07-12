import { useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import { SOURCES } from '../data/seed'

export default function RecipeDetailScreen({ id }) {
  const { recipes, toggleFavorite, cook, removeRecipe, addShopItems } = useStore()
  const nav = useNav()
  const [menu, setMenu] = useState(false)
  const r = recipes.find((x) => x.id === id)

  if (!r) {
    return (
      <div className="screen">
        <div className="topbar-back">
          <button className="icon-btn press" onClick={() => nav.pop()}><Icon name="chevron-left" size={24} /></button>
        </div>
        <div className="empty">레시피를 찾을 수 없어요.</div>
      </div>
    )
  }

  const info = [
    r.time ? `${r.time}분` : null,
    r.servings ? `${r.servings}인분` : null,
    r.difficulty || null,
  ].filter(Boolean)

  const onCook = () => {
    cook(r.id)
    nav.showToast('맛있게 드셨나요? 자주 해먹는 요리에 담았어요 🎉')
  }

  const del = () => {
    setMenu(false)
    removeRecipe(r.id)
    nav.pop()
    nav.showToast('레시피를 삭제했어요')
  }

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      {/* 상단 오버레이 바 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', padding: '10px 12px', paddingTop: 'calc(10px + var(--safe-top))' }}>
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="round-btn press" onClick={() => toggleFavorite(r.id)} aria-label="즐겨찾기">
            <Icon name="bookmark" size={20} color={r.favorite ? 'var(--brown)' : 'var(--text)'} style={{ fill: r.favorite ? 'var(--brown)' : 'none' }} />
          </button>
          <button className="round-btn press" onClick={() => setMenu(true)} aria-label="더보기"><Icon name="more" size={22} /></button>
        </div>
      </div>

      {/* 히어로 이미지 */}
      <div style={{ position: 'relative' }}>
        <Thumb recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(63,50,39,0.55)', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999 }}>
          {r.image ? '1 / 1' : r.emoji}
        </div>
      </div>

      <div className="pad" style={{ paddingTop: 18, paddingBottom: 120 }}>
        {r.status === 'unsorted' && (
          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
            onClick={() => nav.push({ name: 'editor', id: r.id })}
          >
            <Icon name="edit" size={20} color="var(--brown)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown)' }}>아직 정리 전이에요</div>
              <div className="t-sub" style={{ fontSize: 12.5 }}>제목·재료·태그를 정리하고 레시피로 저장하기</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--brown)" />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div className="h-title" style={{ fontSize: 24 }}>{r.title}</div>
          <button className="icon-btn press" onClick={() => toggleFavorite(r.id)} style={{ marginTop: 2 }}>
            <Icon name="bookmark" size={24} color={r.favorite ? 'var(--brown)' : 'var(--sand)'} style={{ fill: r.favorite ? 'var(--brown)' : 'none' }} />
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <SourceBadge source={r.source} size={16} showLabel={false} />
          <span className="t-sub" style={{ marginLeft: 6 }}>{SOURCES[r.source]?.label || '링크'}에서 가져옴</span>
        </div>

        {info.length > 0 && (
          <div className="info-pills" style={{ marginTop: 16 }}>
            {info.map((t) => (
              <span key={t} className="info-pill">{t}</span>
            ))}
          </div>
        )}

        {r.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {r.tags.map((t) => (
              <span key={t} className="tag"># {t}</span>
            ))}
          </div>
        )}

        {r.ingredients?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="h-section">재료</div>
              <button
                className="mini-buy press"
                onClick={() => {
                  addShopItems(r.ingredients)
                  nav.showToast('재료를 장보기 리스트에 담았어요 🛒')
                }}
              >
                🛒 장보기 담기
              </button>
            </div>
            <div>
              {r.ingredients.map((ing, i) => (
                <div key={i} className="ing">{ing}</div>
              ))}
            </div>
          </>
        )}

        {r.steps?.length > 0 && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 6 }}>만드는 법</div>
            <div>
              {r.steps.map((s, i) => (
                <div key={i} className="step">
                  <div className="n">{i + 1}</div>
                  <div className="txt">{s}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {r.memo && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>메모</div>
            <div className="card" style={{ padding: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--text)', background: 'var(--cream)', border: 'none' }}>
              {r.memo}
            </div>
          </>
        )}

        {r.sourceUrl && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>원본 링크</div>
            <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="card press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, textDecoration: 'none', color: 'var(--text)' }}>
              <Icon name="link" size={20} color="var(--sand)" />
              <span style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sourceUrl}</span>
              <Icon name="chevron-right" size={18} color="var(--sand)" />
            </a>
          </>
        )}

        {r.cooked > 0 && (
          <div className="t-sub" style={{ marginTop: 22, textAlign: 'center' }}>
            지금까지 {r.cooked}번 만들었어요 🍳
          </div>
        )}
      </div>

      {/* 하단 만들었어요 */}
      <div className="action-bar">
        <button className="btn-primary press" onClick={onCook}>만들었어요! 🎉</button>
      </div>

      {menu && (
        <div className="sheet-mask" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <button className="sheet-item press" onClick={() => { setMenu(false); nav.push({ name: 'editor', id: r.id }) }}>
              <Icon name="edit" size={20} color="var(--text)" /> 편집하기
            </button>
            <hr className="divider" />
            <button className="sheet-item press" onClick={del} style={{ color: 'var(--danger)' }}>
              <Icon name="trash" size={20} color="var(--danger)" /> 삭제하기
            </button>
            <hr className="divider" />
            <button className="sheet-item press" onClick={() => setMenu(false)} style={{ justifyContent: 'center', color: 'var(--text-sub)' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
