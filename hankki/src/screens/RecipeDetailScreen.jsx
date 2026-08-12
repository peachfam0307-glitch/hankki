import { useState, useRef, useEffect } from 'react'
import { COACH } from '../coach'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import TimerSheet from '../components/TimerSheet'
import DiaryEntrySheet, { Stars } from '../components/DiaryEntrySheet'
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
import { dateLabel, openExternal as openUrl } from '../utils'
import { shouldAskReview } from '../nudges'
import ReviewAskSheet from '../components/ReviewAskSheet'
import { SOURCES } from '../data/seed'
import { picksForIngredients, productLink, productMall, curIcon } from '../data/curation'

import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ShareDrawCard, { RecipeCard } from '../components/ShareDrawCard'
// 🐻 UI 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지)
import uiGomHeart from '../assets/ui/gom_heart.png'
import uiGomThumb from '../assets/ui/gom_thumbsup.png'
import DetailDecor from '../components/DetailDecor'
import { hlColor } from '../components/Stickers'

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
  { sel: '[data-coach="cook"]', label: '요리 시작', desc: '큰 글씨 요리모드 · 화면 안 꺼짐 · 단계 타이머' },
]

// 재료 목록에서 '[양념]'·'[소스]'·'[드레싱]'처럼 대괄호만 있는 줄은 소제목(헤더)으로 그린다.
// (장보기 담기·인분 환산에서 제외) — 전 레시피 양념/소스 표기 통일용.
const isIngHeader = (s) => /^\[[^\]]+\]$/.test(String(s).trim())

