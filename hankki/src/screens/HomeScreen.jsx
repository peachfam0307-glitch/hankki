import { useMemo, useState, useRef } from 'react'
import { COACH } from '../coach'
import { todayKST } from '../today'
import { nextUpList } from '../nextUp'
import OneLineSheet from '../components/OneLineSheet'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import { openExternal } from '../utils'
import { INSTAGRAM_URL } from '../version'
import { 인스타로감 } from '../stats'   // 🚪 insta_go — 홈 인스타 칸을 누른 사람
import { SNS인가, SNS표 } from '../embed'
import Thumb from '../components/Thumb'
import { hasFrameDecor } from '../components/Stickers'
import FoodIcon from '../components/FoodIcon'
import Buddy from '../components/Buddies'
import TabTips from '../components/TabTips'
import TabTalk from '../components/TabTalk'
import PreviewSheet from '../components/PreviewSheet'
import NewsPopup, { needsNewsPopup, markNewsSeen, isNewsUnread } from '../components/NewsPopup'
import LoginNudge, { needsLoginNudge, markLoginNudgeSeen } from '../components/LoginNudge'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ConfirmSheet from '../components/ConfirmSheet'

// 🍽🍽 **홈 「자주 해먹는」 칸의 음식 그림 크기** (창업자 확정 2026-09-01 = 갈래 「라」)
//   · 프레임(접시·액자)을 «얹은» 레시피 → **56%** = 레꾸 캔버스와 «같은 값»이라 접시 안에 그대로 담긴다
//   · 그 밖 → **70%** = 2026-08-23 창업자 지시(*"조금만더크게수정"*) 그대로 살아 있다
//   ⭐ 두 지시가 부딪치는 건 **프레임을 쓸 때뿐**이다 → 그때만 양보한다. 어느 쪽도 안 되돌린다.
//   ⛔ 이 판정은 `Stickers.jsx` 에 한 곳으로 둔다 — 홈에 이 칸이 «둘»이라 여기 적으면 갈라진다.
const 홈그림크기 = (r) => (hasFrameDecor(r) ? '56%' : '70%')
// 🐻 코치 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지 규칙)
import uiHandPoint from '../assets/ui/hand_point.png'
// 🐻 엄지척·박수 = **물결 정본**(창업자 2026-08-14 제공 · `…-08-14/낱개/gt_01`·`gt_c01`)
//    ⛔ 옛 `ui/gom_thumbsup`·`ui/gom_clap` 은 «매끈 곰»이었다 — 창업자 판정 *"2.4번만 옛날곰이고 나머지는 물결곰이야."*
//    ✅ `gom_shop`·`gom_heart` 는 **물결이 맞아서 그대로 둔다**(같은 판정).
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png'
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
import { needsOnboarding } from '../components/Onboarding'
import { backupNudgeStep, dismissBackupNudge, askOpenBackup, myRecipeCount, myDiaryCount, needsCloudHome, markCloudHomeSeen, askOpenCloud, 클라우드보임 } from '../nudges'
import { 로그인해뒀나 } from '../cloud'
import { weeklyNow, homemadeNow, snsNow } from '../data/weekly'
// 🌕 특집 — 날짜가 열고 «닫는다». 철이 지나면 스스로 사라진다(`data/specials.js`)
import { nowSpecial, specialRecipes } from '../data/specials.js'
import { whatsNew } from '../data/whatsnew'
import { pantryScore, pantryUrgent, 남은날수, 기한말 } from '../pantryMatch'
import SeasonDecor from '../components/SeasonDecor.jsx'
// 🇰🇷 명절엔 홈의 «우리 애» 둘도 한복을 입는다 — 📮창업자 2026-09-09 *"쟤들만 한복아니니까 이상해서.."*
import { 홈컷, 줄장식 } from '../data/seasonDecor.js'
import { useSeasonCuts } from '../season/useSeasonCuts.js'

