import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { headline, newsSignature, spread } from '../data/whatsnew'
import { Peek } from './PreviewSheet'
import { StickerArt } from './Stickers'

// 🎉 새로 열린 날 «딱 한 번» 뜨는 알림.
//
// ⭐⭐ 왜 (창업자 2026-08-03)
//   *"안내페이지(곧나올기능) 이것도 뭔가 수정이 필요한 것 같아. 우리 매주 나오는 것까지 해서
//     따로 만들거나 아님 팝업으로 바꾸거나.."* → **「지금 것 ＋ 한 번만 팝업」으로 확정.**
//   *"가을 이모지팩도 광고해야하지 않아?"* → **그림 미리보기를 넣는다.** 글자만이면 광고가 안 된다.
//
// ⛔ 우리 리텐션 원칙을 깨지 않는 선 (`docs/리텐션-설계원칙-2026-07-30.md`)
//   · **재촉·죄책감 금지** → 「놓치지 마세요」·「지금 확인」 같은 말 안 쓴다. 왔다는 사실만 말한다.
//   · **한 번 보면 다시 안 뜬다** → 본 소식 묶음을 기억한다(`newsSignature`).
//     ⚠️ 「닫기」로 닫든 「구경하기」로 열든 **똑같이 봤다고 친다** — 어떻게 닫아도 다시 안 묻는
//     `ReviewAskSheet` 와 같은 방식. 안 그러면 뒤로가기로 닫은 사람에게 매번 뜬다.
//   · **매주 뜨는 게 아니다** → 주간 레시피만 바뀐 주엔 홈 뱃지로 충분하고,
//     팝업은 **꾸미기·카드가 열린 날**에만 띄운다(달마다 한 번꼴). 매주 뜨면 그게 재촉이다.
const KEY = 'hankki:news:seen'

// 팝업을 띄울 «만한» 소식인가 — ⛔주간 레시피만 바뀐 주엔 안 띄운다(매주 팝업 = 재촉).
// ⛔ [2026-08-29] `openedAlert` = 장바구니가 빠진 목록 — 팝업은 «알림 층»이다(창업자 *"대신 아래 나중에"*).
const worthPopup = (news) =>
  (news?.openedAlert || []).some((o) => o.kind === '꾸미기' || o.kind === '레꾸자랑 카드')

export function needsNewsPopup(news) {
  if (!worthPopup(news)) return false
  try { return localStorage.getItem(KEY) !== newsSignature(news) } catch { return false }
}
export function markNewsSeen(news) {
  try { localStorage.setItem(KEY, newsSignature(news)) } catch { /* 저장 못 해도 화면은 돌아간다 */ }
}

export default function NewsPopup({ news, onClose, onOpenNews }) {
  useModalBack(onClose) // 뒤로가기 → 닫기 (이때도 '봤음'으로 친다 — onClose 안에서 표시)
  // ⛔ [2026-08-29] `openedAlert` = **장바구니가 빠진 목록**(창업자 *"대신 아래 나중에"*).
  //    장바구니는 소식 «페이지»에만 나오고 팝업엔 안 온다 — 주마다 열려서 팝업이 재촉이 된다.
  const items = (news?.openedAlert || []).filter((o) => o.kind !== '이번 주 레시피')
  const h = headline(items)
  // 🎨 골고루 여섯 컷 — 캐릭터가 앞자리. ⛔한 그룹에서 다 뽑으면 낙엽만 다섯 개가 된다.
  const keys = spread(items, 6)
  const hero = keys[0]
  const rest = keys.slice(1, 6)

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div
          className="sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}
        >
          {/* 🍂 계절 판 — 히어로 컷을 얹는 자리. 우리 테마 변수만 쓴다(테마 바뀌어도 안 깨진다) */}
          <div style={{
            margin: '4px 14px 0', borderRadius: 20, padding: '18px 16px 16px', textAlign: 'center',
            background: 'linear-gradient(180deg, var(--cream) 0%, var(--surface) 100%)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 900, color: 'var(--brown)', letterSpacing: '0.06em' }}>
              <Icon name="sparkle" size={13} color="var(--brown)" stroke={2.2} /> NEW
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, marginTop: 6, letterSpacing: '-0.03em', lineHeight: 1.3 }}>{h.title}</div>
            <div className="t-sub" style={{ fontSize: 15.5, marginTop: 3 }}>{h.sub}</div>

            {/* 히어로 한 컷 크게 — 작은 것 여럿보다 «하나 큰 것»이 눈에 남는다 */}
            {hero && (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: 116, height: 116, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StickerArt id={hero} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                </span>
              </div>
            )}
            {rest.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: -2 }}>
                <Peek keys={rest} size={50} />
              </div>
            )}
          </div>

          {/* 무엇이 왔는지 — 칩으로. ⛔체크리스트는 «할 일»처럼 읽힌다 */}
          <div style={{ padding: '13px 18px 0', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {items.map((it, i) => (
              <span key={i} style={{
                fontSize: 15, fontWeight: 800, color: 'var(--text)', background: 'var(--cream)',
                borderRadius: 999, padding: '5px 11px',
              }}>
                {it.title} <span style={{ color: 'var(--brown)' }}>{it.count}</span>
              </span>
            ))}
          </div>

          {/* ⭐ 새 친구 데뷔는 «한 번밖에 못 쓰는 카드» — 있으면 반드시 짚는다 */}
          {h.debut && (
            <div style={{ padding: '11px 18px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--brown)' }}>
                {h.debut}이 처음 놀러 왔어요
              </span>
            </div>
          )}

          <div style={{ padding: '16px 18px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="press"
              onClick={onOpenNews}
              style={{ width: '100%', padding: '14px', borderRadius: 15, border: 'none', background: 'var(--brown)', color: '#fff', fontSize: 17, fontWeight: 800 }}
            >
              구경하기
            </button>
            {/* ⛔ 「나중에」가 아니라 「닫기」 — 「나중에」는 «해야 할 일을 미룬다»는 뜻이 된다 */}
            <button
              className="press"
              onClick={onClose}
              style={{ width: '100%', padding: '11px', borderRadius: 14, border: 'none', background: 'transparent', color: 'var(--text-sub)', fontSize: 16, fontWeight: 700 }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
