// 🍳🍳 창업자 36편을 앱에 넣는다 — 「우리집레시피 Ⓒ · 매주 2편」
//
// 📮 창업자 2026-08-12 *"내레시피는 c로가자. 매주 2개씩 넣되, 우리집레시피(큰제목) 작은제목 이번주 한끼 하면 어때.
//    이번주에 닭곰탕이랑 다른거 하나 나가자."*
//
// ⭐⭐ 왜 손으로 안 쓰고 생성기인가 = 34편 × 13칸 = 442칸이다. 손으로 옮기면 반드시 틀린다(규칙 8).
//    ⛔ 재료·순서·메모는 **창업자 확정본을 한 글자도 안 고치고 그대로** 옮긴다.
//
// 🔢 편수 = JSON 36 − 이미 앱에 있는 2(소고기 솥밥·연근사과샐러드) = **34편 신규**
//    ＋ 이미 든 닭곰탕 = **35편**을 18주에 나눈다(1주 2편 · 마지막 주만 1편).
//
// ⚠️⚠️ **「내가 지어낸 칸」을 표로 몰아놨다** — `시간`·`난이도`, 그리고 `serve` 에서 사람 수를
//    못 읽은 6편의 `인분`. 창업자 검수 대상이라 한곳에 모아 눈에 띄게 둔다(닭곰탕 때와 같은 방식).
//    🔒 아래 «순서에 적힌 분»과 대조해서 내 값이 더 짧으면 **죽는다**.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const JSON경로 = new URL('docs/_대기/레시피-정리-초안-2026-08-10.json', 뿌리)
const BASICS = new URL('src/data/basics.js', 뿌리)
const 편목록 = JSON.parse(readFileSync(JSON경로, 'utf8'))
const 편 = Object.fromEntries(편목록.map((r) => [r.title, r]))

// ── 아이콘: 앱과 «같은 규칙»(ICON_RULES 를 순서대로 읽어 첫 매칭) ──
const fi = readFileSync(new URL('src/components/FoodIcon.jsx', 뿌리), 'utf8')
const 규칙 = [...fi.slice(fi.indexOf('const ICON_RULES = [')).matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 100) { console.error('⛔ ICON_RULES 를 못 읽었다'); process.exit(1) }
const 아이콘 = (t) => 규칙.find((r) => r.keys.some((k) => t.includes(k)))?.key || 'default'
const 사진있나 = (k) => existsSync(new URL(`src/assets/stickers/photo/${k}.png`, 뿌리))

// ── 🗓 18주 배치 ──
//   ⭐ 우리집레시피는 «제철»이 아니라 «창업자가 해먹는 것»이라 제철 재료에 안 매인다.
//      그래도 계절이 뚜렷한 편은 그 철 가까이 뒀다 — 12월에 오이물김치가 나오면 이상하다.
//   🔒 제철 줄과 «같은 레시피»가 한 주에 겹치지 않는지 아래에서 검사한다.
const 배치 = [
  ['2026-08-10', ['닭곰탕*', '오이물김치']],            // 뜨거운 국물 ＋ 시원한 김치 = 한 상 (창업자 지시 = 닭곰탕＋하나)
  ['2026-08-17', ['들기름 막국수', '브로콜리 구이']],
  ['2026-08-24', ['매콤 콩나물덮밥', '치킨 레터스랩']],
  ['2026-08-31', ['오징어 애호박 덮밥', '가지덮밥']],
  ['2026-09-07', ['새우 해장 파스타', '연근샐러드']],
  ['2026-09-14', ['간장 제육볶음', '마늘쫑장아찌']],
  ['2026-09-21', ['목살조림', '고마다래 소스']],
  ['2026-09-28', ['대패삼겹 달래덮밥', '오징어누룽지']],
  ['2026-10-05', ['마파두부', '소고기 규동']],
  ['2026-10-12', ['전복솥밥', '두부참치찌개']],
  ['2026-10-19', ['간장 야키니쿠', '오징어 새우전']],
  ['2026-10-26', ['허니 간장 치킨', '10분 버섯밥']],
  ['2026-11-02', ['들기름 두부전골', '비빔갈비찜']],
  ['2026-11-09', ['황태국', '황태장아찌']],
  ['2026-11-16', ['얼큰 샤브 칼국수', '순살찜닭']],
  ['2026-11-23', ['인생 부대찌개', '닭볶음탕']],
  ['2026-11-30', ['굴 매생이 떡국', '봄동겉절이']],
  ['2026-12-07', ['양념게장']],                        // ⛔ 35 는 홀수라 마지막 주만 1편이다
]

