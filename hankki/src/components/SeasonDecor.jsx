// 🎑🎃 홈 명절 장식 — 창업자가 놓아보기 판에서 놓은 «그 자리»에 그린다.
// 📮 창업자 확정 2026-09-09. 자리·크기 = `src/data/seasonDecor.js` (⛔여기서 숫자를 만들지 않는다)
//
// ⛔⛔⛔ [2026-09-10 창업자 제보 · 이게 마지막 판이다]
//    *"큰달 아래작은달 애들 기도하는거 움직인다고.. 움직이자나"* ＋ *"내가 정한자리에서 고정시켜"*
//    🔎 그 전 판은 «화면 고정»(position: fixed)이었다. 그러면 굴릴 때 글은 지나가는데 조각은 남아서
//       **글 위를 미끄러지듯 지나간다** — 창업자 눈에는 그게 「움직인다」였다.
//    ⭐⭐ **「고정」의 뜻 = 창업자가 놓은 «그 자리»에 못 박히는 것**이지, 화면에 달라붙는 게 아니다.
//    ✅ 그래서 조각을 «페이지(굴러가는 글)»에 박는다 — 굴려도 그 글 옆에 그대로 있다.
//       · 「위」에 놓은 것 = 글의 «맨 위»에서 잰 자리   · 「아래」에 놓은 것 = 글의 «맨 아래»에서 잰 자리
//         (창업자가 배경 두 장 — 맨 위 캡처·맨 아래 캡처 — 위에 나눠 놓았기 때문이다)
//
// ⛔ `.screen` 에 `position: relative` 를 «주지 않는다» — 여섯 화면이 같이 쓰는 클래스라
//    남의 화면에서 다른 것들의 기준이 통째로 바뀐다.
//    ✅ 대신 «우리 것»인 높이 0 짜리 닻(anchor)을 글 맨 끝에 하나 넣고, 거기에 대고 잰다.
//       닻은 우리가 만든 것이라 남의 화면에 아무 영향이 없다.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { 홈장식 } from '../data/seasonDecor.js'
import { useSeasonCuts } from '../season/useSeasonCuts.js'

