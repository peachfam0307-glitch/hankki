/**
 * 🍱 새 음식 컷 119개를 앱에 «갈아끼운다» (2026-08-27)
 *
 * 📮 창업자 = *"둘다 넣어줘. 이제 앱에 반영하고 갈아끼워줘."* · *"아까 104컷도 다 갈아끼우는거 맞지?"*
 *              *"깔끔 아까 자른 것들과 같이 배포해"*
 *
 * ⭐ 이 스크립트는 «처리표»(처리표-갈아끼우기-2026-08-27.json)대로만 움직인다. 여기서 새로 판단하지 않는다.
 *
 * 하는 일 넷
 *   ① 낱개 PNG 를 `src/assets/stickers/photo/gr_331~449.png` 로 복사
 *   ② `Stickers.jsx` 의 `PHOTO_RATIO` 에 «실제 PNG 를 재서» 비율 등록 (검수 절대원칙 ④)
 *   ③ `FoodIcon.jsx` 의 `ICON_RULES` 맨 위에 새 블록 (⭐구체어 먼저 · v10.89)
 *   ④ `FoodIcon.jsx` 의 `FOOD_ICON_GROUPS` — 옛 키 «자리»에 새 키를 갈아끼우고, 내릴 옛 컷은 뺀다
 *
 * ⛔ 파일은 하나도 지우지 않는다 — 픽커·규칙에서만 내린다(그 키로 저장한 레시피가 깨진다).
 * ⛔ `FOOD_NAMES` 는 손대지 않는다 — `ICON_RULES` 에서 저절로 만들어진다(FoodIcon.jsx:1586).
 *
 * 쓰기:  node scripts/_넣기-갈아끼우기-0827.mjs --미리보기
 *        node scripts/_넣기-갈아끼우기-0827.mjs --적용
 */
import fs from 'node:fs'
import zlib from 'node:zlib'

const 적용 = process.argv.includes('--적용')
const P = 'docs/stickers/음식-창업자-2026-08-26-2차/'
const 처리표 = JSON.parse(fs.readFileSync(P + '처리표-갈아끼우기-2026-08-27.json', 'utf8'))
const 넣을것 = 처리표.표.filter((r) => r.상태 === '넣는다')
const 내릴것 = new Set(처리표.픽커에서내릴옛컷)

