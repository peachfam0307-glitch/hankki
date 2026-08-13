// OCR로 읽은 텍스트를 레시피 형태(제목·재료·순서)로 최대한 자동 분리.
// 완벽하진 않지만(사진 품질·폰트에 따라), 잡음은 단어 단위까지 걷어낸다.
import { normalizeNumerals } from './ocrCorrect.js'
import { politeSteps } from './polish.js'

const QTY =
  /(\d+\s*(g|kg|ml|l|리터|cc|개|알|쪽|봉지|봉|모|장|대|톨|줄기|컵|큰\s?술|작은\s?술|스푼|티스푼|숟가락|줌|꼬집|줄|캔|팩|조각|인분|마리|공기|스틱|바퀴|T\b|t\b)|약간|조금|적당량|한\s?줌|소량)/i
const STEP = /^(\d{1,2}\s*[.)]|[①-⑳❶-❿]|step\s*\d+|스텝\s*\d+|순서\s*\d+)/i
const NOISE =
  /^(ingredients?\s*[:：]?$|recipe\b|요리\b|tip\b|instagram|youtube|www\.|https?:|좋아요|댓글|팔로우|공유|저장|더\s?보기|답글)/i
// 줄 어디에 있어도 잡음인 것 — SNS UI 텍스트(댓글 입력창 등)
const NOISE_ANY = /(님에게\s*댓글|댓글\s*달기|reels|릴스|shorts|구독|알림\s*설정)/i
// 📣 협찬·공동구매 홍보 줄 — 레시피가 아니라 «광고»다. 재료도 순서도 아니니 버린다.
//    2026-08-02 창업자 폰 사고: `티리난지 피렌체 웍 최저가 공구중!` 이 «만드는 법 1번»으로 들어갔다.
//    ⚠️ 좁게 잡는다 — 「공구중·최저가·할인코드」처럼 광고에만 쓰는 말만.
//    「할인」 단독은 안 넣는다(레시피 본문에 나올 일은 없지만 굳이 위험을 만들지 않는다).
const NOISE_AD = /(공구\s*중|공동\s*구매|최저가|할인\s*코드|링크\s*[인is]n\s*bio|프로필\s*링크|협찬|광고\s*문의|판매\s*중)/i
// 👤 인스타 계정명이 붙은 첫 줄 — `emily.at_home 시아버지가…` 처럼 아이디가 앞에 붙는다.
//    ⚠️ 줄을 버리지 않고 «아이디만» 떼어낸다. 뒤에 붙은 게 대개 그 레시피의 «제목»이라서.
// ⚠️ OCR 은 `_` 를 공백으로 읽는다 — `emily.at_home` → `emily.at home`.
//    그래서 «점이나 밑줄이 든 영문 토큰»을 아이디로 보고, 뒤따르는 영문 조각도 한 번 더 떼어낸다.
const IG_HANDLE = /^[a-z0-9]+[._][a-z0-9._]{1,28}(\s+[a-z0-9._]{1,15})?\s+(?=[가-힣📌🍆✨])/i
// 날짜만 있는 줄(캡션 작성일) — 재료·순서 아님. "2025년 3월 11일"(일→익 오독 포함)
const DATE_ONLY = /^\s*\d{4}\s*[년.\-/]\s*\d{1,2}\s*[월.\-/]\s*\d{1,2}\s*[일익]?\.?\s*$|^\s*\d{1,2}\s*월\s*\d{1,2}\s*[일익]\.?\s*$/
// 앱/웹 '더 보기' 류 UI 버튼 글자 — 줄 끝에 붙거나 줄 전체. "…끊인다. 간단히 보기"
const UI_TRAIL = /\s*(?:간단히|간략히|자세히|전체|레시피|원문|더)\s*보기\s*$/
// 조언·팁 신호가 뚜렷한 줄(순서 아님) — 메모로 보낸다. 조리 명령과 겹치지 않게 좁게 잡음.
const TIP_CUE = /(초보자|꿀팁|취향껏|입맛에\s*따라|더\s*맛있|생략\s*가능|없어도\s*(?:돼|되|됩니다)|몸에도?\s*좋|건강에\s*좋|맛있게\s*드세요)/

