import { useState, useRef } from 'react'
import { COACH, COACH_KEYS } from '../coach'
import { useStore } from '../store'
import { useNav } from '../App'
import { useLayerBack } from '../useBackHandler'
import { APP_VERSION, APP_TAGLINE, FEEDBACK_URL, LAB_SURVEY_URL, LAB_BUG_URL } from '../version'
import Icon from '../components/Icon'
import TabTips from '../components/TabTips'
import EmojiPicker from '../components/EmojiPicker'
import FoodIconPicker from '../components/FoodIconPicker'
import Buddy, { BUDDY_GROUPS } from '../components/Buddies'
import Portal from '../components/Portal'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import KitchenGuideSheet from '../components/KitchenGuideSheet'
import LabSheet from '../components/LabSheet'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import { cropSquare } from '../utils'
import { takeOpenBackup, backupDone } from '../nudges'

// 설정 첫 방문 코치마크 — 백업(제일 중요)과 의견 보내기 안내(창업자 딸 아이디어 ⭐)
const PROFILE_COACH_KEY = COACH.profile
const PROFILE_COACH_STEPS = [
  { sel: '[data-coach="backup"]', label: '백업 · 내보내기', desc: '폰을 바꾸거나 지워도 레시피를 지키는 제일 중요한 버튼!' },
  { sel: '[data-coach="update"]', label: '최신 버전 확인', desc: '앱이 옛 버전에서 멈췄을 때 눌러요 · 새 기능·수정이 바로 반영돼요' },
  { sel: '[data-coach="lab"]', label: '한끼연구소', desc: '의견·설문·안 되는 것을 받는 방이에요 여러분 한 줄이 저에겐 진짜 큰 힘이 돼요. 익명이니까 편하게 남겨 주세요!' },
]
import { THEMES, getTheme, setTheme } from '../theme'
import { Avatar } from './HomeScreen'

