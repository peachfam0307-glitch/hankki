import { useState, useRef } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import TimerSheet from '../components/TimerSheet'
import DiaryEntrySheet, { Stars } from '../components/DiaryEntrySheet'
import Portal from '../components/Portal'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import { shareRecipeCard } from '../shareCard'
import { scaleIngredient } from '../scale'
import { dateLabel } from '../utils'
import { SOURCES } from '../data/seed'

export default function RecipeDetailScreen({ id }) {
  const { recipes, toggleFavorite, cook, removeRecipe, addShopItems, diary, addDiary, removeDiary, updateRecipe } = useStore()
  const nav = useNav()
  const [menu, setMenu] = useState(false)
  const [timer, setTimer] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [logEntry, setLogEntry] = useState(null)
  const [decorOpen, setDecorOpen] = useState(false)
  const iconRef = useRef(null)
  const r = recipes.find((x) => x.id === id)
  const baseServings = r?.servings || 0
  const [servings, setServings] = useState(baseServings || 1)
  const ratio = baseServings ? servings / baseServings : 1

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

  const myEntries = diary.filter((d) => d.recipeId === id).sort((a, b) => b.at - a.at)
  const latestEntry = myEntries[0]
  const cookedN = r?.cooked || myEntries.length

  const onCook = () => {
    // 오늘 이미 기록이 있으면(요리모드 완료 등) 새로 만들지 않고 그 기록을 이어서 쓴다 — 하루 두 번 집계 방지
    const today = new Date().toDateString()
    const existing = myEntries.find((d) => new Date(d.at).toDateString() === today)
    if (existing) {
      setLogEntry(existing)
      nav.showToast('오늘 기록에 이어서 남겨요 ✍️')
      return
    }
    const entry = { id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null }
    addDiary(entry)
    cook(r.id)
    setLogEntry(entry)
    nav.showToast('만들었어요! 요리 기록에 남겼어요 🎉')
  }

  const del = () => {
    setMenu(false)
    setConfirmDel(true)
  }
  const doDelete = () => {
    removeRecipe(r.id)
    nav.pop()
    nav.showToast('레시피를 삭제했어요')
  }

  const onShare = async () => {
    setMenu(false)
    nav.showToast('공유 카드 만드는 중…')
    const svg = iconRef.current?.querySelector('svg')?.outerHTML
    const appUrl = location.origin + (import.meta.env.BASE_URL || '/')
    await shareRecipeCard({
      title: r.title,
      info,
      ingredients: (r.ingredients || []).map((i) => scaleIngredient(i, ratio)),
      steps: r.steps || [],
      iconSvg: svg,
      appUrl,
    })
  }

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      {/* 공유 카드용 숨은 아이콘 (SVG 직렬화 소스) */}
      <div ref={iconRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <FoodIcon name={r.icon || guessFoodIcon(r.title)} size={240} />
      </div>

      {/* 상단 오버레이 바 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', padding: '10px 12px', paddingTop: 'calc(10px + var(--safe-top))' }}>
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 편집을 상단으로 꺼내 잘 보이게 — 표지 사진/이모지/아이콘·제목·재료를 여기서 바꾼다 */}
          <button className="round-btn press" onClick={() => nav.push({ name: 'editor', id: r.id })} aria-label="편집">
            <Icon name="edit" size={19} />
          </button>
          <button className="round-btn press" onClick={() => toggleFavorite(r.id)} aria-label="즐겨찾기">
            <Icon name="bookmark" size={20} color={r.favorite ? 'var(--brown)' : 'var(--text)'} style={{ fill: r.favorite ? 'var(--brown)' : 'none' }} />
          </button>
          <button className="round-btn press" onClick={() => setMenu(true)} aria-label="더보기"><Icon name="more" size={22} /></button>
        </div>
      </div>

      {/* 히어로 이미지(표지) — 꾸미기 스티커·포스트잇이 이 위에 얹힌다 */}
      <div style={{ position: 'relative' }}>
        <Thumb recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
        <DecorLayer items={r.decor || []} />
        {/* 표지 꾸미기 — 솔직한 버튼으로 눈에 띄게(포인트색 채운 알약) */}
        <button
          className="press"
          onClick={() => setDecorOpen(true)}
          aria-label="표지 꾸미기"
          style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brown)', color: '#fff', fontSize: 13.5, fontWeight: 800, padding: '9px 15px', borderRadius: 999, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}
        >
          🎨 꾸미기
        </button>
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

        {/* 즐겨찾기는 상단 오버레이 북마크 하나로 통일 (중복 버튼 정리) */}
        <div className="h-title" style={{ fontSize: 24 }}>{r.title}</div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <SourceBadge source={r.source} size={16} showLabel={false} />
          <span className="t-sub" style={{ marginLeft: 2 }}>{SOURCES[r.source]?.label || '링크'}에서 가져옴</span>
          {/* 저장 날짜 — 자동 기록(savedAt) */}
          {r.savedAt && <span className="t-sub">· {dateLabel(r.savedAt)} 저장</span>}
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

        {/* 내 요리 기록 — 위로 올려 잘 보이게. 별점·만든 횟수·최근 메모 요약, 탭하면 남기기/보기.
            (‘나만의 팁’은 이제 표지 꾸미기 포스트잇·글자로 — 역할이 겹치지 않게 분리) */}
        {(myEntries.length > 0 || cookedN > 0) && (
          <button
            className="card press"
            onClick={() => (latestEntry ? setLogEntry(latestEntry) : onCook())}
            style={{ width: '100%', textAlign: 'left', marginTop: 18, padding: 13, display: 'flex', gap: 12, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
          >
            {latestEntry?.photo ? (
              <img src={latestEntry.photo} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', flex: '0 0 auto' }} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 22 }}>✍️</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>내 요리 기록</span>
                {latestEntry?.rating > 0 && <Stars value={latestEntry.rating} onChange={() => {}} size={13} />}
              </div>
              <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3 }}>
                {cookedN}번 만들었어요{latestEntry ? ` · ${dateLabel(latestEntry.at)}` : ''}
              </div>
              {latestEntry?.note && (
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>“{latestEntry.note}”</div>
              )}
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>
        )}

        {r.ingredients?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="h-section">재료</div>
              <button
                className="mini-buy press"
                onClick={() => {
                  addShopItems(r.ingredients.map((ing) => scaleIngredient(ing, ratio)))
                  nav.showToast('재료를 장보기 리스트에 담았어요 🛒')
                }}
              >
                장보기 담기
              </button>
            </div>
            {baseServings > 0 && (
              <div className="serv-row">
                <span className="serv-label">인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.max(1, v - 1))} aria-label="줄이기"><Icon name="minus" size={16} color="var(--brown)" /></button>
                <span className="serv-val">{servings}인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.min(20, v + 1))} aria-label="늘리기"><Icon name="plus" size={16} color="var(--brown)" /></button>
                {servings !== baseServings && <button className="serv-reset press" onClick={() => setServings(baseServings)}>기본 {baseServings}인분</button>}
              </div>
            )}
            <div>
              {r.ingredients.map((ing, i) => (
                <div key={i} className="ing">{scaleIngredient(ing, ratio)}</div>
              ))}
            </div>
          </>
        )}

        {r.steps?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="h-section">만드는 법</div>
              <button className="mini-buy press" onClick={() => setTimer(true)}>⏱ 타이머</button>
            </div>
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

      </div>

      {/* 하단 액션 — 요리 시작 / 만들었어요 */}
      <div className="action-bar" style={{ display: 'flex', gap: 10 }}>
        {r.steps?.length > 0 && (
          <button className="btn-primary press" style={{ flex: 1 }} onClick={() => nav.push({ name: 'cook', id: r.id })}>
            요리 시작 →
          </button>
        )}
        <button
          className={r.steps?.length > 0 ? 'btn-ghost press' : 'btn-primary press'}
          style={{ flex: r.steps?.length > 0 ? '0 0 auto' : 1, paddingLeft: 18, paddingRight: 18 }}
          onClick={onCook}
        >
          만들었어요 🎉
        </button>
      </div>

      {decorOpen && (
        <DecorEditor
          recipe={r}
          onSave={(items) => {
            updateRecipe(r.id, { decor: items })
            setDecorOpen(false)
            nav.showToast(items.length ? '표지를 예쁘게 꾸몄어요 🎀' : '꾸미기를 비웠어요')
          }}
          onClose={() => setDecorOpen(false)}
        />
      )}

      {timer && <TimerSheet label={r.title} onClose={() => setTimer(false)} />}

      {confirmDel && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${r.title}』 레시피를 삭제할까요?`}
          confirmLabel="삭제하기"
          danger
          onConfirm={doDelete}
          onClose={() => setConfirmDel(false)}
        />
      )}

      {logEntry && (
        <DiaryEntrySheet
          entry={logEntry}
          onClose={() => setLogEntry(null)}
          onDelete={() => { removeDiary(logEntry.id); setLogEntry(null); nav.showToast('기록을 삭제했어요') }}
        />
      )}

      {menu && (
       <Portal>
        <div className="sheet-mask" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <button className="sheet-item press" onClick={onShare}>
              <Icon name="link" size={20} color="var(--text)" /> 친구와 레시피 나누기 <span className="t-sub" style={{ fontWeight: 400, fontSize: 12.5 }}>· 예쁜 카드로</span>
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
       </Portal>
      )}
    </div>
  )
}
