import { useRef } from 'react'
import Icon from './Icon'
import { StickerArt, stickerRatio, NOTE_COLORS, TEXT_COLORS } from './Stickers'

// ── 꾸미기 레이어 ──
// 레시피 표지 위에 스티커·포스트잇을 얹는다.
// item: { id, type:'sticker'|'note', key(스티커 아트 id | 포스트잇 색 key), text, x, y, s, r }
//   x,y — 중심 위치(컨테이너 비율 0~1) / s — 폭(컨테이너 폭 비율) / r — 회전(도)
// editable=false 면 순수 표시(포인터 이벤트 없음), true 면 드래그·핸들·삭제 제공.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export default function DecorLayer({ items = [], editable = false, selectedId, onSelect, onChange, onRemove, onEditNote }) {
  const boxRef = useRef(null)

  // 드래그(이동) — 아이템 몸통
  const dragRef = useRef(null)
  const onItemDown = (it) => (e) => {
    if (!editable) return
    e.stopPropagation()
    onSelect?.(it.id)
    const rect = boxRef.current.getBoundingClientRect()
    dragRef.current = { id: it.id, x0: it.x, y0: it.y, px: e.clientX, py: e.clientY, rect }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onItemMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const nx = clamp(d.x0 + (e.clientX - d.px) / d.rect.width, 0.02, 0.98)
    const ny = clamp(d.y0 + (e.clientY - d.py) / d.rect.height, 0.02, 0.98)
    onChange?.(d.id, { x: nx, y: ny })
  }
  const onItemUp = () => { dragRef.current = null }

  // 핸들(크기+회전) — 선택된 아이템 우하단 손잡이
  const hRef = useRef(null)
  const onHandleDown = (it) => (e) => {
    e.stopPropagation()
    const rect = boxRef.current.getBoundingClientRect()
    const cx = rect.left + it.x * rect.width
    const cy = rect.top + it.y * rect.height
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    hRef.current = { id: it.id, cx, cy, d0: Math.hypot(dx, dy) || 1, a0: (Math.atan2(dy, dx) * 180) / Math.PI, s0: it.s, r0: it.r || 0 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e) => {
    const h = hRef.current
    if (!h) return
    const dx = e.clientX - h.cx
    const dy = e.clientY - h.cy
    const s = clamp(h.s0 * (Math.hypot(dx, dy) / h.d0), 0.07, 0.9)
    const r = h.r0 + (Math.atan2(dy, dx) * 180) / Math.PI - h.a0
    onChange?.(h.id, { s, r })
  }
  const onHandleUp = () => { hRef.current = null }

  return (
    <div
      ref={boxRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: editable ? 'auto' : 'none', touchAction: editable ? 'none' : 'auto' }}
      onPointerDown={editable ? () => onSelect?.(null) : undefined}
    >
      {items.map((it) => {
        const on = editable && selectedId === it.id
        const isText = it.type === 'text'
        const ratio = it.type === 'note' ? 1.06 : stickerRatio(it.key)
        const base = {
          position: 'absolute',
          left: `${it.x * 100}%`,
          top: `${it.y * 100}%`,
          width: `${it.s * 100}%`,
          // 글자·포스트잇 글씨가 '제 크기(cqw)'에 비례하도록 컨테이너로 지정.
          // 글자는 내용에 따라 높이가 달라지므로 종횡비를 고정하지 않는다.
          ...(isText ? { containerType: 'inline-size' } : { aspectRatio: `${ratio}` }),
          transform: `translate(-50%,-50%) rotate(${it.r || 0}deg)`,
          touchAction: 'none',
          cursor: editable ? 'grab' : 'default',
        }
        return (
          <div
            key={it.id}
            style={base}
            onPointerDown={onItemDown(it)}
            onPointerMove={onItemMove}
            onPointerUp={onItemUp}
            onPointerCancel={onItemUp}
          >
            {it.type === 'note' ? (
              <Note it={it} editable={editable} />
            ) : it.type === 'text' ? (
              <TextDeco it={it} editable={editable} />
            ) : (
              <span style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 3px 4px rgba(60,50,35,.22))' }}>
                <StickerArt id={it.key} />
              </span>
            )}

            {on && (
              <>
                {/* 선택 테두리 */}
                <span style={{ position: 'absolute', inset: -6, border: '1.6px dashed rgba(255,255,255,.9)', borderRadius: 10, boxShadow: '0 0 0 1px rgba(0,0,0,.25)', pointerEvents: 'none' }} />
                {/* 삭제 */}
                <button
                  className="press"
                  aria-label="스티커 삭제"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove?.(it.id) }}
                  style={{ position: 'absolute', top: -16, right: -16, width: 26, height: 26, borderRadius: '50%', background: '#3f382e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
                >
                  <Icon name="x" size={13} color="#fff" stroke={2.6} />
                </button>
                {/* 포스트잇·글자 수정 */}
                {(it.type === 'note' || it.type === 'text') && (
                  <button
                    className="press"
                    aria-label="글 수정"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEditNote?.(it) }}
                    style={{ position: 'absolute', top: -16, left: -16, width: 26, height: 26, borderRadius: '50%', background: 'var(--brown)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
                  >
                    <Icon name="pen" size={13} color="#fff" />
                  </button>
                )}
                {/* 크기·회전 핸들 */}
                <span
                  aria-label="크기·회전"
                  onPointerDown={onHandleDown(it)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                  style={{ position: 'absolute', bottom: -16, right: -16, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(0,0,0,.15)', boxShadow: '0 2px 6px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'nwse-resize' }}
                >
                  <svg viewBox="0 0 20 20" width="14" height="14"><path d="M4 12a8 8 0 0 0 8-8M12 4h4v4" fill="none" stroke="#5a5244" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 글자 크기는 '제 크기(cqw=요소 폭의 1%)'에 비례 — 크기 조절하면 글씨도 정확히 같은 비율로.
function TextDeco({ it, editable }) {
  const c = TEXT_COLORS.find((t) => t.key === it.color) || TEXT_COLORS[0]
  const text = it.text || (editable ? '글자' : '')
  return (
    <div
      style={{
        fontFamily: "'Gowun Dodum','Pretendard',sans-serif",
        fontWeight: 800,
        fontSize: 'clamp(10px, 22cqw, 120px)', // 요소 폭에 비례
        lineHeight: 1.25,
        color: c.color,
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        // 사진 위에서도 읽히게 반대 톤 외곽선 + 그림자
        WebkitTextStroke: `0.6cqw ${c.stroke}`,
        textShadow: '0 1px 3px rgba(0,0,0,.35)',
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  )
}

function Note({ it, editable }) {
  const c = NOTE_COLORS.find((n) => n.key === it.key) || NOTE_COLORS[0]
  // 플레이스홀더는 편집 중에만 — 저장된 표지에선 빈 포스트잇은 빈 종이로 보인다.
  const text = it.text || (editable ? '탭해서 쓰기' : '')
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        containerType: 'size', // 안쪽 글씨가 포스트잇 크기에 비례하도록
        background: c.bg, color: c.text,
        borderRadius: '3% 3% 3% 12%',
        boxShadow: '1.5px 4px 10px rgba(70,60,45,.25)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%', height: '100%', boxSizing: 'border-box', padding: '9% 10%',
          fontFamily: "'Gowun Dodum','Pretendard',sans-serif",
          fontSize: 'clamp(7px, 15cqw, 72px)', lineHeight: 1.4,
          overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          // 글자를 포스트잇 한가운데에 (위에 붙어 아래가 비던 문제 해결)
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        }}
      >
        {text}
      </div>
      {/* 접힌 모서리 — 크기도 포스트잇에 비례 */}
      <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 16cqw 16cqw', borderColor: `transparent transparent ${c.fold} transparent` }} />
    </div>
  )
}
