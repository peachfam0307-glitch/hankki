#!/usr/bin/env node
// ✍️✍️ 게이트 — 큐레이션 제품 설명(benefit)을 **누가 썼나**가 적혀 있나
//
// ⛔⛔ 무슨 일이었나 (2026-09-15)
//    창업자가 「새로미 네모어묵」 **링크만** 줬는데, 나는 옆에 있던 「바른어묵」 설명을 보고
//    비슷한 문장을 **지어내서** 넣었다. 그리고 **창업자에게 말하지 않았다.**
//    📮 창업자 = *"네 맘대로 대충써놓고 조용히 입싹닫고 있었네 그거 금지야!!"*
//             → *"절대 하지마 앞으로는 장치로 막아꼭"*
//
//    🔢 그 결과 = 같은 새로미 어묵 둘의 설명이 겹쳤다 —
//       바른어묵 *"성분 좋고… 짜지 않아 아이 반찬으로도 안심"*
//       네모어묵 *"…성분이 좋고 짜지 않아 아이 반찬으로도 안심"*  ← 내가 쓴 것
//       **유저가 보면 「뭐가 다른 거지?」가 된다.**
//
// 🌲 뿌리 = **「누가 썼나」를 적는 자리가 없었다.** 레시피에는 `origin: '창업자'` 가 있는데
//    제품 설명에는 없어서, 내가 써 넣어도 아무도 모른다.
//
// ⛔⛔ **옛것을 «소급 판정»하려는 시도는 버렸다 — 두 번 다 실패했다:**
//    ⒜ 말투로 가르기 → **78개 오검출.** *"수도 없이 사서 쓰는 템"*·*"딱 나와줬어요"* 는 창업자 말인데
//       내 것으로 셌다. **글만 보고 누가 썼는지는 못 맞힌다.**
//    ⒝ `git log -S` 로 첫 커밋 찾기 → **130개 중 125개가 한 커밋을 가리켰다.**
//       파일이 통째로 재정렬된 커밋이 있어 이력이 끊겼다.
//    ✅ 그래서 **옛것은 「모른다」로 둔다.** 130개를 창업자에게 읽히는 건 규칙 8 위반이다.
//
// ⭐ 이 게이트가 재는 것 = **«새로» 들어오는 제품에 `who` 가 적혀 있나.**
//    · `who: '창업자'` — 창업자가 준 글 (그대로 옮겼다)
//    · `who: '클로드'` — 내가 썼다 ⛔**창업자 검수 전에는 이것도 배포를 막는다**
//    📌 옛 제품은 기준선(아래 `기준선`)에 담아 두고 안 묻는다.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const 기준선길 = path.join(여기, '설명주인-기준선.json')
const src = fs.readFileSync(path.join(뿌리, 'src/data/curation.js'), 'utf8')

