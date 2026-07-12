// '글자 아이콘' — 이름을 그대로 예쁜 타일로. (고추장·간장처럼 이름만 쳐도 썸네일이 됨)
// SVG textLength 로 타일 폭에 맞춰 글자가 자동으로 줄어들어 절대 넘치지 않는다.
export default function TextTile({ text = '', size = 46, radius = 12 }) {
  const t = String(text).trim() || '재료'
  const chars = [...t]
  const shown = chars.length > 7 ? chars.slice(0, 6).join('') + '…' : t
  const n = [...shown].length
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg,#edeee9,#dfe2da)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      <svg viewBox="0 0 48 48" width="80%" height="80%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        <text
          x="24"
          y="25"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Pretendard, sans-serif"
          fontWeight="800"
          fill="#5f5a50"
          fontSize="18"
          letterSpacing={n <= 2 ? '-0.5' : '-1'}
          textLength={Math.min(46, n * 11)}
          lengthAdjust="spacingAndGlyphs"
        >
          {shown}
        </text>
      </svg>
    </div>
  )
}
