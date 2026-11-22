import Portal from './Portal'
import { MEASURE, PREP, CUT, CUT_SRC } from '../data/kitchenGuide'
const 썰기그림 = import.meta.glob('../assets/guide/cut/*.webp', { eager: true, import: 'default' })
const 썰기src = (k) => 썰기그림[`../assets/guide/cut/${k}.webp`]
import { useModalBack } from '../useBackHandler'

// 요리 가이드 시트 — 계량 지표(고정표) + 재료 손질법(사전). 초보 배려.
// 레시피 상세 '재료 ?' 와 설정에서 연다. focus='measure'면 계량이 위로 오게 스크롤 힌트.
// 🔪 [창업자 2026-11-22 「레시피에서 손질법을 바로」] only = 손질법 한 칸만(재료 옆 「손질」 칩) · prepOnly = 손질법만(레시피 탭 칩)
function PrepCard({ it }) {
  return (
    <div className="card" style={{ padding: '11px 13px', marginBottom: 7 }}>
      <div style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{it.name}</div>
      <div className="t-sub" style={{ fontSize: 15.8, lineHeight: 1.55 }}>{it.tip}</div>
      {it.video && (
        <a href={`https://youtu.be/${it.video}`} target="_blank" rel="noopener noreferrer" className="press"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '5px 11px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
          ▶ 영상으로 보기{it.by ? ` · ${it.by}` : ''}
        </a>
      )}
    </div>
  )
}
export default function KitchenGuideSheet({ onClose, only, prepOnly }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  if (only) return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24 }}>
          <div className="emoji-sheet-head">
            <span>손질법</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}><PrepCard it={only} /></div>
        </div>
      </div>
    </Portal>
  )
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
          <div className="emoji-sheet-head">
            <span>{prepOnly ? '손질법 · 계량' : '요리 가이드'}</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ overflowY: 'auto', padding: '2px 16px 0' }}>
            {/* 계량 지표 */}
            {<>
            <div className="h-section" style={{ fontSize: 16, margin: '6px 0 8px' }}>계량 지표</div>
            <div className="card" style={{ padding: '4px 14px', background: 'var(--cream)', border: 'none', marginBottom: 20 }}>
              {MEASURE.map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text)' }}>{k}</span>
                  <span style={{ fontSize: 16.5, color: 'var(--text-sub)', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
            </>}

            {/* 써는 법 — 그림으로 (창업자 2026-11-22) */}
            <div className="h-section" style={{ fontSize: 16, margin: '6px 0 8px' }}>써는 법</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
              {CUT.map((c) => (
                <div key={c.name} className="card" style={{ padding: 8, margin: 0 }}>
                  <img src={썰기src(c.img)} alt={c.name} loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '7px 2px 2px' }}>{c.name}</div>
                  {c.뜻 && <div className="t-sub" style={{ fontSize: 14.5, lineHeight: 1.5, margin: '0 2px' }}>{c.뜻}</div>}
                </div>
              ))}
            </div>
            <div className="t-sub" style={{ fontSize: 13, marginBottom: 18 }}>{CUT_SRC}</div>

            {/* 재료 손질법 */}
            <div className="h-section" style={{ fontSize: 16, margin: '6px 0 4px' }}>재료 손질법</div>
            <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 10 }}>
              초보가 자주 막히는 것부터. 계속 더 올라와요.
            </div>
            {PREP.map((g) => (
              <div key={g.cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brown)', margin: '4px 2px 7px' }}>{g.cat}</div>
                {g.items.map((it) => <PrepCard key={it.name} it={it} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}
