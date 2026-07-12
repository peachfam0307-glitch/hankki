import { useState, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TabTips from '../components/TabTips'
import EmojiPicker from '../components/EmojiPicker'
import FoodIconPicker from '../components/FoodIconPicker'
import Buddy, { BUDDY_LIST } from '../components/Buddies'
import Portal from '../components/Portal'
import { cropSquare } from '../utils'
import { Avatar } from './HomeScreen'

export default function ProfileScreen() {
  const store = useStore()
  const { profile, setProfile, recipes, clearAll, reset, importAll } = store
  const nav = useNav()
  const [backup, setBackup] = useState(false)
  const [avatarSheet, setAvatarSheet] = useState(false)
  const fileRef = useRef(null)
  const avatarFileRef = useRef(null)

  // 아바타 사진 — 정사각으로 잘라 작게 저장
  const onAvatarPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const img = await cropSquare(reader.result, 256, 0.85)
      setProfile({ avatar: { type: 'photo', value: img } })
      setAvatarSheet(false)
      nav.showToast('프로필 사진을 바꿨어요 ✨')
    }
    reader.readAsDataURL(file)
  }

  const editProfile = () => {
    const name = window.prompt('닉네임', profile.name)
    if (name === null) return
    const bio = window.prompt('한 줄 소개', profile.bio)
    setProfile({ name: name.trim() || profile.name, bio: bio === null ? profile.bio : bio })
  }

  const buildBackup = () => ({
    _app: 'hankki', _v: 2, _at: new Date().toISOString(),
    recipes: store.recipes, folders: store.folders, profile: store.profile,
    shops: store.shops, wishlist: store.wishlist, shoppingList: store.shoppingList, pantry: store.pantry,
    diary: store.diary, seedV: store.seedV, memoCleanV: store.memoCleanV, removedSeedIds: store.removedSeedIds,
  })

  const backupFilename = () => `한끼백업-${new Date().toISOString().slice(0, 10)}.json`

  // 다운로드 폴더로 저장 (데스크톱·폴백)
  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(buildBackup())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setBackup(false)
    nav.showToast('백업 파일을 저장했어요 💾 (폰 다운로드 폴더)')
  }

  // 공유로 보내기 — 카톡 나에게·드라이브·파일 앱 등 안전한 곳에 바로 저장 (모바일)
  const shareBackup = async () => {
    const file = new File([JSON.stringify(buildBackup())], backupFilename(), { type: 'application/json' })
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '한끼 백업',
          text: '한끼 레시피 백업 파일이에요. 안전한 곳에 보관해 주세요 🍳',
        })
        setBackup(false)
        nav.showToast('백업을 공유했어요 · 카톡 나에게·드라이브에 저장해두세요 ✨')
        return
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return // 사용자가 공유 취소
    }
    // 공유를 지원하지 않으면 다운로드로
    downloadBackup()
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

  // 하단 탭과 겹치는 항목(내 레시피·장보기)은 뺐다 — 같은 곳으로 가는 문이 두 개면 헷갈린다.
  const menu = [
    { icon: 'heart', label: '즐겨찾기', onClick: () => nav.push({ name: 'favorites' }) },
    { icon: 'star', label: '만들었어요! 기록', onClick: () => nav.push({ name: 'cooked' }) },
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
        {/* 프로필 — 아바타는 눌러서 이모지·사진으로 바꿀 수 있다 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0 20px' }}>
          <button className="press" onClick={() => setAvatarSheet(true)} aria-label="프로필 아이콘 바꾸기" style={{ position: 'relative', flex: '0 0 auto' }}>
            <Avatar name={profile.name} avatar={profile.avatar} size={56} />
            <span style={{ position: 'absolute', right: -3, bottom: -3, width: 21, height: 21, borderRadius: '50%', background: 'var(--brown)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={12} color="#fff" />
            </span>
          </button>
          <button className="press" onClick={editProfile} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{profile.name}</div>
              <div className="t-sub" style={{ marginTop: 3 }}>{profile.bio}</div>
            </div>
            <Icon name="edit" size={20} color="var(--sand)" />
          </button>
        </div>

        <input ref={avatarFileRef} type="file" accept="image/*" onChange={onAvatarPhoto} style={{ display: 'none' }} />

        {avatarSheet && (
          <div className="card fade" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>프로필 아이콘</div>
              <button className="press" onClick={() => setAvatarSheet(false)} style={{ color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 요리사 친구들 — 모자 쓴 동물 캐릭터 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8 }}>요리사 친구들 🧑‍🍳</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {BUDDY_LIST.map((bd) => (
                    <button
                      key={bd.id}
                      className="press"
                      onClick={() => { setProfile({ avatar: { type: 'buddy', value: bd.id } }); setAvatarSheet(false); nav.showToast(`${bd.name}로 바꿨어요 ✨`) }}
                      aria-label={bd.name}
                      style={{
                        flex: '0 0 auto',
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#eef0ec,#dfe2da)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: profile.avatar?.type === 'buddy' && profile.avatar.value === bd.id ? '2px solid var(--brown)' : '2px solid transparent',
                      }}
                    >
                      <Buddy id={bd.id} size={46} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <EmojiPicker
                  value={profile.avatar?.type === 'emoji' ? profile.avatar.value : '😊'}
                  size={56}
                  onChange={(e) => { setProfile({ avatar: { type: 'emoji', value: e } }); setAvatarSheet(false); nav.showToast('프로필 이모지를 바꿨어요 ✨') }}
                />
                <div style={{ fontSize: 14, fontWeight: 600 }}>이모지로 하기 <span className="t-sub" style={{ fontWeight: 400 }}>· 눌러서 고르기</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <FoodIconPicker
                  value={profile.avatar?.type === 'icon' ? profile.avatar.value : 'rice'}
                  size={56}
                  onChange={(k) => { setProfile({ avatar: { type: 'icon', value: k } }); setAvatarSheet(false); nav.showToast('프로필 아이콘을 바꿨어요 ✨') }}
                />
                <div style={{ fontSize: 14, fontWeight: 600 }}>한끼 아이콘으로 하기 <span className="t-sub" style={{ fontWeight: 400 }}>· 눌러서 고르기</span></div>
              </div>
              <button className="press" onClick={() => avatarFileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0', textAlign: 'left' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  <Icon name="camera" size={22} color="var(--brown)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>사진으로 하기 <span className="t-sub" style={{ fontWeight: 400 }}>· 동그랗게 잘라드려요</span></div>
              </button>
              {profile.avatar && (
                <button className="press" onClick={() => { setProfile({ avatar: null }); setAvatarSheet(false) }} style={{ padding: 10, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600 }}>
                  기본(이름 첫 글자)으로 돌리기
                </button>
              )}
            </div>
          </div>
        )}

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
       <Portal>
        <div className="sheet-mask" onClick={() => setBackup(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>백업 · 내보내기</span>
              <button className="press" onClick={() => setBackup(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="t-sub" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
                레시피 · 일지 · 냉장고 · 장보기 · 프로필까지 <b>모든 데이터를 파일 하나</b>로 담아요.{'\n'}폰을 바꾸거나 앱을 지워도 이 파일만 있으면 그대로 되살아나요.
              </div>
              <button className="btn-primary press" onClick={shareBackup}>💌 백업 보내서 저장하기 (추천)</button>
              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 2px 14px' }}>
                누르면 공유 창이 떠요 → <b>카톡 나에게 보내기</b>나 <b>드라이브·파일</b>에 저장하면 제일 안전해요. (폰이 고장나도 클라우드에 남아요)
              </div>
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={downloadBackup}>💾 폰에 파일로 저장 (다운로드 폴더)</button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={() => fileRef.current?.click()}>📂 백업 파일 불러오기</button>
            </div>
          </div>
        </div>
       </Portal>
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
