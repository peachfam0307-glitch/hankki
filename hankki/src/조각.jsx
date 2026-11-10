// 📏 화면 조각 — «열 때» 받는 화면(lazy) ＋ 두 가지 안전장치 (docs/앱본체-크기벽-설계-2026-11-10.md)
//   ① 받는 동안 = 빈 화면 대신 «불러오는 중» 한 줄(첫 방문·서비스워커 설치 전에만 보인다)
//   ② 못 받음 = 앱을 켜 둔 채 새 판이 나가 옛 조각 이름이 사라진 경우 → «한 번만» 새로고침
//      ⛔ 두 번은 안 한다(오프라인이면 무한 새로고침이 된다) → 그땐 「다시 시도」 단추
import { lazy, Suspense, Component } from 'react'

const 새로고침표 = 'hankki:chunk-reload'
const 기다림 = <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sand)', fontSize: 15 }}>불러오는 중…</div>

class 조각막이 extends Component {
  constructor(p) { super(p); this.state = { 실패: false } }
  static getDerivedStateFromError() { return { 실패: true } }
  componentDidCatch(err) {
    const 조각실패 = /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(String(err?.message || err))
    if (!조각실패) throw err
    try {
      if (!sessionStorage.getItem(새로고침표)) { sessionStorage.setItem(새로고침표, '1'); location.reload() }
    } catch { /* 저장 못 하면 새로고침도 안 한다(무한 방지) */ }
  }
  render() {
    if (!this.state.실패) return this.props.children
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)', fontSize: 15 }}>
        화면을 못 불러왔어요 · 인터넷을 확인해 주세요
        <div><button className="press" style={{ marginTop: 14, padding: '10px 18px', borderRadius: 12, background: 'var(--cream)', fontWeight: 700 }}
          onClick={() => { try { sessionStorage.removeItem(새로고침표) } catch { /* noop */ } location.reload() }}>다시 시도</button></div>
      </div>
    )
  }
}

export function 조각(불러오기) {
  const L = lazy(() => 불러오기().then((m) => { try { sessionStorage.removeItem(새로고침표) } catch { /* noop */ } return m }))
  return function 조각화면(props) {
    return <조각막이><Suspense fallback={기다림}><L {...props} /></Suspense></조각막이>
  }
}
