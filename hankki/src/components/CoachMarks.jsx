import { useEffect, useState } from 'react'
import Portal from './Portal'

// 첫 사용 코치마크 — 화면을 어둡게 하고 중요한 버튼만 반짝이며 하나씩 알려준다.
// (기능이 많고 숨어 있어 처음엔 뭐가 있는지 모른다는 피드백 → 창업자 딸 아이디어 ⭐)
// - steps: [{ sel: '[data-coach="share"]', label: '💌 친구와 레시피 공유하기', desc: '예쁜 카드로 보내요' }]
// - storageKey 로 한 번만 보여줌(완주·건너뛰기 시 기록). 탭하면 다음으로.
// - 히스토리 칸은 쌓지 않는다(자동 등장이라 제스처가 아님 — 뒤로가기와 안 얽히게 시각 전용).
export default function CoachMarks({ storageKey, steps, onDone }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)

  const finish = () => {
    try { localStorage.setItem(storageKey, '1') } catch { /* noop */ }
    onDone?.()
  }
  const next = () => { if (i + 1 < steps.length) setI(i + 1); else finish() }

  // 현재 단계의 대상 버튼 위치를 잰다(레이아웃이 늦게 잡히면 잠깐 재시도).
  useEffect(() => {
    let tries = 0
    let t
    const measure = () => {
      const el = document.querySelector(steps[i].sel)
      const r = el?.getBoundingClientRect()
      if (r && r.width > 0) setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      else if (tries++ < 8) t = setTimeout(measure, 120)
      else next() // 대상이 없으면(화면 구성이 다르면) 그 단계는 건너뛴다
    }
    setRect(null)
    measure()
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  if (!rect) return null
  const s = steps[i]
  const pad = 7 // 하이라이트 여유
  const below = rect.top + rect.height + 150 < window.innerHeight // 말풍선을 아래에 둘 수 있나
  return (
    <Portal>
      <div
        onClick={next}
        role="button"
        aria-label="다음 안내 보기"
        style={{ position: 'fixed', inset: 0, zIndex: 500, cursor: 'pointer' }}
      >
        {/* 구멍 뚫린 어두운 배경 — 대상 버튼만 밝게 남긴다 */}
        <div
          style={{
            position: 'absolute',
            top: rect.top - pad, left: rect.left - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            borderRadius: 999,
            boxShadow: '0 0 0 9999px rgba(38, 30, 22, 0.66)',
            pointerEvents: 'none',
          }}
        />
        {/* 반짝이는 링 */}
        <div
          className="coach-ring"
          style={{
            position: 'absolute',
            top: rect.top - pad, left: rect.left - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            borderRadius: 999,
            pointerEvents: 'none',
          }}
        />
        <div className="coach-spark" style={{ position: 'absolute', top: rect.top - pad - 14, left: rect.left + rect.width + pad - 4, pointerEvents: 'none' }}>✨</div>

        {/* 말풍선 */}
        <div
          style={{
            position: 'absolute',
            left: 18, right: 18,
            ...(below ? { top: rect.top + rect.height + pad + 16 } : { bottom: window.innerHeight - rect.top + pad + 16 }),
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}
        >
          <div style={{ maxWidth: 340, background: '#fffdf8', borderRadius: 18, padding: '14px 18px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', textAlign: 'center', pointerEvents: 'auto' }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#4a4136' }}>{s.label}</div>
            {s.desc && <div style={{ fontSize: 13, color: '#8b8172', marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>}
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {steps.map((_, k) => (
                <span key={k} style={{ width: 6, height: 6, borderRadius: 3, background: k === i ? '#c47a58' : '#e3dccd' }} />
              ))}
              <span style={{ fontSize: 12, color: '#b0a692', marginLeft: 6 }}>탭해서 다음</span>
              {/* 건너뛰기 — 화면 구석에 두면 안내 대상 버튼을 가릴 수 있어 말풍선 안에 둔다 */}
              <button
                className="press"
                onClick={(e) => { e.stopPropagation(); finish() }}
                style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 999, background: '#f1ece1', color: '#8b8172', fontSize: 12, fontWeight: 700 }}
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}

// 이 화면의 코치마크를 아직 안 봤나?
export function needsCoach(storageKey) {
  try { return !localStorage.getItem(storageKey) } catch { return false }
}
