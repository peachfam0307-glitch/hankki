import { useRef, useState } from 'react'
import gp0 from '../assets/gatepreview/gp0.webp'
import gp1 from '../assets/gatepreview/gp1.webp'
import gp2 from '../assets/gatepreview/gp2.webp'
import gp3 from '../assets/gatepreview/gp3.webp'
import gp4 from '../assets/gatepreview/gp4.webp'
import gp5 from '../assets/gatepreview/gp5.webp'
import gp6 from '../assets/gatepreview/gp6.webp'

// 👀 로그인 화면 미리보기 — 창업자 확정 2026-10-21 (docs/로그인화면-미리보기-2026-10-21.md 시안 2)
//    로그인 필수는 그대로. 「둘러보기」 대신 앱 화면을 «손으로» 넘겨 본다(저절로 넘김 X · 창업자 「넘기면서 보게하자」)
const 장 = [
  [gp0, '안녕하세요, 한끼예요', '레시피 모으고 · 꾸미고 · 해 먹는 앱'],
  [gp1, '캡처 한 장이면 레시피 끝', 'SNS·갤러리 사진에서 재료와 순서를 읽어 와요'],
  [gp2, '내 레시피를 귀엽게 꾸며요', '꼬르곰·펭펭 스티커로 레시피 꾸미기'],
  [gp3, '요리할 땐 화면이 안 꺼져요', '큰 글씨 · 단계마다 타이머'],
  [gp4, '냉장고 · 식비 가계부 · 장보기', '유통기한 임박하면 알려주고 · 있는 재료로 레시피 추천해요'],
  [gp5, '해 먹은 날이 일기가 돼요', '요리달력에 그날의 요리일기'],
  [gp6, '레시피 카드로 자랑해요', '카톡·인스타로 한 장 보내기'],
]

export default function GatePreview() {
  const 판 = useRef(null)
  const [지금, set지금] = useState(0)
  const 굴림 = () => { const e = 판.current; if (e) set지금(Math.round(e.scrollLeft / e.clientWidth)) }
  const 가기 = (i) => { const e = 판.current; if (e) e.scrollTo({ left: i * e.clientWidth, behavior: 'smooth' }) }
  // ⛔ 높이는 화면 높이에 묶는다 — 640 높이 폰에서도 단추가 엄지 자리 밖으로 밀리면 안 된다(8/21 확정)
  // 📐 [2026-10-23 창업자] 「작게보여」 → 그림 칸 39vh · 패드(가로 700↑)는 더 크게(48vh · 최대 640px) · 설명 글씨는 한 단계 줄임
  const 패드 = typeof window !== 'undefined' && window.innerWidth >= 700
  const 높이 = 패드 ? 'min(640px, 48vh)' : 'min(460px, 39vh)'
  return (
    <div style={{ margin: 'auto 0 28px', width: '100%' }}>
      <div ref={판} onScroll={굴림} className="gate-preview"
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {장.map(([그림, 제목, 설명], i) => (
          <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', textAlign: 'center' }}>
            <div style={{ height: 높이, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={그림} alt="" loading={i ? 'lazy' : 'eager'} draggable={false}
                style={i ? { height: '100%', maxWidth: '80%', objectFit: 'contain', borderRadius: 16, border: '3px solid #fff', boxShadow: '0 6px 18px rgba(90,60,30,.18)' }
                  : { width: 240, maxWidth: '66%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 10 }}>{제목}</div>
            <div className="t-sub" style={{ fontSize: 12, marginTop: 3, padding: '0 12px' }}>{설명}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {장.map((_, i) => (
          <button key={i} aria-label={`${i + 1}번째 장`} onClick={() => 가기(i)}
            style={{ width: i === 지금 ? 18 : 7, height: 7, borderRadius: 4, border: 0, padding: 0, background: i === 지금 ? 'var(--brown)' : 'rgba(120,90,60,.25)', transition: 'width .2s' }} />
        ))}
      </div>
    </div>
  )
}
