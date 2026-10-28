// 🎥 영상 대조 — SNS 편을 «본 영상»에 맞대 차이를 칸칸이 찍는다
//
// 📮 창업자 2026-10-28 17:47 = 「이건 내가 알수가 없으니까 정말 네가 잘 걸러야해. 도구 촘촘하게 만들고
//    크로스 체크하고. 무조건 유튜브 본 영상이 주가되도록」
//    규칙 전문 = docs/레시피-출처-규칙-2026-09-27.md 맨 아래(🎥🎥)
//
// 세 출처를 맞댄다:  ⓐ영상(힉스필드 분석 · 장면마다 초＋말＋화면) = ⭐기준
//                    ⓑ설명란(yt.mjs video)                        = 한국어 낱말·영상에 안 나온 분량
//                    ⓒ우리 글(basics.js · recipe.mjs 와 같은 값)
//
// 찍는 것 (하나라도 있으면 exit 1 — 고치거나 «왜 그대로인지» 주석을 남긴 뒤 넘어간다):
//   ① 분량   — 영상에서 말한 「숫자＋단위」가 우리 글에 없다 / 우리 글 숫자가 영상에 없다
//   ② 재료   — 영상에 나온 재료가 우리 재료에 없다 / 우리 재료가 영상에 안 나온다
//   ③ 불·시간 — 영상의 약불·중불·센불·N분이 우리 순서에 없다
//   ④ 순서   — 재료가 처음 들어가는 차례가 영상과 우리 글이 다르다
//   ⑤ 설명란 — 설명란 분량이 영상과 다르다(어느 쪽이 맞는지는 영상이 정한다)
//   ❓ 사전에 없는 영어 낱말 — 기계가 못 가른 것. «내가 눈으로» 그 초를 본다
//
// 쓰기:
//   node hankki/scripts/영상대조.mjs <분석.json> --id <레시피id> [--설명란 <yt.json>] [--갈래 origin/hold/…]
//   분석.json = video_analysis_status 의 result 를 그대로 저장한 것(scenes 배열이 있으면 된다)
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const 인자 = process.argv.slice(2)
const 값 = (k) => { const i = 인자.indexOf(k); return i < 0 ? null : 인자[i + 1] }
const 분석파일 = 인자[0]; const id = 값('--id'); const 갈래 = 값('--갈래'); const 설명파일 = 값('--설명란')
if (!분석파일 || !id) { console.error('쓰기: 영상대조.mjs <분석.json> --id <레시피id> [--설명란 yt.json] [--갈래 …]'); process.exit(1) }

// ── 우리 글 ────────────────────────────────────────────────
async function 레시피들() {
  if (!갈래) return (await import('./recipe.mjs')).레시피들()
  const 글 = execFileSync('git', ['show', `${갈래}:hankki/src/data/basics.js`], { encoding: 'utf8', maxBuffer: 64 << 20 })
  const 임시 = new URL(`../src/data/.영상대조-${process.pid}.js`, import.meta.url)
  writeFileSync(임시, 글)
  try { return (await import(임시.href)).allBasicRecipes } finally { rmSync(임시, { force: true }) }
}
const r = (await 레시피들()).find((x) => x.id === id)
if (!r) { console.error(`⛔ 레시피 ${id} 없음`); process.exit(1) }
const 분석 = JSON.parse(readFileSync(분석파일, 'utf8'))
const 장면 = (분석.result || 분석).scenes || []
let 설명 = ''
if (설명파일) { const j = JSON.parse(readFileSync(설명파일, 'utf8')); 설명 = (Array.isArray(j) ? j : [j]).find((v) => (r.sourceUrl || '').includes(v.id))?.설명란 || '' }

// ── 영어 → 우리말 사전 (분석의 «말»이 영어로 온다) ─────────────
// ⚠️ 클로드가 적은 사전이다. 못 찾은 낱말은 ❓로 찍혀 사람이 본다 — 늘리면서 쓴다.
const 사전 = [   // 값이 「가|나」면 아무거나 맞으면 된다 · ⚠️ 순서 중요(긴 말 먼저)
  [/perilla oil/, '들기름'], [/sesame oil/, '참기름'], [/olive oil/, '올리브'], [/sesame (seeds?|powder)/, '깨'],
  [/cooking oil|vegetable oil|\boil\b/, '식용유|기름'],
  [/soy sauce/, '간장'], [/oyster sauce/, '굴소스'], [/fish sauce/, '액젓'], [/plum (extract|juice|syrup)/, '매실'],
  [/starch syrup|corn syrup|oligosaccharide/, '물엿|올리고당'], [/garlic scapes?/, '마늘쫑'], [/minced garlic|\bgarlic\b/, '마늘'],
  [/green onions?|scallions?/, '파'], [/\bonions?\b/, '양파'], [/(red )?chili powder|red pepper powder|gochugaru/, '고춧가루'],
  [/kkwari|shishito/, '꽈리'], [/\bsalt\b/, '소금'], [/\bsugar\b/, '설탕'], [/\bmsg\b/, '미원'], [/black pepper/, '후추'],
  [/doenjang|soybean paste/, '된장'], [/gochujang/, '고추장'], [/\bwater\b/, '물'], [/pork belly/, '삼겹살'], [/\bpork\b/, '돼지|삼겹살'],
  [/\bbeef\b/, '소고기'], [/\beggs?\b/, '계란|달걀'], [/radish/, '무'], [/cabbage|eolgari/, '얼갈이'], [/vinegar/, '식초'],
  [/butter/, '버터'], [/\bmilk\b/, '우유'], [/cheese/, '치즈'], [/tofu/, '두부'], [/\brice\b/, '밥'],
]
const 불사전 = [[/medium[- ]high heat/, '중강불'], [/medium[- ]low heat/, '중약불'], [/low heat/, '약불'], [/medium heat/, '중불'], [/high heat/, '센불|강불']]
const 숫자말 = { one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5, a: 1 }
const 단위말 = [[/tablespoons?|tbsp|spoonfuls?|spoons?/, '큰술'], [/teaspoons?|tsp/, '작은술'], [/\bml\b|milliliters?/, 'ml'], [/\bg\b|grams?/, 'g'],
  [/\bkg\b/, 'kg'], [/cups?/, '컵'], [/minutes?/, '분'], [/pinch/, '꼬집'], [/cloves?/, '알']]
