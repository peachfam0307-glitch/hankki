import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { markGiftPackSeen } from '../nudges'
import { StickerArt, bgStyle, bgAnim, giftGroups } from './Stickers'
import { seasonRank } from '../season'

// 🎁 받은 선물 안내 — 꾸미기 서랍 맨 위 「선물 …가지」 단추가 여는 창(＋첫 방문에 한 번 저절로).
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
//    ✅ 그래서 **줄로 쪼개고, 줄마다 ⒜진짜 그 물건의 미리보기 ⒝어디 있는지 ⒞누르면 거기로** 를 붙였다.
//       (움직이는 것은 미리보기도 **실제로 움직인다** — 「움직여요」라고 쓰는 것보다 빠르다)
//
// 🍂🍂 **[2026-09-01] 목록을 «글자»에서 «데이터»로 바꿨다.**
//    📮 창업자 = *"글자에 선물네가지 (없애거나 가을 것으로 반영)"*
//    ⛔ 옛 판은 **여름 넷을 손으로 적어둔 배열**이었다. 9/1 에 「가을의 정원 세트」가 선물로 열렸는데
//       시트는 여전히 여름만 말했고, 서랍 단추 이름에도 **「네 가지」라는 숫자가 박혀** 있었다.
//       📌 `ocr.js` 문구의 「5회」와 «같은 사고»다 — 숫자·계절을 글자로 박으면 반드시 낡는다.
//    ✅ 이제 `giftGroups()`(＝`gift: true` 가 붙은 묶음)가 목록을 만든다.
//       **선물을 하나 열면 시트도 단추 숫자도 저절로 따라온다.** 여기 손댈 일이 없다.
//    ⛔ 지난 계절 선물을 **목록에서 «빼지» 않는다** — 「한 번 준 것은 빼앗지 않는다」.
//       ⭐ 대신 «순서»로 답한다: 지금 제철인 선물이 위, 지난 계절은 아래(서랍 순서와 똑같다).
//
// ⚠️ 유니코드 이모지 금지(창업자 2026-07-26) → 그림은 전부 우리 컷(`StickerArt`).

// ⚠️ **물결 타일은 판 크기에 맞춰 다시 준다.** 기본값(26/38/55%)은 표지 1080px 기준이라
//    작은 미리보기(≈64px)에선 물결이 「잔털」로 뭉친다 — 피커 스와치(42px)에서 겪은 것과 같은 문제.
const SEA_TILE = { backgroundSize: '150% auto,220% auto,320% auto,cover' }

// 🏷 서랍 탭 이름 — `DecorEditor` 의 `CATS` 와 같은 글자여야 한다.
//    ⛔ 여기가 어긋나면 「프레임 탭에 있어요」라고 해놓고 딴 탭으로 보낸다.
const TAB_NAME = { bgtape: '배경', frame: '프레임', tape: '마테', deco: '데코', notetext: '글자', record: '기록', buddies: '친구들', food: '재료' }

// 🎁 묶음이 아닌 선물 둘 — 배경·모션은 `STICKER_GROUPS` 에 없어서 여기 적는다.
//    ⛔ 이 둘을 빼면 **있는 줄을 알 길이 아예 없어진다**(서랍 어디에도 「선물」 택이 안 붙는다).
//    🌊 둘 다 출시기념 «여름»이라 계절을 붙여 둔다 — 가을엔 저절로 아래로 밀린다.
const EXTRA_GIFTS = [
  { cat: 'bgtape', season: 'summer', title: '움직이는 배경 「여름 물결」', where: '배경 탭', sea: true },
  { cat: 'buddies', season: 'summer', title: '새 움직임 「찰랑」', where: '친구를 붙이고 톡 누르면', art: 'gp_gomhi', motion: true },
]

// 📋 지금 보여줄 선물 줄들. ⭐순서 = 제철 먼저 → 새것 먼저(서랍과 같은 규칙).
export function giftRows(now = new Date()) {
  const 제철 = (x) => !x.season || seasonRank(x.season, now) === 0
  const 묶음 = giftGroups(now).map((g) => ({
    cat: g.tab,
    season: g.season,
    from: g.from,
    title: `${g.label} ${g.items.length}컷`,
    where: `${TAB_NAME[g.tab] || ''} 탭 맨 위`,
    art: g.items[0],
  }))
  return [...묶음, ...EXTRA_GIFTS]
    .sort((a, b) => ((제철(b) ? 1 : 0) - (제철(a) ? 1 : 0))
      || String(b.from || '').localeCompare(String(a.from || '')))
}

export default function GiftPackSheet({ onClose, onGo }) {
  useModalBack(onClose)
  const close = () => { markGiftPackSeen(); onClose() } // 뜬 순간부터 '봤음' — 어떻게 닫아도 다시 안 뜬다
  const go = (cat) => { markGiftPackSeen(); onGo?.(cat); onClose() }
  const rows = giftRows()

  return (
    <Portal>
      <div className="sheet-mask" onClick={close}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            {/* 🏷 「출시 기념 선물」이던 이름 — 출시가 지났고 선물도 늘어서 낡았다. 안 낡는 이름으로. */}
            <span>받은 선물</span>
            <button className="press" onClick={close} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            <div className="t-sub" style={{ fontSize: 16.5, lineHeight: 1.6, margin: '2px 0 12px', textAlign: 'center' }}>
              {/* ⛔ 숫자를 글자로 박지 않는다 — 선물이 늘면 그 자리만 낡는다(옛 판이 그랬다). */}
              <b style={{ color: 'var(--text)' }}>{rows.length}가지를 넣어뒀어요.</b><br />
              누르면 바로 그 자리로 가요.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {rows.map((g, i) => (
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
                    <span style={{ display: 'block', fontSize: 16.5, fontWeight: 800, color: 'var(--text)' }}>{g.title}</span>
                    <span className="t-sub" style={{ display: 'block', fontSize: 15.5, marginTop: 2 }}>{g.where}</span>
                  </span>
                  <span aria-hidden style={{ color: 'var(--text-sub)', fontSize: 20, flex: '0 0 auto' }}>›</span>
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
