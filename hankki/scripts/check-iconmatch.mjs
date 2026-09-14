#!/usr/bin/env node
// 🖼🔒 **「화면에 붙는 그림」이 「그 레시피」가 맞나 — 전수 게이트** (2026-09-14 신설)
//
// 📮 창업자 = *"가지무침이 만두로 바뀐거 실화야???????????"* → *"이거 구멍 오늘하루동안 다해서 잡아"*
//    ＋ *"절대 이런일이 있으면 안돼 ㅠㅠ"*
//
// 🌲🌲 **뿌리 = 그림을 정하는 자리가 «넷»인데, 그 넷을 다 거친 «최종 그림»을 아무도 안 쟀다.**
//
//    | | 자리 | 무엇으로 찾나 | 힘 |
//    |---|---|---|---|
//    | ① | 레시피의 `icon` (`basics.js`) | — | 바탕 |
//    | ② | 갈아끼우기표 `ICON_SWAP_GR` (`store.jsx`) | 옛 그림 키 | ①을 덮는다 |
//    | ③ | 갈아끼우기표 `ICON_SWAP_V88` (`store.jsx`) | 옛 그림 키 | ②를 덮는다 |
//    | ④ | 강제표 `ICON_FORCE_V88` (`store.jsx`) | **제목** | **제일 세다** |
//
//    ⛔ `check-foodtab` 은 ①의 파일이 있나·이름표가 있나만 봤다 — **②③④가 덮은 뒤를 안 봤다.**
//    🔢 실측 = 그래서 「쫄깃한 가지무침」이 **만두**로 떴다(`fe_92` → `gr_066`).
//       그 줄은 2026-08-26 에 박혔는데, 그 편이 **2026-09-14 에 처음 열려서** 그날 창업자가 봤다.
//       📌 **틀린 줄은 배포 때가 아니라 «그 편이 열리는 날» 드러난다.** 그래서 게이트가 필요하다.
//
// ⭐ 재는 법 = 네 자리를 앱과 «같은 순서»로 거쳐 최종 그림을 구하고,
//    그 그림의 이름표(FOOD_NAMES)와 레시피 제목이 «같은 음식»인지 본다.
//    ⛔ 글자가 똑같기를 바라지 않는다 — 「쫄깃한 가지무침」 vs 「가지무침」처럼 꾸밈말이 붙는다.
//       ✅ 그래서 «핵심 낱말이 서로 들어 있나»로 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/check-iconmatch.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'src/components/FoodIcon.jsx'), 'utf8')
const store = readFileSync(path.join(root, 'src/store.jsx'), 'utf8')

// ── 이름표 읽기 — `check-foodtab.mjs` 와 «같은 방법»(앱 FOOD_NAMES 와 같은 우선순위) ──
//   ⛔ 순서를 바꾸지 말 것: 앱은 `{ ...EXTRA_NAMES, ...규칙 }` 이라 «규칙이 EXTRA 를 덮는다».
const names = {}
{
  const eStart = src.indexOf('EXTRA_NAMES = {')
  if (eStart > 0) {
    for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]
  }
  const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
  const 본것 = new Set()
  for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) {
    if (본것.has(m[2])) continue
    본것.add(m[2])
    names[m[2]] = m[1]
  }
}

