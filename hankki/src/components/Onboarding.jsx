import { useState, useRef, useEffect } from 'react'
import logoCream from '../assets/logo-hankki-cream.png'
import uiGomHeart from '../assets/ui/gom_heart.png'
import uiGomThumb from '../assets/ui/gom_thumbsup.png'
import uiHandPoint from '../assets/ui/hand_point.png'
// 🛒 큐레이션 제품 일러 — 온보딩 '주부 PICK' 카드에 쓴다.
//    예전엔 🍜🧂🍶 유니코드였는데, **쇼핑 화면에서 이미 쓰는 진짜 제품 그림**이 있어서 그걸 쓴다(2026-07-29).
import cuNoodle from '../assets/curation/cu_noodle.png'
import cuSalt from '../assets/curation/cu_salt.png'
import cuTsuyu from '../assets/curation/cu_stock_tsuyu.png'
// 🖼 5인 전신 정본 — `docs/stickers/README.md` A0-7 이 "온보딩엔 이걸 쓴다"고 지정한 그림.
//    (창업자 2026-07-30: *"저럴거면 전신을 하지 왜 상반신을해?"* — 낱개 상반신을 바닥에 세우면
//     허리 절단면이 그대로 보인다. 정본은 처음부터 전신 단체 구도로 그려진 그림이다.)
//    배경이 #F9F9F9 단색이라 같은 색 카드에 얹으면 이어붙인 자리가 안 보인다(투명 처리 불필요).
import lineup5 from '../assets/cast/lineup5.png'
// 얼굴 컷 — 이름·성격 줄 앞에 붙여 "누가 누구인지" 짝지어준다(단체 그림만으론 못 짚는다)
import avGom from '../assets/avatars/av_gom.png'
import avPeng from '../assets/avatars/av_peng.png'
import avCapy from '../assets/avatars/av_capy.png'
import avFox from '../assets/avatars/av_fox.png'
import avGecko from '../assets/avatars/av_gecko.png'

// 첫 실행 온보딩 — 스토어 스샷과 똑같은 레꾸 카드+곰펭 디자인을 앱 안에서 라이브로.
// 곰펭은 앱 실제 모션(콩콩·살랑·둥실…), 꾸미기 슬라이드엔 반짝·하트 효과. 문구=꼬르곰·펭펭/레꾸(옛 '흩어진'·'곰펭이' 없음).
// 표시 여부는 localStorage 'hankki:onboarded' 하나로만 관리.
export const ONBOARD_KEY = 'hankki:onboarded'
export function needsOnboarding() {
  try { return localStorage.getItem(ONBOARD_KEY) !== '1' } catch { return false }
}
export function markOnboarded() {
  try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* noop */ }
}

// 음식/곰펭/데코 PNG 자산 (앱 자산 재사용 — 무겁지 않게)
const PHOTO = import.meta.glob('../assets/stickers/photo/*.png', { eager: true, query: '?url', import: 'default' })
const F = (k) => PHOTO[`../assets/stickers/photo/${k}.png`]
const Img = ({ k, style, cls }) => <img src={F(k)} alt="" draggable={false} className={cls} style={{ position: 'absolute', ...style }} />

// ── 1080×1920 스테이지를 화면에 맞춰 통째로 축소 (스샷 디자인 픽셀 그대로) ──
// ⚠️ 축소는 `zoom`으로 한다(`transform: scale` 아님). transform은 1080×1920으로 한 번 래스터화한
// 레이어를 축소해 붙이는 방식이라 글자·이미지가 전부 뿌옇게 뭉갠다(창업자 폰 제보 "화질 떨어짐").
// zoom은 브라우저가 축소된 크기 기준으로 레이아웃·래스터를 다시 하므로 폰트도 이미지도 선명하다.
function Stage({ bg, children }) {
  const [scale, setScale] = useState(0.34)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1080, (window.innerHeight * 0.82) / 1920))
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div style={{ width: 1080 * scale, height: 1920 * scale, position: 'relative' }}>
      <div style={{ width: 1080, height: 1920, position: 'absolute', top: 0, left: 0, zoom: scale, background: bg, overflow: 'hidden', fontFamily: "'Jua', sans-serif" }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.32) 9px, transparent 10px)', backgroundSize: '100px 100px' }} />
        {children}
      </div>
    </div>
  )
}

