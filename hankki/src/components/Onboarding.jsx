import { useState, useRef } from 'react'
import Icon from './Icon'
import FoodIcon from './FoodIcon'
import Buddy from './Buddies'
import TextTile from './TextTile'
import { NoteShapeDefs } from './Stickers'
import logoCream from '../assets/logo-hankki-cream.png'

// 첫 실행 온보딩 — "이게 뭐하는 앱?"을 3초 안에 알려주고, 한끼만의 차별화(통합 살림)를
// 어필한 뒤, 곧 나올 AI 자동인식을 살짝 흘려 기대감을 준다. 6장 · 건너뛰기 가능.
// 표시 여부는 localStorage 'hankki:onboarded' 키 하나로만 관리(스토어와 분리).
export const ONBOARD_KEY = 'hankki:onboarded'
export function needsOnboarding() {
  try { return localStorage.getItem(ONBOARD_KEY) !== '1' } catch { return false }
}
export function markOnboarded() {
  try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* noop */ }
}

// 얇은 선 냉장고 아이콘(공용 Icon 세트엔 없어서 온보딩 전용으로 인라인)
function Fridge({ size = 26, color = 'var(--brown)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="3" width="12" height="18" rx="2.2" />
      <path d="M6 10h12" />
      <path d="M9 6.4v1.6M9 12.6v3" />
    </svg>
  )
}

// 작은 원형 아이콘 타일
function Chip({ children, tint }) {
  return (
    <div style={{
      width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tint || 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)',
    }}>{children}</div>
  )
}

function Arrow() {
  return (
    <div style={{ color: 'var(--sand)', display: 'flex', alignItems: 'center' }}>
      <Icon name="chevron-right" size={16} stroke={2} color="var(--sand)" />
    </div>
  )
}

// ── 슬라이드별 히어로 그림 ──
function HeroWelcome() {
  // 확정 로고(곰=ㅎ 주아 '한끼' + HANKKI)를 앱 아이콘 톤으로 보여준다.
  return (
    <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={logoCream}
        alt="한끼"
        style={{ width: 172, height: 172, borderRadius: 40, boxShadow: 'var(--shadow-card)', border: '1px solid var(--line)' }}
      />
      {/* 흩어진 조각이 모이는 느낌의 점들 */}
      <span style={{ position: 'absolute', top: 6, left: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--sand)' }} />
      <span style={{ position: 'absolute', bottom: 14, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-soft, #b79877)' }} />
      <span style={{ position: 'absolute', top: 34, right: 2, width: 5, height: 5, borderRadius: '50%', background: 'var(--sand)' }} />
    </div>
  )
}

function HeroCollect() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 260 }}>
      <Chip tint="#fdf0f4"><Icon name="instagram" size={26} color="#c2557e" /></Chip>
      <Chip tint="#fdefef"><Icon name="youtube" size={26} color="#c0504a" /></Chip>
      <Chip><Icon name="camera" size={26} color="var(--brown)" /></Chip>
      <Chip><Icon name="pen" size={24} color="var(--brown)" /></Chip>
    </div>
  )
}

