// 📏🔎 **「스푼? 큰술? T?」 — 앱 전수 조사** (2026-09-03)
//
// 📮 창업자 = *"스푼? 큰술? T 이거 앱에서 다 통일하자. **어떤건 T고 어떤건 큰술이고 헷갈려**"*
//
// ⛔ 고치기 «전»에 «어디에 무엇이 얼마나» 있는지부터 센다(규칙 1-1 · 선 리서치).
//    ⭐ 단위는 **세 군데**에 산다 — ①유저가 «고르는» 칸(UNITS) ②앱이 «가진» 레시피(basics.js)
//       ③창업자가 «담은» 레시피(우리집레시피 백업). 셋이 따로 논다.
//
// 쓰기:  node scripts/_probe-단위통일-0903.mjs [우리집레시피백업.json]
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 앱 = join(여기, '..', 'src')

const 말들 = ['큰술', '작은술', '스푼', 'T', 't', '컵', 'g', 'ml', '봉', '포', '개', '알', '줌', '대', '모']
// ⛔ T·t 는 낱말이 아니라 «글자»다 — 「숫자 뒤에 붙은 T」만 센다(「Table」·「t」가 든 영어를 안 세게)
const 잣대 = (말) => (말 === 'T' ? /\d\s*T\b/g : 말 === 't' ? /\d\s*t\b/g : new RegExp(말, 'g'))

function 세기 (줄들) {
  const 셈 = {}
  for (const 말 of 말들) 셈[말] = 0
  for (const s of 줄들) {
    const x = String(s)
    for (const 말 of 말들) 셈[말] += (x.match(잣대(말)) || []).length
  }
  return 셈
}

function 찍기 (이름, 셈, 줄수) {
  const 있는것 = 말들.filter((말) => 셈[말] > 0)
  console.log(`\n📂 ${이름}  (줄 ${줄수})`)
  const 폭 = Math.max(...있는것.map((말) => 말.length), 4)
  console.log('   ' + 있는것.map((말) => 말.padStart(폭)).join(' │ '))
  console.log('   ' + 있는것.map((말) => String(셈[말]).padStart(폭)).join(' │ '))
}