// 우리 효과(hk-fx) — 이모지 대신 부드러운 SVG
const Spark = ({ x, y, size = 54, color = '#fff2c4', delay = 0 }) => (
  <span className="hk-fx hk-fx-spark" style={{ position: 'absolute', left: x, top: y, width: size, height: size, animationDelay: `${delay}s` }}>
    <svg viewBox="0 0 24 24" width={size} height={size}><path d="M12 2.5c.5 4 1.5 5 5.5 5.5-4 .5-5 1.5-5.5 5.5-.5-4-1.5-5-5.5-5.5 4-.5 5-1.5 5.5-5.5z" fill={color} /></svg>
  </span>
)
const Heart = ({ x, y, size = 46, color = '#e58a86', delay = 0 }) => (
  <span className="hk-fx hk-fx-spark" style={{ position: 'absolute', left: x, top: y, width: size, height: size, animationDelay: `${delay}s` }}>
    <svg viewBox="0 0 48 48" width={size} height={size}><path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill={color} /></svg>
  </span>
)
const RiseHeart = ({ x, y, size = 44, color = '#ffb3a0', delay = 0 }) => (
  <span className="hk-fx hk-fx-heart" style={{ position: 'absolute', left: x, top: y, width: size, height: size, animationDelay: `${delay}s` }}>
    <svg viewBox="0 0 48 48" width={size} height={size}><path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill={color} /></svg>
  </span>
)

const Cap = ({ children, top = 104 }) => <div style={{ position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 9, padding: '0 56px' }}>{children}</div>
const H1 = ({ children, style }) => <h1 style={{ margin: 0, fontSize: 92, lineHeight: 1.15, letterSpacing: -1, ...style }}>{children}</h1>
const Sub = ({ children, style }) => <div style={{ marginTop: 18, fontSize: 40, ...style }}>{children}</div>
const Foot = ({ children, style }) => (
  <div style={{ position: 'absolute', bottom: 84, left: 0, right: 0, textAlign: 'center', fontSize: 42 }}><span style={{ padding: '16px 40px', borderRadius: 44, ...style }}>{children}</span></div>
)
const Postit = ({ children, style }) => <div style={{ position: 'absolute', padding: '16px 20px', borderRadius: 9, fontFamily: "'Gaegu', cursive", fontWeight: 700, lineHeight: 1.15, boxShadow: '0 8px 16px rgba(120,90,30,.22)', ...style }}>{children}</div>
const Tape = () => <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: 230, height: 54, background: 'rgba(255,214,150,.85)', border: '2px dashed rgba(160,110,55,.5)', borderRadius: 6 }} />

// 폴라로이드 레꾸 카드
function Card({ food, foodW = 380, cover, title, date = '2026.07.25', rot = -4, char, deco, postit }) {
  return (
    <div style={{ width: 640, transform: `rotate(${rot}deg)`, background: '#fffdf8', borderRadius: 42, padding: '26px 26px 30px', boxShadow: '0 30px 60px rgba(90,60,30,.3)', position: 'relative' }}>
      <Tape />
      <div style={{ position: 'relative', height: 600, borderRadius: 28, overflow: 'hidden', background: cover }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(150,120,80,.16) 5px, transparent 6px)', backgroundSize: '52px 52px' }} />
        {deco}
        {food && <Img k={food} style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: foodW, filter: 'drop-shadow(0 10px 16px rgba(90,60,30,.22))' }} />}
        {char}
        {postit}
      </div>
      <div style={{ marginTop: 20, textAlign: 'center' }}><div style={{ fontSize: 52, color: '#33302b' }}>{title}</div><div style={{ fontSize: 30, color: '#b3a898' }}>{date}</div></div>
    </div>
  )
}

