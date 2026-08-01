import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { markGiftPackSeen } from '../nudges'
import { StickerArt, bgStyle, bgAnim } from './Stickers'

// 🎁 출시기념 팩 안내 — 꾸미기 서랍을 처음 열 때 딱 한 번.
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · 「축하합니다!」·뱃지·컨페티 금지 — 우리는 게임이 아니라 다이어리 문법이다
//    · 캐릭터는 한 마디만. 유저를 평가하지도, 재촉하지도 않는다
//    · 닫으면 다시 안 뜬다
//
// ⭐ 글로 설명하지 않고 **컷을 그대로 보여준다** — 「축하 스티커 3개 드려요」보다
//    만세 꼬르곰이 눈앞에 있는 게 빠르다. (스티커가 곧 상품이다)
//
// ⚠️ 유니코드 이모지 금지(창업자 2026-07-26) → 그림은 전부 우리 컷(`StickerArt`).
const PEEK = ['ce_manse', 'ce_pokjuk', 'ce_cheers'] // 만세 · 폭죽 · 주스 건배

// 🌊 **배경도 선물이다** (창업자 2026-08-01 *"우리 배경도 선물이잖아 (움직이는 배경)"* — 맞는 지적).
//    「여름 물결」은 우리 배경 23개 중 **유일하게 움직이는 하나**인데 글로만 적으면 그게 안 전해진다.
//    → 축하 컷을 **그 배경 위에 얹어** 시트 안에서 실제로 물결이 흐르게 한다.
//      (이 시트의 원칙 그대로 — 「움직여요」라고 쓰는 것보다 움직이는 걸 보여주는 게 빠르다)
//
// ⚠️ **타일 크기는 판 크기에 맞춰 다시 준다.** 기본값(26/38/55%)은 표지 1080px 기준이라
//    이 판(≈300px)에선 타일이 78px로 줄어 물결이 「잔털」로 뭉친다 — 피커 스와치(42px)에서 겪은 것과 같은 문제.
//    두 배 가까이 키워 물결선이 두세 가닥으로 읽히게 한다.
const SEA_TILE = { backgroundSize: '48% auto,68% auto,96% auto,cover' }

export default function GiftPackSheet({ onClose, onGo }) {
  useModalBack(onClose)
  const close = () => { markGiftPackSeen(); onClose() } // 뜬 순간부터 '봤음' — 어떻게 닫아도 다시 안 뜬다
  const go = () => { markGiftPackSeen(); onGo?.(); onClose() }

  return (
    <Portal>
      <div className="sheet-mask" onClick={close}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>출시 기념 선물</span>
            <button className="press" onClick={close} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            {/* 컷을 먼저 — 글보다 그림이 빠르다. 판은 선물로 주는 「여름 물결」 배경 그대로 흐른다. */}
            <div
              className={bgAnim('sea')}
              style={{
                ...bgStyle('sea'), ...SEA_TILE,
                borderRadius: 16, padding: '12px 8px 8px',
                display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-end',
                margin: '4px 0 14px',
              }}>
              {PEEK.map((id) => (
                <span key={id} style={{ width: 76, height: 76, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <StickerArt id={id} size={76} />
                </span>
              ))}
            </div>

            <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.7, marginBottom: 16, textAlign: 'center' }}>
              한끼가 정식으로 나왔어요.<br />
              <b style={{ color: 'var(--text)' }}>여름 프레임 12개 · 축하 스티커 3개</b><br />
              <b style={{ color: 'var(--text)' }}>움직이는 여름 물결 배경 · 찰랑 움직임</b><br />
              이만큼 넣어뒀어요.
            </div>

            <button className="btn-primary press" style={{ marginBottom: 8 }} onClick={go}>구경하기</button>
            <button className="btn-ghost press" style={{ width: '100%' }} onClick={close}>나중에</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
