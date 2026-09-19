#!/usr/bin/env node
// 💰📊 식비 계측 넷을 «지키는» 판 — 2026-09-19
//
// 📮 안녕 세션 → 갤럭시 세션: *"식비 계측 4개 넣어줘 … 가게 «이름»은 절대 보내지 마 … 보내기() 쓰지 마"*
//
// ⛔ 왜 = 식비는 «화면»이 아니라 장보기 «안»의 칸이라 화면봄() 에 안 잡힌다. 넷을 손으로 심었고,
//    손으로 심은 것은 누가 지우거나 보내기() 로 바꿔도 앱은 멀쩡히 돌아 아무도 모른다(2026-09-12 사고).
//
// ⭐ 소스를 «읽어서» 잰다(누가시켰나-0914 과 같은 방식) ＋ 규칙 ④(내용 안 보냄)는 가게 아이디 잣대를 «실제로 돌려» 잰다.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => readFileSync(join(뿌리, p), 'utf8')
let 나쁨 = 0
const 잰다 = (참, 무엇, 값 = '') => { console.log(`  ${참 ? '✅' : '⛔'} ${무엇}${값 ? '  ' + 값 : ''}`); if (!참) 나쁨++ }

console.log('\n💰📊 식비 계측 넷\n')
const stats = 읽기('src/stats.js')
const view = 읽기('src/screens/FoodCostView.jsx')
const shop = 읽기('src/screens/ShopScreen.jsx')
const store = 읽기('src/store.jsx')

// ── ① 네 함수가 있고 «행동보내기» 로만 나간다 (⛔보내기() 금지 · 지난화면=null)
const 함수 = { 식비열림: 'foodcost_open', 식비적음: 'foodcost_added_', 식비예산정함: 'foodcost_budget_set', 식비가게열림: 'foodcost_shop_open_' }
for (const [f, 이름] of Object.entries(함수)) {
  const m = new RegExp(`export function ${f}\\([^)]*\\) \\{([^\\n]*)\\}`).exec(stats)
  const 몸 = m ? m[1] : ''
  잰다(!!m, `① ${f} 가 stats.js 에 있다`)
  잰다(/지난화면 = null/.test(몸) && /행동보내기\(/.test(몸) && !/[^동]보내기\(/.test(몸), `① ${f} = 지난화면=null ＋ 행동보내기() 만 (⛔보내기 금지)`)
  잰다(몸.includes(이름), `① ${f} → «${이름}»`)
}

// ── ② 네 자리에 «심겨» 있다
잰다(/useEffect\(\(\) => \{ 식비열림\(\) \}, \[\]\)/.test(view), '② foodcost_open — FoodCostView 가 붙을 때 한 번 (useEffect [])')
잰다(/store\.addFoodCost\([^\n]*\n\s*식비적음\('direct'\)/.test(view), "② foodcost_added_direct — 적기시트 「적었어요」 (addFoodCost 바로 뒤)")
잰다(!/editFoodCost\([^\n]*\n\s*식비적음/.test(view), '② ⛔「고쳤어요」(editFoodCost) 는 안 센다')
잰다(/store\.shopToFoodCost\(\); 식비적음\('shop'\)/.test(shop), "② foodcost_added_shop — 장보기 「식비에 넣기」 (shopToFoodCost 바로 뒤)")
잰다(/store\.setFoodBudget\(칸, 값\); if \(값\) 식비예산정함\(\)/.test(view), '② foodcost_budget_set — 예산 세우거나 고칠 때만 (⛔지울 때 값=0 은 안 센다)')
잰다(/store\.usedCostShop\(s\.id\); 식비가게열림\(s\.id\)/.test(view), '② foodcost_shop_open — 가게 단추 (usedCostShop 자리 · s.id 만 넘긴다)')
잰다(!/식비가게열림\(s\.name/.test(view) && !/식비가게열림\(s\)/.test(view), '② ⛔ s.name 이나 s 통째로는 안 넘긴다')

// ── ③ 규칙 ④ — 가게 «이름»·금액·메모·날짜는 절대 안 나간다 (함수 몸에 그 낱말이 없다)
const 절 = stats.slice(stats.indexOf('💰💰 [2026-09-19] 식비 넷'), stats.indexOf('export function 식비가게열림') + 200)
잰다(!/\b(name|won|memo|\.d\b|url)\b/.test(절.replace(/\/\/[^\n]*/g, '')), '③ 네 함수 코드에 name·won·memo·d·url 이 없다 (주석 빼고)')
// 아이디 잣대를 «실제로 돌려» 본다 — 기본 목록이면 cs_* 그대로, 아니면 custom
const 잣대m = /const 기본가게아이디 = (\/[^\n]+\/)/.exec(stats)
const 잣대 = 잣대m ? new RegExp(잣대m[1].slice(1, -1)) : null
잰다(!!잣대, '③ 기본가게아이디 잣대가 있다', 잣대m?.[1])
const 보냄 = (id) => (잣대.test(String(id || '')) ? id : 'custom')
잰다(보냄('cs_coupang') === 'cs_coupang', '③ 기본 목록 cs_coupang → cs_coupang')
잰다(보냄('k7f3x9a2') === 'custom', '③ newId() 꼴(유저가 더한 가게) → custom')
잰다(보냄('cs_우리동네마트') === 'custom' && 보냄('쿠팡') === 'custom' && 보냄('') === 'custom' && 보냄(undefined) === 'custom', '③ 한글·빈 값·undefined → custom (이름이 새어 나갈 길 없음)')
// 기본 목록의 아이디가 «전부» 잣대에 맞는다 — 안 맞으면 기본 가게가 custom 으로 뭉개져 갈래를 못 본다
const 기본 = [...store.matchAll(/\{ id: '(cs_[^']+)', name:/g)].map((m) => m[1])
잰다(기본.length >= 9 && 기본.every((id) => 잣대.test(id)), `③ 기본식비가게 ${기본.length}개 아이디가 전부 잣대에 맞는다`, 기본.join(' '))
// newId() 가 cs_ 로 시작하는 일이 없어야 유저 가게가 기본으로 «오해»되지 않는다
잰다(!/cs_/.test((/function newId[^{]*\{([\s\S]*?)\n\}/.exec(store) || [])[1] || 'cs_'), '③ newId() 는 cs_ 접두를 안 만든다')

// ── ④ 지도에 적혀 있다 (다음 세션이 「식비 계측 없다」고 또 심지 않게)
잰다(/foodcost_open/.test(읽기('docs/계측-전체지도-2026-09-17.md')), '④ 계측-전체지도 에 foodcost_* 줄이 있다')

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 식비 계측 넷 다 제자리')
process.exit(나쁨 ? 1 : 0)