// ── 1. 히어로 ──
const Slide1 = () => (
  <Stage bg="radial-gradient(circle at 30% 16%,#f0c79b,#e3aa73 55%,#d99a5f)">
    <Cap top={210}><H1 style={{ color: '#fffdf8', textShadow: '0 4px 0 rgba(150,95,40,.28)' }}>한 끼를 해낸다면,<br />레꾸하세요.</H1><Sub style={{ color: '#5d3410', opacity: 0.9 }}>꼬르곰·펭펭과 레꾸 — 저 카드, 나도 만들래</Sub></Cap>
    <div style={{ position: 'absolute', top: 560, left: '50%', transform: 'translateX(-50%)' }}>
      <Card food="fh_k22" cover="linear-gradient(150deg,#e9f2e6,#fbe9d6)" title="엄마표 김밥"
        deco={<><Spark x={480} y={30} size={56} /><Heart x={44} y={150} size={48} delay={0.7} /></>}
        char={<Img k="gp_gomft" cls="hk-m-sway" style={{ right: -8, bottom: -6, width: 232, transformOrigin: 'bottom center', filter: 'drop-shadow(0 8px 12px rgba(90,60,30,.25))' }} />}
        postit={<Postit style={{ left: 32, bottom: 42, width: 236, background: '#fff6b8', transform: 'rotate(-5deg)', fontSize: 38, color: '#6b5330', textAlign: 'center' }}>오늘 한 끼 완성!</Postit>} />
    </div>
    <Foot style={{ background: '#5d3410', color: '#fffdf8' }}>탭 한 번이면 뚝딱</Foot>
  </Stage>
)