// ── 📇 편별 값 ──
//   `인분` 은 `serve` 에서 읽는 게 원칙이고, **여기 적힌 값은 못 읽은 6편뿐**이다(⚠️표시).
//   `분`·`난이도` 는 ⚠️**원문에 없어서 내가 쓴 값** — 창업자 검수 대상.
const 표 = {
  '오이물김치':          { id: 'oi-mul-kimchi',        갈래: '한식', 칸: '반찬', 태그: ['밑반찬', '여름'],        분: 40, 난: '보통', 인분: 4 },
  '들기름 막국수':        { id: 'deulgireum-makguksu',  갈래: '한식', 칸: '한식', 태그: ['면', '여름별미'],        분: 20, 난: '쉬움' },
  '브로콜리 구이':        { id: 'broccoli-gui',         갈래: '한식', 칸: '반찬', 태그: ['간단한 요리', '밥반찬'],  분: 20, 난: '쉬움' },
  '매콤 콩나물덮밥':      { id: 'maekom-kongnamul-deopbap', 갈래: '한식', 칸: '밥', 태그: ['한그릇', '매운맛'],   분: 25, 난: '쉬움' },
  '치킨 레터스랩':        { id: 'chicken-lettuce-wrap', 갈래: '양식', 칸: '양식', 태그: ['다이어트', '술안주'],    분: 30, 난: '쉬움' },
  '오징어 애호박 덮밥':    { id: 'ojingeo-aehobak-deopbap', 갈래: '한식', 칸: '밥', 태그: ['한그릇', '덮밥'],      분: 25, 난: '쉬움' },
  '가지덮밥':            { id: 'gaji-deopbap',         갈래: '한식', 칸: '밥', 태그: ['한그릇', '덮밥'],          분: 25, 난: '쉬움' },
  '새우 해장 파스타':      { id: 'saeu-haejang-pasta',   갈래: '양식', 칸: '양식', 태그: ['파스타', '새우'],        분: 25, 난: '쉬움' },
  '연근샐러드':          { id: 'yeongeun-deulkkae-salad', 갈래: '한식', 칸: '반찬', 태그: ['밑반찬', '건강'],     분: 25, 난: '쉬움' },
  '간장 제육볶음':        { id: 'ganjang-jeyuk',        갈래: '한식', 칸: '한식', 태그: ['밥반찬', '돼지불고기'],   분: 50, 난: '보통', 인분: 4 },
  '마늘쫑장아찌':         { id: 'maneuljjong-jangajji', 갈래: '한식', 칸: '반찬', 태그: ['장아찌', '밑반찬'],      분: 30, 난: '쉬움', 인분: 4 },
  '목살조림':            { id: 'moksal-jorim',         갈래: '한식', 칸: '한식', 태그: ['밥반찬', '단짠'],        분: 40, 난: '보통' },
  '고마다래 소스':        { id: 'gomadare-sauce',       갈래: '일식', 칸: '일식', 태그: ['간단한 요리'],           분: 10, 난: '쉬움' },
  '대패삼겹 달래덮밥':     { id: 'daepae-dallae-deopbap', 갈래: '한식', 칸: '밥', 태그: ['한그릇', '삼겹살'],       분: 25, 난: '쉬움' },
  '오징어누룽지':         { id: 'ojingeo-nurungji',     갈래: '한식', 칸: '한식', 태그: ['한그릇', '별미'],        분: 25, 난: '쉬움' },
  '마파두부':            { id: 'mapa-dubu',            갈래: '중식', 칸: '중식', 태그: ['밥반찬', '매운맛'],       분: 30, 난: '보통' },
  '소고기 규동':          { id: 'sogogi-gyudon',        갈래: '일식', 칸: '일식', 태그: ['한그릇', '덮밥'],        분: 30, 난: '쉬움' },
  '전복솥밥':            { id: 'jeonbok-sotbap',       갈래: '한식', 칸: '밥', 태그: ['손님 요리', '솥밥'],       분: 60, 난: '보통' },
  '두부참치찌개':         { id: 'dubu-chamchi-jjigae',  갈래: '한식', 칸: '국물', 태그: ['국물 요리', '간단한 요리'], 분: 25, 난: '쉬움' },
  '간장 야키니쿠':        { id: 'ganjang-yakiniku',     갈래: '일식', 칸: '일식', 태그: ['밥반찬', '철판요리'],     분: 25, 난: '쉬움', 인분: 2 },
  '오징어 새우전':        { id: 'ojingeo-saeujeon',     갈래: '한식', 칸: '반찬', 태그: ['전', '술안주'],          분: 40, 난: '보통' },
  '허니 간장 치킨':       { id: 'honey-ganjang-chicken', 갈래: '한식', 칸: '한식', 태그: ['단짠', '술안주'],       분: 40, 난: '보통' },
  '10분 버섯밥':         { id: 'sipbun-beoseotbap',    갈래: '한식', 칸: '밥', 태그: ['초간단', '한그릇'],        분: 10, 난: '쉬움' },
  '들기름 두부전골':       { id: 'deulgireum-dubu-jeongol', 갈래: '한식', 칸: '국물', 태그: ['전골', '국물 요리'],  분: 30, 난: '쉬움' },
  '비빔갈비찜':          { id: 'bibim-galbijjim',      갈래: '한식', 칸: '한식', 태그: ['갈비찜', '손님 요리'],    분: 70, 난: '보통' },
  '황태국':             { id: 'hwangtae-guk',         갈래: '한식', 칸: '국물', 태그: ['국물 요리', '해장'],      분: 30, 난: '쉬움' },
  '황태장아찌':          { id: 'hwangtae-jangajji',    갈래: '한식', 칸: '반찬', 태그: ['장아찌', '밑반찬'],      분: 40, 난: '보통', 인분: 4 },
  '얼큰 샤브 칼국수':      { id: 'eolkeun-syabeu-kalguksu', 갈래: '한식', 칸: '국물', 태그: ['면', '매운맛'],      분: 35, 난: '쉬움' },
  '순살찜닭':            { id: 'sunsal-jjimdak',       갈래: '한식', 칸: '한식', 태그: ['순살', '손님 요리'],      분: 45, 난: '보통' },
  '인생 부대찌개':        { id: 'insaeng-budae-jjigae', 갈래: '한식', 칸: '국물', 태그: ['국물 요리', '매운맛'],   분: 40, 난: '보통' },
  '닭볶음탕':            { id: 'dak-bokkeumtang',      갈래: '한식', 칸: '한식', 태그: ['매운맛', '손님 요리'],    분: 50, 난: '보통' },
  '굴 매생이 떡국':       { id: 'gul-maesaengi-tteokguk', 갈래: '한식', 칸: '국물', 태그: ['국물 요리', '별미'],   분: 25, 난: '쉬움' },
  '봄동겉절이':          { id: 'bomdong-geotjeori',    갈래: '한식', 칸: '반찬', 태그: ['겉절이', '제철반찬'],     분: 20, 난: '쉬움' },
  '양념게장':            { id: 'yangnyeom-gejang',     갈래: '한식', 칸: '반찬', 태그: ['밥반찬', '손님 요리'],    분: 40, 난: '보통', 인분: 4 },
}