function HeroFlow() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
      <div style={{ textAlign: 'center' }}>
        <Chip tint="#eef2ec"><Fridge size={26} color="var(--brown)" /></Chip>
        <div style={{ marginTop: 7, fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)' }}>냉장고</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <Chip tint="#f3efe6"><Icon name="search" size={24} color="var(--brown)" /></Chip>
        <div style={{ marginTop: 7, fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)' }}>뭐먹지</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <Chip><Icon name="cart" size={24} color="var(--brown)" /></Chip>
        <div style={{ marginTop: 7, fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)' }}>장보기</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <Chip tint="#f3efe6"><Icon name="clock" size={24} color="var(--brown)" /></Chip>
        <div style={{ marginTop: 7, fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)' }}>요리모드</div>
      </div>
    </div>
  )
}

// 주부의 장바구니 — 18년차 주부가 엄선한 건강 식재료 + 쇼핑몰 바로 연결(시그니처)
function HeroBasket() {
  const items = ['첨가물 적은 소스·양념', '무항생제 훈제오리', '건강 간편식·매생이']
  const malls = [
    { name: '쿠팡', color: '#c5292a', tint: '#fbeceb' },
    { name: '오아시스', color: '#4a8455', tint: '#eef5ea' },
    { name: '한살림', color: '#3f7a3f', tint: '#eef3ea' },
  ]
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 190, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 13px 9px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="cart" size={16} color="var(--brown)" /></div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)' }}>주부의 장바구니</div>
        </div>
        <div style={{ padding: '9px 13px 11px' }}>
          {items.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5.5 }}>
              <Icon name="check" size={12} color="var(--sage, #7f9270)" stroke={2.6} />
              <span style={{ fontSize: 10.5, color: 'var(--text-sub)', fontWeight: 600 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 쇼핑몰 바로가기 — 진짜 시그니처 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {malls.map((m) => (
          <span key={m.name} style={{ fontSize: 10.5, fontWeight: 800, color: m.color, background: m.tint, border: '1px solid var(--line)', borderRadius: 999, padding: '5px 11px' }}>{m.name}</span>
        ))}
      </div>
    </div>
  )
}

// 레시피북 꾸미는 시안 — 실제 레시피(재료) 페이지 위에 아바타·글자타일·하트 포스트잇(귀염체)이 얹힘
function HeroDecorate() {
  return (
    <div style={{ position: 'relative', width: 232, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <NoteShapeDefs />
      {/* 뒤에 살짝 겹친 카드(레시피북 느낌) */}
      <div style={{ position: 'absolute', width: 150, height: 168, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, transform: 'rotate(6deg) translate(10px, 6px)', boxShadow: 'var(--shadow-soft)' }} />
      {/* 메인 레시피 페이지 */}
      <div style={{ position: 'relative', width: 150, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflow: 'hidden', transform: 'rotate(-3deg)' }}>
        <div style={{ padding: '12px 13px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #f3ede1, #e8e1d2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FoodIcon name="rice" size={22} /></div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>엄마표<br />김치볶음밥</div>
        </div>
        <div style={{ padding: '4px 13px 14px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--brown)', marginBottom: 5 }}>재료</div>
          {['김치 1컵', '밥 1공기', '삼겹살 100g', '대파 · 참기름'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3.5 }}>
              <span style={{ width: 4, height: 4, borderRadius: 9, background: 'var(--sand)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-sub)', fontWeight: 600 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 위에 얹힌 꾸미기 */}
      <div style={{ position: 'absolute', top: -6, right: 14, transform: 'rotate(8deg)' }}><TextTile text="찐맛" size={38} radius={10} /></div>
      <div style={{ position: 'absolute', left: 0, bottom: -4, transform: 'rotate(-8deg)' }}><Buddy id="rabbit" size={58} /></div>
      {/* 하트 포스트잇 — 새 모양 + 귀염체(개구체) 글씨 자랑 */}
      <div style={{ position: 'absolute', right: -2, bottom: 22, width: 54, height: 50, transform: 'rotate(7deg)', filter: 'drop-shadow(1px 2px 4px rgba(70,60,45,.28))' }}>
        <div style={{ width: '100%', height: '100%', clipPath: 'url(#hk-note-heart)', WebkitClipPath: 'url(#hk-note-heart)', background: '#efe4bd', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 5, boxSizing: 'border-box' }}>
          <span style={{ fontFamily: "'Gaegu','Gowun Dodum','Pretendard',sans-serif", fontSize: 13, fontWeight: 700, color: '#5f5647', lineHeight: 1 }}>맛있어</span>
        </div>
      </div>
      <span style={{ position: 'absolute', top: 20, left: 8, transform: 'rotate(-12deg)' }}><Icon name="sparkle" size={20} color="var(--brown)" /></span>
    </div>
  )
}

// 캡처·링크 → AI → 레시피 완성 흐름(곧 출시 미리보기)
function HeroAI() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      <div style={{ textAlign: 'center' }}>
        <Chip tint="#fdf0f4"><Icon name="camera" size={24} color="#c2557e" /></Chip>
        <div style={{ marginTop: 7, fontSize: 10, fontWeight: 700, color: 'var(--text-sub)' }}>캡처 · 링크</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 40%, #f6ede0, #efdcc7)', border: '1px solid #e6d3ba',
          boxShadow: 'var(--shadow-soft)',
        }}><Icon name="sparkle" size={28} color="var(--brown)" /></div>
        <div style={{ marginTop: 7, fontSize: 10, fontWeight: 800, color: 'var(--brown)' }}>AI 정리</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)',
        }}><FoodIcon name="stew" size={30} /></div>
        <div style={{ marginTop: 7, fontSize: 10, fontWeight: 700, color: 'var(--text-sub)' }}>레시피 완성</div>
      </div>
    </div>
  )
}