// ── 2. 레꾸 ──
const Chip = ({ k }) => <div style={{ width: 120, height: 120, borderRadius: 26, background: '#fff', boxShadow: '0 8px 18px rgba(90,60,30,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}><img src={F(k)} alt="" style={{ width: '80%' }} /></div>
const Slide2 = () => (
  <Stage bg="linear-gradient(160deg,#d3e3c8,#eaf2e2)">
    <Cap top={210}><H1 style={{ color: '#4a6b42' }}>레시피 정리?<br />우린 레시피 레꾸해요</H1><Sub style={{ color: '#5f7a54' }}>레꾸하면, 한 끼가 추억이 된다</Sub></Cap>
    <div style={{ position: 'absolute', top: 556, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
      <Card food="fe_06" foodW={346} cover="linear-gradient(150deg,#fbf5e8,#f2ecda)" title="연어 포케볼" rot={-3}
        deco={<><Img k="dc_dhb14" style={{ left: 38, top: 46, width: 70, transform: 'rotate(-10deg)' }} /><Img k="dc_dhb10" style={{ right: 42, top: 52, width: 74, transform: 'rotate(10deg)' }} /><Img k="dc_dhb04" style={{ left: 34, top: 262, width: 54, transform: 'rotate(-8deg)' }} /><Img k="dc_dsy04" style={{ right: 50, top: 280, width: 60, transform: 'rotate(8deg)' }} /><Spark x={150} y={140} size={40} /></>}
        char={<Img k="gp_pengv" cls="hk-m-kong" style={{ left: -6, bottom: -8, width: 198, transformOrigin: 'bottom center', filter: 'drop-shadow(0 8px 12px rgba(90,60,30,.22))' }} />}
        postit={<Postit style={{ right: 28, bottom: 36, background: '#dde5cf', transform: 'rotate(4deg)', fontSize: 36, color: '#4f5a44', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {/* ⛔ 유니코드 ♡ 였던 것 — 우리 라인 하트 SVG로. UI에 유니코드 이모지 금지(CLAUDE.md) */}
          내 최애
          <svg viewBox="0 0 48 48" width={30} height={30} aria-hidden="true"><path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill="none" stroke="#7d8a6e" strokeWidth="3.4" strokeLinejoin="round" /></svg>
        </Postit>} />
      <div style={{ marginTop: 34, background: '#fff', borderRadius: 36, padding: '28px 24px', boxShadow: '0 16px 34px rgba(70,90,60,.2)', width: 640, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip k="gp_gomhi" /><Chip k="gp_penghi" /><Chip k="fh_k27" /><Chip k="fe_15" />
        <div style={{ width: 120, height: 120, borderRadius: 26, background: '#5d3410', color: '#fff', fontSize: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 40, color: '#4a6b42' }}><img src={uiHandPoint} alt="" draggable={false} style={{ width: 52, height: 52, objectFit: 'contain' }} />톡 눌러 붙이기만 하면 끝!</div>
    </div>
  </Stage>
)

// ── 3. 공유 (폰 스토리 목업) ──
const Bub = ({ children, style }) => <div style={{ position: 'absolute', background: '#fff', fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 38, color: '#3a2f2a', boxShadow: '0 10px 22px rgba(150,50,80,.24)', zIndex: 5, ...style }}>{children}</div>
const Slide3 = () => (
  <Stage bg="radial-gradient(circle at 50% 26%,#f7bccb,#f2a0b4 66%,#ec8ea6)">
    <Cap top={210}>
      <H1 style={{ fontSize: 82, color: '#fffdf8', textShadow: '0 3px 0 rgba(180,70,100,.32)' }}>예쁜 카드 한 장으로,<br />센스있게 레시피 공유</H1>
      <Sub style={{ fontSize: 38, color: '#7a3550' }}>내 한끼를 친구들과 나눠요</Sub>
      <div style={{ marginTop: 22, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <span style={{ background: '#fffdf8', color: '#c0506a', fontSize: 29, padding: '9px 24px 9px 11px', borderRadius: 30, boxShadow: '0 6px 14px rgba(150,60,85,.2)', display: 'inline-flex', alignItems: 'center', gap: 11 }}><span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#fdd85d,#f6772e 38%,#e33a72 66%,#b23bb0)', position: 'relative' }}><span style={{ position: 'absolute', inset: 8, border: '3.5px solid #fff', borderRadius: 8 }} /><span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 13, height: 13, border: '3.5px solid #fff', borderRadius: '50%' }} /><span style={{ position: 'absolute', right: 9, top: 9, width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /></span>인스타 스토리</span>
        <span style={{ background: '#fffdf8', color: '#7a5a1e', fontSize: 29, padding: '9px 24px 9px 11px', borderRadius: 30, boxShadow: '0 6px 14px rgba(150,60,85,.2)', display: 'inline-flex', alignItems: 'center', gap: 11 }}><span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: 12, background: '#FEE500', position: 'relative' }}><span style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%,-50%)', width: 26, height: 20, background: '#3A1D1D', borderRadius: 12 }} /><span style={{ position: 'absolute', left: 11, bottom: 8, width: 7, height: 7, background: '#3A1D1D', transform: 'rotate(28deg)' }} /></span>카카오톡</span>
      </div>
    </Cap>
    <div style={{ position: 'absolute', top: 566, left: '50%', transform: 'translateX(-50%)', width: 560 }}>
      <div style={{ borderRadius: 56, padding: 8, background: 'conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#5c9df0,#f9a825)', boxShadow: '0 30px 60px rgba(150,50,80,.35)' }}>
        <div style={{ background: '#fff', borderRadius: 50, overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px' }}>
            <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'linear-gradient(135deg,#f6c79b,#e3aa73)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src={F('gp_gomtb')} alt="" style={{ width: '116%' }} /></div>
            <div style={{ fontSize: 34, color: '#333' }}>꼬르곰맘</div><div style={{ fontSize: 28, color: '#aaa' }}>· 스토리</div>
          </div>
          <div style={{ position: 'relative', height: 600, background: 'linear-gradient(150deg,#fdf3e8,#f5ead9)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(150,120,80,.14) 5px, transparent 6px)', backgroundSize: '52px 52px' }} />
            <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', padding: '10px 34px', background: '#f0b7c6', backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px)', borderRadius: 4, boxShadow: '0 6px 13px rgba(150,90,90,.22)', fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 38, color: '#7a4a52', whiteSpace: 'nowrap' }}>감바스 알 아히요</div>
            <Img k="dc_dhb10" style={{ left: 22, top: 98, width: 64, transform: 'rotate(-12deg)' }} /><Img k="dc_dhb01" style={{ right: 26, top: 104, width: 58, transform: 'rotate(10deg)' }} /><Img k="dc_dhb04" style={{ left: 26, top: 270, width: 48, transform: 'rotate(-8deg)' }} />
            <Spark x={150} y={175} size={44} />
            <Img k="fe_08" style={{ top: '49%', left: '50%', transform: 'translate(-50%,-50%)', width: 296, filter: 'drop-shadow(0 10px 16px rgba(90,60,30,.2))' }} />
            <Img k="gp_duoht" cls="hk-m-tilt" style={{ right: -4, bottom: -4, width: 252, transformOrigin: 'bottom center' }} />
            <Postit style={{ left: 24, bottom: 34, background: '#fff6b8', transform: 'rotate(-4deg)', fontSize: 32, color: '#6b5330' }}>오늘 저녁<br />성공!</Postit>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 26px' }}>
            <div style={{ flex: 1, border: '3px solid #eee', borderRadius: 40, padding: '12px 24px', fontSize: 28, color: '#bbb' }}>메시지 보내기…</div>
            {/* 남의 앱 UI를 흉내내는 자리 — 유니코드 대신 우리 라인 아이콘으로 그린다. */}
            <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20z" /></svg>
            <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" /></svg>
          </div>
        </div>
      </div>
      <Bub style={{ left: -70, top: 220, borderRadius: '30px 30px 30px 6px', padding: '15px 26px', transform: 'rotate(-5deg)' }}>우와 맛있겠다</Bub>
      <Bub style={{ right: -64, top: 450, borderRadius: '30px 30px 6px 30px', padding: '15px 26px', transform: 'rotate(5deg)' }}>레시피 공유해줘</Bub>
      <Bub style={{ left: -46, bottom: 58, borderRadius: '30px 30px 30px 6px', padding: '15px 28px', transform: 'rotate(-3deg)', background: '#5d3410', color: '#fff' }}>같이 해먹자!</Bub>
    </div>
    <Foot style={{ background: '#fffdf8', color: '#c04a68' }}>센스있는 레시피 한 장, 친구에게 톡</Foot>
  </Stage>
)

// ── 6. 큐레이션 ──
const Pick = ({ n, d, c, e }) => (
  <div style={{ background: '#fffdf8', borderRadius: 40, boxShadow: '0 26px 54px rgba(60,70,90,.24)', padding: '30px 32px', display: 'flex', alignItems: 'center', gap: 26, position: 'relative' }}>
    <div style={{ width: 110, height: 110, borderRadius: 26, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}><img src={e} alt="" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain' }} /></div>
    <div style={{ flex: 1 }}><div style={{ fontSize: 42, color: '#33302b' }}>{n}</div><div style={{ fontSize: 32, color: '#8a8570', fontFamily: "'Gaegu', cursive", fontWeight: 700, marginTop: 4 }}>{d}</div></div>
    <div style={{ position: 'absolute', top: -16, right: 24, background: '#ffcf3f', color: '#6a4a10', fontSize: 26, padding: '8px 20px', borderRadius: 24, boxShadow: '0 6px 12px rgba(150,110,20,.25)' }}><svg viewBox="0 0 24 24" width={26} height={26} style={{ verticalAlign: '-4px', marginRight: 4 }}><path d="M12 2.5c.5 4 1.5 5 5.5 5.5-4 .5-5 1.5-5.5 5.5-.5-4-1.5-5-5.5-5.5 4-.5 5-1.5 5.5-5.5z" fill="#6a4a10" /></svg>꼬르곰·펭펭 PICK</div>
  </div>
)
const Slide6 = () => (
  <Stage bg="linear-gradient(160deg,#cdd2a0,#e4e7c6)">
    <Cap top={210}><H1 style={{ color: '#5f6a30' }}>아무거나 말고,<br />써본 것만 나눠요</H1><Sub style={{ color: '#72803a' }}>18년차 주부가 직접 쓰고 좋았던 살림템만</Sub></Cap>
    <div style={{ position: 'absolute', top: 600, left: '50%', transform: 'translateX(-50%)', width: 740, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Pick n="든든한 보리면" d="쫄깃하고 속 편한, 든든한 한 끼" c="#c9a84e" e={cuNoodle} />
      <Pick n="만능 대파소금" d="이거 하나면 간이 딱 맞아요" c="#7a9b56" e={cuSalt} />
      <Pick n="간편 쯔유 스톡" d="물만 부으면 국물요리 뚝딱" c="#8b6f4a" e={cuTsuyu} />
    </div>
    <Img k="ob_naeng" cls="hk-m-sway" style={{ left: '50%', bottom: 200, transform: 'translateX(-50%)', width: 498, transformOrigin: 'bottom center', filter: 'drop-shadow(0 14px 22px rgba(70,80,40,.3))' }} />
    <Foot style={{ background: '#5f6a30', color: '#fff' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>믿고 사는 살림템<img src={uiGomThumb} alt="" draggable={false} style={{ width: 54, height: 54, objectFit: 'contain' }} /></span></Foot>
  </Stage>
)

// ── 7. 감정 ──
const Slide7 = () => (
  <Stage bg="radial-gradient(circle at 50% 42%,#8a6a4c,#6f5238 70%,#5f4630)">
    <Cap top={210}><H1 style={{ color: '#fff6ea' }}>레시피를 넘기면,<br />그날의 내가 보여요</H1><Sub style={{ color: '#e8d3bd' }}>오늘도 한 끼, 해냈어요</Sub></Cap>
    <div style={{ position: 'absolute', top: 640, left: '50%', transform: 'translateX(-50%)', width: 760, height: 720, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,244,230,.5),rgba(255,244,230,0) 68%)' }} />
      <img src={uiGomHeart} alt="" draggable={false} className="hk-m-float" style={{ position: 'relative', width: 520, filter: 'drop-shadow(0 20px 30px rgba(40,25,10,.4))' }} />
      <RiseHeart x={110} y={120} size={52} delay={0} /><RiseHeart x={560} y={220} size={44} color="#ffd0a0" delay={1.1} /><RiseHeart x={210} y={520} size={40} delay={0.6} />
    </div>
    <Foot style={{ background: '#fff6ea', color: '#6f5238' }}>감정 레시피북 · 한끼</Foot>
  </Stage>
)

// ── 7-B. 다섯 친구 소개 (#70) ──
// 창업자 요청 "레시피 온보드 첫장에 우리애들 소개" + 특허청 상담(2026-07-27)
// *"저작권은 판례가 없어 곰펭 보호 가능 → **다양한 캐릭터를 먼저 앱에 노출하는 게 유리**"*.
// ⚠️ **자리는 CTA 바로 앞**이다 — 앞쪽은 값어치(레꾸·공유·큐레이션)를 먼저 보여줘야 하고,
//    캐릭터는 매력이라 마무리에서 만나는 게 낫다. 다음 장(브랜드)이 "꼬르곰·펭펭과…"로 이어진다.
// ⚠️ **이름·설명은 코드 글자로.** 글자가 박힌 이미지(`설명판-이름오타있음.png`)는 쓰지 않는다 —
//    이름이 바뀌면 한 줄만 고치면 되고, 확대해도 안 뭉갠다.
// 키는 종(種) 기준(`bu_fox`)이라 이름이 바뀌어도 파일을 다시 안 만든다.
// ── 7B. 왜 만들었나 + 꼬르곰·펭펭의 의미 ──
//
// ⭐ 창업자 2026-07-30: *"내가 왜 이앱을 만들었고 꼬르곰 펭펭의 의미"* 가 들어가야 한다.
// ⚠️ 문구는 **전부 우리 문서 원문에서 가져왔다 — 지어낸 문장이 하나도 없다.**
//    · 만든 계기 = `docs/기획-노트.md` "왜 만들었나(창업자의 진짜 불편함)" 원문 요약
//      ("캡처 사진만 수백 장 쌓였는데 … 결국 못 찾는다. 그래서 만들었다")
//    · 꼬르곰 = 저작자 자신(엄마) · 펭펭 = 저작자의 사춘기 딸 · 콤비 = 티격태격이 곧 사랑
//      = `docs/저작권-창작기록-꼬르곰펭펭-2026-07-21.md` §2
//    · "18년차 주부" = 이미 Slide6 에서 쓰는 표현과 동일
const Slide7B = () => (
  <Stage bg="linear-gradient(168deg,#fdeedd,#f8dcc0 58%,#eec8a2)">
    <Cap top={200}><H1 style={{ color: '#7a4a22' }}>꼬르곰은 저예요</H1><Sub style={{ color: '#96613a' }}>펭펭은 제 사춘기 딸이고요</Sub></Cap>
    {/* ⚠️ 가운데 맞추기를 `left:50% + translateX(-50%)` 로 하면 안 된다 — 모션 클래스(hk-m-*)가
        transform 을 애니메이션해서 translateX 가 덮어써지고 그림이 오른쪽으로 잘린다(2026-07-30 실제로 잘림).
        스테이지 폭이 1080 고정이므로 left 를 직접 계산해 둔다((1080-620)/2 = 230). */}
    <Img k="gp_duoht" cls="hk-m-sway" style={{ top: 470, left: 230, width: 620, transformOrigin: 'bottom center', filter: 'drop-shadow(0 18px 26px rgba(130,80,40,.28))' }} />
    {/* 만든 계기 — 창업자 1인칭. 기능 자랑이 아니라 "나도 그랬다" 는 공감이 첫 줄이다 */}
    <div style={{ position: 'absolute', top: 1060, left: 70, right: 70, background: '#fffdf8', borderRadius: 40, padding: '44px 46px', boxShadow: '0 18px 36px rgba(150,95,50,.22)' }}>
      <div style={{ fontSize: 44, lineHeight: 1.5, color: '#5f3c1c' }}>
        저장만 해둔 레시피 캡처가 수백 장.<br />
        정작 해먹고 싶을 땐 못 찾았어요.<br />
        <span style={{ color: '#c2703f' }}>그래서 한끼를 만들었어요.</span>
      </div>
      <div style={{ marginTop: 26, paddingTop: 24, borderTop: '3px dashed #ecd9bf', fontSize: 38, lineHeight: 1.45, color: '#8a6440' }}>
        {/* ⚠️ 앞줄(관계)에서 뒷줄(기능)로 튀면 두서가 안 맞는다 — 창업자 지적 2026-07-30.
            관계 → 보편성 으로 이어야 말이 붙는다. 문장은 설정집 원문 그대로:
            "티격태격이 곧 사랑. 우리 집 이야기이자 세상 모든 평범한 엄마와 아이의 이야기." */}
        티격태격하지만 그게 곧 사랑이에요.<br />우리 집 이야기이자, 여느 집 이야기죠.
      </div>
    </div>
    <Foot style={{ background: '#7a4a22', color: '#fff7ea' }}>18년차 주부가 만든 앱</Foot>
  </Stage>
)

// ── 7C. 다섯 친구 (성격 한 줄 + 친구들 = 앞으로 함께할 한끼 유저) ──
//
// ⭐ 창업자 2026-07-30: *"애들 성격이 짧게라도 들어가야지"* · *"친구들은 앞으로 한끼를
//    함께한 한끼유저들"*. 이름표만 붙인 첫 판을 두고 *"소개도 없이 덜렁 저게 끝이야???"*.
// ⚠️ '한 줄' 은 `docs/stickers/README.md` A0-7 캐스트 표의 **「한 줄」 행 그대로** — 새로 안 지었다.
const CAST = [
  { face: avGom, name: '꼬르곰', line: '허당 셰프, 감정 부자' },
  { face: avPeng, name: '펭펭', line: '무표정이 매력인 해결사' },
  { face: avCapy, name: '카롱', line: '여유로운 체력왕' },
  { face: avFox, name: '뾰미', line: '트렌드에 민감한 멋쟁이' },
  { face: avGecko, name: '꼬비', line: '어디에나 숨는 행운의 요정' },
]
const Slide7C = () => (
  <Stage bg="linear-gradient(165deg,#f7e6ca,#f2d6b0 58%,#e8c495)">
    <Cap top={150}><H1 style={{ color: '#6b4526' }}>다섯 친구가<br />함께 살아요</H1></Cap>
    {/* 단체 정본 — 배경과 같은 #F9F9F9 카드에 얹어 경계가 안 보이게 */}
    <div style={{ position: 'absolute', top: 430, left: 64, right: 64, background: '#f9f9f9', borderRadius: 40, padding: '10px 0 0', boxShadow: '0 16px 32px rgba(140,95,50,.2)', overflow: 'hidden' }}>
      <img src={lineup5} alt="" draggable={false} style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
    {/* 이름 + 성격 한 줄 — 얼굴 컷을 앞에 붙여 누가 누군지 짚어준다 */}
    <div style={{ position: 'absolute', top: 1200, left: 74, right: 74, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {CAST.map((c) => (
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img
            src={c.face} alt="" draggable={false}
            style={{ width: 74, height: 74, borderRadius: '50%', objectFit: 'contain', background: '#fffdf8', border: '3px solid #e6cfae', flex: '0 0 auto' }}
          />
          <div style={{ fontSize: 40, fontWeight: 800, color: '#6b4526', width: 190, flex: '0 0 auto' }}>{c.name}</div>
          <div style={{ fontSize: 36, color: '#8a6440', lineHeight: 1.3 }}>{c.line}</div>
        </div>
      ))}
    </div>
    <Foot style={{ background: '#6b4526', color: '#fff7ea' }}>여섯 번째 친구는 여러분이에요</Foot>
  </Stage>
)

// ── 8. 브랜드 (CTA) ──
const Slide8 = () => (
  <Stage bg="radial-gradient(circle at 50% 30%,#f6b49e,#ee9a80 70%,#e5896d)">
    <Cap top={210}><H1 style={{ color: '#fffdf8', textShadow: '0 4px 0 rgba(160,80,55,.3)' }}>꼬르곰·펭펭과<br />감정 레시피북</H1></Cap>
    <div style={{ position: 'absolute', top: 520, left: '50%', transform: 'translateX(-50%)', width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Img k="gp_duohi" cls="hk-m-sway" style={{ position: 'relative', width: 560, transformOrigin: 'bottom center', filter: 'drop-shadow(0 18px 26px rgba(120,50,30,.35))' }} />
      <div style={{ marginTop: 36, alignSelf: 'stretch', background: '#fffdf8', borderRadius: 40, padding: '44px 40px', boxShadow: '0 20px 40px rgba(150,70,45,.28)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src={logoCream} alt="한끼" style={{ width: 300, display: 'block' }} />
        <div style={{ marginTop: 14, fontSize: 38, color: '#7a5238' }}>내 레시피를 예쁘게, 레꾸해요</div>
      </div>
    </div>
    <Foot style={{ background: '#5d3410', color: '#fffdf8' }}>지금 한끼 시작하기</Foot>
  </Stage>
)

const SLIDES = [Slide1, Slide2, Slide3, Slide6, Slide7, Slide7B, Slide7C, Slide8]

export default function Onboarding({ onDone }) {
  const N = SLIDES.length
  const [i, setI] = useState(0)
  const [drag, setDrag] = useState(0)      // 손가락 따라오는 오프셋(px)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const moved = useRef(false)
  const wRef = useRef(null)
  const last = i === N - 1

  const finish = () => { markOnboarded(); onDone && onDone() }
  const next = () => { if (last) finish(); else setI((v) => Math.min(N - 1, v + 1)) }
  const prev = () => setI((v) => Math.max(0, v - 1))

  // 손가락 드래그 추적(트랙이 손가락 따라오다 놓으면 스냅) — 캐러셀 페이징
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; moved.current = false; setDragging(true) }
  const onTouchMove = (e) => {
    if (!dragging) return
    let dx = e.touches[0].clientX - startX.current
    if (Math.abs(dx) > 6) moved.current = true
    if ((i === 0 && dx > 0) || (i === N - 1 && dx < 0)) dx *= 0.35 // 가장자리 고무줄 저항
    setDrag(dx)
  }
  const onTouchEnd = () => {
    const w = wRef.current ? wRef.current.offsetWidth : window.innerWidth
    const th = Math.min(70, w * 0.18)
    if (drag < -th) next(); else if (drag > th) prev()
    setDrag(0); setDragging(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)', display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 6px)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
      <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px' }}>
        {!last && <button className="press" onClick={finish} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 700, padding: '6px 8px' }}>건너뛰기</button>}
      </div>
      <div ref={wRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{
          display: 'flex', height: '100%', width: `${N * 100}%`,
          transform: `translateX(calc(${-i * (100 / N)}% + ${drag}px))`,
          transition: dragging ? 'none' : 'transform .5s cubic-bezier(.33,.1,.25,1)',
          willChange: 'transform'
        }}>
          {SLIDES.map((S, k) => (
            <div key={k} style={{ width: `${100 / N}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <S />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 18 }}>
          {SLIDES.map((_, k) => <span key={k} style={{ width: k === i ? 20 : 7, height: 7, borderRadius: 999, background: k === i ? 'var(--brown)' : 'var(--line)', transition: 'all .25s ease' }} />)}
        </div>
        <button className="btn-primary press" style={{ width: '100%' }} onClick={next}>{last ? '한끼 시작하기' : '다음'}</button>
      </div>
    </div>
  )
}
