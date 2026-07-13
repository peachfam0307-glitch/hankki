import { useEffect, useRef, useState } from 'react'
import Portal from './Portal'

// 앱 안에서 쓰는 입력 시트 — window.prompt 대체.
// 설치형 PWA에서 window.prompt 는 사이트 주소가 박힌 검은 시스템 창을 띄워서(브라우저 보안 표시)
// 촌스럽고 놀라게 한다. 그래서 앱 톤에 맞는 바텀시트로 대신 받는다.
// fields: [{ key, label, value, placeholder, multiline, maxLength }]
export default function PromptSheet({ title, fields, submitLabel = '저장', onSubmit, onClose }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.value ?? ''])))
  const firstRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  const submit = () => {
    onSubmit(vals)
    onClose()
  }

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>{title}</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            {fields.map((fld, i) => (
              <div className="field" key={fld.key}>
                {fld.label && <label>{fld.label}</label>}
                {fld.multiline ? (
                  <textarea
                    ref={i === 0 ? firstRef : null}
                    rows={2}
                    value={vals[fld.key]}
                    placeholder={fld.placeholder || ''}
                    onChange={(e) => setVals((v) => ({ ...v, [fld.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    ref={i === 0 ? firstRef : null}
                    value={vals[fld.key]}
                    placeholder={fld.placeholder || ''}
                    onChange={(e) => setVals((v) => ({ ...v, [fld.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !fld.multiline) submit() }}
                  />
                )}
              </div>
            ))}
            <button className="btn-primary press" style={{ marginTop: 6 }} onClick={submit}>{submitLabel}</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
