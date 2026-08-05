import { useState, useRef, useEffect } from 'react'
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
import SendNowSheet from '../components/SendNowSheet'
import { scaleIngredient } from '../scale'
import { FoodIconSheet } from '../components/FoodIconPicker'
import { dateLabel, openExternal } from '../utils'
import { shouldAskReview } from '../nudges'
import ReviewAskSheet from '../components/ReviewAskSheet'
import { SOURCES } from '../data/seed'

import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ShareDrawCard, { RecipeCard } from '../components/ShareDrawCard'
// 🐻 UI 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지)
import uiGomHeart from '../assets/ui/gom_heart.png'
import uiGomThumb from '../assets/ui/gom_thumbsup.png'

// 첫 방문 코치마크 — 숨어 있는 중요 기능을 반짝이며 알려준다(창업자 딸 아이디어 ⭐)
const COACH_KEY = 'hankki:coach:detail'
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
  const [askReview, setAskReview] = useState(false) // 세 번째 요리 기록 직후 한 번만
  // 인라인 오버레이(꾸미기) — 뒤로가기로 닫기.
  // (타이머·삭제확인·기록·가이드 시트는 각자 자체 처리)
  // 🔙 꾸미다가 뒤로가기 → **바로 닫지 않고 물어본다** (창업자 2026-07-30
  //    *"레시피꾸미다가 뒤로가기하면 저장하고 나갈건지 그냥 나갈건지 뜨면 좋겠어"*).
  //    ⚠️ 예전엔 여기서 `setDecorOpen(false)` 로 **곧장 닫아서**, 취소 버튼에만 있던
  //    "저장하지 않고 나갈까요?" 를 건너뛰고 꾸민 게 날아갔다.
  //    → 에디터가 채워주는 `decorCloseRef`(= 물어보는 닫기)를 부른다.
  const decorCloseRef = useRef(null)
  useLayerBack(decorOpen, () => { if (decorCloseRef.current) decorCloseRef.current(); else setDecorOpen(false) })
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

  const onCook = () => {
    // 오늘 이미 기록이 있으면(요리모드 완료 등) 새로 만들지 않고 그 기록을 이어서 쓴다 — 하루 두 번 집계 방지
    const today = new Date().toDateString()
    const existing = myEntries.find((d) => new Date(d.at).toDateString() === today)
    if (existing) {
      setLogEntry(existing)
      nav.showToast('오늘 기록에 이어서 남겨요')
      return
    }
    const entry = { id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null }
    addDiary(entry)
    cook(r.id)
    setLogEntry(entry)
    nav.showToast('만들었어요! 요리 기록에 남겼어요')
    // 세 번째 요리 기록이면 한 번만 한마디를 청한다 — 세 번 해먹은 사람은 진짜 쓰는 사람이고,
    // 요리를 막 끝낸 순간이 가장 기분 좋은 자리다. 거절하면 다시 묻지 않는다.
    // (기록 시트를 먼저 쓰게 두고, 그 시트를 닫을 때 뜬다 — 흐름을 끊지 않으려고.)
    if (shouldAskReview(diary.length + 1)) setAskReview(true)
  }

  const del = () => setConfirmDel(true)

  // 🍱 표지 아이콘 바꾸기 — 예전엔 편집 진입 → 썸네일 탭 → 고르기 → 맨 아래 저장까지 가야 했다
  // (창업자 "레시피 음식사진 변경이 불편해"). 이제 상세 표지에서 한 번 눌러 고르면 즉시 저장된다.
  // 갤러리 사진이 아니라 우리 음식 아이콘으로 연결(창업자 지적) — 사진 쓰고 싶으면 편집 화면에서.
  const pickIcon = (k) => {
    updateRecipe(r.id, { thumb: 'icon', icon: k, touched: true })
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

  // ⛔ 「주부의 장바구니 픽」(제품 사러가기)은 2026-08-03 에 레시피에서 뺐다 — 아래 §광고 주석 참고.
  //    `picksForIngredients`·`productLink`·`productMall` 은 **장보기 화면이 계속 쓴다**(지우지 말 것).

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
      <div ref={coverRef} style={{ position: 'relative' }}>
        <Thumb recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
        <DecorLayer items={r.decor || []} />
        {/* 표지 아이콘 바꾸기 — 작은 원형 하나로(레꾸가 주인공이라 표지를 최대한 안 가린다·창업자 2026-07-28).
            ⚠️ 갤러리 사진이 아니라 우리 음식 아이콘 픽커로 연결한다(창업자 지적). */}
        <button
          className="press"
          onClick={() => setIconSheet(true)}
          data-nocapture
          aria-label="표지 아이콘 바꾸기"
          style={{ position: 'absolute', bottom: 12, left: 12, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: 'var(--brown)', borderRadius: 999, boxShadow: '0 3px 10px rgba(0,0,0,.18)' }}
        >
          <Icon name="photo" size={17} color="var(--brown)" stroke={2.2} />
        </button>
        {/* 표지 꾸미기 — 솔직한 버튼으로 눈에 띄게(포인트색 채운 알약). 캡처에선 제외(data-nocapture) */}
        <button
          className="press"
          onClick={() => setDecorOpen(true)}
          data-coach="decor"
          data-nocapture
          aria-label="레시피 꾸미기"
          // 표지를 덜 가리게 한 단계 줄였다(창업자 2026-07-28). 왼쪽 표지 아이콘 버튼과 높이(34)를 맞춰 한 줄로 떨어지게.
          style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 5, height: 34, background: 'var(--brown)', color: '#fff', fontSize: 12.5, fontWeight: 800, padding: '0 13px', borderRadius: 999, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="h-section">재료</div>
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

        {/* ⛔⛔ **레시피 안의 「사러가기」 광고를 뺐다** — 창업자 2026-08-03 *"큐레이션엔 그냥 두고,
            **레시피에 광고만 빼자**"*. 앞선 맥락 = *"우리 레시피에서 한살림꺼는 다 빼야할 듯.
            **사러가기나 담기되잖아**"* — 한살림 온라인몰은 **조합원만** 살 수 있어서(가입비 3천원＋출자금 3만원)
            비조합원이 누르면 **막다른 길**이 된다.
            ⭐ 그래서 「제품을 고르러 오는 자리(장보기 → 주부의 장바구니)」에만 남기고,
               「내 레시피를 보는 자리」에서는 뺐다. **레시피는 광고판이 아니다.**
            ✅ 담는 기능은 안 없어졌다 — 재료 절의 **「장보기 담기」** 버튼이 그대로 있다.
            ⛔ 되살릴 땐 창업자에게 먼저 물을 것(수익 연결이라 자동 복구 대상이 아니다). */}

        {r.steps?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="h-section">만드는 법</div>
              <button className="mini-buy press" onClick={() => setTimer(true)}>타이머</button>
            </div>
            <div>
              {r.steps.map((s, i) => (
                <div key={i} className="step">
                  <div className="n">{i + 1}</div>
                  <div className="txt">{s}</div>
                </div>
              ))}
            </div>
          </>
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

      {/* 한마디 청하기 — 기록 시트를 먼저 쓰게 두고 그게 닫힌 뒤에 뜬다(흐름을 끊지 않으려고).
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
          onClose={() => setLogEntry(null)}
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
