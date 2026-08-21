import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'

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
      // 대상이 화면 밖(아래쪽 버튼 등)이면 보이게 스크롤한 뒤 위치를 잰다.
      if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' })
      const r = el?.getBoundingClientRect()
      // ⛔⛔ **대상이 «화면보다 클 수» 있다** (창업자 폰 2026-08-10 *"안내코치 레꾸자랑 이렇게돼"*)
      //    레꾸자랑 코치가 레시피 격자를 «통째로» 가리켜 실측 **링 높이 4807px · 화면 891px** 이었다.
      //    그러면 ⒜구멍 뚫는 그림자(`0 0 0 9999px`)가 통째로 화면 «밖»으로 밀려 **화면이 안 어두워지고**
      //         ⒝말풍선이 **y −2178** 로 화면 위로 사라진다 → 금색 테두리만 남는다.
      //    ✅ **보이는 부분으로 잘라서** 잰다 — 어느 화면에서 무엇을 가리켜도 링이 화면 안에 남는다.
      //    📌 규칙 18 — 「코치가 이상하다」가 아니라 «가리키는 것이 화면보다 크다»였다.
      if (r && r.width > 0) {
        const top = Math.max(10, Math.min(r.top, window.innerHeight - 60))
        const bottom = Math.min(window.innerHeight - 10, Math.max(r.bottom, top + 40))
        const left = Math.max(6, Math.min(r.left, window.innerWidth - 60))
        const right = Math.min(window.innerWidth - 6, Math.max(r.right, left + 40))
        setRect({ top, left, width: right - left, height: bottom - top })
      }
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
  // 💬 말풍선 자리 — 아래에 자리가 있으면 아래, 없으면 위. **둘 다 좁으면 화면 아래에 붙인다.**
  //    ⛔ 예전엔 「아래가 안 되면 무조건 위」라, 대상이 화면을 거의 다 채우면
  //       위쪽 여유가 음수가 되어 **말풍선이 화면 밖으로 나갔다**(위 clamp 와 한 사고다).
  const below = rect.top + rect.height + 150 < window.innerHeight // 말풍선을 아래에 둘 수 있나
  const above = !below && rect.top - 150 > 0                       // 위에는 둘 수 있나
  const 자리 = below
    ? { top: rect.top + rect.height + pad + 16 }
    : above
      ? { bottom: window.innerHeight - rect.top + pad + 16 }
      : { bottom: 26 }
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
        <div className="coach-spark" style={{ position: 'absolute', top: rect.top - pad - 14, left: rect.left + rect.width + pad - 4, pointerEvents: 'none' }}><Icon name="sparkle" size={17} color="#efc14e" /></div>

        {/* 말풍선 */}
        <div
          style={{
            position: 'absolute',
            left: 18, right: 18,
            ...자리,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          }}
        >
          <div style={{ maxWidth: 360, background: '#fffdf8', borderRadius: 20, padding: '17px 21px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', textAlign: 'center', pointerEvents: 'auto' }}>
            {s.img && <img src={s.img} alt="" draggable={false} style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', margin: '0 auto 7px' }} />}
            <div style={{ fontSize: 19.5, fontWeight: 800, color: '#4a4136' }}>{s.label}</div>
            {s.desc && <div style={{ fontSize: 16, color: '#8b8172', marginTop: 6, lineHeight: 1.55 }}>{s.desc}</div>}
            <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {steps.map((_, k) => (
                <span key={k} style={{ width: 6, height: 6, borderRadius: 3, background: k === i ? '#c47a58' : '#e3dccd' }} />
              ))}
              <span style={{ fontSize: 15, color: '#b0a692', marginLeft: 6 }}>{i + 1 < steps.length ? '탭해서 다음' : '탭해서 시작'}</span>
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
