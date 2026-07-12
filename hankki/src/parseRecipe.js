// OCR로 읽은 텍스트를 레시피 형태(제목·재료·순서)로 최대한 자동 분리.
// 완벽하진 않지만(사진 품질·폰트에 따라), 잡음은 단어 단위까지 걷어낸다.

const QTY =
  /(\d+\s*(g|kg|ml|l|리터|cc|개|알|쪽|봉지|봉|모|장|대|톨|줄기|컵|큰\s?술|작은\s?술|스푼|티스푼|숟가락|줌|꼬집|줄|캔|팩|조각|인분|마리|공기|스틱|바퀴|T\b|t\b)|약간|조금|적당량|한\s?줌|소량)/i
const STEP = /^(\d{1,2}\s*[.)]|[①-⑳❶-❿]|step\s*\d+|스텝\s*\d+|순서\s*\d+)/i
const NOISE =
  /^(ingredients?\s*[:：]?$|recipe\b|요리\b|tip\b|instagram|youtube|www\.|https?:|좋아요|댓글|팔로우|공유|저장|더\s?보기|답글)/i
// 줄 어디에 있어도 잡음인 것 — SNS UI 텍스트(댓글 입력창 등)
const NOISE_ANY = /(님에게\s*댓글|댓글\s*달기|reels|릴스|shorts|구독|알림\s*설정)/i

// 섹션 헤더 — 캡션이 "재료 → 양념 → 팁" 구조로 온 걸 알아채면 분류가 훨씬 정확해진다.
const SEC_ING = /^(재료|양념|소스|양념장|재료\s*준비|필요한\s*재료)/
const SEC_STEP = /^(만드는\s*법|만들기|만드는\s*방법|조리\s*순서|조리법|레시피|순서)/
const SEC_MEMO = /(팁|포인트|tip)/i

// 요리 단위로 흔한 영문 약어 — 토큰 청소에서 살려둔다.
const UNIT_TOKENS = new Set(['g', 'kg', 'ml', 'l', 'L', 'cc', 't', 'T', 'ts', 'tsp', 'tbsp', 'oz'])

