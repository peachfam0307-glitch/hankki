import { useEffect, useMemo, useRef, useState } from 'react'
import { COACH } from '../coach'
import { useStore } from '../store'
import { useNav } from '../App'
import Thumb from '../components/Thumb'
import DecorLayer from '../components/DecorLayer'
import ShareDrawCard, { RecipeCard, 카드표지로 } from '../components/ShareDrawCard'
import Portal from '../components/Portal'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import Icon from '../components/Icon'
import { matchKo } from '../utils'
import { shareDecoratedCover, buildCoverPayload } from '../shareCover'
import { warmFontCSS } from '../fontEmbed'
import SendNowSheet from '../components/SendNowSheet'
import { useLayerBack } from '../useBackHandler'
// 🐻 UI 스티커 = 우리 물결 꼬르곰(유니코드 이모지 금지)
import uiGomHeart from '../assets/ui/gom_heart.png'
// 🐻 엄지척 = **물결 정본**(창업자 2026-08-14 · `gt_01`). 옛 `ui/gom_thumbsup` 은 매끈 곰이었다.
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png'
import uiHandPoint from '../assets/ui/hand_point.png'
import uiGomProud from '../assets/ui/wave/gom_proud.png' // 🐻 꼬르곰(뿌듯) — 레꾸자랑 상단
import TabTips from '../components/TabTips'

// 🎴 카드자랑 탭 — 바이럴 진입점. 내 레시피를 골라 자랑한다.
// ⭐ 창업자 방향: 주인공은 '내가 꾸민 표지', 랜덤 카드는 옵션(메인 아님).
//    → 큰 랜덤 히어로 버튼 없음. 레시피를 탭하면 [🎨 내 꾸민 표지 / 🎴 랜덤 카드] 둘 중 고른다.
const BRAG_COACH_KEY = COACH.brag
const BRAG_COACH_STEPS = [
  { sel: '[data-coach="brag-list"]', img: uiGomHeart, label: '자랑할 레시피 고르기', desc: '레시피를 탭하면 → 내가 꾸민 표지 그대로 or 랜덤 카드로 골라 카톡·인스타에 보내요' },
  { sel: '[data-coach="brag-list"]', img: uiGomThumb, label: '내 레시피 표지로 저장', desc: '랜덤 카드가 마음에 들면 그 자리에서 “표지로 저장”도 돼요' },
]

