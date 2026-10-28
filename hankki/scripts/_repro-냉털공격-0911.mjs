// 🗡🗡 냉장고 추천 — «일부러 잘못 굴려서» 구멍을 찾는다 (2026-09-11)
//
// 📮 창업자 = *"구멍있는지 다시 확인 여러갈래로시뮬레이션돌려"*
// ⛔ 절대원칙 33 = 세 각도(사람·사고·규모)로 흔든 «뒤에» 보고한다.
//    이 판은 **2차(사고)** 다 — 잘못될 수 있는 것을 일부러 일으킨다.
import { allBasicRecipes } from '../src/data/basics.js'
import { rankPantryRecipes, hasIngredient, ingredientTokens, pantryKey, 급하다, 상했나, countPantryHitsWeighted } from '../src/pantryMatch.js'
import { todayKST } from '../src/today.js'

let 죽음 = 0
const 칸 = (참, 이름, 말 = '') => { console.log(`${참 ? '✅' : '❌'} ${이름}${말 ? ' · ' + 말 : ''}`); if (!참) 죽음++ }
const 오늘 = Date.parse(todayKST() + 'T00:00:00Z')
const 남은날 = (p) => (p?.expiry ? Math.round((Date.parse(p.expiry) - 오늘) / 86400000) : null)
// ⛔ 날짜를 여기서 만들지 않는다 — todayKST 에 «그 시각»을 넘긴다(절대원칙 27)
const D = (n) => todayKST(new Date(오늘 + n * 86400000))
const 열린것 = allBasicRecipes.filter((r) => !r.from || r.from <= todayKST())
const 세우기 = (칸들) => rankPantryRecipes(열린것, 칸들, 남은날)
const T = (r) => ingredientTokens(r.ingredients)
const 셈 = (이름) => 열린것.filter((r) => hasIngredient(T(r), pantryKey(이름))).length

console.log('\n── ① 🗡 이상한 이름을 넣어도 «안 죽고, 엉뚱한 게 안 나온다» ──')
{
  const 소고기편 = 셈('소고기')
  const 쓰레기 = ['', '   ', '()', '( )', '···', '///', '1kg', '300g', '2개', '1', '...', '???',
    '🥩', 'beef', 'BEEF', '  두부  ', '두부\n', '소', '돼지', '닭', '오리', '한우', '소소고기', '고기고기']
  for (const n of 쓰레기) {
    let 났나 = null, 편 = -1
    try { 편 = 세우기([{ name: n }]).length } catch (e) { 났나 = e.message }
    칸(났나 === null, `안 죽는다 — 「${JSON.stringify(n)}」`, 났나 || `${편}편`)
  }
  // ⛔ 한 글자·빈 것이 «수십 편»을 끌고 오면 안 된다
  for (const n of ['', '   ', '()', '1', '???', '🥩']) 칸(세우기([{ name: n }]).length === 0, `「${JSON.stringify(n)}」은 0편이라야 한다`, `${세우기([{ name: n }]).length}편`)
  // ⭐ 앞뒤 공백은 «있어도 같은 결과»
  칸(셈('  두부  ') === 셈('두부'), '앞뒤 공백이 있어도 같다', `${셈('  두부  ')} = ${셈('두부')}`)
  // ⛔ 「소소고기」는 소고기로 끝나니 걸리는 게 맞다 · 「고기고기」도 「고기」로 끝난다
  칸(셈('소소고기') === 소고기편, '「소소고기」는 소고기로 친다', `${셈('소소고기')}편`)
  // ⛔ 접두어만 쓴 것이 «부위 규칙»을 발동시키면 안 된다
  칸(셈('소') <= 1, '「소」 한 글자가 소고기 전부를 끌어오지 않는다', `${셈('소')}편`)
  칸(셈('한우') === 소고기편, '「한우」는 소고기(사전에 있다)', `${셈('한우')}편`)
}

