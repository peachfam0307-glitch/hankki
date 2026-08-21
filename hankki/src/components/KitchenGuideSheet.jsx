import Portal from './Portal'
import { MEASURE, PREP } from '../data/kitchenGuide'
import { useModalBack } from '../useBackHandler'

// 요리 가이드 시트 — 계량 지표(고정표) + 재료 손질법(사전). 초보 배려.
// 레시피 상세 '재료 ?' 와 설정에서 연다. focus='measure'면 계량이 위로 오게 스크롤 힌트.
export default function KitchenGuideSheet({ onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
          <div className="emoji-sheet-head">
            <span>요리 가이드</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ overflowY: 'auto', padding: '2px 16px 0' }}>
            {/* 계량 지표 */}
            <div className="h-section" style={{ fontSize: 15, margin: '6px 0 8px' }}>계량 지표</div>
            <div className="card" style={{ padding: '4px 14px', background: 'var(--cream)', border: 'none', marginBottom: 20 }}>
              {MEASURE.map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>{k}</span>
                  <span style={{ fontSize: 15.5, color: 'var(--text-sub)', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* 재료 손질법 */}
            <div className="h-section" style={{ fontSize: 15, margin: '6px 0 4px' }}>재료 손질법</div>
            <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
              초보가 자주 막히는 것부터. 계속 더 올라와요.
            </div>
            {PREP.map((g) => (
              <div key={g.cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--brown)', margin: '4px 2px 7px' }}>{g.cat}</div>
                {g.items.map((it) => (
                  <div key={it.name} className="card" style={{ padding: '11px 13px', marginBottom: 7 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{it.name}</div>
                    <div className="t-sub" style={{ fontSize: 14.8, lineHeight: 1.55 }}>{it.tip}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}
