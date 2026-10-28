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
// 분석은 여러 번 줄 수 있다(쉼표) — 같은 영상을 두 번 돌려 «서로 다른 곳»을 잡는다(분석은 매번 조금씩 다를 수 있다)
const 분석들 = 분석파일.split(',').map((f) => { const j = JSON.parse(readFileSync(f, 'utf8')); return (j.result || j).scenes || [] })
const 장면 = 분석들[0]
let 설명 = ''
if (설명파일) { const j = JSON.parse(readFileSync(설명파일, 'utf8')); 설명 = (Array.isArray(j) ? j : [j]).find((v) => (r.sourceUrl || '').includes(v.id))?.설명란 || '' }

// ── 영어 → 우리말 사전 (분석의 «말»이 영어로 온다) ─────────────
// ⚠️ 클로드가 적은 사전이다. 못 찾은 낱말은 ❓로 찍혀 사람이 본다 — 늘리면서 쓴다.
const 사전 = [   // 값이 「가|나」면 아무거나 맞으면 된다 · ⚠️ 순서 중요(긴 말 먼저)
  [/perilla oil/, '들기름'], [/perilla (seed )?(powder|seeds?)/, '들깨'], [/perilla leaf|perilla leaves|\bperilla\b/, '깻잎'],
  [/sesame oil/, '참기름'], [/olive oil/, '올리브'], [/sesame salt/, '깨소금'], [/sesame (seeds?|powder)/, '깨'],
  [/cooking oil|vegetable oil|\boil\b/, '식용유|기름'],
  [/soy sauce/, '간장'], [/oyster sauce/, '굴소스'], [/tuna (fish sauce|liquid|extract|sauce)/, '참치액'], [/(anchovy|sand lance)?[\/ ]*(sand lance )?fish sauce/, '액젓'],
  [/plum (extract|juice|syrup)/, '매실'], [/starch syrup|corn syrup|oligosaccharide/, '물엿|올리고당'], [/allulose/, '알룰로스'],
  [/cooking wine|mirin/, '맛술|미림'], [/anchov(y|ies)/, '멸치'],
  [/garlic scapes?/, '마늘쫑'], [/minced garlic|\bgarlic\b/, '마늘'],
  [/green onions?|scallions?/, '파'], [/\bonions?\b/, '양파'],
  [/(red )?chili powder|red pepper (powder|flakes)|chili flakes|gochugaru/, '고춧가루'],
  [/kkwari|shishito/, '꽈리'], [/cheongyang/, '청양고추|고추'], [/red chili peppers?|red peppers?/, '홍고추|고추'], [/chili peppers?/, '고추'],
  [/coarse salt|\bsalt\b/, '소금'], [/\bsugar\b/, '설탕'], [/\bmsg\b/, '미원'], [/black pepper|\bpepper\b(?! (powder|flakes))/, '후추'],
  [/doenjang|soybean paste/, '된장'], [/gochujang/, '고추장'], [/\bwater\b/, '물'], [/pork belly/, '삼겹살'], [/\bpork\b/, '돼지|삼겹살'],
  [/\bbeef\b/, '소고기'], [/\beggs?\b/, '계란|달걀'], [/radish/, '무'], [/cabbage|eolgari/, '얼갈이'], [/vinegar/, '식초'],
  [/oyster mushrooms?/, '느타리'], [/shiitake/, '표고'], [/glutinous rice flour/, '찹쌀가루'], [/mushrooms?/, '버섯'],
  [/butter/, '버터'], [/\bmilk\b/, '우유'], [/cheese/, '치즈'], [/tofu/, '두부'], [/\brice\b(?! flour)/, '밥'],
]
const 불사전 = [[/medium[- ]high heat/, '중강불'], [/medium[- ]low heat/, '중약불'], [/low heat/, '약불'], [/medium heat/, '중불'], [/high heat/, '센불|강불']]
const 숫자말 = { one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5, a: 1 }
const 단위말 = [[/tablespoons?|tbsp|spoonfuls?|spoons?/, '큰술'], [/teaspoons?|tsp/, '작은술'], [/\bml\b|milliliters?/, 'ml'], [/\bg\b|grams?/, 'g'],
  [/\bkg\b/, 'kg'], [/cups?/, '컵'], [/minutes?/, '분'], [/pinch/, '꼬집'], [/cloves?/, '알']]
const 한국단위 = '큰술|작은술|g|kg|ml|컵|분|알|대|꼬집'
const 정분량 = (s) => s.replace(/\s+/g, '').replace(/(?<![\d.])1\/2(?=[가-힣a-z])/g, '0.5').replace(/스푼|숟가락|술(?!큰)/g, '큰술').replace(/큰큰술/g, '큰술')
const 분량뽑기 = (s) => new Set([...정분량(s).matchAll(new RegExp(`(\\d+(?:\\.\\d+)?(?:\\/\\d+)?)(${한국단위})`, 'g'))].map((m) => `${m[1]}${m[2]}`))