export default function SeasonDecor() {
  const { 철, 컷 } = useSeasonCuts()
  const [통, set통] = useState(null)
  const [잰것, set잰것] = useState(null)
  // ⚓ 닻이 «글 어디쯤»에 박혔나 — 글 끝에 여백이 더 있어서 닻은 바닥보다 위에 있다(실측 134px).
  //    ⛔ `scrollHeight` 를 그대로 쓰면 그 여백만큼 통째로 어긋난다(2026-09-10 실제로 그랬다).
  const 닻 = useRef(null)
  const [닻자리, set닻자리] = useState(null)

  useEffect(() => {
    if (!철 || !컷) return
    // ⛔ ref 로 찾지 않는다 — 우리는 이 화면의 «바깥»(포털)으로 나가 있어서 closest 로는 못 찾는다.
    const el = document.querySelector('.screen')
    if (!el) return
    set통(el)
    // 🔢 재는 것 둘
    //   · 폭·높이 = 판의 자 = «창»이다(판 배경이 창 전체 캡처였다 · 2026-09-09 확정)
    //   · 글높이 = 굴러가는 글 전체 높이 — 「위」 조각을 맨 위에서부터 재려면 이게 있어야 한다
    //   ⚠️⚠️ 판의 배경은 «창 전체» 캡처였는데 글통(`.screen`)은 «상단바 아래에서 탭바 위까지»다.
    //      그 차이(위 여백·아래 여백)를 안 빼면 조각이 통째로 밀린다 — 2026-09-10 실측 **134px** 어긋났다.
    const 재기 = () => {
      const r = el.getBoundingClientRect()
      set잰것({ 폭: innerWidth, 높이: innerHeight, 글높이: el.scrollHeight, 통위: r.top })
      if (닻.current) {
        const 위치 = 닻.current.offsetTop
        set닻자리({ 앞: 위치, 뒤: el.scrollHeight - 위치 })
      }
    }
    재기()
    // ⛔⛔ [2026-09-10 검사 중에 잡았다 — 장식이 «아예 안 뜨는» 판이 있었다]
    //    까닭 = 첫 바퀴엔 `통` 이 없어서 닻(`<div ref={닻}>`)이 아직 안 붙어 있다.
    //    그래서 첫 `재기()` 는 닻자리를 못 재고 `null` 로 남는데, 그 뒤로 창 크기가 안 변하면
    //    ResizeObserver 가 다시 안 불려 **닻자리가 영영 null → span 을 한 개도 안 그린다.**
    //    (코치 팝업처럼 뭔가 열렸다 닫히는 폰에선 우연히 살아났다 — 조용한 폰에선 안 떴다)
    //    ✅ 닻이 붙은 «다음 그림»에서 한 번 더 잰다. 값이 같으면 화면은 그대로다.
    const 다음그림 = requestAnimationFrame(() => requestAnimationFrame(재기))
    const ro = new ResizeObserver(재기)
    ro.observe(el)
    // 📌 목록이 늘면 글이 길어진다 — 통 «안쪽»도 본다.
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    window.addEventListener('resize', 재기)
    return () => { cancelAnimationFrame(다음그림); ro.disconnect(); window.removeEventListener('resize', 재기) }
    // 📌 `통` 도 본다 — 통이 붙은 «다음 바퀴»에 다시 돌아 닻자리를 확실히 잡는다.
  }, [철, 컷, 통])

  if (!철 || !컷 || !통) return null
  const 조각들 = 홈장식[철] || []

  return createPortal(
    // 📌 높이 0 · position:relative 짜리 «닻» — 글 맨 끝에 붙는다. 줄 높이를 한 픽셀도 안 늘린다.
    //    ⛔ pointer-events: none — 장식이 단추 위에 앉아 누름을 먹으면 안 된다.
    <div ref={닻} aria-hidden style={{ position: 'relative', height: 0, pointerEvents: 'none' }}>
      {잰것 && 닻자리 && 조각들.map((조각, i) => {
        const w = 조각.w * 잰것.폭
        // ⭐ y 는 «가운데»다(판이 translate(-50%,-50%) 로 놓았다) — 여기서도 가운데로 놓는다.
        //   · 아래 조각 = 글 맨 아래에서 위로 (1-y)×화면높이   → 닻 기준 음수
        //   · 위  조각 = 글 맨 위에서 아래로 y×화면높이        → 닻에서 글높이만큼 거슬러 올라간다
        const 위쪽 = 조각.화면 === '아래'
          ? -(1 - 조각.y) * 잰것.높이 + 닻자리.뒤   // 닻 뒤에 남은 여백만큼 도로 내린다
          : -닻자리.앞 + 조각.y * 잰것.높이 - 잰것.통위
        // ⛔⛔ 자리잡기와 «움직임»을 한 상자에 같이 두면 안 된다 — `hk-m-float` 같은 모션이
        //    `transform` 을 통째로 갈아끼워서 `translate(-50%,-50%)`(가운데맞춤)를 지워 버린다.
        //    ✅ 바깥 껍데기 = 자리·가운데맞춤·좌우뒤집기 / 안쪽 그림 = 모션. 서로 안 건드린다.
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: 조각.x * 잰것.폭,
              top: 위쪽,
              width: w,
              opacity: 조각.o,
              transform: `translate(-50%, -50%)${조각.반전 ? ' scaleX(-1)' : ''}`,
              zIndex: 0,
            }}
          >
            <img
              src={컷[조각.id]}
              alt=""
              draggable={false}
              className={조각.모션}
              // ⛔ 못 받아도 «깨진 그림 아이콘»이 뜨면 안 된다 — 조용히 숨긴다.
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              // ⛔ maxWidth:'none' 이 «반드시» 있어야 한다 — 전역 「img{max-width:100%}」 가
              //    기준을 「폭이 정해지지 않은 상자」로 잡아 그림을 찌그러뜨린다(2026-09-09 실제로 그랬다).
              style={{ display: 'block', width: '100%', maxWidth: 'none' }}
            />
          </span>
        )
      })}
    </div>,
    통
  )
}
