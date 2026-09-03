import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { openExternal } from '../utils'
import { STORE_URL, markReviewAsked } from '../nudges'
// 🐻 하트 안은 꼬르곰 — 고마움을 전하는 자리다(엄지척은 우리가 유저를 평가하는 그림이 되어 안 쓴다)
import uiGomHeart from '../assets/ui/gom_heart.png'

// 한마디 청하기 — 뜨는 자리는 «둘»이다(머리글은 자리마다 밖에서 준다).
//   ① 레시피를 저장한 직후 — 내 레시피가 2개 이상일 때 (`EditorScreen` → `App`)
//   ② 레꾸 자랑을 실제로 보낸 직후 (`BragScreen` · `RecipeDetailScreen`)
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · "별점 5개 부탁드려요" 금지 — 별점을 구걸하면 브랜드가 싸구려가 된다
//    · [나중에]를 크게. 한 번 거절하면 다시 묻지 않는다
//    · 캐릭터는 한 마디만
// 🏷 [2026-08-27] 머리글을 밖에서 받는다 — **뜨는 자리가 둘이 됐다.**
//    ⛔ 예전엔 「N번째 한 끼예요」가 박혀 있었는데, 레꾸자랑 공유 직후(㉠)에 뜨면 **그 말이 거짓이 된다**
//       (요리를 안 하고 꾸며서 보낸 사람일 수 있다). **자리마다 참인 말**을 준다.
export default function ReviewAskSheet({ onClose, title }) {
  const close = () => { markReviewAsked(); onClose() } // 뜬 순간부터 '물어봤음' — 어떻게 닫아도 다시 안 묻는다
  // ⛔⛔ [2026-08-27] 여기가 `useModalBack(onClose)` 였다 — **뒤로가기로 닫으면 「물어봤음」이 안 남았다.**
  //    📮 창업자 물음 = *"레꾸자랑을 하면 «1회만» 리뷰써달라는 안내가뜨는거지?"* → 코드를 열어보고 찾았다.
  //    ⭐ 자리가 «기록 시트 닫는 순간» 하나였을 땐 거의 안 드러났다 — 거기까지 온 사람이 거의 없었으니까.
  //       공유 직후(㉠)로 자리를 열자 **다음 공유마다 또 뜨는** 길이 된다 = 조르는 앱이 된다(재촉 금지 원칙 위반).
  //    📌 「어떻게 닫아도」라고 주석에 «적혀 있었는데» 뒤로가기만 예외였다. **적힌 말과 코드가 갈려 있었다.**
  useModalBack(close)
  return (
    <Portal>
      <div className="sheet-mask" onClick={close}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>{title || '레시피를 담았어요'}</span>
            <button className="press" onClick={close} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 16 }}>
              <img src={uiGomHeart} alt="" aria-hidden="true" width={62} height={62} style={{ width: 62, height: 62, objectFit: 'contain', flex: '0 0 auto' }} />
              <div className="t-sub" style={{ fontSize: 16.5, lineHeight: 1.65 }}>
                한끼가 도움이 됐다면 한마디 남겨주실래요?<br />짧은 한 줄도 큰 힘이 돼요.
              </div>
            </div>
            <button
              className="btn-primary press"
              style={{ marginBottom: 8 }}
              onClick={() => { openExternal(STORE_URL); close() }}
            >
              스토어에 한마디
            </button>
            <button className="btn-ghost press" style={{ width: '100%' }} onClick={close}>나중에</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