// 🗓🍳 「이번 주」 박스 — 제철 줄과 우리집레시피 줄이 «똑같이» 생겼다.
//   ⛔ 마크업을 두 번 적지 않는다 — 그러면 한쪽만 고치는 사고가 난다(2026-08-11 신설).
//   ⚠️ HomeScreen «밖»에 둔다. 안에 정의하면 렌더마다 새 컴포넌트가 되어 리마운트가 일어난다.
// 📅 [창업자 2026-09-07 00:05] *"홈화면에 이번주제철 옆에 월요일 업뎃을 표시할까??"* · *"sns는 수요일 업뎃인거"* · *"월 배지를 옆에 달아도 좋고"*
//    → 키커 옆 작은 동그라미 「월」·「수」. 🔢 실측 = 제철 19주·우리집 25주 `from` 전부 월요일 · SNS 20편 전부 수요일(weekly.js·basics.js).
//    ⛔ 요일을 코드에서 «세지» 않는다 — 데이터가 그 요일에 열리게 우리가 맞춰 두는 것이라(check-weekly 가 월요일을 지킨다) 글자로 준다.
// 🌕 `가로` = 특집 줄처럼 «밀어서» 보는 판 (2026-09-13 · 창업자 = *"스크롤로 쭉 볼수있게"*)
//    ⛔ 새 부품을 만들지 않는다 — 이 상자를 그대로 쓰고 줄 클래스만 바꾼다
//       (「같은 것이 화면마다 다르게 생기면 유저는 다른 것으로 읽는다」 · 2026-09-04 창업자 지적과 같은 결).
function WeekBox({ w, 기본, open, 요일, 줄컷, 가로 }) {
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
          {요일 && <span className="weekly-day" aria-label={`${요일}요일마다 새로 와요`}>{요일}</span>}
          {/* 🧒🧒 [2026-09-09 창업자 확정] 명절 듀오는 «이 줄에 박는다» — 화면 고정이 아니다.
              📮 *"월요일 옆에 있자나 애들이!!!"* ＋ *"고정해줘 스크롤하면 내려가는거이상해"*
              ⛔ 아침엔 «화면 고정»으로 만들었다(*"홈을 내리면 안따라와"*). 그때는 「보름달」 얘기였고,
                 듀오는 «글에 붙어야» 하는 것이었다 — 알약 옆이 제자리라 카드가 굴러가면 같이 가야 한다.
              ⭐ 줄 높이는 «안 늘어난다» — `position: absolute` 로 줄 밖으로 나와 앉는다. */}
          {줄컷 && (
            <span aria-hidden style={{ position: 'relative', width: 0, height: 0, flex: '0 0 auto' }}>
              <img src={줄컷} alt="" draggable={false}
                // ⛔ maxWidth:'none' 이 «반드시» 있어야 한다 — 전역 「img{max-width:100%}」 가
                //    기준을 «폭 0 인 껍데기»로 잡아 그림을 0×0 으로 만든다(2026-09-09 실제로 그랬다).
                // 📮 [창업자 2026-09-10] 「월요일 옆에 곰돌이도 크기좀 키워야해」 — 62 → 80px.
                //    ⭐ 껍데기가 폭·높이 0 이라 줄 높이는 한 픽셀도 안 늘어난다(위로만 더 나온다).
                //    🔢 높이 = 300/360 × 80 = 66.7 → 위로 33 나가고 아래로 33.7 = 월 알약(26)과 가운데가 맞는다.
                style={{ position: 'absolute', left: 4, top: -33, width: 80, maxWidth: 'none', opacity: 0.9, pointerEvents: 'none' }} />
            </span>
          )}
        </div>
        <div className="weekly-title">{w.title}</div>
        <div className="t-sub weekly-why">{w.why}</div>
      </div>
      {/* 🗓 `weekly-row` = 밀지 않고 한 화면에 딱 맞는 격자 (2026-08-03 오징어 상자 사고 → 잘림 0) */}
      <div className={`weekly-row${가로 ? ' rail' : ''}`}>
        {w.items.map((r) => (
          <button key={r.id} className="mini-card press" onClick={() => open(r.id)}>
            {/* 🍱 [2026-08-23 창업자] *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음.
                조금만더크게수정."* — 맞다. 판은 넓은데 그림만 `56%` 라 가운데가 휑했다.
                ⛔ 카드 폭을 키우지 않는다 — 한 줄에 세 칸 보이는 게 이 줄의 값어치다.
                ✅ 판 «안»에서 그림만 키운다(56% → 70%). 이름표 자리도 그대로다.
                🍽 [2026-09-01 창업자 = 갈래 「라」] 단 **프레임을 얹은 레시피는 56%** — `홈그림크기()` 참조 */}
            {/* 📺📷 [2026-09-04 창업자] *"여기에도 안내칩넣어야해 링크? 유튜브? 작은 아이콘상자"*
                → 처음에 오른쪽 위 동그란 배지로 만들었는데 창업자가 바로 짚었다 = *"왼쪽에 달지 않았어?? (레시피에는??)"*
                ⭐⭐ 맞다 — **레시피 탭이 이미 왼쪽 위에 같은 표를 달고 있다**(`MyRecipesScreen.jsx` 869줄).
                   자리·모양·색을 «그대로» 따라간다. 같은 것이 화면마다 다르게 생기면 유저는 다른 것으로 읽는다
                   (CLAUDE.md 「같은 기능은 탭이 달라도 같은 이름」과 같은 뜻).
                🔖 표는 «둘» = 유튜브 ▶(붉은색) · 그 밖의 SNS 🔗(갈색) — 잣대도 레시피 탭과 같은 자(`영상인가`).
                ⛔ 목록을 손으로 적지 않는다 — `sourceUrl` 을 «읽어서» 가른다.
                   그래서 SNS 상자에만 저절로 붙고, 제철·우리집 상자엔 `sourceUrl` 이 없어 안 붙는다. */}
            <div style={{ position: 'relative' }}>
              <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2.5rem" iconSize={홈그림크기(r)} showDecor />
              {SNS인가(r) && (
                <span
                  aria-hidden="true"
                  data-sns={SNS표(r).뜻}
                  style={{
                    position: 'absolute', left: 5, top: 5, pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20,
                    borderRadius: 6, background: 'rgba(255,255,255,.92)',
                    color: SNS표(r).color,
                  }}
                >
                  <Icon name={SNS표(r).icon} size={14} />
                </span>
              )}
            </div>
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
  // 🚫🚫 [창업자 확정 2026-09-10] *"코치마크도 좀 줄일까?? … 최소화해서"* — **여섯 → 둘.**
  //    🔢 2026-09-10 실측(첫사람 캡처판) = 앱을 처음 켠 사람이 홈에서만 **여섯 번**을 눌러야
  //       비로소 아래 탭을 만질 수 있었다(코치는 화면 «전체»를 덮는다).
  //    ⭐⭐ 뺀 넷은 **탭을 가리키는 것**이었는데, **그 탭에 가면 그 화면 코치가 «또» 뜬다** — 겹쳤다.
  //       (일기·장보기·레꾸자랑 모두 자기 화면 코치가 따로 있다 · 2026-09-10 실측)
  //    ✅ 남긴 둘은 «이 화면에서 지금 할 수 있는 것»이다 — 겹치는 안내가 없다.
  //    ⛔ 열쇠(COACH.home)를 «올리지 않는다** — 올리면 이미 본 사람에게 또 뜬다. 줄이는 판이라 그럴 이유가 없다.
  //    📌 그래서 「기능이 숨어 있어 모른다」(2026-07-17 창업자 딸이 낸 문제)는 여전히 각 화면 코치가 답한다.
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

  // ☁️ 클라우드 한 줄 — «이미 쓰고 있던 사람»이 클라우드를 만나는 유일한 자리.
  //   📮 창업자 2026-08-21 = *"지금쓰는사람들은 로그인 안해놓으면 레시피 잃을수도 있는데.
  //      백업하는지도 모르고 폰바꿀수있어"* · *"테스터들한테도 더 늦기전에 선택권을 주는게 맞다고 봐"*
  //   ⛔ 첫 화면(CloudGate)은 «새로 깐 사람»만 본다 — 이미 쓰던 사람은 소개를 이미 지나갔다.
  //   ⚠️ 「내 것」이 하나라도 있을 때만 — 갓 깐 사람에게 권하면 아직 «잃을 게» 없다(백업 줄과 같은 규칙).
  //   ⭐ 로그인 여부는 «작은 표식»으로 본다 — 진짜로 물으면 파이어베이스 167KB 를 첫 화면에서 받는다.
  //   🔀 ＋ 공개 스위치(`클라우드보임`) — 켜는 날까지 창업자 폰에서만(근거 = `nudges.js` 머리주석)
  const [cloudRow, setCloudRow] = useState(() => 클라우드보임() && needsCloudHome() && !로그인해뒀나() && myRecipeCount(recipes) >= 1)

  // 🗓 이번 주 레시피 — 달력이 여는 줄. ⛔재고가 없으면 `null` 이라 **줄을 아예 안 그린다**
  //    (빈 「이번 주」 자리를 남기지 않는다 · `LAB_*_URL` 이 비면 그 칸을 안 그리는 것과 같은 방식).
  // 🔢 [창업자 확정 2026-09-06] 홈 상자엔 **2편만** (*"제철은 다음주부터 2개씩"* · *"이번주 제철도 2개편으로 보기에 해줘"*)
  //   🔢 실측 = 폰 한 줄 2칸 → 3편이면 아래 한 칸이 빈다(SNS·우리집이 2편인 것과 같은 이유 · weekly.js snsNow 주석).
  //   ⭐ 여기(홈)에서만 자른다 — `weeklyNow` 자체를 자르면 장보기(ShopScreen 의 weeklyPicks)가 3편째 재료를 잃는다.
  //   ⭐ 3편째는 «사라지지 않는다» — 레시피 탭에 날짜대로 그대로 열린다.
  const weekly = useMemo(() => { const w = weeklyNow(recipes); return w && { ...w, items: w.items.slice(0, 2) } }, [recipes])
  // 🍳 우리집레시피 — 창업자가 실제로 해먹는 것. 제철과 «별개» 줄이다(창업자 확정 2026-08-11, 안 ⒜).
  //    ⛔ 재고가 없으면 `null` 이라 박스를 아예 안 그린다(제철 줄과 같은 규칙).
  const homemade = useMemo(() => homemadeNow(recipes), [recipes])
  // 🌕 특집 줄 — ⛔실릴 편이 «없으면» 아예 안 그린다(빈 줄이 뜨면 죽은 자리가 된다).
  //    ⭐ 판정은 `specials.js` 한 곳에서만 한다 — 여기서 날짜를 또 세지 않는다.
  const 특집 = useMemo(() => {
    const s = nowSpecial()
    if (!s) return null
    const items = specialRecipes(recipes)
    return items.length ? { ...s, items } : null
  }, [recipes])
  // 📺 SNS 요리 — 유튜브·인스타에서 보고 우리 말로 정리한 편들 (창업자 확정 2026-09-03).
  //    ⛔ 손으로 적은 목록이 없다 — `source: 'hankki'` ＋ `sourceUrl` 로 «직접» 고른다(`weekly.js` snsNow).
  //    ⛔ 재고가 없으면 `null` 이라 박스를 아예 안 그린다(위 둘과 같은 규칙).
  const sns = useMemo(() => snsNow(recipes), [recipes])

  // 📣 소식 한 줄 — ⛔손으로 적지 않는다. 날짜 게이트와 «같은 데이터»를 세어 만든다.
  //    새로 열린 게 있으면 그걸 먼저 말하고, 없으면 다음에 열릴 것을, 그것도 없으면 예고 목록을 말한다.
  const news = useMemo(() => whatsNew(), [])
  const newsLine = useMemo(() => {
    // ⛔ [2026-08-29] `openedAlert` = **장바구니가 빠진 목록**(창업자 *"대신 아래 나중에"*).
    //    장바구니는 «주마다» 열려서 이 줄에 넣으면 홈이 늘 장바구니 얘기만 한다.
    //    소식 페이지를 열면 맨 아래에 있다 — 거기서 보면 된다.
    const o = news.openedAlert
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
  //    🚫🚫 [창업자 확정 2026-09-10] **레시피가 하나도 없는 사람에겐 안 띄운다.**
  //       🔢 2026-09-10 실측(첫사람 캡처판) = 앱을 깐 첫날, 아직 레시피 0개인 사람 앞에
  //          「꾸미기에 가을이 왔어요 · 스티커 24종」 시트가 화면을 통째로 덮었다.
  //       ⭐ **꾸밀 레시피가 없는 사람에게 꾸미기 소식은 아직 쓸 데가 없다.**
  //       ⭐ 그리고 이 팝업은 «꺼도 아무것도 안 잃는다» — 소식 «페이지»는 그대로 있고
  //          홈 카드로 언제든 열린다(NewsPopup 머리말에 적어둔 그대로다).
  //       ⛔ 「본 것으로 친다」를 하지 «않는다» — 레시피가 생기면 그때 정상적으로 한 번 뜬다.
  const [newsPop, setNewsPop] = useState(
    () => needsNewsPopup(news) && !needsOnboarding() && !needsCoach(HOME_COACH_KEY) && myN >= 1
  )
  // 🔵 「새로」 뱃지 — ✅창업자 확정 2026-08-31 (시안 넷 중 **㉣ 둘 다**)
  //   📮 창업자 = *"한끼소식에 알약은 색을 다르게 하거나, 새로 올라온게 있으면 표시가 있으면 좋겠어."* → 판정 *"ㄹ하자"*
  //   ⭐ **읽으면 꺼지고, 새것이 오면 다시 뜬다** — 판정은 `isNewsUnread`(팝업과 같은 열쇠) 한 곳에서.
  //   ⛔ `useState` 로 «한 번만» 읽는다 — 그리는 중에 localStorage 를 매번 읽으면
  //      표시를 하고도 화면이 안 바뀐다(리액트는 저장소를 안 본다).
  // 🇰🇷 명절이면 그림만 한복으로 바꿔치기한다 — 자리·크기·움직임은 손대지 않는다.
  //    ⛔ 철이 아니거나 그 철에 한복 컷이 없으면 «원래 컷» 그대로 (없는 걸 억지로 끼우지 않는다).
  const { 철: 명절, 컷: 명절컷 } = useSeasonCuts()
  const 한복 = (자리, 원래) => (명절컷 && 명절컷[홈컷[명절]?.[자리]]) || 원래

  const [unread, setUnread] = useState(() => isNewsUnread(news))
  const 소식봤음 = () => { markNewsSeen(news); setUnread(false) }
  // ⚠️ 어떻게 닫든 «봤음»으로 친다 — 안 그러면 뒤로가기로 닫은 사람에게 매번 뜬다.
  const closeNews = () => { 소식봤음(); setNewsPop(false) }

  // ☁️📣 로그인 안내 팝업 — «이미 쓰던 사람 · 로그인 안 함 · 내 레시피 1편↑»에게 딱 한 번 (창업자 2026-09-06 ㄱㄱ).
  //    ⛔ 다른 팝업(소식·온보딩·코치마크)이 뜨는 날은 «안 띄운다» — 겹치면 둘 다 못 읽는다. 다음에 켤 때 뜬다.
  //    ⛔ 홈 한 줄(cloudRow)과 같은 잣대(클라우드보임·!로그인해뒀나) ＋ «잃을 게 있나» = 내 레시피 **또는** 내 일기 1편↑
  //       (창업자 2026-09-06 *"레시피나 일기가 사라진다고 해야하려나"* → *"그렇게 하자"* — 일기만 쓰는 사람도 폰 바꾸면 똑같이 잃는다).
  //    ⭐ 뜨는 날은 홈 한 줄을 «같이» 그리지 않는다 — 같은 말을 두 번 하면 그게 재촉이다.
  // 🔐🔐 **[창업자 확정 2026-09-08 00:14] 「0편인 사람한테도 뜨게 하자」**
  //   ⛔⛔ 그 전엔 «레시피 또는 일기 1편 이상»이라야 떴다 — 그래서 **0편인 사람에겐 아예 안 떴다.**
  //      ⭐ 그런데 **0편이 제일 위험하다** — 잃을 게 없어 보이지만 «앞으로 쌓을 것»을 통째로 잃는다.
  //   ⭐ 대상이 좁아졌다 = v12.73 부터 새로 깐 사람은 로그인하고 시작한다(CloudGate).
  //      그러니 여기 걸리는 0편 비로그인은 **이미 쓰던 사람** 또는 **로그인이 안 돼 탈출구로 온 사람**뿐이다.
  //   ⛔ 문구는 `LoginNudge` 가 0편 갈래를 «따로» 그린다 — 안 그러면 「내가 저장한 이 사라져요」로 깨진다.
  const [loginPop, setLoginPop] = useState(
    () => 클라우드보임() && !로그인해뒀나()
      && needsLoginNudge() && !needsNewsPopup(news) && !needsOnboarding() && !needsCoach(HOME_COACH_KEY)
  )
  const closeLoginPop = () => { markLoginNudgeSeen(); setLoginPop(false) }

  // 오늘의 추천 — 냉장고 재료로 만들 수 있는 요리 우선, 없으면 자주 해먹는/전체
  // ⭐ 맞추기·점수는 `src/pantryMatch.js` **한 곳**에서 한다 —
  //    「냉장고 파먹기」(`PantryView`)와 «같은 판단»이라야 두 화면이 딴소리를 안 한다.
  //    (2026-08-10 창업자 *"오늘뭐해먹지는 뭘 기반으로 추천해주는거야?"* → 코드를 읽다 두 곳이
  //     따로 적혀 있고 둘 다 「글자 포함」이라 「무」가 «풀무원·단무지»에 걸리는 걸 찾았다)
  // ⛔⛔ **[2026-09-11 전수조사로 찾았다] 홈이 유통기한을 «아예 안 보고» 있었다.**
  //   🔢 실측 = 같은 냉장고(두부 1일 지남)를 두고
  //      🧊 냉장고 파먹기 = 팟타이·돼지고기 김치찌개·된장찌개 (급한 두부부터)
  //      🏠 홈           = 팟타이·떡국·수제 떡갈비        (유통기한을 안 본다)
  //      ＋ 5일 지난 두부로 재니 **홈 13편 / 냉장고 10편** — 홈은 «상한 것»도 세고 있었다.
  //   📌 9/10 에 창업자가 정한 「임박 1순위」와 9/11 「이틀 지나면 뺀다」가 **냉장고에만** 들어갔다.
  //      이 파일 머리말에 *"두 화면이 딴소리를 안 한다"* 고 적어놓고 **딴소리를 하고 있었다.**
  //   ✅ `남은날` 을 넘겨서 둘을 맞춘다 — 셈은 `pantryMatch.js` 한 곳 그대로다.
  const 남은날 = (p) => 남은날수(p?.expiry)
  const today = useMemo(() => {
    const pool = recipes.filter((r) => r.status !== 'unsorted')
    const withPantry = pool
      .map((r) => ({ r, n: pantryScore(r, pantry, 남은날) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    if (withPantry.length) return { list: withPantry.map((x) => x.r), fromFridge: true }
    // 🍳🍳 **만든 것 ＋ 나머지를 «섞어서» 돌린다** (창업자 확정 2026-08-28 = *"섞어서 돌리자"*)
    //
    // ⛔⛔ **옛 코드 = `cooked.length ? cooked : pool` — 만든 게 하나라도 있으면 «만든 것만» 돌았다.**
    //    🔢 실측(`_probe-오늘추천풀-0828`) = 세 편만 만든 사람은 **21일 내내 3가지**만 봤다
    //       (국물 떡볶이 · 잡채 · 김치볶음밥 · 국물 떡볶이 …). 갓 깐 사람은 19가지를 보는데.
    //    📌 **거꾸로다** — 앱을 쓸수록 추천이 «넓어지는 게 아니라 좁아졌다».
    //       세 개 만들면 평생 그 셋만 돈다. 새 레시피를 영영 안 만난다.
    //    ⚠️ 어제까진 늘 «같은 하나»만 떠서(`useState(0)`) 이게 안 보였다.
    //       날짜로 돌리기 시작하니 드러났다 — **고친 뒤에야 보이는 종류의 흠**이다.
    //
    // ⭐ 원래 뜻(「자주 해먹는 것 우선」)은 살린다 — **우선이지 «전부»가 아니다.**
    //    만든 것을 나머지 사이사이에 끼워 **대략 두 배 자주** 오게 하고, 나머지도 전부 한 바퀴 돈다.
    // ⛔ 그냥 앞에 이어 붙이면(`[...만든것, ...나머지]`) 한 바퀴에 «한 번씩»이라 자주 오지 않는다.
    // ⛔⛔ **「사이사이 끼워 넣기」도 안 먹혔다 — 실측 0.7배(오히려 «덜» 왔다).**
    //    🔢 뿌리 = **목록 길이가 날마다 바뀐다.** 매주 월요일에 새 레시피가 열려 57 → 90+ 로 늘어나는데,
    //       `pick % 목록.length` 는 길이가 바뀌면 «자리»가 통째로 튄다. 끼워 둔 순서가 그대로 흩어진다.
    //    ✅ 그래서 «섞은 목록의 자리»가 아니라 **날짜가 «갈래»를 고르게** 한다(아래 `todayPick`).
    //       갈래를 고르는 건 개수만 보므로 목록이 길어져도 비율이 안 흔들린다.
    const 만든것 = pool.filter((r) => (r.cooked || 0) > 0)
    const 나머지 = pool.filter((r) => !((r.cooked || 0) > 0))
    return { list: 나머지.length ? 나머지 : pool, 만든것, fromFridge: false }
  }, [recipes, pantry])

  // 🍚 오늘 뜰 한 편 — **날짜가 갈래를 고르고, 그 갈래 안에서 또 날짜가 고른다.**
  //    ⭐ 「만든 것」 갈래에 걸리는 날 = 전체 대비 **두 배쯤**(그래서 `2 *`).
  //       예) 만든 것 3편 · 전체 57편 → 열흘에 한 번 만들었던 것이 온다(3편이 60일에 두 번씩).
  //    ⛔ 최소 2 로 막는다 — 만든 게 많아져도 «매일» 만든 것만 뜨지는 않게.
  const todayPick = useMemo(() => {
    const { list, 만든것 = [] } = today
    if (!list.length && !만든것.length) return null
    const 몫 = 만든것.length && list.length
      ? Math.max(2, Math.round((list.length + 만든것.length) / (2 * 만든것.length)))
      : 0
    if (몫 && pick % 몫 === 0) return 만든것[Math.floor(pick / 몫) % 만든것.length]
    return list.length ? list[pick % list.length] : 만든것[pick % 만든것.length]
  }, [today, pick])

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
      {/* 🎑🎃 명절 장식 — 철이 아니면 아무것도 안 그리고 그림도 «안 받는다»(useSeasonCuts).
          ⛔ 반드시 «맨 앞»에 둔다 — 담는 칸의 자리가 통 맨 위여야 창업자가 놓은 y 가 맞는다. */}
      <SeasonDecor />
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* 곰 자리에 내 아바타를 넣었다(창업자 2026-07-29). 인사하는 곰은 '레시피' 탭으로 옮김.
              오른쪽에 아바타·톱니가 나란히 있어 눌러야 할 게 둘로 보이던 것도 정리된다. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* ♿ «손가락 닿는 자리»는 44px (2026-08-03 접근성).
                ⚠️ `.tap-ok` 클래스로 했을 땐 브라우저가 min-width 를 `auto` 로 계산해 안 먹었다
                   (CSS 는 분명히 들어가 있는데 — 이유는 못 밝혔다). 인라인은 확실히 먹는다.
                🏠💬 [✅창업자 확정 2026-08-30 = 시안 «B»] 그림을 **38 → 43px**.
                📮 창업자 = *"홈 프로필 사진이 작아서 그런지 말풍선이 홈만 아래로 내려가 보여.."* → *"b"*
                🔢 실측 = 아바타 38px(하단 55) ↔ 레시피 꼬르곰 43px(하단 57) · 말풍선 top 은 둘 다 64
                   → 홈만 **9px**, 레시피는 6.5px 떨어졌다. ＋아바타는 «원»이라 꼬리가 닿는 왼쪽에서
                     곡선만큼 더 파여 실제보다 멀어 보인다.
                ⭐⭐ 말풍선 값(`--tab-talk` margin)은 **다섯 탭이 하나를 쓴다** — 홈만 캐릭터가 작아서 벌어진 것이다.
                   그래서 «말풍선을 홈에서만 더 올리는» 길(시안 C)은 접었다. 값이 갈리면 반드시 어긋난다.
                ✅ 43px 로 맞추니 말풍선까지 **6.5px = 레시피와 같아졌다.** 말풍선은 한 줄도 안 건드렸다.
                ⛔ 43 을 넘기지 말 것 — 손가락 칸이 44px 이라 여백이 0.5px 밖에 안 남는다. */}
            <button className="press" onClick={() => nav.go('profile')} aria-label="프로필"
              style={{ display: 'flex', flex: '0 0 auto', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Avatar name={profile.name} avatar={profile.avatar} size={43} />
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
        {/* ☁️ 클라우드 한 줄 — 백업 줄과 «같은 자리»를 쓴다(같은 걱정을 푸는 줄이라서).
            ⛔ 둘이 같이 뜨면 시끄러우니 **클라우드가 이긴다** — 백업보다 나은 답이다.
            ⛔ 벽이 아니다. 닫으면 다시 안 뜨고, 나중엔 설정에서 만난다. */}
        {cloudRow && !loginPop && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px 11px 14px', borderRadius: 14, background: 'var(--cream)' }}>
            <Icon name="cloud" size={18} color="var(--brown)" stroke={1.9} />
            <button
              className="press"
              onClick={() => { markCloudHomeSeen(); askOpenCloud(); setCloudRow(false); nav.go('profile') }}
              style={{ flex: 1, textAlign: 'left', minWidth: 0 }}
            >
              {/* ⛔⛔ 「계정에 매어둘까요?」로 두지 말 것 — 창업자 2026-08-21 = *"매어둘까요 그런거말고"*.
                  📌 그때 첫 화면(CloudGate)만 고치고 «이 줄과 설정 카드»를 안 고쳐서 같은 말이 살아남았다.
                     같은 기능은 화면이 달라도 같은 말로(v11.02 「책갈피」가 일곱 곳이었던 것과 같은 뿌리).
                  ⭐ 첫 화면의 안내 줄과 «한 글자도 다르지 않게» 맞춘다. */}
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>로그인하면 새 폰에서도 이어서 써요</div>
              <div className="t-sub" style={{ fontSize: 11.5, marginTop: 1 }}>지금은 레시피·일기가 이 폰에만 있어요</div>
            </button>
            <button className="press" onClick={() => { markCloudHomeSeen(); setCloudRow(false) }} aria-label="닫기" style={{ flex: '0 0 auto', padding: 6 }}>
              <Icon name="x" size={16} color="var(--sand)" />
            </button>
          </div>
        )}

        {!cloudRow && bkStep > 0 && (
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
          {/* 📣📷 [창업자 2026-09-21] 「한끼 소식」 반 · 「인스타그램」 반 — *"한끼소식을 반으로 나눠서 반은 한끼소식 반은 인스타그램"*
              ＋ *"높이를 지금보다 좀 더"* ＋ *"꼬르곰 위로 새로 빨간 알약을 올리고 한끼소식을 그 자리에"*
              ⭐ 폭은 58:42 — 반반이면 소식 한 줄(「우리집레시피 4개 새로 열렸어요 외 11건」)이 세 줄로 접힌다(흉내판 실측). 58 이면 두 줄.
              ⛔ 「새로」는 곰 «머리 위»에 — 옆에 두면 제목이 두 줄로 접혀 폭을 다 먹는다.
              📐 패드에선 이 묶음이 전폭(`.home-pair > .news-row`) — 소식이 제일 위라는 확정 순서는 그대로다. */}
          <div className="news-row">
          <button
            className="press news-card"
            onClick={() => { 소식봤음(); setPreview(true) }}
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
            <span className="news-gom-col">
              {/* 🟠 「새로」 — 곰 머리 위. `unread` 를 같이 본다(늘 켜져 있으면 새것을 못 뜻한다 · 아래 옛 주석 그대로) */}
              {news.openedAlert.length > 0 && unread && (
                <span className="news-new" style={{ color: 'var(--surface)', background: 'var(--gift)' }}>새로</span>
              )}
              <img src={한복('소식', uiGomWow)} alt="" draggable={false} className="hk-m-tongtong news-gom"
                style={{ flex: '0 0 auto', display: 'block', objectFit: 'contain',
                  width: 'var(--news-gom, 26px)', height: 'auto' }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* 🔠 크기는 인라인이 아니라 클래스로 — 넓은 화면에서 키우려면 CSS 가 이겨야 한다
                    (인라인은 `!important` 없이는 절대 못 이긴다 · v10.08 에 실제로 당했다) */}
                <span className="news-title">한끼 소식</span>
                {/* ⛔ [2026-08-29] `openedAlert` — 장바구니는 «주마다» 열려서 넣으면 이 뱃지가 늘 켜져 있다.
                    바로 위 주석에 우리가 적어둔 원칙 그대로 = *"늘 떠 있으면 아무도 안 본다."* */}
                {/* 🟠 색 = `--gift` (창업자 확정 2026-08-31 ㉣)
                    ⛔ 그 전엔 `--brown` 이라 **바로 아래 「아직 안 해봤어요」와 판박이**였다
                       (실측 = 둘 다 rgb(88,120,160) ＋ 흰 글자). 알림이 아니라 «이름표»로 읽힌다.
                    ⭐ 새 색을 만든 게 «아니다» — 소식 팝업이 이미 쓰는 선물 색이라 한 벌이 된다.
                       `styles.css:96` = *"앱 포인트가 전부 파랑이라 오렌지 알약 하나만 «유일하게 튄다»"*
                       ＋ 흰 글자 대비 4.84 로 이미 재둔 값이다. ⛔색을 여기 박지 말 것(그 한 줄만 고친다).
                    ⛔ `unread` 를 «같이» 본다 — 없으면 늘 켜져 있어 「새로」가 새것을 못 뜻한다. */}
                {/* 「새로」 알약은 2026-09-21 에 곰 머리 위(`.news-gom-col`)로 옮겼다 — 여기 두면 반 폭에서 제목이 접힌다 */}
              </div>
              <div className="t-sub news-sub">{newsLine}</div>
            </div>
          </button>
          {/* 📷 인스타그램 — 홍보가 다 인스타로 나가서 앱 안에서도 바로 가게(창업자 2026-09-21). 밖으로 나가는 단추라 `openExternal`.
              🚪 insta_go 로 누른 사람을 센다 — 홈 연 사람 대비 몇 %가 누르나로 이 칸을 «살릴지» 정한다. */}
          <button
            className="press insta-card"
            onClick={() => { try { 인스타로감() } catch { /* noop */ } openExternal(INSTAGRAM_URL) }}
            aria-label="한끼 인스타그램 열기"
          >
            {/* 창업자(18:29) = *"인스타그램은 그림아이콘 + 아래 한끼인스타그램"* — 아이콘 위 · 글자 아래 · 가운데 */}
            <Icon name="instagram" size={26} color="var(--brown)" />
            <span className="insta-label">한끼 인스타그램</span>
          </button>
          </div>

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
                    <img src={한복('다음', uiPengSearch)} alt="" draggable={false} className="next-peng hk-m-tongtong" />
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
        {/* 🌕 특집 — 「이번 주 제철」 «위»에 온다. 철이 있는 동안만 뜨는 것이라 제일 먼저 눈에 닿아야 한다.
            📮 창업자 2026-09-13 = *"추석특집을 띄우면 좋지 스크롤로 쭉 볼수있게"*
            ⛔ 편이 없으면 `특집` 이 null 이라 이 줄 자체가 안 그려진다. */}
        {특집 && (
          <div className="week-pair">
            <WeekBox w={{ kicker: 특집.label, title: 특집.sub, why: '', items: 특집.items }} 기본={특집.label} open={open} 가로 />
          </div>
        )}

        {(weekly || homemade) && (
          <div className={`week-pair${weekly && homemade ? ' two' : ''}`}>
            {weekly && <WeekBox w={weekly} 기본="이번 주 제철" open={open} 요일="월" 줄컷={명절컷 && 명절컷[줄장식[명절]]} />}
            {homemade && <WeekBox w={homemade} 기본="우리집레시피" open={open} 요일="월" />}
          </div>
        )}

        {/* 📺 SNS 요리 — 유튜브·인스타에서 «보고» 우리 말로 정리한 편들 (창업자 확정 2026-09-03)
            📮 창업자 = *"홈에 하나 더 만들고 이번주레시피같이 상자를.. 상세레시피는 지금처럼 레시피안에 넣고
               대신 영상칩을 붙이면 좋겠어."*
            ⭐ 위 두 상자와 «똑같은» `WeekBox` 를 쓴다 — 마크업을 두 번 적지 않는다(2026-08-11 규칙).
            ⭐ 상세 화면을 따로 만들지 않는다 — 레시피 탭 안에 그대로 있고 「영상」 칩으로 모아 본다.
            ⛔ 재고가 없으면 `sns` 가 null 이라 이 줄이 통째로 안 그려진다(빈 자리 금지). */}
        {sns && <div className="week-pair"><WeekBox w={sns} 기본="SNS 요리" open={open} 요일="수" /></div>}

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
                      ✅ 판 «안»에서 그림만 키운다(56% → 70%). 이름표 자리도 그대로다.
                      🍽 [2026-09-01 창업자 = 갈래 「라」] 단 **프레임을 얹은 레시피는 56%** — `홈그림크기()` 참조 */}
                  <Thumb recipe={r} ratio="1/1" radius={16} emojiSize="2.5rem" iconSize={홈그림크기(r)} showDecor />
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
      {/* ☁️📣 로그인 안내 — 로그인되면 설정의 클라우드 시트로 보낸다(올리기·가져오기는 거기 몫 · 홈 한 줄과 같은 길) */}
      {loginPop && (
        <LoginNudge
          recipes={myRecipeCount(recipes)}
          diaries={myDiaryCount(diary)}
          onLater={closeLoginPop}
          onLoggedIn={() => { closeLoginPop(); markCloudHomeSeen(); setCloudRow(false); askOpenCloud(); nav.go('profile') }}
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
