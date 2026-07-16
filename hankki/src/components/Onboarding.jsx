import { useState, useRef } from 'react'
import Icon from './Icon'
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
  // 확정 로고(곰=ㅎ 주아 '한끼' + HANKKI)를 앱아이콘 타일로. 스토어 스샷과 동일.
  return (
    <div style={{ position: 'relative', width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={logoCream} alt="한끼"
        style={{ width: 180, height: 180, borderRadius: 42, boxShadow: 'var(--shadow-card)', border: '1px solid var(--line)' }} />
      {/* 흩어진 조각이 모이는 느낌의 점들 */}
      <span style={{ position: 'absolute', top: 4, left: 8, width: 9, height: 9, borderRadius: '50%', background: 'var(--brown)', opacity: 0.5 }} />
      <span style={{ position: 'absolute', bottom: 12, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--brown)', opacity: 0.35 }} />
      <span style={{ position: 'absolute', top: 34, right: 0, width: 6, height: 6, borderRadius: '50%', background: 'var(--brown)', opacity: 0.4 }} />
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

// 꾸민 표지 시안 — 모눈 배경지에 손글씨 제목 + 냄비·곰돌이·하트 스티커. 스토어 스샷과 동일 톤.
function HeroDecorate() {
  return (
    <div style={{ position: 'relative', width: 210, filter: 'drop-shadow(0 12px 22px rgba(90,65,45,.16))', transform: 'rotate(-4deg)' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 11 }}>
        {/* 모눈 배경지 표지 */}
        <div style={{
          position: 'relative', height: 176, borderRadius: 11, overflow: 'hidden',
          backgroundColor: '#f4efe2',
          backgroundImage: 'linear-gradient(#e7ddc7 1.2px, transparent 1.2px), linear-gradient(90deg, #e7ddc7 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}>
          {/* 마스킹테이프 */}
          <div style={{ position: 'absolute', top: -3, right: -10, width: 92, height: 22, background: 'rgba(214,150,120,.68)', transform: 'rotate(11deg)' }} />
          {/* 손글씨 제목(귀염체) */}
          <div style={{ position: 'absolute', top: 18, left: 0, right: 0, textAlign: 'center', fontFamily: "'Gaegu','Gowun Dodum',sans-serif", fontWeight: 700, fontSize: 27, color: 'var(--brown)', transform: 'rotate(-3deg)' }}>우리집 김치찌개</div>
          {/* 냄비(김 오르는) */}
          <div style={{ position: 'absolute', left: '52%', top: '60%', transform: 'translate(-50%,-50%)', width: 74, height: 74 }}>
            <svg viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="14" ry="11" fill="#4a4a4e" /><path d="M10 27a14 8 0 0 0 28 0" fill="#3c3c40" /><path d="M11 25h26v3H11z" fill="#5a5a5f" /><circle cx="20" cy="24" r="1.7" fill="#e0a83a" /><circle cx="27" cy="26" r="1.7" fill="#cf6f5a" /><circle cx="23" cy="27" r="1.5" fill="#8ca86e" /><path d="M20 16c-1.5 2 .5 3.2-.5 5M25 15c-1.5 2 .5 3.2-.5 5" stroke="#cfcfcf" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" /></svg>
          </div>
          {/* 곰돌이 스티커 */}
          <div style={{ position: 'absolute', left: 10, bottom: 9, width: 48, height: 48 }}>
            <svg viewBox="0 0 48 48">
              <circle cx="14.5" cy="18" r="4.6" fill="#b98a63" /><circle cx="33.5" cy="18" r="4.6" fill="#b98a63" />
              <circle cx="24" cy="28" r="13" fill="#b98a63" /><ellipse cx="24" cy="32.5" rx="6.4" ry="4.6" fill="#ecd9bd" />
              <rect x="22.6" y="30" width="2.8" height="2.2" rx="1.1" fill="#5f4632" />
              <path d="M24 32.4v1.6M24 34c-.9.9-2 .9-2.8.2M24 34c.9.9 2 .9 2.8.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
              <circle cx="18.6" cy="27.5" r="1.35" fill="#3d3830" /><circle cx="29.4" cy="27.5" r="1.35" fill="#3d3830" />
              <circle cx="15.6" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75" /><circle cx="32.4" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75" />
              <rect x="15.5" y="14.6" width="17" height="3.6" rx="1.8" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
              <circle cx="16.8" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" strokeWidth="1" /><circle cx="24" cy="10.6" r="3.9" fill="#fff" stroke="#e2ded2" strokeWidth="1" /><circle cx="31.2" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
            </svg>
          </div>
          {/* 하트 스티커 */}
          <div style={{ position: 'absolute', right: 10, bottom: 15, width: 34, height: 34 }}>
            <svg viewBox="0 0 48 48"><path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill="#dd918a" stroke="#71604b" strokeWidth="2" strokeLinejoin="round" /></svg>
          </div>
        </div>
        {/* 제목 자리 스켈레톤 */}
        <div style={{ height: 9, background: '#eee7d8', borderRadius: 5, marginTop: 10 }} />
        <div style={{ height: 9, width: '58%', background: '#eee7d8', borderRadius: 5, marginTop: 6 }} />
      </div>
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
          background: 'radial-gradient(circle at 50% 40%, #eef5ea, #dbe8d1)', border: '1px solid #cfe0c5',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <svg viewBox="0 0 48 48" style={{ width: 30, height: 30 }}><path d="M24 7l3.4 11.6L39 22l-11.6 3.4L24 37l-3.4-11.6L9 22l11.6-3.4z" fill="#6e9c5e" /><circle cx="37" cy="12" r="2.4" fill="#8bb277" /><circle cx="12" cy="34" r="2" fill="#8bb277" /></svg>
        </div>
        <div style={{ marginTop: 7, fontSize: 10, fontWeight: 800, color: '#4a7a45' }}>AI 정리</div>
      </div>
      <Arrow />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)',
        }}>
          <svg viewBox="0 0 48 48" style={{ width: 30, height: 30 }}><ellipse cx="24" cy="28" rx="14" ry="11" fill="#4a4a4e" /><path d="M10 25a14 8 0 0 0 28 0" fill="#3c3c40" /><path d="M11 23h26v3H11z" fill="#5a5a5f" /><circle cx="20" cy="22" r="1.7" fill="#e0a83a" /><circle cx="27" cy="24" r="1.7" fill="#cf6f5a" /></svg>
        </div>
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
    body: '스티커·마스킹테이프·손글씨까지.\n똑같은 음식 사진 말고,\n나만의 감성으로 채우는 재미.',
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
