// 📢 「남은 장수」 표시 재현 — 창업자 *"카운트가 안된다고"* 로 드러난 구멍.
//
// 무엇이 문제였나 = 서버(worker)는 `left: { welcome, month }` 를 «매번 보내고 있었는데»
//   앱이 `data.text` 만 꺼내 쓰고 그 줄을 **통째로 버렸다**(`src/ocr.js:69`).
//   그래서 유저는 몇 장 남았는지 «알 길이 없었다».
//
// 여기서 확인하는 것 (전부 «돈·유저 신뢰»가 걸린 것)
//   ① 아직 한 번도 안 써 본 사람 → 웰컴 20장으로 보인다 (0장으로 보이면 안 된다)
//   ② 서버 응답을 받으면 그 값으로 바뀐다
//   ③ 웰컴이 남아 있으면 «웰컴»을 보여준다 (월 5장이 아니라)
//   ④ 웰컴을 다 쓰면 «그 달 잔량»으로 넘어간다
//   ⑤ 0장이면 「다 썼어요」 문구로 바뀐다
//   ⑥ 1장 남으면 미리 알림이 «한 번만» 붙는다 (창업자 확정 — 3장·1장 두 번이 아니다)
//
// ⛔ src/ocr.js 의 로직을 바꾸면 여기도 같이 고칠 것.

import { readFileSync } from 'node:fs'

const WELCOME_FREE = 20
const MONTHLY_FREE = 5
const LEFT_KEY = 'hankki:ocrLeft'

// ── localStorage 흉내 ─────────────────────────────────────
const store = new Map()
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
}

// ── src/ocr.js 의 두 함수를 «그대로» 옮겨 온 것 ─────────────
function saveOcrLeft(left) {
  const w = Math.max(0, parseInt(left.welcome, 10) || 0)
  const m = Math.max(0, parseInt(left.month, 10) || 0)
  localStorage.setItem(LEFT_KEY, JSON.stringify({ welcome: w, month: m }))
}

function getOcrLeft() {
  let v = null
  try {
    v = JSON.parse(localStorage.getItem(LEFT_KEY) || 'null')
  } catch {
    v = null
  }
  if (!v || typeof v.welcome !== 'number') {
    return { welcome: WELCOME_FREE, month: MONTHLY_FREE, total: WELCOME_FREE, unknown: true }
  }
  return { ...v, total: v.welcome > 0 ? v.welcome : v.month, unknown: false }
}

// ── 화면 문구 (ImportScreen 뱃지 · EditorScreen 토스트) ─────
const badge = (l) => (l.total > 0 ? `무료 AI 스캔 ${l.total}장 남음` : '무료 AI 스캔 다 썼어요 · 기본 인식으로 계속 돼요')
const tail = (l) =>
  l.total === 0
    ? ' · 무료 AI 스캔을 다 썼어요 · 이제 기본 인식으로 계속 돼요'
    : l.total === 1
      ? ' · 무료 AI 스캔 1장 남았어요'
      : ''

// ── 확인 ──────────────────────────────────────────────────
let ok = 0
let ng = 0
const chk = (설명, got, want) => {
  if (String(got) === String(want)) {
    console.log(`   ✅ ${설명}`)
    ok++
  } else {
    console.log(`   ⛔ ${설명}\n        기대 「${want}」\n        실제 「${got}」`)
    ng++
  }
}

console.log('\n📢 남은 장수 표시 재현\n')

// ① 아직 안 써 본 사람 — 서버 응답이 «없다»
chk('① 처음 깐 사람에게 웰컴 20장으로 보인다', badge(getOcrLeft()), '무료 AI 스캔 20장 남음')
chk('①-b 그 값이 「모름」 표시를 달고 온다', getOcrLeft().unknown, 'true')

// ② 서버 응답이 오면 그 값으로 바뀐다 (한 장 써서 19장)
saveOcrLeft({ welcome: 19, month: 5 })
chk('② 서버가 보낸 값으로 바뀐다', badge(getOcrLeft()), '무료 AI 스캔 19장 남음')
chk('②-b 「모름」이 풀린다', getOcrLeft().unknown, 'false')