export default function RecipeDetailScreen({ id }) {
  const { recipes, toggleFavorite, cook, removeRecipe, addShopItems, addShopItem, diary, addDiary, removeDiary, updateRecipe } = useStore()
  const nav = useNav()
  useWakeLock() // 레시피를 보며 요리할 때 화면이 꺼지지 않게
  const [pending, setPending] = useState(null) // 📮 다 만들었는데 허가가 끊긴 표지 — 「지금 보내기」
  const [timer, setTimer] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [logEntry, setLogEntry] = useState(null)
  const [decorOpen, setDecorOpen] = useState(false)
  const [guide, setGuide] = useState(false) // 요리 가이드(계량·손질) 시트
  const [drawOpen, setDrawOpen] = useState(false) // 공유 뽑기카드
  const [shareSheet, setShareSheet] = useState(false) // 공유 두 갈래 시트
  const [coverBusy, setCoverBusy] = useState(false) // 꾸민 표지 이미지 만드는 중(로딩)
  const [askReview, setAskReview] = useState(false) // 기록 시트를 직접 열었다 닫을 때 한 번만
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
  const [iconSheet, setIconSheet] = useState(false) // 표지 아이콘 바꾸기 — 상세에서 바로(편집 안 들어가고)
  const coverRef = useRef(null) // 꾸민 표지(레꾸) 캡처용
  const recipeCardRef = useRef(null) // 2장째 레시피카드(재료·만드는 법) 캡처용
  const r = recipes.find((x) => x.id === id)
  const baseServings = r?.servings || 0
  const [servings, setServings] = useState(baseServings || 1)
  const ratio = baseServings ? servings / baseServings : 1
  // ⛔⛔ 훅은 «전부» 아래 `if (!r)` 보다 위에 있어야 한다 — 밑에 두면 레시피를 지우는 순간
  //    early return 이 걸려 훅 개수가 줄고 React 가 트리째 죽는다(빈 화면).
  //    2026-08-03 창업자 제보 *"홍콩식가지볶음 지웠더니 먹통됨"* 의 정체가 이거였다.
  //    (`picksOpen` 이 뒤쪽 158줄에 있었다 — 큐레이션 픽 4개 상한을 넣으며 8/2 에 들어왔다)

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
    const entry = { id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null }
    addDiary(entry)
    cook(r.id)
    nav.showToast('만들었어요! 한끼 일기에 남겼어요')
  }

  const del = () => setConfirmDel(true)

  // 🍱 표지 아이콘 바꾸기 — 예전엔 편집 진입 → 썸네일 탭 → 고르기 → 맨 아래 저장까지 가야 했다
  // (창업자 "레시피 음식사진 변경이 불편해"). 이제 상세 표지에서 한 번 눌러 고르면 즉시 저장된다.
  // 갤러리 사진이 아니라 우리 음식 아이콘으로 연결(창업자 지적) — 사진 쓰고 싶으면 편집 화면에서.
  const pickIcon = (k) => {
    // ⭐ iconPicked = 「사람이 직접 골랐다」 — 나중에 제목을 손봐도 이 아이콘을 안 덮는다.
    //   (EditorScreen 의 자동 재추천이 직접 고른 것까지 덮던 것 · 창업자 제보 2026-08-05)
    updateRecipe(r.id, { thumb: 'icon', icon: k, iconPicked: true, touched: true })
    nav.showToast('표지 아이콘을 바꿨어요')
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
    try {
      // 꾸민 표지 + 재료·만드는 법(레시피카드) 2장 함께 — 친구가 진짜 해먹게(랜덤 카드와 동일)
      // ⭐ 시트가 뜰 때 시작한 「미리 캡처」가 있으면 그걸 쓴다 — 다 돼 있으면 즉시 공유창이 열린다
      const res = await shareDecoratedCover({ coverEl: coverRef.current, title: r.title, info, appUrl, recipeEl: hasRecipe ? recipeCardRef.current : null, prepared })
      // ⛔ 공유가 «저장»으로 떨어졌으면 이유를 말한다 (BragScreen 과 같은 처리 — 창업자 2026-08-03)
      if (res && res.pending) setPending(res.pending)   // 📮 허가가 끊겼다 → 한 번 더 누를 기회를 준다
      else if (res && res.ok && res.shared === false) nav.showToast('공유가 안 되는 폰이라 사진으로 저장했어요')
      else if (res && res.ok === false) nav.showToast('카드를 만들지 못했어요. 잠시 뒤 다시 눌러주세요')
    } finally {
      setCoverBusy(false)
    }
  }

  // 🛒 이 레시피가 쓴 「주부의 장바구니」 제품 — 재료·메모에 제품명이 있으면 자동으로 붙는다.
  //   ⛔⛔ 2026-08-03 에 이 자리를 통째로 없앴던 것을 2026-08-10 에 되살렸다.
  //      창업자 원문은 *"우리 레시피에서 **한살림꺼는** 다 빼야할 듯"* 인데
  //      내가 그걸 「픽 자리 통째로」로 넓게 읽어 **82편 전부에서 사러가기가 사라졌다**(일주일).
  //      창업자 정정 2026-08-10 — *"그게 **한살림제품만** 빼자는 뜻이었어"* · *"다 빼자는게 아니라"*.
  //   ⭐ 그리고 한살림 문제는 «같은 날» 장보기 화면에서 이미 풀려 있었다 —
  //      `mallLabel()` 의 **「한살림 · 조합원만」** 배지. 누르기 «전»에 보이니 헛걸음이 없다.
  //      여기도 같은 배지를 쓴다 → **막다른 길이 안 생기니 뺄 이유가 없다.**
  //   ⚠️ 자연드림(아이쿱)은 **실버회원 가입으로 누구나 온라인 구매 가능**(조합원과 가격만 다르다)
  //      → 아무 표시도 안 붙인다. 창업자 확인 2026-08-10.
  const pantryPicks = picksForIngredients([...(r?.ingredients || []), r?.memo || ''])
  const addAllPicks = () => {
    pantryPicks.forEach((p) => addShopItem({ name: p.name, url: productLink(p) }))
    nav.showToast(`장바구니 재료 ${pantryPicks.length}개를 장보기에 담았어요`)
  }
  // 구매처 배지 — 장보기 화면 `mallLabel()` 과 «같은 규칙»이라야 한다(한쪽만 고치면 앞뒤가 안 맞는다)
  const mallBadge = (p) => (String(p.url || '').includes('hansalim') ? '한살림 · 조합원만' : productMall(p))

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
      {/* 📮 표지가 다 됐는데 공유 허가가 끊긴 경우 — 한 번 더 누르면 진짜로 나간다 */}
      <SendNowSheet pending={pending} onClose={() => setPending(null)} />

      {coverBusy && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(30,26,22,.55)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div className="ocr-spin" />
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>예쁜 카드 만드는 중…</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5 }}>표지 + 레시피 2장 준비 중이에요</div>
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
          <button className="bar-btn" onClick={() => toggleFavorite(r.id)} aria-label="즐겨찾기">
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, marginLeft: 10, padding: '0 15px', background: 'var(--brown)', color: '#fffdf8', fontSize: 13.5, fontWeight: 800, borderRadius: 999, border: 'none' }}
          >
            <Icon name="share" size={17} color="#fffdf8" stroke={2.3} /> 공유
          </button>
        </div>
      </div>

      {/* 히어로 이미지(표지) — 꾸미기 스티커·포스트잇이 이 위에 얹힌다. ref로 통째 캡처(자랑 공유) */}
      {/* 🖼 `cover-box` = 가로에서 표지 폭을 화면 «높이»에 맞추는 손잡이 (창업자 2026-08-09
          *"꾸미다가 취소하면 화면이 엄청커짐"* — 눕히면 앱이 폭을 다 써서 1:1 표지가 851×851 이 됐다).
          ⛔ 세로에선 아무 일도 안 한다 · 캡처(자랑 공유)는 이 `ref` 안만 찍으므로 그대로다. */}
      <div ref={coverRef} className="cover-box" style={{ position: 'relative' }}>
        <Thumb recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, background: 'var(--cream)', color: 'var(--brown)', fontSize: 12.5, fontWeight: 800, padding: '0 13px 0 9px', borderRadius: 999, border: 'none' }}
        >
          <FoodIcon name={r.icon || guessFoodIcon(r.title)} size={20} />
          아이콘 바꾸기
        </button>
        <button
          className="press"
          onClick={() => setDecorOpen(true)}
          data-coach="decor"
          aria-label="레시피 꾸미기"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, background: 'var(--brown)', color: '#fff', fontSize: 12.5, fontWeight: 800, padding: '0 13px', borderRadius: 999, border: 'none' }}
        >
          <Icon name="palette" size={14} />
          레시피 꾸미기
        </button>
      </div>
      {iconSheet && (
        <FoodIconSheet value={r.icon || guessFoodIcon(r.title)} onChange={pickIcon} onClose={() => setIconSheet(false)} />
      )}

      <div className="pad" style={{ paddingTop: 18, paddingBottom: 120 }}>
        {r.status === 'unsorted' && (
          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
            onClick={() => nav.push({ name: 'editor', id: r.id })}
          >
            <Icon name="edit" size={20} color="var(--brown)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown)' }}>아직 정리 전이에요</div>
              <div className="t-sub" style={{ fontSize: 12.5 }}>제목·재료·태그를 정리하고 레시피로 저장하기</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--brown)" />
          </button>
        )}

        {/* 즐겨찾기는 상단 오버레이 북마크 하나로 통일 (중복 버튼 정리) */}
        <div className="h-title" style={{ fontSize: 24 }}>{r.title}</div>

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

        {/* 내 요리 기록 — 위로 올려 잘 보이게. 별점·만든 횟수·최근 메모 요약, 탭하면 남기기/보기.
            (‘나만의 팁’은 이제 표지 꾸미기 포스트잇·글자로 — 역할이 겹치지 않게 분리) */}
        {(myEntries.length > 0 || cookedN > 0) && (
          <button
            className="card press"
            onClick={() => { if (latestEntry) setLogEntry(latestEntry) }}
            style={{ width: '100%', textAlign: 'left', marginTop: 18, padding: 13, display: 'flex', gap: 12, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
          >
            {latestEntry?.photo ? (
              <img src={latestEntry.photo} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', flex: '0 0 auto' }} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="pen" size={20} color="var(--sand)" /></div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>내 요리 기록</span>
                {latestEntry?.rating > 0 && <Stars value={latestEntry.rating} onChange={() => {}} size={13} />}
              </div>
              <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3 }}>
                {cookedN}번 만들었어요{latestEntry ? ` · ${dateLabel(latestEntry.at)}` : ''}
              </div>
              {latestEntry?.note && (
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>“{latestEntry.note}”</div>
              )}
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>
        )}

        {r.ingredients?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="sec-title-row" style={{ display: 'flex', alignItems: 'center' }}>
                <DetailDecor where="head-재료" />
                <SecTitle>재료</SecTitle>
                <button className="press" onClick={() => setGuide(true)} aria-label="계량·손질 가이드" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'var(--cream)' }}>
                  <Icon name="help" size={14} color="var(--brown)" />
                </button>
              </div>
              <button
                className="mini-buy press"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                data-coach="shop"
                onClick={() => {
                  addShopItems(r.ingredients.filter((ing) => !isIngHeader(ing)).map((ing) => scaleIngredient(ing, ratio)))
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
              {r.ingredients.map((ing, i) => (
                isIngHeader(ing)
                  ? <div key={i} className="ing-head">{ing.trim().replace(/^\[|\]$/g, '')}</div>
                  : <div key={i} className="ing">{scaleIngredient(ing, ratio)}</div>
              ))}
            </div>
          </>
        )}

        {/* 🛒 주부의 장바구니 픽 — 이 레시피가 쓴 제품을 바로 사러가기(재료 바로 밑 · 수익 연결) */}
        {pantryPicks.length > 0 && (
          <div data-coach="pantry" className="card" style={{ marginTop: 20, padding: 14, background: 'var(--cream)', border: '1.5px solid var(--cream-deep)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 15.5, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>
              <Icon name="cart" size={17} color="var(--brown)" />
              이 레시피, 이걸로 만들었어요
            </div>
            {pantryPicks.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(0,0,0,.05)' }}>
                {curIcon(p.icon) && <img src={curIcon(p.icon)} alt="" draggable={false} style={{ width: 30, height: 30, objectFit: 'contain', flex: '0 0 auto' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  {mallBadge(p) && (
                    <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', borderRadius: 5, padding: '1px 6px', ...(mallBadge(p).includes('조합원만') ? { color: '#fff', background: '#c2703f' } : { color: 'var(--brown)', background: 'var(--cream-deep)' }) }}>{mallBadge(p)}</span>
                  )}
                </div>
                <button className="press" onClick={() => openUrl(productLink(p))} style={{ flex: '0 0 auto', padding: '6px 13px', borderRadius: 10, background: 'var(--cream-deep)', color: 'var(--brown)', fontWeight: 800, fontSize: 12.5 }}>사러가기</button>
              </div>
            ))}
            <button className="press" onClick={addAllPicks} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 11, padding: '11px 0', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              <Icon name="cart" size={16} color="#fff" />
              이 재료 다 담기
            </button>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', textAlign: 'center', marginTop: 7, lineHeight: 1.5 }}>담아두고 장보기에서 체크하며 사면 편해요 · 18년차 주부가 진짜 쓰는 재료예요</div>
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
              {r.steps.map((s, i) => (
                <div key={i} className="step">
                  <div className="n">{i + 1}</div>
                  <div className="txt">{s}</div>
                </div>
              ))}
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
            <div className="card" style={{ padding: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--text)', background: 'var(--cream)', border: 'none', whiteSpace: 'pre-line' }}>
              {r.memo}
            </div>
          </>
        )}

        {r.sourceUrl && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>원본 링크</div>
            <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="card press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, textDecoration: 'none', color: 'var(--text)' }}>
              <Icon name="link" size={20} color="var(--sand)" />
              <span style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sourceUrl}</span>
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
            요리 시작
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
            setDecorOpen(false)
            const dressed = items.length || (bg && bg !== 'none') || thumb === 'none'
            nav.showToast(dressed ? '표지를 예쁘게 꾸몄어요' : '꾸미기를 비웠어요')
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
      {askReview && !logEntry && <ReviewAskSheet onClose={() => setAskReview(false)} />}

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

      {logEntry && (
        <DiaryEntrySheet
          entry={logEntry}
          // 닫는 순간 = 기록을 막 남긴 뒤 = 한마디를 청하기 제일 좋은 자리.
          // ⛔ onDelete 는 여기를 안 탄다 — 지우고 나서 리뷰를 청하면 실례다.
          onClose={() => { setLogEntry(null); if (shouldAskReview(diary.length)) setAskReview(true) }}
          onDelete={() => { removeDiary(logEntry.id); setLogEntry(null); nav.showToast('기록을 삭제했어요') }}
        />
      )}

      {guide && <KitchenGuideSheet onClose={() => setGuide(false)} />}

      {shareSheet && (
        <Portal>
          <div className="sheet-mask" onClick={() => setShareSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 16.5, fontWeight: 800, textAlign: 'center', color: 'var(--text)' }}>친구랑 공유하기</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-sub)', textAlign: 'center', margin: '4px 0 16px' }}>예쁜 카드로 카톡·인스타에 톡 보내요</div>
              <button className="press" onClick={() => { setShareSheet(false); setDrawOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', marginBottom: 10, textAlign: 'left' }}>
                <img src={uiGomThumb} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>랜덤 카드 뽑기</span><br /><span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>꼬르곰·펭펭이 매번 다르게 · 안 꾸며도 예쁘게</span></span>
              </button>
              <button className="press" onClick={isDecorated ? doShareCover : () => { setShareSheet(false); setDecorOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', textAlign: 'left' }}>
                <img src={uiGomHeart} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>내가 꾸민 표지로</span><br /><span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{isDecorated ? '배경·스티커·효과 그대로 캡처' : '먼저 예쁘게 꾸며볼까요 →'}</span></span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {drawOpen && <Portal><ShareDrawCard recipe={r} onClose={() => setDrawOpen(false)} onSaveCover={(img) => { updateRecipe(r.id, { thumb: 'photo', image: img }); nav.showToast('카드를 표지로 저장했어요') }} /></Portal>}

    </div>
  )
}
