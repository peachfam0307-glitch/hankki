import Icon from './Icon'

// 검색 탭은 뺐다 — 홈 상단 검색창이 검색 화면으로 바로 데려가 준다.
// 그 자리엔 앱의 핵심 동작인 '가져오기'를 넣고, 채운 원으로 눈에 띄게 강조한다.
// '일지' 탭은 레시피 탭(요리 기록 세그먼트)으로 합쳤다 — 레시피와 기록이 한 곳에.
// '설정'은 하단 탭에서 뺐다 — 홈 상단 톱니(예전 Inbox 자리)가 설정으로 감. 그 자리에 바이럴 핵심인 '레꾸자랑'을 넣는다.
// 이름 '레꾸자랑' = 내가 꾸민 표지(레꾸=레시피 꾸미기, 브랜드 단어) 자랑. 탭 주인공이 꾸민 표지라 카드자랑→레꾸자랑(창업자 확정).
// 📔 「한끼 일기」를 하단바에 (창업자 2026-08-07
//    *"맨 아래 바에 한끼일기도 넣자. 일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*)
//
// ✅ **여섯으로 확정** (창업자 2026-08-07 *"여섯개 다 넣자"* — 두 안을 실물로 견주고 고른 것)
//    · 후보 A = 여섯 (가져오기 그대로 ＋ 일기)      ← 채택
//    · 후보 B = 다섯 (가져오기를 홈으로 빼고 일기)   ← 탈락
//
// ⭐ 왜 여섯인가 —
//   ⑴ **「가져오기」를 어느 탭에서든 누를 수 있는 값이 크다.** 레시피가 없으면 우리 앱은 아무것도 못 한다.
//      B 안이면 홈으로 갔다 와야 한다(홈 맨 위에 「＋ 가져오기」가 있긴 하다).
//   ⑵ 📏 실측(`_measure-하단바.mjs`) — 여섯이어도 «들어간다»:
//      한 칸 320px폰 64→53.3 · 360px 72→60 · 412px 82→68.7
//      제일 긴 글자 「가져오기」 42px → 제일 좁은 폰에서도 11.3px 남는다(손가락 최소 44px 도 넘는다)
//   ⑶ 여섯인데 **「5＋1」로 읽힌다** — 가져오기만 파란 원이라 눈이 그것을 따로 센다.
//
// ⛔ 문서의 *"하단 탭 5개가 이미 꽉 찼고"*(`docs/리텐션-설계원칙-2026-07-30.md` 188줄)는
//    **숫자로는 틀렸다** — 재보고 알았다. 그 줄을 근거로 새 탭을 막지 말 것.
// ⛔⛔ **다만 일곱은 안 된다** — 45.7px 이라 손가락 최소 44px 에 아슬아슬하다.
//    다음에 탭을 더 넣고 싶으면 «무엇과 바꿀지»를 먼저 정한다.
const ITEMS = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'import', label: '가져오기', icon: 'plus', action: true },
  { key: 'myrecipes', label: '레시피', icon: 'bookmark' },
  // 📔 「한끼 일기」 (창업자 *"일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*)
  //    ⭐ 새 화면이 아니다 — 레시피 화면을 `initView='log'` 로 열 뿐이다(달력·목록이 거기 있다).
  { key: 'log', label: '일기', icon: 'diary' },
  { key: 'shop', label: '장보기', icon: 'cart' },
  { key: 'brag', label: '레꾸자랑', icon: 'share' },
]

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
