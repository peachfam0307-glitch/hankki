import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'
// 🛒 장보기 콤비 — 꼬르곰이 카트, 펭펭이 바구니. 스토어 스샷 ⑤가 쓰는 그 컷이다.
//    ⚠️ `sharepool` 에 있어서 `F()`(stickers/photo) 로는 못 부른다 → 직접 import.
import duoCart from '../assets/sharepool/duo_cart.png'
import logoCream from '../assets/logo-hankki-cream.png'
import uiGomHeart from '../assets/ui/gom_heart.png'
// 🐻 엄지척 = **물결 정본**(창업자 2026-08-14 제공 · `…-08-14/낱개/gt_01`). 옛 `ui/gom_thumbsup` 은 매끈 곰이었다.
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png'
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
// 📄 속지 실물 — 온보딩 「한끼 일기」 장면이 **앱에 진짜 있는 속지**를 그대로 보여준다(창업자 2026-08-08).
//    좌표는 눈대중이 아니라 `src/data/papers.js` 의 실측값을 그대로 쓴다.
import dpSnap from '../assets/paper/dp_snap.webp'
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

// ⏰⏰ 날짜는 «오늘»을 쓴다 — 고정으로 박으면 반드시 낡는다.
//    (창업자 2026-08-08 *"날짜도 맞춰야해(온보드에 날짜 써있는 이미지가 있을거야)"* — 맞았다.
//     레꾸 카드에 `2026.07.25` 가 박혀 있어서 **보름 넘게 지난 날짜**를 새 유저가 첫 화면에서 봤고,
//     내가 만든 일기 장면과도 날짜가 어긋났다.)
//    ⭐ 오늘로 계산하면 **레시피 카드와 일기가 저절로 같은 날**이 되고 영영 안 낡는다.
//    ⚠️ 기기 시간대를 그대로 쓴다 — 우리 유저는 한국이라 그게 KST 다.
const _now = new Date()
const _wd = ['일', '월', '화', '수', '목', '금', '토'][_now.getDay()]
const CARD_DATE = `${_now.getFullYear()}.${String(_now.getMonth() + 1).padStart(2, '0')}.${String(_now.getDate()).padStart(2, '0')}`
const DIARY_DATE = `${_now.getMonth() + 1}.${_now.getDate()} ${_wd}`
const THIS_MONTH = `${_now.getMonth() + 1}월`

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
function Card({ food, foodW = 380, cover, title, date = CARD_DATE, rot = -4, char, deco, postit }) {
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
      {/* 🍜 [2026-09-02] `fe_06`(얼굴 달린 카와이 포케볼) → **실사 `gr_349`** — 글자가 「연어 포케볼」이라 짝이 정확하다 */}
      <Card food="gr_349" foodW={346} cover="linear-gradient(150deg,#fbf5e8,#f2ecda)" title="연어 포케볼" rot={-3}
        deco={<><Img k="dc_dhb14" style={{ left: 38, top: 46, width: 70, transform: 'rotate(-10deg)' }} /><Img k="dc_dhb10" style={{ right: 42, top: 52, width: 74, transform: 'rotate(10deg)' }} /><Img k="dc_dhb04" style={{ left: 34, top: 262, width: 54, transform: 'rotate(-8deg)' }} /><Img k="dc_dsy04" style={{ right: 50, top: 280, width: 60, transform: 'rotate(8deg)' }} /><Spark x={150} y={140} size={40} /></>}
        char={<Img k="gp_pengv" cls="hk-m-kong" style={{ left: -6, bottom: -8, width: 198, transformOrigin: 'bottom center', filter: 'drop-shadow(0 8px 12px rgba(90,60,30,.22))' }} />}
        postit={<Postit style={{ right: 28, bottom: 36, background: '#dde5cf', transform: 'rotate(4deg)', fontSize: 36, color: '#4f5a44', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {/* ⛔ 유니코드 ♡ 였던 것 — 우리 라인 하트 SVG로. UI에 유니코드 이모지 금지(CLAUDE.md) */}
          내 최애
          <svg viewBox="0 0 48 48" width={30} height={30} aria-hidden="true"><path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill="none" stroke="#7d8a6e" strokeWidth="3.4" strokeLinejoin="round" /></svg>
        </Postit>} />
      <div style={{ marginTop: 34, background: '#fff', borderRadius: 36, padding: '28px 24px', boxShadow: '0 16px 34px rgba(70,90,60,.2)', width: 640, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 🍜 [2026-09-02] 카와이 둘 → 실사 (`fh_k27` 떡볶이 → `gr_003` · `fe_15` 스무디 → `gr_014`) */}
        <Chip k="gp_gomhi" /><Chip k="gp_penghi" /><Chip k="gr_003" /><Chip k="gr_014" />
        <div style={{ width: 120, height: 120, borderRadius: 26, background: '#5d3410', color: '#fff', fontSize: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 40, color: '#4a6b42' }}><img src={uiHandPoint} alt="" draggable={false} style={{ width: 52, height: 52, objectFit: 'contain' }} />톡 눌러 붙이기만 하면 끝!</div>
    </div>
  </Stage>
)

// ── 2-D. 한끼 일기 ──
// 📔📔 창업자 지적 2026-08-08 — *"우리 스샷이랑, 온보드, 안내코치에도 한끼일기 넣어야 하지 않아?"*
//    ⛔ 맞았다. 온보딩 여덟 장에 **「일기」라는 낱말이 한 번도 없었다.**
//       한끼 일기는 v9.85(8/6)~v10.02(8/8) 에 크게 자랐는데 온보딩은 v9.03(7/26) 것 그대로였다.
//       📌 **기능이 자라면 「앱을 소개하는 자리」도 같이 자라야 한다** — 안 그러면 하단바 탭만 덩그러니 있고
//          유저는 그게 뭔지 모른다.
//    ⭐ 자리 = 레꾸(Slide2) «바로 다음». 「레시피를 꾸민다」 → 「일기도 꾸민다」로 이어진다.
//
// 🎨🎨 창업자 지적 2026-08-08 (두 번째) — *"우리 일꾸랑 레꾸랑 큰 차이가 없어서.. 우리 새로운 스티커
//    많으니까(일꾸전용) 그거 적용해서 꾸며볼래?"* ＋ *"무지속지나 반 나눠진 속지에 모서리꾸미기 붙이고
//    기분스티커랑 별,. 우리가 안쓰던거 이용해서 펭펭이나 하나넣고"*
//    ⛔ 맞았다. 첫 판은 **CSS 로 그린 흰 카드 ＋ 큰 음식 그림 ＋ 캐릭터** 라 레꾸(Slide2)와 짜임이 같았고,
//       일꾸 전용 84컷 중 **딱 2컷**만 썼다(dc_td17·dc_td06). 나머지는 전부 내가 CSS 로 흉내 낸 것이다.
//    ⛔⛔ **아래 옛 주석이 나를 막고 있었다** — *"속지 PNG 를 얹지 않는다, 좌표를 눈대중으로 맞추면 어긋난다"*.
//       **틀린 제약이었다.** `src/data/papers.js` 에 사진칸·제목·날짜·글칸 좌표가 **이미 실측되어 있다**(퍼센트).
//       눈대중이 아니라 그 값을 읽어 쓰면 된다. 📌 「하지 말 것」을 적을 땐 «왜 못 하는지»를 다시 재 볼 것.
//    ⭐ 그래서 진짜 속지 `dp_snap`(반 나눠진 속지 = 위 사진칸 / 아래 글칸)을 얹고 그 위에 일꾸 전용 스티커로 꾸민다.
const SNAP = { photo: { top: 7.8, bottom: 60.1, left: 10.3, right: 8.8 }, title: { top: 43.0, left: 12 }, date: { top: 43.9, left: 75.8 }, write: { top: 54.2, left: 12, right: 10.5 } }
// 속지 위에 얹는 것은 전부 «퍼센트» — 속지 크기를 바꿔도 자리가 안 흔들린다(`papers.js` 와 같은 문법)
const P = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? `${v}%` : v]))
// 달력 세 줄 — 해먹은 날에만 음식 아이콘이 박힌다(빈 칸 = 안 한 날). ⛔날짜 숫자는 안 쓴다(달마다 달라진다)
// ⛔⛔ **2·3째 줄의 1·2번째 칸은 비워 둔다** — 펭펭이 달력 왼쪽 아래에 서 있어 «그 두 칸을 가린다».
//    첫 판에서 3째 줄 1번 칸의 음식이 통째로 안 보였다(캡처로 잡았다). 달력의 요지가 「해먹은 날에 그림이 박힌다」인데
//    그 그림이 캐릭터 뒤로 숨으면 요지가 죽는다. 📌아이콘을 옮길 땐 펭펭 폭(container 0~146px)을 먼저 볼 것.
// 🍜🍜 [2026-09-02] 카와이 넷을 실사로 — `fe_15`·`fh_k27`·`fe_06`·`fe_09` 는 **얼굴 달린 카와이**였다.
//    창업자 확정 *"카와이 컷을 아예 폐기해버리자"*(2026-08-29)가 **온보딩까지 안 닿아 있었다** —
//    ⭐ 여기는 «갓 깐 사람이 제일 먼저 보는 화면»이라 첫인상이 통째로 카와이였다.
//    ⛔ 짝은 내가 고르지 않았다 — 앱의 `ICON_RULES` 에 같은 요리 이름을 넣어 나온 컷이다(절대원칙 30).
//    ⚠️ `fh_k22`·`fe_22`·`fh_k29`·`fe_18` 은 픽커에 실린 실사라 그대로 둔다.
const CAL = [null, 'fh_k22', null, 'gr_014', null, null, 'gr_003', null, null, null, 'gr_349', null, 'fe_446', null, null, null, 'fe_22', null, 'fh_k29', null, 'fe_18']
const SlideD = () => (
  <Stage bg="linear-gradient(165deg,#d6dfea,#eef2f7)">
    <Cap top={210}><H1 style={{ color: '#3f5570' }}>오늘의 한 끼가<br />일기가 돼요</H1><Sub style={{ color: '#5b7291' }}>사진 붙이고 속지 골라 · 그날을 남겨요</Sub></Cap>
    <div style={{ position: 'absolute', top: 548, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
      {/* 📄 속지 실물 = `dp_snap` 「사진 기록」(984×1312 · 3:4) — 창업자가 고른 «반 나눠진 속지».
          위는 사진칸, 아래는 글칸이라 **꾸밀 여백이 넓다**. 좌표는 `papers.js` 실측값(SNAP) 그대로. */}
      <div style={{ position: 'relative', width: 580, aspectRatio: '984/1312', transform: 'rotate(-1.6deg)', filter: 'drop-shadow(0 26px 48px rgba(55,75,105,.32))', zIndex: 2 }}>
        <img src={dpSnap} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {/* 📷 사진칸 — 인쇄된 칸 안에 딱 (contain 이라 세로 사진도 안 잘린다) */}
        {/* ⛔⛔ 창업자 제보 2026-08-08 *"음식 이모지도 크기 좀만 줄이자 잘렸어(아래위가)"* — 맞았다.
            재보니 칸은 453×248 인데 `width:'62%'` 로 **폭만** 잡아 높이가 310px 이 됐다(fe_06 은 세로가 긴 컷).
            `overflow:hidden` 이라 **위아래 62px 이 통째로 잘렸다.**
            ⭐ 고침 = 칸을 100%로 채우고 `objectFit:'contain'` — 달력 칸이 이미 쓰는 문법이라 거긴 안 잘렸다.
            📌 **한 축만 잡으면 다른 축은 «비율이 정한다» — 칸 안에 넣으려면 두 축을 다 잡아야 한다.** */}
        <div style={{ position: 'absolute', ...P({ top: SNAP.photo.top, bottom: SNAP.photo.bottom, left: SNAP.photo.left, right: SNAP.photo.right }), padding: '4%', overflow: 'hidden' }}>
          {/* 🍜 [2026-09-02] `fe_81`(얼굴 달린 카와이 비빔냉면) → **실사 `gr_232` 비빔국수**
              ⭐ 이 칸 «아래»에 「비빔국수」라고 글자가 박혀 있다 → 그림과 이름이 맞아야 한다.
              ⛔ 냉면 컷(`gr_225`)을 고르면 안 된다 — 글자가 「비빔국수」다. */}
          <img src={F('gr_232')} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'absolute', ...P({ top: SNAP.title.top, left: SNAP.title.left }), fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 44, color: '#3f4a5a', lineHeight: 1 }}>비빔국수</div>
        <div style={{ position: 'absolute', ...P({ top: SNAP.date.top, left: SNAP.date.left }), fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 30, color: '#9aa4b2', lineHeight: 1 }}>{DIARY_DATE}</div>
        {/* ✍️ 글칸 — 첫 줄에 손글씨(형광펜), 아래 두 줄은 「줄」 속지를 고른 모습 */}
        <div style={{ position: 'absolute', ...P({ top: 55.4, left: SNAP.write.left, right: SNAP.write.right }), textAlign: 'left', fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 34, color: '#5a6270', lineHeight: 1.35 }}>
          더위에 지쳐도 <span style={{ background: 'linear-gradient(transparent 58%,#f5e08a 58%)' }}>한 끼는 챙겼다</span>
          {/* 줄은 «칸을 채울 만큼» 그린다 — 두 줄만 그렸더니 글칸 아래 절반이 텅 비었다 */}
          {[22, 32, 32, 32].map((m, i) => <div key={i} style={{ height: 2, background: '#ece5d8', marginTop: m }} />)}
        </div>
        {/* 🎀 모서리 꾸미기 — «대각선 두 짝»으로. 오른쪽 아래는 같은 컷을 180° 돌려 쓴다
            (코너 스티커는 전부 「왼쪽 위」 방향으로 그려져 있다) */}
        <Img k="dgc04" style={{ ...P({ left: 1.5, top: 1.5, width: 15.5 }) }} />
        <Img k="dgc05" style={{ ...P({ right: 1.5, bottom: 1.5, width: 14.5 }), transform: 'rotate(180deg)' }} />
        {/* ⭐ 별 = 사진 «위»에 붙인 것처럼. 안 쓰던 컷(`dn_star`) */}
        <Img k="dn_star" style={{ ...P({ right: 15, top: 28.5, width: 12 }), transform: 'rotate(-9deg)' }} />
        {/* 🙂 기분 스티커 — 레꾸엔 아예 없는 갈래(only:'diary')라 두 장을 가르는 표식이 된다.
            ⛔ `dgf01`(크림 바탕)은 «흰 속지 위에서 통째로 묻혔다» — 캡처로 잡았다.
               속지가 흰색이니 **테두리에 색이 든 컷**을 고른다(`dgf07` = 주황 햇살·활짝 웃음).
            ⛔ 자리는 글칸 «안쪽» 오른쪽 아래 — 칸 테두리에 걸치면 어정쩡하고 줄과도 겹친다 */}
        <Img k="dgf07" style={{ ...P({ right: 8, bottom: 12.5, width: 16 }), transform: 'rotate(6deg)' }} />
      </div>

      {/* 📅 달력 — 일기의 «두 번째 축». 그날을 남기는 것과 «모아서 보는 것»은 다른 즐거움이라
          글자(「달력으로 한눈에」)만으로는 안 와닿는다. 만든 날에 음식 아이콘이 박힌다. */}
      <div style={{ position: 'relative', marginTop: 30, width: 580, background: 'rgba(255,253,248,.94)', borderRadius: 24, padding: '20px 18px 22px', boxShadow: '0 18px 40px rgba(55,75,105,.2)' }}>
        <Img k="wt_td02" style={{ left: -16, top: -18, width: 156, transform: 'rotate(-7deg)' }} />
        <div style={{ fontFamily: "'Gaegu', cursive", fontWeight: 700, fontSize: 32, color: '#3f5570', marginBottom: 12 }}>{THIS_MONTH}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 9 }}>
          {CAL.map((k, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 13, background: k ? '#f2efe6' : '#f7f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {k ? <img src={F(k)} alt="" draggable={false} style={{ width: '84%', height: '84%', objectFit: 'contain' }} /> : null}
            </div>
          ))}
        </div>
      </div>

      {/* 🐧 펭펭 = 안 쓰던 컷 `gp_pengft`(두 주먹 파이팅) — 온보딩 아홉 장에 한 번도 안 나온 컷이다.
          ⛔ `gp_pengtb`(엄지척)는 안 쓴다 — 엄지척은 «우리가 유저를 평가하는 그림»이라 쓰지 않기로 했다.
          자리는 달력 밖 왼쪽 아래 — 종이 위에 두면 손글씨를 가린다(첫 판에서 「챙겼다」를 덮었다) */}
      <Img k="gp_pengft" cls="hk-m-kong" style={{ left: -58, bottom: -14, width: 196, transformOrigin: 'bottom center', filter: 'drop-shadow(0 10px 16px rgba(60,80,110,.28))' }} />
    </div>
    <Foot style={{ background: '#3f5570', color: '#fffdf8' }}>달력으로 한눈에</Foot>
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
// ── 6-S. 장보기 ──
// 🛒🛒 창업자 지적 2026-08-09 — *"여기는 장보기가 빠졌구나.."* · *"온보드에 왜 빠져있었지? 스샷이랑 다 똑같이 했었는데"*
//    ⛔ 맞았다. 스토어 스샷 «여덟 장» 중 **둘**이 온보딩에 없었다 — ④음식 아이콘 · ⑤장보기.
//       v8.37(7/24) 에 「스샷을 앱 안에서 라이브로」를 하면서 **처음부터 여섯 장만 옮겼다.**
//       ⚠️ 왜 그 둘을 뺐는지는 «기록에 안 적혀 있다» — 짐작해서 채우지 말 것.
//    ✅✅ **④ 음식 아이콘은 온보딩에 «안» 넣는다 — 창업자 확정 2026-08-09** (*"온보드에는 없어도 될 것 같아"*).
//       ⛔ 다음에 「스샷엔 있는데 온보딩엔 없네?」로 다시 파고들지 말 것. **온보딩은 열 장으로 확정.**
//       ⭐ **스토어 스샷엔 그대로 «넣는다»** (창업자 *"스샷에는 넣자"*) — 온보딩과 스샷이 «달라도 된다»는 결정이다.
//    📌 일기 때와 뿌리가 같다 — **하단바에 「장보기」 탭이 있는데 소개하는 자리에서 그 이름을 한 번도 안 불렀다.**
//    ⭐ 이 장면은 스샷 `design/promo/스토어스샷-2507/renders-v3/05-장보기.png` 를 그대로 라이브로 옮긴 것.
//       ⛔ 마트는 «상호»가 아니라 «종류»로 쓴다(새벽배송·대형몰…) — 제3자 상표를 스토어 이미지에 못 쓴다(스샷 README 원칙).
//       ⛔ 🛒 는 유니코드가 아니라 우리 `cart` 라인 아이콘이다(CLAUDE.md ⛔UI 유니코드 이모지 금지).
const BUY = [['돼지고기 앞다리'], ['두부 한 모'], ['대파 한 단']]
const MALLS = [['새벽배송', '#5a7fa8'], ['대형몰', '#8c93a0'], ['친환경마켓', '#6f9a5e'], ['오픈마켓', '#b0805a'], ['동네마트', '#9b86bd']]
const Cart = ({ s = 34, c = '#fffdf8' }) => <Icon name="cart" size={s} color={c} stroke={2} />
const SlideS = () => (
  <Stage bg="linear-gradient(170deg,#b3d1e2,#cfe2ec 60%,#dfebf2)">
    <Cap top={210}>
      <H1 style={{ color: '#2f6187' }}>재료, 한 번에<br />사러가기 <span style={{ display: 'inline-block', verticalAlign: '-6px' }}><Cart s={64} c="#2f6187" /></span></H1>
      <Sub style={{ color: '#4a7ba3' }}>레시피 재료 그대로 톡 — 여러 마트로 바로</Sub>
    </Cap>
    <div style={{ position: 'absolute', top: 556, left: '50%', transform: 'translateX(-50%)', width: 720 }}>
      {/* 🍲 레시피 재료 → 담기 */}
      <div style={{ background: '#fffdf8', borderRadius: 34, padding: '26px 30px 16px', boxShadow: '0 22px 44px rgba(45,75,105,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 92, height: 92, borderRadius: 22, background: '#f2efe6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={F('fh_k02')} alt="" draggable={false} style={{ width: '84%', height: '84%', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 46, color: '#33302b' }}>김치찌개 재료</div>
            <div style={{ fontSize: 28, color: '#9aa4b2', marginTop: 2 }}>돼지고기·두부·대파·김치…</div>
          </div>
        </div>
        <div style={{ height: 2, margin: '22px 0 4px', backgroundImage: 'repeating-linear-gradient(90deg,#dcd6c8 0 12px,transparent 12px 24px)' }} />
        {BUY.map(([n], i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 6px', borderTop: i ? '2px solid #f0ece1' : 'none' }}>
            <span style={{ fontSize: 38, color: '#33302b' }}>· {n}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#5a83ab', color: '#fffdf8', fontSize: 32, padding: '12px 26px', borderRadius: 999 }}>담기 <Cart s={30} /></span>
          </div>
        ))}
      </div>
      {/* 🏪 마트는 «종류»로 — 상호를 스토어 이미지에 못 쓴다 */}
      <div style={{ marginTop: 26, background: '#fffdf8', borderRadius: 34, padding: '22px 24px 26px', boxShadow: '0 22px 44px rgba(45,75,105,.22)', textAlign: 'center' }}>
        <div style={{ fontSize: 38, color: '#2f6187', display: 'inline-flex', alignItems: 'center', gap: 12 }}>내가 자주 쓰는 마트로 바로 <Cart s={34} c="#2f6187" /></div>
        <div style={{ fontSize: 27, color: '#8d97a4', marginTop: 6 }}>원하는 곳으로 톡 — 장바구니째 이동</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 20 }}>
          {MALLS.map(([n, c]) => (
            <span key={n} style={{ background: c, color: '#fffdf8', fontSize: 30, padding: '12px 26px', borderRadius: 999 }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
    <img src={duoCart} alt="" draggable={false} className="hk-m-sway"
      style={{ position: 'absolute', left: '50%', bottom: 176, transform: 'translateX(-50%)', width: 344, transformOrigin: 'bottom center', filter: 'drop-shadow(0 14px 22px rgba(45,75,105,.3))' }} />
    <Foot style={{ background: '#2f6187', color: '#fffdf8' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>장 볼 거 까먹을 일 없이 <Cart s={38} /></span></Foot>
  </Stage>
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
        꼬르곰과 펭펭, 티격태격하지만<br />그게 곧 사랑이에요.<br />우리 집 이야기이자, 여느 집 이야기죠.
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
// ⚠️⚠️ 친구가 늘어날 때 글자를 고치러 다니지 않게 만들어 뒀다 (창업자 질문 2026-07-30:
//    *"근데 나중에 6번째 친구 나오면 어떻게해??"*).
//    ① 제목의 "다섯" 은 **`CAST.length` 로 센다** — 여기 한 줄만 추가하면 "여섯 친구" 로 저절로 바뀐다.
//    ② 꼬리말에선 **순서(몇 번째)를 아예 쓰지 않는다** — "여섯 번째 친구는 여러분" 이라고 박으면
//       친구가 늘어난 순간 거짓이 된다. 우리 원칙과 같다(설문 문구의 "넷 중에" 도 같은 이유로 뺐다).
//    ⚠️ 단체 그림(`lineup5.png`)은 자동으로 안 바뀐다 — 친구를 추가하면 **정본을 다시 뽑아야 한다.**
const KO_NUM = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
const CAST = [
  { face: avGom, name: '꼬르곰', line: '허당 셰프, 감정 부자' },
  { face: avPeng, name: '펭펭', line: '무표정이 매력인 해결사' },
  { face: avCapy, name: '카롱', line: '여유로운 체력왕' },
  { face: avFox, name: '뾰미', line: '트렌드에 민감한 멋쟁이' },
  { face: avGecko, name: '꼬비', line: '어디에나 숨는 행운의 요정' },
]
const Slide7C = () => (
  <Stage bg="linear-gradient(165deg,#f7e6ca,#f2d6b0 58%,#e8c495)">
    <Cap top={150}><H1 style={{ color: '#6b4526' }}>{KO_NUM[CAST.length] || CAST.length} 친구가<br />함께 살아요</H1></Cap>
    {/* ⭐ 그림 칸과 이름줄을 **한 세로 흐름**에 넣는다 — 좌표로 따로 놓으면 겹친다.
        (2026-07-31 창업자 지적 *"꼬르곰 글자 너무 위에있어"* — 새 정본이 조금 더 세로로 길어져
         비율이 1.25→1.22 로 바뀌자 이름줄 첫 칸이 그림 칸 아래에 물렸다.)
        📌 숫자를 다시 맞추는 건 **그림이 또 바뀌면 또 어긋난다.** 그림 높이가 얼마든
           이름줄은 «남은 자리»를 나눠 쓰므로 구조적으로 겹칠 수가 없다. */}
    <div style={{ position: 'absolute', top: 420, left: 64, right: 64, bottom: 210, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* 단체 정본 — 배경과 같은 #F9F9F9 카드에 얹어 경계가 안 보이게 */}
      <div style={{ flex: '0 0 auto', background: '#f9f9f9', borderRadius: 40, padding: '10px 0 0', boxShadow: '0 16px 32px rgba(140,95,50,.2)', overflow: 'hidden' }}>
        <img src={lineup5} alt="" draggable={false} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </div>
      {/* 이름 + 성격 한 줄 — 얼굴 컷을 앞에 붙여 누가 누군지 짚어준다.
          ⚠️ 줄은 **남은 높이를 똑같이 나눠 가진다**(`flex:1 1 0`) — 친구가 늘어도, 그림이 커져도
             꼬리말을 밀어내거나 넘치지 않는다. 얼굴 크기도 줄 높이의 %라 같이 줄고 는다. */}
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 10px' }}>
        {CAST.map((c) => (
          <div key={c.name} style={{ flex: '1 1 0', minHeight: 0, display: 'flex', alignItems: 'center', gap: 20 }}>
            <img
              src={c.face} alt="" draggable={false}
              style={{ height: '74%', aspectRatio: '1', borderRadius: '50%', objectFit: 'contain', background: '#fffdf8', border: '3px solid #e6cfae', flex: '0 0 auto' }}
            />
            <div style={{ fontSize: 40, fontWeight: 800, color: '#6b4526', width: 190, flex: '0 0 auto' }}>{c.name}</div>
            <div style={{ fontSize: 36, color: '#8a6440', lineHeight: 1.3 }}>{c.line}</div>
          </div>
        ))}
      </div>
    </div>
    {/* ⛔ "여섯 번째" 처럼 순서를 박지 않는다 — 위 CAST 주석 참고 */}
    <Foot style={{ background: '#6b4526', color: '#fff7ea' }}>그리고 여러분도 한 식구예요</Foot>
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

// ⭐ 순서 = 창업자 확정 2026-07-30 *"꼬르곰은 저에요1. 친구들2번. 그다음 순서대로"*
//    **사람 소개 → 친구들 → 기능 → 브랜드 CTA.** 기능부터 늘어놓으면 "또 하나의 앱" 이지만,
//    *"꼬르곰은 저예요"* 로 시작하면 첫 화면부터 다른 앱이 복사할 수 없는 얘기가 된다.
//    (근거 = `docs/기획-노트.md` "창업자 스토리 = 그 자체로 콘텐츠")
// 📔 SlideD(한끼 일기) = 레꾸 «바로 다음». 「레시피를 꾸민다」 → 「일기도 꾸민다」로 이어진다.
//    ⚠️ 장수가 늘면 아래 점 표시(dots)와 「다음」 버튼은 `SLIDES.length` 로 저절로 따라간다 —
//       v9.04 에서 «개수를 글자에 박지 않는다»로 고쳐 놓은 덕이다.
// 🛒 SlideS(장보기) = 큐레이션(Slide6) «바로 앞» — 스토어 스샷 순서 그대로다(⑤장보기 → ⑥큐레이션).
//    「레시피 재료를 담아 사러 간다」가 먼저고 「살림템 추천」이 그다음이라 흐름도 맞는다.
const SLIDES = [Slide7B, Slide7C, Slide1, Slide2, SlideD, Slide3, SlideS, Slide6, Slide7, Slide8]

// 🔁🔁 onRestore = 「이미 다른 기기에서 쓰고 있었어요」 문 (창업자 2026-08-15)
//   📮 *"이거 백업안하고 기기를 바꾸거나, 패드에 깔면 이메일을 안받으니까 **처음 가입한 것 처럼되거든?**
//      … 패드에 깔아서 핸드폰에 내가 저장한 것들 살리는 법도 안내하고."*
//   ⛔ 그 전엔 마지막 장 버튼이 「한끼 시작하기」 «하나»뿐이었다 — 새 기기에 깐 사람은
//      여기서 그냥 시작하고 «빈 앱»을 본다. 백업 파일이 카톡에 멀쩡히 있어도
//      **「불러오면 된다」는 걸 알 자리가 앱 어디에도 없었다**(백업 메뉴는 설정 «안»에 있다).
//   ⭐ 새 기기에서 앱을 처음 여는 순간이 **유일하게 안 놓치는 자리**다. 여기서 못 잡으면
//      유저는 빈 앱을 보고 「초기화됐다」고 읽는다 (창업자 *"저장한거 초기화되면 나같으면 앱지워"*).
export default function Onboarding({ onDone, onRestore }) {
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
        {/* ⭐ 마지막 장에서만 — 앞 장에 두면 «처음 깐 사람»이 매 장 이 문구를 보고 헷갈린다.
            ⛔ 버튼(btn-primary)으로 만들지 않는다 — 대부분은 새로 시작하는 사람이라
               두 버튼이 같은 무게로 있으면 «뭘 눌러야 하나»가 된다. 아는 사람만 찾으면 되는 줄이다. */}
        {last && onRestore && (
          <button
            className="press"
            onClick={() => { markOnboarded(); onRestore() }}
            style={{ width: '100%', marginTop: 12, color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, padding: '6px 0', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            이미 다른 기기에서 쓰고 있었어요 · 백업 불러오기
          </button>
        )}
      </div>
    </div>
  )
}
