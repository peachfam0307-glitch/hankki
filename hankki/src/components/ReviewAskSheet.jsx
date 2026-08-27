import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { openExternal } from '../utils'
import { STORE_URL, markReviewAsked, REVIEW_AT } from '../nudges'
// 🐻 하트 안은 꼬르곰 — 고마움을 전하는 자리다(엄지척은 우리가 유저를 평가하는 그림이 되어 안 쓴다)
import uiGomHeart from '../assets/ui/gom_heart.png'

// 요리 기록 N번째 직후 딱 한 번 뜨는 한마디 청하기.
//
// ⛔ 설계원칙 = `docs/리텐션-설계원칙-2026-07-30.md`
//    · "별점 5개 부탁드려요" 금지 — 별점을 구걸하면 브랜드가 싸구려가 된다
//    · [나중에]를 크게. 한 번 거절하면 다시 묻지 않는다
//    · 캐릭터는 한 마디만
export default function ReviewAskSheet({ onClose }) {
  useModalBack(onClose)
  const close = () => { markReviewAsked(); onClose() } // 뜬 순간부터 '물어봤음' — 어떻게 닫아도 다시 안 묻는다
  return (
    <Portal>
      <div className="sheet-mask" onClick={close}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>{REVIEW_AT}번째 한 끼예요</span>
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
