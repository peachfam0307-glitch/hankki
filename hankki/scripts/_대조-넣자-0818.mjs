// 🔎 「넣자」로 고른 편들 전수 대조 — ①이미 앱에 있나 ②서로 겹치나
//
// 📮 창업자 2026-08-18 = *"이 안에서 겹치거나 올라간 것 있나 재료, 순서로 전수검사해줘."*
//
// ⛔⛔ **오늘 이 대조를 한 번 크게 틀렸다** — 재료·순서를 «글자 조각»으로 견줬더니
//    「달래장 ↔ 제육볶음」·「약밥 ↔ 샤브샤브」·「육회 ↔ 들기름 막국수」가 같은 요리로 묶였다.
//    까닭 = **간장·설탕·참기름 같은 «흔한 양념»만 겹쳐도 닮음이 1.0** 이 나온다.
//    ✅ 그래서 흔한 양념·조리 낱말을 **빼고 «주재료»만** 본다.
//
// ⛔ 앱에 들어갔나는 이름표(origin)가 우선이다 — 이 도구는 «이름표가 아직 없는» 짝을 찾는 보조다.
//
// 쓰기:  node scripts/_대조-넣자-0818.mjs <고른목록.txt>
import { readFileSync, readdirSync } from 'node:fs'

const 목록파일 = process.argv[2]
if (!목록파일) { console.error('⛔ 고른 목록 파일을 달라'); process.exit(1) }
const 넣자 = readFileSync(목록파일, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)

const 창고 = new URL('../docs/_내레시피-백업/', import.meta.url)
const 파일들 = readdirSync(창고).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
const d = JSON.parse(readFileSync(new URL(파일들[파일들.length - 1], 창고), 'utf8'))
const 내것 = d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))

const src = readFileSync(new URL('../src/data/basics.js', import.meta.url), 'utf8')
const 앱 = src.split('\n  {\n').slice(1).map((b) => ({
  t: (b.match(/title: '([^']+)'/) || [])[1],
  ing: (b.match(/ingredients: \[([\s\S]*?)\n    \]/) || [])[1] || '',
  st: (b.match(/steps: \[([\s\S]*?)\n    \]/) || [])[1] || '',
  이름표: /origin: *'창업자'/.test(b),
  원: (b.match(/원래 이름 「([^」]+)」/) || [])[1],
})).filter((x) => x.t)

// ⭐ 흔한 양념·조리 낱말 — 이걸 빼야 「주재료가 같은가」를 본다
const 흔함 = new Set(`간장 진간장 국간장 맛간장 설탕 소금 후추 후춧가루 참기름 들기름 올리브유 식용유 마늘 다진마늘
물 맛술 청주 식초 올리고당 물엿 매실청 통깨 참깨 고춧가루 고추장 된장 액젓 초피액젓 멸치액젓 까나리액젓
대파 양파 청양고추 생강 육수 해물가루육수 아우노슈가 백간장 연두 전분 감자전분 튀김가루 부침가루 밥
넣고 넣어 넣는다 볶아 볶는다 끓여 끓인다 섞어 섞는다 썰어 썬다 준비 완성 그리고 하면 해서 주세요 해요
적당량 약간 조금 한줌 넉넉히 그릇 냄비 프라이팬 팬 중불 약불 센불 정도 위에 함께 같이 뿌려 부어 담아`.split(/\s+/))
const 낱말 = (s) => new Set(String(s).replace(/[^가-힣]/g, ' ').split(/\s+/).filter((w) => w.length >= 2 && !흔함.has(w)))
const 자카드 = (a, b) => (a.size && b.size ? [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size : 0)

// 백업을 «열쇠»로 담는다 — 같은 제목이 여럿이면 (1)(2)
const 셈 = new Map()
for (const r of 내것) { const t = (r.title || '').trim(); 셈.set(t, (셈.get(t) || 0) + 1) }
const 본 = new Map()
const 백 = new Map()
for (const r of 내것) {
  const t = (r.title || '').trim()
  const n = (본.get(t) || 0) + 1; 본.set(t, n)
  const 키 = (셈.get(t) || 0) > 1 ? `${t} (${n})` : t
  백.set(키, {
    t,
    w: new Set([...낱말((r.ingredients || []).join(' ')), ...낱말((r.steps || []).join(' '))]),
    재: (r.ingredients || []).filter((x) => String(x).trim()).length,
    순: (r.steps || []).filter((x) => String(x).trim()).length,
  })
}

const 못찾음 = 넣자.filter((n) => !백.has(n))
console.log(`「넣자」 ${넣자.length}편 · 백업에서 찾음 ${넣자.length - 못찾음.length}편`)
if (못찾음.length) console.log(`   ⛔ 못 찾음: ${못찾음.join(' · ')}`)

console.log('\n═══ ① 이미 앱에 올라간 것 ═══')
let 있 = 0
for (const n of 넣자) {
  const b = 백.get(n); if (!b || b.w.size < 4) continue
  let best = [0, null]
  for (const x of 앱) {
    const j = 자카드(b.w, new Set([...낱말(x.ing), ...낱말(x.st)]))
    if (j > best[0]) best = [j, x]
  }
  if (best[0] >= 0.30) { 있++; console.log(`  ⚠️ ${n.padEnd(24)} ↔ 앱 「${best[1].t}」  닮음 ${best[0].toFixed(2)}${best[1].이름표 ? '  (이름표 있음)' : ''}`) }
}
if (!있) console.log('  ✅ 없음 — 104편 다 새것이다')

console.log('\n═══ ② 「넣자」끼리 겹치는 것 ═══')
let 겹 = 0
const ns = 넣자.filter((n) => 백.has(n))
for (let i = 0; i < ns.length; i++) {
  for (let j = i + 1; j < ns.length; j++) {
    const a = 백.get(ns[i]), b = 백.get(ns[j])
    if (a.w.size < 4 || b.w.size < 4) continue
    const s = 자카드(a.w, b.w)
    if (s >= 0.35) { 겹++; console.log(`  ⚠️ ${ns[i].padEnd(22)} ↔ ${ns[j].padEnd(22)} 닮음 ${s.toFixed(2)}  (재료 ${a.재}/${b.재} · 순서 ${a.순}/${b.순})`) }
  }
}
if (!겹) console.log('  ✅ 없음')

console.log('\n═══ ③ 재료가 너무 적어 판정 못 한 것 ═══')
const 적 = ns.filter((n) => 백.get(n).w.size < 4)
console.log(적.length ? `  ⚠️ ${적.length}편 — ${적.join(' · ')}` : '  ✅ 없음')
