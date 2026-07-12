import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import { Avatar } from './HomeScreen'

export default function ProfileScreen() {
  const { profile, setProfile, recipes, clearAll, reset } = useStore()
  const nav = useNav()

  const editProfile = () => {
    const name = window.prompt('닉네임', profile.name)
    if (name === null) return
    const bio = window.prompt('한 줄 소개', profile.bio)
    setProfile({ name: name.trim() || profile.name, bio: bio === null ? profile.bio : bio })
  }

  const menu = [
    { icon: 'heart', label: '즐겨찾기', onClick: () => nav.push({ name: 'favorites' }) },
    { icon: 'user', label: '내가 만든 레시피', onClick: () => nav.go('myrecipes') },
    { icon: 'star', label: '만들었어요! 기록', onClick: () => nav.go('diary') },
    { icon: 'cart', label: '장보기 리스트', onClick: () => nav.push({ name: 'shopping' }) },
    { icon: 'cloud', label: '백업 및 동기화', badge: 'NEW', onClick: () => nav.showToast('클라우드 백업은 V2에서 제공될 예정이에요 ☁️') },
    { icon: 'settings', label: '설정', onClick: editProfile },
    { icon: 'help', label: '도움말 및 문의', onClick: () => nav.showToast('도움이 필요하면 언제든 문의해 주세요 🙂') },
  ]

  return (
    <>
      <div className="topbar">
        <div className="h-title">설정</div>
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