// ── 인분: `serve` 에서 사람 수를 읽는다. 못 읽으면 위 표의 값(⚠️내가 쓴 값) ──
const 인분읽기 = (s = '') => {
  const m = s.match(/(\d+)\s*~\s*(\d+)\s*인분/) || s.match(/(\d+)\s*인분/)
  return m ? (m[2] ? Math.round((+m[1] + +m[2]) / 2) : +m[1]) : null
}
// ── 🔒 순서에 «적힌 분»의 합보다 내 시간이 짧으면 죽는다 (내 짐작이 원문과 어긋나는 것을 막는다) ──
const 적힌분 = (steps) => steps.reduce((a, s) => {
  let n = 0
  for (const m of s.matchAll(/(\d+)\s*분/g)) n = Math.max(n, +m[1])   // 한 걸음 안의 최댓값
  return a + n
}, 0)

// ── 만들기 ──
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
const 줄들 = (arr, pad) => arr.map((x) => `${pad}  ${q(x)},`).join('\n')
const 잘못 = []
let 블록 = ''
let 센것 = 0
for (const [from, 제목들] of 배치) {
  for (const raw of 제목들) {
    if (raw.endsWith('*')) continue                 // 이미 앱에 있는 편(닭곰탕) — 배치에만 쓴다
    const t = raw
    const r = 편[t]
    const info = 표[t]
    if (!r) { 잘못.push(`⛔ JSON 에 「${t}」 가 없다`); continue }
    if (!info) { 잘못.push(`⛔ 표에 「${t}」 가 없다`); continue }
    const ico = 아이콘(t)
    if (!사진있나(ico)) 잘못.push(`⛔ 「${t}」 → ${ico} 는 음식 사진이 아니다(범용 도형)`)
    const 인분 = 인분읽기(r.serve) ?? info.인분
    if (!인분) { 잘못.push(`⛔ 「${t}」 인분을 못 정했다 (serve=「${r.serve}」)`); continue }
    const 바닥 = 적힌분(r.steps)
    if (바닥 > info.분) 잘못.push(`⛔ 「${t}」 시간 ${info.분}분 < 순서에 적힌 합 ${바닥}분 — 내 짐작이 원문보다 짧다`)
    센것++
    블록 += `
  // ${t} — from ${from}
  {
    ...base,
    id: 'basic-${info.id}',
    title: ${q(t)}, from: '${from}',
    icon: '${ico}',
    category: '${info.갈래}',
    folder: '${info.칸}',
    tags: [${info.태그.map(q).join(', ')}],
    time: ${info.분},
    servings: ${인분},
    difficulty: '${info.난}',
    ingredients: [
${줄들(r.ingredients, '    ')}
    ],
    steps: [
${줄들(r.steps, '    ')}
    ],
    memo: ${q(r.memo || '')},
  },
`
  }
}