// ③ 웰컴이 남아 있으면 «웰컴»을 보여준다 — 월 5장을 보여주면 안 된다
saveOcrLeft({ welcome: 12, month: 5 })
chk('③ 웰컴이 남으면 웰컴을 보여준다(월 5장이 아니다)', getOcrLeft().total, 12)

// ④ 웰컴을 다 쓰면 그 달 잔량으로 넘어간다
saveOcrLeft({ welcome: 0, month: 3 })
chk('④ 웰컴을 다 쓰면 그 달 잔량으로 넘어간다', badge(getOcrLeft()), '무료 AI 스캔 3장 남음')

// ⑤ 0장 — 「다 썼어요」로 바뀐다 (창업자 *"다썼다고 알려줘야해 무료서비스로 변경된다고"*)
saveOcrLeft({ welcome: 0, month: 0 })
chk('⑤ 0장이면 「다 썼어요」로 바뀐다', badge(getOcrLeft()), '무료 AI 스캔 다 썼어요 · 기본 인식으로 계속 돼요')
chk('⑤-b 마지막 장을 쓴 «그 순간» 토스트가 알려준다', tail(getOcrLeft()), ' · 무료 AI 스캔을 다 썼어요 · 이제 기본 인식으로 계속 돼요')

// ⑥ 1장 남았을 때 미리 알림 — «한 번만»
saveOcrLeft({ welcome: 1, month: 5 })
chk('⑥ 1장 남으면 미리 알린다', tail(getOcrLeft()), ' · 무료 AI 스캔 1장 남았어요')
saveOcrLeft({ welcome: 3, month: 5 })
chk('⑥-b 3장일 땐 «안» 알린다(잔소리 금지 — 창업자가 하나로 줄였다)', tail(getOcrLeft()), '')
saveOcrLeft({ welcome: 2, month: 5 })
chk('⑥-c 2장일 때도 «안» 알린다', tail(getOcrLeft()), '')

// ⑦ 망가진 값이 들어와도 화면이 깨지지 않는다
localStorage.setItem(LEFT_KEY, '{망가진 값')
chk('⑦ 저장값이 깨져도 웰컴 20장으로 되돌아간다', badge(getOcrLeft()), '무료 AI 스캔 20장 남음')

// ⭐⭐ 위 ①~⑦ 은 로직을 «옮겨 적은 것»이라, 원본이 바뀌면 여기만 통과하는 «거짓 초록»이 된다.
//    그래서 원본 파일을 직접 읽어 「같은 규칙인가」를 못박는다. 원본을 고치면 여기가 빨개진다.
const src = readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
const wk = readFileSync(new URL('../ocr-proxy/worker.js', import.meta.url), 'utf8')

chk('🔒 원본이 서버 응답의 left 를 «저장한다»', /saveOcrLeft\(data\.left\)/.test(src), 'true')
chk('🔒 원본의 total 규칙 = 웰컴이 남으면 웰컴', /v\.welcome > 0 \? v\.welcome : v\.month/.test(src), 'true')
chk('🔒 원본은 읽어도 «지우지 않는다»(note 처럼 소비하면 뱃지가 사라진다)', /_ocrLeft = null/.test(src), 'false')

// ⭐⭐ 앱과 서버가 «같은 숫자»를 봐야 한다 — 어긋나면 유저에게 «거짓 잔량»을 보여준다.
const appW = /const WELCOME_FREE = (\d+)/.exec(src)?.[1]
const appM = /const MONTHLY_FREE = (\d+)/.exec(src)?.[1]
const wkW = /WELCOME_FREE:\s*(\d+)/.exec(wk)?.[1]
const wkM = /PER_USER_MONTHLY:\s*(\d+)/.exec(wk)?.[1]
chk(`🔒⭐ 웰컴 장수가 앱(${appW})과 서버(${wkW})에서 같다`, appW, wkW)
chk(`🔒⭐ 월 무료 장수가 앱(${appM})과 서버(${wkM})에서 같다`, appM, wkM)

console.log(`\n   ── ${ok}칸 통과 · ${ng}칸 어긋남 ──\n`)
process.exit(ng ? 1 : 0)
