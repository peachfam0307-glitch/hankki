// 🥬 재기 — 「집에 흔한 재료만 쓰는 요리」와 「특별히 사야 하는 요리」를 가른다
//
// 📮 창업자 2026-08-10:
//   *"가정에서 많이 소비하고 가지고 있는 공통적인 재료들이 쓰이는 음식부터 하면 좋겠어."*
//   *"그건 특별한 레시피로 올리자(빈도가 적은 재료있는 레시피는)"*
//   → **생활요리 = 흔한 재료만 · 특별한 레시피 = 빈도 낮은 재료가 든 것.**
//
// ⛔⛔ **첫 판은 「특이 재료」가 아니라 「내가 못 읽은 글자」를 세고 있었다.**
//   창업자 원문은 「스팸이나」·「두부한모」·「양파반개」처럼 **재료와 수량이 붙어 있고**,
//   「가득」·「후추넉넉」·「씻어」·「준비하고」 같은 **말**도 재료 줄에 섞여 있다.
//   그걸 낱말로 쪼개 세니 「인생 부대찌개」가 «특이 재료 12개»로 나왔다 —
//   실제로는 스팸·소시지·두부·양파 = **전부 흔한 것**이다.
//   ⛔ 그 순위로 골랐으면 **엉뚱한 걸 위로 올렸을 것이다.**
//
// ⭐ 그래서 **잣대를 「우리가 정제해 쓴 표기」에서 만든다** —
//   ⒜ 기본 레시피 재료(우리가 다듬어 적은 것) ⒝ 주부의 장바구니 제품명·`matches`
//   그리고 창업자 줄에서는 **사전 낱말을 «긴 것부터» 찾아낸다**(「두부한모」 → 두부).
//   📌 「낱말로 쪼개기」가 아니라 **「아는 이름을 찾아내기」**다. 붙어 있어도 걸린다.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { basicRecipes } from '../src/data/basics.js'

// ⛔ `curation.js` 는 `import.meta.glob`(Vite 전용)을 써서 **Node 가 import 를 못 한다.**
//    → 다른 배포 게이트들과 같은 방식으로 **글자로 읽는다**(`check-paperphoto.mjs` 참고).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const curSrc = readFileSync(join(ROOT, 'src/data/curation.js'), 'utf8')
const PRODUCTS = [
  ...[...curSrc.matchAll(/name:\s*'([^']+)'/g)].map((m) => ({ name: m[1], matches: [] })),
  ...[...curSrc.matchAll(/matches:\s*\[([^\]]*)\]/g)].map((m) => ({
    name: '', matches: [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]),
  })),
]

const 백업 = process.argv[2]
const 낼곳 = process.argv[3] || '/tmp'
const d = JSON.parse(readFileSync(백업, 'utf8'))