// ── 🔒 검사 ──
// ⛔⛔ **자동 블록은 빼고 읽는다** — 안 그러면 «내가 방금 넣은 것»을 「이미 있다」로 잡아
//    두 번째 실행부터 죽는다(실제로 그랬다). 도구는 몇 번을 돌려도 같은 결과라야 한다.
const 자동뺀다 = (s, a, b) => (s.includes(a) && s.includes(b) ? s.slice(0, s.indexOf(a)) + s.slice(s.indexOf(b)) : s)
const basics = 자동뺀다(readFileSync(BASICS, 'utf8'),
  '  // ⬇⬇ [자동] 우리집레시피 34편', '  // ⬆⬆ [자동] 우리집레시피 34편 끝 ⬆⬆')
const 있는id = new Set([...basics.matchAll(/id:\s*'(basic-[^']+)'/g)].map((m) => m[1]))
const 있는제목 = new Set([...basics.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1].replace(/\s+/g, '')))
for (const [t, v] of Object.entries(표)) {
  if (있는id.has(`basic-${v.id}`)) 잘못.push(`⛔ id 충돌 — basic-${v.id} 가 이미 있다 (${t})`)
  if (있는제목.has(t.replace(/\s+/g, ''))) 잘못.push(`⛔ 제목 겹침 — 「${t}」 가 이미 앱에 있다`)
}
const 배치제목 = 배치.flatMap(([, xs]) => xs).filter((x) => !x.endsWith('*'))
const 안쓴것 = Object.keys(편).filter((t) => !배치제목.includes(t) && !있는제목.has(t.replace(/\s+/g, '')))
if (안쓴것.length) 잘못.push(`⛔ 배치에 안 들어간 편 ${안쓴것.length} — ${안쓴것.join(', ')}`)
if (new Set(배치제목).size !== 배치제목.length) 잘못.push('⛔ 배치에 같은 편이 두 번 있다')

