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
const SWAP_GR = 표읽기('ICON_SWAP_GR')
const SWAP_V88 = 표읽기('ICON_SWAP_V88')
const FORCE_V88 = 표읽기('ICON_FORCE_V88')
for (const [이름, 표] of [['ICON_SWAP_GR', SWAP_GR], ['ICON_SWAP_V88', SWAP_V88], ['ICON_FORCE_V88', FORCE_V88]]) {
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

const { basicRecipes } = await import('../src/data/basics.js')

console.log('\n🖼 화면에 붙는 그림이 그 레시피가 맞나 — 전수\n')

let 잰것 = 0
const 어긋남 = []
const 이름없음 = []
for (const r of basicRecipes) {
  const 제목 = String(r.title || '').trim()
  let 그림 = r.icon
  let 어디 = '레시피 icon'
  // 앱과 «같은 순서»로 덮는다
  if (SWAP_GR[그림]) { 그림 = SWAP_GR[그림]; 어디 = 'ICON_SWAP_GR' }
  if (SWAP_V88[그림]) { 그림 = SWAP_V88[그림]; 어디 = 'ICON_SWAP_V88' }
  if (FORCE_V88[제목]) { 그림 = FORCE_V88[제목]; 어디 = 'ICON_FORCE_V88(제목)' }
  if (!그림) continue
  잰것++
  const 이름 = names[그림]
  if (!이름) { 이름없음.push(`${제목} → ${그림} (${어디})`); continue }
  if (!같은음식인가(제목, 이름)) 어긋남.push({ 제목, 그림, 이름, 어디, 처음: r.icon })
}

console.log(`[iconmatch] · 잰 레시피 ${잰것}편`)
if (이름없음.length) {
  console.log(`[iconmatch] ⚠️ 그림에 이름표가 없어 «못 잰» 편 ${이름없음.length}개 (배포는 안 막는다)`)
  for (const x of 이름없음.slice(0, 8)) console.log('   · ' + x)
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
console.log('[iconmatch] ✅ 어긋난 편 0 — 네 자리를 다 거친 뒤에도 이름과 그림이 맞는다\n')
