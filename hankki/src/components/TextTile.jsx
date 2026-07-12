// '글자 아이콘' — 이름을 그대로 예쁜 타일로. (고추장·간장처럼 이름만 쳐도 썸네일이 됨)
export default function TextTile({ text = '', size = 46, radius = 12 }) {
  const t = String(text).trim() || '재료'
  const len = [...t].length
  const fs = len <= 2 ? size * 0.4 : len === 3 ? size * 0.3 : len <= 5 ? size * 0.235 : size * 0.2
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg,#efe9dd,#e4d6bd)',
        color: '#6b4f3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1.02,
        fontSize: fs,
        padding: 3,
        wordBreak: 'keep-all',
        overflow: 'hidden',
        flex: '0 0 auto',
      }}
    >
      {t.length > 7 ? t.slice(0, 6) + '…' : t}
    </div>
  )
}
