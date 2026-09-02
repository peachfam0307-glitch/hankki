// 🔑 열쇠 알약 — 「매달 무료 5개」 ＋ 큰 열쇠 그림 ＋ 남은 숫자
//
// 📮 창업자 2026-08-28 = *"무료레시피열쇠 몇개 남았어요. **오른쪽 상단에 크게!**
//    설명 필요없이 열쇠그림 옆에 남은 숫자 (알약으로 매달 무료5개)적으면 될 듯."*
// 📮 창업자 2026-09-01 = *"**설정에도 열쇠를 크게 하나 붙이면 좋겠어. 가져오기랑 같은 자리에**"*
//
// ⭐⭐ **부품으로 뺀 이유** — 가져오기와 설정이 «같은 것»을 보여줘야 한다.
//    ⛔ 복사해서 두 곳에 두면 한쪽만 고쳤을 때 조용히 갈라진다.
//       (오늘 `_올릴판-worker.js` 가 정확히 그렇게 하루 만에 갈라졌다 · 2026-09-01)
//    ⭐ 모양(CSS `.imp-key`)도 그대로 쓴다 — 새로 만들 게 0이다.
//
// ⛔ 숫자를 여기서 «세지» 않는다 — `getOcrLeft()` 가 서버가 준 값을 그대로 돌려준다.
import { KEY_NAME, KEY_UNIT } from '../ocr'
import useKeyLeft from './useKeyLeft'
import uiKeyOne from '../assets/ui/key_one.png'
import uiKeyHole from '../assets/ui/key_hole.png'

export default function KeyBadge() {
  // 🔎 서버에 물어보고, 값이 바뀌면 다시 그린다(useKeyLeft 주석에 왜 필요한지 적어 뒀다)
  const left = useKeyLeft()
  // 🔓 창업자는 개인 한도를 지나간다(worker.js) — 그런데 «표시»는 유저와 똑같이 깎여서
  //    0 이 되면 「고장인가」로 읽힌다(2026-09-01 창업자가 실제로 그렇게 읽었다).
  //    ⛔ 서버 동작은 한 글자도 안 바꾼다. **보이는 것만** 고친다.
  //   ⭐ [2026-09-02] 잣대를 `getOcrLeft()` 한 곳으로 모았다 — 전엔 여기만 `tidyFounder()` 를 알아서
  //      토스트·임시보관함은 0 을 그렸다(창업자 폰에서 «같은 것을 두 곳이 다르게» 말했다).
  const 운영자 = left.무제한
  const 숫자 = 운영자 ? '∞' : left.total
  const 남았나 = 운영자 || left.total > 0
  return (
    <div
      className="imp-key"
      role="img"
      aria-label={운영자
        ? `운영자 모드 · ${KEY_NAME} 무제한`
        : `무료 ${KEY_NAME} ${left.total}${KEY_UNIT} 남았어요 · 매달 무료 5${KEY_UNIT}`}
    >
      <span aria-hidden="true">{운영자 ? '운영자' : `매달 무료 5${KEY_UNIT}`}</span>
      <div className="imp-key-now">
        {/* ⚠️ 높이만 고정하고 폭은 비율대로 — 열쇠 107×220 · 열쇠구멍 213×220 으로 가로세로가 다르다 */}
        <img src={남았나 ? uiKeyOne : uiKeyHole} alt="" aria-hidden="true" draggable={false} />
        <b aria-hidden="true">{숫자}</b>
      </div>
    </div>
  )
}
