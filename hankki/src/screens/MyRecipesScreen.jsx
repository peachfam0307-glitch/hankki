import { useMemo, useRef, useState } from 'react'
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
import CoachMarks, { needsCoach } from '../components/CoachMarks'

// 레시피 탭 첫 방문 코치마크 — 모아보기·요리 기록 세그먼트 안내
const MYRECIPES_COACH_KEY = 'hankki:coach:myrecipes'
const MYRECIPES_COACH_STEPS = [
  { sel: '[data-coach="collection"]', label: '🗂️ 모아보기', desc: '저장한 레시피를 한눈에 · 폴더·카테고리로 정리돼요' },
  { sel: '[data-coach="log"]', label: '📖 요리 기록', desc: '만든 요리를 별점·사진으로 남기는 나만의 요리 일기' },
]

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
  const [coach, setCoach] = useState(() => needsCoach(MYRECIPES_COACH_KEY))
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
  // 편집 모드 다중 선택 — 카드 탭으로 체크하고 아래 바에서 한 번에 삭제(하나씩 지우기 불편 해소)
  const [sel, setSel] = useState(() => new Set())
  const [delSelAsk, setDelSelAsk] = useState(false)
  const toggleSel = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const exitEdit = () => { setEdit(false); setSel(new Set()) }
  // 요리 기록도 동일한 다중 선택 삭제 (모아보기와 별도 상태)
  const [logEdit, setLogEdit] = useState(false)
  const [logSel, setLogSel] = useState(() => new Set())
  const [delLogAsk, setDelLogAsk] = useState(false)
  const toggleLogSel = (id) => setLogSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const exitLogEdit = () => { setLogEdit(false); setLogSel(new Set()) }
  // 카드를 꾹(길게) 누르면 바로 선택 모드 진입 — 갤러리 앱과 같은 습관 지원.
  // 손가락이 12px 이상 움직이면(스크롤) 취소, 발동 후의 클릭은 무시(중복 토글 방지).
  // hold(onFire) 로 공용화 — 모아보기·요리 기록 둘 다 사용.
  const lpTimer = useRef(null)
  const lpFired = useRef(false)
  const lpStart = useRef({ x: 0, y: 0 })
  const hold = (onFire) => ({
    onPointerDown: (e) => {
      lpFired.current = false
      lpStart.current = { x: e.clientX, y: e.clientY }
      clearTimeout(lpTimer.current)
      lpTimer.current = setTimeout(() => {
        lpFired.current = true
        try { if (navigator.vibrate) navigator.vibrate(15) } catch { /* noop */ }
        onFire()
      }, 450)
    },
    onPointerMove: (e) => {
      if (Math.hypot(e.clientX - lpStart.current.x, e.clientY - lpStart.current.y) > 12) clearTimeout(lpTimer.current)
    },
    onPointerUp: () => clearTimeout(lpTimer.current),
    onPointerCancel: () => clearTimeout(lpTimer.current),
    onContextMenu: (e) => e.preventDefault(),
  })
  const lpDown = (r) => hold(() => { setEdit(true); setSel((s) => { const n = new Set(s); n.add(r.id); return n }) }).onPointerDown
  const lpMove = (e) => {
    if (Math.hypot(e.clientX - lpStart.current.x, e.clientY - lpStart.current.y) > 12) clearTimeout(lpTimer.current)
  }
  const lpEnd = () => clearTimeout(lpTimer.current)
  const [newFolder, setNewFolder] = useState(false)
  const [delFolder, setDelFolder] = useState(null) // 삭제할 사용자 폴더 이름
  const [logEditing, setLogEditing] = useState(null)

  // 뒤로가기 처리는 모달(요리기록 시트 등)까지 포함해 아래(상태 선언 뒤)에서 한 번에 등록한다.

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
  // 비모달 상태(달력·세그먼트·필터)만 처리 — 모달(기록·삭제확인·폴더추가 시트)은 각 시트가 자체 처리.
  useBackHandler(() => {
    if (dayFilter) { setDayFilter(null); return true }
    if (showCal) { setShowCal(false); return true }
    if (logEdit) { exitLogEdit(); return true }
    if (edit) { exitEdit(); return true }
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
              <button className="t-more press" style={{ marginRight: 2, fontSize: 14 }} onClick={() => (edit ? exitEdit() : setEdit(true))}>
                {edit ? '완료' : '편집'}
              </button>
              {/* 크게 보기(2열) ↔ 그리드(3열) 전환 */}
              <button className="icon-btn press" onClick={() => setGridSize(gridSize === 'big' ? 'small' : 'big')} aria-label="보기 방식 전환">
                <Icon name={gridSize === 'big' ? 'grid-small' : 'grid-big'} size={21} color="var(--text-sub)" />
              </button>
            </>
          )}
          {view === 'log' && entries.length > 0 && (
            <button className="t-more press" style={{ marginRight: 2, fontSize: 14 }} onClick={() => (logEdit ? exitLogEdit() : setLogEdit(true))}>
              {logEdit ? '완료' : '편집'}
            </button>
          )}
          <button className="icon-btn press" onClick={() => nav.go('search')} aria-label="검색"><Icon name="search" size={22} /></button>
        </div>
      </div>

      {/* 세그먼트 — 일지 탭을 '요리 기록'으로 흡수 */}
      <div className="pad">
        <div className="segment">
          <button className={`seg ${view === 'grid' ? 'on' : ''}`} data-coach="collection" onClick={() => setView('grid')}>모아보기</button>
          <button className={`seg ${view === 'log' ? 'on' : ''}`} data-coach="log" onClick={() => setView('log')}>요리 기록</button>
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
              {shown.map((e) => {
                const on = logEdit && logSel.has(e.id)
                return (
                  <button
                    key={e.id}
                    className="album-tile press"
                    aria-label={`${e.title} 기록 보기`}
                    style={{ position: 'relative', opacity: logEdit && !on ? 0.75 : 1, outline: on ? '3px solid var(--brown)' : 'none', outlineOffset: -3, WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                    {...hold(() => { setLogEdit(true); setLogSel((s) => { const n = new Set(s); n.add(e.id); return n }) })}
                    onClick={() => {
                      if (lpFired.current) { lpFired.current = false; return } // 꾹 누름 발동 직후 클릭 무시
                      if (logEdit) toggleLogSel(e.id)
                      else setLogEditing(e)
                    }}
                  >
                    {e.photo ? (
                      <img src={e.photo} alt="" loading="lazy" />
                    ) : (
                      <div className="album-icon"><FoodIcon name={guessFoodIcon(e.title)} size={34} /></div>
                    )}
                    {e.rating > 0 && !logEdit && <span className="album-star">★{e.rating}</span>}
                    <span className="album-cap">{e.title}</span>
                    {logEdit && (
                      <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: on ? 'var(--brown)' : 'rgba(255,255,255,0.92)', border: on ? 'none' : '1.8px solid rgba(0,0,0,0.22)', boxShadow: '0 1px 5px rgba(0,0,0,0.22)' }}>
                        {on && <Icon name="check" size={14} color="#fff" stroke={3} />}
                      </span>
                    )}
                  </button>
                )
              })}
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
                {list.map((r) => {
                  const on = edit && sel.has(r.id)
                  return (
                    <div key={r.id} className="grid-card" style={{ position: 'relative' }}>
                      {/* 편집 모드: 카드 탭 = 선택 토글(여러 개 골라 한 번에 삭제) */}
                      <button
                        className="press"
                        style={{ textAlign: 'left', width: '100%', opacity: edit && !on ? 0.75 : 1, WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                        onPointerDown={lpDown(r)}
                        onPointerMove={lpMove}
                        onPointerUp={lpEnd}
                        onPointerCancel={lpEnd}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => {
                          if (lpFired.current) { lpFired.current = false; return } // 꾹 누름 발동 직후 클릭은 무시
                          if (edit) toggleSel(r.id)
                          else nav.push({ name: 'detail', id: r.id })
                        }}
                      >
                        <div style={on ? { outline: '3px solid var(--brown)', outlineOffset: -3, borderRadius: gridSize === 'big' ? 16 : 12 } : undefined}>
                          <Thumb recipe={r} ratio="1/1" radius={gridSize === 'big' ? 16 : 12} emojiSize={gridSize === 'big' ? undefined : '1.6rem'} showDecor />
                        </div>
                        {r.favorite && !edit && (
                          <div className="fav-dot"><Icon name="bookmark" size={gridSize === 'big' ? 16 : 13} color="var(--brown)" style={{ fill: 'var(--brown)' }} /></div>
                        )}
                        <div className="name" style={gridSize === 'small' ? { fontSize: 11.5, marginTop: 5 } : undefined}>{r.title}</div>
                        {gridSize === 'big' && <div className="date">{dateLabel(r.savedAt)}</div>}
                      </button>
                      {edit && (
                        <div aria-hidden style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: on ? 'var(--brown)' : 'rgba(255,255,255,0.92)', border: on ? 'none' : '1.8px solid rgba(0,0,0,0.22)', boxShadow: '0 1px 5px rgba(0,0,0,0.22)' }}>
                          {on && <Icon name="check" size={15} color="#fff" stroke={3} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 요리 기록 편집 모드 하단 바 */}
      {logEdit && view === 'log' && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--nav-h) + 14px + var(--safe-bottom))', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 12px 9px 18px', boxShadow: '0 8px 26px rgba(60,45,30,0.22)' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)' }}>
              {logSel.size > 0 ? `${logSel.size}개 선택` : '기록을 눌러 선택'}
            </span>
            <button className="press" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-sub)', padding: '6px 8px' }}
              onClick={() => setLogSel(logSel.size === shown.length ? new Set() : new Set(shown.map((e) => e.id)))}>
              {logSel.size === shown.length && shown.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            <button className="press" disabled={logSel.size === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 999, background: logSel.size ? 'var(--danger)' : 'var(--cream)', color: logSel.size ? '#fff' : 'var(--text-sub)', fontSize: 13.5, fontWeight: 800 }}
              onClick={() => logSel.size && setDelLogAsk(true)}>
              <Icon name="trash" size={15} color={logSel.size ? '#fff' : 'var(--text-sub)'} /> 삭제
            </button>
          </div>
        </div>
      )}

      {delLogAsk && (
        <ConfirmSheet
          title="선택한 요리 기록 삭제"
          message={`선택한 요리 기록 ${logSel.size}개를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel={`${logSel.size}개 삭제하기`}
          danger
          onConfirm={() => {
            const n = logSel.size
            logSel.forEach((id) => removeDiary(id))
            setLogSel(new Set())
            nav.showToast(`요리 기록 ${n}개를 삭제했어요`)
          }}
          onClose={() => setDelLogAsk(false)}
        />
      )}

      {/* 모아보기 편집 모드 하단 바 */}
      {edit && view === 'grid' && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--nav-h) + 14px + var(--safe-bottom))', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 12px 9px 18px', boxShadow: '0 8px 26px rgba(60,45,30,0.22)' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)' }}>
              {sel.size > 0 ? `${sel.size}개 선택` : '카드를 눌러 선택'}
            </span>
            <button className="press" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-sub)', padding: '6px 8px' }}
              onClick={() => setSel(sel.size === list.length ? new Set() : new Set(list.map((r) => r.id)))}>
              {sel.size === list.length && list.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            <button className="press" disabled={sel.size === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 999, background: sel.size ? 'var(--danger)' : 'var(--cream)', color: sel.size ? '#fff' : 'var(--text-sub)', fontSize: 13.5, fontWeight: 800 }}
              onClick={() => sel.size && setDelSelAsk(true)}>
              <Icon name="trash" size={15} color={sel.size ? '#fff' : 'var(--text-sub)'} /> 삭제
            </button>
          </div>
        </div>
      )}

      {delSelAsk && (
        <ConfirmSheet
          title="선택한 레시피 삭제"
          message={`선택한 레시피 ${sel.size}개를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel={`${sel.size}개 삭제하기`}
          danger
          onConfirm={() => {
            const n = sel.size
            sel.forEach((id) => removeRecipe(id))
            setSel(new Set())
            nav.showToast(`레시피 ${n}개를 삭제했어요`)
          }}
          onClose={() => setDelSelAsk(false)}
        />
      )}

      {newFolder && (
        <PromptSheet
          title="새 폴더"
          fields={[{ key: 'name', label: '폴더 이름', placeholder: '예) 자주 만드는' }]}
          onSubmit={({ name }) => { const nm = name.trim(); if (nm) addFolder(nm) }}
          onClose={() => setNewFolder(false)}
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
      {coach && <CoachMarks storageKey={MYRECIPES_COACH_KEY} steps={MYRECIPES_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}
