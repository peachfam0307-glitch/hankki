// OCR 결과 텍스트 후처리 — 체감 정확도를 크게 올리는 값싼 한 방.
// tesseract·폰 OCR 이 자주 저지르는 '모양이 닮아 헷갈리는' 오독을 규칙으로 되돌린다.
//  · 유니코드 분수(½ → 1/2), 전각문자(２ｇ → 2g)
//  · 숫자 토큰 안의 O→0 · l/I/|→1 (숫자 맥락에서만 — 진짜 단어는 안 건드림)
//  · 숫자·범위·분수 주변 공백 정리 (2 개 → 2개, 2 ~ 3 → 2~3, 1 / 2 → 1/2)
//  · 아는 단어로의 근접 스냅(편집거리 1) — 영수증 식재료 인식에 사용

const UNICODE_FRAC = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6',
  '⅚': '5/6', '⅐': '1/7', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8',
  '⅞': '7/8', '⅑': '1/9', '⅒': '1/10',
}

// 숫자가 섞인 연속 구간(예: "2O0", "l0")만 골라 글자 모양 오독을 숫자로 되돌린다.
// 진짜 숫자가 하나도 없는 구간(예: "loo", "Google")은 손대지 않아 단어를 안 망친다.
const NUM_RUN = /[0-9OolI|]{2,}/g
function fixNumericRun(run) {
  if (!/[0-9]/.test(run)) return run // 진짜 숫자가 없으면 단어일 수 있으니 그대로 둔다
  let out = ''
  for (let i = 0; i < run.length; i++) {
    const ch = run[i]
    if (ch === 'O' || ch === 'o') out += '0'
    else if (ch === 'I' || ch === '|') out += '1'
    // 끝에 붙은 l 은 리터 단위("1l")일 수 있어 보존, 그 외는 1 로("l0"→"10")
    else if (ch === 'l') out += i === run.length - 1 ? ch : '1'
    else out += ch
  }
  return out
}

// 전각 영숫자·기호 → 반각 (２ｇ → 2g, Ｏ → O, （ → ( 등)
function toHalfWidth(s) {
  return s
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
}

// 텍스트 전체의 숫자·기호 표기를 정규화한다. (뜻있는 한글/영문 단어는 절대 안 건드림)
export function normalizeNumerals(text) {
  let s = String(text || '')
  // 1) 유니코드 분수
  s = s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]/g, (m) => UNICODE_FRAC[m] || m)
  // 2) 전각 → 반각 (이후 단계는 반각만 다루면 된다)
  s = toHalfWidth(s)
  // 3) 숫자 구간 안의 글자 오독(O·l·I·|)만 숫자로 교정
  s = s.replace(NUM_RUN, fixNumericRun)
  // 4) 수량 표기 주변 공백 정리 — 분수/범위/단위가 깔끔하게 붙도록
  s = s.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2') // 1 / 2 → 1/2
  s = s.replace(/(\d)\s*~\s*(\d)/g, '$1~$2') // 2 ~ 3 → 2~3
  // 단위 앞 공백 제거(한글 단위는 \b 가 안 걸리므로 경계 표기를 쓰지 않는다)
  s = s.replace(/(\d)\s+(kg|g|ml|cc|개|알|쪽|봉|모|장|대|톨|컵|스푼|숟가락|줌|꼬집|줄|캔|팩|조각|인분|마리|공기)/gi, '$1$2')
  return s
}

// 두 문자열의 편집거리가 1 이하인지 (치환·삽입·삭제 각 1회) — O(len), 빠름.
// "고주장"↔"고추장" 처럼 한 글자 오독을 아는 단어로 되돌릴 때 쓴다.
export function within1(a, b) {
  if (a === b) return true
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (m > n) i++ // a 에서 한 글자 삭제
    else if (m < n) j++ // a 에 한 글자 삽입
    else { i++; j++ } // 한 글자 치환
  }
  if (i < m || j < n) edits++ // 끝에 남은 한 글자
  return edits <= 1
}
