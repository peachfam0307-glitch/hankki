import { useEffect, useRef, useState } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'

// 앱 안에서 쓰는 입력 시트 — window.prompt 대체.
// 설치형 PWA에서 window.prompt 는 사이트 주소가 박힌 검은 시스템 창을 띄워서(브라우저 보안 표시)
// 촌스럽고 놀라게 한다. 그래서 앱 톤에 맞는 바텀시트로 대신 받는다.
// fields: [{ key, label, value, placeholder, multiline, maxLength }]
export default function PromptSheet({ title, fields, submitLabel = '저장', onSubmit, onClose, compact = false }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.value ?? ''])))
  const firstRef = useRef(null)
  // 시트를 '탭'으로 여는 경우(포스트잇 탭해서 쓰기 등), 그 탭의 뒤따라오는 click 이
  // 방금 뜬 배경(sheet-mask)에 닿아 시트가 열리자마자 닫히는 걸 막는다. 열린 직후 잠깐은 배경 닫기를 무시.
  const readyRef = useRef(false)
  useModalBack(onClose) // 뒤로가기 → 닫기(취소)

  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60)
    const r = setTimeout(() => { readyRef.current = true }, 320)
    return () => { clearTimeout(t); clearTimeout(r) }
  }, [])

  const submit = () => {
    onSubmit(vals)
    onClose()
  }

  return (
    <Portal>
      <div className="sheet-mask" onClick={() => { if (readyRef.current) onClose() }}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: compact ? 10 : 22 }}>
          <div className="emoji-sheet-head">
            <span>{title}</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          {compact ? (
            // 컴팩트: 라벨 없이 한 줄 입력 + '붙이기'를 옆에 붙여 시트를 낮게 → 표지(배경)가 위로 더 보인다
            <div style={{ padding: '2px 14px 0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {fields[0].multiline ? (
                // 여러 줄 입력(글자·메모): 엔터 = 줄바꿈, '붙이기'로 완성. 2줄·3줄 자유롭게.
                <textarea
                  ref={firstRef}
                  rows={2}
                  style={{ flex: 1, minWidth: 0, resize: 'none' }}
                  value={vals[fields[0].key]}
                  placeholder={fields[0].placeholder || ''}
                  onChange={(e) => setVals((v) => ({ ...v, [fields[0].key]: e.target.value }))}
                />
              ) : (
                <input
                  ref={firstRef}
                  style={{ flex: 1, minWidth: 0 }}
                  value={vals[fields[0].key]}
                  placeholder={fields[0].placeholder || ''}
                  onChange={(e) => setVals((v) => ({ ...v, [fields[0].key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                />
              )}
              <button className="btn-primary press" style={{ flex: '0 0 auto', width: 'auto', padding: '0 22px', margin: 0, whiteSpace: 'nowrap' }} onClick={submit}>{submitLabel}</button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </Portal>
  )
}