const SLIDES = [
  {
    hero: <HeroWelcome />,
    title: '흩어진 레시피를,\n한곳에.',
    body: '인스타에 저장만 해두고 못 찾던 레시피,\n캡처만 쌓인 사진첩…\n이제 한끼 하나에 딱 모아요.',
    tagline: '장보고 · 레시피 등록하고 · 요리하고 · 꾸미기까지, 한 번에',
  },
  {
    hero: <HeroCollect />,
    title: '어디서든 손쉽게 담기',
    body: '링크 붙여넣기, 사진 찍기, 직접 쓰기 —\n편한 대로 아무렇게나 담아도\n내 레시피북에 착착.',
  },
  {
    hero: <HeroFlow />,
    title: '냉장고부터 요리까지, 한 번에',
    body: '“오늘 뭐 해먹지?” 냉장고 재료로 추천받고,\n모자란 건 바로 장보기,\n따라하기 쉬운 요리모드로 뚝딱.',
    highlight: true,
  },
  {
    hero: <HeroBasket />,
    title: '18년차 주부의 장바구니',
    body: '첨가물 적은 건강 식재료를 엄선했어요.\n쿠팡·오아시스·한살림에서\n바로 사러 가기까지 한 번에.',
    highlight: true,
  },
  {
    hero: <HeroDecorate />,
    title: '내 맘대로 꾸미는 레시피북',
    body: '아바타·이모지·글자 타일·스티커까지.\n똑같은 음식 사진 말고,\n나만의 감성으로 채우는 재미.',
    highlight: true,
  },
  {
    hero: <HeroAI />,
    title: '사진 찍으면,\nAI가 레시피로',
    body: '캡처·인스타·유튜브 링크만 쏙 —\n재료·순서까지 칸칸이 알아서 정리돼요.\n옮겨적을 필요 없이 몇 초면 끝.',
    badge: '곧 출시',
    highlight: true,
  },
]

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0)
  const startX = useRef(null)
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]

  const finish = () => { markOnboarded(); onDone && onDone() }
  const next = () => { if (last) finish(); else setI((v) => Math.min(SLIDES.length - 1, v + 1)) }
  const prev = () => setI((v) => Math.max(0, v - 1))

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (startX.current == null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -45) next()
    else if (dx > 45) prev()
    startX.current = null
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(var(--safe-top) + 8px)', paddingBottom: 'calc(var(--safe-bottom) + 22px)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 상단: 건너뛰기 */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px' }}>
        {!last && (
          <button className="press" onClick={finish}
            style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 700, padding: '6px 8px' }}>
            건너뛰기
          </button>
        )}
      </div>

      {/* 히어로 */}
      <div key={'h' + i} className="fade" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', minHeight: 190 }}>
        {s.hero}
      </div>

      {/* 텍스트 */}
      <div key={'t' + i} className="fade" style={{ padding: '0 30px', textAlign: 'center' }}>
        {s.badge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12, padding: '4px 12px', borderRadius: 999,
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em',
          }}><Icon name="sparkle" size={13} color="var(--brown)" />{s.badge}</div>
        )}
        <h2 style={{
          margin: 0, fontSize: 25, fontWeight: 900, lineHeight: 1.28, letterSpacing: '-0.02em',
          color: s.highlight ? 'var(--brown)' : 'var(--text)', whiteSpace: 'pre-line',
        }}>{s.title}</h2>
        <p style={{
          margin: '14px auto 0', maxWidth: 320, fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-sub)',
          whiteSpace: 'pre-line', fontWeight: 500,
        }}>{s.body}</p>
        {s.tagline && (
          <div style={{
            margin: '18px auto 0', maxWidth: 320, paddingTop: 14, borderTop: '1px solid var(--line)',
            fontSize: 12.5, lineHeight: 1.6, color: 'var(--brown)', fontWeight: 700,
          }}>{s.tagline}</div>
        )}
      </div>

      {/* 하단: 점 + 버튼 */}
      <div style={{ padding: '26px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 20 }}>
          {SLIDES.map((_, k) => (
            <span key={k} style={{
              width: k === i ? 20 : 7, height: 7, borderRadius: 999,
              background: k === i ? 'var(--brown)' : 'var(--line)', transition: 'all .25s ease',
            }} />
          ))}
        </div>
        <button className="btn-primary press" style={{ width: '100%' }} onClick={next}>
          {last ? '한끼 시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
