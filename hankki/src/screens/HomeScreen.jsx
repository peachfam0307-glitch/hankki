import { useMemo, useState, useRef } from 'react'
import { COACH } from '../coach'
import { todayKST } from '../today'
import { nextUpList } from '../nextUp'
import OneLineSheet from '../components/OneLineSheet'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import FoodIcon from '../components/FoodIcon'
import Buddy from '../components/Buddies'
import TabTips from '../components/TabTips'
import TabTalk from '../components/TabTalk'
import PreviewSheet from '../components/PreviewSheet'
import NewsPopup, { needsNewsPopup, markNewsSeen } from '../components/NewsPopup'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ConfirmSheet from '../components/ConfirmSheet'
// 🐻 코치 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지 규칙)
import uiHandPoint from '../assets/ui/hand_point.png'
// 🐻 엄지척·박수 = **물결 정본**(창업자 2026-08-14 제공 · `…-08-14/낱개/gt_01`·`gt_c01`)
//    ⛔ 옛 `ui/gom_thumbsup`·`ui/gom_clap` 은 «매끈 곰»이었다 — 창업자 판정 *"2.4번만 옛날곰이고 나머지는 물결곰이야."*
//    ✅ `gom_shop`·`gom_heart` 는 **물결이 맞아서 그대로 둔다**(같은 판정).
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png'
import uiGomShop from '../assets/ui/gom_shop.png'
import uiGomHeart from '../assets/ui/gom_heart.png'
import uiGomClap from '../assets/ui/wave/gom_clap.png'
// 🐻🐧 «물결 정본»(`gp_*`)만 쓴다 — 창업자 2026-08-13 *"한끼소식에 쟤 옛날 곰이야"*
//    ⛔ `assets/ui/gom_*` 다섯(clap·thumbsup·heart·shop)은 **옛 매끈 그림체**다. 선이 굵고 얼굴이 크고 앞치마 무늬도 다르다.
//       핀에 *"곰펭 = 무조건 물결 · 옛 매끈 곰펭은 앱 반영 금지"* 라고 박혀 있는데 내가 새 자리에 그걸 갖다 썼다.
//    ⚠️ 안내 코치가 아직 옛 컷을 쓰는데(7/29부터 그대로) 그건 창업자 판정 전이라 손대지 않았다.
//    ⭐⭐ 컷은 «서랍에 있는 13개»가 아니라 `assets/ui/wave/` 에서 가져온다 — 창업자 2026-08-13
//       *"우리 안쓰는 곰이랑 펭 많은데.."* · *"맨날 똑같은거 말고 다른거 좀 써"*
//       실측 = `docs/stickers/공유카드-곰펭-2508` 에 **안 쓰던 물결 정본이 70장** 놀고 있었다.
//       화면에 33~56px 로 붙으니 긴변 320px 로 줄여 담았다(원본은 문서에 그대로 있다).
//    ⛔ 「한끼」 제목 «옆»엔 안 넣는다 — 창업자 2026-08-13 *"홈화면 한끼옆에는 안넣고. 지저분해.."*
//       (아바타 ＋ 제목 ＋ 물음표 ＋ 가져오기 ＋ 톱니가 이미 한 줄에 다섯이다)
//    ⭐ 홈의 우리 애 자리 = **「한끼 소식」 하나.** 창업자가 콕 집었다 — *"한끼소식 옆에 캐릭터 하나 넣으면 되겠다"*
import uiGomWow from '../assets/ui/wave/gom_wow.png' // 꼬르곰 감탄(별눈) — 창업자가 2026-08-13 에 새로 뽑아 준 컷
// 🐧 「다음에 뭐 할까」 카드의 주인 — 창업자 *"꼬르곰이 한끼소식도 꼬르곰 얘도 꼬르곰이라 좀 정신이없어"*
//    ⭐ 홈에서 꼬르곰 자리는 「한끼 소식」 하나로 두고, 이 카드는 펭펭이 맡는다.
import uiPengSearch from '../assets/ui/wave/pn_search.png'
// 📔 일기 안내에 쓸 컷 — 꼬르곰·펭펭이 «둘 다» 하트를 만든다. 일기는 「그날의 마음을 남기는」 자리라 맞다.
//    ⛔ ui 컷 다섯(hand_point·thumbsup·shop·heart·clap)은 이미 다른 단계가 다 쓰고 있어 정본 콤비에서 가져왔다.
import gpDuoHeart from '../assets/stickers/photo/gp_duoht.png'
import { needsOnboarding } from '../components/Onboarding'
import { backupNudgeStep, dismissBackupNudge, askOpenBackup, myRecipeCount } from '../nudges'
import { weeklyNow, homemadeNow } from '../data/weekly'
import { whatsNew } from '../data/whatsnew'
import { pantryScore } from '../pantryMatch'

