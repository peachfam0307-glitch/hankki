import { useState } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { StickerArt } from './Stickers'
import { PACK_SKU, buy as buySku, canBuy } from '../billing'

// 💰 꾸미기 팩 사기 — 서랍 자물쇠에서 열린다.
//
// ⭐ 창업자 2026-08-03 *"결제붙는날 전체를 다 보여줘야지. 이런게 있으니 사라고"*
//    → 서랍 자물쇠가 **「무엇이 들었나」**를 이미 다 보여줬다.
//      여기서는 **「사면 어떻게 되나」** 하나만 말한다. 두 번 설명하지 않는다.
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · 재촉·카운트다운·「지금만」 금지 — 우리는 다이어리 문법이다
//    · 못 사는 상황(웹브라우저 등)에서 **버튼을 눌러 놓고 아무 일도 안 일어나는 게 제일 나쁘다**
//      → 살 수 있는지 먼저 확인하고, 못 사면 «왜 못 사는지»를 말한다
//
// ⚠️ 유니코드 이모지 금지(창업자 2026-07-26) → 자물쇠도 SVG.
//
// 🔓 **꾸미기 팩은 「영구」다** — 폰을 바꿔도 구글 계정으로 저절로 돌아온다.
//    (`billing.js` 의 `consume()` 을 ⛔절대 부르지 않는다. 부르면 산 기록이 사라진다)
//    그래서 「복원」 버튼이 따로 필요 없다 — 앱이 켜질 때 `ownedPackKeys()` 로 알아서 읽는다.

const Lock = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ verticalAlign: '-2px' }}>
    <path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <rect x="4.6" y="10" width="14.8" height="10.8" rx="3.1" fill="currentColor" />
  </svg>
)

// 못 사는 이유를 «사람 말»로. ⛔「오류가 발생했습니다」 같은 말은 쓰지 않는다.
const REASON = {
  unavailable: '구글 플레이 스토어에서 받은 앱에서만 살 수 있어요. 웹 브라우저로 열면 결제가 안 돼요.',
  cancel: null,                       // 스스로 닫은 것 — 아무 말도 안 한다
  fail: '결제가 끝까지 가지 못했어요. 잠시 뒤에 다시 해 볼래요?',
}

export default function PackBuySheet({ pack, onClose, onBought }) {
  useModalBack(onClose)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  if (!pack) return null
  const sku = PACK_SKU[pack.pack]

  const doBuy = async () => {
    if (busy) return
    setBusy(true); setMsg('')
    // ⚠️ 살 수 있는지 «먼저» 본다 — 눌렀는데 아무 일도 없는 게 제일 나쁘다
    if (!(await canBuy())) { setMsg(REASON.unavailable); setBusy(false); return }
    const r = await buySku(sku)
    setBusy(false)
    if (r.ok) { onBought?.(pack.pack); onClose(); return }
    if (r.reason === 'cancel') return   // 스스로 닫음 — 조용히
    setMsg(REASON[r.reason] || REASON.fail)
  }

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>{pack.label} 꾸미기 팩</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '4px 16px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 3 }}>
              {pack.items.length}컷이 한 번에 열려요
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--text-sub)', lineHeight: 1.55, marginBottom: 9 }}>
              {pack.split.map((s) => `${s.kind} ${s.n}`).join(' · ')}
            </div>

            {/* 🎁 **팩 전체를 여기서 다 보여준다** (창업자 2026-08-03 *"배경부터 싹 다 보여줘야한다고"*)
                ⭐ 흐리게 하지 않는다 — 사고 싶어야 사니까 **선명하게** 보여준다.
                   못 쓰게 막는 건 「아직 서랍에 없다」로 이미 충분하다.
                ⚠️ 62~66컷이라 시트 안에서만 스크롤한다 — 시트 자체가 길어지면 닫기 버튼이 밀린다. */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7,
              maxHeight: '38vh', overflowY: 'auto', overscrollBehavior: 'contain',
              padding: 8, background: 'var(--cream)', borderRadius: 13, marginBottom: 11,
            }}>
              {(pack.items || []).map((k) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', background: 'var(--surface)', borderRadius: 9, padding: 4 }}>
                  <StickerArt id={k} />
                </span>
              ))}
            </div>

            <div style={{ fontSize: 14.5, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 11 }}>
              한 번 사면 계속 쓸 수 있어요. 폰을 바꿔도 같은 구글 계정이면 그대로 있어요.
            </div>

            {msg && (
              <div style={{ background: '#f6ece4', color: '#7a4a2c', fontSize: 14.5, fontWeight: 600, lineHeight: 1.55, borderRadius: 11, padding: '10px 12px', marginBottom: 10 }}>
                {msg}
              </div>
            )}

            <button
              className="press"
              onClick={doBuy}
              disabled={busy}
              style={{
                width: '100%', padding: '13px 12px', borderRadius: 14, border: 'none',
                background: busy ? '#cbb39f' : '#b5714a', color: '#fff', fontSize: 16, fontWeight: 800,
                letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {!busy && <Lock />}
              {busy ? '잠시만요…' : `${pack.price.toLocaleString()}원 · 전부 열기`}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