console.log(`\n🍳 우리집레시피 — 새로 넣을 ${센것}편 / 18주\n${'─'.repeat(60)}`)
배치.forEach(([f, xs], i) => console.log(`${String(i + 1).padStart(2)}주  ${f}  ${xs.join(' · ')}`))
if (잘못.length) { console.log('\n' + 잘못.join('\n')); process.exit(1) }
console.log(`\n✅ 검사 통과 — id 충돌 0 · 제목 겹침 0 · 빠진 편 0 · 사진 없는 편 0 · 시간이 원문보다 짧은 편 0`)

// ── 🗓 weekly.js 의 HOMEMADE 도 «같은 배치표»로 만든다 ──
//   ⭐⭐ 왜 한 곳에서 = `basics.js` 의 `from` 과 여기 `from` 이 어긋나면 **그 주에 박스가 안 뜬다**
//      (`열린줄()` 이 「실제로 있는 레시피」만 남기는데, 레시피가 아직 안 열렸으면 걸러진다).
//      따로 적으면 34편 × 두 곳이라 반드시 어긋난다.
//   ⭐ 큰제목 `title` ＝ 「우리집레시피」 · 작은제목 `kicker` ＝ 「이번 주 한끼」 (창업자 2026-08-12)
const 홈 = 배치.map(([from, 제목들]) => {
  const ids = 제목들.map((x) => (x.endsWith('*') ? 'basic-dakgomtang' : `basic-${표[x].id}`))
  return `  { from: '${from}', title: '우리집레시피', kicker: '이번 주 한끼',\n` +
    `    why: '일상에서 자주 해먹는 요리들이에요.',\n` +
    `    ids: [${ids.map(q).join(', ')}] },   // ${제목들.map((x) => x.replace('*', '')).join(' · ')}`
}).join('\n')

// ── 파일에 넣는다 (표식 사이만 갈아끼운다 → 여러 번 돌려도 같은 결과) ──
const WEEKLY = new URL('src/data/weekly.js', 뿌리)
const 끼우기 = (경로, 시작, 끝, 속) => {
  const s = readFileSync(경로, 'utf8')
  if (!s.includes(시작) || !s.includes(끝)) { console.error(`⛔ 표식이 없다 — ${경로.pathname}`); process.exit(1) }
  writeFileSync(경로, s.slice(0, s.indexOf(시작) + 시작.length) + '\n' + 속 + s.slice(s.indexOf(끝)), 'utf8')
}
if (process.argv.includes('--apply')) {
  끼우기(BASICS, '  // ⬇⬇ [자동] 우리집레시피 34편 — `_넣기-우리집36-0812.mjs` 가 넣는다. 손으로 고치지 말 것 ⬇⬇',
    '  // ⬆⬆ [자동] 우리집레시피 34편 끝 ⬆⬆', 블록)
  끼우기(WEEKLY, '  // ⬇⬇ [자동] 우리집레시피 18주 — `_넣기-우리집36-0812.mjs` 가 넣는다. 손으로 고치지 말 것 ⬇⬇',
    '  // ⬆⬆ [자동] 우리집레시피 18주 끝 ⬆⬆', 홈 + '\n')
  console.log(`\n💾 basics.js ${센것}편 · weekly.js ${배치.length}주 — 둘 다 넣었다`)
} else {
  console.log('\n⏳ 넣으려면 --apply')
}