const 한국단위 = '큰술|작은술|g|kg|ml|컵|분|알|대|꼬집'
const 정분량 = (s) => s.replace(/\s+/g, '').replace(/스푼|숟가락|술(?!큰)/g, '큰술').replace(/큰큰술/g, '큰술')
const 분량뽑기 = (s) => new Set([...정분량(s).matchAll(new RegExp(`(\\d+(?:\\.\\d+)?(?:\\/\\d+)?)(${한국단위})`, 'g'))].map((m) => `${m[1]}${m[2]}`))

const 한국어 = /[가-힣]/
function 영상분량(말) {
  const 나 = [...분량뽑기(말)]   // 한국어 자막이 그대로 올 때(얼갈이 편)
  const 소 = 말.toLowerCase()
  for (const m of 소.matchAll(/(\d+(?:\.\d+)?(?:\/\d+)?|one|two|three|four|five|half|a)\s+(?:of\s+)?(tablespoons?|tbsp|spoonfuls?|spoons?|teaspoons?|tsp|ml|milliliters?|g|grams?|kg|cups?|minutes?|pinch|cloves?)\b/g)) {
    const n = 숫자말[m[1]] ?? m[1]; const u = 단위말.find(([re]) => re.test(m[2]))?.[1]
    if (u) 나.push(`${n}${u}`)
  }
  for (const m of 소.matchAll(/(\d+)\s*ml/g)) 나.push(`${m[1]}ml`)
  return [...new Set(나)]
}

// ── 우리 글 ────────────────────────────────────────────────
const 우리재료 = (r.ingredients || []).filter((s) => !/^\[.*\]$/.test(s))
const 우리전부 = [...우리재료, ...(r.steps || [])].join(' \n ')
const 우리분량 = 분량뽑기(우리전부)
const 재료이름 = (s) => s.replace(/\(.*?\)/g, '').replace(/\s*\d.*$/, '').trim()
const 우리이름들 = 우리재료.map(재료이름).flatMap((n) => n.split(/[\s/]+/)).filter((w) => w.length >= 1)
const 있나 = (k) => k.split('|').some((x) => 우리전부.includes(x))

const 재료낱말 = (말) => {
  const 나 = []
  if (한국어.test(말)) { for (const w of 우리이름들) if (w.length >= 2 && 말.includes(w)) 나.push(w); return 나 }
  let 남 = 말.toLowerCase()
  for (const [re, ko] of 사전) if (re.test(남)) { 나.push(ko); 남 = 남.replace(new RegExp(re.source, 'g'), ' ') }
  return 나
}

// ── 영상 줄 세우기 ─────────────────────────────────────────
const 줄 = 장면.map((s) => ({ t: s.timestamp_start, 말: (s.audio || '').replace(/^.*Narrator:\s*/i, '').replace(/^"|"$/g, ''), 화면: s.visual || '' }))
const 영상분량들 = new Map()   // 분량 → 처음 «말한» 초
const 영상재료 = new Map()      // 재료 → 처음 «말한» 초 (순서 비교는 이것만)
const 화면만 = new Map()        // 말엔 없고 화면에만 보인 재료 — 순서엔 안 쓰고 «있다»로만 본다
const 영상불 = []
for (const z of 줄) {
  for (const q of 영상분량(z.말)) if (!영상분량들.has(q)) 영상분량들.set(q, z.t)
  for (const k of 재료낱말(z.말)) if (!영상재료.has(k)) 영상재료.set(k, z.t)
  for (const k of 재료낱말(z.화면)) if (!영상재료.has(k) && !화면만.has(k)) 화면만.set(k, z.t)
  for (const k of 한국어.test(z.말) ? (z.말.match(/중약불|중강불|약불|중불|센불|강불/g) || []) : []) 영상불.push([z.t, k])
  for (const [re, ko] of 불사전) if (re.test(z.말.toLowerCase())) { 영상불.push([z.t, ko]); break }
}
const 설명분량 = 분량뽑기(설명.split('\n').filter((l) => !l.includes('=')).join(' '))   // 「1큰술 = 15ml」 같은 계량 안내는 뺀다

