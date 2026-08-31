// 재료 문자열에서 앞쪽 수량을 찾아 인분 배율만큼 곱해준다.
// 예) "스파게티 면 160g" × 2  →  "스파게티 면 320g"
//     "마늘 1/2쪽" × 4        →  "마늘 2쪽"
//     "대파 2~3대" × 2        →  "대파 4~6대"
const UNI_FRAC = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5' }

function parseNum(t) {
  const s = t.replace(/\s/g, '')
  if (s.includes('/')) {
    const [a, b] = s.split('/').map((x) => parseFloat(x))
    return b ? a / b : a
  }
  return parseFloat(s)
}

function fmtNum(n) {
  const r = Math.round(n * 100) / 100
  if (Math.abs(r - Math.round(r)) < 0.02) return String(Math.round(r))
  const whole = Math.floor(r)
  const frac = r - whole
  const common = [[0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']]
  for (const [v, g] of common) {
    if (Math.abs(frac - v) < 0.04) return (whole ? whole : '') + g
  }
  return String(r)
}

export function scaleIngredient(str, ratio) {
  if (!ratio || Math.abs(ratio - 1) < 0.001) return str
  const s = String(str).replace(/[½⅓⅔¼¾⅕⅖]/g, (m) => UNI_FRAC[m] || m)
  const numRe = /(\d+\s*\/\s*\d+|\d+(?:\.\d+)?)(\s*[~\-]\s*(\d+\s*\/\s*\d+|\d+(?:\.\d+)?))?/
  const m = s.match(numRe)
  if (!m) return str
  const first = parseNum(m[1])
  let replaced
  if (m[3]) {
    const second = parseNum(m[3])
    replaced = `${fmtNum(first * ratio)}~${fmtNum(second * ratio)}`
  } else {
    replaced = fmtNum(first * ratio)
  }
  return s.slice(0, m.index) + replaced + s.slice(m.index + m[0].length)
}
