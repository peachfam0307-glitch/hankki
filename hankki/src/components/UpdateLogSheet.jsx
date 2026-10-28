import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { allUserLines } from '../data/changelog'

// 📣 업데이트 내역 — 설정에서 여는 «날짜별 전체» 목록 (창업자 2026-09-17
//    *"설정칸에 업데이트를 쭉 날짜별로 볼수있게 하고, 한끼소식에는 한줄만 올리는건 어때?"*)
//
//   ⭐ 갈래 = 「한끼 소식」은 «최신 한 줄»(21일 창) / 여기는 «전부»(창이 없다).
//      그래서 소식이 도배되지 않고, 21일 지난 줄도 여기선 안 사라진다.
//   ⛔ 문장은 여기서 짓지 않는다 — `data/changelog.js` 의 who:'창업자' 줄만 온다(check-changelog 가 막는다).
//   ⛔ 유니코드 이모지 금지 — 아이콘은 `Icon` 만.
export default function UpdateLogSheet({ onClose }) {
  useModalBack(onClose)
  const 줄 = allUserLines()
  // 날짜별로 묶는다 — 같은 날 여러 판이면 한 날짜 아래 여러 줄
  const 날짜들 = []
  for (const l of 줄) {
    const last = 날짜들[날짜들.length - 1]
    if (last && last.when === l.when) last.items.push(l)
    else 날짜들.push({ when: l.when, items: [l] })
  }
  const 날짜글 = (d) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon name="sparkle" size={19} color="var(--tease-ic)" stroke={1.7} /> 업데이트 내역</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            {날짜들.length === 0 && (
              <div className="t-sub" style={{ fontSize: 15.5, padding: '8px 2px' }}>아직 적힌 것이 없어요.</div>
            )}
            {날짜들.map((d) => (
              <div key={d.when} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-sub)', margin: '0 0 6px 2px', fontVariantNumeric: 'tabular-nums' }}>{날짜글(d.when)}</div>
                <div style={{ background: 'var(--cream)', borderRadius: 14, padding: '10px 13px', display: 'grid', gap: 7 }}>
                  {d.items.map((l) => (
                    <div key={l.v} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 16, lineHeight: 1.4, flex: 1, minWidth: 0 }}>{l.user}</span>
                      <span className="t-sub" style={{ flex: '0 0 auto', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>{l.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}
