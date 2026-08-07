import Icon from './Icon'

// 검색 탭은 뺐다 — 홈 상단 검색창이 검색 화면으로 바로 데려가 준다.
// 그 자리엔 앱의 핵심 동작인 '가져오기'를 넣고, 채운 원으로 눈에 띄게 강조한다.
// '일지' 탭은 레시피 탭(요리 기록 세그먼트)으로 합쳤다 — 레시피와 기록이 한 곳에.
// '설정'은 하단 탭에서 뺐다 — 홈 상단 톱니(예전 Inbox 자리)가 설정으로 감. 그 자리에 바이럴 핵심인 '레꾸자랑'을 넣는다.
// 이름 '레꾸자랑' = 내가 꾸민 표지(레꾸=레시피 꾸미기, 브랜드 단어) 자랑. 탭 주인공이 꾸민 표지라 카드자랑→레꾸자랑(창업자 확정).
// 📔 「한끼 일기」를 하단바에 (창업자 2026-08-07
//    *"맨 아래 바에 한끼일기도 넣자. 일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*)
//
// ⚗️⚗️ **검수용 스위치 — 창업자가 두 안을 «눈으로» 고른다** (*"두가지 다 해보자"*)
//    ⛔ 판정이 나면 고른 쪽만 남기고 이 스위치는 지운다. 임시 코드다.
//    · six = 하단바 여섯 (가져오기 그대로 두고 일기를 더한다)
//    · fab = 하단바 다섯 (가져오기를 홈 플로팅으로 빼고 그 자리에 일기)
//
// 📏 실측(`_measure-하단바.mjs`) — 여섯이어도 «들어간다»:
//    한 칸 320px폰 64→53.3 · 360px 72→60 · 412px 82→68.7
//    제일 긴 글자 「가져오기」 42px → 제일 좁은 폰에서도 11.3px 남는다 (손가락 최소 44px 도 넘는다)
//    ⛔ 문서의 *"하단 탭 5개가 이미 꽉 찼고"*(리텐션-설계원칙 188줄)는 **숫자로는 틀렸다** — 재보고 알았다.
//    ⚠️ 다만 「들어간다」와 「보기 좋다」는 다른 말이다 → 미감은 창업자가 판정한다(규칙 11).
const NAV_MODE = (() => { try { return localStorage.getItem('hankki:navmode') } catch { return null } })() || 'six'
const DIARY = { key: 'log', label: '일기', icon: 'diary' }
const SIX = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'import', label: '가져오기', icon: 'plus', action: true },
  { key: 'myrecipes', label: '레시피', icon: 'bookmark' },
  DIARY,
  { key: 'shop', label: '장보기', icon: 'cart' },
  { key: 'brag', label: '레꾸자랑', icon: 'share' },
]
// ⭐ 가져오기를 빼는 쪽 — 「일기는 매일, 가져오기는 가끔」이라는 판단.
//    ⚠️ 대신 가져오기는 «홈에 가야» 쓴다(지금은 어느 탭에서든 눌린다). 그 값을 창업자가 판정한다.
const FIVE = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'myrecipes', label: '레시피', icon: 'bookmark' },
  DIARY,
  { key: 'shop', label: '장보기', icon: 'cart' },
  { key: 'brag', label: '레꾸자랑', icon: 'share' },
]
const ITEMS = NAV_MODE === 'fab' ? FIVE : SIX

export default function BottomNav({ active, onChange, onImport }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        if (it.action) {
          return (
            <button
              key={it.key}
              className="nav-item nav-item-import press"
              onClick={onImport}
              aria-label="가져오기"
            >
              <span className="nav-import-circle">
                <Icon name={it.icon} size={22} color="#fff" stroke={2.5} />
              </span>
              <span style={{ color: 'var(--brown)', fontWeight: 700 }}>{it.label}</span>
            </button>
          )
        }
        const on = active === it.key
        return (
          <button
            key={it.key}
            className="nav-item press"
            data-coach={it.key === 'shop' ? 'nav-shop' : it.key === 'brag' ? 'nav-brag' : undefined}
            onClick={() => onChange(it.key)}
            aria-current={on ? 'page' : undefined}
          >
            <Icon
              name={it.icon}
              size={23}
              stroke={on ? 2 : 1.6}
              color={on ? 'var(--brown)' : 'var(--text-sub)'}
            />
            <span style={{ color: on ? 'var(--brown)' : 'var(--text-sub)', fontWeight: on ? 700 : 500 }}>
              {it.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
