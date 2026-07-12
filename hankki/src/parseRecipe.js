// OCR로 읽은 텍스트를 레시피 형태(제목·재료·순서)로 최대한 자동 분리.
// 완벽하진 않지만(사진 품질·폰트에 따라), 원문 전체는 메모에 보존해 무엇도 잃지 않는다.

const QTY =
  /(\d+\s*(g|kg|ml|l|리터|cc|개|알|쪽|봉지|봉|모|장|대|톨|줄기|컵|큰\s?술|작은\s?술|스푼|티스푼|숟가락|줌|꼬집|줄|캔|팩|조각|인분|마리|공기|스틱|T\b|t\b)|약간|조금|적당량|한\s?줌|소량)/i
const STEP = /^(\d{1,2}\s*[.)]|[①-⑳❶-❿]|step\s*\d+|스텝\s*\d+|순서\s*\d+)/i
const NOISE =
  /^(재료\s*[:：]?$|ingredients?\s*[:：]?$|만드는\s*법|조리\s*순서|조리법|레시피\b|recipe\b|요리\b|tip\b|팁\b|instagram|youtube|www\.|https?:)/i

export function parseRecipeText(raw = '') {
  const text = String(raw)
    .replace(/\r/g, '')
    .replace(/[•·▪◦‣●○*]/g, '')
    .trim()

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.length > 1)

  let title = ''
  const ingredients = []
  const steps = []

  for (const l of lines) {
    if (NOISE.test(l)) continue
    // 제목: 맨 처음 나오는 짧고 수량/번호 없는 줄
    if (!title && l.length <= 22 && !QTY.test(l) && !STEP.test(l)) {
      title = l
      continue
    }
    if (STEP.test(l) || l.length >= 22) {
      steps.push(l.replace(STEP, '').trim())
    } else if (QTY.test(l)) {
      ingredients.push(l)
    }
  }

  return { title, ingredients, steps, memo: text }
}