console.log('\n── ② 🗓 유통기한이 깨졌거나 말이 안 될 때 ──')
{
  const 깨진것 = [null, undefined, '', 'abc', '2026-13-45', '0000-00-00', '9999-99-99', '2026/09/11', 12345]
  for (const e of 깨진것) {
    let 났나 = null
    try { 세우기([{ name: '두부', expiry: e }]) } catch (err) { 났나 = err.message }
    칸(났나 === null, `안 죽는다 — expiry=${JSON.stringify(e)}`, 났나 || '')
  }
  // ⛔ 깨진 날짜를 «급하다»로 읽으면 안 된다 (NaN 은 어느 쪽도 아니어야 한다)
  칸(!급하다(NaN) && !상했나(NaN), '깨진 날짜(NaN)는 급하지도 상하지도 않다')
  칸(!급하다(null) && !상했나(null), '날짜를 안 적으면 급하지도 상하지도 않다')
  // 🗓 말도 안 되는 먼 날짜·아주 지난 날짜
  칸(!급하다(3650) && !상했나(3650), '10년 뒤는 급하지 않다')
  칸(상했나(-3650) && !급하다(-3650), '10년 지난 것은 상한 것으로 친다')
  const 먼것 = 세우기([{ name: '두부', expiry: D(3650) }])
  칸(먼것.length > 0 && 먼것.every((m) => m.급함 === 0), '10년 뒤 두부는 걸리되 «급함»은 0', `${먼것.length}편`)
  const 상한것 = 세우기([{ name: '두부', expiry: D(-3650) }])
  칸(상한것.length === 0, '10년 지난 두부는 «아예 안 센다»', `${상한것.length}편`)
  // ⭐ 경계 — 어제(-1)는 급하고, 그저께(-2)는 안 센다
  칸(세우기([{ name: '두부', expiry: D(-1) }]).some((m) => m.급함 > 0), '하루 지남(-1)은 급하다')
  칸(세우기([{ name: '두부', expiry: D(-2) }]).length === 0, '이틀 지남(-2)은 안 센다')
  칸(세우기([{ name: '두부', expiry: D(3) }]).some((m) => m.급함 > 0), 'D-3 은 급하다')
  칸(세우기([{ name: '두부', expiry: D(4) }]).every((m) => m.급함 === 0), 'D-4 는 안 급하다')
}

console.log('\n── ③ 🔁 같은 재료를 여러 번 담아도 «한 번»으로 센다 ──')
{
  const 하나 = 세우기([{ name: '두부' }])
  const 셋 = 세우기([{ name: '두부' }, { name: '두부' }, { name: '국산두부' }])
  칸(하나.length === 셋.length, '같은 재료를 세 번 담아도 걸린 편이 같다', `${하나.length} = ${셋.length}`)
  const a = countPantryHitsWeighted(열린것.find((r) => hasIngredient(T(r), '두부')), [{ name: '두부' }, { name: '두부' }])
  칸(a.n === 1, '개수도 «1개»로 센다', `${a.n}개`)
  // ⛔ 부위 사전으로 이어진 것도 중복이면 한 번
  const b = 세우기([{ name: '채끝' }, { name: '부채살' }, { name: '토시살' }])
  const c = 세우기([{ name: '소고기' }])
  칸(b.length === c.length, '소고기 부위를 셋 담아도 걸린 편은 소고기와 같다', `${b.length} = ${c.length}`)
  const 편 = 열린것.find((r) => hasIngredient(T(r), '소고기'))
  칸(countPantryHitsWeighted(편, [{ name: '채끝' }, { name: '부채살' }]).n === 2, '⚠️ 다만 «개수»는 둘로 센다 (이름이 다르니까)', '채끝·부채살 = 2개')
}

console.log('\n── ④ 🧊 냉장고가 아주 크거나 아주 작을 때 ──')
{
  칸(세우기([]).length === 0, '빈 냉장고 = 0편')
  const 백칸 = Array.from({ length: 100 }, (_, i) => ({ name: ['두부','계란','대파','양파','당근','소고기','돼지고기','김치','버섯','감자'][i % 10], expiry: i % 3 ? null : D(1) }))
  const t = Date.now(); const 큰것 = 세우기(백칸); const 걸린시간 = Date.now() - t
  칸(큰것.length > 0, '100칸도 돈다', `${큰것.length}편 · ${걸린시간}ms`)
  칸(걸린시간 < 300, '100칸이 300ms 안에 끝난다 (타이핑이 안 버벅인다)', `${걸린시간}ms`)
  // ⛔ 줄 세우기가 «흔들리지 않는다»
  const x = 세우기(백칸).map((m) => m.r.id).join()
  const y = 세우기(백칸).map((m) => m.r.id).join()
  칸(x === y, '같은 냉장고면 «늘 같은 순서»')
}

