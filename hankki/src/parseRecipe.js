// OCR로 읽은 텍스트를 레시피 형태(제목·재료·순서)로 최대한 자동 분리.
// 완벽하진 않지만(사진 품질·폰트에 따라), 분류 안 된 줄만 메모로 남긴다.

const QTY =
  /(\d+\s*(g|kg|ml|l|리터|cc|개|알|쪽|봉지|봉|모|장|대|톨|줄기|컵|큰\s?술|작은\s?술|스푼|티스푼|숟가락|줌|꼬집|줄|캔|팩|조각|인분|마리|공기|스틱|T\b|t\b)|약간|조금|적당량|한\s?줌|소량)/i
const STEP = /^(\d{1,2}\s*[.)]|[①-⑳❶-❿]|step\s*\d+|스텝\s*\d+|순서\s*\d+)/i
const NOISE =
  /^(재료\s*[:：]?$|ingredients?\s*[:：]?$|만드는\s*법|조리\s*순서|조리법|레시피\b|recipe\b|요리\b|tip\b|팁\b|instagram|youtube|www\.|https?:|좋아요|댓글|팔로우|공유|저장|더\s?보기|답글)/i

// OCR 잡음(외계어) 거르기 — 뜻있는 글자(한글·영문·숫자) 비율이 낮으면 버린다.
function isGibberish(s) {
  const compact = s.replace(/\s/g, '')
  if (compact.length < 2) return true
  const good = (compact.match(/[가-힣a-zA-Z0-9]/g) || []).length
  if (good / compact.length < 0.55) return true // 절반 이상이 이상한 기호면 잡음
  if (!/[가-힣a-zA-Z]/.test(s) && !QTY.test(s) && compact.length > 3) return true
  // 자모가 홀로 흩어진 경우(ㄱㄴㅇ ㅏㅓ 등)가 많으면 잡음
  const jamo = (compact.match(/[ㄱ-ㅎㅏ-ㅣ]/g) || []).length
  if (jamo / compact.length > 0.3) return true
  return false
}

export function parseRecipeText(raw = '') {
  const text = String(raw)
    .replace(/\r/g, '')
    .replace(/[•·▪◦‣●○*]/g, '')
    .trim()

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.length > 1 && !isGibberish(l))

  let title = ''
  const ingredients = []
  const steps = []
  const other = []

  for (const l of lines) {
    if (NOISE.test(l)) continue
    if (!title && l.length <= 22 && !QTY.test(l) && !STEP.test(l)) {
      title = l
      continue
    }
    if (STEP.test(l) || l.length >= 22) {
      steps.push(l.replace(STEP, '').trim())
    } else if (QTY.test(l)) {
      ingredients.push(l)
    } else {
      other.push(l) // 재료·순서로 분류되지 않은 줄만
    }
  }

  // 메모는 '분류 안 된 줄'만 — 재료·순서와 중복되지 않게.
  const memo = other.join('\n')
  return { title, ingredients, steps, memo }
}