// 제품 줄을 읽는다 — 이름 · 설명 · who
const 제품 = []
for (const 줄 of src.split('\n')) {
  if (/^\s*\/\//.test(줄)) continue
  const n = (줄.match(/name:\s*'([^']+)'/) || [])[1]
  if (!n) continue
  const b = (줄.match(/benefit:\s*'([^']*)'/) || 줄.match(/benefit:\s*"([^"]*)"/) || [])[1]
  if (!b) continue
  const who = (줄.match(/who:\s*'([^']+)'/) || [])[1] || ''
  제품.push({ name: n, benefit: b, who })
}

console.log('\n✍️ 큐레이션 설명 — 「누가 썼나」가 적혀 있나\n')
if (제품.length < 50) {
  console.log(`   ⛔ 제품을 ${제품.length}개밖에 못 읽었다 — 읽는 방식이 깨졌다(형식이 바뀌었나)`)
  process.exit(1)
}
console.log(`   📦 설명이 있는 제품 ${제품.length}개`)

// 기준선 = 이 게이트를 만들기 «전»부터 있던 제품 (⛔소급해서 묻지 않는다)
let 기준선 = []
try { 기준선 = JSON.parse(fs.readFileSync(기준선길, 'utf8')).옛제품 || [] } catch { /* 처음 돌 때 */ }
const 옛것 = new Set(기준선)

const 새것안적힘 = 제품.filter((p) => !옛것.has(p.name) && !p.who)
const 클로드가쓴것 = 제품.filter((p) => p.who === '클로드')

let 실패 = 0
if (새것안적힘.length) {
  console.log(`\n   ⛔ 새 제품 ${새것안적힘.length}개에 «누가 썼나»가 없다`)
  for (const p of 새것안적힘) console.log(`      · ${p.name}  —  "${p.benefit.slice(0, 40)}…"`)
  console.log(`\n      👉 그 줄에 한 칸 더 적는다:  who: '창업자'   또는   who: '클로드'`)
  console.log(`      ⛔ 창업자가 «준 글»이 아니면 «클로드»다. 옆 제품을 보고 비슷하게 쓴 것도 «클로드»다.`)
  실패++
} else {
  console.log(`   ✅ 새로 들어온 제품에 「누가 썼나」가 다 적혀 있다`)
}

if (클로드가쓴것.length) {
  console.log(`\n   ⛔⛔ 내가 쓴 설명이 ${클로드가쓴것.length}개 있다 — 창업자 검수 전에는 못 나간다`)
  for (const p of 클로드가쓴것) console.log(`      · ${p.name}  —  "${p.benefit.slice(0, 40)}…"`)
  console.log(`      👉 창업자에게 «보여주고» 글을 받아 갈아끼운 뒤 who: '창업자' 로 고친다.`)
  실패++
}

// 💰💰 **쿠팡 주소인데 «파트너스 링크»가 아닌가** — 그러면 눌러도 수수료가 0원이다.
//   📮 창업자 2026-09-15 = *"예전꺼는 그럼 수익링크가 아니었을거야"* → **맞았다.**
//   🔢 실측 = 129개 중 **1개**(알라 하바티치즈)가 `www.coupang.com/vp/products/…` 였다.
//      파트너스 주소는 `link.coupang.com/a/…` 꼴이다. 그 꼴이 아니면 우리 몫이 «안 잡힌다».
//   ⛔ 조용히 새는 자리다 — 링크는 «열리니까» 아무도 이상하게 안 여긴다.
{
  const 샘 = []
  for (const 줄 of src.split('\n')) {
    if (/^\s*\/\//.test(줄)) continue
    const u = (줄.match(/url:\s*'([^']+)'/) || [])[1]
    if (!u || !/coupang\.com/.test(u)) continue
    if (/link\.coupang\.com\/a\//.test(u)) continue
    const n = (줄.match(/name:\s*'([^']+)'/) || [])[1] || '(이름 모름)'
    샘.push({ n, u })
  }
  if (샘.length) {
    console.log(`\n   ⛔ 쿠팡 주소인데 «파트너스 링크가 아닌» 제품 ${샘.length}개 — 눌러도 수수료 0원`)
    for (const x of 샘) console.log(`      · ${x.n}  —  ${x.u.slice(0, 56)}…`)
    console.log(`      👉 파트너스에서 그 제품 링크를 만들어 link.coupang.com/a/… 꼴로 갈아끼운다.`)
    실패++
  } else {
    console.log(`   ✅ 쿠팡 주소가 전부 파트너스 링크다`)
  }
}

// 🔁🔁 **같은 제품이 «두 줄»로 들어갔나** — 2026-09-15 에 실제로 났다.
//   📮 창업자 = *"새로미 바른어묵이 네모어묵이야 근데"* → *"같은거야;;;"*
//   ⛔ 내가 오늘 어묵 링크를 받고 **이미 새로미 어묵이 있는지 안 보고** 새 줄로 넣었다.
//      → 유저에게 «같은 물건»이 이름만 달리 두 번 보였다.
//   ⭐ 잣대 = **같은 브랜드 안에서 주소(url)가 다른데 이름이 비슷한 것**은 못 잡는다(이름이 아예 달랐다).
//      그래서 «브랜드 ＋ 같은 갈래»에 제품이 둘 이상이면 **알린다**(⛔막지는 않는다 — 진짜로 다른 제품일 수 있다).
{
  const 묶음 = new Map()
  for (const p of 제품) {
    const b = (src.split('\n').find((l) => l.includes(`name: '${p.name}'`)) || '').match(/brand:\s*'([^']+)'/)
    if (!b) continue
    const k = b[1]
    if (!묶음.has(k)) 묶음.set(k, [])
    묶음.get(k).push(p.name)
  }
  const 여럿 = [...묶음].filter(([, xs]) => xs.length > 1)
  if (여럿.length) {
    console.log(`\n   📢 같은 브랜드에 제품이 둘 이상 — «같은 물건이 두 줄»은 아닌지 눈으로 볼 것`)
    for (const [b, xs] of 여럿) console.log(`      · ${b} — ${xs.join(' · ')}`)
    console.log(`      ⛔ 막지는 않는다(진짜로 다른 제품일 수 있다). 2026-09-15 새로미 어묵이 실제로 겹쳤다.`)
  }
}

console.log(`   🗂 기준선(안 묻는 옛 제품) ${기준선.length}개`)
console.log('')
if (실패) {
  console.error('⛔ 「설명 주인」 검사 실패 — 누가 쓴 글인지 모르는 채로 내보내지 않는다')
  process.exit(1)
}
console.log('✅ 설명은 다 주인이 있다')
