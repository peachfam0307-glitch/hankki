#!/usr/bin/env node
// 🥬 창업자가 파트너스에서 만들 «재료 링크» 목록 — 빈도순 (2026-09-12)
//
// 📮 창업자 = *"다 붙여야지.. 그리고 장보기에 들어가는 것도 다 붙이자"*
//    ＋ *"밥면수이런건 말고"* ＋ *"야채같은거는 다 가장최소단위로 로켓프레시나 로켓배송으로"*
//
// ⭐ 왜 이 판이 있나 = 수백 개를 «아무 순서로» 만들면 손이 많이 가는 쪽부터 하게 된다.
//    자주 나오는 것에 몰려 있어서 **위에서 몇십 개만 만들어도 절반이 붙는다.**
// ⭐ 짝이 밀리지 않는다 — **이름을 같이 받는다**. 2026-09-08 에 61개를 «순서»로 받다가
//    하나 빠져 뒤가 통째로 밀렸고(이진탐색 6번), 그러고도 둘이 뒤바뀐 걸 전수검사 61번으로 잡았다.
//
// ⚠️⚠️ 두 가지를 «앱과 똑같이» 봐야 목록이 맞다 — 아니면 창업자가 헛일을 한다
//   ⑴ 재료 덩어리는 **대괄호를 세면서** 읽는다. 짧은 정규식은 소제목 `'[국물]'` 의 `]` 에서 멈춘다
//      (2026-08-15 에 그래서 **234줄이 안 보였다** · `check-picks.mjs` 주석 참고).
//   ⑵ 큐레이션이 덮는지는 `picksForIngredients()` 와 **같은 규칙**으로 본다 —
//      제품 «풀네임»이 줄에 있거나, `matches` 낱말이 **낱말 «시작»**에 오거나.
//      ⛔ 처음에 `이름.startsWith(낱말)` 로 봤다가 「성가정 진간장」을 «안 덮인다»고 셌다 —
//         앱은 줄을 토큰으로 쪼개 보므로 그건 이미 붙는 것이다. 헛일 목록이 될 뻔했다.
//   ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 읽는다 → 소스 글자로 읽는다.
//
// 쓰는 법
//   node scripts/_판-재료링크목록.mjs          # 아직 링크 없는 것 상위 40개
//   node scripts/_판-재료링크목록.mjs 100
//   node scripts/_판-재료링크목록.mjs --전부
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => { try { return readFileSync(join(뿌리, p), 'utf8') } catch { return '' } }
const { ingredientName } = await import(join(뿌리, 'src/utils.js'))
// ⛔ `ingLinks.js` 는 `curation.js` 를 부르므로 노드가 못 읽는다 → 표와 제외목록도 글자로 읽는다.
const ilSrc = 읽기('src/data/ingLinks.js')
const 표키 = new Set([...ilSrc.matchAll(/^\s*'([^']+)':\s*'https:/gm)].map((m) => m[1]))
const 안파는것 = new Set(
  [...(ilSrc.match(/안파는것 = new Set\(\[([\s\S]*?)\]\)/) || ['', ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
)
if (안파는것.size === 0) { console.error('⛔ `안파는것` 을 못 읽었다 — ingLinks.js 모양이 바뀌었다.'); process.exit(1) }

// ── 큐레이션 제품 (⛔ `noRecipePick` 은 레시피에서 뺀 제품이라 «안 덮는다»)
const cur = 읽기('src/data/curation.js')
const 제품 = []
for (const m of cur.matchAll(/\{\s*name:\s*'([^']+)'[^}]*\}/g)) {
  const 덩 = m[0]
  if (/noRecipePick:\s*true/.test(덩)) continue
  const w = [...((덩.match(/matches:\s*\[([^\]]*)\]/) || ['', ''])[1]).matchAll(/'([^']+)'/g)].map((x) => x[1])
  제품.push({ name: m[1], words: w })
}
if (제품.length < 20) { console.error(`⛔ 큐레이션 제품을 ${제품.length}개밖에 못 읽었다 — 파일 모양이 바뀌었다.`); process.exit(1) }

// ── 재료 덩어리를 «대괄호를 세면서» 읽는다 (따옴표 안의 대괄호는 글자다)
const 재료덩어리 = (src) => {
  const out = []
  for (const m of src.matchAll(/ingredients:\s*\[/g)) {
    let i = m.index + m[0].length, 깊이 = 1
    const 시작 = i
    while (i < src.length && 깊이 > 0) {
      const c = src[i]
      if (c === "'") { i++; while (i < src.length && src[i] !== "'") i += src[i] === '\\' ? 2 : 1 }
      else if (c === '[') 깊이++
      else if (c === ']') 깊이--
      i++
    }
    out.push(src.slice(시작, i - 1))
  }
  return out
}
const 줄 = []
for (const f of ['src/data/weekly.js', 'src/data/seed.js', 'src/data/basics.js', 'src/data/paidPacks.js'])
  for (const 덩 of 재료덩어리(읽기(f)))
    for (const s of 덩.matchAll(/'((?:[^'\\]|\\.)*)'/g)) 줄.push(s[1].replace(/\\'/g, "'"))

