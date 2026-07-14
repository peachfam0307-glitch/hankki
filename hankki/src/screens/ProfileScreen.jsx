import { useState, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import { APP_VERSION, APP_TAGLINE } from '../version'
import Icon from '../components/Icon'
import TabTips from '../components/TabTips'
import EmojiPicker from '../components/EmojiPicker'
import FoodIconPicker from '../components/FoodIconPicker'
import Buddy, { BUDDY_GROUPS } from '../components/Buddies'
import Portal from '../components/Portal'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import { cropSquare } from '../utils'
import { THEMES, getTheme, setTheme } from '../theme'
import { Avatar } from './HomeScreen'

export default function ProfileScreen() {
  const store = useStore()
  const { profile, setProfile, recipes, clearAll, reset, importAll } = store
  const nav = useNav()
  const [backup, setBackup] = useState(false)
  const [avatarSheet, setAvatarSheet] = useState(false)
  const [editSheet, setEditSheet] = useState(false)
  const [confirmAsk, setConfirmAsk] = useState(null) // { title, message, confirmLabel, danger, onConfirm }
  const [theme, setThemeState] = useState(getTheme())
  const [pasteOpen, setPasteOpen] = useState(false)
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

  const editProfile = () => setEditSheet(true)

  const saveProfile = ({ name, bio }) => {
    setProfile({ name: name.trim() || profile.name, bio: bio.trim() })
    nav.showToast('프로필을 바꿨어요 ✨')
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
      // 그 외 오류(파일 공유 거부 등)는 아래 복사 폴백으로 넘어간다
    }
    // 설치형(홈 화면) 앱에선 공유가 막히거나 파일 다운로드가 조용히 실패할 수 있어,
    // 어디서나 되는 '복사'로 대체한다. (카톡 「나에게」에 붙여넣어 보관)
    copyBackup()
  }

  // 백업 코드를 클립보드로 복사 — 공유가 안 되는 기기에서도 100% 되는 방법
  const copyBackup = async () => {
    const json = JSON.stringify(buildBackup())
    try {
      await navigator.clipboard.writeText(json)
      setBackup(false)
      nav.showToast('백업 코드를 복사했어요 📋 카톡 「나에게」나 메모에 붙여넣어 보관하세요')
    } catch {
      // 클립보드까지 막히면 최후로 파일 저장 시도
      downloadBackup()
    }
  }

  // 붙여넣은 백업 코드로 복원
  const importFromText = ({ code }) => {
    try {
      const data = JSON.parse((code || '').trim())
      if (!Array.isArray(data.recipes)) throw new Error('형식 오류')
      setConfirmAsk({
        title: '백업 불러오기',
        message: `레시피 ${data.recipes.length}개가 담긴 백업이에요.\n불러오면 지금 데이터가 이 백업으로 바뀌어요. 계속할까요?`,
        confirmLabel: '불러오기',
        onConfirm: () => { importAll(data); setBackup(false); nav.showToast('백업을 불러왔어요 ✨') },
      })
    } catch {
      nav.showToast('백업 코드를 읽을 수 없어요 😢 처음부터 끝까지 전체를 붙여넣었는지 확인해 주세요')
    }
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.recipes)) throw new Error('형식 오류')
        setConfirmAsk({
          title: '백업 불러오기',
          message: `레시피 ${data.recipes.length}개가 담긴 백업이에요.\n불러오면 지금 데이터가 이 백업으로 바뀌어요. 계속할까요?`,
          confirmLabel: '불러오기',
          onConfirm: () => { importAll(data); setBackup(false); nav.showToast('백업을 불러왔어요 ✨') },
        })
      } catch {
        nav.showToast('백업 파일을 읽을 수 없어요 😢')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  // 하단 탭과 겹치는 항목(내 레시피·장보기)은 뺐다 — 같은 곳으로 가는 문이 두 개면 헷갈린다.
  // '만들었어요! 기록'은 하단 '일지' 탭과 겹쳐서 뺐고, '설정' 행은 프로필 편집을 여는 잘못된 항목이라 뺐다.
  // (프로필 편집은 맨 위 프로필 카드를 누르면 열린다)
  const menu = [
    { icon: 'heart', label: '즐겨찾기', onClick: () => nav.push({ name: 'favorites' }) },
    { icon: 'cloud', label: '백업 · 내보내기', badge: 'NEW', onClick: () => setBackup(true) },
    { icon: 'help', label: '앱 소개 다시 보기', onClick: () => nav.showOnboarding && nav.showOnboarding() },
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
              {/* 요리사 친구들 — 모자 쓴 동물 캐릭터. 세 가지 그림체를 섹션으로 나눠 보여준다. */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 10 }}>요리사 친구들 🧑‍🍳</div>
                {BUDDY_GROUPS.map((g) => (
                  <div key={g.key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--sand)', margin: '0 2px 8px', letterSpacing: '0.02em' }}>{g.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {g.items.map((bd) => {
                        const on = profile.avatar?.type === 'buddy' && profile.avatar.value === bd.id
                        return (
                          <button
                            key={bd.id}
                            className="press"
                            onClick={() => { setProfile({ avatar: { type: 'buddy', value: bd.id } }); setAvatarSheet(false); nav.showToast(`${bd.name}로 바꿨어요 ✨`) }}
                            aria-label={bd.name}
                            style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 60 }}
                          >
                            <div
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'linear-gradient(160deg,#f8f6f1,#f1eee7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: on ? '2.5px solid var(--brown)' : '2.5px solid transparent',
                                boxSizing: 'border-box',
                              }}
                            >
                              <Buddy id={bd.id} size={56} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, color: on ? 'var(--brown)' : 'var(--text-sub)', whiteSpace: 'nowrap' }}>{bd.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
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

        {/* 테마 — 화면 색(크림·세이지·다크). 다크모드도 여기서 고른다. */}
        <div className="card" style={{ marginTop: 20, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>테마</div>
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, marginBottom: 14 }}>앱 화면 색을 골라요 · 다크모드도 여기서 🌙</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map((t) => {
              const on = theme === t.key
              return (
                <button
                  key={t.key}
                  className="press"
                  onClick={() => { setTheme(t.key); setThemeState(t.key); nav.showToast(`${t.label} 테마로 바꿨어요 ✨`) }}
                  aria-label={`${t.label} 테마`}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    padding: '13px 6px', borderRadius: 14, background: 'var(--cream)',
                    border: on ? '2px solid var(--brown)' : '2px solid transparent', boxSizing: 'border-box',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, position: 'relative', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.09)' }}>
                    <span style={{ position: 'absolute', right: 7, bottom: 7, width: 14, height: 14, borderRadius: '50%', background: t.point, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: on ? 800 : 600, color: on ? 'var(--brown)' : 'var(--text)' }}>{t.label}</span>
                  <span className="t-sub" style={{ fontSize: 10.5 }}>{t.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            className="press"
            onClick={() => setConfirmAsk({
              title: '예시 데이터 비우기',
              message: '예시 레시피를 포함해 모든 레시피를 비울까요?\n(내 폴더·태그는 유지돼요)',
              confirmLabel: '비우기',
              danger: true,
              onConfirm: () => { clearAll(); nav.showToast('깨끗하게 비웠어요 · 이제 내 레시피만 담아요 ✨') },
            })}
            style={{ flex: 1, color: 'var(--brown)', fontSize: 13, fontWeight: 600, padding: 13, background: 'var(--cream)', borderRadius: 'var(--r-md)' }}
          >
            예시 데이터 비우기
          </button>
          <button
            className="press"
            onClick={() => setConfirmAsk({
              title: '예시 되돌리기',
              message: '예시 레시피를 다시 불러올까요?\n(현재 내용이 초기 예시로 바뀌어요)',
              confirmLabel: '되돌리기',
              onConfirm: () => { reset(); nav.showToast('초기 예시로 되돌렸어요') },
            })}
            style={{ flex: 1, color: 'var(--text-sub)', fontSize: 13, fontWeight: 500, padding: 13, background: 'var(--cream)', borderRadius: 'var(--r-md)' }}
          >
            예시 되돌리기
          </button>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--sand)', fontSize: 12, marginTop: 14 }}>
          한끼 · {APP_VERSION} — {APP_TAGLINE}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importData} style={{ display: 'none' }} />

      {editSheet && (
        <PromptSheet
          title="프로필 수정"
          fields={[
            { key: 'name', label: '닉네임', value: profile.name, placeholder: '닉네임' },
            { key: 'bio', label: '한 줄 소개', value: profile.bio, placeholder: '나를 한 줄로 소개해요', multiline: true },
          ]}
          onSubmit={saveProfile}
          onClose={() => setEditSheet(false)}
        />
      )}

      {confirmAsk && (
        <ConfirmSheet
          title={confirmAsk.title}
          message={confirmAsk.message}
          confirmLabel={confirmAsk.confirmLabel}
          danger={confirmAsk.danger}
          onConfirm={confirmAsk.onConfirm}
          onClose={() => setConfirmAsk(null)}
        />
      )}

      {backup && (
       <Portal>
        <div className="sheet-mask" onClick={() => setBackup(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>백업 · 내보내기</span>
              <button className="press" onClick={() => setBackup(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="t-sub" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>
                레시피 · 일지 · 냉장고 · 장보기 · 프로필까지 <b>모든 데이터를 파일 하나</b>로 담아요.{'\n'}폰을 바꾸거나 앱을 지워도 이 파일만 있으면 그대로 되살아나요.
              </div>
              <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '12px 13px', marginBottom: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-line' }}>
                <b style={{ color: 'var(--brown)' }}>제일 쉬운 방법 (3단계) 👇</b>{'\n'}
                <b>1.</b> 아래 <b>💌 백업 보내서 저장하기</b> 누르기{'\n'}
                <b>2.</b> 공유 창이 뜨면 <b>「카톡 나에게 보내기」</b> 선택{'\n'}
                <b>3.</b> 끝! 나중에 폰을 바꾸면 그 파일을 열어 아래 <b>「불러오기」</b>만 하면 그대로 복원돼요 ✨
              </div>
              <button className="btn-primary press" onClick={shareBackup}>💌 백업 보내서 저장하기 (추천)</button>
              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 2px 12px' }}>
                누르면 공유 창이 떠요 → <b>카톡 나에게 보내기</b>나 <b>드라이브·파일</b>에 저장하면 제일 안전해요. (폰이 고장나도 클라우드에 남아요){'\n'}공유 창이 안 뜨는 폰이면 자동으로 <b>백업 코드가 복사</b>돼요.
              </div>
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={copyBackup}>📋 백업 코드 복사 <span style={{ fontWeight: 500, opacity: 0.8 }}>· 카톡·메모에 붙여넣기</span></button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={downloadBackup}>💾 폰에 파일로 저장 (다운로드 폴더)</button>

              <hr className="divider" style={{ margin: '16px 0' }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>백업에서 되살리기</div>
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>📂 백업 파일 불러오기</button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={() => setPasteOpen(true)}>📋 코드 붙여넣기로 불러오기</button>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {pasteOpen && (
        <PromptSheet
          title="코드로 불러오기"
          fields={[
            { key: 'code', label: '백업 코드 붙여넣기', value: '', placeholder: '복사해 둔 백업 코드를 여기에 붙여넣어 주세요', multiline: true },
          ]}
          submitLabel="불러오기"
          onSubmit={(v) => { setPasteOpen(false); importFromText(v) }}
          onClose={() => setPasteOpen(false)}
        />
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
