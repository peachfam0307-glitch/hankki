import { useEffect, useRef } from 'react'

// 👉👈 하단 탭을 «좌우로 밀어» 넘긴다 (창업자 2026-08-15 *"탭을 스크롤하면 넘겨질 수 있게 하면 좋겠어"*)
//
// ⭐ 왜 컴포넌트로 빼나 = App.jsx 에 손대는 줄을 «한 줄»로 줄이려고. 여기만 보면 이 기능이 다 있다.
//
// ⛔⛔ 이 앱엔 **가로로 미는 줄이 이미 많다** — 그 위에서 밀면 탭이 넘어가면 안 된다.
//    🔢 실측 = `.hscroll` 이 여섯 화면에 있다(주부의 장바구니 5 · 장보기 2 · 꾸미기 2 · 레시피 1 · INBOX 1 · 홈 1)
//    ＋ 「이번 주 픽」 줄 · 갈래 칩 줄 · 꾸미기 서랍 스티커 줄.
//    ✅ 그래서 **손가락이 «가로로 구를 수 있는 것» 위에서 시작하면 아예 안 센다.**
//       (`overflow-x` 가 auto/scroll 이고 실제로 내용이 넘치는 조상이 있나 — 눌린 자리에서 위로 훑는다)
//
// ⛔ 그리고 아래 넷에선 «끈다»:
//    ⑴ 화면이 쌓여 있을 때(레시피 상세·꾸미기 등) — 거기선 밀기가 딴 뜻이다
//    ⑵ 모달이 떠 있을 때
//    ⑶ 온보딩이 떠 있을 때 — 온보딩은 «자기 스와이프»가 따로 있다(`Onboarding.jsx:517`)
//    ⑷ 손가락이 둘 이상일 때(꼬집기)
//
// 📌 「가져오기」는 화면이 아니라 «단추»라 순서에서 뺀다 — 밀어서 갈 데가 없다.
const ORDER = ['home', 'myrecipes', 'log', 'shop', 'brag']

// 🔢 값은 흔한 기준으로 잡았다 — 「살짝 스쳤다」와 「밀었다」를 가르는 선.
const MIN_X = 60        // 이만큼은 가야 넘긴다(px)
const MAX_Y = 45        // 세로로 이보다 많이 갔으면 «세로 스크롤»이다
const MAX_MS = 600      // 이보다 오래 끌면 미는 게 아니라 «끌기»다
const EDGE = 24         // 화면 가장자리에서 시작하면 «뒤로가기 제스처»다 — 건드리지 않는다

function 가로로구르나(el, root) {
  for (let n = el; n && n !== root; n = n.parentElement) {
    if (n.nodeType !== 1) continue
    const ov = getComputedStyle(n).overflowX
    if ((ov === 'auto' || ov === 'scroll') && n.scrollWidth > n.clientWidth + 4) return true
  }
  return false
}

export default function TabSwipe({ tab, go, enabled }) {
  const st = useRef(null)
  const enabledRef = useRef(enabled)
  const tabRef = useRef(tab)
  enabledRef.current = enabled
  tabRef.current = tab

  useEffect(() => {
    const frame = document.querySelector('.app-frame') || document.body
    const start = (e) => {
      st.current = null
      if (!enabledRef.current || e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX < EDGE || t.clientX > innerWidth - EDGE) return   // 뒤로가기 제스처 자리
      if (가로로구르나(e.target, frame)) return
      st.current = { x: t.clientX, y: t.clientY, at: e.timeStamp }
    }
    const move = (e) => {
      if (st.current && e.touches.length !== 1) st.current = null      // 손가락이 늘면 취소
    }
    const end = (e) => {
      const s = st.current
      st.current = null
      if (!s || !enabledRef.current) return
      const t = e.changedTouches && e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y
      if (e.timeStamp - s.at > MAX_MS) return
      if (Math.abs(dy) > MAX_Y || Math.abs(dx) < MIN_X) return
      if (Math.abs(dx) < Math.abs(dy) * 1.6) return                   // 비스듬하면 안 센다
      const i = ORDER.indexOf(tabRef.current)
      if (i < 0) return
      const next = ORDER[i + (dx < 0 ? 1 : -1)]
      if (next) go(next)                                              // ⛔끝에서는 «아무 일도 안 일어난다»(감기지 않는다)
    }
    // passive — 우리는 «막지» 않는다. 세로 스크롤·가로 줄이 그대로 살아 있어야 한다.
    const opt = { passive: true }
    frame.addEventListener('touchstart', start, opt)
    frame.addEventListener('touchmove', move, opt)
    frame.addEventListener('touchend', end, opt)
    frame.addEventListener('touchcancel', () => { st.current = null }, opt)
    return () => {
      frame.removeEventListener('touchstart', start, opt)
      frame.removeEventListener('touchmove', move, opt)
      frame.removeEventListener('touchend', end, opt)
    }
  }, [go])

  return null
}
