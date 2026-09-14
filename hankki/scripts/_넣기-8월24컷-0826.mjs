// 🍱 창업자 8/24 시트에서 «검수 통과한 111컷»을 앱에 넣는다 (2026-08-26)
//
// 📮 창업자 = 253장 전수검수 → 「좋아 181 · 이름틀림 0 · 접시깨짐 72」 → *"나머지는 배포 ㄱㄱ"*
//    ⭐ 이름표 틀린 것 **0개** — 원본 시트 라벨 189개를 눈으로 읽어 적은 값이 전부 맞았다.
//
// ⛔⛔ **이게 「다 예전 카와이버전이야」의 진짜 해법이다.**
//    그릇 108컷이 덮는 요리와 기본 레시피 145편이 겹치는 게 **12편뿐**이라
//    108컷을 아무리 잘 잘라도 화면의 8%만 바뀌었다. 8/24 컷이 나머지를 덮는다.
//
// 🔢 실측 = 111장 중 **105장은 이름이 이미 규칙에 있다** → 그 줄의 «키만» 갈아끼운다(줄을 안 늘린다).
//    나머지 6장만 새 줄. ⭐ 그래서 「구체어 먼저」 순서가 안 흔들린다.
//
// ⛓ **세 곳을 «같이» 고쳐야 화면이 바뀐다** — 하나라도 빠지면 반쪽이다
//    ① `PHOTO_RATIO`  — 없으면 그림이 찌그러진다
//    ② `ICON_RULES`   — 제목 쓰면 저절로 붙는 규칙
//    ③ `FOOD_ICON_GROUPS` — 아이콘 고르기에서 직접 고를 수 있게
//    ④ `basics.js` 의 박힌 `icon:` — ⭐**이걸 안 고치면 규칙을 고쳐도 안 뜬다**(v10.76 사고).
//       `Thumb.jsx` = `recipe.icon || guessFoodIcon(제목)` 이라 박힌 값이 규칙을 덮는다.
//
// ⛔ 옛 컷 파일은 **하나도 안 지운다** — 그 키로 저장한 유저 레시피가 깨진다. 픽커·규칙에서만 내린다.
//
// 씀:  node scripts/_넣기-8월24컷-0826.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 판정 = JSON.parse(fs.readFileSync(`${APP}/docs/stickers/판정-이름표전수-2026-08-26.json`, 'utf8'))
const 이름표 = JSON.parse(fs.readFileSync(`${APP}/docs/stickers/음식-창업자-2026-08-24/이름표.json`, 'utf8'))
const 낱개 = `${APP}/docs/stickers/음식-창업자-2026-08-24/낱개`
const 낼곳 = `${APP}/src/assets/stickers/photo`
const 이름 = (k) => { const [s, c] = k.split('_'); return 이름표[s][Number(c) - 1] }

const 넣을것 = 판정.좋아.filter((k) => !k.startsWith('gr_'))

// ── 다음 gr_ 번호부터 이어 쓴다 (8/26 그릇 컷과 같은 성격 = 그릇에 담긴 음식)
const 있는번호 = fs.readdirSync(낼곳).filter((f) => /^gr_\d{3}\.png$/.test(f))
  .map((f) => Number(f.slice(3, 6)))
let 다음 = Math.max(...있는번호) + 1

const 재기 = (p) => {
  const out = execFileSync('python3', ['-c',
    `from PIL import Image;im=Image.open(${JSON.stringify(p)});print(im.width,im.height)`],
    { encoding: 'utf8' })
  const [w, h] = out.trim().split(' ').map(Number)
  return Number((w / h).toFixed(4))
}

const 새것 = []   // {키, 이름, 비율}
for (const 원 of 넣을것) {
  const 길 = `${낱개}/${원}.png`
  if (!fs.existsSync(길)) { console.error(`⛔ 낱개 없음: ${원}`); process.exit(1) }
  const 키 = `gr_${String(다음++).padStart(3, '0')}`
  fs.copyFileSync(길, `${낼곳}/${키}.png`)
  새것.push({ 키, 이름: 이름(원), 비율: 재기(길), 원 })
}
console.log(`🖼 파일 ${새것.length}장 복사 — ${새것[0].키} ~ ${새것[새것.length - 1].키}`)

// ── ① PHOTO_RATIO
const ST = `${APP}/src/components/Stickers.jsx`
let st = fs.readFileSync(ST, 'utf8')
const 앵커 = st.match(/\n(\s*)gr_001:\s*[0-9.]+,/)
if (!앵커) { console.error('⛔ PHOTO_RATIO 에서 gr_001 줄을 못 찾았다'); process.exit(1) }
const 들여 = 앵커[1]
const 비율줄 = 새것.map((c) => `${들여}${c.키}: ${c.비율},`).join('\n')
st = st.replace(앵커[0], `${앵커[0]}\n${비율줄}`)
fs.writeFileSync(ST, st)
console.log(`📐 PHOTO_RATIO ${새것.length}줄 추가`)

