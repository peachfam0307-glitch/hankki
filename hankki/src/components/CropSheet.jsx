import { useEffect, useRef, useState } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'

// 사진 자르기 — OCR 전에 글자 영역만 선택. (블로그 캡처의 광고·그림을 빼고 읽기)
// 모서리 4개를 드래그해 영역을 조절하고, 안쪽을 드래그하면 통째로 이동.
const MIN = 0.12 // 최소 크기(비율)
// 📮📮 2026-08-15 창업자 *"상자를 줄일때 자꾸 뒤로가기가됨"*
// ⭐⭐ 원인 = **손잡이가 「안드로이드 뒤로가기 제스처 구역」에 들어간다.**
//    🔢 옛 값 = 여백 10px · 손잡이는 상자 밖으로 **15px** 튀어나온다(`left:-15`)
//       → 상자를 좌우 끝까지 줄이면 손잡이 한가운데가 화면 가장자리에서 **10px** 안쪽이다.
//       안드로이드 제스처 내비의 뒤로가기 띠는 «양옆 약 24px» — 그 안이면 OS 가 먼저 먹는다.
//    ⛔ 웹에서는 그 띠를 «끌 수 없다**(`setSystemGestureExclusionRects` 는 네이티브 API).
//       → 막을 방법은 하나뿐 = **손잡이를 그 띠 «밖»에 두는 것.**
// ✅ 여백 = 24(제스처 띠) ＋ 15(손잡이가 튀어나온 만큼) ＋ 5(여유) = **44px**
//    ⚠️ 아래 style 의 padding 과 «반드시» 같은 값 (예전에 여기서 어긋난 적이 있다)
const AREA_PAD = 44

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
      광고·사진은 빼고 <b style={{ color: '#fff' }}>재료·만드는 법 글자만</b> 남도록 모서리를 끌어 잘라주세요.<br />
      <span style={{ color: '#d8d4cc', fontSize: 12 }}>밝고 반듯하게 · 딱 맞게 자를수록 정확해요 · 읽은 건 초안이라 사진 보며 다듬으면 돼요</span>
    </>
  ),
}) {
  useModalBack(onCancel) // 뒤로가기 → 취소(닫기)
  const boxRef = useRef(null) // 이미지가 실제로 그려진 영역
  const areaRef = useRef(null) // 이미지가 들어갈 «빈 자리»(패딩 포함)
  const imgRef = useRef(null)
  const [fit, setFit] = useState(null) // 실제로 그릴 크기 {w,h}
  const [rect, setRect] = useState({ x: 0.03, y: 0.03, w: 0.94, h: 0.94 })
  const drag = useRef(null)
  const fired = useRef(false) // 두 번 눌러도 한 번만 진행(중복 OCR·화면 이동 방지)

  // ⭐ 박스 크기를 «내가» 정한다 — 여기가 크롭 정확도의 심장이다.
  //   예전엔 이미지에 maxHeight: calc(100vh - 200px) 를 주고 박스엔 maxHeight: 100% 를 줬는데,
  //   그 200px 은 위아래 여백을 «어림잡은» 값이라 실제 자리 높이와 안 맞았다.
  //   실측(390×844) = 이미지 644px · 박스 616.8px 로 27px 어긋났고, 폰은 안전영역 때문에 더 벌어진다.
  //   비율은 박스 기준으로 재는데(toLocal) 실제 그림은 그보다 크니 → 손가락으로 짚은 곳보다
  //   «아래쪽»이 잘려 나갔다(창업자: "내가 자른 것보다 더 작게 잘려").
  //   → 빈 자리를 직접 재서 object-fit: contain 과 같은 계산을 하고, 박스를 그 크기로 못 박는다.
  //     그러면 박스 = 그려진 이미지라 「보이는 것」과 「자르는 것」이 같아진다.
  // ⚠️ 원본 크기는 «상태에 담아두지 않고» 그때그때 img 에서 읽는다.
  //    담아뒀더니 「사진 바뀜」 초기화 effect 가 onLoad 보다 늦게 돌아 방금 잰 값을 지워버렸다
  //    (실제로 그래서 크기가 안 잡힌 채 넘어갔다). 살아 있는 값을 읽으면 순서 싸움이 아예 없다.
  const measure = () => {
    const area = areaRef.current
    const img = imgRef.current
    if (!area || !img || !img.naturalWidth || !img.naturalHeight) return
    const availW = Math.max(1, area.clientWidth - AREA_PAD * 2)
    const availH = Math.max(1, area.clientHeight)
    const k = Math.min(availW / img.naturalWidth, availH / img.naturalHeight)
    setFit({ w: Math.max(1, Math.round(img.naturalWidth * k)), h: Math.max(1, Math.round(img.naturalHeight * k)) })
  }

  useEffect(() => {
    setRect({ x: 0.03, y: 0.03, w: 0.94, h: 0.94 })
    fired.current = false
    setFit(null)
    measure() // 이미 받아둔 사진이면 여기서 바로 잡힌다(onLoad 를 안 기다린다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  useEffect(() => {
    const area = areaRef.current
    if (!area) return undefined
    // 화면 회전·키보드로 자리가 바뀌면 다시 잰다
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null
    ro?.observe(area)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      <div ref={areaRef} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: `0 ${AREA_PAD}px` }}>
        {/* 박스 크기 = 위 measure() 가 잰 값. 이미지가 이 박스를 «딱» 채우므로 여백(레터박스)이 0이다. */}
        <div ref={boxRef} style={{ position: 'relative', width: fit ? fit.w : '100%', height: fit ? fit.h : '100%', touchAction: 'none', visibility: fit ? 'visible' : 'hidden' }} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <img
            ref={imgRef}
            src={image}
            alt=""
            onLoad={measure}
            style={{ display: 'block', width: '100%', height: '100%' }}
            draggable={false}
          />
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
          이 부분만 읽기
        </button>
      </div>
    </div>
   </Portal>
  )
}
