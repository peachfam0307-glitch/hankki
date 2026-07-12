import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
import { TAG_LIST } from '../data/seed'
import { dateLabel } from '../utils'

export default function MyRecipesScreen() {
  const { recipes, folders, addFolder, removeRecipe } = useStore()
  const nav = useNav()
  const [view, setView] = useState('grid') // grid | folders
  const [folder, setFolder] = useState('전체')
  const [edit, setEdit] = useState(false)

  const del = (r) => {
    if (window.confirm(`'${r.title}' 레시피를 삭제할까요?`)) {
      removeRecipe(r.id)
      nav.showToast('레시피를 삭제했어요')
    }
  }

  const sorted = useMemo(() => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt), [recipes])
  const list = folder === '전체' ? sorted : sorted.filter((r) => (r.folder || r.category) === folder)
  const countIn = (name) => sorted.filter((r) => (r.folder || r.category) === name).length

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">내 레시피</div>
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

      {/* 세그먼트 */}
      <div className="pad">
        <div className="segment">
          <button className={`seg ${view === 'grid' ? 'on' : ''}`} onClick={() => setView('grid')}>레시피</button>
          <button className={`seg ${view === 'folders' ? 'on' : ''}`} onClick={() => setView('folders')}>폴더 · 태그</button>
        </div>
      </div>

      {view === 'grid' ? (
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
      ) : (
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
              onClick={() => {
                const name = window.prompt('새 폴더 이름')
                if (name && name.trim()) addFolder(name.trim())
              }}
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
    </>
  )
}
