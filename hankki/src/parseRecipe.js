// OCR로 읽은 텍스트를 레시피 형태(제목·재료·순서)로 최대한 자동 분리.
// 완벽하진 않지만(사진 품질·폰트에 따라), 잡음은 단어 단위까지 걷어낸다.
import { normalizeNumerals } from './ocrCorrect'

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
    .replace(/[^가-힣a-zA-Z0-9\s.,()/%°~:!+×\-]/g, ' ')
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

// --- 재료 / 만드는 법(순서) 구분 ---
// 재료칸에 조리 문장이 섞이는 게 가장 큰 불편이라, 두 신호로 '순서 문장'을 가려낸다.
//  1) 조리 동작(활용형) — "볶고/넣어/끓인" 등. 재료명("김치볶음밥")엔 활용형이 없어 안 걸린다.
//  2) 평서형 종결 — "볶는다·끓인다·푼다·하세요·넣어요" 등.
const STEP_VERB =
  /(넣|볶|끓|섞|부어|붓|풀|푼|구우|구워|굽|익히|익혀|튀기|튀겨|삶|데치|데쳐|재우|재워|올려|얹|뿌려|졸이|졸여|우려|뒤집|비벼|담아|따라|헹궈|헹구|불려|불리|절이|절여|조리|조려|볶아|볶고|끓여|썰어|썰고|다지|다져|버무|무쳐|무친|저어|저으|짜서|갈아|갈아서|말아|말고)/
// 평서형·존댓말 문장 종결 (재료명이 우연히 걸리지 않게 길이로 보강)
const SENT_END = /(다|요|라|자|죠|함|셈|봐)[.!~)"'\s]*$|[.!…]["')\]]*\s*$/
// 수량·분량을 나타내는 표현 — 숫자가 없어도 재료로 본다("소금 약간", "애호박 반개")
const AMOUNT =
  /(\d|½|⅓|⅔|¼|¾|반\s?개|반\s?컵|반\s?쪽|약간|조금|적당량|적당히|넉넉|한\s?줌|두\s?줌|한\s?꼬집|한\s?스푼|톨|줌|꼬집)/

// 이 줄이 '만드는 법(순서)' 문장인가?
function looksLikeStep(l) {
  if (STEP.test(l)) return true // "1. …", "①…", "step 1"
  const hasVerb = STEP_VERB.test(l)
  const ends = SENT_END.test(l)
  if (l.length >= 8 && hasVerb && ends) return true // 짧은 조리 문장 ("밥을 넣고 볶는다")
  if (l.length >= 16 && (hasVerb || ends)) return true // 긴 설명 문장
  return false
}

// 이 줄이 '재료' 항목인가? (분량 표현이 있고, 조리 문장은 아님)
function looksLikeIngredient(l, bullet) {
  if (l.length > 40) return false
  if (QTY.test(l)) return true
  if (bullet && /[가-힣]{2,}/.test(l)) return true
  if (AMOUNT.test(l) && /[가-힣]{2,}/.test(l)) return true
  return false
}