// ── ②③ ICON_RULES · 픽커
const FI = `${APP}/src/components/FoodIcon.jsx`
let fi = fs.readFileSync(FI, 'utf8')
const ri = fi.indexOf('const ICON_RULES')
const 규칙끝 = ri + 10 + fi.slice(ri + 10).search(/\n(const|export const)\s/)
let 규칙 = fi.slice(ri, 규칙끝)
const 픽커시 = fi.indexOf('export const FOOD_ICON_GROUPS')
let 픽커 = fi.slice(픽커시, ri)

// ⛔⛔ 8/26 그릇 컷과 «이름이 같은» 24장은 규칙을 «안» 건드린다 — 픽커에만 넣는다.
//   ⭐ 8/26 컷이 오늘 창업자 판정을 받아 배포된 최신이라 그쪽이 이름의 주인이다.
//   📌 게이트(`check-foodtab` 「구체어 먼저」)가 이걸 잡았다 — 같은 이름 컷이 둘인데
//      규칙은 하나만 가리킬 수 있어서, 8/24 로 덮으면 8/26 컷이 «자기 이름으로 못 불린다».
const 그릇이름 = new Set(JSON.parse(
  fs.readFileSync(`${APP}/docs/stickers/음식-창업자-2026-08-26/컷목록.json`, 'utf8')).map((c) => c.name))

const 쓴이름 = new Set()
let 갈아낌 = 0, 새줄 = [], 픽커갈아낌 = 0, 픽커추가 = []
for (const c of 새것) {
  if (그릇이름.has(c.이름) || 쓴이름.has(c.이름)) {   // ⛔ 규칙엔 «하나만» (픽커엔 둘 다 실린다)
    픽커추가.push(c); continue
  }
  쓴이름.add(c.이름)
  // 규칙: 그 이름을 가진 줄의 «키»를 갈아끼운다
  const re = new RegExp(`(\\[\\[[^\\]]*'${c.이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[^\\]]*\\],\\s*')([a-z]+_[0-9a-z]+)(')`)
  const m = 규칙.match(re)
  if (m) {
    const 옛 = m[2]
    규칙 = 규칙.replace(re, `$1${c.키}$3`)
    갈아낌++
    // 픽커도 같은 자리에서 갈아끼운다 → 갈래가 저절로 맞는다
    if (픽커.includes(`'${옛}'`)) { 픽커 = 픽커.replace(`'${옛}'`, `'${c.키}'`); 픽커갈아낌++ }
    else 픽커추가.push(c)
  } else {
    새줄.push(`  [['${c.이름}'], '${c.키}'],`)
    픽커추가.push(c)
  }
}
if (새줄.length) 규칙 = 규칙.replace('const ICON_RULES = [\n', `const ICON_RULES = [\n${새줄.join('\n')}\n`)
console.log(`📋 ICON_RULES — 키 갈아낌 ${갈아낌} · 새 줄 ${새줄.length}`)

// 픽커에 자리 못 찾은 것은 «기타» 갈래 맨 뒤로 (⛔조용히 버리지 않는다)
if (픽커추가.length) {
  const 목록 = 픽커추가.map((c) => `'${c.키}'`).join(', ')
  const 끝 = 픽커.lastIndexOf('] },')
  if (끝 < 0) { console.error('⛔ 픽커 마지막 갈래를 못 찾았다'); process.exit(1) }
  픽커 = 픽커.slice(0, 끝) + `, ${목록}` + 픽커.slice(끝)
}
console.log(`🗂 픽커 — 갈아낌 ${픽커갈아낌} · 뒤에 붙임 ${픽커추가.length}`)

fi = fi.slice(0, 픽커시) + 픽커 + 규칙 + fi.slice(규칙끝)
fs.writeFileSync(FI, fi)

// ── ④ basics.js 에 «박힌» icon 갈아끼우기 (이게 없으면 규칙을 고쳐도 안 뜬다)
const BA = `${APP}/src/data/basics.js`
let ba = fs.readFileSync(BA, 'utf8')
let 박힌갈아낌 = 0
for (const c of 새것) {
  // 「제목이 이 이름을 담은 편」의 icon 만 갈아끼운다
  const re = new RegExp(`(title:\\s*'[^']*${c.이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^']*'[\\s\\S]{0,400}?icon:\\s*')([a-z]+_[0-9a-z]+)(')`)
  if (re.test(ba)) { ba = ba.replace(re, `$1${c.키}$3`); 박힌갈아낌++ }
}
fs.writeFileSync(BA, ba)
console.log(`🍚 기본 레시피에 박힌 icon 갈아낌 ${박힌갈아낌}편`)

// ⚠️ 레시피 내용이 바뀌면 BASICS_VERSION 을 올려야 이미 깔린 폰에 간다(게이트가 막는다)
if (박힌갈아낌) {
  const m = ba.match(/BASICS_VERSION\s*=\s*(\d+)/)
  if (m) {
    ba = ba.replace(m[0], `BASICS_VERSION = ${Number(m[1]) + 1}`)
    fs.writeFileSync(BA, ba)
    console.log(`🔢 BASICS_VERSION ${m[1]} → ${Number(m[1]) + 1}`)
  }
}
fs.writeFileSync(`${APP}/../.새컷-8월24.json`, JSON.stringify(새것, null, 1))
