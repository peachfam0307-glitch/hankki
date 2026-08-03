import { useMemo, useState, useRef } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import FoodIcon from '../components/FoodIcon'
import Buddy from '../components/Buddies'
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
import { backupNudgeStep, dismissBackupNudge, askOpenBackup, myRecipeCount } from '../nudges'
import { weeklyNow } from '../data/weekly'
import { whatsNew } from '../data/whatsnew'

// 홈 첫 방문 코치마크 — 진짜 핵심 기능부터 짚어준다(창업자 딸 아이디어 ⭐).
// 첫 스텝을 '되는 기능'(가져오기·오늘 뭐 해먹지)으로, 곧 출시 미리보기는 맨 뒤에 살짝.
const HOME_COACH_KEY = 'hankki:coach:home2' // 2026-07-26: 장보기·레꾸자랑 탭 안내 추가하며 키 올림(기존 테스터도 개선된 가이드 1회 노출)
const HOME_COACH_STEPS = [
  { sel: '[data-coach="import"]', img: uiHandPoint, label: '레시피 가져오기', desc: '캡처·붙여넣기로 레시피를 쏙 담아요 · 여기서 시작!' },
  { sel: '[data-coach="today"]', img: uiGomThumb, label: '오늘 뭐 해먹지?', desc: '냉장고 재료로 만들 수 있는 요리를 추천해요' },
  { sel: '[data-coach="nav-shop"]', img: uiGomShop, label: '장보기 · 쇼핑몰', desc: '18년차 주부가 엄선한 식재료를 담아 바로 사러 가고 · 냉장고 유통기한도 챙겨요' },
  { sel: '[data-coach="nav-brag"]', img: uiGomHeart, label: '레꾸자랑', desc: '내가 꾸민 레시피를 예쁜 카드로 친구한테 자랑! 카톡·인스타로 쏙' },
  { sel: '[data-coach="preview"]', img: uiGomClap, label: '한끼 소식', desc: '새로 열린 레시피·꾸미기와 곧 나올 것을 여기서 알려드려요' },
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
  // 백업 유도 — 레시피가 5개·15개 쌓였을 때 딱 두 번. 화면 그릴 때 한 번만 판정한다
  // (닫으면 0이 되어 사라지고, 다음 문턱에서 한 번 더 뜬다).
  // ⚠️ 「내 것」 개수로 센다 — 기본 레시피 50편을 세면 깔자마자 백업하라고 뜬다(2026-08-03 창업자 제보)
  const myN = myRecipeCount(recipes)
  const [bkStep, setBkStep] = useState(() => backupNudgeStep(myRecipeCount(recipes)))

  // 🗓 이번 주 레시피 — 달력이 여는 줄. ⛔재고가 없으면 `null` 이라 **줄을 아예 안 그린다**
  //    (빈 「이번 주」 자리를 남기지 않는다 · `LAB_*_URL` 이 비면 그 칸을 안 그리는 것과 같은 방식).
  const weekly = useMemo(() => weeklyNow(recipes), [recipes])

  // 📣 소식 한 줄 — ⛔손으로 적지 않는다. 날짜 게이트와 «같은 데이터»를 세어 만든다.
  //    새로 열린 게 있으면 그걸 먼저 말하고, 없으면 다음에 열릴 것을, 그것도 없으면 예고 목록을 말한다.
  const news = useMemo(() => whatsNew(), [])
  const newsLine = useMemo(() => {
    const o = news.opened
    if (o.length) {
      const head = `${o[0].title} ${o[0].count}개 새로 열렸어요`
      return o.length > 1 ? `${head} 외 ${o.length - 1}건` : head
    }
    if (news.upcoming) {
      const u = news.upcoming
      const when = u.dday === 0 ? '오늘' : u.dday === 1 ? '내일' : `${u.dday}일 뒤`
      return `${when} ${u.items[0].title}${u.items.length > 1 ? ` 외 ${u.items.length - 1}건` : ''}`
    }
    return '레시피북 PDF · 꾸미기 새 아이템 …'
  }, [news])

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
          {/* 곰 자리에 내 아바타를 넣었다(창업자 2026-07-29). 인사하는 곰은 '레시피' 탭으로 옮김.
              오른쪽에 아바타·톱니가 나란히 있어 눌러야 할 게 둘로 보이던 것도 정리된다. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* ♿ 아바타 그림은 38px 그대로, «손가락 닿는 자리»만 44px (2026-08-03 접근성).
                ⚠️ `.tap-ok` 클래스로 했을 땐 브라우저가 min-width 를 `auto` 로 계산해 안 먹었다
                   (CSS 는 분명히 들어가 있는데 — 이유는 못 밝혔다). 인라인은 확실히 먹는다. */}
            <button className="press" onClick={() => nav.go('profile')} aria-label="프로필"
              style={{ display: 'flex', flex: '0 0 auto', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Avatar name={profile.name} avatar={profile.avatar} size={38} />
            </button>
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
          {/* 설정 — 맨 오른쪽 끝(창업자 2026-07-29). 아바타는 왼쪽 브랜드 자리로 옮겼다.
              미정리 레시피는 설정의 '미정리' 통계로도 계속 열린다. */}
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="설정">
            <Icon name="settings" size={22} />
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

        {/* 백업 유도 — 레시피는 이 기기에만 저장된다(방침 그대로). 앱을 지우면 다 사라지므로
            쌓였을 때 한 번씩 조용히 권한다. ⛔겁주지 않는다 — 쌓였다는 사실 + 다음 행동만.
            강제 팝업이 아니라 닫을 수 있는 한 줄이고, 닫으면 그 문턱은 다시 안 뜬다.
            설계원칙 = docs/리텐션-설계원칙-2026-07-30.md */}
        {bkStep > 0 && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px 11px 14px', borderRadius: 14, background: 'var(--cream)' }}>
            {/* 설정의 '백업 · 내보내기' 줄과 같은 아이콘(cloud)으로 — 눌러 도착한 곳과 그림이 맞아야 헷갈리지 않는다 */}
            <Icon name="cloud" size={18} color="var(--brown)" stroke={1.9} />
            <button
              className="press"
              onClick={() => { askOpenBackup(); setBkStep(0); nav.go('profile') }}
              style={{ flex: 1, textAlign: 'left', minWidth: 0 }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>내 레시피가 {myN}개 쌓였어요</div>
              <div className="t-sub" style={{ fontSize: 11.5, marginTop: 1 }}>폰을 바꿔도 안 잃게 한 번 저장해둘까요?</div>
            </button>
            <button className="press" onClick={() => { dismissBackupNudge(bkStep); setBkStep(0) }} aria-label="닫기" style={{ flex: '0 0 auto', padding: 6 }}>
              <Icon name="x" size={16} color="var(--sand)" />
            </button>
          </div>
        )}

        {/* 📣 한끼 소식 — 기대감. 강제 팝업 대신 눈에 띄는 슬림 진입점.
            ⭐⭐ 창업자 2026-08-03 *"새로 열릴때 꼭 안내페이지에 올라오도록 해."*
               우리 업데이트는 «날짜가 저절로» 여는데 앱이 아무 말도 안 했다.
               ⛔ 부제를 손으로 적어두면 낡는다 → `whatsNew()` 가 실제로 열린 것을 세어 말한다.
            ⛔ 뱃지는 «새로 열린 게 있을 때만» 뜬다 — 늘 떠 있으면 아무도 안 본다. */}
        <button
          className="press"
          onClick={() => setPreview(true)}
          data-coach="preview"
          style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: 'var(--tease)', border: 'none', textAlign: 'left' }}
        >
          <span style={{ flex: '0 0 auto', display: 'inline-flex' }}><Icon name="gift" size={20} color="var(--tease-ic)" stroke={1.7} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)' }}>한끼 소식</span>
              {news.opened.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--surface)', background: 'var(--brown)', borderRadius: 999, padding: '1px 7px' }}>새로</span>
              )}
            </div>
            <div className="t-sub" style={{ fontSize: 11.5, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newsLine}</div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--sand)" />
        </button>

        {/* 🗓 이번 주 레시피 — 「왜 이게 올라왔는지」를 말해주는 자리.
            창업자 2026-08-03: *"뭐라도 안내를 하고 올려야지 않나? 올린 이유를?
            제철이라 ○○이 맛있다던가 매주마다 레시피 하나씩 올리는데 이번주는 이거라던가."*
            → 8/2 에 레시피 12편을 «안내 없이» 부어서 유저 눈엔 그냥 목록이 늘어난 것이었다.
            ⛔ 재고가 없으면 `weekly` 가 null 이라 이 줄이 통째로 안 그려진다(빈 자리 금지).
            ⛔ 「이번 주」는 **추천이지 잠금이 아니다** — 지난 주 것도 레시피 탭에 그대로 있다. */}
        {weekly && (
          <div style={{ marginTop: 14, padding: '13px 14px 12px', borderRadius: 16, background: 'var(--cream)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* ⚠️ `calendar` 아이콘은 우리 세트에 «없다» — 이름을 추측해 넣으면 화면에 아무것도 안 나온다.
                  있는 것 중 「새로 왔어요」에 가장 가까운 `sparkle`. (전체 목록 = `src/components/Icon.jsx`) */}
              <Icon name="sparkle" size={16} color="var(--brown)" stroke={2} />
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brown)', letterSpacing: '0.02em' }}>이번 주 제철</div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 5 }}>{weekly.title}</div>
            <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>{weekly.why}</div>
            <div className="hscroll" style={{ marginTop: 11 }}>
              {weekly.items.map((r) => (
                <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2rem" showDecor />
                  <div className="name">{r.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
