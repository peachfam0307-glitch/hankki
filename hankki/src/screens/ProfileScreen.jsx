import { useState, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TabTips from '../components/TabTips'
import { Avatar } from './HomeScreen'

export default function ProfileScreen() {
  const store = useStore()
  const { profile, setProfile, recipes, clearAll, reset, importAll } = store
  const nav = useNav()
  const [backup, setBackup] = useState(false)
  const fileRef = useRef(null)

  const editProfile = () => {
    const name = window.prompt('닉네임', profile.name)
    if (name === null) return
    const bio = window.prompt('한 줄 소개', profile.bio)
    setProfile({ name: name.trim() || profile.name, bio: bio === null ? profile.bio : bio })
  }

  const exportData = () => {
    const data = {
      _app: 'hankki', _v: 1, _at: new Date().toISOString(),
      recipes: store.recipes, folders: store.folders, profile: store.profile,
      shops: store.shops, wishlist: store.wishlist, shoppingList: store.shoppingList, pantry: store.pantry,
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hankki-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setBackup(false)
    nav.showToast('백업 파일을 내보냈어요 💾')
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.recipes)) throw new Error('형식 오류')
        if (window.confirm(`레시피 ${data.recipes.length}개가 담긴 백업이에요.\n불러오면 지금 데이터가 이 백업으로 바뀌어요. 계속할까요?`)) {
          importAll(data)
          setBackup(false)
          nav.showToast('백업을 불러왔어요 ✨')
        }
      } catch {
        nav.showToast('백업 파일을 읽을 수 없어요 😢')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const menu = [
    { icon: 'heart', label: '즐겨찾기', onClick: () => nav.push({ name: 'favorites' }) },
    { icon: 'user', label: '내가 만든 레시피', onClick: () => nav.go('myrecipes') },
    { icon: 'star', label: '만들었어요! 기록', onClick: () => nav.push({ name: 'cooked' }) },
    { icon: 'cart', label: '장보기 · 재료함', onClick: () => nav.go('shop') },
    { icon: 'cloud', label: '백업 · 내보내기', badge: 'NEW', onClick: () => setBackup(true) },
    { icon: 'settings', label: '설정', onClick: editProfile },
    { icon: 'help', label: '도움말 및 문의', onClick: () => nav.showToast('도움이 필요하면 언제든 문의해 주세요 🙂') },
  ]

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">설정</div>
          <TabTips tab="profile" />
        </div>
      </div>

      <div className="pad">
        {/* 프로필 */}
        <button className="press" onClick={editProfile} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0 20px', textAlign: 'left' }}>
          <Avatar name={profile.name} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{profile.name}</div>
            <div className="t-sub" style={{ marginTop: 3 }}>{profile.bio}</div>
          </div>
          <Icon name="edit" size={20} color="var(--sand)" />
        </button>

        {/* 통계 */}
        <div className="card" style={{ display: 'flex', padding: '16px 0', background: 'var(--cream)', border: 'none' }}>
          <Stat n={recipes.length} label="전체 레시피" />
          <div style={{ width: 1, background: 'var(--line)' }} />
          <Stat n={recipes.filter((r) => r.favorite).length} label="즐겨찾기" />
          <div style={{ width: 1, background: 'var(--line)' }} />
          <Stat n={recipes.filter((r) => r.status === 'unsorted').length} label="Inbox" />
        </div>

        {/* 메뉴 */}
        <div className="card" style={{ marginTop: 20, overflow: 'hidden' }}>
          {menu.map((m, i) => (
            <div key={m.label}>
              <button className="opt-row press" onClick={m.onClick} style={{ padding: '16px' }}>
                <Icon name={m.icon} size={22} color="var(--brown)" stroke={1.7} />
                <div className="t" style={{ fontSize: 15, fontWeight: 500 }}>{m.label}</div>
                {m.badge && <span className="badge badge-sorted" style={{ marginRight: 6 }}>{m.badge}</span>}
                <Icon name="chevron-right" size={18} color="var(--sand)" />
              </button>
              {i < menu.length - 1 && <hr className="divider" style={{ marginLeft: 52 }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            className="press"
            onClick={() => {
              if (window.confirm('예시 레시피를 포함해 모든 레시피를 비울까요?\n(내 폴더·태그는 유지돼요)')) {
                clearAll()
                nav.showToast('깨끗하게 비웠어요 · 이제 내 레시피만 담아요 ✨')
              }
            }}
            style={{ flex: 1, color: 'var(--brown)', fontSize: 13, fontWeight: 600, padding: 13, background: 'var(--cream)', borderRadius: 'var(--r-md)' }}
          >
            예시 데이터 비우기
          </button>
          <button
            className="press"
            onClick={() => {
              if (window.confirm('예시 레시피를 다시 불러올까요?\n(현재 내용이 초기 예시로 바뀌어요)')) {
                reset()
                nav.showToast('초기 예시로 되돌렸어요')
              }
            }}
            style={{ flex: 1, color: 'var(--text-sub)', fontSize: 13, fontWeight: 500, padding: 13, background: 'var(--cream)', borderRadius: 'var(--r-md)' }}
          >
            예시 되돌리기
          </button>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--sand)', fontSize: 12, marginTop: 14 }}>
          한끼 · v1.0 — 흩어진 레시피를, 한곳에.
        </div>
      </div>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importData} style={{ display: 'none' }} />

      {backup && (
        <div className="sheet-mask" onClick={() => setBackup(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>백업 · 내보내기</span>
              <button className="press" onClick={() => setBackup(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="t-sub" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
                레시피 · 냉장고 · 장보기 등 모든 데이터를 파일 하나로 저장해요.{'\n'}폰을 바꾸거나 브라우저를 지우기 전에 내보내두면 안전해요.
              </div>
              <button className="btn-primary press" onClick={exportData}>💾 백업 파일 내보내기</button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={() => fileRef.current?.click()}>📂 백업 파일 불러오기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Stat({ n, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{n}</div>
      <div className="t-sub" style={{ marginTop: 2 }}>{label}</div>
    </div>
  )
}
