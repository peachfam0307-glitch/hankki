import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { markGiftPackSeen } from '../nudges'
import { StickerArt, bgStyle, bgAnim } from './Stickers'

// 🎁 출시기념 팩 안내 — 꾸미기 서랍을 처음 열 때 딱 한 번.
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · 「축하합니다!」·뱃지·컨페티 금지 — 우리는 게임이 아니라 다이어리 문법이다
//    · 유저를 평가하지도, 재촉하지도 않는다 · 닫으면 다시 안 뜬다
//
// ⭐⭐ **한 줄에 하나씩 — 「무엇」과 「어디 있는지」를 같이 보여준다.** (창업자 2026-08-01)
//    *"뭐가 선물인지 명확하지 않아. 구경가기 누르면 프레임으로 연결되서 프레임은 제목에 있는데
//      배경이랑 스티커? 찰랑임? 처음 보는 사람은 뭐가 뭔지 모르겠어."* — 맞는 지적이었다.
//    ⛔ 전엔 **글로 네 가지를 나열하고 「구경하기」 버튼 하나**였다. 그 버튼은 프레임 탭으로만 갔고,
//       나머지 셋은 **어디 가야 있는지 아무 데도 안 적혀 있었다.** 「찰랑」은 이름만 봐선 뭔지도 모른다.
//    ✅ 그래서 **네 줄로 쪼개고, 줄마다 ⒜진짜 그 물건의 미리보기 ⒝어디 있는지 ⒞누르면 거기로** 를 붙였다.
//       (움직이는 것은 미리보기도 **실제로 움직인다** — 「움직여요」라고 쓰는 것보다 빠르다)
//
// ⚠️ 유니코드 이모지 금지(창업자 2026-07-26) → 그림은 전부 우리 컷(`StickerArt`).

// ⚠️ **물결 타일은 판 크기에 맞춰 다시 준다.** 기본값(26/38/55%)은 표지 1080px 기준이라
//    작은 미리보기(≈64px)에선 물결이 「잔털」로 뭉친다 — 피커 스와치(42px)에서 겪은 것과 같은 문제.
const SEA_TILE = { backgroundSize: '150% auto,220% auto,320% auto,cover' }

// 한 줄 = 선물 하나. `cat` 은 꾸미기 서랍 탭 키(`DecorEditor` 의 `CATS`).
const GIFTS = [
  { cat: 'frame', title: '여름 프레임 12개', where: '프레임 탭', art: 'pf_sm03' },
  { cat: 'buddies', title: '축하 스티커 3개', where: '친구들 탭', art: 'ce_manse' },
  { cat: 'bgtape', title: '움직이는 배경 「여름 물결」', where: '배경 탭 맨 위', sea: true },
  { cat: 'buddies', title: '새 움직임 「찰랑」', where: '친구를 붙이고 톡 누르면', art: 'gp_gomhi', motion: true },
]

export default function GiftPackSheet({ onClose, onGo }) {
  useModalBack(onClose)
  const close = () => { markGiftPackSeen(); onClose() } // 뜬 순간부터 '봤음' — 어떻게 닫아도 다시 안 뜬다
  const go = (cat) => { markGiftPackSeen(); onGo?.(cat); onClose() }

  return (
    <Portal>
      <div className="sheet-mask" onClick={close}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>출시 기념 선물</span>
            <button className="press" onClick={close} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.6, margin: '2px 0 12px', textAlign: 'center' }}>
              한끼가 정식으로 나왔어요.<br />
              <b style={{ color: 'var(--text)' }}>네 가지를 넣어뒀어요.</b><br />
              누르면 바로 그 자리로 가요.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {GIFTS.map((g, i) => (
                <button
                  key={i}
                  className="press"
                  onClick={() => go(g.cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                    padding: '10px 12px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)',
                  }}>
                  {/* 미리보기 — 진짜 그 물건이다. 움직이는 건 여기서도 움직인다. */}
                  <span
                    className={g.sea ? bgAnim('sea') : ''}
                    style={{
                      width: 64, height: 64, flex: '0 0 auto', borderRadius: 12, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...(g.sea ? { ...bgStyle('sea'), ...SEA_TILE } : { background: 'var(--bg)' }),
                    }}>
                    {g.art && <span className={g.motion ? 'hk-m-wave' : ''}><StickerArt id={g.art} size={54} /></span>}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>{g.title}</span>
                    <span className="t-sub" style={{ display: 'block', fontSize: 14.5, marginTop: 2 }}>{g.where}</span>
                  </span>
                  <span aria-hidden style={{ color: 'var(--text-sub)', fontSize: 19, flex: '0 0 auto' }}>›</span>
                </button>
              ))}
            </div>

            <button className="btn-ghost press" style={{ width: '100%' }} onClick={close}>나중에 볼게요</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