// 📚 ① 사전 만들기 — 우리가 «정제해 쓴» 이름만
// ⛔⛔ **첫 판은 `w.length >= 2` 라 «한 글자 재료»를 통째로 버렸다** —
//   물·무·파·밥·떡·깨·꿀·굴. **우리 앱에서 제일 흔한 것들이다.**
//   그래서 「물 500ml」·「무 120g」 같은 줄이 전부 ❓«못 읽음»으로 나왔고, 45편 중 39편이 ❓ 로 몰렸다.
//   📌 2글자로 막은 이유는 「무」가 「무염버터」에 걸리는 것이었는데,
//      그건 **substring 으로 찾아서** 생긴 문제지 낱말 자체의 문제가 아니었다.
//   ✅ 그래서 갈랐다 — **2글자 이상은 substring · 한 글자는 «낱말이 통째로 같을 때만»**.
const dict = new Set()
const 한글자 = new Set()
const 넣기 = (w) => {
  if (!w || /\d/.test(w)) return
  if (w.length >= 2) dict.add(w)
  else if (/^[가-힣]$/.test(w)) 한글자.add(w)
}
for (const r of basicRecipes) {
  for (const l of r.ingredients || []) {
    const 밖 = String(l).replace(/[（(][^)）]*[)）]/g, ' ')   // 괄호 안(대체품·설명)은 뺀다
    밖.split(/[\s,·/[\]]+/).forEach(넣기)
  }
}
for (const p of PRODUCTS || []) {
  String(p.name || '').split(/\s+/).forEach(넣기)
  ;(p.matches || []).forEach(넣기)
}
// 🍱 **음식 아이콘 매칭 규칙**도 사전에 넣는다 — 여기에 전복·황태·매생이 같은 «주재료» 이름이 다 있다.
//   ⛔⛔ 첫 판은 사전이 256낱말뿐이라 **전복·게·황태를 «못 읽고» 그냥 넘겼고,
//      안 세니까 「특이 재료 0 = 생활요리」로 나왔다.** 「모르는 것」을 「흔한 것」으로 센 것이다.
//   (`FoodIcon.jsx` 도 Vite 자산을 import 해서 Node 가 못 읽는다 → 글자로 읽는다)
const iconSrc = readFileSync(join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const rulesBlock = iconSrc.slice(iconSrc.indexOf('const ICON_RULES'), iconSrc.indexOf('const EXTRA_NAMES'))
for (const m of rulesBlock.matchAll(/'([가-힣]{2,})'/g)) 넣기(m[1])
// ⚠️ 사전에 섞이면 안 되는 말 — 「없으면」·「약간」은 재료가 아니다
;['없으면', '어떤', '것이든', '또는', '약간', '적당히', '기준', '대신', '넉넉히', '조금', '취향껏',
  '총', '큰술', '작은술', '한줌', '두줌', '재료', '양념', '소스', '준비'].forEach((w) => dict.delete(w))
const words = [...dict].sort((a, b) => b.length - a.length)   // ⭐ 긴 것부터 — 「진간장」이 「간장」보다 먼저

// 🚫 재료가 «아닌» 줄 — 섹션 제목·단위 안내·통째 괄호 메모.
//   ⛔ 이걸 안 걸러내면 「양념」·「계량스푼기준 1큰술 15ml」 같은 줄이 «못 읽은 재료»로 잡혀
//      멀쩡한 레시피가 ❓ 로 밀린다. 재료가 아닌 것을 못 읽었다고 세면 안 된다.
const 비재료 = (line) => {
  const s = String(line).trim()
  if (!s) return true
  if (/^[（(].*[)）]$/.test(s)) return true                     // 줄 전체가 괄호 = 메모
  if (/^(양념|소스|재료|양념장|고명|기타)$/.test(s)) return true  // 섹션 제목
  if (/(기준|밥숟가락|계량|종이컵\s*1컵)/.test(s) && /\d\s*(T|t|ml|큰술|작은술|컵)/.test(s)) return true
  if (/^\d+인분/.test(s)) return true
  return false
}

// 🔎 ② 창업자 재료 줄에서 «아는 이름»을 찾아낸다
const 뽑기 = (line) => {
  let s = String(line).replace(/[（(][^)）]*[)）]/g, ' ')
  const out = []
  for (const w of words) if (s.includes(w)) { out.push(w); s = s.split(w).join(' ') }
  // ⭐ 한 글자는 «낱말이 통째로 같을 때만» — substring 으로 찾으면 「무」가 「무염버터」에 걸린다.
  //   숫자·단위가 붙은 것(「물4T」·「물2」)은 꼬리를 떼고 본다.
  for (const t of s.split(/[\s,·/[\]]+/)) {
    const 머리 = t.replace(/[\d.~/]+.*$/, '')
    if (한글자.has(머리)) out.push(머리)
  }
  return [...new Set(out)]
}

const all = d.recipes || []
const mine = all.filter((r) => !String(r.id).startsWith('basic-'))

// 📊 ③ 빈도 — 218편 전체에서 몇 편에 나오나
const 빈도 = {}
for (const r of all) {
  const seen = new Set()
  for (const l of r.ingredients || []) for (const w of 뽑기(l)) if (!seen.has(w)) { seen.add(w); 빈도[w] = (빈도[w] || 0) + 1 }
}
// ⚠️ 못 읽은 부분은 «세지 않는다» — 「모르는 것」과 「특이한 것」은 다르다(첫 판이 이걸 섞었다)
const 흔함 = (w) => (빈도[w] || 0) >= 6
const 특이 = (w) => (빈도[w] || 0) <= 2