// 🗓🍳 「이번 주」 박스 — 제철 줄과 우리집레시피 줄이 «똑같이» 생겼다.
//   ⛔ 마크업을 두 번 적지 않는다 — 그러면 한쪽만 고치는 사고가 난다(2026-08-11 신설).
//   ⚠️ HomeScreen «밖»에 둔다. 안에 정의하면 렌더마다 새 컴포넌트가 되어 리마운트가 일어난다.
function WeekBox({ w, 기본, open }) {
  return (
    <div className="weekly-box">
      <div className="weekly-text">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* ⚠️ `calendar` 아이콘은 우리 세트에 «없다» — 이름을 추측해 넣으면 화면에 아무것도 안 나온다.
              있는 것 중 「새로 왔어요」에 가장 가까운 `sparkle`. (전체 목록 = `src/components/Icon.jsx`)
              🔠 [2026-08-13 창업자] *"아래 이번주한끼는 이번주제철이랑 «같은» 이모지 넣자."*
                 ⛔ 전엔 우리집레시피만 곰 스티커(20px)를 달아 «가르려» 했는데, 두 상자는 나란히 선 같은 갈래다.
                    다른 표를 달면 「왜 얘만 다르지」가 되고, 게다가 그 컷이 **옛 매끈 곰**이었다. */}
          <Icon name="sparkle" size={16} color="var(--brown)" stroke={2} />
          {/* ⛔ 여기 「이번 주 제철」이 «글자로 박혀» 있었다 — 제철이 아닌 주도 그렇게 떴다.
              (2026-09-28 「추석 남은 음식」이 실제로 그랬고, 52주 표 기준 17주가 제철이 아니다) */}
          <div className="weekly-kicker">{w.kicker || 기본}</div>
        </div>
        <div className="weekly-title">{w.title}</div>
        <div className="t-sub weekly-why">{w.why}</div>
      </div>
      {/* 🗓 `weekly-row` = 밀지 않고 한 화면에 딱 맞는 격자 (2026-08-03 오징어 상자 사고 → 잘림 0) */}
      <div className="weekly-row">
        {w.items.map((r) => (
          <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
            {/* 🍱 [2026-08-23 창업자] *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음.
                조금만더크게수정."* — 맞다. 판은 넓은데 그림만 `56%` 라 가운데가 휑했다.
                ⛔ 카드 폭을 키우지 않는다 — 한 줄에 세 칸 보이는 게 이 줄의 값어치다.
                ✅ 판 «안»에서 그림만 키운다(56% → 70%). 이름표 자리도 그대로다. */}
            <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2.5rem" iconSize="70%" showDecor />
            <div className="name">{r.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// 홈 첫 방문 코치마크 — 진짜 핵심 기능부터 짚어준다(창업자 딸 아이디어 ⭐).
// 첫 스텝을 '되는 기능'(가져오기·오늘 뭐 해먹지)으로, 곧 출시 미리보기는 맨 뒤에 살짝.
// 2026-07-26: 장보기·레꾸자랑 탭 안내 추가하며 home→home2 (기존 테스터도 개선된 가이드 1회 노출)
// 2026-08-08: 「한끼 일기」 안내 추가하며 home2→home3.
//   ⭐ 키를 안 올리면 **이미 본 사람에겐 영영 안 뜬다** — 일기는 v9.85~v10.02 에 크게 자란 기능인데
//      온보딩·코치·스토어 스샷 어디에도 없어서 «탭이 있는 줄도 모르는» 상태였다(창업자 지적).
const HOME_COACH_KEY = COACH.home
const HOME_COACH_STEPS = [
  { sel: '[data-coach="import"]', img: uiHandPoint, label: '레시피 가져오기', desc: '캡처·붙여넣기로 레시피를 쏙 담아요 · 여기서 시작!' },
  { sel: '[data-coach="today"]', img: uiGomThumb, label: '오늘 뭐 해먹지?', desc: '냉장고 재료로 만들 수 있는 요리를 추천해요' },
  // 📔 하단바 순서대로 짚는다(홈·가져오기·레시피·일기·장보기·레꾸자랑) — 화면과 안내가 어긋나면 못 찾는다
  { sel: '[data-coach="nav-diary"]', img: gpDuoHeart, label: '한끼 일기', desc: '오늘 뭐 해먹었는지 사진·속지로 남기고 예쁘게 꾸며요 · 달력으로 한눈에' },
  { sel: '[data-coach="nav-shop"]', img: uiGomShop, label: '장보기 · 쇼핑몰', desc: '18년차 주부가 엄선한 식재료를 담아 바로 사러 가고 · 냉장고 유통기한도 챙겨요' },
  { sel: '[data-coach="nav-brag"]', img: uiGomHeart, label: '레꾸자랑', desc: '내가 꾸민 레시피를 예쁜 카드로 친구한테 자랑! 카톡·인스타로 쏙' },
  { sel: '[data-coach="preview"]', img: uiGomClap, label: '한끼 소식', desc: '새로 열린 레시피·꾸미기와 곧 나올 것을 여기서 알려드려요' },
]

export default function HomeScreen() {
  // 📔 diary = 「만들었어요」가 쌓는 요리 일기 — 「한 줄 안 쓴 것」을 세는 데 쓴다(`nextUp.js`)
  const { recipes, profile, pantry, diary, removeRecipe } = useStore()
  const nav = useNav()
  // 🗓🗓 「오늘 뭐 해먹지」를 **날짜로 돌린다** (창업자 확정 2026-08-28 = *"날짜로 돌리자"*)
  //
  // ⛔⛔ **이름이 「오늘」인데 날짜로 안 바뀌고 있었다.** `useState(0)` 이라 늘 맨 앞 하나였고,
  //    앱을 껐다 켜면 「다른 추천」으로 넘긴 것도 도로 처음으로 왔다. **매일 같은 게 떴다.**
  // 📮 경위 = 창업자 = *"월요일로 맞추면 일주일간 너무 암것도 없이 조용하지 않아?"*
  //    → 재보니 저절로 바뀌는 건 **월(제철·우리집레시피) · 목(장바구니)** 둘뿐이었고,
  //       정작 「오늘」이라는 카드가 안 바뀌고 있었다.
  // ⛔ 「상위 몇 개 안에서만 돌리기」는 접었다 — 창업자 = *"냉장고에 암것도 없으면 똑같은거만 보니까.."*
  //    맞다. 냉장고가 비면 목록이 «전체»가 되는데 그 상위 N개는 고정이라 그게 그거다.
  // ⭐ 「다른 추천」 단추는 그대로다 — 오늘 것에서 «한 칸씩» 더 넘긴다.
  // ⛔ 날짜는 `todayKST()` 로만 받는다(절대원칙 27) — 여기서 만들지 않는다.
  const [pick, setPick] = useState(() => Math.floor(Date.parse(`${todayKST()}T00:00:00Z`) / 86400000))
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
  // 🍳 우리집레시피 — 창업자가 실제로 해먹는 것. 제철과 «별개» 줄이다(창업자 확정 2026-08-11, 안 ⒜).
  //    ⛔ 재고가 없으면 `null` 이라 박스를 아예 안 그린다(제철 줄과 같은 규칙).
  const homemade = useMemo(() => homemadeNow(recipes), [recipes])

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

  // 🎉 새로 열린 날 «딱 한 번» — ⛔온보딩·코치마크와 겹치면 안 뜬다(한 화면에 둘이 겹치면 둘 다 못 읽는다).
  //    ⛔ 주간 레시피만 바뀐 주엔 안 뜬다 — 그건 홈 뱃지로 충분하다(매주 팝업 = 재촉).
  const [newsPop, setNewsPop] = useState(
    () => needsNewsPopup(news) && !needsOnboarding() && !needsCoach(HOME_COACH_KEY)
  )
  // ⚠️ 어떻게 닫든 «봤음»으로 친다 — 안 그러면 뒤로가기로 닫은 사람에게 매번 뜬다.
  const closeNews = () => { markNewsSeen(news); setNewsPop(false) }

  // 오늘의 추천 — 냉장고 재료로 만들 수 있는 요리 우선, 없으면 자주 해먹는/전체
  // ⭐ 맞추기·점수는 `src/pantryMatch.js` **한 곳**에서 한다 —
  //    「냉장고 파먹기」(`PantryView`)와 «같은 판단»이라야 두 화면이 딴소리를 안 한다.
  //    (2026-08-10 창업자 *"오늘뭐해먹지는 뭘 기반으로 추천해주는거야?"* → 코드를 읽다 두 곳이
  //     따로 적혀 있고 둘 다 「글자 포함」이라 「무」가 «풀무원·단무지»에 걸리는 걸 찾았다)
  const today = useMemo(() => {
    const pool = recipes.filter((r) => r.status !== 'unsorted')
    const withPantry = pool
      .map((r) => ({ r, n: pantryScore(r, pantry) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (withPantry.length) return { list: withPantry.map((x) => x.r), fromFridge: true }
    const cooked = pool.filter((r) => (r.cooked || 0) > 0)
    return { list: cooked.length ? cooked : pool, fromFridge: false }
  }, [recipes, pantry])
  const todayPick = today.list.length ? today.list[pick % today.list.length] : null

  // 🍳 「다음에 뭐 할까」 — 홈 맨 위 한 줄이 상황을 보고 «할 일»을 꺼낸다 (창업자 확정 2026-08-19 · 안 ⓐ)
  //    ⭐ 고르는 법은 `src/nextUp.js` **한 곳**에 있다 — 여기선 «그리기»만 한다.
  //    ⛔ 셋을 각각 줄로 놓지 않는다 — 다 「다음에 뭐 할까」라는 같은 물음의 답이라 서로 경쟁한다.
  //    ⛔ 「다음 날부터」라 «오늘» 만든 것은 안 뜬다 — 「만들었어요는 누르면 끝」 확정(2026-08-06)을 온전히 지킨다.
  const nextUp = useMemo(() => nextUpList(recipes, diary, Date.now()), [recipes, diary])
  // ✍️ 「한 줄 남기기」 — 홈에서 «바로» 쓴다(상세로 안 보낸다).
  //    ⭐ 쓰고 닫으면 `note` 가 차서 `nextUp` 에서 저절로 빠진다 —
  //       창업자 *"한줄남기기 마치면 그 창은 사라지게 하자"* 가 «지우는 코드 없이» 된다.
  const [oneLine, setOneLine] = useState(null)

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
        {/* 🏠🏠 [창업자 확정 2026-08-22] 상단바 오른쪽 = 🔍 검색 · 🗃 임시보관함 · ⚙ 설정
         *
         * 📮 창업자 = *"가져오기 위에 버튼이 꼭 필요한가?"* → *"가져오기 버튼 없애고 **검색 아이콘을 넣어도** 될 것 같은데"*
         *    → *"**그옆에 임시보관함 아이콘을 넣던가**"*
         *
         * ⛔⛔ **「＋ 가져오기」는 «두 곳»에 있었다** — 여기(홈에서만) ＋ 하단바 파란 원(모든 탭에서).
         *    둘 다 같은 곳(`import`)으로 간다. 그리고 우리는 **중복인 걸 «알면서» 뒀다** —
         *    `BottomNav.jsx` 주석에 *"B 안이면 홈으로 갔다 와야 한다(홈 맨 위에 「＋ 가져오기」가 있긴 하다)"*
         *    라고 적어놓고 하단바 쪽을 채택했다. **그러면 이건 «남은 것»이지 «필요한 것»이 아니다.**
         *
         * 🔢 이 셋으로 바꾸면 홈에서 **줄이 «둘» 사라진다**(검색바 47px ＋ 임시보관함 43px).
         *    실측 = 주간 카드가 471 → 364px = **107px 위로**.
         *    ⭐ 그리고 **다른 탭과 말이 맞는다** — 일기·레시피는 이미 상단바 돋보기를 쓴다. 홈만 혼자 큰 검색바였다.
         *
         * ⛔ 안내코치 첫 단계가 이 자리를 짚고 있었다(*"레시피 가져오기 · 여기서 시작!"*).
         *    빼기만 하면 **첫 걸음부터 허공을 가리킨다** → `data-coach="import"` 를 **하단바 단추로 옮겼다**.
         *    ⭐ 오히려 낫다 — 하단바 단추는 «어느 탭에서든» 있다.
         */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="icon-btn press" onClick={() => nav.go('search')} aria-label="검색">
            <Icon name="search" size={22} />
          </button>
          {/* 🗃 임시보관함 — 📮 *"INBOX 나도 어딨는지 모르는데"*(2026-08-21) 라 «늘» 보여야 한다.
           *    ⛔ 그래서 「0개면 숨기기」로 되돌리지 «않는다». 자리만 옮긴 것이다.
           *    ⭐ 글자를 빼면 «몇 개 남았는지»가 사라진다 → **숫자 뱃지**로 되살린다.
           *       (2026-08-13 AI 스캔 잔량과 같은 생각 — *"유저가 몇 장 남았는지 스스로 알아야 한다"*) */}
          <button
            className="icon-btn press"
            onClick={() => nav.push({ name: 'inbox' })}
            aria-label={unsortedN > 0 ? `임시보관함 · 정리 안 한 레시피 ${unsortedN}개` : '임시보관함'}
            style={{ position: 'relative' }}
          >
            <Icon name={unsortedN > 0 ? 'edit' : 'inbox'} size={22} />
            {unsortedN > 0 && (
              <span
                style={{
                  position: 'absolute', top: 2, right: 0, minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 999, background: 'var(--brown)', color: '#fff',
                  fontSize: 12, fontWeight: 800, lineHeight: '16px', textAlign: 'center',
                }}
              >
                {unsortedN > 99 ? '99+' : unsortedN}
              </span>
            )}
          </button>
          {/* 설정 — 맨 오른쪽 끝(창업자 2026-07-29). 아바타는 왼쪽 브랜드 자리로 옮겼다. */}
          <button className="icon-btn press" onClick={() => nav.go('profile')} aria-label="설정">
            <Icon name="settings" size={22} />
          </button>
        </div>
      </div>

      {/* 💬 상단바 «바깥»이라야 아래로 내려간다 — `.topbar` 는 가로 flex 라
          그 «안»에 넣으면 제목 옆으로 붙고 「한/끼」로 쪼개진다(시안에서 실제로 그랬다). */}
      <TabTalk tab="home" />

      <div className="pad">
        {/* 📏📏 [창업자 확정 2026-08-22] 검색바 줄과 임시보관함 줄을 **상단바 아이콘으로 올렸다**(위 참조).
         *
         * 📮 창업자 = *"위에 높이가 낮은 상자들이 몰려있으니까 지저분해 보이지 않아? 눈에도 잘 안들어오고"*
         *    ＋ *"다닥다닥 붙어있어서"*
         *
         * 🔢 손보기 «전» 실측 (390×844 · 홈 위에서부터) — 창업자 말이 숫자로 그대로 나왔다:
         *    검색바 47 · 임시보관함 43 · 소식 62 · 안해봤어요 48 · 오늘뭐해먹지 98 · 이번주 807
         *    → **키 110px 이하가 «다섯 연달아»** · 틈은 10~14px
         *    ⭐⭐ 키가 비슷한 상자가 셋 이상 연달으면 눈이 «하나씩 세지 않고» 한 덩어리로 본다.
         *       그래서 「눈에 잘 안 들어온다」가 나온 것이다. **여백만으로는 안 풀린다 — 개수를 줄여야 한다.**
         *    ✅ 둘을 올려 다섯 → 셋. 남은 셋은 키가 62·48·98 로 서로 달라 하나씩 세어진다.
         *
         * ⛔ 「임시보관함을 도로 숨기기」가 «아니다» — 창업자 제보(*"INBOX 나도 어딨는지 모르는데"*)로
         *    되돌아가지 않으려고 «자리만» 옮겼다. 입구는 상단바에 늘 있다.
         */}

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
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>내 레시피가 {myN}개 쌓였어요</div>
              <div className="t-sub" style={{ fontSize: 15, marginTop: 1 }}>폰을 바꿔도 안 잃게 한 번 저장해둘까요?</div>
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
        {/* 📐📐 **넓은 화면에선 「한끼 소식」과 「오늘 뭐 해먹지」가 좌우로 나란히 선다** (창업자 확정 2026-08-10 · 안 E)
            📮 창업자 *"홈에사 한끼소식이랑 오징어가 너무 오른쪽이 휑해보인다.."* → 갈래 여섯을 실물로 찍어 **E** 확정.
            ⛔ 뿌리 = 둘 다 `flex` 라 「글 왼쪽 · 화살표 오른쪽」이고, 넓어지면 **가운데만** 늘어난다.
               🔢 손대기 전 실측(패드 1600) = 소식 빈 폭 **1364px** · 오늘 빈 폭 **1358px**.
            ⭐ 폭 상한을 씌우지 «않는다» — 창업자 확정 안 D(v10.07) 「가로에선 앱이 화면 폭을 꽉 쓴다」와 안 부딪히게.
            ⚠️ 이 묶음 때문에 «순서»가 바뀐다(소식 → 오늘 → 제철). 창업자가 고른 E 시안이 그 순서였다. */}
        <div className="home-pair">
          <button
            className="press news-card"
            onClick={() => setPreview(true)}
            data-coach="preview"
          >
            {/* 🐻 [2026-08-13 창업자] *"한끼소식 옆에 캐릭터 하나 넣으면 되겠다"*
                ⭐ 선물 아이콘을 «치우는» 게 아니라 **그 자리를 꼬르곰이 대신한다** — 새 소식은 오른쪽 「새로」 뱃지가
                   이미 말하고 있어서 선물 그림은 같은 말을 두 번 하고 있었다.
                ⛔ 첫 판은 `ui/gom_clap`(옛 매끈 곰)이었다 → 창업자가 한 번에 잡았다. **물결 정본으로 교체.** */}
            {/* 🐻 [창업자 2026-08-26] *"꼬르곰 좀 키우고. 꼬르곰 이랑 글자 조금 떼고"*
                ⛔⛔ 크기가 `width={26}` «인라인»이라 CSS 로는 못 이긴다(v10.08 에 당했다).
                   ✅ 그래서 크기를 **CSS 변수**로 읽게 한다 — 폰은 26px 그대로, 패드에서만 `.news-gom` 이 키운다.
                   ⭐ 「한끼 소식」 글자 크기를 클래스로 뺀 것과 «같은 처방»이다(바로 아래 주석). */}
            <img src={uiGomWow} alt="" draggable={false} className="hk-m-tongtong news-gom"
              style={{ flex: '0 0 auto', display: 'block', objectFit: 'contain', margin: '-9px 0',
                width: 'var(--news-gom, 26px)', height: 'auto' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* 🔠 크기는 인라인이 아니라 클래스로 — 넓은 화면에서 키우려면 CSS 가 이겨야 한다
                    (인라인은 `!important` 없이는 절대 못 이긴다 · v10.08 에 실제로 당했다) */}
                <span className="news-title">한끼 소식</span>
                {news.opened.length > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--surface)', background: 'var(--brown)', borderRadius: 999, padding: '1px 7px' }}>새로</span>
                )}
              </div>
              <div className="t-sub news-sub">{newsLine}</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>

          {/* 🍳🍳 「다음에 뭐 할까」 — ✅창업자 확정 2026-08-20 (시안 4판의 「라 — 라벨 알약」)
              📮 판정 원문 = *"**라벨알약 말한거야**"* · 그 앞 = *"좋아졌어."*
              ⭐⭐ 여기까지 온 길이 셋이다 —
                 ⑴ *"꼬르곰이 한끼소식도 꼬르곰 얘도 꼬르곰이라 좀 정신이없어"* → 🐧**펭펭**이 맡는다
                 ⑵ *"높이도 줄이면 좋겠어"* ＋ *"몰려있어서 산만해보이고 지저분해"* → **1장 · 한 줄**(102→48px)
                 ⑶ *"1줄이라 **오늘뭐해먹지랑 같은 색 구성인데 «반대로» 보여**"* → 바탕을 「오늘」과 **한 벌**로
              ⛔⛔ **자리가 `.home-pair` «안»이다** — 밖에 두면 안 된다.
                 창업자 확정 순서는 *"한끼소식이 제일 위로 그 아래 아직안해봤어요"* 인데,
                 소식만 위로 빼면 `.home-pair` 에 「오늘 뭐 해먹지」가 «혼자» 남아
                 넓은 화면(패드)에서 **오른쪽 칸이 텅 빈다** — 창업자가 예전에 짚은
                 *"한끼소식이랑 오징어가 너무 오른쪽이 휑해보인다.."* 가 그대로 되돌아온다.
                 ✅ 그래서 소식이 비운 자리에 **이 카드가 들어간다**:
                    · 폰  = 소식 → 다음에 뭐 할까 → 오늘 뭐 해먹지 (세로 · 확정 순서 그대로)
                    · 패드 = 소식(전폭) ／ [다음에 뭐 할까 | 오늘 뭐 해먹지] (좌우)
              ⛔ 「이유」·「보기」 줄은 CSS 가 접는다 — 데이터·코드는 그대로 산다(`styles.css` `.next-reason`).
              ⛔ `.next-card.sub` 와 여러 장 코드도 남긴다 — 되돌리는 날 그대로 살아난다. */}
          {nextUp && (
            <div className="next-row" role="list">
              {nextUp.것들.map((it, i) => (
                <div className={`next-card${i > 0 ? ' sub' : ''}`} key={it.키} role="listitem">
                  {/* 🐻 카드 «전체»가 눌려 상세로 간다. 단추는 그 위에 얹어 따로 잡는다.
                      ⛔ button 안에 button 을 넣지 않는다(HTML 규칙 위반 · 안드로이드에서 안 눌린다) */}
                  <button className="next-open press" onClick={() => it.recipe && open(it.recipe.id)}>
                    {/* 🐧 펭펭은 갈래와 무관하게 «한 컷»이다 — 이 카드가 한 장뿐이라 갈래마다 바꿀 이유가 없고,
                        찾는 포즈(`pn_search`)가 「다음에 뭐 할까」와 뜻이 맞는다.
                        ⛔ 펭펭을 웃기지 않는다(정본 규칙) — `pn_search` 는 무표정이라 그대로 쓴다. */}
                    <img src={uiPengSearch} alt="" draggable={false} className="next-peng hk-m-tongtong" />
                    {/* 🖼 [창업자 확정 2026-08-26] **패드에서만** 그 요리 «표지»를 왼쪽에 세운다.
                        📮 창업자 = *"D에서 표지랑 펭펭 알약까지 들어가니까 정신없어보여"* →
                           *"오늘 뭐해먹지랑 똑같이 만들되 제목을 아직 안해봤어요를 알약으로"* · *"펭펭은 빼자"*
                        ⭐ 옆 「오늘 뭐 해먹지」엔 표지가 있는데 여기만 없어서 **짝이 안 맞고 휑했다**(패드 가로).
                        ⛔ 폰에선 «안 그린다» — 카드가 좁아 표지가 들어가면 글이 밀린다(CSS 가 숨긴다).
                        ⛔⛔ 크기를 클래스로만 주면 «안 먹는다» —  이  를 **인라인**으로 넣는다.
                           그래서 인라인이 CSS 변수를 읽게 한다( 가 쓰는 방법과 «같은 처방»). */}
                    {it.recipe && (
                      /* ⛔⛔ 이름표(`next-thumb`)가 «반드시» 있어야 한다 — 없으면 CSS 가 표지를 못 집는다.
                         🔢 2026-08-26 실측 = `:first-child` 로 집었더니 **`display:none` 인 펭펭이 첫 자식**이라
                            펭펭이 잡히고 표지는 흐름대로 1행에 들어가 라벨→제목 틈이 **70px** 로 벌어졌다.
                         📌 `display:none` 은 «자식 자리»를 없애지 않는다. 위치로 집지 말고 «이름»으로 집는다. */
                      <span className="next-thumb">
                        <Thumb recipe={it.recipe} radius={16} showDecor
                          style={{ width: '100%', height: '100%', display: 'block' }} />
                      </span>
                    )}
                    <div className="next-head">
                      <span className="next-label">{it.라벨}</span>
                    </div>
                    <div className="next-title">{it.제목}</div>
                    {/* 📌 창업자 확정 = 안내가 «위», 단추가 «아래» (*"안내는 젤 위에 그 아래 한줄남기기"*) */}
                    <div className="next-reason">{it.이유}</div>
                    {it.보기 && <div className="next-eg">{it.보기}</div>}
                  </button>
                  {it.단추 && (
                    <button className="next-cta press" onClick={() => setOneLine(it.entry)}>{it.단추}</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 오늘 뭐 해먹지?
              ⛔ 「다음에 뭐 할까」가 이 카드를 «대신 쓰는» 안(㉮)은 창업자가 접었다 — 그대로 둔다.
                 실물로 찍어 보니 ⑴이 카드가 잡아먹혀 「오늘의 추천」을 잃고
                 ⑵누를 단추가 안 보이고 ⑶베이지 카드 셋 중 하나가 되어 그냥 묻혔다. */}
          {todayPick && (
            <div className="today-card" data-coach="today">
              <button className="today-main press" onClick={() => open(todayPick.id)}>
                {/* ⛔⛔ 크기를 클래스로만 주면 «안 먹는다» — `Thumb` 이 `width: 100%` 를 **인라인**으로 넣기 때문.
                    2026-08-10 에 이걸로 카드가 통째로 깨졌다(썸네일이 전폭 · 글자가 세로로 쌓임).
                    ⭐ 그래서 인라인이 **CSS 변수를 읽게** 한다 — 넓은 화면에선 `.today-card` 가 그 변수만 바꾼다. */}
                <Thumb recipe={todayPick} style={{ width: 'var(--today-thumb)', height: 'var(--today-thumb)', flex: '0 0 auto' }} radius={16} showDecor />
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
        </div>

        {/* 🗓 이번 주 레시피 — 「왜 이게 올라왔는지」를 말해주는 자리.
            창업자 2026-08-03: *"뭐라도 안내를 하고 올려야지 않나? 올린 이유를?
            제철이라 ○○이 맛있다던가 매주마다 레시피 하나씩 올리는데 이번주는 이거라던가."*
            → 8/2 에 레시피 12편을 «안내 없이» 부어서 유저 눈엔 그냥 목록이 늘어난 것이었다.
            ⛔ 재고가 없으면 `weekly` 가 null 이라 이 줄이 통째로 안 그려진다(빈 자리 금지).
            ⛔ 「이번 주」는 **추천이지 잠금이 아니다** — 지난 주 것도 레시피 탭에 그대로 있다. */}
        {/* 📐 **넓은 화면에선 이 줄이 반반으로 갈린다** — 왼쪽은 글, 오른쪽은 요리 셋.
            📮 창업자 2026-08-10 *"이번주 제철은 반반으로 나눠서(지금 한줄을) 왼쪽반은 글자 쪽(글자크기키우기)
               오른쪽반은 이미지넣자. **(윗줄 콩국수랑 같은 위치로)**"*
            ⭐ 「같은 위치」가 핵심이다 — 위 `home-pair` 의 오른쪽 칸(오늘 뭐 해먹지)과 **x 가 딱 맞아야**
               두 줄이 한 판으로 읽힌다. 그래서 `1fr 1fr` ＋ 같은 `gap` 을 쓴다(auto 로 두면 카드가 오른쪽 끝에 몰린다). */}
        {/* 🍳 ＋ 우리집레시피 = 창업자가 실제로 해먹는 것 (창업자 확정 2026-08-11 · 안 ⒜ 별도 줄)
            📐 창업자 *"폰에서는 2줄이 필요하지만 패드에서는 1줄에 다 들어가잖아"*
               · 폰   = 위아래 두 박스   · 패드 = 좌우 나란히 (`.week-pair.two`)
            ⛔ `two` 는 «둘 다 있을 때만» 붙는다 — 하나뿐이면 지금 모양(박스 안이 좌우로) 그대로다. */}
        {(weekly || homemade) && (
          <div className={`week-pair${weekly && homemade ? ' two' : ''}`}>
            {weekly && <WeekBox w={weekly} 기본="이번 주 제철" open={open} />}
            {homemade && <WeekBox w={homemade} 기본="우리집레시피" open={open} />}
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
                  {/* 🍱 [2026-08-23 창업자] *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음.
                      조금만더크게수정."* — 맞다. 판은 넓은데 그림만 `56%` 라 가운데가 휑했다.
                      ⛔ 카드 폭을 키우지 않는다 — 한 줄에 세 칸 보이는 게 이 줄의 값어치다.
                      ✅ 판 «안»에서 그림만 키운다(56% → 70%). 이름표 자리도 그대로다. */}
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2.5rem" iconSize="70%" showDecor />
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
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 16.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Icon name="bookmark" size={17} color="var(--brown)" stroke={2.2} />
          내 레시피 전체 보기
        </button>
        <div style={{ height: 12 }} />
      </div>

      {preview && <PreviewSheet onClose={() => setPreview(false)} />}
      {/* 🎉 새로 열린 날 딱 한 번. 「구경하기」는 소식 시트를 연다 — 팝업이 목적지가 아니다 */}
      {newsPop && (
        <NewsPopup
          news={news}
          onClose={closeNews}
          onOpenNews={() => { closeNews(); setPreview(true) }}
        />
      )}

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

      {/* ✍️ 「한 줄 남기기」 — 홈에서 «바로» 쓴다. 상세로 안 보낸다.
          ⭐ 쓰고 닫으면 `note` 가 차서 위 카드가 «저절로» 사라진다(지우는 코드가 없다).
          ⛔ 처음엔 기존 `DiaryEntrySheet`(요리 기록 전체)를 불렀는데 창업자가 잡았다 —
             *"이거 사진추가가 의미가 있어? 그리고 글쓰는 창도 불편하고 안예뻤어.."*
             「한 줄」 쓰러 왔는데 별점·사진 칸이 더 컸다. → 목적이 하나면 화면도 하나(`OneLineSheet`). */}
      {oneLine && <OneLineSheet entry={oneLine} onClose={() => setOneLine(null)} />}

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