const 한국어 = /[가-힣]/
function 영상분량(말) {
  const 나 = [...분량뽑기(말)]   // 한국어 자막이 그대로 올 때(얼갈이 편)
  const 소 = 숫자풀기(말)   // 「one and a half」·「half a」 같은 말을 숫자로
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
  // 말한 «차례대로» 세운다(한 문장에 둘이 나올 때 사전 순서로 세우면 순서 검사가 헛경보를 낸다 — 마늘쫑 후추·굴소스)
  const 자리 = []
  for (const [re, ko] of 사전) { const m = 남.match(re); if (m) { 자리.push([m.index, ko]); 남 = 남.replace(new RegExp(re.source, 'g'), (s) => ' '.repeat(s.length)) } }
  return 자리.sort((a, b) => a[0] - b[0]).map(([, ko]) => ko)
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
for (const [k, t] of 영상재료) if (!있나(k)) 걸림.push(['② 재료', `영상 ${t} 「${k.split('|')[0]}」 — 우리 글에 없다`])
for (const [k, t] of 화면만) if (!있나(k)) 걸림.push(['② 재료', `영상 ${t} 「${k.split('|')[0]}」 — 화면에만 보였다(곁들임·담음새일 수 있다 → 눈으로)`])
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
// ⑥ 재료별 분량 — 「N단위 of 재료」·「재료 N단위」를 «짝»으로 묶어 우리 재료 줄의 분량과 맞댄다
//    (①은 숫자가 «어딘가 있나»만 본다 → 간장 2를 설탕 2로 써도 통과했다. 그 구멍을 막는다)
function 숫자풀기(s) { return s.toLowerCase()
  .replace(/\bone and a half\b/g, '1.5').replace(/\btwo and a half\b/g, '2.5').replace(/\bthree and a half\b/g, '3.5')
  .replace(/\bhalf an?\b/g, '0.5').replace(/\ba third of\b/g, '1/3').replace(/\ba quarter of\b/g, '1/4')
  .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (w) => ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[w])
  .replace(/\ba (?=(tablespoon|teaspoon|spoonful|spoon|cup|pinch)s?\b)/g, '1 ') }
