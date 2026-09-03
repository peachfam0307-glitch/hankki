import { useState, useRef, useEffect } from 'react'
import { COACH } from '../coach'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import TimerSheet from '../components/TimerSheet'
import DiaryEntrySheet, { Stars, downscale } from '../components/DiaryEntrySheet'
import Portal from '../components/Portal'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import KitchenGuideSheet from '../components/KitchenGuideSheet'
import { shareDecoratedCover, buildCoverPayload } from '../shareCover'
import { warmFontCSS } from '../fontEmbed'
import SendNowSheet from '../components/SendNowSheet'
import { scaleIngredient } from '../scale'
import { FoodIconSheet } from '../components/FoodIconPicker'
import { dateLabel, openExternal as openUrl, ingredientName, fitImage } from '../utils'
import { photoPanStart } from '../photoPan'
import { shouldAskReviewNow } from '../nudges'
import ReviewAskSheet from '../components/ReviewAskSheet'
import { SOURCES } from '../data/seed'
// 🔁 AI 정리 실패 만회(아래 「만회한적」 절) — 잣대는 앱이 쓰는 그 모듈 그대로다(절대원칙 30).
import { tidyRecipe, mergeTidy } from '../tidy'
import { parseRecipeText, 자리표제목 } from '../parseRecipe'
import { picksForIngredients, productLink, productMall, curIcon, isHansalim } from '../data/curation'

import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ShareDrawCard, { RecipeCard, 카드표지로, 카드표지토스트 } from '../components/ShareDrawCard'
// 🐻 UI 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지)
import uiGomHeart from '../assets/ui/gom_heart.png'
// 🐻 엄지척 = **물결 정본**(창업자 2026-08-14 · `gt_01`). 옛 `ui/gom_thumbsup` 은 매끈 곰이었다.
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png'
import DetailDecor from '../components/DetailDecor'
import MemoNote from '../components/MemoNote'
import { hlColor } from '../components/Stickers'
// 🔖 이름은 «한 곳»에서만 온다(`src/favName.js`)
import { FAV_NAME } from '../favName'
import { 항목묶어 } from '../stepBreak'
import { 열쇠받기, EARN, KEY_NAME, KEY_UNIT } from '../ocr'
// 📺 링크 → 앱 안에서 재생할 수 있는 «공식» 임베드 주소 (유튜브·인스타)
import { embedUrl } from '../embed'

// 🏷 출처(어디서 왔나) — 주소에서 «읽어» 낸다 (창업자 2026-09-03 *"원본링크에-출처도 붙이자"*)
//   ⛔ 손으로 적는 칸을 새로 만들지 않는다 — 손으로 적으면 반드시 낡는다(규칙 12ⓑ).
//   ⛔ 모르는 곳이면 **아무 말도 안 붙인다** — 「기타」·「웹」 같은 말을 지어내지 않는다.
//   ⛔ 유저가 보는 글자다 — 「인스타그램」·「유튜브」로 적는다(영문 약자·상표 변형 금지).
const 출처이름 = (url = '') => {
  const u = String(url)
  if (/(?:^|\/\/|\.)instagram\.com/i.test(u)) return '인스타그램'
  if (/(?:^|\/\/|\.)(?:youtube\.com|youtu\.be)/i.test(u)) return '유튜브'
  if (/(?:^|\/\/|\.)(?:blog\.naver\.com|naver\.me)/i.test(u)) return '네이버 블로그'
  if (/(?:^|\/\/|\.)tiktok\.com/i.test(u)) return '틱톡'
  return ''
}

// 🖍 절 제목 형광펜 — 창업자 2026-08-08 *"재료랑 만드는 법에 형광펜이나 색을 넣어도 좋을 것 같아"*
// ✅ **레몬 확정** — 창업자가 판단을 맡겨서(*"형광펜은 잘모르겠다.. 네가 판단해봐"*) «재서» 골랐다.
//   ⑴ 바탕과의 대비 ΔE **30.2** = 2위 라임(23.1)보다 또렷하고 꼴찌 자몽(13.3)의 2.3배
//   ⑵ 앱 포인트색(더스티블루)과 가장 «멀다»(ΔE 71.9) → 파란 버튼 옆에서 또 다른 버튼처럼 안 읽힌다
//      ⚠️ 바이올렛은 포인트색과 37.9 로 제일 가까워 위험했다
//   ⑶ 형광펜의 원형이 노랑이라 설명 없이 「형광펜」으로 읽힌다
//   ⛔ **내 눈은 「아쿠아가 제일 또렷」이라 봤는데 재보니 반대였다** — 웜 바탕에 쿨 색이라
//      «다르게» 보인 것을 «진하게»로 오해했다(규칙 18: 눈이 본 것을 숫자로 확인한다).
//   📌 다크에선 여섯이 다 비슷해 보인다(screen 이라 채도가 안 산다) → 밝은 두 테마 기준으로 골랐다.
const HL_PICK = 'lemon'
// 절 제목을 형광펜으로 칠한다 — ⭐multiply 라 «글자가 그대로 비친다»(덮는 게 아니라 칠하는 것).
//    앱 꾸미기의 형광펜(`DecorLayer`)과 «같은 문법»을 쓴다. 새로 만든 규칙이 아니다.
const SecTitle = ({ children }) => (
  <div className="h-section"><span className="hl-mark" style={{ '--hl': hlColor(HL_PICK) }}>{children}</span></div>
)

// 첫 방문 코치마크 — 숨어 있는 중요 기능을 반짝이며 알려준다(창업자 딸 아이디어 ⭐)
const COACH_KEY = COACH.detail
const COACH_STEPS = [
  { sel: '[data-coach="edit"]', label: '편집', desc: '재료·만드는 법, 언제든 고칠 수 있어요' },
  { sel: '[data-coach="shop"]', label: '재료 장보기 담기', desc: '필요한 재료를 한 번에 장보기 리스트에 담아요. 담은 건 장보기 탭에서 체크하며 사면 편해요' },
  // ⛔ 「주부의 장바구니」 코치 한 칸을 뺐다 — 그 자리(제품 사러가기)를 2026-08-03 에 레시피에서 뺐다.
  //    ⚠️ 없는 자리를 짚는 코치는 **오버레이만 뜨고 아무것도 안 가리킨다**(빈 화면 반짝임).
  { sel: '[data-coach="share"]', label: '친구와 레시피 공유하기', desc: '재료·만드는 법이 담긴 예쁜 카드로 보내요' },
  { sel: '[data-coach="decor"]', label: '레시피 꾸미기', desc: '스티커·마스킹테이프·손글씨로 나만의 표지!' },
  // ⛓ [2026-08-29] label 은 «그 버튼에 적힌 글자»와 같아야 한다(v11.02 「책갈피」 교훈 — 한 곳만 바꾸면 말이 갈린다).
  //    ⚠️ desc 에서 「요리모드」를 뺐다 — 이름이 「요리모드 시작」이 되어 한 줄에 같은 말이 두 번 나왔다.
  //       ⛔ 창업자가 시킨 건 «버튼 이름»이고 이건 거기 «딸려온» 것이라 밝혀 둔다.
  { sel: '[data-coach="cook"]', label: '요리모드 시작', desc: '큰 글씨 · 화면 안 꺼짐 · 단계 타이머' },
]

// 재료 목록에서 '[양념]'·'[소스]'·'[드레싱]'처럼 대괄호만 있는 줄은 소제목(헤더)으로 그린다.
// (장보기 담기·인분 환산에서 제외) — 전 레시피 양념/소스 표기 통일용.
const isIngHeader = (s) => /^\[[^\]]+\]$/.test(String(s).trim())

// 🛒 주부의 장바구니 픽 — 몇 칸까지 펼쳐 두나 (창업자 2026-08-15 *"4칸 넘어가면 접을 수 있게"*)
const PICK_FOLD = 4

