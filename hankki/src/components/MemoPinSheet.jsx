import { useState, useRef, useEffect } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'

// 📌 「메모 붙이기」 — 요리를 안 해도 «언제든» 레시피에 붙이는 메모 (창업자 2026-10-29)
//   📮 「그냥 레시피자체에 메모를 언제든 넣으면 좋은데」 · 자리 = 「재료」 옆 단추(②) · 「b로하고 수정을 할수 있으면 되자나」
//   ⭐ 저장 = 레시피의 `postit: { text, at }` — 요리 기록(diary)에 넣지 않는다(넣으면 「만들었어요」 횟수에 잡힌다)
//   ⭐ 붙인 메모가 있으면 포스트잇에 «늘 먼저» 뜬다(ⓑ) · 비우고 저장하면 뗀다
//   생김새는 「한 줄 남기기」 창(OneLineSheet)과 같은 옷을 입는다
export default function MemoPinSheet({ title, text, onSave, onClose }) {
  useModalBack(onClose)
  const [note, setNote] = useState(text || '')
  const ref = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [])
  const 있던것 = !!String(text || '').trim()

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet one-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="one-head">
            <div className="one-title">{title}</div>
            <button className="press one-close" onClick={onClose}>닫기</button>
          </div>
          <div className="oneline-hint">
            <div className="oneline-hint-head">재료 옆에 포스트잇으로 붙여둘게요</div>
            <div className="oneline-hint-sub">언제든 다시 눌러 고칠 수 있어요</div>
          </div>
          <textarea
            ref={ref}
            className="one-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 간장 반만 · 면 1분 덜 삶기"
            rows={3}
          />
          <div className="one-foot">
            {있던것
              ? <button className="press one-later" onClick={() => { onSave(''); onClose() }}>떼기</button>
              : <button className="press one-later" onClick={onClose}>나중에</button>}
            <button className="press one-save" onClick={() => { onSave(note.trim()); onClose() }} disabled={!note.trim()}>붙이기</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
