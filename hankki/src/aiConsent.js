// 🤖🔐 **AI 다듬기 «허락»** — 유저의 글자·사진을 AI 서버(제3자)로 보내기 «전에» 한 번 묻는다. (2026-09-08 · 큰 틀 6-② · 창업자 확정 ⓑ)
//
// 왜 = 애플 심사 지침 5.1.2(i)(2025-11-13 개정 · 2026-09-08 원문 열람):
//   *"You must clearly disclose where personal data will be shared with third parties, **including with third-party AI**,
//     and obtain **explicit permission before doing so**."*
//   우리 실물 = `tidy.js` 가 레시피 글자＋(작을 때) 사진을 중계 서버 → Cloudflare Workers AI 로 보낸다.
//   그동안 «허락 없이» 보냈다(안드로이드도). 이 파일이 그 문을 닫는다.
//
// 모양 ⓑ = 「기능을 처음 쓰는 순간」에 시트 하나(무엇을·어디로·왜) → [사용할게요] / [사용 안 함].
//   · 답은 폰에만 남는다(`hankki:ai:consent` = 'yes' | 'no') · 서버 0
//   · 'no' 면 AI 를 안 부르고 규칙 정리만 한다(레시피는 그대로 저장) · 보관함 「AI로 다듬기」를 누르면 «다시» 묻는다(다시묻기)
//   · 시트가 없는 자리(재현판·옛 화면)에서 물으면 = «못 물었다» → 보내지 않는다(저장도 안 한다)
//   · 설정 「AI 다듬기 사용」 줄에서 언제든 바꾼다
//
// ⛔ 이 파일은 화면을 모른다 — 시트(`components/AIConsentSheet.jsx`)가 `hankki:aiconsent` 이벤트를 받아 그린다.
// 재현판 = scripts/_repro-AI동의-0908.mjs

export const 동의칸 = 'hankki:ai:consent'
export const 동의이벤트 = 'hankki:aiconsent'
export const 바뀜이벤트 = 'hankki:aiconsent:changed'

const w = () => (typeof window !== 'undefined' ? window : null)

/** 'yes' · 'no' · null(아직 안 물었다) */
export function AI동의상태 () {
  try { const v = localStorage.getItem(동의칸); return v === 'yes' || v === 'no' ? v : null } catch { return null }
}

/** 답을 폰에 적는다(null 이면 지운다) ＋ 화면에 알린다 */
export function AI동의쓰기 (v) {
  try { v ? localStorage.setItem(동의칸, v) : localStorage.removeItem(동의칸) } catch { /* noop */ }
  try { w()?.dispatchEvent(new CustomEvent(바뀜이벤트, { detail: v })) } catch { /* noop */ }
}

let 대기 = null   // 이미 묻는 중이면 «같은 약속»을 돌려준다 — 시트가 두 개 뜨지 않는다

/**
 * 보내도 되나 → Promise<boolean>.
 *  · 'yes' 면 바로 true · 'no' 면 바로 false(다시묻기=true 면 다시 묻는다)
 *  · 아직이면 시트에 묻는다 — 시트가 없으면 false(못 물었다 = 안 보낸다)
 */
export function AI동의받기 ({ 다시묻기 = false } = {}) {
  const 지금 = AI동의상태()
  if (지금 === 'yes') return Promise.resolve(true)
  if (지금 === 'no' && !다시묻기) return Promise.resolve(false)
  if (대기) return 대기
  // ⛔⛔ 「묻는 중」 표(대기)는 약속을 «만들고 난 뒤»에 풀어야 한다.
  //    첫 판은 executor 안에서 끝(null) 을 불러 대기=null 로 만든 «다음에» 대기=약속 이 대입돼
  //    시트가 없던 첫 호출 뒤로 «영영 묻지 않았다»(재현판 ②가 잡았다 · 2026-09-08).
  let 풀기 = null
  const 약속 = new Promise((r) => { 풀기 = r })
  대기 = 약속
  let 끝났나 = false
  const 끝 = (v) => {
    if (끝났나) return
    끝났나 = true
    if (대기 === 약속) 대기 = null
    if (v === 'yes' || v === 'no') AI동의쓰기(v)
    풀기(v === 'yes')
  }
  let 받은시트 = false
  try {
    const win = w()
    if (!win) { 끝(null); return 약속 }
    win.dispatchEvent(new CustomEvent(동의이벤트, { detail: { 받았다: () => { 받은시트 = true }, 답: 끝 } }))
  } catch { 끝(null); return 약속 }
  // 이벤트 리스너는 «동기»로 돈다 — 여기까지 왔는데 아무도 안 받았으면 시트가 없는 자리다(못 물었다 = 안 보낸다)
  if (!받은시트) 끝(null)
  return 약속
}