// ── ① 유저가 «고르는» 칸 ───────────────────────────────────
console.log('━━━━━━━━ ① 유저가 «고르는» 칸 (EditorScreen) ━━━━━━━━')
const ed = readFileSync(join(앱, 'screens', 'EditorScreen.jsx'), 'utf8')
const m = ed.match(/const UNITS\s*=\s*\[([^\]]*)\]/)
console.log('   UNITS = ' + (m ? m[1].replace(/\s+/g, ' ').trim() : '⛔ 못 찾음'))
const 안내 = ed.match(/T\s*=\s*큰술[^'"`<]*/)
console.log('   화면 안내 = ' + (안내 ? `「${안내[0].trim()}」` : '⛔ 못 찾음'))
if (m) {
  const 목록 = m[1].split(',').map((x) => x.replace(/['"\s]/g, '')).filter(Boolean)
  const 겹침 = [['T', '큰술'], ['t', '작은술']].filter(([a, b]) => 목록.includes(a) && 목록.includes(b))
  for (const [a, b] of 겹침) {
    console.log(`   🚨 「${a}」와 「${b}」가 **둘 다** 고를 수 있다 — 같은 뜻인데 «두 가지 답»이 된다`)
  }
  if (목록.includes('스푼')) console.log('   ⚠️ 「스푼」도 고를 수 있다')
  else console.log('   ⭐ 「스푼」은 고를 수 «없다» — 그런데 레시피 글에는 있다(아래 ②③)')
}

// ── ② 앱이 «가진» 레시피 ──────────────────────────────────
console.log('\n━━━━━━━━ ② 앱이 «가진» 레시피 (basics.js) ━━━━━━━━')
const bas = readFileSync(join(앱, 'data', 'basics.js'), 'utf8')
const 앱줄 = bas.split('\n')
찍기('basics.js', 세기(앱줄), 앱줄.length)

// ── ③ 창업자가 «담은» 레시피 ──────────────────────────────
const 백업 = process.argv[2]
if (백업 && existsSync(백업)) {
  console.log('\n━━━━━━━━ ③ 창업자가 «담은» 레시피 (우리집레시피) ━━━━━━━━')
  const d = JSON.parse(readFileSync(백업, 'utf8'))
  const 재 = [], 걸 = [], 메 = []
  for (const r of d.recipes) {
    for (const x of (r.ingredients || [])) 재.push(x)
    for (const x of (r.steps || [])) 걸.push(x)
    if (r.memo) 메.push(r.memo)
  }
  찍기('재료칸', 세기(재), 재.length)
  찍기('걸음칸', 세기(걸), 걸.length)
  찍기('메모(창업자 원문)', 세기(메), 메.length)

  // 🚨 한 편 «안»에서 **같은 뜻을 다르게** 쓴 곳 — 창업자가 말한 「헷갈려」가 여기다
  //    ⛔⛔ 첫 판이 「큰술 ＋ 작은술」을 갈림으로 세어 52편이 나왔다 — **그건 갈린 게 아니다.**
  //       큰술과 작은술은 «다른 단위»라 한 레시피에 같이 나오는 게 정상이다(규칙 18 ⓘ).
  //    ✅ 뜻이 같은데 «글자»가 다른 것만 센다.
  const 한뜻 = {
    큰술: [['큰술', /큰술/], ['T', /\d\s*T\b/], ['스푼', /스푼/]],
    작은술: [['작은술', /작은술/], ['t', /\d\s*t\b/]],
  }
  console.log('\n🚨 한 편 «안»에서 **같은 뜻을 두 가지 글자로** 쓴 편  (= 창업자가 말한 「헷갈려」)')
  const 갈린것 = []
  for (const r of d.recipes) {
    const 글 = [...(r.ingredients || []), ...(r.steps || [])].map(String)
    const 흠 = []
    for (const [뜻, 짝들] of Object.entries(한뜻)) {
      const 쓴것 = 짝들.filter(([, re]) => 글.some((x) => re.test(x))).map(([이름]) => 이름)
      if (쓴것.length >= 2) 흠.push(`${뜻} 을 「${쓴것.join('」＋「')}」 로`)
    }
    if (흠.length) 갈린것.push(`${r.title} — ${흠.join(' · ')}`)
  }
  if (갈린것.length) { for (const g of 갈린것) console.log('   · ' + g) } else console.log('   없음')
  console.log(`   → **${갈린것.length}편**`)

  // 📊 한 편이 «어느 글자 하나만» 쓰는 경우도 센다 — 앱 전체로 보면 그것도 갈림이다
  const 편별 = { 큰술: 0, T: 0, 스푼: 0, 작은술: 0, t: 0, 없음: 0 }
  for (const r of d.recipes) {
    const 글 = [...(r.ingredients || []), ...(r.steps || [])].map(String)
    let 하나라도 = false
    for (const 짝들 of Object.values(한뜻)) {
      for (const [이름, re] of 짝들) if (글.some((x) => re.test(x))) { 편별[이름]++; 하나라도 = true }
    }
    if (!하나라도) 편별.없음++
  }
  console.log('\n📊 그 글자를 «쓰는» 편 수 (한 편이 여럿에 들어갈 수 있다)')
  for (const [이름, n] of Object.entries(편별)) console.log(`   ${이름.padEnd(5)} ${String(n).padStart(4)}편`)
} else {
  console.log('\n⚠️ 우리집레시피 백업을 안 줬다 — ③은 건너뛴다')
}

// ── ④ 파서·정리기가 단위를 어떻게 다루나 ────────────────────
console.log('\n━━━━━━━━ ④ 파서·AI 정리기 ━━━━━━━━')
for (const [이름, 길] of [['parseRecipe.js', join(앱, 'parseRecipe.js')], ['tidy.js', join(앱, 'tidy.js')]]) {
  const s = readFileSync(길, 'utf8')
  const 큰술 = (s.match(/큰술/g) || []).length
  const 작은술 = (s.match(/작은술/g) || []).length
  const 스푼 = (s.match(/스푼/g) || []).length
  console.log(`   ${이름.padEnd(16)} 「큰술」${큰술} · 「작은술」${작은술} · 「스푼」${스푼}`)
}
const tidy = readFileSync(join(앱, 'tidy.js'), 'utf8')
console.log('   🚨 tidy.js 가 `fixIngredientUnits` 를 부르나 = ' + (/fixIngredientUnits/.test(tidy) ? '✅ 부른다' : '⛔ **안 부른다** — AI 가 낸 재료는 단위 손질을 안 거친다'))
