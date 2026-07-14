import { useState, useRef } from 'react'
import Icon from './Icon'
import Buddy from './Buddies'
import TextTile from './TextTile'

// 첫 실행 온보딩 — "이게 뭐하는 앱?"을 3초 안에 알려주고, 한끼만의 차별화(통합 살림)를
// 어필한 뒤, 곧 나올 AI 자동인식을 살짝 흘려 기대감을 준다. 4장 · 건너뛰기 가능.
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
  return (
    <div style={{ position: 'relative', width: 172, height: 172, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 42%, #f0ece2, #e6e2d5)',
      }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: 'var(--brown)', letterSpacing: '-0.02em', lineHeight: 1 }}>한끼</div>
        <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--text-sub)' }}>HANKKI</div>
      </div>
      {/* 흩어진 조각이 모이는 느낌의 점들 */}
      <span style={{ position: 'absolute', top: 14, left: 26, width: 8, height: 8, borderRadius: '50%', background: 'var(--sand)' }} />
      <span style={{ position: 'absolute', bottom: 22, right: 20, width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-soft, #b79877)' }} />
      <span style={{ position: 'absolute', top: 40, right: 12, width: 5, height: 5, borderRadius: '50%', background: 'var(--sand)' }} />
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

// 레시피북 꾸미는 시안 — 실제 레시피(재료)가 보이는 페이지 위에 포스트잇·글자타일·아바타·이모지가 얹힘
function HeroDecorate() {
  return (
    <div style={{ position: 'relative', width: 232, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 뒤에 살짝 겹친 카드(레시피북 느낌) */}
      <div style={{ position: 'absolute', width: 150, height: 168, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, transform: 'rotate(6deg) translate(10px, 6px)', boxShadow: 'var(--shadow-soft)' }} />
      {/* 메인 레시피 페이지 */}
      <div style={{ position: 'relative', width: 150, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflow: 'hidden', transform: 'rotate(-3deg)' }}>
        <div style={{ padding: '12px 13px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #f3ede1, #e8e1d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>🍲</div>
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
      {/* 포스트잇 */}
      <div style={{ position: 'absolute', right: 2, bottom: 26, width: 52, height: 40, background: '#fff6c9', borderRadius: 4, transform: 'rotate(6deg)', boxShadow: '0 3px 8px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: '#7a6a2a', textAlign: 'center', padding: 4 }}>애들이<br />좋아함💕</div>
      <span style={{ position: 'absolute', top: 20, left: 8, fontSize: 20, transform: 'rotate(-12deg)' }}>✨</span>
    </div>
  )
}

function HeroAI() {
  return (
    <div style={{ position: 'relative', width: 172, height: 172, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 42%, #eef3ea, #e3eadd)',
      }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip><Icon name="camera" size={22} color="var(--brown)" /></Chip>
          <Chip tint="#fdf0f4"><Icon name="instagram" size={22} color="#c2557e" /></Chip>
        </div>
        <div style={{ fontSize: 22 }}>✨</div>
      </div>
    </div>
  )
}

const SLIDES = [
  {
    hero: <HeroWelcome />,
    title: '흩어진 레시피를,\n한곳에.',
    body: '인스타·유튜브·손글씨…\n여기저기 저장해둔 내 레시피를\n한끼 하나로 모아요.',
    tagline: '장보고 · 레시피 등록하고 · 요리하고 · 꾸미기까지, 한 번에',
  },
  {
    hero: <HeroCollect />,
    title: '어디서든 담기',
    body: '링크든 사진이든 직접 쓰기든,\n마음에 든 레시피를\n한끼에 착착 모을 수 있어요.',
  },
  {
    hero: <HeroFlow />,
    title: '냉장고부터 요리까지, 한 번에',
    body: '냉장고 재료로 “오늘 뭐 해먹지” 추천받고,\n부족한 재료는 바로 장보기,\n따라하기 쉬운 요리모드까지.',
    highlight: true,
  },
  {
    hero: <HeroDecorate />,
    title: '내맘대로 꾸미는 레시피북',
    body: '귀여운 아바타와 이모지·글자 타일·스티커로,\n획일화된 음식사진 말고\n나만의 감성으로 채워요.',
    highlight: true,
  },
  {
    hero: <HeroAI />,
    title: '곧, AI가 대신 정리해줘요',
    body: '사진이나 인스타 링크만 넣으면\nAI가 재료·순서까지 척척 자동정리.\n더 편해질 한끼를 기대해 주세요.',
    badge: '준비 중',
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
            display: 'inline-block', marginBottom: 12, padding: '4px 12px', borderRadius: 999,
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em',
          }}>{s.badge} ✨</div>
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
