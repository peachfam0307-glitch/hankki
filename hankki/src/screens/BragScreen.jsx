import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Thumb from '../components/Thumb'
import DecorLayer from '../components/DecorLayer'
import ShareDrawCard from '../components/ShareDrawCard'
import Portal from '../components/Portal'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import { shareDecoratedCover } from '../shareCover'

// 🎴 카드자랑 탭 — 바이럴 진입점. 내 레시피를 골라 자랑한다.
// ⭐ 창업자 방향: 주인공은 '내가 꾸민 표지', 랜덤 카드는 옵션(메인 아님).
//    → 큰 랜덤 히어로 버튼 없음. 레시피를 탭하면 [🎨 내 꾸민 표지 / 🎴 랜덤 카드] 둘 중 고른다.
const BRAG_COACH_KEY = 'hankki:coach:brag'
const BRAG_COACH_STEPS = [
  { sel: '[data-coach="brag-list"]', label: '🎴 자랑할 레시피 고르기', desc: '레시피를 탭하면 → 🎨 내가 꾸민 표지 그대로 or 🎴 랜덤 카드로 골라 카톡·인스타에 보내요' },
  { sel: '[data-coach="brag-list"]', label: '🖼 내 레시피 표지로 저장', desc: '랜덤 카드가 마음에 들면 그 자리에서 “표지로 저장”도 돼요' },
]

export default function BragScreen() {
  const { recipes, updateRecipe } = useStore()
  const nav = useNav()
  const [pick, setPick] = useState(null) // 탭한 레시피 → 선택 시트
  const [share, setShare] = useState(null) // 랜덤 카드 모달로 보낼 레시피
  const [coach, setCoach] = useState(() => needsCoach(BRAG_COACH_KEY))
  const coverRef = useRef(null) // 꾸민 표지 캡처용(화면 밖 숨은 레이어)
  const list = useMemo(
    () => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt),
    [recipes],
  )
  const appUrl = location.origin + location.pathname.replace(/[^/]*$/, '')
  const isDecorated = (r) => !!((r?.decor && r.decor.length) || (r?.decorBg && r.decorBg !== 'none') || r?.thumb === 'none')

  // 🎨 내가 꾸민 표지 그대로 보내기 (상세 화면의 doShareCover와 같은 방식 — 화면 밖 표지를 캡처)
  const sendCover = async () => {
    const r = pick
    if (!r) return
    if (!isDecorated(r)) {
      // 안 꾸민 레시피 → 상세를 열어 꾸미기로 유도
      setPick(null)
      nav.push({ name: 'detail', id: r.id })
      nav.showToast('먼저 표지를 예쁘게 꾸며볼까요? 🎨')
      return
    }
    nav.showToast('🎨 내가 꾸민 표지 그대로 · 이미지 만드는 중…')
    const info = [r.time ? `${r.time}분` : null, r.servings ? `${r.servings}인분` : null, r.difficulty || null].filter(Boolean)
    await new Promise((res) => setTimeout(res, 60)) // 숨은 표지 레이아웃(글자 크기 기준 폭)이 잡힐 시간
    try {
      await shareDecoratedCover({ coverEl: coverRef.current, title: r.title, info, appUrl })
    } finally {
      setPick(null)
    }
  }

  // 🎴 랜덤 카드 뽑기 (옵션)
  const drawRandom = () => { const r = pick; setPick(null); setShare(r) }

  return (
    <>
      <div className="topbar">
        <div className="h-title">카드자랑</div>
      </div>
      <div className="pad">
        <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 16 }}>
          🎴 내 레시피를 <b style={{ color: 'var(--text)' }}>내가 꾸민 표지</b>나 <b style={{ color: 'var(--text)' }}>예쁜 랜덤 카드</b>로 친구한테 자랑하고, 표지로도 저장해요.
        </div>

        {/* 안내 — 자랑할 레시피를 눌러주세요(창업자 요청) */}
        <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)', margin: '2px 2px 11px' }}>
          👇 자랑할 레시피를 눌러주세요
        </div>

        {list.length === 0 ? (
          <div className="empty">{'아직 레시피가 없어요.\n가져오기로 담으면 여기서 예쁜 카드로 자랑할 수 있어요 🎴'}</div>
        ) : (
          <div className="grid2" data-coach="brag-list">
            {list.map((r) => (
              <div key={r.id} className="grid-card">
                <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => setPick(r)} aria-label={`${r.title} 자랑하기`}>
                  <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                  <div className="name">{r.title}</div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 레시피 탭 → 선택 시트: 🎨 내 꾸민 표지(주인공) / 🎴 랜덤 카드(옵션) */}
      {pick && (
        <Portal>
          <div className="sheet-mask" onClick={() => setPick(null)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 16.5, fontWeight: 800, textAlign: 'center', color: 'var(--text)' }}>{pick.title} 자랑하기 💌</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-sub)', textAlign: 'center', margin: '4px 0 16px' }}>어떻게 보낼까요?</div>

              {/* 🎨 내가 꾸민 표지 — 주인공(먼저·강조) */}
              <button className="press" onClick={sendCover}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--brown)', border: 'none', marginBottom: 10, textAlign: 'left' }}>
                <span style={{ fontSize: 30 }}>🎨</span>
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: '#fff' }}>내가 꾸민 표지 그대로</span><br /><span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.9)' }}>{isDecorated(pick) ? '배경·스티커·효과 그대로 보내요' : '먼저 예쁘게 꾸며볼까요 →'}</span></span>
              </button>

              {/* 🎴 랜덤 카드 — 옵션 */}
              <button className="press" onClick={drawRandom}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', textAlign: 'left' }}>
                <span style={{ fontSize: 30 }}>🎴</span>
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>랜덤 카드로 뽑기</span><br /><span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>곰펭이 매번 다르게 · 안 꾸며도 예쁘게 · 다시 뽑기</span></span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 랜덤 카드 모달 — 공유(💌) + 표지로 저장(🖼) */}
      {share && (
        <Portal>
          <ShareDrawCard
            recipe={share}
            onClose={() => setShare(null)}
            onSaveCover={(img) => { updateRecipe(share.id, { thumb: 'photo', image: img }); nav.showToast('카드를 표지로 저장했어요 ✨') }}
          />
        </Portal>
      )}

      {/* 꾸민 표지 캡처용 숨은 레이어(화면 밖) — 상세 화면 coverRef와 동일 구성 */}
      {pick && isDecorated(pick) && (
        <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, width: 380, opacity: 0, pointerEvents: 'none' }}>
          <div ref={coverRef} style={{ position: 'relative', width: 380 }}>
            <Thumb recipe={pick} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
            <DecorLayer items={pick.decor || []} />
          </div>
        </div>
      )}

      {coach && list.length > 0 && <CoachMarks storageKey={BRAG_COACH_KEY} steps={BRAG_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}
