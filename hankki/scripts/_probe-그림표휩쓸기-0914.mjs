// 🖼🌊 그림 표가 «몇 편을 한꺼번에» 휩쓰나 — 재는 판 (2026-09-14)
//
// 📮 창업자 = *"음식아이콘 이상하게 바뀌는거랑 반영안되는 것도 뿌리째 고쳐줘 검수까지 다했는데 이러면 안되잖아"*
//
// 🌲 **뿌리를 의심하는 자리** — 갈아끼우기 표가 둘로 갈린다:
//    · `ICON_FORCE_*` = **제목**으로 바꾼다 → 그 한 편만 바뀐다 (안전)
//    · `ICON_SWAP_*`  = **그림 키**로 바꾼다 → **같은 그림을 쓰는 «모든» 편이 같이 바뀐다** (위험)
//    ⛔ 가지무침이 만두가 된 게 정확히 이것이다 — `fe_92 -> gr_066` 한 줄이
//       fe_92 를 쓰던 편을 «전부» 만두로 만들었다.
//    📌 같은 모양을 오늘 또 밟았다 — 「국물 떡볶이」 갈래를 바꾸려다
//       같은 그림(gr_003)을 쓰는 「오리지날 떡볶이」가 딸려 왔다.
//
// ⭐ 그래서 «한 줄이 몇 편을 건드리나»를 센다. 1편이면 안전, 2편 이상이면 휩쓸 수 있는 자리다.
//    ⛔ 「휩쓴다 = 틀렸다」가 아니다 — 일부러 여럿을 같이 바꾸는 줄도 있다.
//       이 판은 «판정»이 아니라 «어디가 위험한 자리인가»를 드러내는 판이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-그림표휩쓸기-0914.mjs
import { readFileSync } from 'node:fs'

const { allBasicRecipes } = await import('../src/data/basics.js')
const store = readFileSync(new URL('../src/store.jsx', import.meta.url), 'utf8')

// 표를 통째로 읽는다 — 이름과 본문
const 표들 = [...store.matchAll(/const (ICON_(?:FORCE|SWAP)[A-Z0-9_]*) = \{([\s\S]*?)\n {2}\}/g)].map((m) => ({
  이름: m[1],
  // ⛔⛔ 키에 «따옴표가 없는» 줄이 대부분이다(`fe_08: 'fe_414',`).
  //    처음엔 `'키': '값'` 만 찾아서 **표 셋이 통째로 「0줄」로 읽혔다** — 가짜 0이었다.
  //    📌 「0이 나왔다」를 「없다」로 읽지 않는다. 눈으로 파일을 열어 보고 잡았다(규칙 18).
  //    ⛔ 그리고 «제목» 표는 키가 한글이라 [A-Za-z0-9_] 로는 또 0줄이 됐다. 둘 다 담는다.
  줄들: [...m[2].matchAll(/(?:'([^']+)'|([^\s:{,]+))\s*:\s*'([^']+)'/g)].map((x) => [x[1] || x[2], x[3]]),
}))

console.log('\n🖼🌊 그림 표가 몇 편을 한꺼번에 휩쓰나\n')
console.log('찾은 표 ' + 표들.length + '개 · 레시피 ' + allBasicRecipes.length + '편\n')

// 그림 키 -> 그 그림을 쓰는 편들
const 그림쓰는편 = new Map()
for (const r of allBasicRecipes) {
  if (!r.icon) continue
  if (!그림쓰는편.has(r.icon)) 그림쓰는편.set(r.icon, [])
  그림쓰는편.get(r.icon).push(r.title)
}

let 위험줄 = 0
for (const 표 of 표들) {
  const 그림으로 = 표.이름.includes('SWAP')
  console.log('=== ' + 표.이름 + '  (' + (그림으로 ? '⚠️그림 키로 바꾼다' : '✅제목으로 바꾼다') + ') · ' + 표.줄들.length + '줄')
  if (!그림으로) { console.log('   → 한 줄이 한 편만 건드린다\n'); continue }
  for (const [옛, 새] of 표.줄들) {
    const 맞는편 = 그림쓰는편.get(옛) || []
    if (맞는편.length >= 2) {
      위험줄++
      console.log('   ⚠️ ' + 옛 + ' -> ' + 새 + '   « ' + 맞는편.length + '편을 한꺼번에 » ' + 맞는편.join(' · '))
    }
  }
  console.log()
}

console.log('⚠️ 한 줄이 두 편 이상을 건드리는 자리 = ' + 위험줄 + '군데')
console.log('   ⛔ 여기가 「가지무침이 만두로」가 난 종류의 자리다.\n')

// ───────── 같은 그림을 여럿이 나눠 쓰는 편 ─────────
const 겹침 = [...그림쓰는편.entries()].filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length)
console.log('🔗 같은 그림을 나눠 쓰는 자리 = ' + 겹침.length + '군데')
console.log('   ⛔ 여기서 한 편의 그림을 바꾸면 «다른 편이 딸려 온다» (오늘 떡볶이가 그랬다)')
for (const [키, 편들] of 겹침.slice(0, 15)) console.log('   ' + 키.padEnd(10) + 편들.length + '편  ' + 편들.join(' · '))
if (겹침.length > 15) console.log('   … ' + (겹침.length - 15) + '군데 더')
console.log()
