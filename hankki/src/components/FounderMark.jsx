// 🧑‍🍳 주인장 표시 — 창업자가 «직접 만든» 레시피(made:'창업자') 제목 옆 요리사 모자 꼬르곰
// 창업자 2026-11-18 「상세화면에만 주인장표시있자나. 우리 앱 레시피 제목 옆에도 달자」 ＋
//   「전체 레시피에도 다 적용 · 아이콘 눌러보면 주인장레시피라는 알림뜨게 (디테일이랑 같이)」
// ⭐ 상세 화면과 같은 그림·같은 말풍선(「한끼 주인장 레시피예요」 · 1초 뒤 사라짐)
// ⛔ 카드 안에 있으니 누르면 카드(상세 열기)로 번지지 않게 막는다
// ⛔ 카드가 넘침을 자르므로 말풍선은 «화면 기준(fixed)»으로 띄운다 — 안 그러면 잘려서 안 보인다
//    ＋ 조상에 transform 이 있으면 fixed 가 그 조상 기준이 된다(실측 y=-272) → body 로 portal
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import avGom from '../assets/avatars/av_gom.png'

export default function FounderMark({ recipe, size = 18 }) {
  const [말, set말] = useState(null)
  useEffect(() => { if (!말) return; const t = setTimeout(() => set말(null), 1000); return () => clearTimeout(t) }, [말])
  if (recipe?.made !== '창업자') return null
  const 누름 = (e) => {
    e.stopPropagation(); e.preventDefault()
    const b = e.currentTarget.getBoundingClientRect()
    const 왼 = b.right + 175 > window.innerWidth
    set말({ 왼, y: b.top + b.height / 2, x: 왼 ? window.innerWidth - b.left + 8 : b.right + 8 })
  }
  return (
    <>
      <img src={avGom} alt="한끼 주인장 레시피" className="press" onClick={누름} onPointerDown={(e) => e.stopPropagation()}
        style={{ width: size, height: size, verticalAlign: '-0.18em', marginLeft: 4, display: 'inline-block', cursor: 'pointer' }} />
      {말 && createPortal(
        <span onClick={(e) => e.stopPropagation()} style={{
          position: 'fixed', top: 말.y, transform: 'translateY(-50%)', ...(말.왼 ? { right: 말.x } : { left: 말.x }),
          whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 700, color: '#6b4a24', lineHeight: 1.2,
          background: '#fff4e0', border: '1.5px solid #ecd2a8', borderRadius: 14, padding: '5px 10px',
          boxShadow: '0 2px 8px rgba(120,80,30,.16)', zIndex: 1000, animation: 'fadeIn .2s ease-out', pointerEvents: 'none',
        }}>한끼 주인장 레시피예요</span>, document.body
      )}
    </>
  )
}