export default function ProfileScreen() {
  const store = useStore()
  const { profile, setProfile, recipes, clearAll, reset, importAll } = store
  const nav = useNav()
  // 홈의 백업 안내로 들어왔으면 도착하자마자 백업 시트를 연다
  // (탭 이동은 인자를 못 넘겨서 nudges.js 쪽지로 받는다. 읽는 순간 지워져 한 번만 열린다.)
  const [backup, setBackup] = useState(() => takeOpenBackup())
  const [avatarSheet, setAvatarSheet] = useState(false)
  const [editSheet, setEditSheet] = useState(false)
  const [confirmAsk, setConfirmAsk] = useState(null) // { title, message, confirmLabel, danger, onConfirm }
  // 인라인 시트(백업·아바타) — 뒤로가기로 닫기(편집·붙여넣기·확인 시트는 자체 처리)
  useLayerBack(backup, () => setBackup(false))
  useLayerBack(avatarSheet, () => setAvatarSheet(false))
  const [coach, setCoach] = useState(() => needsCoach(PROFILE_COACH_KEY))
  const [theme, setThemeState] = useState(getTheme())
  const [pasteOpen, setPasteOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [guide, setGuide] = useState(false) // 요리 가이드(계량·손질) 시트
  const [lab, setLab] = useState(false) // 한끼연구소(의견·설문·오류) 시트
  const fileRef = useRef(null)
  const avatarFileRef = useRef(null)

  // 최신 버전 확인 — 설치한 앱(standalone)은 '당겨서 새로고침'이 안 돼서 최신 버전을 못 받는 일이 있다.
  // 이 버튼이 서비스워커 업데이트를 강제로 확인한다. 새 버전이 있으면 SW가 skipWaiting 으로
  // 바로 활성화 → controllerchange 로 앱이 자동 새로고침(main.jsx). 없으면 '최신' 안내만.
  const checkUpdate = async () => {
    if (checking) return
    if (!('serviceWorker' in navigator)) {
      nav.showToast('이 환경에선 업데이트 확인이 안 돼요 · 브라우저를 새로고침해 주세요')
      return
    }
    setChecking(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        setChecking(false)
        nav.showToast('설치 상태를 확인할 수 없어요 · 브라우저를 새로고침해 주세요')
        return
      }
      let found = false
      const onFound = () => { found = true }
      reg.addEventListener('updatefound', onFound)
      await reg.update()
      if (reg.installing || reg.waiting) found = true
      reg.removeEventListener('updatefound', onFound)
      if (found) {
        nav.showToast('새 버전을 받았어요 · 곧 새로고침돼요')
        if (reg.waiting) { try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }) } catch { /* noop */ } }
        // 안전망: controllerchange 자동 새로고침이 안 오면 직접 새로고침
        setTimeout(() => window.location.reload(), 2200)
      } else {
        setChecking(false)
        nav.showToast(`이미 최신 버전이에요 · ${APP_VERSION}`)
      }
    } catch {
      setChecking(false)
      nav.showToast('업데이트 확인 중 문제가 생겼어요 · 잠시 후 다시 시도해 주세요')
    }
  }

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
      nav.showToast('프로필 사진을 바꿨어요')
    }
    reader.readAsDataURL(file)
  }

  const editProfile = () => setEditSheet(true)

  const saveProfile = ({ name, bio }) => {
    setProfile({ name: name.trim() || profile.name, bio: bio.trim() })
    nav.showToast('프로필을 바꿨어요')
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
    backupDone() // 이미 백업한 사람에게 홈에서 또 권하지 않는다
    nav.showToast('백업 파일을 저장했어요 (폰 다운로드 폴더)')
  }

  // 공유로 보내기 — 카톡 나에게·드라이브·파일 앱 등 안전한 곳에 바로 저장 (모바일)
  const shareBackup = async () => {
    const file = new File([JSON.stringify(buildBackup())], backupFilename(), { type: 'application/json' })
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '한끼 백업',
          text: '한끼 레시피 백업 파일이에요. 안전한 곳에 보관해 주세요',
        })
        setBackup(false)
        backupDone()
        nav.showToast('백업을 공유했어요 · 카톡 나에게·드라이브에 저장해두세요')
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
      backupDone()
      nav.showToast('백업 코드를 복사했어요 카톡 「나에게」나 메모에 붙여넣어 보관하세요')
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
        onConfirm: () => { importAll(data); setBackup(false); nav.showToast('백업을 불러왔어요') },
      })
    } catch {
      nav.showToast('백업 코드를 읽을 수 없어요 처음부터 끝까지 전체를 붙여넣었는지 확인해 주세요')
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
          onConfirm: () => { importAll(data); setBackup(false); nav.showToast('백업을 불러왔어요') },
        })
      } catch {
        nav.showToast('백업 파일을 읽을 수 없어요')
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
    { icon: 'cloud', label: '백업 · 내보내기', badge: 'NEW', coach: 'backup', onClick: () => setBackup(true) },
    { icon: 'help', label: '요리 가이드', badge: '계량·손질', onClick: () => setGuide(true) },
    { icon: 'help', label: '앱 소개 다시 보기', onClick: () => nav.showOnboarding && nav.showOnboarding() },
    {
      icon: 'sparkle', label: '기능 안내 다시 보기', badge: '반짝 안내',
      onClick: () => {
        // 코치마크 본 기록을 지워 각 화면 첫 방문 안내가 다시 나오게 한다(딸 아이디어 ⭐ 후속)
        // ⛔⛔ 🐛 여기 이름을 «손으로» 적어 뒀다가 두 칸이 죽어 있었다 (2026-08-08 발견) —
        //    `home` 을 지웠는데 실제 키는 v8.60 부터 `home2`(지금은 `home3`) 였고, `brag` 는 목록에 아예 없었다.
        //    → **눌러도 홈·레꾸자랑 안내는 안 돌아왔다.** 이제 `src/coach.js` 가 가진 목록을 통째로 지운다.
        try { COACH_KEYS.forEach((k) => localStorage.removeItem(k)) } catch { /* noop */ }
        nav.showToast('각 화면에 들어가면 반짝 안내가 다시 나와요')
      },
    },
    { icon: 'help', label: '도움말 및 문의', onClick: () => { try { const a = document.createElement('a'); a.href = 'mailto:annyeong.hankki@gmail.com'; a.click() } catch { /* noop */ } nav.showToast('문의: annyeong.hankki@gmail.com') } },
    // 🔬 한끼연구소 — 옛 '의견 보내기' 자리를 승격시켰다(창업자 아이디어 2026-07-30).
    // "의견 보내기"는 민원 창구처럼 읽히는데, 연구소는 유저를 연구원으로 만든다 → 참여 동기가 다르다.
    // 창구 셋(의견·설문·오류) 중 주소가 하나라도 있을 때만 노출(전부 비면 빈 방이 된다).
    ...(FEEDBACK_URL || LAB_SURVEY_URL || LAB_BUG_URL
      ? [{ icon: 'bulb', label: '한끼연구소', badge: '의견·설문', coach: 'lab', onClick: () => setLab(true) }]
      : []),
    { icon: 'settings', label: '개인정보처리방침', onClick: () => { const a = document.createElement('a'); a.href = (import.meta.env.BASE_URL || './') + 'privacy.html'; a.target = '_blank'; a.rel = 'noopener'; a.click() } },
    { icon: 'book', label: '오픈소스 라이선스', onClick: () => { const a = document.createElement('a'); a.href = (import.meta.env.BASE_URL || './') + 'licenses.html'; a.target = '_blank'; a.rel = 'noopener'; a.click() } },
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
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 10 }}>요리사 친구들</div>
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
                            onClick={() => { setProfile({ avatar: { type: 'buddy', value: bd.id } }); setAvatarSheet(false); nav.showToast(`${bd.name}로 바꿨어요`) }}
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
                  onChange={(e) => { setProfile({ avatar: { type: 'emoji', value: e } }); nav.showToast('프로필 이모지를 바꿨어요') }}
                />
                <div style={{ fontSize: 14, fontWeight: 600 }}>이모지로 하기 <span className="t-sub" style={{ fontWeight: 400 }}>· 눌러서 고르기</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <FoodIconPicker
                  value={profile.avatar?.type === 'icon' ? profile.avatar.value : 'fe_04'}
                  size={56}
                  onChange={(k) => { setProfile({ avatar: { type: 'icon', value: k } }); nav.showToast('프로필 아이콘을 바꿨어요') }}
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
          {/* 예전 'Inbox' — 홈에서 뺀 대신 여기 통계에서 연다. 아직 편집 안 끝난(미정리) 레시피 개수, 탭하면 목록 */}
          <Stat n={recipes.filter((r) => r.status === 'unsorted').length} label="미정리" onClick={() => nav.push({ name: 'inbox' })} />
        </div>

        {/* 메뉴 */}
        <div className="card" style={{ marginTop: 20, overflow: 'hidden' }}>
          {menu.map((m, i) => (
            <div key={m.label}>
              <button className="opt-row press" onClick={m.onClick} data-coach={m.coach} style={{ padding: '16px' }}>
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
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, marginBottom: 14 }}>앱 화면 색을 골라요 · 다크모드도 여기서</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map((t) => {
              const on = theme === t.key
              return (
                <button
                  key={t.key}
                  className="press"
                  onClick={() => { setTheme(t.key); setThemeState(t.key); nav.showToast(`${t.label} 테마로 바꿨어요`) }}
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
              onConfirm: () => { clearAll(); nav.showToast('깨끗하게 비웠어요 · 이제 내 레시피만 담아요') },
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
        <button
          className="press"
          data-coach="update"
          onClick={checkUpdate}
          disabled={checking}
          style={{
            width: '100%', marginTop: 22, padding: 13, borderRadius: 'var(--r-md)',
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 13.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            opacity: checking ? 0.6 : 1,
          }}
        >
          <Icon name="refresh" size={16} color="var(--brown)" stroke={2} />
          {checking ? '확인 중…' : '최신 버전 확인'}
        </button>
        <div style={{ textAlign: 'center', color: 'var(--sand)', fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
          설치한 앱이 옛 버전에서 멈췄을 때 눌러요
        </div>
        <div style={{ textAlign: 'center', color: 'var(--sand)', fontSize: 12, marginTop: 12 }}>
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
                <b style={{ color: 'var(--brown)' }}>제일 쉬운 방법 (3단계)</b>{'\n'}
                <b>1.</b> 아래 <b>백업 보내서 저장하기</b> 누르기{'\n'}
                <b>2.</b> 공유 창이 뜨면 <b>「카톡 나에게 보내기」</b> 선택{'\n'}
                <b>3.</b> 끝! 나중에 폰을 바꾸면 그 파일을 열어 아래 <b>「불러오기」</b>만 하면 그대로 복원돼요
              </div>
              <button className="btn-primary press" onClick={shareBackup}>백업 보내서 저장하기 (추천)</button>
              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.55, margin: '8px 2px 12px' }}>
                누르면 공유 창이 떠요 → <b>카톡 나에게 보내기</b>나 <b>드라이브·파일</b>에 저장하면 제일 안전해요. (폰이 고장나도 클라우드에 남아요){'\n'}공유 창이 안 뜨는 폰이면 자동으로 <b>백업 코드가 복사</b>돼요.
              </div>
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={copyBackup}>백업 코드 복사 <span style={{ fontWeight: 500, opacity: 0.8 }}>· 카톡·메모에 붙여넣기</span></button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={downloadBackup}>폰에 파일로 저장 (다운로드 폴더)</button>

              <hr className="divider" style={{ margin: '16px 0' }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>백업에서 되살리기</div>
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>백업 파일 불러오기</button>
              <button className="btn-ghost press" style={{ width: '100%', marginTop: 10 }} onClick={() => setPasteOpen(true)}>코드 붙여넣기로 불러오기</button>
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

      {guide && <KitchenGuideSheet onClose={() => setGuide(false)} />}
      {lab && <LabSheet onClose={() => setLab(false)} />}

      {/* 첫 방문 코치마크 — 백업·의견 보내기 안내 */}
      {coach && <CoachMarks storageKey={PROFILE_COACH_KEY} steps={PROFILE_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}

function Stat({ n, label, onClick }) {
  const inner = (
    <>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{n}</div>
      <div className="t-sub" style={{ marginTop: 2 }}>{label}</div>
    </>
  )
  if (!onClick) return <div style={{ flex: 1, textAlign: 'center' }}>{inner}</div>
  return (
    <button className="press" onClick={onClick} style={{ flex: 1, textAlign: 'center', background: 'none', border: 'none', padding: 0 }}>
      {inner}
    </button>
  )
}