// 섹션 헤더 — 캡션이 "재료 → 양념 → 팁" 구조로 온 걸 알아채면 분류가 훨씬 정확해진다.
const SEC_ING = /^(재료|양념|소스|양념장|재료\s*준비|필요한\s*재료)/
const SEC_STEP = /^(만드는\s*법|만들기|만드는\s*방법|조리\s*순서|요리\s*순서|조리\s*방법|요리\s*방법|조리법|레시피|순서)/
// ⚠️⚠️ 「레시피 (3-4인분 기준)」은 «분량 안내»지 「만드는 법」 헤더가 아니다.
//    2026-08-02 창업자 폰 사고 — 인스타 캡션 첫머리의 `✨레시피 (3-4인분 기준)✨` 가
//    SEC_STEP 에 걸려 **그 줄부터 순서 구역이 열렸고, 재료 14줄이 통째로 「만드는 법」으로 갔다**
//    (재료 칸엔 「.」 하나만 남았다). 인스타 레시피가 거의 다 이 꼴로 시작한다.
// ⛔ 「레시피」를 SEC_STEP 에서 빼면 진짜 헤더(`레시피` 단독)를 놓친다 → **뒤에 분량이 붙은 것만** 뺀다.
const SEC_STEP_PORTION = /^레시피\s*[(（]?\s*[\d]+\s*[~\-–]?\s*[\d]*\s*(인분|인|人分|기준)/
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

// ── 재료 줄 단위 오독 교정 ──
// OCR이 제일 자주 틀리는 T(큰술)·g(그램): 'T'를 7로, 'g'를 9로 읽는다.
// 재료 줄에서만, 오해 여지가 없는 모양일 때만 되돌린다(문장·날짜는 안 건드림).
const SEASONING =
  /간장|설탕|소금|고추장|된장|쌈장|고춧가루|후춧가루|후추|참기름|들기름|식초|맛술|미림|올리고당|물엿|꿀|굴소스|액젓|참치액|마요네즈|케첩|카레|깨|다진\s*마늘|생강|맛소금|다시다|연두|치킨스톡/
export function fixIngredientUnits(l) {
  let s = String(l)
  // 양념 + 한 자리 수 + 7 로 끝나면 → T (설탕 27 → 2T, 굴소스 1/27 → 1/2T)
  if (SEASONING.test(s)) s = s.replace(/(\d)7(?=\s|$)/g, '$1T')
  // '끝이 0·5인 수 + 9' 로 끝나면 → g (돼지고기 3009 → 300g, 떡 5009 → 500g)
  s = s.replace(/(\d{1,3}[05])9(?=\s|$)/g, '$1g')
  return s
}

// ── 앞머리 OCR 잡음 제거 ──
// 불릿·아이콘을 오독한 조각(삐 · = · HE · Vv · Eel · \/^ · 를 …)이 유효한 한글 재료명
// 앞에 붙어 남는 경우가 많다("삐 선복 1<0", "= 쌀 450", "Vv Eel 토핑용"). 한글/숫자가
// 나오기 전까지의 '기호 덩어리 · 짧은 라틴 조각(단위 제외) · 대표 오독 한 글자'를 벗겨낸다.
const JUNK_SYM = /^[삐쁘=|/\\^<>~"'`_·•*■□▶►◆●○@©®№°§✓✔✅☑√✗✘☒▪▫◾◽◇◈✦✱＊①-⑳❶-❿➀-➉⓪]+/
// 숫자 뒤에 오면 '수량'이라 지우면 안 되는 단위들(번호 불릿과 구분).
const UNIT_AFTER = /^(?:스푼|큰술|작은술|티스푼|컵|공기|개|알|장|줌|톨|쪽|봉|캔|팩|모|줄|덩이|리터|ml|kg|cc|g)/
// 네모/핀 아이콘(■ 📌 ▪)이 오독되는 대표 글자들. tesseract가 매번 다르게 읽어(삐→뽀→뽀삐)
// 1~2글자 조합까지 잡는다. 단, '쌀·깨·꿀·짜장' 같은 진짜 재료는 이 집합에 없어 안전.
const JUNK_SYL = '를르롤삐쁘뽀빠뻐뿌쀼쁠삑뺴쀄삠'
const JUNK_TOK_OCR = new RegExp(`^(?:[${JUNK_SYL}]{1,2}|ㅂ|ㅃ|ㅉ|ㄲ|VE|Vv|EI|W|w)$`)
// 맨 앞에 홀로 올 수 있는 '진짜' 한 글자 재료·수식어 화이트리스트.
// OCR에서는 이 목록에 없는 한 글자가 줄 맨앞+뒤에 내용이 있으면 = 아이콘 오독으로 보고 버린다.
// (아이콘이 어떤 한글로 오독되든 다 걸러짐 — 목록에 없으니까)
const KEEP_1CHAR = new Set('물쌀깨꿀파콩무밥알면술김엿향잣팥쑥굴게차죽국떡묵밀순청홍생달참들표겨젓초씨쌈멸꿩닭소돼양'.split(''))
export function stripLeadingOcrJunk(line, fromOcr = false) {
  let s = String(line).trim()
  s = s.replace(JUNK_SYM, '').trim()
  if (fromOcr) {
    // 맨 앞 이모지(🍆✨🔥 등)와 변형선택자 제거
    s = s.replace(/^(?:[\u{1F000}-\u{1FAFF}☀-➿←-⇿⬀-⯿︀-️‍⃣]+\s*)+/u, '').trim()
    // 체크(✔️)가 한글에 붙어 라틴 조각(V·W 등)으로 오독된 것 제거: "V올리브유" → "올리브유"
    s = s.replace(/^[A-Za-z]{1,2}(?=[가-힣])/, '').trim()
    s = s.replace(JUNK_SYM, '').trim()
  }
  for (let i = 0; i < 3; i++) {
    const m = s.match(/^(\S+)\s+/)
    if (!m) break
    const tok = m[1]
    const rest = s.slice(m[0].length)
    const junk =
      JUNK_SYM.test(tok) ||
      (/^[A-Za-z]{1,3}$/.test(tok) && !/^(ml|g|kg|cc|ea|oz|l)$/i.test(tok)) ||
      (fromOcr && /^[A-Za-z]{4}$/.test(tok)) || // 긴 라틴 조각(AINE 등)도 OCR에선 잡음
      (fromOcr && /^[0OoＯ]$/.test(tok)) ||      // 불릿을 0·O 로 오독
      (fromOcr && /^[1-9]\d?$/.test(tok) && /^[가-힣]/.test(rest) && !UNIT_AFTER.test(rest)) || // 번호 불릿(③→3): 뒤가 단위 아닌 '재료명'이면 잡음
      (fromOcr && JUNK_TOK_OCR.test(tok)) ||
      (fromOcr && /^[가-힣]$/.test(tok) && !KEEP_1CHAR.has(tok)) // 화이트리스트에 없는 맨앞 한 글자 = 아이콘 오독
    if (!junk) break
    s = s.slice(m[0].length).replace(JUNK_SYM, '').trim()
  }
  return s
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
// ⚠️ '푼'은 뺀다 — 제일 흔한 계량단위 '스푼'에 걸려 재료 줄(…3스푼)을 순서로 오분류함.
//    풀다(달걀 푼다)는 '풀어' + 종결어미(~다)로 이미 잡히므로 안전.
const STEP_VERB =
  /(넣|볶|끓|섞|부어|붓|풀|두르|둘러|구우|구워|구운|굽|익히|익혀|튀기|튀겨|삶|데치|데쳐|재우|재워|올려|얹|뿌려|졸이|졸여|우려|뒤집|비벼|담아|따라|헹궈|헹구|불려|불리|절이|절여|조리|조려|볶아|볶고|끓여|썰어|썰고|자르|잘라|다지|다져|버무|무쳐|무친|저어|저으|짜서|갈아|갈아서|말아|말고)/
// 수량·분량을 나타내는 표현 — 숫자가 없어도 재료로 본다("소금 약간", "애호박 반개")
const AMOUNT =
  /(\d|½|⅓|⅔|¼|¾|반\s?개|반\s?컵|반\s?쪽|약간|조금|적당량|적당히|넉넉|한\s?줌|두\s?줌|한\s?꼬집|한\s?스푼|한\s?방울|톨|줌|꼬집|방울)/

// 문장 종결(평서 ~다/~요/~라/~자, 또는 마침표)
const DECLARATIVE = /(다|요|죠|라|자|셈|봐)[.!~)"'\s]*$|[.!…]["')\]]*\s*$/
// 이 줄이 '만드는 법(순서)' 문장인가?
function looksLikeStep(l) {
  if (STEP.test(l)) return true // "1. …", "①…", "step 1"
  const hasVerb = STEP_VERB.test(l)
  const ends = DECLARATIVE.test(l)
  if (hasVerb && ends && l.length >= 6) return true // 짧은 조리 문장 ("밥을 넣고 볶는다")
  if (ends && l.length >= 8) return true // 종결형 문장이면 대체로 순서 ("오이는 어슷썬다")
  if ((hasVerb || ends) && l.length >= 16) return true // 긴 설명 문장
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

// ── 줄바꿈으로 잘린 문장 병합 (분류 전, 원문 줄 단위) ──
// 인스타 캡션 등은 한 문장이 여러 줄로 잘린다("…팬에" / "노릇노릇 굽는다").
// 앞줄이 '이어지는 중'(종결어미·문장부호로 안 끝나거나 괄호 안 닫힘·쉼표로 끝남)이고
// 뒷줄이 새 항목(불릿·번호·헤더)이 아니면 합쳐 원래 문장을 되살린다 → 재료/순서 분류가 정확해짐.
const WRAP_ENDPUNCT = /[.!?…]["'’)\]]*\s*$/
const WRAP_CONNECT = /(에|에서|에게|을|를|와|과|로|으로|의|도|만|고|며|서|여|게|면|지|랑|이랑|보다|처럼|든|거나|아서|어서|아|어)\s*$/
const WRAP_NEWITEM = /^\s*([-*•·▪◦‣●○✅✔☑✓]|[1-9]\d?\s*[.)]|[①-⑳❶-❿]|step\s*\d|스텝\s*\d)/i
// 다음 줄이 "3큰술"처럼 수량으로 시작 = 앞줄 재료(참기름)가 줄바꿈으로 잘린 것 → 이어붙임 신호.
const WRAP_STARTQTY = /^\s*\d+(?:[.,]\d+)?\s*(큰술|작은술|스푼|컵|공기|줌|톨|알|장|개|쪽|봉|모|g|kg|ml|리터|l|T|t|cc|꼬집)/i
function isWrappedOpen(s) {
  const t = String(s).trim()
  if (!t) return false
  if (WRAP_ENDPUNCT.test(t) || SENTENCE_END.test(t)) return false // 문장으로 끝남 → 완결
  const opens = (t.match(/[(（]/g) || []).length
  const closes = (t.match(/[)）]/g) || []).length
  if (opens > closes) return true // 괄호 안 닫힘 → 확실히 이어짐
  if (/,\s*$/.test(t)) return true // 끝이 쉼표 → 목록/문장 계속
  return WRAP_CONNECT.test(t) // 연결어미·조사로 끝남
}
function mergeWrappedLines(lines) {
  const out = []
  for (const raw of lines) {
    const prev = out.length ? out[out.length - 1] : null
    const bare = String(raw).replace(/^\s*[-*•·▪◦‣●○✅✔☑✓]\s*/, '')
    const contQty = WRAP_STARTQTY.test(raw) && !WRAP_ENDPUNCT.test(String(prev || '')) && !SENTENCE_END.test(String(prev || ''))
    if (
      prev != null &&
      (isWrappedOpen(prev) || contQty) &&
      !WRAP_NEWITEM.test(raw) &&
      !SEC_ING.test(bare) &&
      !SEC_STEP.test(bare) &&
      (prev + ' ' + raw).replace(/\s+/g, ' ').length <= 160
    ) {
      out[out.length - 1] = (prev + ' ' + raw).replace(/\s+/g, ' ').trim()
      continue
    }
    out.push(raw)
  }
  return out
}

export function parseRecipeText(raw = '', opts = {}) {
  const { fromOcr = false } = opts
  const text = normalizeNumerals(String(raw))
    .replace(/\r/g, '')
    .replace(/(\d)\s*<\s*9/g, '$1kg') // OCR 단골 오독: "1kg" → "1<9"
    .trim()

  // ⭐ 줄바꿈으로 잘린 문장을 먼저 합친다(인스타 캡션은 한 문장이 여러 줄로 잘림) → 분류 정확도↑
  const rawLines = mergeWrappedLines(text.split('\n'))

  // 불릿(* · - 등)으로 시작하는 줄 = 목록 항목(대부분 재료). 지우기 전에 기억해 둔다.
  const items = []
  for (const rawLine of rawLines) {
    // 불릿: - * • 등 + 체크표시(✔️☑ — 인스타 재료 목록에 흔함). ✅(초록)은 순서/팁에도 써서 제외.
    const bullet = /^\s*[-*•·▪◦‣●○✔☑]\s*/.test(rawLine)
    // 맨 앞 장식 이모지(🍆📌🍷 등) — 첫 줄이면 제목 후보 신호로 쓴다.
    const emojiHead = /^\s*[-*•·▪◦‣●○✅✔☑]*\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}❤]/u.test(rawLine)
    // 번호·동그라미 번호가 붙은 줄인지 원문에서 미리 본다 — sanitize가 ①~⑳을 지워버리기 때문.
    const stepMarked = STEP.test(String(rawLine).replace(/^\s*[-*•·▪◦‣●○✔☑]\s*/, '').trim())
    // 해시태그 줄(#육회 #육회깻잎무침 #묵은지김밥 …)은 재료도 순서도 아님 → 버린다.
    if (/^\s*#\S/.test(rawLine) || (String(rawLine).match(/#[^\s#]+/g) || []).length >= 2) continue
    let l = cleanTokens(sanitize(rawLine.replace(/^\s*[-*•·▪◦‣●○]\s*/, '').replace(/[•·▪◦‣●○*]/g, ' ')))
    l = stripLeadingOcrJunk(l, fromOcr) // 삐/=/HE/Vv Eel 같은 앞머리 잡음 벗기기
    // 👤 첫 줄에만 — 인스타 아이디를 떼면 그 뒤가 대개 «제목»이다(`emily.at_home 홍콩식 가지볶음`).
    //    ⛔줄을 버리지 않는다. 버리면 제목까지 같이 날아간다.
    if (items.length === 0) l = l.replace(IG_HANDLE, '').trim() || l
    l = l.replace(UI_TRAIL, '').trim() // "…끊인다. 간단히 보기" → 뒤 UI 글자 떼기
    if (!l || DATE_ONLY.test(l)) continue // 빈 줄·날짜만 있는 줄(작성일)은 버린다
    // 짧은 섹션 헤더("팁" 1글자 등)는 잡음 필터에서 살려둔다 — 재료/순서 구분의 기준점.
    const isHeader = SEC_ING.test(l) || SEC_STEP.test(l) || SEC_MEMO.test(l)
    if (isHeader || (l.length > 1 && !isGibberish(l))) items.push({ l, bullet, emojiHead, stepMarked })
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
    (/[가-힣]{2,}/.test(l) || hasRealLatinWord(l, 4)) &&
    !SENTENCE_END.test(l) &&
    !/[,;:)\]}]$/.test(l) &&
    !/\d{2,}$/.test(l) && // 숫자 꼬리로 끝나는 건 OCR 잡음("완성588") — 제목 아님
    !/완성|끝\s*$/.test(l) // 마지막 순서의 꼬리("…완성")도 제목이 아니다

  const pushStep = (l) => { steps.push(STEP.test(l) ? l.replace(STEP, '').trim() : l); sawStep = true; lastWasBulletIng = false }
  const pushIng = (l, bullet) => { ingredients.push(l); lastWasBulletIng = bullet; }

  for (let idx = 0; idx < items.length; idx++) {
    const { l, bullet, emojiHead, stepMarked } = items[idx]

    // 첫 줄 제목 — 이모지 붙은 짧은 이름("🍷 양념장")이나 "X 만드는 법/레시피" 배너면 제목으로.
    // 섹션명(양념장)과 겹쳐도 제목을 우선한다. "재료"처럼 신호 없는 헤더는 안 가로챈다.
    // ⚠️ 24자는 「시아버지가 전수해준 홍콩식 가지 볶음」(25자) 같은 실제 인스타 제목을 놓친다 → 32자까지.
    if (idx === 0 && !title && /[가-힣]/.test(l) && l.length <= 32 && !bullet) {
      const core0 = l.replace(/\s*[(（][^()（）]*[)）]\s*$/, '').trim() // 뒤 괄호(300g 기준·2인분) 떼고 판단
      // ⚠️ 낱말 경계를 지킨다 — 예전엔 "소고기 미역국 황금레시피"가 "…황금"으로 잘렸다.
      //    앞에 공백이 있거나 줄 전체일 때만 뗀다("김치찌개 레시피"→"김치찌개", "황금레시피"→그대로).
      const TAIL = /(?:^|\s)(만드는\s*법|만드는\s*방법|만들기|레시피)\s*[!！~]*\s*$/
      const asTitle = core0.replace(TAIL, '').trim() || core0
      const isBanner = TAIL.test(core0)
      // ⭐ 2026-08-02 — 인스타 캡션 첫 줄은 «아이디 + 요리 이름» 인 경우가 제일 흔한데,
      //    이모지도 「만드는 법」 배너도 없으면 제목을 못 잡아 그 줄이 «순서 1번»으로 갔다.
      //    → 신호가 없어도 «분량도 조리 문장도 아닌 짧은 이름»이면 제목으로 본다.
      //    ⚠️ looksLikeStep 으로 거르면 안 된다 — 「가지 볶음」·「제육 볶음」처럼
      //       요리 «이름»에 조리 동사가 들어가는 게 오히려 흔하다. 문장 종결(SENTENCE_END)만 배제하면 충분.
      const plainName = !QTY.test(asTitle) && /[가-힣]{2,}/.test(asTitle) && asTitle.length <= 32
      if ((emojiHead || isBanner || plainName) && !QTY.test(asTitle) && asTitle.length >= 2 && !SENTENCE_END.test(asTitle)) {
        title = asTitle
        continue
      }
    }

    // 섹션 헤더(짧은 줄) — 어느 칸에 담을지 힌트. "[재료]", "◆ 만드는 법" 등 장식도 허용.
    // ⚠️ 번호가 붙었거나(①·1.) 서술형으로 끝나면 헤더가 아니다. 예전엔 "① 양념장 재료를 모두 섞어둔다"가
    //    sanitize에서 ①이 지워진 뒤 '양념장'으로 시작해 헤더로 잡혀 **줄이 통째로 사라졌다**.
    //    STEP_VERB로 거르면 '조리 순서'·'조리법' 같은 진짜 헤더까지 깨진다('조리'가 동사 목록에 있음).
    if (l.length <= 16 && !stepMarked && !DECLARATIVE.test(l)) {
      // 「돼지고기 양념 재료:」 처럼 앞에 수식어가 붙은 재료 헤더도 받는다(끝이 재료/양념).
      if (SEC_ING.test(l) || /(재료|양념)\s*[:：]?$/.test(l)) { mode = 'ing'; lastWasBulletIng = false; continue }
      if (SEC_STEP.test(l) && !SEC_STEP_PORTION.test(l)) { mode = 'step'; sawStep = true; lastWasBulletIng = false; continue }
      if (SEC_MEMO.test(l)) { mode = 'memo'; lastWasBulletIng = false; continue }
    }
    if (NOISE.test(l) || NOISE_ANY.test(l) || NOISE_AD.test(l) || SEC_STEP_PORTION.test(l)) continue
    // 장식용 배너("맛보장 양념 레시피!" 등) — 재료도 순서도 아님.
    // ⚠️ 무조건 버리면 "소고기 미역국 황금레시피" 같은 진짜 요리 이름까지 날아간다(제목이 빈칸이 됨).
    //    제목을 이미 잡았거나, 느낌표·물결이 붙어 배너 티가 날 때만 버린다.
    if ((title || /레시피\s*[!！~]+$/.test(l)) && l.length <= 18 && /레시피\s*[!！~]*$/.test(l) && !QTY.test(l)) continue

    // 끝에 붙은 괄호 코멘트는 분류에서 제외하고 '핵심'으로 판단한다.
    // ("멸치액젓 2스푼 (저는…꿀팁!)"의 핵심은 '멸치액젓 2스푼'=재료 — 괄호가 !로 끝나도 순서 오인 안 함)
    const core = l.replace(/\s*[(（][^()（）]*[)）]\s*$/, '').trim() || l
    const stepLike = looksLikeStep(core)
    const ingLike = !stepLike && looksLikeIngredient(core, bullet)

    // 괄호로 통째 감싼 코멘트 → 메모. (예: "(저는 중불에서 10분…졸여줬어요)")
    if (!ingLike && /^[(（][^()]*[)）]\s*$/.test(l)) {
      other.push(l.replace(/^[(（]\s*|\s*[)）]$/g, '').trim())
      lastWasBulletIng = false
      continue
    }
    // 조언·팁 문구 → 메모. 단, 진짜 계량 재료(QTY)·불릿·조리문장·"이름+숫자"(올리고당2)는 건드리지 않는다.
    // ("15일 숙성시키면 더 맛있으니까"=기간숫자 팁→메모 / "올리고당2 (…더 맛있음)"=재료는 보존)
    if (!stepLike && !bullet && !QTY.test(l) && !/^[가-힣]{2,}\d/.test(l) && TIP_CUE.test(l)) {
      other.push(l)
      lastWasBulletIng = false
      continue
    }

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

    // 0) 줄글형은 재료를 한 줄에 쉼표로 나열한다("스파게티면 200g, 토마토홀 1캔, 마늘 5알, …").
    //    예전엔 통째로 순서에 들어가 재료 칸이 비었다 → 쉼표로 나눠 각각 재료로 담는다.
    //    (조리 문장에도 쉼표는 있으므로 '대부분 조각에 분량이 붙어 있을 때'만)
    if (!stepLike && !sawStep && mode !== 'step') {
      const parts = l.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean)
      const withQty = parts.filter((x) => QTY.test(x) || AMOUNT.test(x)).length
      if (parts.length >= 3 && withQty >= Math.ceil(parts.length * 0.6) && parts.every((x) => x.length <= 24)) {
        parts.forEach((x) => pushIng(x, false))
        continue
      }
    }
    // 1) 팁·메모 섹션에 들어섰으면 그 뒤는 전부 메모 (조리 문장처럼 보여도 팁으로)
    if (mode === 'memo') { if (l.length >= 6) other.push(l); lastWasBulletIng = false; continue }
    // 2) 명백한 조리 문장 → 순서 (섹션 헤더가 없어도 우선 분리)
    if (stepLike) { pushStep(l); continue }
    // 3) 재료다움 → 재료 (재료 섹션이거나, 아직 순서가 시작 전이면)
    if (ingLike && (mode === 'ing' || mode === null || !sawStep)) { pushIng(l, bullet); continue }
    // 3-2) 분량이 안 적힌 재료("다진마늘", "대파")도 재료로 담는다 — 재료를 줄줄이 적던 중이고
    //      아직 순서가 시작 전이며, 서술형이 아닌 순한글 낱말 줄일 때만.
    //      예전엔 메모로 새서 장보기 목록에서 통째로 빠졌다(창업자 2026-07-29 파서 점검).
    if (!stepLike && !sawStep && mode !== 'step' && ingredients.length > 0 &&
        l.length <= 20 && /^[가-힣][가-힣\s]*$/.test(l) && !DECLARATIVE.test(l)) {
      pushIng(l, bullet); continue
    }
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
  // 재료 단위 오독 교정(T·g) + 만드는 법 문체 통일('~다' → '~요')
  return {
    title: cleanTitleTail(title),
    ingredients: dedupeLines(ingredients.map(fixIngredientUnits)),
    steps: dedupeLines(politeSteps(splitParagraphSteps(mergeStepFragments(steps)))),
    memo,
  }
}

// 🔁 같은 줄이 두 번 들어오면 뒤쪽을 지운다.
//   🔢 2026-08-13 실측: 캡처 «2장»으로 삼계탕을 담았더니 만드는 법이 12단계였는데
//      5·6·7 이 8·9·10 에 «통째로» 다시 나왔다. 두 캡처가 겹치는 부분(첫 장 끝 = 둘째 장 시작)이
//      그대로 두 번 들어간 것이다. 창업자 *"인식이 구려"* — 사실 인식은 정확했고 «정리»가 문제였다.
//   ⚠️ 짧은 줄(10자 미만)은 «진짜로» 반복될 수 있다 — 「소금 넣기」·「물 300ml」처럼.
//      그래서 긴 줄만 지운다. 레시피에서 20자짜리 문장이 토씨 하나 안 틀리고 반복될 일은 없다.
//   ⚠️ 견주는 건 «공백을 뺀 글자»다 — 줄바꿈 위치만 달라도 같은 문장이기 때문.
function dedupeLines(arr) {
  const seen = new Set()
  return arr.filter((s) => {
    const key = String(s).replace(/\s+/g, '')
    if (key.length < 10) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 제목 꼬리 정리 — "… 레시피"·"…황금레시피"·"… 만드는 법"은 요리 이름이 아니다.
// 낱말 경계를 지켜 "황금레시피"만 통째로 떼고, 붙여 쓴 다른 말은 건드리지 않는다.
function cleanTitleTail(t) {
  const s = String(t || '').trim()
  if (!s) return s
  const cut = s
    .replace(/\s*황금\s*레시피\s*[!！~]*$/, '')
    .replace(/(?:^|\s)(만드는\s*법|만드는\s*방법|만들기|레시피)\s*[!！~]*$/, '')
    .trim()
  return cut.length >= 2 ? cut : s
}

// 줄글로 쓴 만드는 법("…삶아주세요. 팬에 …졸입니다. …버무리면 끝이에요.")은 한 줄에 여러
// 동작이 들어 있다. 단계가 거의 없고 줄이 길면 문장 단위로 잘라 따라 하기 좋게 나눈다.
function splitParagraphSteps(arr) {
  if (arr.length > 2) return arr
  const out = []
  for (const s of arr) {
    const parts = (String(s).match(/[^.!?…]+[.!?…]*/g) || []).map((x) => x.trim()).filter((x) => x.length >= 4)
    if (String(s).length >= 60 && parts.length >= 2) out.push(...parts)
    else out.push(s)
  }
  return out
}

// 한 동작이 줄바꿈으로 잘려 조각난 순서를 앞 단계에 붙인다.
// 앞 줄이 문장으로 안 끝났는데(=이어지는 중) 다음 줄이 아주 짧은 꼬리면 합친다. ("…딱 1분 30초" + "익혀주세요.")
const STEP_ENDING = /(?:니다|세요|어요|아요|해요|져요|까요|네요|든요|께요|을게요|다|요)\s*[.!)~"']*\s*$|[.!…]["')\]]*\s*$/
// ⛔⛔ 2026-08-05 — **창업자 캡처 세 장 중 «두 장»에서 문장이 반 토막 났다.**
//   ①「…물에 담가 1시간」 / 「동안 불려줍니다.」   → 9단계가 10단계로 늘어났다
//   ②「…다진마늘 (매운 고추 넣으셔도 OK!)」 / 「넣고 맛소금과 설탕, 순후추로 간을 합니다」
//   ③「(간장을 넣으시면 … 해 보세요!」 / 「굴 국물이 … 맛있어요!)」  ← 괄호가 두 줄에 걸쳤다
//
//   뿌리 셋 —
//   ⓐ **7자 제한**: 「동안 불려줍니다.」는 공백 빼고 8자라 «한 글자 차이»로 안 붙었다
//   ⓑ **괄호에 속았다**: 「…OK!)」 로 끝나 문장이 끝난 «것처럼» 보였다(안은 곁말인데)
//   ⓒ **괄호가 두 줄에 걸치면** 열린 채로 끊긴다
const OPENERS = '([{（'
const CLOSERS = ')]}）'
// 괄호가 아직 안 닫혔나 — 닫힐 때까지는 무조건 한 문장이다
function hasOpenBracket(s) {
  let n = 0
  for (const ch of s) { if (OPENERS.includes(ch)) n++; else if (CLOSERS.includes(ch)) n-- }
  return n > 0
}
// 괄호 «안»은 곁말이라 문장의 끝을 판단할 때 빼고 본다
const stripParens = (s) => s.replace(/[([{（][^)\]}）]*[)\]}）]/g, ' ').trim()
// 앞 문장에 «붙는 말»로 시작하면 길이와 상관없이 붙인다 — 홀로 설 수 없는 말들
const GLUE_HEAD = /^(?:동안|후에|후|뒤에|뒤|정도|가량|쯤|까지|부터|만큼|째|간|경|이내|이상|이하|남짓|씩)\b/
// 💬 「조리 지시」가 아니라 «후기·감상»으로 읽히는 줄.
//   ⚠️ 아주 좁게 잡는다 — 넓히면 진짜 단계를 삼킨다. 화자가 나오거나(저희집·남편·애들)
//      경험을 말하는 말끝(~더라구요·잘먹·싫어해)이 있을 때만.
//   ⛔ 여기 걸려도 «지우지 않는다». 앞 단계 뒤에 붙일 뿐이다.
const CHATTY = /^(저희|우리|제|내)\s?집|^(저희|우리|제가|저는|남편|애들|아이들)|더라구요|더라고요|더라구용|잘먹|싫어해|좋아해요|맛있대요/

function mergeStepFragments(arr) {
  const out = []
  for (const s of arr) {
    const prev = out[out.length - 1]
    if (prev) {
      const bare = stripParens(prev) || prev
      const prevOpen = !STEP_ENDING.test(bare)
      const glue = GLUE_HEAD.test(s.trim())
      // 7 → 25자. ⚠️ 앞줄이 «미완성일 때만» 늘렸다 — 멀쩡히 끝난 문장엔 아무것도 안 붙는다.
      const short = s.replace(/\s/g, '').length <= 25
      // 🔢 [2026-08-13] 창업자 캡처에서 나온 두 가지 — 앞 줄이 «멀쩡히 끝났어도» 붙여야 하는 경우
      //   ⑴ 괄호로 «시작»하는 줄 = 앞 문장의 꼬리다.
      //      실측: 「물 600ml를 붓고 중강불에서 먼저 끓여줍니다.」 / 「(인덕션 8사용)」 이 두 줄이었는데
      //      괄호가 «다음» 단계 앞에 붙어 「(인덕션 8사용) 물이 끓어오르면…」 이 되어 있었다.
      //   ⑵ 후기·감상 줄 = 조리 지시가 아니다.
      //      실측: 「저희집 남편이랑 애들은 퍽퍽살을 싫어해서…」 가 «4번 단계»로 들어가 있었다.
      //      ⛔ 지우지 «않는다» — 잘못 지우면 진짜 단계가 사라진다. 앞 단계 뒤에 «붙여» 잃지 않게 한다.
      //      ⭐ 첫 줄이면 prev 가 없어 그대로 남는다(맨 앞 인사말까지 삼키지 않는다).
      //   ⚠️⚠️ 괄호는 «짧은 것만» 붙인다 — 첫 판이 «길이 제한 없이» 붙였다가
      //      「(간장을 넣으시면 국물이 탁해지니…)」 같은 긴 설명까지 앞 단계에 삼켜
      //      기존 테스트 둘이 빨간불이 됐다(4단계 → 3단계). 그 테스트가 나를 잡았다.
      //      「(인덕션 8사용)」은 8자, 저 설명은 30자가 넘는다 → 25자로 가른다.
      const parenHead = /^[(（[]/.test(s.trim()) && s.replace(/\s/g, '').length <= 25
      const chatty = CHATTY.test(s)
      if (hasOpenBracket(prev) || parenHead || chatty || (prevOpen && (glue || short))) {
        out[out.length - 1] = (prev + ' ' + s).trim()
        continue
      }
    }
    out.push(s)
  }
  return out
}
