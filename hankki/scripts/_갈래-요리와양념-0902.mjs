// 🍚🥣 **「요리인가 양념인가」를 «한 곳»에서만 정한다** (2026-09-02)
//
// ⛔⛔ 왜 파일로 뺐나 — 세는 도구(`_세기-요리와소스`)와 검수판 도구(`_판-요리33`)가
//    **각자 판정하면 반드시 어긋난다.** 「현행이 둘이면 하나는 반드시 틀린 값이 된다」(2026-08-13)와 같은 뿌리다.
//    ⭐ 판이 「33편」인데 세기가 「34편」을 말하면 창업자가 «없는 문제»를 짚느라 시간을 쓴다.
//
// ⛔ 레시피 «내용»은 여기 없다 — 이 저장소는 공개(public)다. **판정 규칙만.**
import { readFileSync } from 'node:fs'

export const 줄 = (a) => (a || []).map(String).filter((x) => x.trim())
export const 재료수 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('[')).length
export const 걸음수 = (r) => 줄(r.steps).length
export const 재료줄 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('['))

// ── 손판정 (낱말 규칙이 못 가르는 것) ───────────────────────────────
//   ⭐ 애매한 것은 «이유와 함께» 박는다. 낱말만으로는 못 가른다:
//      「달래장」 = 비벼 먹는 장  ↔  「마늘간장 계란장」·「꼬막장」 = 밑반찬(요리)
export const 손판정 = new Map([
  ['달래장', '양념'],
  ['마늘간장 계란장', '요리'],   // 「장」이 붙었지만 계란 요리다
  ['꼬막장', '요리'],
  ['장똑똑이', '요리'],          // 소고기 조림 반찬
  ['물회육수', '양념'],          // 요리에 «들어가는» 국물
  ['전 반죽', '양념'],
  ['피클초', '양념'],
  ['고기 소분 기준', '메모'],    // ⛔레시피가 아니다 — 고기 나누는 기준을 적어둔 것
  // ⛔ 낱말 규칙에 «잘못» 걸린 것 — 「양념구이」는 굽는 요리지 양념이 아니다
  //    📌 처음 돌렸을 때 이게 양념 칸에 있었고, 목록을 눈으로 훑어서 잡았다(규칙 21).
  ['한우채끝 소고기양념구이', '요리'],
])

const 양념낱말 = /소스|양념|밑간|다래|늑맘|마요간장/

export const 갈래 = (r) => {
  const t = (r.title || '').trim()
  if (손판정.has(t)) return 손판정.get(t)
  return 양념낱말.test(t) ? '양념' : '요리'
}

// 완성도 — 🅰 바로 낼 수 있다 · 🅱 순서가 1~2걸음 · 🅲 재료만 · 🅾 둘 다 없다
export const 상태 = (r) => {
  const 재 = 재료수(r), 걸 = 걸음수(r)
  return 걸 >= 3 && 재 > 0 ? '🅰' : 걸 >= 1 ? '🅱' : 재 > 0 ? '🅲' : '🅾'
}

// ── 앱에 이미 나갔나 = `basics.js` 의 `origin: '창업자'` 이름표 ──────
//   ⛔ 재료로 더듬지 않는다 — 그랬더니 「달래장 ↔ 제육볶음」이 같은 요리로 묶였고
//      셀 때마다 숫자가 달라졌다(`_판-내레시피.mjs` 머리주석).
//   ⚠️ 제목이 «통째로» 바뀐 편은 `원래 이름 「…」` 주석으로만 이어진다 —
//      주석이 없으면 못 잇는다. 그래서 `_짝찾기-백업과앱-0902.mjs` 로 따로 훑는다.
export function 앱에든것(basicsPath) {
  const src = readFileSync(basicsPath, 'utf8')
  const s = new Set()
  for (const b of src.split('\n  {\n').slice(1)) {
    if (!/origin: *'창업자'/.test(b)) continue
    const t = (b.match(/title: '([^']+)'/) || [])[1]
    const 원 = (b.match(/원래 이름 「([^」]+)」/) || [])[1]
    if (t) s.add(t)
    if (원) s.add(원)
  }
  return s
}

export const 내가넣은편 = (d) => d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))
