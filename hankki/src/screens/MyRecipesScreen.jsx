import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DiaryEntrySheet, { Stars } from '../components/DiaryEntrySheet'
import { TAG_LIST } from '../data/seed'
import { dateLabel } from '../utils'
import { useBackHandler } from '../useBackHandler'

const dayKey = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// 월간 요리 캘린더 — 요리한 날에 점이 찍힌다. 날짜를 누르면 그날 기록만 모아본다.
function CookCalendar({ entries, selected, onSelect }) {
  const [ym, setYm] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  const counts = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const k = dayKey(e.at)
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [entries])
  const first = new Date(ym.y, ym.m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const today = new Date()
  const isToday = (d) => today.getFullYear() === ym.y && today.getMonth() === ym.m && today.getDate() === d
  const move = (diff) => {
    setYm((p) => {
      const d = new Date(p.y, p.m + diff, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
    onSelect(null)
  }
  const monthCount = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getFullYear() === ym.y && d.getMonth() === ym.m
  }).length
  return (
    <div className="card cal-card">
      <div className="cal-head">
        <button className="press cal-nav" onClick={() => move(-1)} aria-label="이전 달"><Icon name="chevron-left" size={18} color="var(--text-sub)" /></button>
        <div className="cal-title">{ym.y}년 {ym.m + 1}월 <span className="t-sub" style={{ fontSize: 12, fontWeight: 600 }}>· 🍳 {monthCount}번</span></div>
        <button className="press cal-nav" onClick={() => move(1)} aria-label="다음 달"><Icon name="chevron-right" size={18} color="var(--text-sub)" /></button>
      </div>
      <div className="cal-grid cal-week">
        {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
          <span key={w} style={{ color: i === 0 ? '#c46b5a' : 'var(--text-sub)' }}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {Array.from({ length: startPad }, (_, i) => <span key={'p' + i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const k = `${ym.y}-${ym.m}-${d}`
          const n = counts[k] || 0
          const on = selected === k
          return (
            <button
              key={d}
              className={`press cal-day ${on ? 'on' : ''} ${isToday(d) ? 'today' : ''}`}
              onClick={() => n && onSelect(on ? null : k)}
              disabled={!n}
            >
              <span>{d}</span>
              {n > 0 && <span className="cal-dot">{n > 1 ? n : ''}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MyRecipesScreen() {
  const { recipes, folders, addFolder, removeRecipe, diary, removeDiary } = useStore()
  const nav = useNav()
  const [view, setView] = useState('grid') // grid | log | folders
  const [folder, setFolder] = useState('전체')
  // 모아보기 크기 — 'big'(2열·이름 크게) | 'small'(3열 그리드). 선택은 기억된다.
  const [gridSize, setGridSizeState] = useState(() => {
    try { return localStorage.getItem('hankki:gridSize') || 'big' } catch { return 'big' }
  })
  const setGridSize = (v) => {
    setGridSizeState(v)
    try { localStorage.setItem('hankki:gridSize', v) } catch { /* noop */ }
  }
  const [edit, setEdit] = useState(false)
  const [newFolder, setNewFolder] = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const [logEditing, setLogEditing] = useState(null)

  // 뒤로가기: 다른 세그먼트(요리 기록·폴더)나 폴더 필터를 먼저 기본(레시피)으로 되돌린다.
  useBackHandler(() => {
    if (view !== 'grid') { setView('grid'); return true }
    if (folder !== '전체') { setFolder('전체'); return true }
    return false
  })

  const del = (r) => setDelTarget(r)

  const sorted = useMemo(() => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt), [recipes])
  const list = folder === '전체' ? sorted : sorted.filter((r) => (r.folder || r.category) === folder)
  const countIn = (name) => sorted.filter((r) => (r.folder || r.category) === name).length

  // 요리 기록(내가 만든 요리 아카이브) — 앨범 + 캘린더
  const entries = useMemo(() => [...diary].sort((a, b) => b.at - a.at), [diary])
  const [dayFilter, setDayFilter] = useState(null) // 'y-m-d' | null — 캘린더에서 고른 날
  const now = new Date()
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  // 최애 요리 — 제일 많이 만든 메뉴
  const topDish = useMemo(() => {
    const c = {}
    for (const e of entries) c[e.title] = (c[e.title] || 0) + 1
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0]
    return best && best[1] >= 2 ? best[0] : null
  }, [entries])
  const shown = dayFilter ? entries.filter((e) => dayKey(e.at) === dayFilter) : entries
  const openRecipe = (e) => {
    if (recipes.some((r) => r.id === e.recipeId)) nav.push({ name: 'detail', id: e.recipeId })
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">레시피</div>
          <TabTips tab="myrecipes" />
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {view === 'grid' && (
            <>
              <button className="t-more press" style={{ marginRight: 2, fontSize: 14 }} onClick={() => setEdit((v) => !v)}>
                {edit ? '완료' : '편집'}
              </button>
              {/* 크게 보기(2열) ↔ 그리드(3열) 전환 */}
              <button className="icon-btn press" onClick={() => setGridSize(gridSize === 'big' ? 'small' : 'big')} aria-label="보기 방식 전환">
                <Icon name={gridSize === 'big' ? 'grid-small' : 'grid-big'} size={21} color="var(--text-sub)" />
              </button>
            </>
          )}
          <button className="icon-btn press" onClick={() => nav.go('search')} aria-label="검색"><Icon name="search" size={22} /></button>
        </div>
      </div>

      {/* 세그먼트 — 일지 탭을 '요리 기록'으로 흡수 */}
      <div className="pad">
        <div className="segment">
          <button className={`seg ${view === 'grid' ? 'on' : ''}`} onClick={() => setView('grid')}>모아보기</button>
          <button className={`seg ${view === 'log' ? 'on' : ''}`} onClick={() => setView('log')}>요리 기록</button>
          <button className={`seg ${view === 'folders' ? 'on' : ''}`} onClick={() => setView('folders')}>폴더 · 태그</button>
        </div>
      </div>

      {view === 'log' && (
        <div className="pad fade">
          {/* 나의 요리 앨범 — 내가 만든 요리 아카이브 */}
          <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>
            📖 <b style={{ color: 'var(--text)' }}>내가 만든 요리 아카이브</b> — 레시피에서 ‘만들었어요!’를 누르면 한 장씩 쌓여요. 사진을 누르면 별점·팁을 남길 수 있어요.
          </div>
          {entries.length > 0 && (
            <div className="card" style={{ padding: '11px 14px', marginBottom: 12, background: 'var(--cream)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, fontWeight: 600 }}>
              <span>이번 달 🍳 <b style={{ color: 'var(--brown)' }}>{thisMonth}</b>번</span>
              <span style={{ color: 'var(--sand)' }}>·</span>
              <span>총 <b style={{ color: 'var(--brown)' }}>{entries.length}</b>개</span>
              {topDish && (
                <>
                  <span style={{ color: 'var(--sand)' }}>·</span>
                  <span>최애 🥇 <b style={{ color: 'var(--brown)' }}>{topDish}</b></span>
                </>
              )}
            </div>
          )}

          {entries.length > 0 && (
            <CookCalendar entries={entries} selected={dayFilter} onSelect={setDayFilter} />
          )}

          {dayFilter && (
            <button className="press" onClick={() => setDayFilter(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '2px 0 10px', padding: '6px 12px', borderRadius: 999, background: 'var(--brown)', color: '#fff', fontSize: 12.5, fontWeight: 700 }}>
              {Number(dayFilter.split('-')[1]) + 1}월 {dayFilter.split('-')[2]}일의 요리 {shown.length}개 <Icon name="x" size={13} color="#fff" stroke={2.4} />
            </button>
          )}

          {entries.length === 0 ? (
            <div className="empty" style={{ marginTop: 10 }}>{'아직 기록이 없어요.\n레시피에서 "만들었어요!"를 누르면 여기에 쌓여요.'}</div>
          ) : (
            <div className="album-grid">
              {shown.map((e) => (
                <button key={e.id} className="album-tile press" onClick={() => setLogEditing(e)} aria-label={`${e.title} 기록 보기`}>
                  {e.photo ? (
                    <img src={e.photo} alt="" loading="lazy" />
                  ) : (
                    <div className="album-icon"><FoodIcon name={guessFoodIcon(e.title)} size={34} /></div>
                  )}
                  {e.rating > 0 && <span className="album-star">★{e.rating}</span>}
                  <span className="album-cap">{e.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'grid' && (
        <>
          <div className="hscroll" style={{ marginBottom: 8 }}>
            <button className={`pill press ${folder === '전체' ? 'active' : ''}`} onClick={() => setFolder('전체')}>전체 {sorted.length}</button>
            {folders.map((c) => (
              <button key={c} className={`pill press ${folder === c ? 'active' : ''}`} onClick={() => setFolder(c)}>{c} {countIn(c)}</button>
            ))}
          </div>
          <div className="pad">
            {list.length === 0 ? (
              <div className="empty">{'이 폴더에 레시피가 없어요.\n가져오기로 채워보세요.'}</div>
            ) : (
              <div className={gridSize === 'big' ? 'grid2' : 'grid3'}>
                {list.map((r) => (
                  <div key={r.id} className="grid-card" style={{ position: 'relative' }}>
                    <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => (edit ? del(r) : nav.push({ name: 'detail', id: r.id }))}>
                      <Thumb recipe={r} ratio="1/1" radius={gridSize === 'big' ? 16 : 12} emojiSize={gridSize === 'big' ? undefined : '1.6rem'} />
                      {r.favorite && !edit && (
                        <div className="fav-dot"><Icon name="bookmark" size={gridSize === 'big' ? 16 : 13} color="var(--brown)" style={{ fill: 'var(--brown)' }} /></div>
                      )}
                      <div className="name" style={gridSize === 'small' ? { fontSize: 11.5, marginTop: 5 } : undefined}>{r.title}</div>
                      {gridSize === 'big' && <div className="date">{dateLabel(r.savedAt)}</div>}
                    </button>
                    {edit && (
                      <button className="card-del press" onClick={() => del(r)} aria-label="삭제">
                        <Icon name="x" size={16} color="#fff" stroke={2.6} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'folders' && (
        <div className="pad fade">
          <div className="h-section" style={{ margin: '10px 0 13px' }}>폴더</div>
          <div className="grid2">
            {folders.map((c) => (
              <button key={c} className="card press" style={{ padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }} onClick={() => { setView('grid'); setFolder(c) }}>
                <Icon name="folder" size={26} color="var(--sand)" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c}</div>
                  <div className="t-sub" style={{ marginTop: 2 }}>{countIn(c)}개</div>
                </div>
              </button>
            ))}
            <button
              className="card press"
              style={{ padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', alignItems: 'center', color: 'var(--text-sub)', borderStyle: 'dashed' }}
              onClick={() => setNewFolder(true)}
            >
              <Icon name="plus" size={24} color="var(--text-sub)" />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>새 폴더</span>
            </button>
          </div>

          <div className="h-section" style={{ margin: '28px 0 13px' }}>태그</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAG_LIST.map((t) => (
              <button
                key={t}
                className="tag press"
                onClick={() => {
                  // 태그를 넘겨서 검색 탭이 바로 그 태그로 검색하게 한다.
                  try { sessionStorage.setItem('hankki:searchQ', t) } catch { /* noop */ }
                  nav.go('search')
                }}
              ># {t}</button>
            ))}
          </div>
        </div>
      )}

      {newFolder && (
        <PromptSheet
          title="새 폴더"
          fields={[{ key: 'name', label: '폴더 이름', placeholder: '예) 자주 만드는' }]}
          onSubmit={({ name }) => { const nm = name.trim(); if (nm) addFolder(nm) }}
          onClose={() => setNewFolder(false)}
        />
      )}

      {delTarget && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`'${delTarget.title}' 레시피를 삭제할까요?`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeRecipe(delTarget.id); nav.showToast('레시피를 삭제했어요') }}
          onClose={() => setDelTarget(null)}
        />
      )}

      {logEditing && (
        <DiaryEntrySheet
          entry={logEditing}
          onClose={() => setLogEditing(null)}
          onDelete={() => { removeDiary(logEditing.id); setLogEditing(null); nav.showToast('기록을 삭제했어요') }}
          onOpenRecipe={recipes.some((r) => r.id === logEditing.recipeId) ? () => { const e = logEditing; setLogEditing(null); openRecipe(e) } : undefined}
        />
      )}
    </>
  )
}
