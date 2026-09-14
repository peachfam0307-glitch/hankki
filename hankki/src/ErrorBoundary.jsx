import React from 'react'

// 🛟 앱이 통째로 하얘지는 걸 막는 마지막 안전망.
//
// 왜 있나 (2026-08-03 · 창업자 제보 *"홍콩식가지볶음 지웠더니 먹통됨"*):
//   화면 «한 곳»이 터졌는데 **앱 전체가 빈 화면**이 됐다. 리액트는 에러를 잡아주는 울타리가
//   없으면 트리를 통째로 걷어낸다 — 유저 눈엔 앱이 죽은 것이고, 뭘 눌러도 안 되고,
//   무엇보다 **자기 레시피가 다 날아간 줄 안다.**
//   ⭐ 그날 버그 자체는 고쳤지만, **울타리가 없다는 게 더 큰 문제였다.**
//      다음에 어디가 터져도 똑같이 하얘진다.
//
// ⛔ 여기서 데이터를 지우거나 고치지 않는다 — 레시피는 그대로 있다.
//    화면만 다시 그리면 대개 돌아온다(대부분 「지워진 걸 아직 보고 있는」 상태라서).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }

  static getDerivedStateFromError(err) {
    return { err }
  }

  componentDidCatch(err) {
    // 🔎 무슨 일이었는지 남긴다 — 창업자가 「먹통」이라고만 말해도 우리가 뒤져볼 수 있게.
    //    ⚠️ 어디로도 «전송하지 않는다** (`privacy.html` 약속 · Play 데이터 보안 신고 '수집 안 함').
    try {
      const log = JSON.parse(localStorage.getItem('hankki:lasterror') || 'null')
      localStorage.setItem('hankki:lasterror', JSON.stringify({
        at: new Date().toISOString(),
        msg: String(err && err.message || err).slice(0, 300),
        before: log && log.at,
      }))
    } catch { /* 저장이 꽉 찼어도 화면은 떠야 한다 */ }
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 34px', textAlign: 'center' }}>
        <div style={{ fontSize: 19, fontWeight: 800 }}>화면을 그리다 멈췄어요</div>
        <div className="t-sub" style={{ fontSize: 16.5, lineHeight: 1.65 }}>
          저장한 레시피는 그대로 있어요.<br />아래를 누르면 다시 열려요.
        </div>
        <button
          className="press"
          onClick={() => window.location.reload()}
          style={{ marginTop: 6, padding: '13px 30px', borderRadius: 999, background: 'var(--brown)', color: '#fff', fontSize: 16.5, fontWeight: 800, border: 0 }}
        >
          다시 열기
        </button>
      </div>
    )
  }
}