export function parseRecipeText(raw = '', opts = {}) {
  const { fromOcr = false } = opts
  const text = normalizeNumerals(String(raw))
    .replace(/\r/g, '')
    .replace(/(\d)\s*<\s*9/g, '$1kg') // OCR 단골 오독: "1kg" → "1<9"
    .trim()

  // 불릿(* · - 등)으로 시작하는 줄 = 목록 항목(대부분 재료). 지우기 전에 기억해 둔다.
  const items = []
  for (const rawLine of text.split('\n')) {
    const bullet = /^\s*[-*•·▪◦‣●○]\s*/.test(rawLine)
    const l = cleanTokens(sanitize(rawLine.replace(/^\s*[-*•·▪◦‣●○]\s*/, '').replace(/[•·▪◦‣●○*]/g, ' ')))
    if (!l) continue
    // 짧은 섹션 헤더("팁" 1글자 등)는 잡음 필터에서 살려둔다 — 재료/순서 구분의 기준점.
    const isHeader = SEC_ING.test(l) || SEC_STEP.test(l) || SEC_MEMO.test(l)
    if (isHeader || (l.length > 1 && !isGibberish(l))) items.push({ l, bullet })
  }

  let title = ''
  const ingredients = []
  const steps = []
  const other = []
  let mode = null // 'ing' | 'step' | 'memo' — 섹션 헤더를 만나면 바뀐다
  let sawStep = false // 순서가 한 번 시작되면, 그 뒤 애매한 줄은 순서로 본다(재료는 보통 앞에)
  let lastWasBulletIng = false // 불릿 재료가 줄바꿈으로 이어지는 경우 합치기 위해

  // 제목이 될 자격 — 온전한 한글 단어(2자+)나 진짜 영어 단어가 있어야 하고,
  // 문장이거나 쉼표·괄호로 끝나는 조각("해 가제 무스,")은 안 된다.
  // 마땅한 제목이 없으면 비워둔다 — 이상한 제목보다 빈 칸이 낫다.
  const looksLikeTitle = (l) =>
    (/[가-힣]{2,}/.test(l) || hasRealLatinWord(l, 4)) && !SENTENCE_END.test(l) && !/[,;:)\]}]$/.test(l)

  const pushStep = (l) => { steps.push(STEP.test(l) ? l.replace(STEP, '').trim() : l); sawStep = true; lastWasBulletIng = false }
  const pushIng = (l, bullet) => { ingredients.push(l); lastWasBulletIng = bullet; }

  for (const { l, bullet } of items) {
    // 섹션 헤더(짧은 줄) — 어느 칸에 담을지 힌트. "[재료]", "◆ 만드는 법" 등 장식도 허용.
    if (l.length <= 16) {
      if (SEC_ING.test(l)) { mode = 'ing'; lastWasBulletIng = false; continue }
      if (SEC_STEP.test(l)) { mode = 'step'; sawStep = true; lastWasBulletIng = false; continue }
      if (SEC_MEMO.test(l)) { mode = 'memo'; lastWasBulletIng = false; continue }
    }
    if (NOISE.test(l) || NOISE_ANY.test(l)) continue

    const stepLike = looksLikeStep(l)
    const ingLike = !stepLike && looksLikeIngredient(l, bullet)

    // 제목 — 조리 문장·수량 줄은 제목이 아니다
    if (!title && !bullet && !stepLike && l.length <= 22 && !QTY.test(l) && looksLikeTitle(l)) {
      title = l
      continue
    }

    // 불릿 재료 설명이 다음 줄로 이어진 경우 — 앞 재료에 붙인다
    if (lastWasBulletIng && !bullet && !stepLike && l.length <= 60 && /[가-힣]{2,}/.test(l) && mode !== 'step') {
      ingredients[ingredients.length - 1] += ' ' + l
      continue
    }

    // 1) 팁·메모 섹션에 들어섰으면 그 뒤는 전부 메모 (조리 문장처럼 보여도 팁으로)
    if (mode === 'memo') { if (l.length >= 6) other.push(l); lastWasBulletIng = false; continue }
    // 2) 명백한 조리 문장 → 순서 (섹션 헤더가 없어도 우선 분리)
    if (stepLike) { pushStep(l); continue }
    // 3) 재료다움 → 재료 (재료 섹션이거나, 아직 순서가 시작 전이면)
    if (ingLike && (mode === 'ing' || mode === null || !sawStep)) { pushIng(l, bullet); continue }
    // 4) 순서가 이미 시작됐으면, 남는 줄은 순서의 연속으로 본다("5분간 그대로 둔다" 등)
    if (sawStep && mode !== 'ing' && l.length >= 5) { pushStep(l); continue }
    // 5) 그 밖의 긴 줄은 순서, 수량 줄은 재료, 나머지는 메모 후보
    if (l.length >= 20) { pushStep(l); continue }
    if (QTY.test(l)) { pushIng(l, bullet); continue }
    other.push(l)
    lastWasBulletIng = false
  }

  // 메모: 분류 안 된 줄만. 사진 인식(fromOcr)에서 온 텍스트는 깨진 조각이 섞이기
  // 쉬우니 '깨끗한 문장'만 남긴다 — 재료·순서와 중복되거나 잡음이 붙는 일 없게.
  const memoLines = fromOcr ? other.filter(isCleanMemoLine) : other
  const memo = memoLines.join('\n')
  return { title, ingredients, steps, memo }
}