export default function RecipeDetailScreen({ id }) {
  const { recipes, toggleFavorite, cook, removeRecipe, addShopItems, addShopItem, diary, addDiary, removeDiary, updateDiary, updateRecipe } = useStore()
  const nav = useNav()
  useWakeLock() // 레시피를 보며 요리할 때 화면이 꺼지지 않게
  const [pending, setPending] = useState(null) // 📮 다 만들었는데 허가가 끊긴 표지 — 「지금 보내기」
  const [timer, setTimer] = useState(false)
  // 🖼 유튜브 미리보기 그림이 안 올 때 — 그 칸을 통째로 감춘다(깨진 네모 금지)
  const [썸네일깨짐, set썸네일깨짐] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  // 📷↔📔 [창업자 확정 2026-08-23] 표지 사진 ↔ 일기 사진을 «한 몸»으로
  //   📮 *"레꾸 화면에서 유저가 내가 만든 음식사진으로 바꾸잖아. 그때! 팝업으로, 일기에도 적용할건가 물으면"*
  //   📮 *"근데 레꾸이미지에서 **다시 예전 아이콘으로 바꾸면 일기에는 반영이 안돼**"* → 되돌리기도 같이
  //   ⭐⭐ 「사진을 언제 찍나」를 우리가 «안 정한다» — 표지를 바꾸러 온 사람은 사진이 이미 손에 있다.
  //      요리 직후엔 아직 접시에 안 담았을 때가 많고, 다음 날 카드는 「어제 것」에만 뜬다.
  //   ⭐ 이게 「일기 사진만 빼기」도 같이 푼다 — 옛 안(앨범 길게 누르기)은 «숨은 기능»이라 못 찾는다.
  const [askDiaryPhoto, setAskDiaryPhoto] = useState(null)   // 표지에 넣은 사진 → 일기에도?
  const [askDiaryRemove, setAskDiaryRemove] = useState(false) // 표지를 아이콘으로 → 일기 사진도 뺄까?
  const [logEntry, setLogEntry] = useState(null)
  const [decorOpen, setDecorOpen] = useState(false)
  const [guide, setGuide] = useState(false) // 요리 가이드(계량·손질) 시트
  const [drawOpen, setDrawOpen] = useState(false) // 공유 뽑기카드
  const [shareSheet, setShareSheet] = useState(false) // 공유 두 갈래 시트
  const [coverBusy, setCoverBusy] = useState(false) // 꾸민 표지 이미지 만드는 중(로딩)
  // 🗣 한마디 청하기 — **뜨는 자리가 둘이다.** 담는 값 = 머리글 글자(null = 안 뜸)
  //   ⑴ 기록 시트를 «직접 열었다 닫을» 때 (원래 자리)
  //   ⑵ 🎴 자랑 카드를 «보낸 뒤 카드를 닫을» 때 (㉠ · 창업자 확정 2026-08-27)
  //   ⛔ 참·거짓이 아니라 «글자»를 담는 이유 = 자리마다 머리글이 달라야 한다.
  //      「N번째 한 끼예요」를 공유 직후에 띄우면 **거짓말**이 된다(요리를 안 했을 수 있다).
  const [askReview, setAskReview] = useState(null)
  const 자랑보냄 = useRef(false)
  // 인라인 오버레이(꾸미기) — 뒤로가기로 닫기.
  // (타이머·삭제확인·기록·가이드 시트는 각자 자체 처리)
  // 🔙 꾸미다가 뒤로가기 → **바로 닫지 않고 물어본다** (창업자 2026-07-30
  //    *"레시피꾸미다가 뒤로가기하면 저장하고 나갈건지 그냥 나갈건지 뜨면 좋겠어"*).
  //    ⚠️ 예전엔 여기서 `setDecorOpen(false)` 로 **곧장 닫아서**, 취소 버튼에만 있던
  //    "저장하지 않고 나갈까요?" 를 건너뛰고 꾸민 게 날아갔다.
  //    → 에디터가 채워주는 `decorCloseRef`(= 물어보는 닫기)를 부른다.
  const decorCloseRef = useRef(null)
  // ⭐ 돌려주는 값을 «그대로» 넘긴다 — `false` = 「물어보는 중, 아직 안 닫음」(App 이 층을 남긴다)
  useLayerBack(decorOpen, () => { if (decorCloseRef.current) return decorCloseRef.current(); setDecorOpen(false); return true })
  const [coach, setCoach] = useState(() => needsCoach(COACH_KEY))
  const iconRef = useRef(null)
  const coverPhotoRef = useRef(null) // 📷 표지 사진 고르기 (아이콘 시트의 「내 사진으로 하기」가 누른다)
  const [iconSheet, setIconSheet] = useState(false) // 표지 아이콘 바꾸기 — 상세에서 바로(편집 안 들어가고)
  const coverRef = useRef(null) // 꾸민 표지(레꾸) 캡처용
  const recipeCardRef = useRef(null) // 2장째 레시피카드(재료·만드는 법) 캡처용
  const r = recipes.find((x) => x.id === id)
  const baseServings = r?.servings || 0
  const [servings, setServings] = useState(baseServings || 1)
  const ratio = baseServings ? servings / baseServings : 1
  const [picksOpen, setPicksOpen] = useState(false) // 🛒 픽카드 접기 — 4칸까지만 보이고 나머지는 「더 보기」
  // ⛔⛔ 훅은 «전부» 아래 `if (!r)` 보다 위에 있어야 한다 — 밑에 두면 레시피를 지우는 순간
  //    early return 이 걸려 훅 개수가 줄고 React 가 트리째 죽는다(빈 화면).
  //    2026-08-03 창업자 제보 *"홍콩식가지볶음 지웠더니 먹통됨"* 의 정체가 이거였다.
  //    (`picksOpen` 이 뒤쪽 158줄에 있었다 — 큐레이션 픽 4개 상한을 넣으며 8/2 에 들어왔다)

  // 🔁🔁🔁 **[2026-09-02 · 창업자 「불안정하다」] AI 정리에 실패한 편을 «열 때» 한 번 만회한다.**
  //
  // 📮 창업자 = *"불안정하다.. ai가 읽을때가 있고 못읽을때가 있고.. 열쇠는 차감안된거지? (못읽으면)"*
  // 📮 그 앞 확정(2026-08-29) = *"**열쇠는 무조건 둘다 잘되어야해 돈이니까.**"*
  //
  // ⛔⛔ **OCR 몫 열쇠는 이미 나갔다** — 정리가 실패하면 돈은 내고 값의 절반만 받는다.
  //    「이번엔 안 됐네」로 끝내면 그 손해가 «영구»가 된다. 그래서 만회한다.
  //
  // ⭐ **왜 「앱 열 때」가 아니라 「그 편을 열 때」인가** — 비용이 «관심»에 비례하게 하려고.
  //    앱 열 때 돌리면 안 보는 레시피에도 뉴런이 나가고, 유저가 수만 명이면 그게 곧 우리 돈이다
  //    (절대원칙 32). 여는 순간에만 돌면 **안 보는 편엔 0원**이고, 보는 그 순간 고쳐져 있다.
  //
  // ⛔⛔ **빈 칸만 채운다 — 유저가 고친 것을 «절대» 안 덮는다.**
  //    · 제목  = 비었거나 자리표(「사진 레시피」)일 때만
  //    · 재료  = 지금 «0줄»일 때만
  //    · 걸음  = ⛔안 건드린다(규칙 파서 걸음이 이미 쓸 만하고, 유저가 봤을 수 있다)
  //    📌 이러면 「고쳐주려다 지우는」 길이 구조적으로 없다(v10.86 ⓙ 「없는 값으로 덮으면 지우는 것」).
  //
  // ⛔ **한 편에 한 번뿐** — 또 실패하면 표를 2 로 바꿔 다시 안 한다. 무한 재시도는 통을 태운다.
  // ⛔ 사진은 안 보낸다 — 저장을 안 하므로 손에 없다(글자만으로도 8/29 실측에서 재료 7개가 나왔다).
  // ⚠️ 훅은 «전부» 아래 `if (!r)` 보다 위에 있어야 한다(바로 아래 주석 참조).
  const 만회한적 = useRef('')
  useEffect(() => {
    if (!r || r.tidyFail !== 1) return
    const 원문 = String(r.rawText || '')
    if (원문.length < 40) return          // 원문이 없으면 만회할 재료가 없다
    if (만회한적.current === r.id) return // ⛔ 이 화면에 머무는 동안 두 번 돌지 않게
    만회한적.current = r.id
    let 살아있나 = true
    ;(async () => {
      const ai = await tidyRecipe(원문)
      if (!살아있나) return
      if (!ai) { updateRecipe(r.id, { tidyFail: 2 }); return }
      const 기본 = parseRecipeText(원문, { fromOcr: true })
      const m = mergeTidy(기본, ai)
      // 🏷 [2026-09-03] 자리표 판정은 «파서 한 곳»에서 — 「제목없음」도 여기서 같이 걸린다
      const 자리표 = 자리표제목(r.title)
      const 재료없다 = !(r.ingredients || []).length
      updateRecipe(r.id, {
        tidyFail: 0,
        ...(자리표 && m.title ? { title: m.title } : {}),
        ...(재료없다 && m.ingredients.length ? { ingredients: m.ingredients } : {}),
      })
      // 🔔 조용하지만 «말은 한다» — 화면이 갑자기 바뀌면 유저는 「고장인가」로 읽는다.
      if (자리표 || 재료없다) nav.showToast('AI가 레시피를 더 다듬었어요', 4000)
    })()
    return () => { 살아있나 = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.id, r?.tidyFail])

  // ⭐⭐ 미리 캡처 — 공유 두 갈래 시트가 «뜨는 순간» 표지를 백그라운드로 그리기 시작한다.
  //   ⛔ 왜 필요한가 = 폰 공유는 «누른 직후»에만 열리는데 표지 그리기가 20초 넘게 걸린다.
  //      다 그릴 때쯤엔 허가가 끊겨 「지금 보내기」를 한 번 더 눌러야 했다(창업자 2026-08-05).
  //   ⭐ 고르는 «동안» 그려두면, 누른 순간엔 이미 다 돼 있어서 공유창이 바로 열린다.
  //      랜덤 카드(ShareDrawCard)가 v9.63부터 쓰던 방식 — 검증된 처방을 표지에도 붙인다.
  // 🔤 글꼴 꾸러미 미리 데우기 — 캡처보다 «먼저» 끝나 있어야 캡처가 빨라진다(fontEmbed.js)
  useEffect(() => { warmFontCSS() }, [])

  const prepRef = useRef(null)
  useEffect(() => {
    prepRef.current = null
    if (!shareSheet || !r) return
    const decorated = (r.decor && r.decor.length) || (r.decorBg && r.decorBg !== 'none') || r.thumb === 'none'
    if (!decorated) return
    const withRecipe = !!((r.ingredients || []).length || (r.steps || []).length)
    let alive = true
    const t = setTimeout(() => {
      if (!alive || !coverRef.current) return
      const p = buildCoverPayload({
        coverEl: coverRef.current,
        title: r.title,
        info: [r.time ? `${r.time}분` : null, r.servings ? `${r.servings}인분` : null, r.difficulty || null].filter(Boolean),
        appUrl: location.origin + location.pathname.replace(/[^/]*$/, ''),
        recipeEl: withRecipe ? recipeCardRef.current : null,
      })
      p.catch(() => { /* 실패하면 누를 때 다시 만든다 */ })
      prepRef.current = p
    }, 80) // 숨은 레시피카드가 붙을 시간
    return () => { alive = false; clearTimeout(t) }
  }, [shareSheet, r])

  if (!r) {
    return (
      <div className="screen">
        <div className="topbar-back">
          <button className="icon-btn press" onClick={() => nav.pop()}><Icon name="chevron-left" size={24} /></button>
        </div>
        <div className="empty">레시피를 찾을 수 없어요.</div>
      </div>
    )
  }

  const info = [
    r.time ? `${r.time}분` : null,
    r.servings ? `${r.servings}인분` : null,
    r.difficulty || null,
  ].filter(Boolean)

  const myEntries = diary.filter((d) => d.recipeId === id).sort((a, b) => b.at - a.at)
  const latestEntry = myEntries[0]
  const cookedN = r?.cooked || myEntries.length

  // ⭐⭐ 「만들었어요」는 누르면 «끝»이다 — 토스트만 뜨고 아무 폼도 안 연다. (창업자 확정 2026-08-06)
  //    `docs/요리기록-다이어리-방향-2026-08-05.md` 9️⃣ 순서표 ① = *"「만들었어요」 → 토스트만, 시트 안 뜬다"*
  //
  // ⛔ 예전엔 `addDiary` 로 저장이 «이미 끝났는데» 곧바로 기록 시트가 따라 떴다.
  //    저장이 안 된 것도 아닌데 별점·메모·사진을 묻는 폼이 앞을 막아서, 그게 요리 기록 탭이
  //    죽은 이유 중 하나였다(마찰). 남기고 싶은 사람은 아래 「내 요리 기록」이나
  //    요리 기록 탭에서 «자기가 원할 때» 연다.
  const onCook = () => {
    // 오늘 이미 기록이 있으면(요리모드 완료 등) 새로 만들지 않는다 — 하루 두 번 집계 방지
    const today = new Date().toDateString()
    const existing = myEntries.find((d) => new Date(d.at).toDateString() === today)
    if (existing) {
      nav.showToast('오늘은 이미 한끼 일기에 있어요')
      return
    }
    // 📷 [2026-08-24 창업자 영상 제보] **표지가 «내 사진»이면 일기도 그 사진으로 시작한다.**
    //   📮 창업자 = *"레꾸화면에서 사진 넣은건 … 일기나, 달력에 저장되지도 않아"*
    //   ⛔⛔ 여기가 `photo: null` 로 박혀 있었다 — 표지에 사진이 있어도 일기는 늘 빈손으로 시작했다.
    //   🔎 왜 v11.22 로 안 잡혔나 = 그 판은 「표지를 바꿀 때 «이미 있는» 일기에 넣을까」를 묻는다
    //      (`onCoverPhoto` 의 `if (latestEntry && !latestEntry.photo)`).
    //      **사진을 «먼저» 바꾸고 나중에 「만들었어요」를 누르면** 그때는 일기가 없어 안 묻고,
    //      뒤늦게 만들어진 일기는 표지를 안 쳐다본다. 영상이 정확히 그 순서였다.
    //   ⭐ 안 묻고 바로 넣는다 — 「만들었어요」는 한 번 누르고 끝나는 동작이라 팝업이 끼면 시끄럽다.
    //      `CookScreen.finish()` 도 찍은 사진을 말없이 일기에 담고 토스트로만 알린다. 같은 결이다.
    //   ⛔ 자랑카드(`imageFit: 'whole'`)는 «사진»이 아니라 완성된 표지 한 장이다 → 일기에 넣지 않는다.
    const 표지사진 = r.thumb === 'photo' && r.image && r.imageFit !== 'whole' ? r.image : null
    const entry = { id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: 표지사진 }
    addDiary(entry)
    cook(r.id)
    nav.showToast(표지사진 ? '만들었어요! 표지 사진도 일기에 담았어요' : '만들었어요! 한끼 일기에 남겼어요')
    // 🚪 리뷰 문 — 「한 끼 해냈다」 (창업자 확정 2026-09-03)
    //   ⛔⛔ 이건 **창업자 2026-08-06 확정(「토스트만, 시트 안 뜬다」)을 «뒤집은» 것**이다.
    //      📮 창업자 2026-09-03 = *"각각 뭐라도 쓰면 리뷰쓰는 페이지가 나오게"* → 「만들었어요」를 콕 골랐다.
    //   ⭐ 그래도 그때 없앤 마찰이 안 돌아오는 이유 = **30일에 한 번**이라 매번이 아니다.
    //      그때 없앤 건 «누를 때마다 뜨던 기록 시트»이고 이건 한 달에 한 번이다.
    //   ⛔ **토스트는 그대로 둔다** — 시트가 토스트를 대신하지 않는다.
    nav.askReviewSoon?.('요리')
  }

  // 📺 원본이 유튜브·인스타면 앱 안에서 재생할 수 있는 주소를 만든다(아니면 null)
  const 영상 = embedUrl(r?.sourceUrl || '')
  // 🖼 **「표지 그림을 보일 수 있나」는 «한 곳»에서만 판정한다** (2026-09-04)
  //   ⛔ 이 잣대가 카드 «세 자리»(그림 칸 · 가르는 선 · 앞으로 붙을 미리보기)에 쓰인다.
  //      세 곳에 베껴 적으면 하나만 고쳤을 때 «선만 남고 그림은 없는» 화면이 난다.
  //   ⭐ 지금은 유튜브만 그림이 있다 — 인스타는 표지 주소를 안 준다(Meta 가 oEmbed 에서 뺐다).
  //      서버로 받아오는 길이 열리면 **이 한 줄만 고치면 카드가 통째로 따라온다.**
  const 표지보임 = !!(영상 && 영상.type === 'youtube' && 영상.thumb && !썸네일깨짐)

  const del = () => setConfirmDel(true)

  // 🍱 표지 아이콘 바꾸기 — 예전엔 편집 진입 → 썸네일 탭 → 고르기 → 맨 아래 저장까지 가야 했다
  // (창업자 "레시피 음식사진 변경이 불편해"). 이제 상세 표지에서 한 번 눌러 고르면 즉시 저장된다.
  // 갤러리 사진이 아니라 우리 음식 아이콘으로 연결(창업자 지적) — 사진 쓰고 싶으면 편집 화면에서.
  const pickIcon = (k) => {
    // ⭐ iconPicked = 「사람이 직접 골랐다」 — 나중에 제목을 손봐도 이 아이콘을 안 덮는다.
    //   (EditorScreen 의 자동 재추천이 직접 고른 것까지 덮던 것 · 창업자 제보 2026-08-05)
    const 사진이었다 = r.thumb === 'photo'
    updateRecipe(r.id, { thumb: 'icon', icon: k, iconPicked: true, touched: true })
    // ③ 사진 → 아이콘으로 «되돌릴» 때 일기 사진도 뺄지 묻는다(창업자 2026-08-23)
    //    ⛔ 일기에 사진이 있을 때만 — 없으면 물어봐야 할 것이 없다
    if (사진이었다 && latestEntry?.photo) { setAskDiaryRemove(true); return }
    nav.showToast('표지 아이콘을 바꿨어요')
  }
  // 📷📷 **표지를 «내 사진»으로 — 이 화면에서 바로** (창업자 2026-08-17
  //   *"아이콘 바꾸기에 바로 내가 사진 올릴 수 있는 버튼도 있었으면 좋겠다고"* · *"이것도 반영아직이네"*)
  //   ⛔ 그 전엔 **편집 화면**까지 들어가야 했다(이 파일 189줄 주석에 그렇게 적혀 있었다).
  //      표지를 바꾸러 왔는데 사진만 다른 화면이면, 그 길은 있어도 «없는 것»이다
  //      — 북마크가 안 쓰이던 이유(*"레시피에 들어가서 눌러야 하니까"*)와 **같은 뿌리**다.
  //   ⭐ 새로 만든 게 없다 — `cropSquare` 800 은 **편집 화면이 쓰던 그 길**이고(`EditorScreen:221`),
  //      저장 모양(`thumb:'photo'` ＋ `image`)은 **자랑카드 표지 저장이 쓰던 그것**이다(:721).
  //   ⚠️ `iconPicked` 는 «아이콘을 골랐다»는 표시라 여기선 안 건드린다 — 사진을 지우면 원래 아이콘 규칙으로 돌아가야 한다.
  const onCoverPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // ⚠️ 먼저 비운다 — 같은 파일을 다시 고르면 change 가 안 뜬다
    if (!file || !r) return
    const reader = new FileReader()
    reader.onload = async () => {
      // ⛔⛔ cropSquare 를 쓰면 **확대·축소가 반쪽이 된다** — 고를 때 가운데 정사각만 남기고 나머지를 «버려서»
      //    원 안에서 끌 여지가 0 이 된다(넘치는 게 없으면 안 움직인다). 위·아래에 있던 것은 영영 못 본다.
      //    ⭐ 일기 속지 사진이 2026-08-12 에 이미 겪고 고친 자리다(PaperSheet 주석) —
      //       *"처방이 둘로 나뉜다: ⑴자를 때 안 버린다 ⑵볼 때 위치를 고른다. 두 번째만 고치면 못 살린다."*
      //    ✅ 그래서 **안 자르고 줄이기만**(fitImage). 어디를 보여줄지는 imagePos·imageZoom 이 정한다.
      //    ⚠️ 새 사진을 넣으면 자리·배율도 되돌린다 — 옛 사진 기준 좌표는 새 사진에서 뜻이 없다.
      const shrunk = await fitImage(reader.result, 1200)
      updateRecipe(r.id, { thumb: 'photo', image: shrunk, imagePos: '', imageZoom: '', touched: true })
      setIconSheet(false)
      // ② 일기에도 넣을지 묻는다(창업자 2026-08-23)
      //    ⛔ 일기가 «없으면» 안 묻는다 — 넣을 데가 없다. 새 기록을 만들면 「만들었어요」를 대신하는 꼴이라 헷갈린다
      //    ⛔ 이미 사진이 있으면 안 묻는다 — 유저가 넣어둔 걸 말없이 덮지 않는다(`CookScreen.finish()` 와 같은 원칙)
      if (latestEntry && !latestEntry.photo) { setAskDiaryPhoto(shrunk); return }
      nav.showToast('표지를 내 사진으로 바꿨어요')
    }
    reader.readAsDataURL(file)
  }
  const doDelete = () => {
    removeRecipe(r.id)
    nav.pop()
    nav.showToast('레시피를 삭제했어요')
  }

  // 💌 공유 = 두 갈래 시트: 🎴 랜덤 뽑기카드(정적) / 🎨 내 꾸민 표지(효과 보이게 캡처)
  const onShare = () => setShareSheet(true)
  // 꾸민 표지가 있나(배경·스티커·데코 중 하나라도) → 있으면 "내 꾸민 표지로" 옵션 노출
  const isDecorated = (r.decor && r.decor.length) || (r.decorBg && r.decorBg !== 'none') || r.thumb === 'none'
  const hasRecipe = !!((r.ingredients || []).length || (r.steps || []).length)
  const doShareCover = async () => {
    // ⛔ 시트를 닫기 «전에» 미리 캡처를 손에 쥔다 — 닫으면 useEffect 정리가 prepRef 를 비운다
    const prepared = prepRef.current
    setCoverBusy(true) // 로딩 오버레이 + 숨은 레시피카드 마운트 유지
    setShareSheet(false)
    const appUrl = location.origin + location.pathname.replace(/[^/]*$/, '')
    await new Promise((res) => setTimeout(res, 60)) // 레시피카드 마운트 시간
    // 📱 [2026-08-28 ⓑ] 시트를 띄우게 되면 «리뷰는 그 시트가 닫힐 때» 청한다(⛔시트 위에 시트 금지).
    let 띄울시트 = null
    try {
      // 꾸민 표지 + 재료·만드는 법(레시피카드) 2장 함께 — 친구가 진짜 해먹게(랜덤 카드와 동일)
      // ⭐ 시트가 뜰 때 시작한 「미리 캡처」가 있으면 그걸 쓴다 — 다 돼 있으면 즉시 공유창이 열린다
      const res = await shareDecoratedCover({ coverEl: coverRef.current, title: r.title, info, appUrl, recipeEl: hasRecipe ? recipeCardRef.current : null, prepared })
      // ⛔ 공유가 «저장»으로 떨어졌으면 이유를 말한다 (BragScreen 과 같은 처리 — 창업자 2026-08-03)
      if (res && res.pending) 띄울시트 = res.pending   // 📮 허가가 끊겼다 → 한 번 더 누를 기회를 준다
      // 📱 표지가 나갔고 레시피가 한 장 남았다 → 「레시피도 보내기」를 한 번 더 청한다(창업자 "ㄴ으로 하자")
      else if (res && res.shared === true && res.다음) 띄울시트 = { ...res.다음, 이어보내기: true }
      else if (res && res.ok && res.shared === false) nav.showToast('공유가 안 되는 폰이라 사진으로 저장했어요')
      else if (res && res.ok === false) nav.showToast('카드를 만들지 못했어요. 잠시 뒤 다시 눌러주세요')
      // 🗣 「꾸민 표지 그대로」 공유도 리뷰를 청한다 — BragScreen `sendCover` 와 «같은 구멍»이었다
      //   (창업자 폰 제보 2026-08-28 = *"레꾸자랑은 내가 아예 못봤어"*). 자세한 경위는 그쪽 주석에.
      if (res && res.shared === true) 자랑보냄.current = true
    } finally {
      setCoverBusy(false)
      if (띄울시트) setPending(띄울시트) // 📱 리뷰는 이 시트의 `onClose` 가 청한다(아래)
      else {
        if (자랑보냄.current && shouldAskReviewNow()) setAskReview('레꾸 자랑 보냈어요')
        자랑보냄.current = false
      }
    }
  }

  // 🛒 이 레시피가 쓴 「주부의 장바구니」 제품 — 재료·메모에 제품명이 있으면 자동으로 붙는다.
  //   ⛔⛔ 2026-08-03 에 이 자리를 통째로 없앴던 것을 2026-08-10 에 되살렸다.
  //      창업자 원문은 *"우리 레시피에서 **한살림꺼는** 다 빼야할 듯"* 인데
  //      내가 그걸 「픽 자리 통째로」로 넓게 읽어 **82편 전부에서 사러가기가 사라졌다**(일주일).
  //      창업자 정정 2026-08-10 — *"그게 **한살림제품만** 빼자는 뜻이었어"* · *"다 빼자는게 아니라"*.
  //   ⭐ 그리고 한살림 문제는 «같은 날» 장보기 화면에서 이미 풀려 있었다 —
  //      `mallLabel()` 의 **「한살림 · 조합원 전용」** 배지. 누르기 «전»에 보이니 헛걸음이 없다.
  //      🌱 2026-08-17 부터 한 걸음 더 — **사러가기를 아예 안 그린다**(창업자 *"링크안달면되고"*).
  //      여기도 같은 배지를 쓴다 → **막다른 길이 안 생기니 뺄 이유가 없다.**
  //   ⚠️ 자연드림(아이쿱)은 **실버회원 가입으로 누구나 온라인 구매 가능**(조합원과 가격만 다르다)
  //      → 아무 표시도 안 붙인다. 창업자 확인 2026-08-10.
  // ⛔ 재료와 메모를 «갈라서» 넘긴다 — 한 자루에 섞으면 메모의 설명 문장에서 광고가 걸린다
  //    (2026-08-31 「누룽지」 사고 — `curation.js` `picksForIngredients` 주석 참고)
  const pantryPicks = picksForIngredients(r?.ingredients || [], r?.memo || '')
  // 🔽 4칸까지만 보이고 나머지는 접는다(창업자 2026-08-15 *"너무 길면 좀 그래"*)
  const shownPicks = picksOpen ? pantryPicks : pantryPicks.slice(0, PICK_FOLD)
  // ⭐ 「다 담기」는 접혀 있어도 «전부» 담는다 — 「다」라고 써 놓고 보이는 것만 담으면 거짓말이 된다.
  //    담고 나서 뜨는 토스트가 개수를 말해주니 유저도 몇 개 담겼는지 안다.
  const addAllPicks = () => {
    // ⛔ 한살림은 `noBuy` 를 같이 담는다 — 안 그러면 장보기 리스트에서 쿠팡·네이버 검색으로 샌다
    pantryPicks.forEach((p) => addShopItem({ name: p.name, url: productLink(p), ...(isHansalim(p) ? { noBuy: true } : {}) }))
    nav.showToast(`장바구니 재료 ${pantryPicks.length}개를 장보기에 담았어요`)
  }
  // 구매처 배지 — 장보기 화면 `mallLabel()` 과 «같은 규칙»이라야 한다(한쪽만 고치면 앞뒤가 안 맞는다)
  //   ⭐ 이제 판정이 `productMall()` «한 곳»에 모였다 — 전엔 여기서 url 로 한 번 더 봐서 두 벌이었다.
  // 🏪 구매처 배지. ⛔ **브랜드와 몰 이름이 같으면 안 그린다** — 「자연드림」처럼 브랜드이자 몰인 곳이 있다.
  //    2026-08-31 실물에서 「자연드림 / 우리밀 올리고당 [자연드림]」으로 **한 줄에 두 번** 나왔고,
  //    그 배지가 자리를 먹어 이름이 두 줄로 접혔다. 같은 말을 두 번 하려고 줄을 늘릴 이유가 없다.
  const mallBadge = (p) => {
    const m = productMall(p)
    return m && p.brand && m === p.brand ? '' : m
  }

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      {/* 공유 카드용 숨은 아이콘 (SVG 직렬화 소스) */}
      <div ref={iconRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <FoodIcon name={r.icon || guessFoodIcon(r.title)} size={240} />
      </div>
      {/* 꾸민 표지 공유 시 2장째로 함께 갈 레시피카드(재료·만드는 법) — 시트 열렸거나 캡처 중일 때 렌더 */}
      {(shareSheet || coverBusy) && hasRecipe && (
        <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, opacity: 0, pointerEvents: 'none' }}>
          <div ref={recipeCardRef}><RecipeCard recipe={r} /></div>
        </div>
      )}
      {/* 🎨 꾸민 표지 이미지 만드는 중 — 로딩 오버레이(먹통처럼 안 보이게) */}
      {/* 📮 표지가 다 됐는데 공유 허가가 끊긴 경우 — 한 번 더 누르면 진짜로 나간다
          🗣 [2026-08-28] 여기서 «진짜로» 나갔을 때도 한마디를 청한다 — BragScreen 과 «같은 구멍»이었다
             (창업자 = *"리뷰 안떠..ㅠㅠ"*). 자세한 경위는 `SendNowSheet.jsx` 머리 주석에. */}
      <SendNowSheet
        pending={pending}
        onShared={() => { 자랑보냄.current = true }}
        onClose={(다음) => {
          // 📱 [2026-08-28 ⓑ] 표지가 나갔고 레시피가 남았으면 **한 장 더**를 먼저 청한다. 리뷰는 그다음.
          if (다음) { setPending({ ...다음, 이어보내기: true }); return }
          setPending(null)
          if (자랑보냄.current && shouldAskReviewNow()) setAskReview('레꾸 자랑 보냈어요')
          자랑보냄.current = false
        }}
      />

      {coverBusy && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(30,26,22,.55)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div className="ocr-spin" />
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>예쁜 카드 만드는 중…</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 15.5 }}>표지 + 레시피 2장 준비 중이에요</div>
          </div>
        </Portal>
      )}

      {/* 상단 바 — 표지 위에 얹지 않고 사진 밖 별도 바로 뺐다(창업자 2026-07-28
          "버튼이 7개야 그림 속에 · 간섭이 심해"). 표지에는 표지용 버튼 2개만 남는다.
          sticky라 스크롤해도 뒤로·공유는 계속 닿는다. */}
      <div className="detail-bar">
        <button className="bar-btn" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* 보조 동작(편집·즐겨찾기·삭제)은 같은 납작한 원형으로 리듬 통일.
              주 동작(공유)만 채움 알약으로 강조해 위계를 만든다. */}
          <button className="bar-btn" onClick={() => nav.push({ name: 'editor', id: r.id })} data-coach="edit" aria-label="편집">
            <Icon name="edit" size={19} stroke={2.2} />
          </button>
          {/* 🔖 [2026-08-18] 이름 통일 「즐겨찾기」 → **「책갈피」** (창업자 확정)
              ⏳ **그림은 아직 북마크 아이콘이다** — 목록은 요리사모자 클립으로 갔다.
                 말은 같은데 그림이 달라 「같은 기능인 줄 모른다」가 될 수 있다 → 창업자 판정 대기.
                 ⛔ 창업자가 지목한 건 「칩」이라 여기까지 그림을 넓히지 않았다. */}
          <button className="bar-btn" onClick={() => toggleFavorite(r.id)} aria-label={FAV_NAME}>
            <Icon name="bookmark" size={20} color={r.favorite ? '#c2703f' : 'currentColor'} style={{ fill: r.favorite ? '#c2703f' : 'none' }} />
          </button>
          {/* 삭제 — 예전엔 '⋯ 더보기' 뒤에 숨겨뒀는데 메뉴 안에 삭제 하나뿐이라
              유저는 "삭제가 어디 있는지 모르겠다"만 됐다(창업자 제보 "점세개 안에 있어 불편").
              휴지통 아이콘으로 바로 보여주고, 확인 시트는 그대로라 실수 방지도 유지된다(탭 3→2회). */}
          <button className="bar-btn" onClick={del} aria-label="레시피 삭제"><Icon name="trash" size={20} /></button>
          {/* 공유 — 눈에 띄게 채움색(포인트 브라운) 알약. 바이럴 진입점이라 강조. */}
          <button
            className="press"
            onClick={onShare}
            data-coach="share"
            aria-label="친구와 레시피 공유하기"
            // 삭제 바로 옆이라 오탭 안 나게 간격을 벌려둔다(삭제엔 확인 시트도 그대로 있음)
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, marginLeft: 10, padding: '0 15px', background: 'var(--brown)', color: '#fffdf8', fontSize: 16.5, fontWeight: 800, borderRadius: 999, border: 'none' }}
          >
            <Icon name="share" size={17} color="#fffdf8" stroke={2.3} /> 공유
          </button>
        </div>
      </div>

      {/* 히어로 이미지(표지) — 꾸미기 스티커·포스트잇이 이 위에 얹힌다. ref로 통째 캡처(자랑 공유) */}
      {/* 🖼 `cover-box` = 가로에서 표지 폭을 화면 «높이»에 맞추는 손잡이 (창업자 2026-08-09
          *"꾸미다가 취소하면 화면이 엄청커짐"* — 눕히면 앱이 폭을 다 써서 1:1 표지가 851×851 이 됐다).
          ⛔ 세로에선 아무 일도 안 한다 · 캡처(자랑 공유)는 이 `ref` 안만 찍으므로 그대로다. */}
      {/* 📌 `cover-col` = 표지 ＋ 아래 단추 줄을 «한 칸»으로 묶는 래퍼 (2026-08-13).
          ⭐ 왜 만들었나 = 패드 2단에서 왼쪽 칸을 «고정»하려면(테스터 *"내렸을때 계속 닭곰탕이보여"*)
             둘을 한 덩어리로 잡아야 한다. 예전에 grid 로 네 번 실패한 이유가 바로 «묶을 래퍼가 없어서»였다.
          ⛔ 세로(폰)에선 아무 일도 안 한다 — 스타일은 가로 미디어쿼리 안에만 있다. */}
      <div className="cover-col">
      <div ref={coverRef} className="cover-box" style={{ position: 'relative' }}>
        <Thumb
          recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }}
          panProps={{
            onPointerDown: (e) => photoPanStart(e, {
              pos: r.imagePos,
              zoom: r.imageZoom,
              onCommit: ({ pos, zoom }) => updateRecipe(r.id, { imagePos: pos, imageZoom: zoom }),
            }),
            "aria-label": "표지 사진 — 끌어서 위치 조정 · 두 손가락으로 확대·축소",
            style: { touchAction: "none", cursor: "grab" },
          }}
        />
        <DecorLayer items={r.decor || []} />
      </div>

      {/* 🍱🎨 표지 버튼 둘 — 표지 «밖», 바로 아래 한 줄. (창업자 확정 2026-08-06 「E」)
          ⭐⭐ 왜 밖인가 = **표지는 공유 카드로 찍혀 나가는 그림**이다. 버튼이 그 위에 있는 한
             크게 만들든 작게 만들든 «계속 가린다». 밖으로 빼면 가릴 일 자체가 없어진다.
             창업자가 2026-07-28 부터 계속 말한 원칙이 이것이다 —
             *"버튼이 7개야 그림 속에 · 간섭이 심해"* · 「레꾸가 주인공이라 표지를 최대한 안 가린다」
             오늘 아침 알약을 표지 «안»에 두 개 두었다가 *"너무 큰 알약 2개가 간섭되는거 아닐까?"* 를 들었다.
          ⛔ 이 안(표지 밖)을 어제 내가 「찾기 어려워진다」며 **내 판단으로 미리 쳐냈다.**
             그러면 안 된다 — 후보로 올려 창업자 판정을 받는다.
          ⭐ 왼쪽 그림 = **그 레시피의 음식 아이콘 미니.** "이 그림을 바꾼다"가 그림으로 설명된다
             (여태 갤러리 글리프였다 — 2026-07-28 에 «연결»만 픽커로 바꾸고 그림은 안 바꾼 흔적).
          ⚠️ 채움색은 오른쪽만 — 주 동작은 어디까지나 「레시피 꾸미기」다(위계 유지).
          ✅ 캡처 제외 표시(`data-nocapture`)가 필요 없어졌다 — 캡처는 위 `coverRef` 안만 찍는다. */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 20px 0' }}>
        <button
          className="press"
          onClick={() => setIconSheet(true)}
          aria-label="표지 아이콘 바꾸기"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, background: 'var(--cream)', color: 'var(--brown)', fontSize: 15.5, fontWeight: 800, padding: '0 13px 0 9px', borderRadius: 999, border: 'none' }}
        >
          <FoodIcon name={r.icon || guessFoodIcon(r.title)} size={20} />
          아이콘 바꾸기
        </button>
        <button
          className="press"
          onClick={() => setDecorOpen(true)}
          data-coach="decor"
          aria-label="레시피 꾸미기"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, background: 'var(--brown)', color: '#fff', fontSize: 15.5, fontWeight: 800, padding: '0 13px', borderRadius: 999, border: 'none' }}
        >
          <Icon name="palette" size={14} />
          레시피 꾸미기
        </button>
      </div>
      </div>
      {iconSheet && (
        <FoodIconSheet
          value={r.icon || guessFoodIcon(r.title)}
          onChange={pickIcon}
          onClose={() => setIconSheet(false)}
          onPhoto={() => coverPhotoRef.current?.click()}
        />
      )}
      {/* 📷 표지 사진 고르기 — 화면엔 안 보이고 위 단추가 대신 누른다.
          ⛔ `accept="image/*"` 만 준다. `capture` 를 주면 **갤러리를 못 열고 카메라만** 뜬다. */}
      <input ref={coverPhotoRef} type="file" accept="image/*" onChange={onCoverPhoto} style={{ display: 'none' }} />

      <div className="pad" style={{ paddingTop: 18, paddingBottom: 120 }}>
        {r.status === 'unsorted' && (
          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
            onClick={() => nav.push({ name: 'editor', id: r.id })}
          >
            <Icon name="edit" size={20} color="var(--brown)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brown)' }}>아직 정리 전이에요</div>
              <div className="t-sub" style={{ fontSize: 15.5 }}>제목·재료·태그를 정리하고 레시피로 저장하기</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--brown)" />
          </button>
        )}

        {/* 즐겨찾기는 상단 오버레이 북마크 하나로 통일 (중복 버튼 정리) */}
        <div className="h-title" style={{ fontSize: 25, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {r.title}
          {/* 🏷 **「샘플」** — 창업자가 직접 꾸민 표지가 붙은 딱 한 편(콩국수)에만 뜬다.
              📮 창업자 2026-08-13 *"샘플이라고(삭제가능) 명시하고"* — 일기 샘플과 **같은 모양·같은 잉크색**을 쓴다.
                 ⛔ 두 곳에서 다르게 생기면 「다른 것」으로 읽힌다.
              ⛔ 포인트색(파랑)은 안 쓴다 — 우리 앱에서 파랑은 「누르는 것」이라 단추로 읽힌다. 이건 이름표다. */}
          {r.sample && (
            <span style={{
              fontSize: 15.5, fontWeight: 800, letterSpacing: '.02em',
              padding: '4px 11px', borderRadius: 999,
              background: '#3f382e', color: '#fff', flex: '0 0 auto',
            }}>샘플</span>
          )}
        </div>
        {/* ⛔⛔ [2026-08-13 창업자가 잡았다] 첫 판은 일기와 «똑같이» 「지워도 돼요」였는데 **위험한 안내였다.**
               📮 창업자 *"콩국수는 지우면 안되겠다. 레시피라서... 되살릴수가 없자나.
                  샘플이니까 편집에서 다시꾸밀 수 있어요라던가.. 가르게 적어야겠다"*
               🔢 코드로 확인 = `store.jsx` 87줄 — **«사용자가 지운 기본 레시피는 다시 안 들어온다»**
                  (`removedSeedIds` 에 기록된다). 즉 콩국수를 지우면 **레시피가 영영 없어진다.**
            ⭐⭐ 그래서 일기와 «갈라서» 적는다 —
               · **일기 샘플** = 남의 기록이라 «지우는 것»이 맞다 → 「지워도 돼요」
               · **레시피 샘플** = 레시피 자체는 쓸모가 있고 **꾸민 표지만 우리 것**이다 → 「바꿔 보세요」
            📌 같은 「샘플」이라도 **지우면 잃는 게 다르면 안내도 달라야 한다.** */}
        {/* 🔠 [2026-08-13 창업자 *"콩국수 샘플도 아래 글자 너무 작고 색이 연해서 안보임"*]
            ⛔ 첫 판 = `t-sub`(연한 회색) ＋ 11.5px. 본문이 15px 인데 그 3/4 라 패드에서 특히 안 읽혔다.
            ✅ 13px ＋ 갈색(우리 주색). ⛔파랑은 안 쓴다 — 우리 앱에서 파랑은 「누르는 것」이다.
            ⭐ 굵은 두 낱말(「보여드리는 샘플」·「레시피 꾸미기」)이 눈에 먼저 들어오게 색을 한 단 더 준다. */}
        {r.sample && (
          <div style={{ fontSize: 16, marginTop: 6, lineHeight: 1.55, color: 'var(--brown)', letterSpacing: '-.2px' }}>
            표지는 <b style={{ fontWeight: 800, color: '#5b4632' }}>보여드리는 샘플</b>이에요 ·{' '}
            <b style={{ fontWeight: 800, color: '#5b4632' }}>레시피 꾸미기</b>에서 마음대로 바꿔 보세요
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <SourceBadge source={r.source} size={16} showLabel={false} />
          <span className="t-sub" style={{ marginLeft: 2 }}>{SOURCES[r.source]?.line || '링크에서 가져옴'}</span>
          {/* 저장 날짜 — 자동 기록(savedAt) */}
          {r.savedAt && <span className="t-sub">· {dateLabel(r.savedAt)} 저장</span>}
        </div>

        {info.length > 0 && (
          <div className="info-pills" style={{ marginTop: 16 }}>
            {info.map((t) => (
              <span key={t} className="info-pill">{t}</span>
            ))}
          </div>
        )}

        {r.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {r.tags.map((t) => (
              <span key={t} className="tag"># {t}</span>
            ))}
          </div>
        )}

        {/* 📌📌📌 [창업자 확정 2026-08-20] 메모지는 이제 **재료 목록 «옆»**에 붙는다 — 아래 재료 절 참고.
            📮 *"위에 직사각형 자리 아니고(재료 위 만들었어요? 기록하는 자리빼고)"*
               · *"**대신 자리는 재료옆이어야해.**"* · *"**그 자리는 아예 비운다**"*
            ⛔ 그래서 여기(재료 «위»)엔 아무것도 그리지 않는다 — 메모지도, 옛 「내 요리 기록」 카드도.
            ⭐ 왜 옮겼나 = 여기선 메모지가 «가로로 긴» 자리를 채워야 해서 라벨·배너처럼 보였다.
               창업자 = *"디자인이 많이 들어간 라벨이 썩 잘어울리진 않네"* · *"가로가 너무 기니까"*
               · *"포스트잇 느낌을 살리면 좋겠는데.."*
            ⚠️ **딸려 사라진 것 하나** — 한 줄을 «안 쓴» 사람은 「N번 만들었어요」가 안 보인다
               (옛 카드가 그걸 보여줬다). 그 사람은 홈의 「한 줄 남기기」 안내를 받는다. */}

        {/* ⛔⛔⛔ [창업자 확정 2026-08-20] 옛 「내 요리 기록」 카드를 **뺐다** — 위 주석 참고.
            📮 판의 물음 = *"메모지가 옆으로 가면 재료 위 그 자리가 빈다. 어떻게 할까?"*
               → 창업자 = **"그 자리는 아예 비운다"**
            ⭐ 그래도 흐름이 안 끊기는 이유 = 한 줄을 «쓴» 사람은 재료 옆 메모지를 누르면 기록으로 가고,
               «안 쓴» 사람은 홈의 「한 줄 남기기」 안내를 받는다.
            ⛓ ＋ 2026-08-06 확정 *"만들었어요 → 토스트만, 시트 안 뜬다"* 와도 같은 방향이다
               (창업자 = *"누를 시간 없어서 안하기로 했잖아"*).
            ⛔ 되살리지 말 것. 되살리면 「같은 말이 두 번」이 다시 난다. */}
        {/* ⛔⛔ [2026-08-17에 여기 있던 것] 「빈 별 다섯」을 띄웠다가 되돌린 적이 있다. 되살리지 말 것.
            📮 창업자 *"평점 매기는데가 없으니까 안뜨는거 아닌가"* 를 **「안 보이니 보이게 하자」로 읽고**
               안 매긴 사람에게도 빈 별을 그렸다. 그러자 창업자 = *"**요리기록 남기기 안하기로 하지 않았어???**"*
               *"**누를 시간 없어서 안하기로 했잖아**"*
            ⭐⭐ 창업자는 «없는 걸 지적»한 게 아니라 **«없는 게 맞는데 왜 별이 뜨냐»**를 물은 것이었다.
               확정 = **2026-08-06 「만들었어요 → 토스트만, 시트 안 뜬다」**
               (`docs/요리기록-다이어리-방향-2026-08-05.md` 9️⃣ ① · 게이트 `_repro-cook-toast.mjs`)
            📌 그 결정의 «끝»이 오늘(08-20)이다 — 카드 자체가 사라졌다. */}

        {/* ⛔⛔ 여기 메모지를 «따로» 붙였다가 걷어냈다 — 위 「내 요리 기록」 카드가 이미
            같은 한 줄을 보여주고 있어서 **같은 말이 두 번** 나왔다(2026-08-19 · 찍어 보고 알았다).
            📌 창업자가 두 번 짚은 *"레시피마다 붙일 수 있는 자리가 다르다"* 의 답이 여기였다 —
               «새 자리를 찾는 것»이 아니라 «이미 있는 자리를 바꾸는 것».
            ✅ 그래서 「내 요리 기록」 카드 자체를 메모지 모양으로 만들었다(위 참조). */}
        {/* 📺📺 [창업자 확정 2026-09-03 = ㄷ] 원본이 유튜브면 **여기서 바로 재생한다** — 재료 «위».
            📮 창업자 = *"유튜브 영상을 저렇게 바로 볼 수 있게 해둔거 좋은 것 같아"*
               → *"유튜브영상아래 재료랑 만드는법도 넣을 수 있어?"* → *"ㄷ으로 가자"*
            ⭐⭐ **ㄷ = 「우리가 큐레이션한 것」과 「유저가 담은 것」 둘 다.** 코드는 «하나»다 —
               `sourceUrl` 이 유튜브면 재생한다. 우리 레시피는 그 칸을 채우기만 하면 저절로 붙는다.
               📮 창업자 = *"그럼 우리가 힘들게 레시피를 짜낼 필요가 없엉 · 유튜브나 인스타에서 데려오면 되니까"*
            ⚖️ 레시피를 «데려오는» 것 자체는 저작권과 무관하다 —
               문체부 「저작권 들리ZIP」 = *"레시피는 **아이디어로서 저작권법의 보호대상이 되지 않으며**"*
               ⛔ 단 **글·사진·영상을 그대로 베끼면 안 된다** — 재료·순서는 우리 문체로 다시 쓴다
               (`docs/레시피-저작권-확인-2026-08-01.md`).
            ⛔ **인스타는 여기 안 걸린다** — `embed.type === 'youtube'` 로 막았다.
               인스타는 정책상 앱 안에서 «재생이 안 된다»(`EditorScreen.jsx:785` 에 실물로 적혀 있다).
               인스타 레시피는 영상 없이 재료·순서만 온다.
            ⭐ 새로 만든 게 0이다 — `embed.js`(공식 임베드 주소) ＋ 편집 화면에서 검증된 iframe 속성 그대로.
            ⚖️ 약관 = **IFrame Player 재생은 공식이고 위험 0**
               (`docs/유튜브가져오기-약관조사답-2026-08-27.md:46·172`). 죽은 길은 «AI로 읽는 것»이지 «보여주는 것»이 아니다.
            ⛔⛔ 지킬 것 셋 (YouTube Developer Policies · 2026-09-03 리서치)
               ⑴ **플레이어 위에 아무것도 얹지 않는다** — 컨트롤을 가리면 위반이다
               ⑵ **자동재생 안 한다** — 반 이상 보이기 전 자동재생 금지(우리는 유저가 눌러야 시작한다)
               ⑶ `Referrer-Policy` 를 막지 않는다 — 앱은 Referer 로 신원을 밝혀야 한다
                  ✅ 우리는 따로 안 걸어서 크롬 기본값(`strict-origin-when-cross-origin`) = 유튜브 권장값이다
            ⛔ `allow-top-navigation`·`allow-popups` 를 넣지 않는다 — 넣으면 임베드를 눌렀을 때
               앱이 유튜브 앱으로 튕겨 나간다(편집 화면 주석에 이미 박혀 있는 이유). */}
        {/* ⛔⛔⛔ [창업자 확정 2026-09-03] **앱 «안»에서 유튜브를 «재생하지 않는다».** 📮 = *"ⓐ로 가자"*
            📮 그 앞에 창업자가 이미 말했다 = *"출처는 무조건 적고 영상 바로가기도 만들어야해. **우리앱에서 재생시키는게 아니라**"*

            🔎 **왜 뺐나 — Developer Policies III.E.4.j** (창업자가 조사해 온 답 · 2026-09-03)
              > *"API Clients must look up the Made For Kids status of **each YouTube video that it embeds** on its site or app"*
              ⛔ 잣대가 **앱 등급이 아니라 «임베드하는 영상 하나하나»**다 — 「우리 앱은 어린이 앱이 아니다」로 안 빠진다.
              ⛔ 지키려면 영상마다 「videos.list(part=status)」 로 「status.madeForKids」 를 물어야 하는데,
                 그 순간 **진짜 API Client** 가 되어 다른 조항이 줄줄이 붙는다(30일 저장 제한 등 · 2026-08-27 문서).
              ✅ **안 틀면 이 조항 자체가 해당 없어진다.** 그래서 재생을 뺐다.

            ⭐ 대신 아래 「원본 링크」 칸 하나로 모았다 — 인스타 편과 «같은 모양»이 된다.
            ⛔⛔ 이 자리에 iframe 플레이어를 다시 넣지 말 것. 넣으면 위 조항이 되살아난다.
            ⚠️ 정직하게 — 정책 원문을 내가 «내 눈으로» 못 봤다(이 환경은 유튜브·구글 문서를 못 연다).
               창업자가 가져다준 답을 근거로 한 것이다.

            ✅✅ [창업자 확정 2026-09-03] **대신 «미리보기 그림»은 보여준다.**
               📮 = *"재생창은 보이게 하고 누르면 앱으로 가게해야지"*
                  · *"우리앱에서 직접 재생만 안하면 되자나 미리보기정도는 보여줘도 되지"*
               ⭐ 맞는 말이다 — 조항이 막는 건 **«임베드(앱 안에서 틀기)»**이고, 그림은 임베드가 아니다.
               ⛔ 그래서 이 자리는 **`<img>` 하나 ＋ ▶ 표시**다. **`<iframe>` 을 다시 넣지 말 것.**
               ⛔ 그림이 안 오면(`onError`) 이 칸을 **통째로 감춘다** — 깨진 네모를 보여주지 않는다. */}
        {/* 📷📷 [창업자 확정 2026-09-04 · ⓐ] **인스타 편도 «같은 자리·같은 크기» 카드를 받는다.**
            📮 창업자 = *"꽈리는 뜨고 광어는 안떠"* → 갈래 물으니 **ⓐ 그림 없는 같은 크기 카드**

            🔢 왜 인스타엔 그림이 «없나» (실측 · 고장이 아니다)
               · 유튜브 = `i.ytimg.com/vi/<영상id>/hqdefault.jpg` — **누구나 받을 수 있는 공개 주소**
               · 인스타 = **그런 공개 주소가 없다.** 받으려면 앱 심사 ＋ 토큰 ＋ 서버가 붙는다
                 (⛔우리 강점 「앱이 폰 안에서 다 돈다」를 깨는 값이다 · 절대원칙 32)
               → 그래서 **그림을 지어내지 않는다.** 그 자리에 «매체 표»를 크게 놓는다.

            ⭐ 카드 하나로 유튜브·인스타를 «같이» 그린다 — 두 벌로 적으면 한쪽이 반드시 낡는다
               (2026-08-11 「마크업 두 번 안 적는다」와 같은 결)
            ⛔ 인스타에 ▶ 를 안 붙인다 — 목록 표에서 이미 갈라 둔 잣대다(유튜브 ▶ · 그 밖 🔗).
               앱에서 «재생»되는 건 없지만, ▶ 는 「영상 그림」 위에 얹힐 때만 말이 맞는다.
            ⛔ 유튜브인데 그림이 안 오면(`onError`) **칸을 감추지 않고** 이 「그림 없는 판」으로 물러난다 —
               감추면 문이 통째로 사라진다(2026-09-03 첫 판이 그랬다). */}
        {영상 && (영상.type === 'youtube' || 영상.type === 'instagram') && (
          <>
            <div className="sec-head" style={{ marginTop: 14, marginBottom: 6 }}>
              <SecTitle>{영상.type === 'youtube' ? '영상으로 보기' : '원본 보기'}</SecTitle>
            </div>
            {/* ⛔ 카드 «전체»가 하나의 문이다 — 눌러서 그 앱·웹으로 나간다(앱 안에서 안 튼다) */}
            <button
              className="card press"
              onClick={() => openUrl(r.sourceUrl)}
              style={{ display: 'block', width: '100%', overflow: 'hidden', padding: 0, textAlign: 'left', border: 0 }}
            >
              {/* 🖼🖼 [2026-09-04 창업자 확정 ⓐ] **그림이 없으면 그림 «자리»를 아예 안 만든다.**
                  ⛔ 그 전엔 빈 16:9 칸에 매체 표만 덩그러니 놓았는데, 창업자 폰 실물에서
                     **「그림이 안 떴다」로 읽혔다**(창업자가 그 화면을 찍어 보냈다).
                  ⭐ 뿌리 = 인스타는 «표지 주소를 안 준다» — 유튜브처럼 주소를 조합할 수 없고
                     Meta 가 2025-11-03 부터 oEmbed 응답에서 `thumbnail_url` 을 뺐다.
                     서버가 대신 열어 집어오는 길은 «따로» 재고 있다(`ocr-proxy/worker.js` 의 `?preview=`).
                  ⭐⭐ **이 자리는 그 길이 실패했을 때의 «바닥»이기도 하다** — 먼저 깔아두면
                     인스타가 언제 막아도 화면이 안 깨진다(절대원칙 35 = 안 됐을 때의 모양이 곧 설계다).
                  ⛔ 가짜 그림·우리 요리 사진을 깔지 않는다 — 「인스타에서 본 장면」으로 오해된다. */}
              {표지보임 && (
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <>
                    <img
                      src={영상.thumb}
                      alt=""
                      onError={() => set썸네일깨짐(true)}
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* ▶ = 「누르면 영상으로 간다」는 표시.
                        ⛔ 「플레이어를 가리지 마라」 조항은 여기 해당 없다 — 가릴 플레이어가 없다(그림이다). */}
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 54, height: 38, borderRadius: 10, background: 'rgba(0,0,0,.72)', color: '#fff',
                      }}
                    >
                      <Icon name="play" size={20} />
                    </span>
                  </>
                </div>
              )}
              {/* ⛔ 윗줄(그림)이 없으면 «가르는 선»도 없다 — 선만 남으면 「뭔가 빠졌다」로 읽힌다 */}
              <div className="opt-row" style={{
                padding: '12px 14px',
                borderTop: 표지보임 ? '1px solid var(--line)' : 0,
              }}>
                <Icon name={영상.type === 'youtube' ? 'youtube' : 'instagram'} size={19} color="var(--brown)" />
                {/* 💬💬 [2026-09-04 창업자] *"근데 저렇게 링크만 떡 있으면 사람들이 안눌러볼거야 아마."*
                    ⭐⭐ 맞다. 그리고 이게 «본질»이다 — 문제는 「그림이 없다」가 아니라 **「눌러야 할 이유가 없다」**.
                       그 전 줄은 「여기 링크가 있다」만 말했다. **유저가 얻는 것을 한 글자도 안 적었다.**
                    ✅ 그래서 «이유»를 한 줄 덧댄다. 원작자 이름은 그대로 둔다(예의이고 정책이다).
                    ⛔ 「영상」이라고 뭉뜽그리지 않는다 — 사진 글이면 거짓말이 된다.
                       그래서 `embed.js` 가 내주는 `kind` 로 «데이터가» 말을 고르게 했다.
                       눌러볼 이유를 만든다고 없는 것을 있다고 하면 그건 미끼지 안내가 아니다. */}
                <div className="t" style={{ fontSize: 16, minWidth: 0 }}>
                  {(() => {
                    const 움직이나 = 영상.type === 'youtube' || 영상.kind === 'reel'
                    const 어디 = 영상.type === 'youtube' ? '영상으로 보기'
                      : 움직이나 ? '릴스로 보기' : '원본 글 보기'
                    return (
                      <>
                        <div>
                          {r.sourceName
                            ? <><b style={{ fontWeight: 700 }}>{r.sourceName}</b> · {어디}</>
                            : 어디}
                        </div>
                        <div className="t-sub" style={{ fontSize: 13, marginTop: 2, fontWeight: 400 }}>
                          {움직이나 ? '만드는 손이 헷갈릴 때 보면 쉬워요' : '원작자가 올린 글을 그대로 볼 수 있어요'}
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Icon name="chevron-right" size={17} color="var(--sand)" />
              </div>
            </button>
          </>
        )}

        {r.ingredients?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 14, marginBottom: 6 }}>
              <div className="sec-title-row" style={{ display: 'flex', alignItems: 'center' }}>
                <DetailDecor where="head-재료" />
                <SecTitle>재료</SecTitle>
                {/* 📖 [2026-08-14 창업자] *"버튼 물음표 너무 작고 «모르니까» 요리가이드로 적거나 해서"*
                    ⛔ 전엔 22×22 동그란 「?」 뿐이라 **뭐가 들었는지 알 길이 없었다.**
                    ⭐ 글자는 「요리 가이드」가 아니라 **「계량·손질」** — 창업자 확정(ⓑ).
                       버튼엔 «제목»이 아니라 **안에 뭐가 있는지**가 적혀야 눌러보게 된다
                       (설정에서도 이미 그 두 낱말을 부제로 쓰고 있다).
                    ⚠️ 이 줄 오른쪽엔 「사러가기」가 있다 → 글자를 늘린 만큼 좁은 폰에서 밀릴 수 있어
                       `check-charside.mjs` 와 같이 폭을 재서 확인했다. */}
                <button className="press" onClick={() => setGuide(true)} aria-label="계량·손질 가이드"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                  <Icon name="help" size={12} color="var(--brown)" />
                  계량·손질
                </button>
              </div>
              <button
                className="mini-buy press"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                data-coach="shop"
                onClick={() => {
                  // 🛒 **분량은 떼고 «이름»만 담는다** — 창업자 *"그냥 두부 양파를 사지. 해물가루육수 1봉을 사진 않잖아"*
                  //   ⛔ 그래서 `scaleIngredient`(인분 환산)도 여기선 안 쓴다 — 어차피 분량을 뗄 것이라
                  //      환산해 봐야 그 숫자가 버려진다. 인분 환산은 «재료 목록 화면»이 하는 일이다.
                  addShopItems(r.ingredients.filter((ing) => !isIngHeader(ing)).map((ing) => ingredientName(ing)))
                  nav.showToast('재료를 장보기 리스트에 담았어요')
                }}
              >
                <Icon name="cart" size={13} />
                장보기 담기
              </button>
            </div>
            {baseServings > 0 && (
              <div className="serv-row">
                <span className="serv-label">인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.max(1, v - 1))} aria-label="줄이기"><Icon name="minus" size={16} color="var(--brown)" /></button>
                <span className="serv-val">{servings}인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.min(20, v + 1))} aria-label="늘리기"><Icon name="plus" size={16} color="var(--brown)" /></button>
                {servings !== baseServings && <button className="serv-reset press" onClick={() => setServings(baseServings)}>기본 {baseServings}인분</button>}
              </div>
            )}
            <div>
              {/* 📌📌📌 [창업자 확정 2026-08-20] 「필기하다 포스트잇 붙이기」 — 메모지가 여기 붙는다.
                  📮 *"우리 보통 **필기하다가 포스트잇 붙이잖아. 그런느낌으로.**"* · 판정 = **재료 옆 · 비뚤게 · 44%**
                  ⭐⭐ `float: right` 라 **재료 글이 그 옆으로 흐르다가, 메모지가 끝나면 «전체 폭»을 되찾는다.**
                     🔢 실측(닭곰탕 재료 10줄) = 같은 높이에 **float 10줄 전부 · 2단 8줄**
                        (2단은 끝까지 좁아서 「통마늘 한 주먹 (없으면 다진 마늘 2~3큰술)」이 두 줄로 감긴다)
                  ⛔ **재료 목록 «안»에 넣어야 한다** — 밖에 두면 글이 안 흐르고 통째로 아래로 밀린다.
                  ⛔ 요리 모드(`CookScreen`)엔 이 방식이 «안 통한다» — 거긴 재료 한 줄이 «flex 버튼»이라
                     float 를 감싸지 않는다(`scripts/_probe-요리모드재료-0820.mjs` 로 쟀다). */}
              {latestEntry?.note && (
                <MemoNote recipeId={r.id} 횟수={cookedN} 붙임 onClick={() => setLogEntry(latestEntry)} />
              )}
              {r.ingredients.map((ing, i) => (
                isIngHeader(ing)
                  ? <div key={i} className="ing-head">{ing.trim().replace(/^\[|\]$/g, '')}</div>
                  : <div key={i} className="ing">{scaleIngredient(ing, ratio)}</div>
              ))}
              {/* ⛔ float 는 부모가 높이를 안 잡는다 — 재료가 메모지보다 짧으면 다음 절이 겹친다 */}
              {latestEntry?.note && <div style={{ clear: 'both' }} />}
            </div>
          </>
        )}

        {/* 🛒 주부의 장바구니 픽 — 이 레시피가 쓴 제품을 바로 사러가기(재료 바로 밑 · 수익 연결) */}
        {pantryPicks.length > 0 && (
          <div data-coach="pantry" className="card" style={{ marginTop: 20, padding: 14, background: 'var(--cream)', border: '1.5px solid var(--cream-deep)' }}>
            {/* 🔠 [2026-08-22 창업자] *"주부의 장바구니에서하고 재품하고 너무따닥따닥붙어있어"* · *"줄간도 너무 붙어있어"* */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 19, fontWeight: 800, color: 'var(--brown)', marginBottom: 14 }}>
              <Icon name="cart" size={19} color="var(--brown)" />
              주부의 장바구니에서 고른 재료
            </div>
            {shownPicks.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '13px 0', borderTop: '1px solid rgba(0,0,0,.05)' }}>
                {curIcon(p.icon) && <img src={curIcon(p.icon)} alt="" draggable={false} style={{ width: 42, height: 42, objectFit: 'contain', flex: '0 0 auto' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* ⛔ [2026-08-22 창업자] 「레시피에 광고는 지금 좀 지저분해. 브랜드 버튼이」 — 브랜드 배지는 «큐레이션에만».
                     이 줄은 좁다(그림 30 ＋ 이름 ＋ 사러가기). 딱지가 둘이면 이름과 뒤엉킨다. */}
                  {/* 🔠 [2026-08-31 창업자] *"아니면 이름을줄이자 너무길어"* — 실물에서 다섯 줄이 «전부» 두 줄로 접혔다
                     (「성가정 우리콩 / 진간장」처럼 낱말 가운데가 아니라 «브랜드 가운데»에서 끊긴다).
                     ⭐ 브랜드를 «작은 윗줄»로 빼면 아랫줄이 제품 이름만 남아 한 줄에 들어간다.
                        ⛔ 브랜드를 «지우지» 않는다 — 어느 회사 것인지가 이 큐레이션의 값어치다.
                     📌 브랜드 «배지»(딱지)는 여전히 큐레이션에만 (2026-08-22 *"레시피에 광고는 지금 좀 지저분해"*).
                        이건 딱지가 아니라 그냥 작은 글씨다. */}
                  {p.brand && <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-sub)', lineHeight: 1.15, marginBottom: 1 }}>{p.brand}</div>}
                  <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  {mallBadge(p) && (
                    <span style={{ marginLeft: 6, fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', borderRadius: 5, padding: '1px 6px', ...(mallBadge(p).includes('조합원') ? { color: '#fff', background: '#c2703f' } : { color: 'var(--brown)', background: 'var(--cream-deep)' }) }}>{String(mallBadge(p)).replace(' · 조합원 전용', ' 전용')}</span>
                  )}
                </div>
                {/* ⛔ 한살림은 사러가기를 안 그린다 (창업자 2026-08-17 *"링크안달면되고"*) */}
                {isHansalim(p)
                  ? <span style={{ flex: '0 0 auto', fontSize: 16, fontWeight: 700, color: 'var(--text-sub)' }}>매장에서</span>
                  : <button className="press" onClick={() => openUrl(productLink(p))} style={{ flex: '0 0 auto', padding: '6px 13px', borderRadius: 10, background: 'var(--cream-deep)', color: 'var(--brown)', fontWeight: 800, fontSize: 15.5 }}>사러가기</button>}
              </div>
            ))}
            {/* 🔽🔼 [2026-08-15] 창업자 *"4칸 넘어가면 접을 수 있게 해줘. 너무 길면 좀 그래."*
                🔢 실측(113편) — 픽이 5개 넘는 편이 **15편**(제일 많은 게 어묵탕 7개 · 감바스 5개).
                ⛔ 옛 코드는 **몇 개든 다 펼쳐** 카드가 재료 목록보다 길어졌다 — 광고 칸이 본문을 밀어낸다.
                ⭐ 문구·화살표는 장보기 화면(`ShopScreen`)의 「더보기 / 접기」와 «같은 모양»으로.
                   ⛔ 거기서 냈던 사고를 되풀이하지 않는다 — **펼친 뒤에도 같은 자리에 「접기」를 그린다.**
                ⭐ 개수를 밝힌다(「3개 더보기」) — 이 카드가 고친 게 «몇 개인지 안 밝힌 것»이라 숨기면 앞뒤가 안 맞는다. */}
            {pantryPicks.length > PICK_FOLD && (
              <button className="press" onClick={() => setPicksOpen((v) => !v)} aria-label={picksOpen ? '장바구니 재료 접기' : '장바구니 재료 더 보기'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginTop: 2, padding: '9px 0', borderTop: '1px solid rgba(0,0,0,.05)', color: 'var(--brown)', fontWeight: 800, fontSize: 15.5 }}>
                {picksOpen ? '접기' : `${pantryPicks.length - PICK_FOLD}개 더보기`}
                <Icon name={picksOpen ? 'chevron-up' : 'chevron-down'} size={13} color="var(--brown)" />
              </button>
            )}
            <button className="press" onClick={addAllPicks} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 11, padding: '11px 0', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 16 }}>
              <Icon name="cart" size={16} color="#fff" />
              이 재료 다 담기
            </button>
            {/* 🧑‍🤝‍🧑 테스터 *"왜 많은 재료 중에 몇 개만 올려놨냐"* (창업자 전달 2026-08-15)
                ⛔ 옛 제목 「이 레시피, 이걸로 만들었어요」가 **재료 목록**으로 읽혔다 —
                   실측하니 평균 재료 11.6줄 → 픽 2.9개(전복솥밥은 28줄 → 2개)라 「몇 개만 올렸다」로 보인다.
                ⭐ 창업자 관찰이 정확했다 — *"주부의 장바구니에서 볼수있다는 내용이 없네"*.
                   카드 어디에도 「주부의 장바구니」라는 말이 없어서 **어디서 온 목록인지 알 방법이 없었다.**
                ✅ 문구는 창업자 확정 — 제목 ＋ 「계속 추가된다」로 «지금 몇 개뿐인 게 아니다»를 밝힌다. */}
            <div style={{ fontSize: 16.5, color: 'var(--text-sub)', textAlign: 'center', marginTop: 7, lineHeight: 1.5 }}>평소에 제가 쓰는 재료들이에요<br />레시피에도 계속 추가돼요</div>
          </div>
        )}

        {r.steps?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="sec-title-row" style={{ display: 'flex', alignItems: 'center' }}>
                <DetailDecor where="head-만드는법" />
                <SecTitle>만드는 법</SecTitle>
              </div>
              <button className="mini-buy press" onClick={() => setTimer(true)}>타이머</button>
            </div>
            <div>
              {/* ※ [2026-09-01 창업자 판정 ⓐ] 「※」로 시작하던 줄은 «걸음»이 아니라 앞 걸음의 «곁말»이다.
                  파서가 `\n` 으로 접어 보내므로 여기선 첫 줄만 그대로 두고 나머지를 작게 깐다. */}
              {r.steps.map((s, i) => {
                const [첫줄, ...곁말] = String(s).split('\n')
                return (
                  <div key={i} className="step">
                    <div className="n">{i + 1}</div>
                    <div className="txt">
                      {/* ✂️· 요리모드와 «같은 규칙» — 항목은 통째로, 끊을 거면 가운뎃점에서 (src/stepBreak.jsx) */}
                      {항목묶어(첫줄)}
                      {곁말.map((t, j) => <div key={j} className="step-tip">{t}</div>)}
                    </div>
                  </div>
                )
              })}
              {/* 🏁 다 읽고 «도착하는» 자리 — 줄은 하나도 안 건드리고 마지막 단계 뒤에만 붙는다 */}
              <DetailDecor where="done" text={r.title} />
            </div>
          </>
        )}

        {/* 🏁 만드는 법이 «0줄»인 레시피(소스·양념처럼 섞으면 끝)에도 완성 칸을 준다.
            ⛔⛔ 예전엔 완성 칸이 만드는 법 절 «안»에만 있어서, 순서가 없으면 절과 함께 통째로 사라졌다.
               창업자 2026-08-10 — *"소스레시피만(만드는법 없음) 추가하면 꼬르곰(다 됐어요)이 안뜨는거야"*
            ⭐ 거꾸로다 — v10.03 에 완성 칸을 넣은 이유가 *"레시피가 다 글밖에 없어 심심하다"* 였는데,
               **만드는 법 없는 레시피가 제일 심심하다**(재료만 덩그러니). 가장 필요한 자리에서만 빠져 있었다.
            ⚠️ 재료도 없으면 안 그린다 — 아직 아무것도 안 적은 빈 레시피에 「완성!」은 앞뒤가 안 맞는다. */}
        {!r.steps?.length && r.ingredients?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <DetailDecor where="done" text={r.title} />
          </div>
        )}

        {r.memo && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>메모</div>
            <div className="card" style={{ padding: 14, fontSize: 16, lineHeight: 1.6, color: 'var(--text)', background: 'var(--cream)', border: 'none', whiteSpace: 'pre-line' }}>
              {r.memo}
            </div>
          </>
        )}

        {/* ⭐⭐ [창업자 확정 2026-09-03 · ⓐ] **여기가 이제 «유일한» 문이다.**
            ⛔ 전엔 *"유튜브면 이 절을 감춘다 — 위 영상 칸에 「YouTube에서 보기」가 이미 있다"* 였다.
               그 영상 칸을 통째로 뺐으므로(위 III.E.4.j 절 참조) **감출 이유가 사라졌다.**
               감춘 채로 두면 유튜브 편은 **원본으로 가는 문이 아예 없어진다.**
            ⭐ 이제 유튜브·인스타·블로그가 «같은 모양»이다 — 눌러서 밖에서 본다. */}
        {r.sourceUrl && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>원본 링크</div>
            <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="card press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, textDecoration: 'none', color: 'var(--text)' }}>
              <Icon name="link" size={20} color="var(--sand)" />
              {/* 🏷 원작자가 있으면 «주소 대신» 이름을 보여준다 — 주소는 읽어도 누군지 모른다
                  🏷🏷 [창업자 2026-09-03] *"원본링크에-출처도 붙이자"* — 이름만 있으면 «어디»서 왔는지 모른다.
                    ⭐ 주소에서 «읽어» 붙인다 — 손으로 적는 칸을 새로 만들지 않는다(손으로 적으면 반드시 낡는다).
                    ⛔ 모르는 곳이면 아무 말도 안 붙인다(「기타」 같은 말을 지어내지 않는다). */}
              <span style={{ flex: 1, fontSize: 16.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {출처이름(r.sourceUrl) && <span style={{ color: 'var(--text-sub)' }}>{출처이름(r.sourceUrl)} · </span>}
                {r.sourceName || r.sourceUrl}
              </span>
              <Icon name="chevron-right" size={18} color="var(--sand)" />
            </a>
          </>
        )}

      </div>

      {/* 하단 액션 — 요리 시작 / 만들었어요 */}
      <div className="action-bar" style={{ display: 'flex', gap: 10 }}>
        {r.steps?.length > 0 && (
          <button className="btn-primary press" data-coach="cook" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }} onClick={() => nav.push({ name: 'cook', id: r.id })}>
            <Icon name="play" size={16} />
            요리모드 시작
          </button>
        )}
        <button
          className={r.steps?.length > 0 ? 'btn-ghost press' : 'btn-primary press'}
          style={{ flex: r.steps?.length > 0 ? '0 0 auto' : 1, paddingLeft: 18, paddingRight: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={onCook}
        >
          <Icon name="check" size={16} />
          만들었어요
        </button>
      </div>

      {/* 첫 방문 코치마크 — 화면 어두워지고 중요 버튼이 반짝이며 안내 */}
      {coach && <CoachMarks storageKey={COACH_KEY} steps={COACH_STEPS} onDone={() => setCoach(false)} />}

      {decorOpen && (
        <DecorEditor
          closeRef={decorCloseRef}
          recipe={r}
          onSave={(items, bg, thumb) => {
            updateRecipe(r.id, { decor: items, decorBg: bg || 'none', thumb })
            // 🎁 레꾸(꾸미기)를 저장했다 — 평생 1회(서버가 판정)
            열쇠받기(EARN.레꾸).then((받음) => { if (받음) nav.showToast(`레시피를 처음 꾸며봤어요 · ${KEY_NAME} 1${KEY_UNIT}를 더 받았어요`, 5200) })
            setDecorOpen(false)
            const dressed = items.length || (bg && bg !== 'none') || thumb === 'none'
            nav.showToast(dressed ? '표지를 예쁘게 꾸몄어요' : '꾸미기를 비웠어요')
            // 🚪 리뷰 문 — 「레꾸를 «꾸민»」 사람에게만. ⛔비운 사람에겐 안 청한다(그건 되돌린 것이다)
            if (dressed) nav.askReviewSoon?.('레꾸')
          }}
          onClose={() => setDecorOpen(false)}
        />
      )}

      {timer && <TimerSheet label={r.title} onClose={() => setTimer(false)} />}

      {/* 한마디 청하기 — 기록을 «직접 열었다 닫는» 순간에만 뜬다.
          ⛔ 요리 직후로 두면 안 된다 — 「만들었어요」를 토스트만으로 만든 순간(2026-08-06),
             이 시트가 그 자리를 그대로 물려받아 마찰이 하나도 안 줄어든다.
          ⭐ v9.02 의 원래 의도(*"기록을 막 남긴 뒤, 흐름을 끊지 않는 자리"*)는 그대로다.
             달라진 건 그 자리를 «앱이 정하지 않고 유저가 연다»는 것뿐.
          시트가 스스로 '물어봤음'을 남겨서 어떻게 닫아도 다시 안 묻는다. */}
      {askReview && !logEntry && <ReviewAskSheet title={askReview} onClose={() => setAskReview(null)} />}

      {confirmDel && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${r.title}』 레시피를 삭제할까요?`}
          confirmLabel="삭제하기"
          danger
          onConfirm={doDelete}
          onClose={() => setConfirmDel(false)}
        />
      )}

      {/* 📷→📔 ② 표지에 넣은 사진을 «일기에도» (창업자 확정 2026-08-23)
          ⭐ 표지는 1200px 인데 일기는 900px 이다 → `downscale` 을 한 번 태운다(같은 함수를 쓴다) */}
      {askDiaryPhoto && (
        <ConfirmSheet
          title="일기에도 넣을까요?"
          message={`${dateLabel(latestEntry.at)}에 만든 기록이 있어요.\n넣으면 일기 달력과 앨범에 이 사진으로 떠요.`}
          confirmLabel="일기에도 넣기"
          onConfirm={async () => {
            updateDiary(latestEntry.id, { photo: await downscale(askDiaryPhoto) })
            nav.showToast('표지와 일기에 담았어요')
          }}
          onClose={() => setAskDiaryPhoto(null)}
        />
      )}

      {/* 📔✂️ ③ 표지를 아이콘으로 «되돌릴» 때 일기 사진도 뺄지 (창업자 확정 2026-08-23)
          📮 *"레꾸이미지에서 다시 예전 아이콘으로 바꾸면 일기에는 반영이 안돼"*
          ⭐⭐ **기록은 그대로 두고 «사진만» 뺀다** — 통째 삭제가 아니다(별점·메모·날짜는 산다) */}
      {askDiaryRemove && (
        <ConfirmSheet
          title="일기 사진도 뺄까요?"
          message={`${dateLabel(latestEntry.at)} 일기에 이 사진이 들어가 있어요.\n빼면 다시 음식 아이콘으로 떠요. 별점·메모는 그대로 남아요.`}
          confirmLabel="사진 빼기"
          onConfirm={() => {
            updateDiary(latestEntry.id, { photo: null })
            nav.showToast('표지와 일기를 아이콘으로 바꿨어요')
          }}
          // ⛔ 여기서 토스트를 띄우지 않는다 — `ConfirmSheet` 는 확인 뒤에도 `onClose` 를 부른다(토스트가 두 번 뜬다)
          onClose={() => setAskDiaryRemove(false)}
        />
      )}

      {logEntry && (
        <DiaryEntrySheet
          entry={logEntry}
          // ⛔⛔ [2026-09-03] 여기 있던 「한마디 청하기」를 **뺐다** — 창업자 확정으로 자리가 옮겨갔다.
          //   📮 창업자 = *"일기를 3개나 쓰는 건 좀 무리같아"* → *"ㄱㄱ 2개??ㅋㅋ"*(내 레시피 2개)
          //   🔢 이 문은 다섯을 다 밟아야 열렸다 — 기록 3장 · 그 레시피에 한 줄 «직접» 써넣기 ·
          //      상세로 가기 · 포스트잇 누르기 · 시트 닫기. 「만들었어요」가 만드는 기록은 메모가 빈 칸이라
          //      둘째 걸음이 저절로는 절대 안 채워졌다(`_repro-리뷰띄우기-0827` 실측).
          //   ⭐ 새 자리 = **레시피를 저장한 직후**(`EditorScreen` → `App`). 사람들이 실제로 지나가는 길이다.
          onClose={() => setLogEntry(null)}
          onDelete={() => { removeDiary(logEntry.id); setLogEntry(null); nav.showToast('기록을 삭제했어요') }}
        />
      )}

      {guide && <KitchenGuideSheet onClose={() => setGuide(false)} />}

      {shareSheet && (
        <Portal>
          <div className="sheet-mask" onClick={() => setShareSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 18.5, fontWeight: 800, textAlign: 'center', color: 'var(--text)' }}>친구랑 공유하기</div>
              <div style={{ fontSize: 15.5, color: 'var(--text-sub)', textAlign: 'center', margin: '4px 0 16px' }}>예쁜 카드로 카톡·인스타에 톡 보내요</div>
              <button className="press" onClick={() => { setShareSheet(false); setDrawOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', marginBottom: 10, textAlign: 'left' }}>
                <img src={uiGomThumb} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--text)' }}>랜덤 카드 뽑기</span><br /><span style={{ fontSize: 15.5, color: 'var(--text-sub)' }}>꼬르곰·펭펭이 매번 다르게 · 안 꾸며도 예쁘게</span></span>
              </button>
              <button className="press" onClick={isDecorated ? doShareCover : () => { setShareSheet(false); setDecorOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', textAlign: 'left' }}>
                <img src={uiGomHeart} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--text)' }}>내가 꾸민 표지로</span><br /><span style={{ fontSize: 15.5, color: 'var(--text-sub)' }}>{isDecorated ? '배경·스티커·효과 그대로 캡처' : '먼저 예쁘게 꾸며볼까요 →'}</span></span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {drawOpen && (
        <Portal>
          <ShareDrawCard
            recipe={r}
            onShared={() => { 자랑보냄.current = true }}
            onClose={() => {
              setDrawOpen(false)
              // 🎴 보낸 사람에게만 · 카드를 «닫는» 순간에(시트 위에 시트가 되지 않게)
              if (자랑보냄.current && shouldAskReviewNow()) setAskReview('레꾸 자랑 보냈어요')
              자랑보냄.current = false
            }}
            onSaveCover={(img) => { const 말 = 카드표지토스트(r); updateRecipe(r.id, 카드표지로(img)); nav.showToast(말) }}
          />
        </Portal>
      )}

    </div>
  )
}