/** PNG 머리에서 폭·높이를 읽는다 (라이브러리 없이) */
const 재기 = (p) => {
  const b = fs.readFileSync(p)
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

// ── ① 파일 복사 ──────────────────────────────────────────────────
const A = 'src/assets/stickers/photo/'
let 복사 = 0
for (const r of 넣을것) {
  const 밖 = `${P}낱개/${r.새컷}.png`
  if (!fs.existsSync(밖)) throw new Error(`⛔ 낱개가 없다: ${밖}`)
  if (적용) fs.copyFileSync(밖, A + r.새키 + '.png')
  복사++
}
console.log(`① 컷 복사  ${복사}장  (${넣을것[0].새키} ~ ${넣을것.at(-1).새키})`)

// ── ② PHOTO_RATIO ────────────────────────────────────────────────
const S = 'src/components/Stickers.jsx'
let stick = fs.readFileSync(S, 'utf8')
const 비율줄 = []
for (const r of 넣을것) {
  const { w, h } = 재기(`${P}낱개/${r.새컷}.png`)
  비율줄.push(`  ${r.새키}: ${(w / h).toFixed(4)},`)
}
const 앵커 = 'const PHOTO_RATIO = {'
if (!stick.includes(앵커)) throw new Error('⛔ PHOTO_RATIO 를 못 찾았다')
if (stick.includes(`  ${넣을것[0].새키}:`)) {
  console.log('② PHOTO_RATIO  이미 들어 있다 — 건너뛴다')
} else {
  const 머리 = `${앵커}\n  // 🍱 2026-08-27 — 창업자 새 컷 ${넣을것.length}개(실제 PNG 를 재서 넣었다 · 검수 절대원칙 ④)\n${비율줄.join('\n')}\n`
  stick = stick.replace(앵커, 머리)
  if (적용) fs.writeFileSync(S, stick)
  console.log(`② PHOTO_RATIO  ${비율줄.length}줄 추가`)
}

// ── ③ ICON_RULES ────────────────────────────────────────────────
const F = 'src/components/FoodIcon.jsx'
let food = fs.readFileSync(F, 'utf8')

/** 이름에서 규칙에 쓸 별칭을 만든다 — 「돼지고기김치찜」이면 그대로 하나만.
 *  ⛔ 짐작으로 별칭을 늘리지 않는다(규칙 🈵). 괄호 안 설명만 떼고, 띄어쓴 판을 하나 더 준다. */
const 별칭 = (이름) => {
  const 민 = 이름.replace(/\s*\(.*?\)\s*/g, '').replace(/-.*$/, '').trim()
  const 셋 = new Set([민])
  if (민.includes(' ')) 셋.add(민.replace(/\s+/g, ''))
  return [...셋].filter(Boolean)
}

/** ⭐⭐ 짝이 있으면 «옛 줄의 키만» 갈아끼운다 — 새 줄을 만들지 않는다 (v11.38 방식)
 *
 *  ⛔ 처음엔 전부 새 줄로 맨 위에 넣었다가 **「구체어 먼저」가 깨졌다**(게이트가 잡았다) —
 *     「장조림」·「샌드위치」·「볶음」 같은 홑낱말이 맨 위에 앉아
 *     아래의 「꽃게간장조림」·「오이샌드위치」·「백순대볶음」을 통째로 먹었다.
 *  ⭐ 옛 줄의 키만 갈면 ⑴별칭이 그대로 살고 ⑵순서(구체어가 위)가 그대로라 이 사고가 아예 안 난다. */
let 키갈이 = 0
for (const r of 넣을것) {
  if (!r.자동매칭) continue
  for (const 옛 of r.대신할옛컷) {
    const re = new RegExp(`(\\[\\[[^\\]]*\\]\\s*,\\s*)'${옛}'(\\s*\\])`, 'g')
    if (re.test(food)) { food = food.replace(re, `$1'${r.새키}'$2`); 키갈이++; break }
  }
}
console.log(`③-a ICON_RULES  옛 줄의 키만 갈아끼움 ${키갈이}줄 (별칭·순서 그대로)`)

/** 짝이 없어 갈아낄 옛 줄이 없는 컷만 «새 줄»로 맨 위에 */
const 규칙줄 = []
for (const r of 넣을것) {
  if (!r.자동매칭) { 규칙줄.push(`  // ⛔ ${r.새키} ${r.이름} — ${r.자동매칭왜}`); continue }
  if (food.includes(`'${r.새키}'],`)) continue          // 위에서 이미 갈아끼웠다
  const ks = 별칭(r.이름)
  if (!ks.length) continue
  규칙줄.push(`  [[${ks.map((k) => `'${k}'`).join(', ')}], '${r.새키}'],`)
}
const 규칙앵커 = 'const ICON_RULES = [\n'
if (!food.includes(규칙앵커)) throw new Error('⛔ ICON_RULES 를 못 찾았다')
if (!규칙줄.length) {
  console.log('③-b ICON_RULES  새로 만들 줄이 없다')
} else {
  const 블록 =
    규칙앵커 +
    `  // 🍱🍱 2026-08-27 — 창업자 새 컷 ${넣을것.length}개로 갈아끼웠다.\n` +
    `  //   📮 창업자 = *"다 잘라서 앱에 1:1로 짝찾아서 갈아끼워줘. 앱에 옛컷 아직도 있거든(카와이스타일) 다 빼줘"*\n` +
    `  //   ⛔ 여기가 «맨 위»여야 한다(구체어 먼저 · v10.89) — 아래 넓은 규칙이 먼저 잡으면 옛 그림이 나온다.\n` +
    `  //   ⭐ 이름이 같은 컷은 «원본이 큰 쪽»만 여기 올린다 — 둘이 올라오면 아래 것이 영영 안 뜨는 유령이 된다(v11.13).\n` +
    규칙줄.join('\n') +
    '\n'
  food = food.replace(규칙앵커, 블록)
  console.log(`③ ICON_RULES  ${규칙줄.filter((l) => !l.startsWith('  //')).length}줄 추가`)
}

// ── ④ 픽커 ───────────────────────────────────────────────────────
/** 짝이 없는 새 컷은 갈래를 정해 준다 (짝이 있으면 «옛 컷 자리»에 들어가 저절로 맞는다) */
const 갈래 = {
  n0202: '볶음·조림', n0203: '볶음·조림', n0501: '밥', n0601: '밥',
  n0602: '국·탕·찌개', n0603: '국·탕·찌개', n0604: '국·탕·찌개', n0605: '국·탕·찌개', n0606: '국·탕·찌개',
  n0801: '볶음·조림', n1003: '볶음·조림', n1006: '분식', n1805: '구이·튀김',
  n2201: '회·수육', n2401: '국·탕·찌개', n2402: '분식', n2403: '반찬·나물·김치',
  n2404: '국·탕·찌개', n2405: '양식', n2406: '밥',
  n2501: '반찬·나물·김치', n2502: '밥',
}

const 픽커시작 = food.indexOf('export const FOOD_ICON_GROUPS = [')
const 픽커끝 = food.indexOf('\n]', 픽커시작)
let 픽커 = food.slice(픽커시작, 픽커끝)

// 갈아끼우기 — 옛 키 «자리»에 새 키를 넣는다(순서가 유지된다)
let 갈아낌 = 0, 붙임 = 0, 뺌 = 0
for (const r of 넣을것) {
  const 첫옛 = r.대신할옛컷.find((o) => 픽커.includes(`'${o}'`))
  if (첫옛) {
    픽커 = 픽커.replace(`'${첫옛}'`, `'${r.새키}'`)
    갈아낌++
  }
}
// 남은 옛 컷 제거 (카와이·뺄옛컷·두 번째 이후 짝)
for (const o of 내릴것) {
  const 전 = 픽커
  픽커 = 픽커.replace(new RegExp(`'${o}', ?`), '').replace(new RegExp(`, ?'${o}'`), '')
  if (픽커 !== 전) 뺌++
}
// 짝이 없어 아직 픽커에 없는 새 컷을 갈래 맨 앞에 붙인다
for (const r of 넣을것) {
  if (픽커.includes(`'${r.새키}'`)) continue
  const g = 갈래[r.새컷]
  if (!g) { console.log(`   ⚠️ 갈래를 못 정했다: ${r.새컷} ${r.이름}`); continue }
  const 표식 = `{ label: '${g}', items: [`
  if (!픽커.includes(표식)) { console.log(`   ⚠️ 갈래가 없다: ${g}`); continue }
  픽커 = 픽커.replace(표식, `${표식}'${r.새키}', `)
  붙임++
}
console.log(`④ 픽커  갈아낌 ${갈아낌} · 새로 붙임 ${붙임} · 옛 컷 내림 ${뺌}`)

food = food.slice(0, 픽커시작) + 픽커 + food.slice(픽커끝)
const 안들어간 = 넣을것.filter((r) => !픽커.includes(`'${r.새키}'`))
if (안들어간.length) console.log(`   ⛔ 픽커에 못 넣은 컷 ${안들어간.length}개:`, 안들어간.map((r) => r.새컷).join(' '))

if (적용) fs.writeFileSync(F, food)
console.log(적용 ? '\n✅ 적용했다' : '\n👀 미리보기였다 — 적용하려면 --적용')
