import { useEffect, useRef, useState } from 'react'
import Portal from './Portal'

// 사진 자르기 — OCR 전에 글자 영역만 선택. (블로그 캡처의 광고·그림을 빼고 읽기)
// 모서리 4개를 드래그해 영역을 조절하고, 안쪽을 드래그하면 통째로 이동.
const MIN = 0.12 // 최소 크기(비율)

export default function CropSheet({
  image,
  index = 0,
  total = 1,
  onDone,
  onSkip,
  onCancel,
  title = '글자 부분만 남기기',
  hint = (
    <>
      ✂️ 광고·사진은 빼고 <b style={{ color: '#fff' }}>재료·만드는 법 글자만</b> 남도록 모서리를 끌어 잘라주세요.<br />
      <span style={{ color: '#d8d4cc', fontSize: 12 }}>✨ 밝고 반듯하게 · 딱 맞게 자를수록 정확해요 · 읽은 건 초안이라 사진 보며 다듬으면 돼요</span>
    </>
  ),
}) {
  const boxRef = useRef(null) // 이미지가 실제로 그려진 영역
  const [rect, setRect] = useState({ x: 0.03, y: 0.03, w: 0.94, h: 0.94 })
  const drag = useRef(null)
  const fired = useRef(false) // 두 번 눌러도 한 번만 진행(중복 OCR·화면 이동 방지)

  useEffect(() => {
    setRect({ x: 0.03, y: 0.03, w: 0.94, h: 0.94 })
    fired.current = false
  }, [image])

  const once = (fn) => (...args) => {
    if (fired.current) return
    fired.current = true
    fn(...args)
  }

  const clamp = (r) => {
    const w = Math.max(MIN, Math.min(1, r.w))
    const h = Math.max(MIN, Math.min(1, r.h))
    return {
      w,
      h,
      x: Math.max(0, Math.min(1 - w, r.x)),
      y: Math.max(0, Math.min(1 - h, r.y)),
    }
  }

  const toLocal = (e) => {
    const b = boxRef.current.getBoundingClientRect()
    return { px: (e.clientX - b.left) / b.width, py: (e.clientY - b.top) / b.height }
  }

  const startDrag = (mode) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { mode, start: toLocal(e), rect0: rect }
  }

  const onMove = (e) => {
    if (!drag.current) return
    const { mode, start, rect0 } = drag.current
    const { px, py } = toLocal(e)
    const dx = px - start.px
    const dy = py - start.py
    let r = { ...rect0 }
    if (mode === 'move') {
      r.x = rect0.x + dx
      r.y = rect0.y + dy
    } else {
      if (mode.includes('l')) { r.x = rect0.x + dx; r.w = rect0.w - dx }
      if (mode.includes('r')) { r.w = rect0.w + dx }
      if (mode.includes('t')) { r.y = rect0.y + dy; r.h = rect0.h - dy }
      if (mode.includes('b')) { r.h = rect0.h + dy }
    }
    setRect(clamp(r))
  }

  const endDrag = () => { drag.current = null }

  const confirm = once(() => {
    const img = new Image()
    img.onload = () => {
      try {
        const sx = Math.round(rect.x * img.naturalWidth)
        const sy = Math.round(rect.y * img.naturalHeight)
        const sw = Math.max(1, Math.round(rect.w * img.naturalWidth))
        const sh = Math.max(1, Math.round(rect.h * img.naturalHeight))
        // OCR 은 2400px 이면 충분 — 고화질 원본을 그대로 저장하면 폰 메모리가 위험하다
        const scale = Math.min(1, 2400 / Math.max(sw, sh))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(sw * scale))
        c.height = Math.max(1, Math.round(sh * scale))
        const ctx = c.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height)
        onDone(c.toDataURL('image/jpeg', 0.92))
      } catch {
        onDone(image)
      }
    }
    img.onerror = () => onDone(image)
    img.src = image
  })

  const handle = (mode, style) => (
    <div
      onPointerDown={startDrag(mode)}
      style={{
        position: 'absolute',
        width: 30,
        height: 30,
        ...style,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.45)', border: '2.5px solid var(--brown)' }} />
    </div>
  )

  return (
   <Portal>
    {/* stopPropagation: 시트(닫기 핸들러가 있는 mask) 안에서 열려도 클릭이 새어나가
        부모 시트가 닫히지 않게 한다 — 일지 사진 추가가 조용히 취소되던 버그 방지 */}
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(20,19,17,0.96)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px calc(6px)', paddingTop: 'calc(14px + var(--safe-top, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="press" onClick={once(onCancel)} style={{ color: '#d8d5cf', fontSize: 14, fontWeight: 600 }}>취소</button>
        <div style={{ color: '#fff', fontSize: 14.5, fontWeight: 700 }}>
          {title}{total > 1 ? ` · ${index + 1}/${total}장` : ''}
        </div>
        <div style={{ width: 40 }} />
      </div>
      {/* 안내는 한 곳(위)에만 — 예전엔 위·아래로 쪼개져 이미지 사이에 끼어 한눈에 안 들어왔다. */}
      <div style={{ margin: '2px 16px 10px', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.13)', color: '#f4f1eb', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
        {hint}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 10px' }}>
        <div ref={boxRef} style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'inline-block', touchAction: 'none' }} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <img src={image} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }} draggable={false} />
          {/* 선택 영역 — 바깥은 어둡게 */}
          <div
            onPointerDown={startDrag('move')}
            style={{
              position: 'absolute',
              left: rect.x * 100 + '%',
              top: rect.y * 100 + '%',
              width: rect.w * 100 + '%',
              height: rect.h * 100 + '%',
              boxShadow: '0 0 0 9999px rgba(10,10,10,0.62)',
              border: '2px solid #fff',
              borderRadius: 4,
              touchAction: 'none',
              cursor: 'move',
            }}
          >
            {handle('tl', { left: -15, top: -15 })}
            {handle('tr', { right: -15, top: -15 })}
            {handle('bl', { left: -15, bottom: -15 })}
            {handle('br', { right: -15, bottom: -15 })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '10px 16px calc(16px + var(--safe-bottom, 0px))' }}>
        <button className="press" onClick={once(onSkip)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#f0ede7', fontSize: 14.5, fontWeight: 600 }}>
          전체 사용
        </button>
        <button className="press" onClick={confirm} style={{ flex: 1.6, padding: 14, borderRadius: 14, background: 'var(--brown)', color: '#fff', fontSize: 14.5, fontWeight: 700 }}>
          ✂️ 이 부분만 읽기
        </button>
      </div>
    </div>
   </Portal>
  )
}
