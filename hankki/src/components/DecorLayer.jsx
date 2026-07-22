import { useRef } from 'react'
import Icon from './Icon'
import { StickerArt, StickerFx, KITCHEN_IDS, stickerRatio, NOTE_COLORS, TEXT_COLORS, TEXT_FONTS, notePatternStyle, noteRadius, noteClip, noteIsClip, NoteShapeDefs, tapeStyle } from './Stickers'

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
    const wasSel = selectedId === it.id
    onSelect?.(it.id)
    const rect = boxRef.current.getBoundingClientRect()
    dragRef.current = { id: it.id, x0: it.x, y0: it.y, px: e.clientX, py: e.clientY, rect, moved: false, wasSel, it }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onItemMove = (e) => {
    const d = dragRef.current
    if (!d) return
    if (Math.abs(e.clientX - d.px) > 8 || Math.abs(e.clientY - d.py) > 8) d.moved = true
    const nx = clamp(d.x0 + (e.clientX - d.px) / d.rect.width, 0.02, 0.98)
    const ny = clamp(d.y0 + (e.clientY - d.py) / d.rect.height, 0.02, 0.98)
    onChange?.(d.id, { x: nx, y: ny })
  }
  const onItemUp = () => {
    const d = dragRef.current
    // 탭 = 선택(꾸미기 바로), 이미 선택된 걸 다시 탭 = 글씨 쓰기 — '두 번 탭' 방식(창업자 선택 2026-07-18).
    // 새로 붙일 땐 어차피 쓰기창이 자동으로 뜨므로, 탭은 꾸미기(선택)에 주는 게 전체적으로 편하다.
    // (드래그면 이동만. 쓰기는 다시 탭 또는 연필 버튼.)
    if (d && !d.moved && d.wasSel && (d.it.type === 'note' || d.it.type === 'text')) onEditNote?.(d.it)
    dragRef.current = null
  }

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
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'inline-size', pointerEvents: editable ? 'auto' : 'none', touchAction: editable ? 'none' : 'auto' }}
      onPointerDown={editable ? () => onSelect?.(null) : undefined}
    >
      {(editable || items.some((it) => it.type === 'note' && noteIsClip(it.shape))) && <NoteShapeDefs />}
      {items.map((it) => {
        const on = editable && selectedId === it.id
        const isText = it.type === 'text'
        const ratio = it.type === 'tape' ? (it.ratio || 3.4) : it.type === 'note' ? (it.shape === 'oval' ? 1.5 : it.shape === 'cloud' ? 1.35 : it.shape === 'circle' ? 1 : 1.06) : stickerRatio(it.key)
        const base = {
          position: 'absolute',
          left: `${it.x * 100}%`,
          top: `${it.y * 100}%`,
          // 글자: 상자를 '글자 길이에 딱 맞게'(max-content) — 짧으면 좁고 길면 넓게. 폭 고정 X.
          //       크기는 TextDeco가 it.s(커버 폭 기준 cqw)로 정하고, 한 줄이 커버(92%) 넘으면 자동 축소.
          // 나머지(스티커·테이프·포스트잇): 종전대로 폭=it.s + 종횡비 고정.
          ...(isText
            ? { width: 'max-content', maxWidth: '92cqw' }
            : { width: `${it.s * 100}%`, aspectRatio: `${ratio}` }),
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
            {it.type === 'tape' ? (
              <div style={{ position: 'absolute', inset: 0, ...tapeStyle(it.key), boxShadow: '0 1px 3px rgba(70,60,45,.18)' }} />
            ) : it.type === 'note' ? (
              <Note it={it} editable={editable} />
            ) : it.type === 'text' ? (
              <TextDeco it={it} editable={editable} />
            ) : (
              <span style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 3px 4px rgba(60,50,35,.22))' }}>
                <StickerArt id={it.key} color={it.color} motion={it.motion} />
                {KITCHEN_IDS.has(it.key) && <StickerFx kind={it.fx} />}
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
                  style={{ position: 'absolute', top: -17, right: -17, width: 31, height: 31, borderRadius: '50%', background: '#3f382e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
                >
                  <Icon name="x" size={15} color="#fff" stroke={2.6} />
                </button>
                {/* 포스트잇·글자 수정 */}
                {(it.type === 'note' || it.type === 'text') && (
                  <button
                    className="press"
                    aria-label="글 수정"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEditNote?.(it) }}
                    style={{ position: 'absolute', top: -17, left: -17, width: 31, height: 31, borderRadius: '50%', background: 'var(--brown)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
                  >
                    <Icon name="pen" size={15} color="#fff" />
                  </button>
                )}
                {/* 크기·회전 핸들 */}
                <span
                  aria-label="크기·회전"
                  onPointerDown={onHandleDown(it)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                  style={{ position: 'absolute', bottom: -19, right: -19, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(0,0,0,.15)', boxShadow: '0 2px 7px rgba(0,0,0,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'nwse-resize' }}
                >
                  <svg viewBox="0 0 20 20" width="19" height="19"><path d="M4 12a8 8 0 0 0 8-8M12 4h4v4" fill="none" stroke="#5a5244" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
// 줄바꿈은 사용자가 엔터로 직접(자동 분할 안 함 — "돼지고기가지볶음"처럼 붙은 글자가 이상하게 안 잘리게).
function TextDeco({ it, editable }) {
  const c = TEXT_COLORS.find((t) => t.key === it.color) || TEXT_COLORS[0]
  const f = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]
  const text = it.text || (editable ? '글자' : '')
  const maxLine = Math.max(1, ...text.split('\n').map((l) => [...l].length))
  // 글씨 크기 = 사용자가 정한 크기(it.s). 단위 cqw = 커버 폭(부모 컨테이너 기준).
  // 상자가 글자에 맞게 줄어드므로(max-content), 한 줄이 커버(92%)를 넘지 않게 크기에 상한만 둔다.
  const cqw = Math.min((it.s || 0.5) * 15, 92 / maxLine)
  const stroke = Math.max(0.25, cqw * 0.05)
  return (
    <div
      style={{
        fontFamily: f.family,
        fontWeight: f.weight,
        fontSize: `clamp(8px, ${cqw}cqw, 130px)`,
        lineHeight: 1.22,
        color: c.color,
        textAlign: 'center',
        whiteSpace: 'pre', // \n만 줄바꿈, 자동 줄바꿈 없음
        // 사진 위에서도 읽히게 반대 톤 외곽선 + 그림자
        WebkitTextStroke: `${stroke}cqw ${c.stroke}`,
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
  const shape = it.shape || 'fold'
  const pattern = it.pattern || 'plain'
  const pat = notePatternStyle(pattern, c.line || c.fold)
  const clip = noteClip(shape)
  const isClip = noteIsClip(shape)
  const radius = noteRadius(shape)
  // 플레이스홀더는 편집 중에만 — 저장된 표지에선 빈 포스트잇은 빈 종이로 보인다.
  const text = it.text || '' // 빈 포스트잇 = 글자 없이 노트만(안내문구 없이 그대로 빈 채로). 편집은 탭·연필로.
  // 글씨체 — 글자 도구와 같은 목록에서 고른다(컨텍스트 바). 없으면 귀염체가 기본.
  const nf = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]

  // 종이 판(색 + 무늬 + 모양). clip 모양은 그림자를 filter 로(clip 이 box-shadow 를 잘라내므로).
  const paper = {
    position: 'absolute', inset: 0, background: c.bg, overflow: 'hidden',
    ...(isClip
      ? { clipPath: clip, WebkitClipPath: clip, filter: 'drop-shadow(1.5px 3px 5px rgba(70,60,45,.3))' }
      : { borderRadius: radius, boxShadow: '1.5px 4px 10px rgba(70,60,45,.25)' }),
  }
  // 하트·별·곰 등은 글자가 실루엣 밖으로 안 나가게 안쪽 여백을 넉넉히.
  const textPad = isClip ? '22% 18%' : '9% 10%'

  return (
    <div style={{ position: 'absolute', inset: 0, containerType: 'size', color: c.text }}>
      {/* 종이 + 무늬 */}
      <div style={paper}>
        {pat && <span style={{ position: 'absolute', inset: 0, ...pat }} />}
        {shape === 'fold' && (
          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 16cqw 16cqw', borderColor: `transparent transparent ${c.fold} transparent` }} />
        )}
      </div>

      {/* 글자 (마스크 밖 — 실루엣 위에 얹힘) */}
      <div
        style={{
          position: 'absolute', inset: 0, boxSizing: 'border-box', padding: textPad,
          fontFamily: nf.family, fontWeight: nf.weight,
          fontSize: 'clamp(7px, 15cqw, 72px)', lineHeight: 1.4,
          overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        }}
      >
        {text}
      </div>

      {/* 테이프 — 위쪽 가운데 반투명 마스킹테이프 */}
      {shape === 'tape' && (
        <span style={{ position: 'absolute', top: '-6cqw', left: '50%', width: '46%', height: '15cqw', transform: 'translateX(-50%) rotate(-3deg)', background: 'rgba(255,255,255,.5)', border: '0.5px solid rgba(120,110,90,.18)', boxShadow: '0 1px 3px rgba(70,60,45,.14)' }} />
      )}
      {/* 핀 — 위쪽 가운데 압정 */}
      {shape === 'pin' && (
        <span style={{ position: 'absolute', top: '-7cqw', left: '50%', width: '15cqw', height: '15cqw', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #e08a7a, #c4614f)', boxShadow: '0 1.5px 3px rgba(60,30,25,.35)' }}>
          <span style={{ position: 'absolute', top: '22%', left: '26%', width: '26%', height: '26%', borderRadius: '50%', background: 'rgba(255,255,255,.65)' }} />
        </span>
      )}
    </div>
  )
}