export default function BragScreen() {
  const { recipes, updateRecipe } = useStore()
  const nav = useNav()
  const [pick, setPick] = useState(null) // 탭한 레시피 → 선택 시트
  // ⛔⛔ **뒤로가기가 홈으로 샜다** (창업자 할일 1번 · 2026-08-23
  //    📮 *"레꾸자랑에서 고르고하고 뒤로가면 홈으로 감."*)
  //   🔢 뿌리 = 아래 선택 시트를 `.sheet-mask` 로 **맨손으로** 그리고 있었다.
  //      `nav.openModal` 을 안 부르니 시트가 «뒤로가기 층»에 아예 없다
  //      → 뒤로가기가 시트를 못 보고 `App.jsx:216` 4번 갈래(「다른 탭이면 홈으로」)로 떨어진다.
  //      ⭐ 시트는 «닫히긴» 했다 — 탭이 홈으로 갈아치워지며 통째로 언마운트된 것뿐이라
  //         눈으로는 「잘 닫혔는데 왜 홈이지?」로 보인다. 그래서 재현판이 **탭 이름**을 잰다.
  //   ✅ 답 = 다른 시트들과 «같은 문법». `useLayerBack` 이 열릴 때 히스토리 칸을 쌓고
  //      뒤로가기가 그 칸을 소비해 시트만 닫는다(＝탭은 그대로).
  useLayerBack(!!pick, () => setPick(null))
  const [share, setShare] = useState(null) // 랜덤 카드 모달로 보낼 레시피
  const [busy, setBusy] = useState(false) // 꾸민 표지 이미지 만드는 중(로딩 표시)
  const [pending, setPending] = useState(null) // 📮 다 만들었는데 허가가 끊긴 표지 — 「지금 보내기」
  const [coach, setCoach] = useState(() => needsCoach(BRAG_COACH_KEY))
  const coverRef = useRef(null) // 꾸민 표지 캡처용(화면 밖 숨은 레이어)
  const recipeCardRef = useRef(null) // 2장째 레시피카드(재료·만드는 법) 캡처용
  // 🔍 레꾸자랑 «안에서» 찾기 (창업자 요청 2026-08-10 — *"레꾸자라에 검색도 넣고."*)
  //   ⭐ 레시피 탭(v9.68)·주부의 장바구니(v9.70)에 이미 넣은 것과 «같은 처방»이다. 새로 만들지 않았다.
  //      우상단 돋보기로 그 자리에서 열리고, 치는 대로 걸러진다(화면을 안 떠난다).
  //   ⚠️ 여기 목록은 레시피가 쌓일수록 길어지는데, 자랑하려는 건 «방금 꾸민 그 한 장»이라
  //      스크롤로 찾는 게 제일 답답한 화면이었다.
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const sorted = useMemo(
    () => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt),
    [recipes],
  )
  // 초성으로도 찾는다 — 「ㄱㅂ」으로 「김밥」이 걸린다(`matchKo`, 장보기 탭과 같은 함수)
  const list = query
    ? sorted.filter((r) => matchKo([r.title, r.category, r.folder, ...(r.tags || []), ...(r.ingredients || [])].filter(Boolean).join(' '), query))
    : sorted
  const appUrl = location.origin + location.pathname.replace(/[^/]*$/, '')
  const isDecorated = (r) => !!((r?.decor && r.decor.length) || (r?.decorBg && r.decorBg !== 'none') || r?.thumb === 'none')
  const hasRecipe = (r) => !!((r?.ingredients || []).length || (r?.steps || []).length)
  const infoOf = (r) => [r.time ? `${r.time}분` : null, r.servings ? `${r.servings}인분` : null, r.difficulty || null].filter(Boolean)

  // ⭐⭐ 미리 캡처 — 선택 시트(「꾸민 표지 / 랜덤 카드」)가 «뜨는 순간» 표지를 백그라운드로 그린다.
  //   ⛔ 왜 = 폰 공유는 «누른 직후»에만 열리는데 표지 그리기가 20초 넘게 걸린다.
  //      다 그릴 때쯤엔 허가가 끊겨 「지금 보내기」를 한 번 더 눌러야 했다(창업자 2026-08-05).
  //   ⭐ 고르는 «동안» 그려두면 누른 순간엔 이미 다 돼 있다 — 랜덤 카드가 v9.63부터 쓰던 검증된 처방.
  // 🔤 글꼴 꾸러미 미리 데우기 — 캡처보다 «먼저» 끝나 있어야 캡처가 빨라진다(fontEmbed.js)
  useEffect(() => { warmFontCSS() }, [])

  const prepRef = useRef(null)
  useEffect(() => {
    prepRef.current = null
    if (!pick || !isDecorated(pick)) return
    let alive = true
    const t = setTimeout(() => {
      if (!alive || !coverRef.current) return
      const p = buildCoverPayload({
        coverEl: coverRef.current,
        title: pick.title,
        info: infoOf(pick),
        appUrl,
        recipeEl: hasRecipe(pick) ? recipeCardRef.current : null,
      })
      p.catch(() => { /* 실패하면 누를 때 다시 만든다 */ })
      prepRef.current = p
    }, 80) // 숨은 표지·레시피카드가 붙고 레이아웃이 잡힐 시간
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick])

  // 🎨 내가 꾸민 표지 그대로 보내기 (상세 화면의 doShareCover와 같은 방식 — 화면 밖 표지를 캡처)
  const sendCover = async () => {
    const r = pick
    if (!r) return
    if (!isDecorated(r)) {
      // 안 꾸민 레시피 → 상세를 열어 꾸미기로 유도
      setPick(null)
      nav.push({ name: 'detail', id: r.id })
      nav.showToast('먼저 표지를 예쁘게 꾸며볼까요?')
      return
    }
    const prepared = prepRef.current // ⛔ 시트가 뜰 때 시작한 미리 캡처를 손에 쥔다
    setBusy(true) // 로딩 오버레이(먹통처럼 안 보이게)
    const info = infoOf(r)
    await new Promise((res) => setTimeout(res, 60)) // 숨은 표지 레이아웃(글자 크기 기준 폭)이 잡힐 시간
    try {
      // 재료·만드는 법이 있으면 레시피카드도 2장째로 함께(친구가 진짜 해먹게)
      // ⭐ 미리 캡처가 다 됐으면 여기서 «기다림 없이» 공유창이 열린다
      const res = await shareDecoratedCover({ coverEl: coverRef.current, title: r.title, info, appUrl, recipeEl: hasRecipe(r) ? recipeCardRef.current : null, prepared })
      // ⛔ 공유가 «저장»으로 떨어지면 그 이유를 말해준다 — 창업자 2026-08-03
      //    *"내 레시피꾸민거 보내려고하면 다운로드하라고 뜨고"*. 갑자기 다운로드 창이 뜨면
      //    유저는 «고장»으로 읽는다. 저장된 것 자체는 정상 동작이니 **한 줄만 붙이면 오해가 안 생긴다.**
      if (res && res.pending) setPending(res.pending)   // 📮 허가가 끊겼다 → 한 번 더 누를 기회를 준다
      else if (res && res.ok && res.shared === false) nav.showToast('공유가 안 되는 폰이라 사진으로 저장했어요')
      else if (res && res.ok === false) nav.showToast('카드를 만들지 못했어요. 잠시 뒤 다시 눌러주세요')
    } finally {
      setBusy(false)
      setPick(null)
    }
  }

  // 🎴 랜덤 카드 뽑기 (옵션)
  const drawRandom = () => { const r = pick; setPick(null); setShare(r) }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {/* 🐻 [2026-08-13 창업자 제보] *"장보기 레꾸자랑에는 없어…(글씨옆에)"*
              ⭐ 컷 이름 그대로 «뿌듯한» 꼬르곰 — 자랑 탭에 뜻이 딱 맞는다(별 두 개도 붙어 있다).
              🧍‍♀️ [2026-08-14 확정] 캐릭터는 **글자 «왼쪽»** — 창업자 *"캐릭터는 같은방향에넣자.왼쪽으로"*
                 ⛔ 전엔 여기만 제목 «뒤»였다(레시피·일기·홈은 앞). 의도가 아니라 「글씨옆에」를 뒤로 읽은 것. */}
          <img src={uiGomProud} alt="" draggable={false} width={29} height={44} className="hk-m-tongtong"
            style={{ display: 'block', objectFit: 'contain', margin: '-5px 0' }} />
          <div className="h-title">레꾸자랑</div>
        </div>
        {/* 🎀 [2026-08-18 창업자 제보] *"레꾸자랑은 도움말이 없네?"* — 여섯 탭 중 여기만 없었다. */}
        <TabTips tab="brag" />
        <button
          className="icon-btn press"
          style={{ marginLeft: 'auto' }}
          onClick={() => setSearchOpen((v) => { if (v) setQ(''); return !v })}
          aria-label={searchOpen ? '찾기 닫기' : '자랑할 레시피 찾기'}
        >
          <Icon name={searchOpen ? 'x' : 'search'} size={22} />
        </button>
      </div>

      {searchOpen && (
        <div className="pad fade" style={{ marginBottom: 10 }}>
          <div className="searchbar">
            <Icon name="search" size={19} color="var(--text-sub)" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="자랑할 레시피 찾기 · 제목 · 재료 · 태그"
              autoComplete="off"
              autoFocus
            />
            {q && (
              <button className="press" onClick={() => setQ('')} aria-label="지우기">
                <Icon name="x" size={18} color="var(--text-sub)" />
              </button>
            )}
          </div>
          {query && (
            <div className="t-sub" style={{ margin: '10px 2px 0', fontSize: 15.5 }}>
              ‘{q.trim()}’ — 내 레시피 {list.length}개
            </div>
          )}
        </div>
      )}

      <div className="pad">
        {/* 찾는 중엔 안내문을 감춘다 — 이미 무엇을 하려는지 아는 사람이다 */}
        {!query && (
          <>
            <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.55, marginBottom: 16 }}>
              내 레시피를 <b style={{ color: 'var(--text)' }}>내가 꾸민 표지</b>나 <b style={{ color: 'var(--text)' }}>예쁜 랜덤 카드</b>로 친구한테 자랑하고, 표지로도 저장해요.
            </div>

            {/* 안내 — 자랑할 레시피를 눌러주세요(창업자 요청) */}
            <div style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: '2px 2px 11px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={uiHandPoint} alt="" draggable={false} style={{ width: 22, height: 22, objectFit: 'contain', flex: '0 0 auto' }} />
              자랑할 레시피를 눌러주세요
            </div>
          </>
        )}

        {list.length === 0 ? (
          <div className="empty">
            {query
              ? `‘${q.trim()}’ 로 찾은 레시피가 없어요.\n제목·재료·태그로 찾아요 · 초성(ㄱㅂ)도 돼요`
              : '아직 레시피가 없어요.\n가져오기로 담으면 여기서 예쁜 카드로 자랑할 수 있어요'}
          </div>
        ) : (
          <div className="grid2">
            {/* ⛔⛔ `data-coach` 를 **격자 통째**에 붙였다가 안내코치가 깨졌다 (창업자 폰 2026-08-10)
                — 레시피가 217개면 이 div 높이가 **4807px** 이라 코치가 화면을 못 어둡게 하고
                  말풍선이 y −2178 로 사라져 **금색 테두리만** 남았다.
                ✅ 코치는 **첫 카드 하나**를 가리킨다 — 「레시피를 탭하세요」니까 가리킬 것도 카드다.
                ⛔ 이 주석을 `) : (` 바로 뒤로 올리지 말 것 — 표현식 여는 자리라 빌드가 깨진다(실제로 깨뜨렸다). */}
            {list.map((r, i) => (
              <div key={r.id} className="grid-card" {...(i === 0 ? { 'data-coach': 'brag-list' } : {})}>
                <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => setPick(r)} aria-label={`${r.title} 자랑하기`}>
                  <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                  <div className="name">{r.title}</div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 레시피 탭 → 선택 시트: 🎨 내 꾸민 표지(주인공) / 🎴 랜덤 카드(옵션) · 캡처 중(busy)엔 숨기고 로딩만 */}
      {pick && !busy && (
        <Portal>
          <div className="sheet-mask" onClick={() => setPick(null)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 18.5, fontWeight: 800, textAlign: 'center', color: 'var(--text)' }}>{pick.title} 자랑하기</div>
              <div style={{ fontSize: 15.5, color: 'var(--text-sub)', textAlign: 'center', margin: '4px 0 16px' }}>어떻게 보낼까요?</div>

              {/* 내가 꾸민 표지 — 주인공(먼저·강조) */}
              <button className="press" onClick={sendCover}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--brown)', border: 'none', marginBottom: 10, textAlign: 'left' }}>
                <img src={uiGomHeart} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 17.5, fontWeight: 800, color: '#fff' }}>내가 꾸민 표지 그대로</span><br /><span style={{ fontSize: 15.5, color: 'rgba(255,255,255,.9)' }}>{isDecorated(pick) ? '배경·스티커·효과 그대로 보내요' : '먼저 예쁘게 꾸며볼까요 →'}</span></span>
              </button>

              {/* 랜덤 카드 — 옵션 */}
              <button className="press" onClick={drawRandom}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', textAlign: 'left' }}>
                <img src={uiGomThumb} alt="" draggable={false} style={{ width: 44, height: 44, objectFit: 'contain', flex: '0 0 auto' }} />
                <span><span style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--text)' }}>랜덤 카드로 뽑기</span><br /><span style={{ fontSize: 15.5, color: 'var(--text-sub)' }}>꼬르곰·펭펭이 매번 다르게 · 안 꾸며도 예쁘게 · 다시 뽑기</span></span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 📮 표지가 다 됐는데 공유 허가가 끊긴 경우 — 한 번 더 누르면 진짜로 나간다 */}
      <SendNowSheet pending={pending} onClose={() => setPending(null)} />

      {/* 랜덤 카드 모달 — 공유(💌) + 표지로 저장(🖼) */}
      {share && (
        <Portal>
          <ShareDrawCard
            recipe={share}
            onClose={() => setShare(null)}
            onSaveCover={(img) => { updateRecipe(share.id, 카드표지로(img)); nav.showToast('카드를 표지로 저장했어요') }}
          />
        </Portal>
      )}

      {/* 이미지 만드는 중 로딩 오버레이 — 캡처(표지+레시피)에 몇 초 걸려도 먹통처럼 안 보이게 */}
      {busy && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(30,26,22,.55)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div className="ocr-spin" />
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>예쁜 카드 만드는 중…</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 15.5 }}>표지 + 레시피 2장 준비 중이에요</div>
          </div>
        </Portal>
      )}

      {/* 캡처용 숨은 레이어(화면 밖) — ①꾸민 표지(상세 coverRef와 동일 구성) ②레시피카드(2장째) */}
      {pick && isDecorated(pick) && (
        <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, opacity: 0, pointerEvents: 'none' }}>
          <div ref={coverRef} style={{ position: 'relative', width: 380 }}>
            <Thumb recipe={pick} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
            <DecorLayer items={pick.decor || []} />
          </div>
          {hasRecipe(pick) && <div ref={recipeCardRef}><RecipeCard recipe={pick} /></div>}
        </div>
      )}

      {/* ⚠️ 코치는 «찾는 중»엔 안 띄운다 — 검색으로 0개가 되면 짚을 카드가 없다(list 가 아니라 sorted 로 본다) */}
      {coach && !searchOpen && sorted.length > 0 && <CoachMarks storageKey={BRAG_COACH_KEY} steps={BRAG_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}