const 결과 = mine.map((r) => {
  const ing = (r.ingredients || []).filter((x) => x && !/^\[/.test(x) && !비재료(x))
  const ws = [...new Set(ing.flatMap(뽑기))]
  // ⭐ 개수만 세면 사람이 판단을 못 한다 — «어느 줄»을 못 읽었는지 그대로 들고 다닌다.
  //   (첫 판은 숫자만 세서 39편이 통째로 ❓ 로 몰렸고, 그 안을 볼 방법이 없었다)
  const 못읽은줄 = ing.filter((l) => 뽑기(l).length === 0)
  const 특 = ws.filter(특이)
  return {
    t: r.title, i: ing.length, s: (r.steps || []).length,
    안: ws.length, 흔: ws.filter(흔함).length, 특, 못읽음: 못읽은줄.length, 못읽은줄,
    갈래: (ing.length >= 5 && (r.steps || []).length >= 3) ? 'ready'
      : (r.steps || []).length === 0 ? 'nosteps' : ing.length <= 1 ? 'raw' : 'thin',
  }
})
writeFileSync(`${낼곳}/흔한재료.json`, JSON.stringify({ 빈도, 결과 }))

const top = Object.entries(빈도).sort((a, b) => b[1] - a[1])
console.log(`\n📚 사전 ${words.length}낱말 (기본 레시피 ${basicRecipes.length}편 ＋ 장바구니 ${PRODUCTS.length}종)`)
console.log(`   6편 이상 = «흔함» ${top.filter(([, n]) => n >= 6).length}개 · 2편 이하 = «특이» ${top.filter(([, n]) => n <= 2).length}개`)
console.log(`\n▶ 제일 흔한 20\n   ${top.slice(0, 20).map(([w, n]) => `${w}(${n})`).join(' · ')}`)

// 🏷 세 갈래 — ⭐⭐ **「모른다」를 «따로» 둔다.**
//   ⛔ 첫 판은 「못 읽은 줄」을 그냥 넘겨서 **전복솥밥·양념게장·황태국을 「생활요리」로 올렸다.**
//      사전에 없으면 특이 재료로도 안 잡히니 오히려 «깨끗한 요리»처럼 보인 것이다.
//   📌 **「모르는 것」과 「흔한 것」은 다르다.** 못 읽은 줄이 있으면 사람이 봐야 한다.
const 갈래표 = (x) => {
  if (x.못읽음 > 0) return '❓ 모름'
  if (x.특.length === 0) return '🏠 생활요리'
  return '⭐ 특별'
}
const ready = 결과.filter((x) => x.갈래 === 'ready')
  .sort((a, b) => (a.못읽음 - b.못읽음) || (a.특.length - b.특.length) || (b.흔 - a.흔))
console.log(`\n▶ 「바로 쓸 수 있는 ${ready.length}편」 — 확실한 것부터`)
ready.forEach((x, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${갈래표(x)}  ${x.t}   (재료 ${x.i} · 아는 것 ${x.안}${x.특.length ? ' · 특이 ' + x.특.join(',') : ''}${x.못읽음 ? ' · ❓못 읽은 줄 ' + x.못읽음 : ''})`)
})
const c = (t) => ready.filter((x) => 갈래표(x) === t).length
console.log(`\n   🏠 생활요리 ${c('🏠 생활요리')} · ⭐ 특별 ${c('⭐ 특별')} · ❓ 모름 ${c('❓ 모름')}`)
console.log('   ⭐ ❓ 는 「특이하다」가 아니라 «내가 못 읽었다»다 — 창업자가 보면 0.5초에 갈린다.')

// 🔎 ⭐ 못 읽은 줄을 «그대로» 찍는다 — 개수만 세면 사람이 손댈 수가 없다.
//   여기 나오는 줄이 ⒜사전에 없는 흔한 재료면 → 사전에 넣는다
//                  ⒝진짜 특이 재료면 → ⭐특별 로 간다
//                  ⒞재료가 아닌 말이면 → 세지 말아야 한다
const 못읽은전부 = ready.flatMap((x) => x.못읽은줄)
console.log(`\n▶ ❓ 못 읽은 줄 전부 (${못읽은전부.length}줄) — 이게 무엇인지가 다음 한 걸음이다`)
const 묶음 = {}
for (const l of 못읽은전부) 묶음[l] = (묶음[l] || 0) + 1
Object.entries(묶음).sort((a, b) => b[1] - a[1])
  .forEach(([l, n]) => console.log(`   ${n > 1 ? `(${n}) ` : '    '}${l}`))
