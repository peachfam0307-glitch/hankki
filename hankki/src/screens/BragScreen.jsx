import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Thumb from '../components/Thumb'
import ShareDrawCard from '../components/ShareDrawCard'
import Portal from '../components/Portal'
import CoachMarks, { needsCoach } from '../components/CoachMarks'

// 🎴 자랑 탭 — 바이럴 진입점. 레시피 골라 예쁜 카드로 친구한테 자랑 + 내 레시피 표지로도 저장.
const BRAG_COACH_KEY = 'hankki:coach:brag'
const BRAG_COACH_STEPS = [
  { sel: '[data-coach="brag-random"]', label: '🎲 랜덤 카드 뽑기', desc: '아무 레시피나 예쁜 카드로! · 🔄 다시 뽑기로 마음에 들 때까지 골라요' },
  { sel: '[data-coach="brag-list"]', label: '🎴 내 레시피 공유', desc: '레시피 골라 카드로 만들어 카톡·인스타에 톡 보내요 (친구가 바로 따라 만들게!)' },
  { sel: '[data-coach="brag-list"]', label: '🖼 내 레시피 표지로 저장', desc: '카드가 마음에 들면 그 자리에서 “표지로 저장” → 내 레시피 표지가 예뻐져요' },
]

export default function BragScreen() {
  const { recipes, updateRecipe } = useStore()
  const nav = useNav()
  const [share, setShare] = useState(null) // 카드로 만들 레시피
  const [coach, setCoach] = useState(() => needsCoach(BRAG_COACH_KEY))
  const list = useMemo(
    () => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt),
    [recipes],
  )
  const random = () => { if (list.length) setShare(list[Math.floor(Math.random() * list.length)]) }

  return (
    <>
      <div className="topbar">
        <div className="h-title">자랑</div>
      </div>
      <div className="pad">
        <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 12 }}>
          🎴 내 레시피를 <b style={{ color: 'var(--text)' }}>예쁜 카드</b>로 만들어 친구한테 자랑하고, <b style={{ color: 'var(--text)' }}>내 레시피 표지</b>로도 저장해요.
        </div>

        {/* ① 랜덤 카드 뽑기 — 큰 히어로 버튼 */}
        <button
          className="press"
          data-coach="brag-random"
          onClick={random}
          disabled={!list.length}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderRadius: 18, background: 'var(--brown)', color: '#fff', marginBottom: 18, border: 'none', boxShadow: 'var(--shadow-card)', opacity: list.length ? 1 : 0.5, textAlign: 'left' }}
        >
          <span style={{ fontSize: 30, lineHeight: 1 }}>🎲</span>
          <span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>랜덤 카드 뽑기</span><br />
            <span style={{ fontSize: 12.5, opacity: 0.92 }}>아무 레시피나 예쁜 카드로 · 다시 뽑기 가능</span>
          </span>
        </button>

        {/* ② 내 레시피 골라서 공유 */}
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '2px 2px 10px' }}>
          내 레시피 <span className="t-sub" style={{ fontWeight: 600 }}>· 골라서 자랑하기</span>
        </div>
        {list.length === 0 ? (
          <div className="empty">{'아직 레시피가 없어요.\n가져오기로 담으면 여기서 예쁜 카드로 자랑할 수 있어요 🎴'}</div>
        ) : (
          <div className="grid2" data-coach="brag-list">
            {list.map((r) => (
              <div key={r.id} className="grid-card">
                <button className="press" style={{ textAlign: 'left', width: '100%' }} onClick={() => setShare(r)} aria-label={`${r.title} 카드 만들기`}>
                  <Thumb recipe={r} ratio="1/1" radius={16} showDecor />
                  <div className="name">{r.title}</div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카드 뽑기 모달 — 공유(💌) + 표지로 저장(🖼) 둘 다 여기서 */}
      {share && (
        <Portal>
          <ShareDrawCard
            recipe={share}
            onClose={() => setShare(null)}
            onSaveCover={(img) => { updateRecipe(share.id, { thumb: 'photo', image: img }); nav.showToast('카드를 표지로 저장했어요 ✨') }}
          />
        </Portal>
      )}
      {coach && list.length > 0 && <CoachMarks storageKey={BRAG_COACH_KEY} steps={BRAG_COACH_STEPS} onDone={() => setCoach(false)} />}
    </>
  )
}
