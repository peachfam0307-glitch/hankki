// 재료 문자열에서 수량을 찾아 인분 배율만큼 곱해준다.
// 예) "스파게티 면 160g" × 2  →  "스파게티 면 320g"
//     "마늘 1/2쪽" × 4        →  "마늘 2쪽"
//     "대파 2~3대" × 2        →  "대파 4~6대"
//     "아우노슈가 3큰술 (설탕 2큰술)" × 2 → "아우노슈가 6큰술 (설탕 4큰술)"
//
// 🍚🍚 **[2026-09-14 · 창업자 제보] 「괄호 안에 들어간 설탕이나 대체재료는 안 고쳐짐」**
//   🌲 뿌리 = 여기서 `s.match(...)` 로 **줄에서 첫 숫자 하나만** 바꿨다.
//   🔢 실측 = 재료 1029줄 중 **괄호 안에 숫자가 있는 줄 78개(7.6%)**.
//      설탕으로 만드는 사람은 «절반만» 넣는데 화면은 다 바뀐 것처럼 보인다 — 알아챌 방법이 없다.
//   ⛔ 같이 찾은 것 = 「1과1/2큰술」 × 2 가 「2과1/2큰술」이 됐다(「1」만 곱해서). 늘어난 게 아니라 **틀린 값**이다.
//
//   ⭐⭐ **무엇을 «안» 곱하나 — 근거는 `docs/레시피-작성-규격.md` §1 계량 단위 표다.**
//      그 표가 **온도는 「도」 · 시간은 「분」 · 비율은 「1:1」** 로 쓰라고 못 박아 두었다 → 그 셋은 곱하면 안 된다.
//      반대로 **「1컵(200ml)」 처럼 «병기»한 값은 곱해야 맞다** — 같은 표가 그렇게 쓰라고 시킨 것이다.
//   ✅ 그래서 **「곱해도 되는 단위」에 든 것만** 곱한다(막을 것을 세는 게 아니라 허락할 것을 센다).
//      ⛔ 모르는 단위는 **안 건드리고 원문 그대로 둔다** — 조용히 틀린 값보다 원문이 낫다(눈으로 판단할 수 있다).
//   🔒 이 자리를 재는 판 = `scripts/_repro-인분괄호-0914.mjs`
const UNI_FRAC = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5' }

// 🥄 곱해도 되는 단위 — 규격 §1 의 표 그대로(양·무게·부피·덩어리)
//   ⛔ 「인분」은 넣지 않는다 — 인분을 곱하면 인분이 두 번 곱해진다.
//   ⛔ cm·mm·도·분·초·% 도 없다 — 크기·온도·시간·비율은 인분과 무관하다.
const 곱할단위 = '큰술|작은술|술|스푼|컵|공기|g|kg|ml|mL|L|리터|개|쪽|대|알|봉지|봉|마리|줌|조각|장|포기|통|모|캔|팩|병|줄기|송이|토막|덩이|판|줄|방울|꼬집|자밤|주먹'
const 단위앞 = new RegExp(`^\\s*(?:${곱할단위})(?![a-zA-Z가-힣])`)

// 🔢 수 하나의 모양 — 「1과1/2」(혼합수) · 「1/2」(분수) · 「1.5」(소수) · 「3」
const NUM = '\\d+\\s*[과와]\\s*\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d+(?:\\.\\d+)?'

function parseNum(t) {
  const s = t.replace(/\s/g, '')
  // 🍚 「1과1/2」 = 1 + 1/2. ⛔ 이걸 안 보면 「1」만 곱해 틀린 값이 나온다.
  const 혼합 = s.match(/^(\d+)[과와](\d+)\/(\d+)$/)
  if (혼합) {
    const [, w, a, b] = 혼합
    return parseFloat(w) + (parseFloat(b) ? parseFloat(a) / parseFloat(b) : 0)
  }
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
  const re = new RegExp(`(${NUM})(\\s*[~\\-]\\s*(${NUM}))?`, 'g')
  let 첫번째 = true
  let 바뀐것 = 0
  const out = s.replace(re, (whole, a, _범위, b, offset) => {
    const 뒤 = s.slice(offset + whole.length)
    const 앞글자 = offset > 0 ? s[offset - 1] : ''
    // ⛔ 비율(「맥:백합=1:2」)은 인분과 무관하다 — 곱하면 비율 자체가 망가진다
    if (앞글자 === ':' || /^\s*:/.test(뒤)) return whole
    // ⭐ 첫 수량은 «지금까지 하던 대로» 곱한다(단위가 없어도) — 여기를 조이면 이미 되던 줄이 조용히 멈춘다.
    //   그 뒤의 수량은 «곱해도 되는 단위»가 바로 따라올 때만 곱한다.
    const 곱할까 = 첫번째 || 단위앞.test(뒤)
    첫번째 = false
    if (!곱할까) return whole
    바뀐것++
    const first = fmtNum(parseNum(a) * ratio)
    return b ? `${first}~${fmtNum(parseNum(b) * ratio)}` : first
  })
  return 바뀐것 ? out : str
}

// 🏷 재료 «묶음» 표기 — 한 곳에서만 정한다(상세·요리모드가 같은 잣대를 써야 한다).
//   ⓐ `'[양념]'` 처럼 대괄호«만» 있는 줄 = 소제목(헤더). 장보기 담기·인분 환산에서 뺀다.
//   ⓑ `'[양념장] 고추장 1큰술'` 처럼 줄마다 붙은 꼴 = 화면에서 «맨 처음 한 번»만 소제목으로 띄우고 줄에선 뗀다
//      (창업자 확정 2026-09-16 *"제일 처음 한번만"* · ⛔ 데이터는 한 글자도 안 고친다).
//   🔢 [2026-09-18] 요리모드는 이 잣대를 «안 쓰고» 있었다 — 오리지날 떡볶이 재료 준비 화면에 「[양념장]」이 아홉 번 찍혔다
//      (창업자 실물 캡처 · 갤럭시). 그래서 상세 화면에 있던 셋을 여기로 올려 둘이 같은 함수를 쓴다.
export const isIngHeader = (s) => /^\[[^\]]+\]$/.test(String(s).trim())
export const ingGroup = (s) => { const m = /^\[([^\]]+)\]/.exec(String(s).trim()); return m ? m[1] : null }
export const stripIngGroup = (s) => String(s).replace(/^\s*\[[^\]]+\]\s*/, '')
// 소제목을 띄울 줄인가 — 헤더 줄이거나, 묶음이 «바로 앞 줄»과 다른 첫 줄
export const ingHeadBefore = (list, i) => {
  const g = ingGroup(list[i]); if (!g || isIngHeader(list[i])) return null
  return g !== (i > 0 ? ingGroup(list[i - 1]) : null) ? g : null
}
