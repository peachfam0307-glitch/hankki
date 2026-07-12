// 요리 친구 — 요리 모드에서 은은하게 움직이는 냄비·팬.
// 단계 문구를 보고 알맞은 모습을 고른다: 끓이기(김 나는 냄비) / 볶기(들썩이는 팬) / 기본(김 나는 그릇).
// 시선을 뺏지 않도록 작고 느리게. 애니메이션은 styles.css 의 buddy-* 키프레임.

function Steam({ x, cls }) {
  return (
    <path
      className={`steam ${cls}`}
      d={`M${x} 16c-1.4-2-1.4-3.6 0-5.4 1.3-1.7 1.3-3.4 0-5`}
      stroke="#cdd3ce"
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
    />
  )
}

function Pot() {
  return (
    <svg viewBox="0 0 72 52" width="86" height="62" className="buddy-pot" aria-hidden="true">
      <Steam x={28} cls="s1" />
      <Steam x={37} cls="s2" />
      <Steam x={46} cls="s3" />
      {/* 뚜껑 */}
      <g className="lid">
        <rect x="16" y="22" width="42" height="6" rx="3" fill="#b98a4e" />
        <rect x="33" y="17" width="8" height="5" rx="2.5" fill="#a5723f" />
      </g>
      {/* 몸통 */}
      <path d="M18 28h38v12a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill="#c9b892" />
      <path d="M12 30h6v5h-6zM56 30h6v5h-6z" rx="2" fill="#c9b892" />
      <path d="M18 34h38" stroke="#b3a17a" strokeWidth="1.6" />
    </svg>
  )
}

function Pan() {
  return (
    <svg viewBox="0 0 84 52" width="98" height="61" aria-hidden="true">
      <g className="buddy-pan">
        {/* 재료 조각들 — 콩콩 튀는 */}
        <circle className="bit b1" cx="30" cy="26" r="3.4" fill="#8fa96a" />
        <circle className="bit b2" cx="40" cy="24" r="3" fill="#e0a83a" />
        <circle className="bit b3" cx="49" cy="26.5" r="3.2" fill="#c2703f" />
        {/* 팬 */}
        <path d="M16 30h48c0 7-6 12-14 12H30c-8 0-14-5-14-12z" fill="#4e463c" />
        <ellipse cx="40" cy="30" rx="24" ry="4.4" fill="#655a4c" />
        <rect x="62" y="27" width="20" height="5" rx="2.5" fill="#a5723f" />
      </g>
    </svg>
  )
}

export default function CookBuddy({ stepText = '' }) {
  const s = String(stepText)
  const kind = /볶|튀기|굽|부치|지지/.test(s) ? 'pan' : 'pot'
  return <div className="buddy">{kind === 'pan' ? <Pan /> : <Pot />}</div>
}
