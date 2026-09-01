// 🎁 「이거 해보면 열쇠 1개」 — 행동 다섯을 한 줄씩
//
// 📮 창업자 확정 2026-08-31 = *"4개 왜냐면 우리 기능을 하나씩 써봤으면 좋겠어서"* ·
//    *"냉장고 써보면 1개 더 줄까 싶기도"* · *"다 1회한정으로"*
// 📮 창업자 판정 2026-09-01 = 알리는 법 = **토스트 ＋ 가져오기 목록**
//
// ⭐⭐ **이 목록이 곧 「기능 안내」다** — 창업자가 열쇠를 주려는 이유가 그거였다.
//    안 해본 것이 눈에 보여야 「해볼까」가 된다. 그래서 **받은 것은 흐리게, 안 받은 것은 또렷하게.**
//
// ⛔ 「받았나」를 폰이 «정하지» 않는다 — 서버가 준 `bonus`(받은 개수)만 읽는다.
//    ⚠️ 그래서 **어느 것을 받았는지는 모른다**(서버가 개수만 준다).
//       → 개수만큼 «위에서부터» 흐리게 칠하지 않는다. 그건 거짓말이 된다.
//       ✅ 대신 **「N개 중 M개 받았어요」**를 머리에 적고 다섯은 그대로 보여준다. 정직하고 짧다.
// ⛔ 유니코드 이모지 금지 — 우리 그림만(절대원칙).
import { getOcrLeft, KEY_NAME, KEY_UNIT } from '../ocr'
import uiKeyOne from '../assets/ui/key_one.png'

const 줄들 = [
  { 말: '레시피 꾸미기(레꾸) 해보기' },
  { 말: '레꾸자랑 보내기' },
  { 말: '한끼 일기 한 줄 쓰기' },
  { 말: '요리모드로 한 번 만들어보기' },
  { 말: '냉장고에 재료 넣어보기' },
]

export default function EarnList() {
  const left = getOcrLeft()
  const 받은 = Number.isFinite(left.bonus) ? left.bonus : 0
  const 다받음 = 받은 >= 줄들.length
  return (
    <div className="earn-list">
      <div className="earn-head">
        <img src={uiKeyOne} alt="" aria-hidden="true" draggable={false} />
        <b>{다받음
          ? `다 해보셨어요 · ${KEY_NAME} ${줄들.length}${KEY_UNIT}를 받았어요`
          : `이거 해보면 ${KEY_NAME} 1${KEY_UNIT}씩 더 드려요`}</b>
      </div>
      {!다받음 && (
        <>
          <ul>
            {줄들.map((줄) => <li key={줄.말}>{줄.말}</li>)}
          </ul>
          <div className="earn-foot">
            {받은 > 0 ? `${줄들.length}개 중 ${받은}개 받았어요 · ` : ''}각각 처음 한 번만 드려요
          </div>
        </>
      )}
    </div>
  )
}
