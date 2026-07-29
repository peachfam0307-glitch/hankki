import { useMemo, useState, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import FoodIcon from '../components/FoodIcon'
import Buddy from '../components/Buddies'
import gomHeader from '../assets/gom-header.png' // 뉴 물결 곰(인사) — 홈 상단 브랜드 마스코트
import TabTips from '../components/TabTips'
import PreviewSheet from '../components/PreviewSheet'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ConfirmSheet from '../components/ConfirmSheet'
// 🐻 코치 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지 규칙)
import uiHandPoint from '../assets/ui/hand_point.png'
import uiGomThumb from '../assets/ui/gom_thumbsup.png'
import uiGomShop from '../assets/ui/gom_shop.png'
import uiGomHeart from '../assets/ui/gom_heart.png'
import uiGomClap from '../assets/ui/gom_clap.png'
import { needsOnboarding } from '../components/Onboarding'

// 홈 첫 방문 코치마크 — 진짜 핵심 기능부터 짚어준다(창업자 딸 아이디어 ⭐).
// 첫 스텝을 '되는 기능'(가져오기·오늘 뭐 해먹지)으로, 곧 출시 미리보기는 맨 뒤에 살짝.
const HOME_COACH_KEY = 'hankki:coach:home2' // 2026-07-26: 장보기·레꾸자랑 탭 안내 추가하며 키 올림(기존 테스터도 개선된 가이드 1회 노출)
const HOME_COACH_STEPS = [
  { sel: '[data-coach="import"]', img: uiHandPoint, label: '레시피 가져오기', desc: '캡처·붙여넣기로 레시피를 쏙 담아요 · 여기서 시작!' },
  { sel: '[data-coach="today"]', img: uiGomThumb, label: '오늘 뭐 해먹지?', desc: '냉장고 재료로 만들 수 있는 요리를 추천해요' },
  { sel: '[data-coach="nav-shop"]', img: uiGomShop, label: '장보기 · 쇼핑몰', desc: '18년차 주부가 엄선한 식재료를 담아 바로 사러 가고 · 냉장고 유통기한도 챙겨요' },
  { sel: '[data-coach="nav-brag"]', img: uiGomHeart, label: '레꾸자랑', desc: '내가 꾸민 레시피를 예쁜 카드로 친구한테 자랑! 카톡·인스타로 쏙' },
  { sel: '[data-coach="preview"]', img: uiGomClap, label: '곧 나올 기능', desc: '레시피북 PDF · 꾸미기 새 아이템… 준비 중인 것도 구경해요' },
]

export default function HomeScreen() {
  const { recipes, profile, pantry, removeRecipe } = useStore()
  const nav = useNav()
  const [pick, setPick] = useState(0)
  const [preview, setPreview] = useState(false)
  // 최근 저장 카드 길게 눌러 삭제 — 지우려고 상세까지 들어가 ⋯메뉴를 여는 게 번거롭다(창업자 요청).
  const [delAsk, setDelAsk] = useState(null) // 삭제 확인 중인 레시피
  const pressTimer = useRef(null)
  const longFired = useRef(false)
  const startPress = (r) => {
    longFired.current = false
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => { longFired.current = true; setDelAsk(r) }, 550)
  }
  const endPress = () => clearTimeout(pressTimer.current)
  // 온보딩(첫 실행 소개)이 아직 안 끝났으면 이번엔 쉬고, 다음 실행에서 보여준다(겹침 방지).
  const [coach, setCoach] = useState(() => needsCoach(HOME_COACH_KEY) && !needsOnboarding())

  // 가져오기·공유로 담기만 하고 아직 편집 안 한 레시피 수
  const unsortedN = recipes.filter((r) => r.status === 'unsorted').length

  // 오늘의 추천 — 냉장고 재료로 만들 수 있는 요리 우선, 없으면 자주 해먹는/전체
  const today = useMemo(() => {
    const pool = recipes.filter((r) => r.status !== 'unsorted')
    const withPantry = pool
      .map((r) => {
        const ings = (r.ingredients || []).join(' ')
        const n = (pantry || []).filter((p) => {
          const k = (p.name || '').trim().split(/\s+/)[0]
          return k && ings.includes(k)
        }).length
        return { r, n }
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (withPantry.length) return { list: withPantry.map((x) => x.r), fromFridge: true }
    const cooked = pool.filter((r) => (r.cooked || 0) > 0)
    return { list: cooked.length ? cooked : pool, fromFridge: false }
  }, [recipes, pantry])
  const todayPick = today.list.length ? today.list[pick % today.list.length] : null

  const often = useMemo(
    () => [...recipes].filter((r) => (r.cooked || 0) > 0).sort((a, b) => b.cooked - a.cooked).slice(0, 8),
    [recipes]
  )
  const recent = useMemo(
    () => [...recipes].sort((a, b) => b.savedAt - a.savedAt).slice(0, 4),
    [recipes]
  )

  const open = (id) => nav.push({ name: 'detail', id })

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* 뉴 물결 곰(인사) + 한끼 로고락업 — 홈 상단 브랜드 마크. 살랑(sway) 모션=레꾸 피커엔 없는 모션. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <img src={gomHeader} alt="한끼 곰" width={46} height={46} className="hk-m-sway" style={{ display: 'block', objectFit: 'contain', transformOrigin: 'bottom center', margin: '-4px 0' }} />
            <div className="h-title">한끼</div>
          </div>
          <TabTips tab="home" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 가져오기 — 제일 자주 쓰는 기능이라 맨 위에 */}
          <button
            className="press"
            data-coach="import"
            onClick={() => nav.push({ name: 'import' })}
            aria-label="가져오기"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brown)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 13px', borderRadius: 999 }}
          >
            <Icon name="plus" size={16} color="#fff" stroke={2.4} /> 가져오기
          </button>
          {/* 설정 — 예전 Inbox(받은 함) 자리. Inbox는 '레시피' 탭과 겹쳐 거의 안 쓰여 뺐고,
              대신 설정을 톱니로 또렷하게 올렸다(아바타 위 작은 힌트보다 명확). Inbox 기능은 설정의 '미정리' 통계에서 계속 연다. */}
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="설정">
            <Icon name="settings" size={22} />
          </button>
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="프로필">
            <Avatar name={profile.name} avatar={profile.avatar} />
          </button>
        </div>
      </div>

      <div className="pad">
        {/* 1. 검색 */}
        <button
          className="searchbar press"
          style={{ width: '100%', marginTop: 4 }}
          onClick={() => nav.go('search')}
        >
          <Icon name="search" size={19} color="var(--text-sub)" />
          <span style={{ fontSize: 14.5 }}>레시피, 재료, 태그를 검색해 보세요.</span>
        </button>

        {/* 아직 정리 안 한 레시피(예전 'Inbox') — 홈·레시피 탭 목록엔 안 뜨는 것들이라
            입구가 없으면 "저장했는데 사라졌다"가 된다. 0개면 아예 안 보이니 평소 화면은 그대로. */}
        {unsortedN > 0 && (
          <button
            className="press"
            onClick={() => nav.push({ name: 'inbox' })}
            style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 14, background: 'var(--cream)', border: 'none', textAlign: 'left' }}
          >
            <Icon name="edit" size={18} color="var(--brown)" stroke={1.9} />
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>정리 안 한 레시피 {unsortedN}개</span>
            <Icon name="chevron-right" size={17} color="var(--sand)" />
          </button>
        )}

        {/* 업데이트 예고 — 기대감. 강제 팝업 대신 눈에 띄는 슬림 진입점 */}
        <button
          className="press"
          onClick={() => setPreview(true)}
          data-coach="preview"
          style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: 'var(--tease)', border: 'none', textAlign: 'left' }}
        >
          <span style={{ flex: '0 0 auto', display: 'inline-flex' }}><Icon name="gift" size={20} color="var(--tease-ic)" stroke={1.7} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)' }}>곧 나올 기능 미리보기</div>
            <div className="t-sub" style={{ fontSize: 11.5, marginTop: 1 }}>레시피북 PDF · 꾸미기 새 아이템 …</div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--sand)" />
        </button>

        {/* 오늘 뭐 해먹지? */}
        {todayPick && (
          <div className="today-card" data-coach="today">
            <button className="today-main press" onClick={() => open(todayPick.id)}>
              <Thumb recipe={todayPick} style={{ width: 72, height: 72, flex: '0 0 auto' }} radius={16} showDecor />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="today-label">오늘 뭐 해먹지?</div>
                <div className="today-title">{todayPick.title}</div>
                <div className="today-reason">{today.fromFridge ? '냉장고 재료로 만들 수 있어요' : '이건 어때요?'}</div>
              </div>
            </button>
            {today.list.length > 1 && (
              <button className="today-refresh press" onClick={() => setPick((p) => p + 1)}>다른<br />추천</button>
            )}
          </div>
        )}

        {/* 2. 자주 해먹는 요리 */}
        {often.length > 0 && (
          <>
            <div className="sec-head">
              <div className="h-section">자주 해먹는 요리</div>
              <button className="t-more press" onClick={() => nav.push({ name: 'cooked' })}>
                더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
              </button>
            </div>
            <div className="hscroll">
              {often.map((r) => (
                <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2rem" showDecor />
                  <div className="name">{r.title}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3. 최근 저장 */}
        <div className="sec-head">
          <div className="h-section">최근 저장</div>
          <button className="t-more press" onClick={() => nav.go('myrecipes')}>
            더보기 <Icon name="chevron-right" size={14} color="var(--text-sub)" />
          </button>
        </div>
        {/* 2×2 그리드 — 곰펭 표지를 크게 보여줘 목록보다 화사하고, 레시피·자랑 탭과 통일감.
            출처·시간 메타는 홈 대시보드엔 군더더기라 뺐다(상세에서 확인). */}
        <div className="grid2">
          {recent.map((r) => (
            <div key={r.id} className="grid-card">
              {/* 탭=열기 / 길게 누르기=삭제 확인. 길게 눌러 뜬 경우엔 탭 동작(열기)을 막는다. */}
              <button
                className="press" style={{ textAlign: 'left', width: '100%' }}
                onClick={() => { if (!longFired.current) open(r.id) }}
                onPointerDown={() => startPress(r)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                <div className="name">{r.title}</div>
              </button>
            </div>
          ))}
        </div>

        {/* 내 레시피 전체 보기 — 전체 목록은 '레시피' 탭이 담당(홈은 대시보드).
            예전엔 홈에 전체 그리드를 통째로 얹어 '남의 요리책'처럼 어수선했다. */}
        <button
          className="press"
          onClick={() => nav.go('myrecipes')}
          style={{
            width: '100%', marginTop: 22, padding: 15, borderRadius: 'var(--r-md)',
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 14.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Icon name="bookmark" size={17} color="var(--brown)" stroke={2.2} />
          내 레시피 전체 보기
        </button>
        <div style={{ height: 12 }} />
      </div>

      {preview && <PreviewSheet onClose={() => setPreview(false)} />}

      {/* 최근 저장 카드 길게 눌러 삭제 */}
      {delAsk && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${delAsk.title}』 레시피를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeRecipe(delAsk.id); nav.showToast('레시피를 삭제했어요') }}
          onClose={() => setDelAsk(null)}
        />
      )}

      {/* 첫 방문 코치마크 — 미리보기 진입점 안내 */}
      {coach && <CoachMarks storageKey={HOME_COACH_KEY} steps={HOME_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}

// 아바타 — 요리사 친구·사진·이모지·브랜드 아이콘을 고를 수 있고, 없으면 이름 첫 글자.
export function Avatar({ name, avatar, size = 32 }) {
  if (avatar?.type === 'buddy' && avatar.value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
          overflow: 'hidden',
        }}
      >
        <Buddy id={avatar.value} size={size} />
      </div>
    )
  }
  if (avatar?.type === 'icon' && avatar.value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
        }}
      >
        <FoodIcon name={avatar.value} size={size * 0.62} />
      </div>
    )
  }
  if (avatar?.type === 'photo' && avatar.value) {
    return (
      <img
        src={avatar.value}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto' }}
      />
    )
  }
  const isEmoji = avatar?.type === 'emoji' && avatar.value
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--cream-deep)',
        color: 'var(--brown)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * (isEmoji ? 0.54 : 0.42),
        flex: '0 0 auto',
      }}
    >
      {isEmoji ? avatar.value : (name || '한')[0]}
    </div>
  )
}