// 🔒 구멍이 되살아나면 죽는다 — 소제목이 하나도 안 보이면 짧게 끊어 읽은 것이다
if (!줄.some((l) => /^\[.*\]$/.test(l))) {
  console.error('\n⛔ 재료에서 «소제목»(「[국물]」 같은 줄)이 한 개도 안 보인다 — 짧게 끊어 읽고 있다.')
  console.error('   📌 2026-08-15: 소제목의 `]` 에서 멈춰 **234줄을 못 보고 있었다**(검사는 초록불이었다).\n')
  process.exit(1)
}

// ── 앱과 «같은» 판정
const 덮나 = (줄글) => {
  const t = 줄글.split(/[\s,()·/]+/).filter(Boolean)
  return 제품.some((p) => 줄글.includes(p.name) || p.words.some((w) => t.some((x) => x.startsWith(w))))
}

let 안팜 = 0, 이미 = 0, 붙음 = 0
// 🚫 창업자가 «못 만든다»고 한 것 — 다시 묻지 않는다 (docs/재료링크-안만드는것-2026-09-12.md)
//    ⛔ 목록에 또 올리면 창업자가 매번 다시 판단한다. 까닭은 그 문서에 있다.
// ⭐ 목록은 `scripts/안만드는재료.json` 한 곳에만 있다 — 베껴 쓰면 반드시 갈린다.
const 안만드는것 = new Set(JSON.parse(readFileSync(join(뿌리, 'scripts/안만드는재료.json'), 'utf8')).안만드는것)
const 셈 = new Map()
// 🔤 앱 `ingLinks.js` 의 낱말 경계와 «같은» 글자여야 한다 — 다르면 이 목록이 앱보다 덜 본다.
const 낱말경계 = /[\s,()·/+—-]/
// 🚱 안 사는 것이 «낱말»로 들어있나 — 「후추 톡톡」·「남은 나물」
const 안팖경계 = (n) => {
  const 토막 = n.split(낱말경계).filter(Boolean)
  return 토막.some((t) => 안파는것.has(t))
}
const 경계로덮나 = (n) => {
  for (const k of 표키) {
    let i = n.indexOf(k)
    while (i >= 0) {
      const 앞 = i === 0 || 낱말경계.test(n[i - 1])
      const 끝 = i + k.length
      if (앞 && (끝 === n.length || 낱말경계.test(n[끝]))) return true
      i = n.indexOf(k, i + 1)
    }
  }
  return false
}
for (const l of 줄) {
  if (/^[-—=]|^\[|:$/.test(l.trim())) continue        // 묶음 머리·소제목은 재료가 아니다
  const n = ingredientName(l)
  if (!n) continue
  // ⛔ 「물 500ml」·「따뜻한 밥 1공기」는 `ingredientName()` 이 **통째로** 돌려준다
  //    (살 때 필요한 정보라서 — `utils.js` 「파는단위」). 분량을 떼고 한 번 더 본다.
  //    안 그러면 「물」을 걸러 놓고도 「물 500ml」이 목록에 올라 창업자가 물 링크를 만든다.
  const 짧게 = n.replace(/\s+[0-9]+([./][0-9]+)?\s*[a-zA-Z가-힣]*$/, '').trim()
  // 🚱 「후추 톡톡」·「소금 약간」처럼 «꼬리표»가 붙은 것도 안 사는 것이다 —
  //    낱말 경계로 본다. 안 그러면 창업자가 「후추 톡톡」 링크를 만든다(후추는 이미 안 사기로 정했다).
  if (안파는것.has(n) || 안파는것.has(짧게) || 안팖경계(n)) { 안팜++; continue }
  if (안만드는것.has(n) || 안만드는것.has(짧게)) { 안팜++; continue }   // 🚫 창업자가 못 만든다고 한 것
  // ⛔⛔ [2026-09-12] 여기가 «앱보다 덜 본다»면 창업자가 헛일한다 —
  //    실제로 「버터 15g」이 목록에 올랐다. 앱의 `ingLink()` 는 분량을 떼고(「버터」) 찾아 이미 붙는데,
  //    이 목록은 이름 그대로만 봐서 「만들어야 할 것」으로 세고 있었다.
  //    → 앱과 같은 세 길을 다 본다: ①이름 그대로 ②분량 뗀 말 ③낱말 경계로 표 이름이 들어있나
  if (표키.has(n) || 표키.has(짧게) || 경계로덮나(n)) { 붙음++; continue }
  if (덮나(l)) { 이미++; continue }                    // ⭐ «줄 전체»로 본다(앱과 같게)
  // ✍️ 목록에는 «분량을 뗀 이름»으로 묶어 보여준다 — 창업자는 「달래 30g」이 아니라 「달래」로 링크를 만든다.
  //    ⭐ 이름이 열쇠라 앱은 분량이 붙은 줄도 이 링크로 잇는다(`ingLink` 가 분량을 떼고 찾는다).
  // 🧺 「다진 소고기」·「손질 꽃게」처럼 «꾸밈말»만 다른 것은 한 무리로 센다 —
  //    ⛔ 따로 세면 창업자가 같은 재료 링크를 두 번 만든다 (창업자 *"재료링크 중복좀 빼고 줘"*)
  const 속이름 = (짧게 || n).replace(/^(다진 |간 |갈아 둔 |갈은 |썬 |채썬 |깐 |삶은 |데친 |구운 |볶은 |말린 |건 |생 |냉동 |국내산 |손질 |남은 )/, "").trim()
  const 보일이름 = 속이름 || 짧게 || n
  셈.set(보일이름, (셈.get(보일이름) || 0) + 1)
}
const 남은 = [...셈.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
const 남은합 = 남은.reduce((s, [, v]) => s + v, 0)
const 합 = 안팜 + 이미 + 붙음 + 남은합

console.log(`\n🥬 재료 줄 ${합}개 — 지금 상태`)
console.log(`   🚱 안 사는 것(물·밥·면수…)        ${String(안팜).padStart(4)}줄`)
console.log(`   ✅ 큐레이션 제품이 덮는다           ${String(이미).padStart(4)}줄  (파트너스 이미 붙음 · 창업자 손 0)`)
console.log(`   🔗 이 표로 붙었다                  ${String(붙음).padStart(4)}줄  (${표키.size}개)`)
console.log(`   ⛔ 아직 링크 없다                  ${String(남은합).padStart(4)}줄  (고유 ${남은.length}개)`)
console.log(`   📊 «살 수 있는 재료» 중 덮는 비율 = ${(((이미 + 붙음) / (합 - 안팜)) * 100).toFixed(1)}%`)
for (const k of [10, 20, 50, 100]) {
  if (k > 남은.length) break
  const c = 남은.slice(0, k).reduce((s, [, v]) => s + v, 0)
  console.log(`      ↳ 위에서 ${String(k).padStart(3)}개 더 만들면 ${(((이미 + 붙음 + c) / (합 - 안팜)) * 100).toFixed(1)}%`)
}

const 인자 = process.argv[2]
const N = 인자 === '--전부' ? 남은.length : Math.max(1, Number(인자) || 40)
console.log(`\n📋 만들 차례 — 위에서부터 (${Math.min(N, 남은.length)}개)`)
console.log(`   👉 파트너스 → 링크 생성 → 검색창에 «재료 이름만» → 뜨는 「검색 결과를 공유」 🔗`)
console.log(`   ⛔ 주소를 붙여넣으면 그게 검색어가 된다 (2026-09-08 에 한 번 그랬다)`)
console.log(`   🚚 야채·생재료는 **가장 작은 단위** · **로켓프레시/로켓배송** 으로 (창업자 2026-09-12)`)
console.log(`   ✍️ 이름 뒤에 주소를 붙여서 주면 된다 — 순서가 섞여도·빠져도 괜찮다\n      ⭐ 「가 / 나」 로 묶인 줄은 **주소 하나만** 주면 둘 다 붙는다\n      ⭐ 「계란」과 「달걀」처럼 «다른 말인데 같은 것»도 「계란 / 달걀   주소」 로 묶어 줄 수 있다`)
// ⭐⭐ 「거의 같은 이름」은 «한 줄로 묶어» 준다 — 창업자가 링크를 한 번만 만들게.
//   📮 창업자 2026-09-12 = *"최대한 내가 두번일안하게 잘 설계해줄래"*
//   🔢 실측 = 「다진마늘」(1줄)과 「다진 마늘」(86줄)이 따로 잡힌다. 따로 주면 두 번 만든다.
//   ⛔ 묶는 잣대는 **공백·가운뎃점만 지워 같아지는 것**으로 «좁게» 둔다 —
//      「계란」과 「달걀」은 사람이 봐야 아는 것이라 기계가 묶지 않는다(⛓절대원칙 37: 좁게 시작).
//      ⭐ 대신 넣을 때 `이름A / 이름B` 로 주면 한 링크가 둘에 붙는다(`_판-재료링크넣기.mjs`).
const 납작 = (s) => s.replace(/[\s·]/g, '')
const 묶음 = new Map()
for (const [n, v] of 남은) {
  const k = 납작(n)
  if (묶음.has(k)) { const g = 묶음.get(k); g.이름.push(n); g.수 += v }
  else 묶음.set(k, { 이름: [n], 수: v })
}
const 줄들 = [...묶음.values()].sort((a, b) => b.수 - a.수)
for (const g of 줄들.slice(0, N)) console.log(`${g.이름.join(' / ')}\t(${g.수}편)`)
console.log(`\n   ⭐ 이름이 열쇠라 짝이 밀릴 수 없다. 전수검사 안 해도 된다.`)
if (N < 남은.length) console.log(`   … ${남은.length - N}개 더 — \`node scripts/_판-재료링크목록.mjs --전부\``)