// ── 갈아끼우기·강제표 읽기 ──
const 표읽기 = (이름) => {
  const i = store.indexOf(`const ${이름} = {`)
  if (i < 0) return null
  const body = store.slice(i, store.indexOf('\n  }', i))
  const 표 = {}
  // 키는 그림 키(fe_92) 이거나 «제목»('간장 제육볶음') 둘 다 온다
  for (const m of body.matchAll(/(?:'([^']+)'|([A-Za-z][\w]*))\s*:\s*'([^']+)'/g)) 표[m[1] || m[2]] = m[3]
  return 표
}
// ⛔⛔ [2026-09-14] 처음엔 표가 «셋»인 줄 알고 셋만 봤다 — 실제로는 **다섯**이다.
//   📌 표 이름을 손으로 적으면 반드시 낡는다. 그래서 **store.jsx 에서 «세어서» 대조한다**(아래 적힌수).
const FORCE_V38 = 표읽기('ICON_FORCE_V38')
const SWAP_V88 = 표읽기('ICON_SWAP_V88')
const FORCE_V88 = 표읽기('ICON_FORCE_V88')
const SWAP_GR = 표읽기('ICON_SWAP_GR')
const SWAP_0827 = 표읽기('ICON_SWAP_0827')
// ⭐ 「내가 아는 표」와 「코드에 있는 표」 수가 다르면 죽는다 — 표가 늘면 이 도구도 같이 늘어야 한다.
const 적힌수 = new Set([...store.matchAll(/const (ICON_(?:FORCE|SWAP)[A-Z0-9_]*) = \{/g)].map((m) => m[1])).size
if (적힌수 !== 5) {
  console.error()
  console.error('   👉 새 표가 생겼으면 «적용 순서»를 코드에서 읽어 이 도구에 더할 것.')
  console.error('   ⛔ 안 더하면 그 표가 덮는 그림은 아무도 안 재게 된다 — 가지무침이 만두가 된 것이 그 모양이다.')
  process.exit(1)
}
for (const [이름, 표] of [['ICON_FORCE_V38', FORCE_V38], ['ICON_SWAP_V88', SWAP_V88], ['ICON_FORCE_V88', FORCE_V88], ['ICON_SWAP_GR', SWAP_GR], ['ICON_SWAP_0827', SWAP_0827]]) {
  if (!표 || !Object.keys(표).length) {
    console.error(`[iconmatch] ❌ ${이름} 을 못 읽었다 — store.jsx 의 모양이 바뀌었다. 이 도구를 그 모양에 맞춰라.`)
    console.error('   ⛔ 「못 읽어서 0건」이 «통과»로 보이면 안 된다 — 그래서 여기서 죽는다.')
    process.exit(1)
  }
}

// ── 낱말 견주기 ──
//   ⭐ 「쫄깃한 가지무침」 ↔ 「가지무침」 은 같은 음식이다. 「가지무침」 ↔ 「만두」 는 아니다.
//   ⛔ 글자 일치를 바라지 않는다 — 꾸밈말(쫄깃한·초간단·매운)과 띄어쓰기가 늘 다르다.
const 씻기 = (s) => String(s || '').replace(/[()\[\]·,\s]/g, '')
const 꾸밈말 = /^(쫄깃한|초간단|간단|매운|매콤|담백한|고소한|바삭|촉촉|따뜻한|시원한|얼큰|우리집|정통|옛날|엄마표|기본|특별한|알찬|든든한)/
const 같은음식인가 = (제목, 그림이름) => {
  const a = 씻기(제목).replace(꾸밈말, '')
  const b = 씻기(그림이름).replace(꾸밈말, '')
  if (!a || !b) return true            // 잴 거리가 없으면 «아니라고 우기지» 않는다
  if (a.includes(b) || b.includes(a)) return true
  // 세 글자 이상 겹치면 같은 갈래로 본다(「돼지고기김치찌개」 ↔ 「김치찌개」)
  for (let n = Math.min(a.length, b.length); n >= 3; n--) {
    for (let i = 0; i + n <= b.length; i++) if (a.includes(b.slice(i, i + n))) return true
  }
  return false
}

// 🤝 **같은 음식인데 이름이 다른 짝** — 여기 적은 것만 넘어간다.
//   ⛔⛔ 예외를 «조용히» 늘리지 말 것. 한 줄마다 «왜 같은 음식인지»를 적는다.
//      적을 말이 없으면 그건 예외가 아니라 «고쳐야 할 짝»이다.
//   📌 이 목록이 길어지면 그건 이름표가 낡았다는 뜻이다 — 그때는 이름표를 고친다.
const 같은것으로본다 = {
  '제육볶음': '두루치기',                 // 같은 요리의 다른 이름(규칙에도 둘을 한 줄에 묶어 뒀다)
  '명란 바지락 파스타': '봉골레',          // 봉골레 = 바지락 파스타. 명란이 더해진 편이다
  '닭가슴살 피자 브리또': '치킨부리또',     // 닭가슴살 = 치킨 · 브리또 = 부리또(표기만 다르다)
  // ☑️ [2026-09-14 전수 검수] 창업자가 후보를 «눈으로 보고» 고른 짝 — 이름은 다르지만 그림이 맞다
  '비빔밥 소스': '소스 종지2',             // 소스는 그릇에 담긴 컷이라 이름이 「종지」다
}

// ⏳⏳ **[2026-09-14] 창업자 판정을 기다리는 17군데** — 미래 편까지 전수로 재면서 드러났다.
//   ⭐⭐ **왜 여기 적어 두나** — 이걸 «빨간불»로 두면 배포가 통째로 막히고,
//      «그냥 넘기면» 이 자리가 영영 안 잡힌다. 그래서 **이름을 적어 «알고 있음»으로 묶는다.**
//      📌 그러면 ⑴여기 «없는» 새 어긋남은 즉시 빨간불이고 ⑵이 17건은 눈에 남는다.
//   ⛔ 창업자가 판정하면 «같은 것»은 위  로 옮기고, «바꿀 것»은 그림을 고치고 여기서 뺀다.
//   ⛔ 판정 없이 여기 새 줄을 더하지 말 것 — 그러면 이 도구가 아무것도 안 재는 종이가 된다.
// ☑️ **[2026-09-14 창업자 검수 끝]** 17군데를 검수판으로 보여 주고 판정을 받았다.
//   📮 창업자 = *"1.2.3.4.12.13 잘못됐어"* → 그 여섯만 «바꿀 것», 나머지 열하나는 «같은 것».
//   ⛔ 내가 «의심»했던 5·9·14·15·17 도 창업자는 같은 것으로 봤다 — **판정은 창업자가 한다**(규칙 11).
const 판정대기 = {
  // ✅ [2026-09-14] 계란후라이조림·버섯전·새우튀김·고등어구이 — 창업자가 새 컷을 뽑아 줘서 «닫혔다»(n3024~n3027)
  '목살조림': '부타노가쿠니',              // ❓부타노가쿠니는 «삼겹» 조림이다
  '고마다래 소스': '참깨소스',             // 같은 것(고마다래 = 참깨 소스)
  '간편갈비조림': '갈비살조림',            // 같은 것
  '어묵탕': '오뎅탕',                     // 같은 것
  '차돌된장': '된장찌개',                  // ❓차돌박이가 안 보인다
  '마늘간장계란밥': '간장버터달걀밥',        // 거의 같은 것
  '달래장': '달래양념장',                  // 같은 것
  // ✅ [2026-09-14] 해물오일파스타·마늘간장닭날개조림 — 창업자가 새 컷을 뽑아 줘서 «닫혔다»(n3028·n3029)
  '매콤 닭다리살 볶음': '닭강정',           // ❓닭강정은 «튀김»이다
  '돼지고기 고추장찌개': '김치찌개',         // ❓그림에 김치가 보인다
  '야끼우동': '볶음우동',                  // 같은 것
  '가지 라자냐': '그라탕',                 // ❓가지가 안 보인다
}

// ⛔⛔ [2026-09-14] ** 는 «오늘까지 열린 편»만 준다** — 그걸로 재면
//   11월에 열릴 편의 틀린 짝은 **그날 가서야** 터진다. 가지무침이 정확히 그 모양이었다
//   (2026-08-26 에 박힌 틀린 줄이 2026-09-14 에 열려서 드러났다).
//   ✅ 그래서 «아직 안 열린 편까지» 전부 재는  를 쓴다.
const { allBasicRecipes: basicRecipes } = await import('../src/data/basics.js')

console.log('\n🖼 화면에 붙는 그림이 그 레시피가 맞나 — 전수\n')

let 잰것 = 0
let 대기 = 0
const 어긋남 = []
const 이름없음 = []
for (const r of basicRecipes) {
  const 제목 = String(r.title || '').trim()
  let 그림 = r.icon
  let 어디 = '레시피 icon'
  // 🔁 앱과 «같은 순서»로 덮는다 — store.jsx 의 적용 줄 차례 그대로다(348 → 441 → 478 → 512).
  //   ⛔ 순서를 바꾸면 «앱이 안 쓰는 그림»을 재게 된다 — 통과했는데 아무것도 안 잰 꼴이다.
  if (FORCE_V38[제목]) { 그림 = FORCE_V38[제목]; 어디 = 'ICON_FORCE_V38(제목)' }
  if (FORCE_V88[제목]) { 그림 = FORCE_V88[제목]; 어디 = 'ICON_FORCE_V88(제목)' }
  else if (SWAP_V88[그림]) { 그림 = SWAP_V88[그림]; 어디 = 'ICON_SWAP_V88' }
  if (SWAP_GR[그림]) { 그림 = SWAP_GR[그림]; 어디 = 'ICON_SWAP_GR' }
  if (SWAP_0827[그림]) { 그림 = SWAP_0827[그림]; 어디 = 'ICON_SWAP_0827' }
  if (!그림) continue
  잰것++
  const 이름 = names[그림]
  if (!이름) { 이름없음.push(`${제목} → ${그림} (${어디})`); continue }
  if (같은것으로본다[제목] === 이름) continue
  if (판정대기[제목] === 이름) { 대기++; continue }
  if (!같은음식인가(제목, 이름)) 어긋남.push({ 제목, 그림, 이름, 어디, 처음: r.icon })
}

console.log(`[iconmatch] · 잰 레시피 ${잰것}편`)
// ⛔⛔ **「못 쟀다」는 «통과»가 아니다.** 이름표가 없으면 어떤 그림이 붙어도 아무도 못 잡는다 —
//   가지무침이 만두가 된 것도 «아무도 안 재서»였다. 그래서 여기서도 죽는다.
if (이름없음.length) {
  console.error(`\n[iconmatch] ❌ 그림에 이름표가 없어 «못 잰» 편 ${이름없음.length}개\n`)
  for (const x of 이름없음) console.error('   ⛔ ' + x)
  console.error('\n   👉 그 그림을 «눈으로 열어 보고» FoodIcon 의 EXTRA_NAMES 에 이름표를 달 것.')
  console.error('   ⛔ 「배포는 안 막는다」로 두면 이 자리가 영영 안 잡힌다.')
  process.exit(1)
}
if (어긋남.length) {
  console.error(`\n[iconmatch] ❌❌ 이름과 «다른 음식» 그림이 붙는 편 ${어긋남.length}개\n`)
  for (const x of 어긋남) {
    console.error(`   ⛔ 「${x.제목}」 에 «${x.이름}» 그림이 붙는다`)
    console.error(`      ${x.처음} → ${x.그림}   (${x.어디} 가 덮었다)`)
  }
  console.error('\n   👉 고칠 자리 = 위에 적힌 그 표다. ⛔레시피의 icon 만 고치면 또 덮인다.')
  console.error('   📌 그림을 바꿀 땐 «네 자리»를 다 맞춘다 — 레시피 icon · 이름표 규칙 · SWAP 표 · FORCE 표.')
  process.exit(1)
}
if (대기) console.log('[iconmatch] ⏳ 창업자 판정 대기 ' + 대기 + '군데 — 위 「판정대기」 목록에 이름이 적혀 있다 (배포는 안 막는다)')
console.log('[iconmatch] ✅ 새로 어긋난 편 0 — 네 자리를 다 거친 뒤에도 이름과 그림이 맞는다\n')