// 특수문자·기호(외계어의 원인)를 제거 — 완성형 한글·영문·숫자 + 요리에 흔한 문장부호만 남긴다.
function sanitize(s) {
  return String(s)
    .replace(/[^가-힣a-zA-Z0-9\s.,()/%°~:!+\-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// 모음이 든 진짜 영어 단어가 있는지 — OCR 잡음(wWw, qL, eS 등)과 구분하는 기준.
function hasRealLatinWord(s, minLen = 3) {
  const words = String(s).match(/[a-zA-Z]+/g) || []
  return words.some((w) => w.length >= minLen && /[aeiouAEIOU]/.test(w))
}

// 줄 안의 깨진 조각(잡음 토큰)만 걷어낸다 — 낱자 영문, 구두점 조각 등.
// "양파 1개 eS" → "양파 1개"
function cleanTokens(line) {
  return line
    .split(/\s+/)
    .filter((tok) => {
      if (!/[가-힣a-zA-Z0-9]/.test(tok)) return false // 구두점만 남은 조각
      if (/^[a-zA-Z]+$/.test(tok)) {
        // 순수 영문 토큰: 단위이거나, 모음이 든 3자+ 진짜 단어만
        return UNIT_TOKENS.has(tok) || (tok.length >= 3 && /[aeiouAEIOU]/.test(tok))
      }
      return true
    })
    .join(' ')
    .trim()
}

// OCR 잡음(외계어) 줄 거르기 — 뜻있는 글자 비율이 낮거나, 온전한 단어가 하나도 없으면 버린다.
export function isGibberish(s) {
  const compact = s.replace(/\s/g, '')
  if (compact.length < 2) return true
  const good = (compact.match(/[가-힣a-zA-Z0-9]/g) || []).length
  if (good / compact.length < 0.6) return true
  if (!/[가-힣a-zA-Z]/.test(s) && !QTY.test(s) && compact.length > 3) return true
  // 온전한 한글 단어(2자+)도, 숫자도, 진짜 영어 단어도 없으면 잡음 (예: "wWw qL")
  if (compact.length > 3 && !/[가-힣]{2}/.test(compact) && !/\d/.test(compact) && !hasRealLatinWord(s)) return true
  return false
}

// 사용자가 직접 쓴 티가 나는 줄 — 이모지·기호(🔥★♥)나 온전한 한글 단어가 있으면
// 잡음 검사를 건너뛴다. (isGibberish 는 이모지를 '나쁜 글자'로 세기 때문)
const USER_SAFE = /[☀-➿⭐❤\u{1F000}-\u{1FAFF}]|[가-힣]{2}/u

// 메모 최종 청소 — 재료·순서와 겹치는 줄, 잡음 줄을 걷어낸다.
// 어떤 경로(OCR·공유·직접 입력)로 만들어진 메모든 저장·표시 전에 한 번 거르는 안전망.
// 짧은 줄(4자 미만)과 이모지·한글 문장은 사용자가 쓴 것일 수 있어 보존한다.
export function cleanMemo(memo, ingredients = [], steps = []) {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim()
  const taken = new Set([...ingredients, ...steps].map(norm))
  return String(memo || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false
      if (taken.has(norm(l))) return false
      const compact = l.replace(/\s/g, '')
      if (compact.length < 4) return true
      if (USER_SAFE.test(l)) return true
      return !isGibberish(l)
    })
    .join('\n')
}

// 사진(OCR)에서 온 텍스트의 메모 후보 — '깨끗한 문장'만 통과.
// 분류 안 된 찌꺼기가 메모에 흘러들지 않게 하는 마지막 관문.
export function isCleanMemoLine(s) {
  const compact = s.replace(/\s/g, '')
  if (compact.length < 9) return false // 진짜 팁은 문장 — 짧은 조각은 잡음
  const good = (compact.match(/[가-힣a-zA-Z0-9.,!?()%~:]/g) || []).length
  if (good / compact.length < 0.9) return false
  return /[가-힣]{2,}/.test(s) || hasRealLatinWord(s, 4)
}

// 문장으로 끝나는 줄은 제목이 아니다 ("추가해 총 사용했습니다" 같은 조각 방지)
// 니다(오독 포함)·~요 계열 어미, 또는 마침표·느낌표로 끝나면 문장으로 본다.
const SENTENCE_END = /(니다|세요|어요|해요|져요|까요|네요|든요|께요|답니다)\s*[.!)~"']*\s*$|[.!…]["')\]]*\s*$/

export function parseRecipeText(raw = '', opts = {}) {
  const { fromOcr = false } = opts
  const text = String(raw)
    .replace(/\r/g, '')
    .replace(/(\d)\s*<\s*9/g, '$1kg') // OCR 단골 오독: "1kg" → "1<9"
    .trim()

  // 불릿(* · - 등)으로 시작하는 줄 = 목록 항목(대부분 재료). 지우기 전에 기억해 둔다.
  const items = []
  for (const rawLine of text.split('\n')) {
    const bullet = /^\s*[-*•·▪◦‣●○]\s*/.test(rawLine)
    const l = cleanTokens(sanitize(rawLine.replace(/^\s*[-*•·▪◦‣●○]\s*/, '').replace(/[•·▪◦‣●○*]/g, ' ')))
    if (l && l.length > 1 && !isGibberish(l)) items.push({ l, bullet })
  }

  let title = ''
  const ingredients = []
  const steps = []
  const other = []
  let mode = null // 'ing' | 'step' | 'memo' — 섹션 헤더를 만나면 바뀐다
  let lastWasBulletIng = false // 불릿 재료가 줄바꿈으로 이어지는 경우 합치기 위해

  // 제목이 될 자격 — 온전한 한글 단어(2자+)나 진짜 영어 단어가 있어야 하고,
  // 문장이거나 쉼표·괄호로 끝나는 조각("해 가제 무스,")은 안 된다.
  // 마땅한 제목이 없으면 비워둔다 — 이상한 제목보다 빈 칸이 낫다.
  const looksLikeTitle = (l) =>
    (/[가-힣]{2,}/.test(l) || hasRealLatinWord(l, 4)) && !SENTENCE_END.test(l) && !/[,;:)\]}]$/.test(l)

  for (const { l, bullet } of items) {
    // 섹션 헤더(짧은 줄) — 어느 칸에 담을지 힌트
    if (l.length <= 14) {
      if (SEC_ING.test(l)) { mode = 'ing'; lastWasBulletIng = false; continue }
      if (SEC_STEP.test(l)) { mode = 'step'; lastWasBulletIng = false; continue }
      if (SEC_MEMO.test(l)) { mode = 'memo'; lastWasBulletIng = false; continue }
    }
    if (NOISE.test(l) || NOISE_ANY.test(l)) continue

    if (!title && !bullet && l.length <= 22 && !QTY.test(l) && !STEP.test(l) && looksLikeTitle(l)) {
      title = l
      continue
    }

    if (STEP.test(l)) {
      steps.push(l.replace(STEP, '').trim())
      lastWasBulletIng = false
    } else if (bullet && mode !== 'step' && l.length <= 80 && (QTY.test(l) || /[가-힣]{2,}/.test(l))) {
      ingredients.push(l) // 불릿 항목 = 재료 ("* 대패삼겹살 1kg (…)", "* 양파, 대파 등…")
      lastWasBulletIng = true
    } else if (lastWasBulletIng && !bullet && l.length <= 60 && /[가-힣]{2,}/.test(l) && mode !== 'step') {
      // 긴 재료 설명이 다음 줄로 넘어간 경우 — 앞 재료에 이어붙인다
      ingredients[ingredients.length - 1] += ' ' + l
    } else if (mode === 'ing' && QTY.test(l)) {
      ingredients.push(l)
      lastWasBulletIng = false
    } else if (mode === 'ing' && l.length <= 45 && /[가-힣]{2,}/.test(l) && !SENTENCE_END.test(l)) {
      ingredients.push(l)
      lastWasBulletIng = false
    } else if (mode === 'memo' && l.length >= 8) {
      other.push(l) // 팁 섹션의 문장은 메모로
      lastWasBulletIng = false
    } else if (l.length >= 22) {
      steps.push(l)
      lastWasBulletIng = false
    } else if (QTY.test(l)) {
      ingredients.push(l)
      lastWasBulletIng = false
    } else {
      other.push(l) // 재료·순서로 분류되지 않은 줄만
      lastWasBulletIng = false
    }
  }

  // 메모: 분류 안 된 줄만. 사진 인식(fromOcr)에서 온 텍스트는 깨진 조각이 섞이기
  // 쉬우니 '깨끗한 문장'만 남긴다 — 재료·순서와 중복되거나 잡음이 붙는 일 없게.
  const memoLines = fromOcr ? other.filter(isCleanMemoLine) : other
  const memo = memoLines.join('\n')
  return { title, ingredients, steps, memo }
}
