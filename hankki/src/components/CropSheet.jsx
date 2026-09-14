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
  // 🏷 확인 단추 글자 — 기본은 «글자 읽기»(OCR)용이다.
  //    ⛔ 사진을 자를 땐 「읽기」가 틀린 말이다 — 그 사진은 읽는 게 아니라 «담는» 것이다.
  //       (2026-08-21 완성 사진을 붙이며 드러났다)
  //    ✅ 창업자 확정 2026-08-21 = *"일기도 담기로 바꾸고"* → 일기 사진(`DiaryEntrySheet`)도 「담기」다.
  //       ⛓ 같은 기능은 탭이 달라도 같은 이름 — 사진을 자르는 자리는 «전부» 「담기」로 간다.
  //    ⚠️ 기본값은 여전히 「읽기」다 — 그게 «글자 읽기»(OCR) 자리의 말이라서다. ⛔바꾸지 말 것.
  doneLabel = '이 부분만 읽기',
  // ⏳⏳ **[2026-08-16] 「앞 장은 지금 읽고 있어요」** — 창업자 *"사진2장스캔은 기다리다 끌 수 있으니
  //   스캔중이다라는 안내가 필요해."*
  //   ⭐⭐ **이건 내가 오늘 만든 구멍이다.** 자르기와 읽기를 떼어놓으면서
  //      «읽는 중» 상자가 이 자르기 화면 «뒤»로 숨어 버렸다 — 유저 눈엔 아무 일도 안 일어난다.
  //      ⛔ 안 보이는 진행은 없는 진행이다. 그래서 여기 «위»에 다시 띄운다.
  //   ⚠️ 읽고 있을 때만 뜬다 — 한 장짜리는 이 자리에 아무것도 안 나온다(잔소리 금지).
  reading = null, // { page, total, pct } | null
  // ✂️✂️ **[창업자 확정 2026-09-13] 「글자를 골라내라」 → 「사진만 잘라내라」로 뒤집었다.**
  //   📮 창업자 = *"한끼에서 가져오기에 제목이랑 레시피만 자르라고 안내안넣어도 돼"*
  //            → *"사진부분만 자르라고 해도 될 듯해"*
  //   ⛔⛔ 옛 안내(「재료·만드는 법 글자만 남도록 잘라주세요」)는 **AI 가 잘 돌수록 손해**다.
  //      🔢 실물 근거(2026-09-13 · 스테이크솥밥) = 원본 캡션의 «재료 줄»엔 여섯 개뿐인데
  //         AI 가 **조리 문장에서 쌀 2컵·올리브오일·물 2컵을 더 뽑아** 아홉 개를 채웠다.
  //         → 유저가 「재료 부분만」 잘라 보내면 **그 셋을 뽑을 글이 사라진다.**
  //      📌 즉 옛 안내는 우리 프롬프트 규칙 4(조리 문장에서 재료를 뽑아라)와 «서로 반대»였다.
  //   ✅ 그래서 자를 것은 **글자가 아니라 «사진»**이다 — 인스타 캡처는 위가 사진, 아래가 글이라
  //      사진만 걷어내면 글은 통째로 남는다.
  //   ⛔ 자르기를 «없애지» 않는다 — 사진이 크게 들어가면 그만큼 글이 작게 읽힌다(절대원칙 39).
  title = '사진 부분 잘라내기',
  hint = (
    <>
      <b style={{ color: '#fff' }}>글자는 다 남기고</b> 사진 부분만 잘라내면 돼요.<br />
      <span style={{ color: '#d8d4cc', fontSize: 15 }}>그대로 둬도 괜찮아요 · 읽은 건 초안이라 사진 보며 다듬으면 돼요</span>
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
        <button className="press" onClick={once(onCancel)} style={{ color: '#d8d5cf', fontSize: 16, fontWeight: 600 }}>취소</button>
        <div style={{ color: '#fff', fontSize: 16.5, fontWeight: 700 }}>
          {title}{total > 1 ? ` · ${index + 1}/${total}장` : ''}
        </div>
        <div style={{ width: 40 }} />
      </div>
      {/* 안내는 한 곳(위)에만 — 예전엔 위·아래로 쪼개져 이미지 사이에 끼어 한눈에 안 들어왔다. */}
      <div style={{ margin: '2px 16px 10px', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.13)', color: '#f4f1eb', fontSize: 16, textAlign: 'center', lineHeight: 1.6 }}>
        {hint}
      </div>

      {/* ⏳ 앞 장 읽는 중 — 자르는 동안 뒤에서 돌고 있다는 걸 «보이게» 한다.
          ⭐ 막대까지 같이 둔다 — 글자만 있으면 「멈춘 것」인지 「도는 것」인지 구별이 안 된다. */}
      {reading && (
        <div style={{ margin: '0 16px 10px', padding: '9px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#f4f1eb' }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.45 }}>
            {reading.total > 1 ? `${reading.total}장 중 ${reading.page}장째 읽는 중이에요` : '사진에서 글자 읽는 중이에요'}
            <span style={{ color: '#cfcac1', fontWeight: 600 }}> · 자르는 동안 같이 읽고 있어요</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{
              height: '100%', borderRadius: 99, background: '#f4f1eb',
              width: `${Math.min(100, Math.max(4, Math.round(((reading.page - 1) * 100 + (reading.pct || 0)) / Math.max(1, reading.total))))}%`,
              transition: 'width .35s ease',
            }} />
          </div>
        </div>
      )}

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
        <button className="press" onClick={once(onSkip)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#f0ede7', fontSize: 16.5, fontWeight: 600 }}>
          전체 사용
        </button>
        <button className="press" onClick={confirm} style={{ flex: 1.6, padding: 14, borderRadius: 14, background: 'var(--brown)', color: '#fff', fontSize: 16.5, fontWeight: 700 }}>
          {doneLabel}
        </button>
      </div>
    </div>
   </Portal>
  )
}