console.log('\n── ⑤ 🥬 고기를 하나도 안 먹는 사람 ──')
{
  const 채식 = [{ name: '두부', expiry: D(1) }, { name: '애호박' }, { name: '버섯' }, { name: '양파' }, { name: '대파' }]
  const m = 세우기(채식)
  칸(m.length > 0, '채소만 있어도 추천이 나온다', `${m.length}편`)
  칸(m.some((x) => x.급함 > 0), '임박 두부가 급함으로 잡힌다')
  // ⛔ 고기 접두 규칙이 «채소 이름»을 건드리면 안 된다
  // ⛔⛔ 첫 판은 «레시피 제목»으로 봤다가 거짓 빨간불이 났다 —
  //    「소금」으로 걸린 51편 중 「소고기 미역국」 같은 제목이 18편 있을 뿐이고,
  //    재료로 다시 세니 «소금이 안 든 편 0개»로 멀쩡했다. 📌 규칙 18 ⓘ — 검사가 «무엇을» 보는지.
  // ✅ 그래서 «그 재료가 실제로 든 편인가»를 재료 낱말로 확인한다.
  for (const n of ['소금', '소면', '소스', '닭볶음탕용떡', '오이', '오징어', '닭강정소스']) {
    const 걸린것 = 세우기([{ name: n }])
    const 가짜 = 걸린것.filter((x) => !T(x.r).some((t) => t === pantryKey(n) || t.endsWith(pantryKey(n)) || pantryKey(n).endsWith(t)))
    칸(가짜.length === 0, `⚠️ 「${n}」이 엉뚱한 편을 안 끌어온다`, `${걸린것.length}편 중 가짜 ${가짜.length}`)
  }
}

console.log('\n── ⑥ ✂️ 두 줄로 가를 때 «한 편도 안 잃는다» (여러 냉장고로) ──')
{
  const 냉장고들 = [
    ['임박 0', [{ name: '계란' }, { name: '김' }]],
    ['임박 1', [{ name: '두부', expiry: D(1) }, { name: '계란' }]],
    ['임박 다수', [{ name: '두부', expiry: D(1) }, { name: '양파', expiry: D(0) }, { name: '대파', expiry: D(2) }, { name: '소고기' }]],
    ['전부 임박', Array.from({ length: 8 }, (_, i) => ({ name: ['두부','양파','대파','계란','버섯','우유','당근','감자'][i], expiry: D(i % 4) }))],
    ['정육만', [{ name: '채끝', expiry: D(1) }, { name: '항정살' }, { name: '오리로스' }]],
    ['괄호만', [{ name: '소고기(채끝)', expiry: D(0) }, { name: '계란(특란)' }]],
  ]
  for (const [이름, 칸들] of 냉장고들) {
    const all = 세우기(칸들)
    const 윗 = all.filter((m) => m.급함 > 0).slice(0, 12)
    const 윗id = new Set(윗.map((m) => m.r.id))
    const 아랫 = all.filter((m) => !윗id.has(m.r.id))
    칸(윗.length + 아랫.length === all.length, `「${이름}」 — 합치면 전부`, `${윗.length} ＋ ${아랫.length} = ${all.length}`)
    칸(윗.every((m) => m.급함 > 0), `「${이름}」 — 윗줄은 급한 것만`)
    칸(윗.length <= 12, `「${이름}」 — 윗줄 12장 이하`, `${윗.length}장`)
  }
}

console.log(죽음 ? `\n❌❌ ${죽음}칸 실패 — 구멍이 있다` : '\n✅✅ 공격 전부 막았다')
process.exit(죽음 ? 1 : 0)
