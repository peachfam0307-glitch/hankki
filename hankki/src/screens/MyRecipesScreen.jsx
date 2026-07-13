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

function fmtLogDate(ts) {
  const d = new Date(ts)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export default function MyRecipesScreen() {
  const { recipes, folders, addFolder, removeRecipe, diary, removeDiary } = useStore()
  const nav = useNav()
  const [view, setView] = useState('grid') // grid | log | folders
  const [folder, setFolder] = useState('전체')
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

  // 요리 기록(옛 '일지') — 만든 날짜순 타임라인
  const entries = useMemo(() => [...diary].sort((a, b) => b.at - a.at), [diary])
  const now = new Date()
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
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
            <button className="t-more press" style={{ marginRight: 4, fontSize: 14 }} onClick={() => setEdit((v) => !v)}>
              {edit ? '완료' : '편집'}
            </button>
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
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px 0', background: 'var(--cream)', border: 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brown)' }}>{thisMonth}</div>
              <div className="t-sub" style={{ marginTop: 2 }}>이번 달 요리</div>
            </div>
            <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px 0', background: 'var(--cream)', border: 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brown)' }}>{entries.length}</div>
              <div className="t-sub" style={{ marginTop: 2 }}>총 기록</div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="empty" style={{ marginTop: 10 }}>{'아직 기록이 없어요.\n레시피에서 "만들었어요"를 누르면 여기에 쌓여요.'}</div>
          ) : (
            <div style={{ marginTop: 18 }}>
              {entries.map((e) => (
                <div key={e.id} className="diary-row">
                  <button className="press" onClick={() => openRecipe(e)} style={{ flex: '0 0 auto' }}>
                    {e.photo ? (
                      <img src={e.photo} alt="" style={{ width: 58, height: 58, borderRadius: 14, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div className="emoji-tile" style={{ width: 58, height: 58 }}><FoodIcon name={guessFoodIcon(e.title)} size={36} /></div>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    <div className="t-sub" style={{ fontSize: 12, marginTop: 2 }}>{fmtLogDate(e.at)}</div>
                    {e.rating > 0 && <div style={{ marginTop: 4 }}><Stars value={e.rating} onChange={() => {}} size={14} /></div>}
                    {e.note && <div className="diary-note-preview">{e.note}</div>}
                  </div>
                  <button className="icon-btn press" onClick={() => setLogEditing(e)} aria-label="기록 편집">
                    <Icon name="pen" size={17} color="var(--sand)" />
                  </button>
                </div>
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
              <div className="grid2">
                {list.map((r) => (
                  <div key={r.id} className="grid-card" style={{ position: 'relative' }}>
                    <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => (edit ? del(r) : nav.push({ name: 'detail', id: r.id }))}>
                      <Thumb recipe={r} ratio="1/1" radius={16} />
                      {r.favorite && !edit && (
                        <div className="fav-dot"><Icon name="bookmark" size={16} color="var(--brown)" style={{ fill: 'var(--brown)' }} /></div>
                      )}
                      <div className="name">{r.title}</div>
                      <div className="date">{dateLabel(r.savedAt)}</div>
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
        />
      )}
    </>
  )
}
