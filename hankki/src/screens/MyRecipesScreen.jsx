import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DiaryEntrySheet from '../components/DiaryEntrySheet'
import { dateLabel } from '../utils'
import { useBackHandler } from '../useBackHandler'

// 카테고리와 연결된 기본 폴더 — 삭제 불가(사용자가 만든 폴더만 지울 수 있게)
const DEFAULT_FOLDERS = new Set(['한식', '양식', '일식', '간식', '아시안'])

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
  const { recipes, folders, addFolder, removeFolder, removeRecipe, diary, removeDiary } = useStore()
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
  const [delFolder, setDelFolder] = useState(null) // 삭제할 사용자 폴더 이름
  const [logEditing, setLogEditing] = useState(null)

  // 뒤로가기 처리는 모달(요리기록 시트 등)까지 포함해 아래(상태 선언 뒤)에서 한 번에 등록한다.

  const del = (r) => setDelTarget(r)

  const sorted = useMemo(() => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt), [recipes])
  // 스마트 폴더 — ★즐겨찾기 / 🍳자주 해먹는. 실제 폴더와 안 겹치게 '__' 접두 키를 쓴다.
  const favCount = sorted.filter((r) => r.favorite).length
  const oftenCount = sorted.filter((r) => (r.cooked || 0) > 0).length
  const list =
    folder === '전체' ? sorted
      : folder === '__fav' ? sorted.filter((r) => r.favorite)
      : folder === '__often' ? sorted.filter((r) => (r.cooked || 0) > 0).sort((a, b) => (b.cooked || 0) - (a.cooked || 0))
      : sorted.filter((r) => (r.folder || r.category) === folder)
  const countIn = (name) => sorted.filter((r) => (r.folder || r.category) === name).length
  const isUserFolder = folder !== '전체' && folder !== '__fav' && folder !== '__often' && !DEFAULT_FOLDERS.has(folder)

  // 요리 기록(내가 만든 요리 아카이브) — 앨범 + 캘린더
  const entries = useMemo(() => [...diary].sort((a, b) => b.at - a.at), [diary])
  const [dayFilter, setDayFilter] = useState(null) // 'y-m-d' | null — 캘린더에서 고른 날
  const [showCal, setShowCal] = useState(false) // 요리 달력은 접이식(기본 접힘) — 앨범을 앞세운다

  // 안드로이드 뒤로가기(버튼·제스처): 열린 모달·시트·필터를 먼저 닫는다.
  // (안 닫으면 뒤로가기가 화면을 넘어 '앱 종료'로 샌다.) 나중에 뜬 레이어부터 하나씩.
  useBackHandler(() => {
    if (logEditing) { setLogEditing(null); return true }
    if (delTarget) { setDelTarget(null); return true }
    if (delFolder) { setDelFolder(null); return true }
    if (newFolder) { setNewFolder(false); return true }
    if (dayFilter) { setDayFilter(null); return true }
    if (showCal) { setShowCal(false); return true }
    if (edit) { setEdit(false); return true }
    if (view !== 'grid') { setView('grid'); return true }
    if (folder !== '전체') { setFolder('전체'); return true }
    return false
  }, { tabLevel: true }) // 탭 화면 — 위에 상세·요리 등 스택 화면이 있으면 이 핸들러는 잠재운다
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

          {/* 요리 달력 — 접이식(기본 접힘). 앨범(사진 기록)이 이 탭의 주인공이고,
              달력은 기록이 쌓인 사람에게만 의미 있어 필요할 때 펼쳐 본다. */}
          {entries.length > 0 && (
            <button
              className="press"
              onClick={() => setShowCal((v) => !v)}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: showCal ? 10 : 12, padding: '9px 0', borderRadius: 12, background: 'var(--cream)', color: 'var(--brown)', fontSize: 13, fontWeight: 700 }}
            >
              📅 요리 달력 {showCal ? '접기 ▴' : '보기 ▾'}
            </button>
          )}
          {entries.length > 0 && showCal && (
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
            {favCount > 0 && (
              <button className={`pill press ${folder === '__fav' ? 'active' : ''}`} onClick={() => setFolder('__fav')}>★ 즐겨찾기 {favCount}</button>
            )}
            {oftenCount > 0 && (
              <button className={`pill press ${folder === '__often' ? 'active' : ''}`} onClick={() => setFolder('__often')}>🍳 자주 {oftenCount}</button>
            )}
            {folders.map((c) => (
              <button key={c} className={`pill press ${folder === c ? 'active' : ''}`} onClick={() => setFolder(c)}>{c} {countIn(c)}</button>
            ))}
            <button className="pill press" style={{ borderStyle: 'dashed', color: 'var(--text-sub)' }} onClick={() => setNewFolder(true)}>＋ 폴더</button>
          </div>
          <div className="pad">
            {/* 사용자가 만든 폴더는 여기서 바로 삭제(폴더·태그 탭을 없애 모아보기로 흡수) */}
            {isUserFolder && (
              <button className="press" onClick={() => setDelFolder(folder)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '6px 11px', borderRadius: 999, background: 'var(--cream)', color: 'var(--text-sub)', fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="x" size={13} color="var(--text-sub)" stroke={2.2} /> ‘{folder}’ 폴더 삭제
              </button>
            )}
            {list.length === 0 ? (
              <div className="empty">{'이 폴더에 레시피가 없어요.\n가져오기로 채워보세요.'}</div>
            ) : (
              <div className={gridSize === 'big' ? 'grid2' : 'grid3'}>
                {list.map((r) => (
                  <div key={r.id} className="grid-card" style={{ position: 'relative' }}>
                    <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => (edit ? del(r) : nav.push({ name: 'detail', id: r.id }))}>
                      <Thumb recipe={r} ratio="1/1" radius={gridSize === 'big' ? 16 : 12} emojiSize={gridSize === 'big' ? undefined : '1.6rem'} showDecor />
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

      {delFolder && (
        <ConfirmSheet
          title="폴더 삭제"
          message={`'${delFolder}' 폴더를 삭제할까요?\n안에 있던 레시피는 지워지지 않고 카테고리로 돌아가요.`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeFolder(delFolder); nav.showToast('폴더를 삭제했어요') }}
          onClose={() => setDelFolder(null)}
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
