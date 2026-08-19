import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import Portal from './Portal'
import { Stars } from './DiaryEntrySheet'
import { useModalBack } from '../useBackHandler'

// ✍️✍️ 「한 줄 남기기」 — 오직 한 줄만 받는 작은 창
//
// 📮 창업자 2026-08-19 = *"**이거 사진추가가 의미가 있어? 그리고 글쓰는 창도 불편하고 안예뻤어..**"*
//    ⭐ 맞는 지적이었다 — 처음엔 기존 `DiaryEntrySheet`(요리 기록 전체)를 그대로 불렀는데,
//       「한 줄」 쓰러 왔는데 **별점 다섯 ＋ 사진 추가 네모가 더 크게** 자리를 차지했다.
//    ⛔ 게다가 창업자 확정과 정면으로 부딪힌다 —
//       2026-08-17 *"요리기록 남기기 안하기로 하지 않았어??? **누를 시간 없어서 안하기로 했잖아**"*
//
// ⭐ 그래서 «목적이 하나면 화면도 하나»로 갈랐다:
//    · 이 창(홈의 「한 줄 남기기」) = **메모 한 줄만.** 별점·사진 없음
//    · `DiaryEntrySheet`(일기 탭·레시피 상세) = 요리 기록 전체(별점·사진·메모) — **그대로 둔다**
//    ⛔ 뺏는 게 아니다. 쓰고 싶은 사람은 그 자리에서 그대로 쓴다.
//
// 📮 안내 문구는 창업자 말 그대로다 — *"**이걸쓰면 비로소 나만의 레시피가 되는거잖아**"*
//    ＋ *"만들었어요 한줄 넣으면 레시피에 자동으로 뜨면 너무 좋지. **이걸 유저가 적을때 안내해주면 더 좋겠다.**"*
//    ✅ 아랫줄은 «약속»이라 지켜야 한다 — 실제로 레시피 상세와 요리 모드(재료 준비)에 붙인다(`MemoNote`).
export default function OneLineSheet({ entry, onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  const { updateDiary } = useStore()
  const [note, setNote] = useState(entry.note || '')
  // ⭐ 별점 = 창업자 판정 *"별점은 넣어도 괜찮겠다 **포스트잇에 보이면 되니까**"*
  //    📌 논리가 정확하다 — 별점이 «어디에도 안 보이면» 매길 이유가 없다.
  //       포스트잇에 뜨니까 「지난번엔 별 넷이었네」가 다음에 만들 때 정보가 된다.
  //    ⛔ 사진은 뺀다 — 창업자 *"이거 사진추가가 의미가 있어?"* (일기 탭엔 그대로 있다)
  const [rating, setRating] = useState(entry.rating || 0)
  const ref = useRef(null)

  // ⌨️ 열자마자 바로 칠 수 있게 — 「한 줄만」이라 한 동작이라도 줄인다
  //    ⚠️ 시트가 올라오는 동안 포커스를 주면 키보드가 애니메이션을 끊는다 → 한 박자 뒤에
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [])

  const save = () => {
    updateDiary(entry.id, { note: note.trim(), rating })
    onClose()
  }

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet one-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="one-head">
            <div className="one-title">{entry.title}</div>
            <button className="press one-close" onClick={onClose}>닫기</button>
          </div>

          {/* 📌 「왜 쓰는지」 ＋ 「어디에 쓰이는지」 — 쓰는 자리에서 말해준다 */}
          <div className="oneline-hint">
            <div className="oneline-hint-head">이걸 쓰면 비로소 «나만의» 레시피가 돼요</div>
            <div className="oneline-hint-sub">다음에 만들 때 재료 옆에 붙여둘게요</div>
          </div>

          <textarea
            ref={ref}
            className="one-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 간장 반만 · 면 1분 덜 삶기"
            rows={3}
          />

          {/* ⭐ 별점은 메모 «아래»에 조용히 — 「한 줄」이 주인공이고 이건 곁들이다.
              ⛔ 위에 크게 놓으면 「별부터 매겨야 하나」가 되어 창업자 확정과 부딪힌다. */}
          <div className="one-stars">
            <span className="one-stars-label">맛은 어땠어요?</span>
            <Stars value={rating} onChange={setRating} size={24} />
          </div>

          <div className="one-foot">
            <button className="press one-later" onClick={onClose}>나중에</button>
            {/* ⛔ 빈 채로 저장하면 카드가 안 사라져 「고장인가?」가 된다 — 아예 못 누르게 한다 */}
            <button className="press one-save" onClick={save} disabled={!note.trim()}>저장하기</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
