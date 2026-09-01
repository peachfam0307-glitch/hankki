// 🎁 「이거 해보면 열쇠 1개」 — 행동 다섯을 한 줄씩
//
// 📮 창업자 확정 2026-08-31 = *"4개 왜냐면 우리 기능을 하나씩 써봤으면 좋겠어서"* ·
//    *"냉장고 써보면 1개 더 줄까 싶기도"* · *"다 1회한정으로"*
// 📮 창업자 판정 2026-09-01 = 알리는 법 = **토스트 ＋ 가져오기 목록**
// 📮 창업자 2026-09-01(저녁) = *"받은건 줄이 그어지면 좋겠어. 뭘로 받은지 모르니까"* ·
//    *"5개 다 받으면 창이 사라지면 제일 좋고"*
//
// ⭐⭐ **이 목록이 곧 「기능 안내」다** — 창업자가 열쇠를 주려는 이유가 그거였다.
//    안 해본 것이 눈에 보여야 「해볼까」가 된다. 그래서 **받은 줄엔 줄을 긋고 흐리게.**
//
// ⛔ 「받았나」를 폰이 «정하지» 않는다 — 서버가 표식(`earn:<통>:<행동>`)을 읽어 준 목록만 쓴다.
//    ⭐ 그래서 앱을 지웠다 깔아도, 폰을 바꿔도 줄이 그대로 그어져 있다.
// ⛔⛔ **옛 워커는 `earned` 를 안 준다** — 그때는 `null` 이라 **줄을 하나도 안 긋고**
//    「N개 중 M개」만 적는다. ⚠️개수만큼 «위에서부터» 긋지 않는다 — 그건 거짓말이 된다.
// ⛔ 유니코드 이모지 금지 — 우리 그림만(절대원칙).
import { getOcrLeft, EARN, KEY_NAME, KEY_UNIT } from '../ocr'
import uiKeyOne from '../assets/ui/key_one.png'

const 줄들 = [
  { 값: EARN.레꾸, 말: '레시피 꾸미기(레꾸) 해보기' },
  { 값: EARN.자랑, 말: '레꾸자랑 보내기' },
  { 값: EARN.일기, 말: '한끼 일기 한 줄 쓰기' },
  { 값: EARN.요리, 말: '요리모드로 한 번 만들어보기' },
  { 값: EARN.냉장고, 말: '냉장고에 재료 넣어보기' },
]

export default function EarnList() {
  const left = getOcrLeft()
  const 받은수 = Number.isFinite(left.bonus) ? left.bonus : 0
  // ⭐ 사라지는 판정은 «개수»로 한다 — 옛 워커에서도 맞게 돈다(목록은 없어도 개수는 준다).
  if (받은수 >= 줄들.length) return null

  const 받은것 = Array.isArray(left.earned) ? left.earned : null
  const 받았나 = (값) => (받은것 ? 받은것.includes(값) : false)

  return (
    <div className="earn-list">
      <div className="earn-head">
        <img src={uiKeyOne} alt="" aria-hidden="true" draggable={false} />
        <b>{`이거 해보면 ${KEY_NAME} 1${KEY_UNIT}씩 더 드려요`}</b>
      </div>
      <ul>
        {줄들.map((줄) => {
          const 끝 = 받았나(줄.값)
          return (
            <li key={줄.값} className={끝 ? 'done' : undefined}>
              {줄.말}
              {끝 && <span className="earn-got">받았어요</span>}
            </li>
          )
        })}
      </ul>
      <div className="earn-foot">
        {받은수 > 0 ? `${줄들.length}개 중 ${받은수}개 받았어요 · ` : ''}각각 처음 한 번만 드려요
      </div>
    </div>
  )
}