const 영단위 = (u) => 단위말.find(([re]) => re.test(u))?.[1]
function 짝들(말) {
  const 나 = []
  if (한국어.test(말)) {
    for (const m of 말.matchAll(/([가-힣]+(?:\/[가-힣]+)?)\s*(\d+(?:\.\d+)?(?:\/\d+)?)\s*(큰술|작은술|술|스푼|g|kg|ml|컵|알|대|꼬집)/g))
      나.push({ 재료: m[1], 양: 정분량(`${m[2]}${m[3]}`), 원문: m[0] })
    return 나
  }
  const 소 = 숫자풀기(말)
  for (const m of 소.matchAll(/(\d+(?:\.\d+)?(?:\/\d+)?)\s*(tablespoons?|tbsp|spoonfuls?|spoons?|teaspoons?|tsp|ml|milliliters?|g|grams?|kg|cups?|pinch(?:es)?|cloves?)\s+(?:of\s+)?(?:the\s+)?([a-z][a-z \-\/]{1,40}?)(?=\s*(?:[,.;(]|\band\b|\binto\b|\bto\b|\bin\b|$))/g)) {
    const u = 영단위(m[2]); if (!u) continue
    const ko = 사전.find(([re]) => re.test(m[3]))?.[1]
    // 「of」 없이 이어진 말(「16 tablespoons is based on …」)은 재료가 아닐 수 있다 → 사전에 없으면 ❓로 안 찍고 넘긴다
    if (!ko && !/\bof\b/.test(m[0])) continue
    나.push({ 재료: ko || `❓${m[3].trim()}`, 양: `${m[1]}${u}`, 원문: m[0] })
  }
  // 단위 없이 「1/3 of a green onion」 — 파는 「대」, 그 밖은 「개」(우리말 셈)
  for (const m of 소.matchAll(/(\d+\/\d+|\d+(?:\.\d+)?)\s+of\s+an?\s+([a-z][a-z \-]{1,30}?)(?=\s*(?:[,.;(]|\band\b|$))/g)) {
    const ko = 사전.find(([re]) => re.test(m[2]))?.[1]
    나.push({ 재료: ko || `❓${m[2].trim()}`, 양: `${m[1]}${ko === '파' ? '대' : '개'}`, 원문: m[0] })
  }
  return 나
}
// 「소금」⊂「깨소금」처럼 글자는 겹치지만 다른 재료 — 여기 있으면 «같다»로 안 본다(2026-10-28 깨소금 헛경보 두 번)
const 다른재료 = { 소금: ['깨소금'], 기름: ['들기름', '참기름', '고추기름'], 파: ['양파', '쪽파'], 마늘: ['마늘쫑'], 물: ['물엿'], 간장: ['굴소스'], 고추: ['고춧가루', '꽈리고추', '청양고추'] }
const 같은재료 = (긴, x) => 긴.includes(x) && !(다른재료[x] || []).some((d) => 긴.includes(d))
const 우리줄찾기 = (재료) => 우리재료.filter((s) => 재료.split('|').some((x) => 같은재료(재료이름(s), x) || (x.length >= 2 && 같은재료(x, 재료이름(s)))))
const 분석짝 = 분석들.map((sc) => sc.flatMap((s) => 짝들((s.audio || '').replace(/^.*Narrator:\s*/i, '')).map((p) => ({ ...p, t: s.timestamp_start }))))
for (const p of 분석짝[0]) {
  if (p.재료.startsWith('❓')) { 걸림.push(['⑥ 재료별 분량', `영상 ${p.t} 「${p.원문}」 — 사전에 없는 재료(눈으로 · 사전에 더할 것)`]); continue }
  const 줄들 = 우리줄찾기(p.재료); if (!줄들.length) continue   // 재료 자체가 없으면 ②가 이미 잡는다
  const 단위같은 = 줄들.filter((s) => 분량뽑기(s).size && [...분량뽑기(s)].some((q) => q.replace(/[\d./]+/, '') === p.양.replace(/[\d./]+/, '')))
  if (단위같은.length && !단위같은.some((s) => 분량뽑기(s).has(p.양)))
    걸림.push(['⑥ 재료별 분량', `영상 ${p.t} 「${p.재료.split('|')[0]} ${p.양}」 ↔ 우리 「${단위같은.join(' / ')}」`])
}
// ⑦ 설명란 vs 영상 — 같은 재료인데 분량이 다르면(영상이 주 · 어느 쪽을 썼는지 주석에 남긴다)
if (설명) for (const 줄 of 설명.split('\n').filter((l) => !l.includes('='))) for (const p of 짝들(줄)) {
  const 영 = 분석짝[0].find((v) => v.재료.split('|').some((x) => 같은재료(p.재료, x) || 같은재료(x, p.재료)) && v.양.replace(/[\d./]+/, '') === p.양.replace(/[\d./]+/, ''))
  if (영 && 영.양 !== p.양) 걸림.push(['⑦ 설명란≠영상', `「${p.재료}」 설명란 ${p.양} ↔ 영상 ${영.t} ${영.양} → 영상대로`])
}
// ⑧ 분석끼리 다름 — 두 번 돌린 분석에서 한쪽에만 있는 «재료＋분량»
if (분석짝.length > 1) {
  // 같은 재료가 한 번은 한국어(「얼갈이배추」), 한 번은 영어(cabbage→얼갈이)로 올 수 있다 → «우리 재료 줄»로 묶어서 센다
  const 열쇠 = (p) => `${(우리줄찾기(p.재료)[0] && 재료이름(우리줄찾기(p.재료)[0])) || p.재료.split('|')[0]} ${p.양}`
  const 모음 = 분석짝.map((ps) => new Set(ps.map(열쇠)))
  for (const k of new Set(모음.flatMap((s) => [...s]))) if (!모음.every((s) => s.has(k)))
    걸림.push(['⑧ 분석끼리 다름', `「${k}」 — ${모음.map((s, i) => `${i + 1}번 ${s.has(k) ? '있음' : '없음'}`).join(' · ')} (눈으로)`])
}

// ❓ 사전 밖 — 「넣는다」 뒤에 온 낱말인데 재료로 못 맞춘 것
const 안재료 = /^(?:add|put|pour|sprinkle|drizzle|garnish with|top with|season with|mix in|stir in|toss with|coat with|marinate with|place)\s+(?:the\s+|some\s+|a\s+)?(it|them|this|that|two|three|one|spoons?|spoonfuls?|seasoning|sauce|everything|all|more|a little|the root|in|on|to)\b/
const 모름 = new Set()
for (const z of 줄) if (!한국어.test(z.말)) for (const w of z.말.toLowerCase().match(/\b(?:add|put|pour|sprinkle|drizzle|garnish with|top with|season with|mix in|stir in|toss with|coat with|marinate with|place)\s+(?:the\s+|some\s+|a\s+)?([a-z]+(?:\s[a-z]+)?)/g) || [])
  if (!재료낱말(w).length && !안재료.test(w)) 모름.add(`${z.t} ${w}`)


console.log(`🎥 영상 대조 — ${r.title} (${id})\n   영상 ${r.sourceUrl} · 장면 ${장면.length} · 영상 분량 ${영상분량들.size} · 영상 재료 ${영상재료.size}${설명 ? ' · 설명란 있음' : ''}\n`)
console.log('— 영상 줄(말) —'); for (const z of 줄) if (z.말 && !/music|sound of|chewing/i.test(z.말)) console.log(`   ${z.t.padStart(5)}  ${z.말.slice(0, 150)}`)
console.log('')
if (!걸림.length) console.log('✅ 차이 없음')
for (const [k, m] of 걸림) console.log(`   ${k}  ${m}`)
for (const m of 모름) console.log(`   ❓ 사전 밖  ${m}`)
process.exitCode = 걸림.length ? 1 : 0