const 걸림 = []
// ① 분량 — 영상이 주. 영상이 말 안 한 분량은 설명란에 있으면 통과(영상에 안 나온 분량 = 설명란)
for (const [q, t] of 영상분량들) if (!우리분량.has(q)) 걸림.push(['① 분량', `영상 ${t} 「${q}」 — 우리 글에 없다`])
for (const q of 우리분량) if (!영상분량들.has(q) && !설명분량.has(q)) 걸림.push(['① 분량', `우리 글 「${q}」 — 영상에도 설명란에도 없다(눈으로)`])
// ② 재료
for (const [k, t] of [...영상재료, ...화면만]) if (!있나(k)) 걸림.push(['② 재료', `영상 ${t} 「${k.split('|')[0]}」 — 우리 글에 없다`])
const 영상말전부 = 줄.map((z) => z.말).join(' ')
for (const s of 우리재료) {
  const 이름 = 재료이름(s); if (!이름) continue
  const 맞음 = [...영상재료.keys(), ...화면만.keys()].some((k) => k.split('|').some((x) => 이름.includes(x) || x.includes(이름))) ||
    이름.split(/[\s/]+/).some((w) => w.length >= 2 && 영상말전부.includes(w))
  if (!맞음) 걸림.push(['② 재료', `우리 「${s}」 — 영상에서 못 찾았다(사전 밖일 수 있다 → 눈으로)`])
}
// ③ 불
const 우리순서 = (r.steps || []).join(' ')
for (const [t, k] of 영상불) if (!k.split('|').some((x) => 우리순서.includes(x))) 걸림.push(['③ 불', `영상 ${t} 「${k.split('|')[0]}」 — 우리 순서에 없다`])
// ④ 순서 — «말»로 처음 넣은 차례 vs 우리 순서에서 처음 나온 차례
//    한 재료가 여러 순서에 나올 수 있다(마늘쫑 = 튀기고 · 다시 넣고 / 「물」이 「물기」에 걸림)
//    → 뒤 재료가 «어느 순서에도» 앞 재료보다 먼저일 때만 거꾸로 본다(뒤의 마지막 < 앞의 처음)
const 차례들 = (k) => (r.steps || []).map((st, i) => (k.split('|').some((x) => st.includes(x)) ? i : -1)).filter((i) => i >= 0)
const 우리차례 = (k) => (차례들(k)[0] ?? -1)
const 둘다 = [...영상재료.keys()].filter((k) => 우리차례(k) >= 0)
for (let i = 1; i < 둘다.length; i++) if (Math.max(...차례들(둘다[i])) < Math.min(...차례들(둘다[i - 1])))
  걸림.push(['④ 순서', `영상은 「${둘다[i - 1].split('|')[0]}」(${영상재료.get(둘다[i - 1])}) → 「${둘다[i].split('|')[0]}」(${영상재료.get(둘다[i])}) · 우리는 거꾸로`])
// ⑤ 설명란 — 설명란에만 있고 영상에도 우리 글에도 없는 분량
for (const q of 설명분량) if (!영상분량들.has(q) && !우리분량.has(q)) 걸림.push(['⑤ 설명란', `설명란 「${q}」 — 영상에도 우리 글에도 없다(눈으로)`])
// ❓ 사전 밖 — 「넣는다」 뒤에 온 낱말인데 재료로 못 맞춘 것
const 안재료 = /^(?:add|put|pour|sprinkle)\s+(?:the\s+|some\s+|a\s+)?(it|them|this|that|two|three|one|spoonfuls?|seasoning|sauce|everything|all|more|a little)\b/
const 모름 = new Set()
for (const z of 줄) if (!한국어.test(z.말)) for (const w of z.말.toLowerCase().match(/\b(?:add|put|pour|sprinkle)\s+(?:the\s+|some\s+|a\s+)?([a-z]+(?:\s[a-z]+)?)/g) || [])
  if (!재료낱말(w).length && !안재료.test(w)) 모름.add(`${z.t} ${w}`)


console.log(`🎥 영상 대조 — ${r.title} (${id})\n   영상 ${r.sourceUrl} · 장면 ${장면.length} · 영상 분량 ${영상분량들.size} · 영상 재료 ${영상재료.size}${설명 ? ' · 설명란 있음' : ''}\n`)
console.log('— 영상 줄(말) —'); for (const z of 줄) if (z.말 && !/music|sound of|chewing/i.test(z.말)) console.log(`   ${z.t.padStart(5)}  ${z.말.slice(0, 150)}`)
console.log('')
if (!걸림.length) console.log('✅ 차이 없음')
for (const [k, m] of 걸림) console.log(`   ${k}  ${m}`)
for (const m of 모름) console.log(`   ❓ 사전 밖  ${m}`)
process.exitCode = 걸림.length ? 1 : 0
