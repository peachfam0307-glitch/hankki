/**
 * 🍱 픽커 재편 ＋ 새 컷 6장 — 창업자 분류를 한 판에 적용한다 (2026-08-27)
 *
 * 📮 창업자 = *"어제 음식 올린거 아이콘에 밥에 국들어가고 다 섞였어 지금 이거부터하자."*
 *    → *"픽커 전체 다 봐야할 것 같아"* → *"네가 판만들면 내가 보고바로바로 분류해줄게"*
 *    → 갈래별 옮김 목록 ＋ 같은 이름 쌍 11건 판정 ＋ *"양념.소스는 양식 앞에 두자."*
 *    → *"이거 자르고 갈아끼워줘. 앱에 없거나 이상한컷"* → *"닭가슴살 냉채야"* · *"해파리냉채랑 닭가슴살냉채 각각이야"*
 *
 * ⛔ **파일은 하나도 지우지 않는다** — 픽커·규칙에서만 내린다(그 키로 저장한 레시피가 깨진다).
 * ⛔ 손으로 고치지 않는다 — 갈래 15개·키 600여 개라 반드시 하나를 흘린다.
 * ⭐ 못 찾으면 «죽는다» — 조용히 안 바뀌고 「고쳤다」고 말하는 게 제일 나쁘다.
 *
 * 쓰기: cd /home/user/hankki/hankki && node scripts/_재편-픽커-0827.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FI = path.join(ROOT, 'src/components/FoodIcon.jsx')
const ST = path.join(ROOT, 'src/components/Stickers.jsx')
const 낱개 = path.join(ROOT, 'docs/stickers/음식-창업자-2026-08-27/낱개')
const 사진 = path.join(ROOT, 'src/assets/stickers/photo')

let 죽음 = 0
const 죽어 = (m) => { console.log(`⛔ ${m}`); 죽음++ }
const 한번 = (s, 옛, 새, 이름) => {
  const n = s.split(옛).length - 1
  if (n !== 1) { 죽어(`${이름} — 「${옛.slice(0, 40)}」 이 ${n}군데다 (1군데여야 한다)`); return s }
  return s.replace(옛, 새)
}

// ── ① 새 컷 6장 ────────────────────────────────────────────────────
// ⭐ 라벨을 3배로 키워 읽어 확정했다(검수원칙 ⑥) — 팟타이·냉채·깻잎오징어전·해물누룽지탕·오징어무침·바질크림떡볶이
const 컷 = [
  ['n2601', 'gr_036', '팟타이', null],                    // 갈아끼움 — 창업자 *"라면 면"* 지적
  ['n2604', 'fe_528', '해물누룽지탕', null],               // 갈아끼움
  ['n2602', 'gr_450', '닭가슴살냉채', '반찬·나물·김치'],     // 새 키 — 창업자 *"해파리냉채랑 닭가슴살냉채 각각이야"*
  ['n2603', 'gr_451', '깻잎오징어전', '구이·튀김·전'],      // 새 키
  ['n2605', 'gr_452', '오징어무침', '반찬·나물·김치'],      // 새 키
  ['n2606', 'gr_453', '바질크림떡볶이', '분식'],            // 새 키
]
for (const [n, k] of 컷) {
  const 원 = path.join(낱개, `${n}.png`)
  if (!existsSync(원)) { 죽어(`${n}.png 이 없다`); continue }
  copyFileSync(원, path.join(사진, `${k}.png`))
}

// ── ② FoodIcon.jsx ────────────────────────────────────────────────
let s = readFileSync(FI, 'utf8')

// ⓐ 갈래 이름 — 창업자 *"볶음. 조림에 찜도하나 추가해야할 듯. 구이.튀김.(전-추가)"*
s = 한번(s, "{ label: '볶음·조림', items:", "{ label: '볶음·조림·찜', items:", '볶음 갈래 이름')
s = 한번(s, "{ label: '구이·튀김', items:", "{ label: '구이·튀김·전', items:", '구이 갈래 이름')

// ⓑ 새 규칙 — ⛔「오징어무침」은 «미나리오징어무침 아래»라야 한다(`s.includes` 라 넓은 쪽이 먼저 걸린다)
const 닻 = "  [['대패삼겹달래덮밥'], 'gr_449'],\n"
s = 한번(s, 닻, 닻 + `  // 🍲 2026-08-27 창업자 시트26 — 새 컷 넷(팟타이·해물누룽지탕은 «키를 갈아끼웠다»라 규칙이 그대로다)
  //   ⛔ 여기가 「미나리오징어무침」 «아래»여야 한다 — 「오징어무침」이 위에 있으면 그 편을 훔친다.
  //   ⛔ 「바질크림떡볶이」는 837줄 「떡볶이」 «위»라야 한다(구체어 먼저 · v10.89).
  [['닭가슴살냉채', '닭가슴살 냉채'], 'gr_450'],
  [['깻잎오징어전'], 'gr_451'],
  [['오징어무침'], 'gr_452'],
  [['바질크림떡볶이', '크림떡볶이'], 'gr_453'],
  // 🍝 창업자 쌍 판정 = *"뚝배기파스타 : 둘 다 남긴다 -왼쪽거 해장파스타로"*
  //   ⛔ 기본 레시피 「해장 파스타」·「뚝배기 파스타」에 박힌 icon(fe_436)은 «안 건드린다» —
  //      v90 에서 «일부러» 박은 값이고 v11.34 사고가 정확히 그 자리다(BASICS_VERSION 95 주석).
  [['해장파스타', '해장 파스타'], 'gr_446'],
`, '새 규칙 넣을 자리')

// ⓒ `fe_515` 를 픽커에서 내리므로 「김치찜」 매칭이 사라진다 → `gr_356` 이 받는다
s = 한번(s, "  [['돼지고기김치찜', '김치찜'], 'fe_515'],\n", '', 'fe_515 규칙 빼기')
const g356 = s.match(/ {2}\[\['돼지고기김치찜'[^\]]*\], 'gr_356'\],/)
if (!g356) 죽어('gr_356 돼지고기김치찜 규칙을 못 찾았다')
else s = 한번(s, g356[0], "  [['돼지고기김치찜', '김치찜'], 'gr_356'],", 'gr_356 에 김치찜 넘기기')

// ⓓ 이름표 둘 — 창업자 판정을 화면 글자에 반영한다
s = 한번(s, "gr_446: '뚝배기파스타'", "gr_446: '해장파스타'", 'gr_446 이름표')
s = 한번(s, "fe_179: '냉채'", "fe_179: '해파리냉채'", 'fe_179 이름표')

// ⓔ 갈래 재편
const 내림 = ['fe_110', 'fe_68', 'fe_125', 'gr_447', 'gr_353', 'gr_358', 'gr_357', 'fe_515', 'gr_424']
const 양념소스 = ['gr_375', 'gr_336', 'gr_335', 'fe_525', 'fe_524', 'fe_523', 'fe_522', 'gr_334', 'gr_332',
  'gr_362', 'gr_363', 'fe_500', 'gr_374', 'gr_331', 'gr_405', 'gr_333',
  'gr_395', 'gr_415', 'gr_394', 'gr_390', 'gr_383', 'gr_393', 'gr_381', 'fe_304']
const 포케샐러드 = ['fe_511', 'gr_349', 'fe_07', 'gr_391', 'gr_242', 'gr_243', 'fe_116']
const 옮김 = { gr_320: '볶음·조림·찜', fe_395: '면' }
for (const [, k, , 갈래] of 컷) if (갈래) 옮김[k] = 갈래

const 빼기 = new Set([...내림, ...양념소스, ...포케샐러드, ...Object.keys(옮김)])

// 갈래마다 items 배열을 통째로 다시 쓴다
const 갈래줄 = [...s.matchAll(/\{ label: '([^']+)'(, kind: '(\w+)')?, items: \[([^\]]*)\] \}/g)]
if (갈래줄.length < 15) 죽어(`갈래를 ${갈래줄.length}개밖에 못 읽었다 — 15개는 넘어야 한다`)
const 새목록 = {}
for (const m of 갈래줄) {
  if (m[3]) continue // 재료(kind:'ing')는 안 건드린다
  const keys = m[4].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean)
  새목록[m[1]] = keys.filter((k) => !빼기.has(k))
}
// 옮길 것을 새 자리에 «맨 뒤»로 얹는다 (가나다 정렬은 화면에서 `FOOD_ICON_GROUPS_SORTED` 가 한다)
for (const [k, 갈래] of Object.entries(옮김)) {
  if (!새목록[갈래]) { 죽어(`옮길 곳 「${갈래}」 갈래가 없다`); continue }
  새목록[갈래].push(k)
}
새목록['양념·소스'] = 양념소스
새목록['포케·샐러드'] = 포케샐러드

// ⛔ 꼬리 쉼표를 붙이지 말 것 — 아래 치환은 «쉼표 앞»까지만 갈아끼운다(붙이면 쉼표가 둘이 된다)
const 줄만들기 = (라벨) => `{ label: '${라벨}', items: [${새목록[라벨].map((k) => `'${k}'`).join(', ')}] }`
for (const m of 갈래줄) {
  if (m[3]) continue
  s = 한번(s, m[0], 줄만들기(m[1]), `갈래 「${m[1]}」 다시 쓰기`)
}
// 새 갈래 둘 — 포케·샐러드는 반찬 뒤 · 양념·소스는 «양식 앞»(창업자 확정)
const 반찬줄 = s.match(/ {2}\{ label: '반찬·나물·김치', items: \[[^\]]*\] \},\n/)
if (!반찬줄) 죽어('반찬 갈래 줄을 못 찾았다')
else s = 한번(s, 반찬줄[0], 반찬줄[0] + '  ' + 줄만들기('포케·샐러드') + ',\n', '포케·샐러드 넣기')
const 양식줄 = s.match(/ {2}\{ label: '양식', items: \[[^\]]*\] \},\n/)
if (!양식줄) 죽어('양식 갈래 줄을 못 찾았다')
else s = 한번(s, 양식줄[0], '  ' + 줄만들기('양념·소스') + ',\n' + 양식줄[0], '양념·소스 넣기')

if (죽음) { console.log(`\n⛔ ${죽음}건 — 아무것도 저장하지 않는다`); process.exit(1) }
writeFileSync(FI, s)

// ── ③ Stickers.jsx — PHOTO_RATIO 는 «실제 PNG 를 재서» 넣는다 (검수 절대원칙 ④) ──
const { default: sharpless } = { default: null }
void sharpless
let t = readFileSync(ST, 'utf8')
const 크기 = (p) => {
  const b = readFileSync(p)
  // PNG IHDR — 폭·높이는 8바이트 뒤 16~24
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}
for (const [, k] of 컷) {
  const { w, h } = 크기(path.join(사진, `${k}.png`))
  const 비 = (w / h).toFixed(4)
  const re = new RegExp(`(${k}: )([0-9.]+)`)
  if (re.test(t)) t = t.replace(re, `$1${비}`)
  else t = 한번(t, '  gr_449: 1.1050,\n', `  gr_449: 1.1050,\n  ${k}: ${비},\n`, `${k} 비율 넣기`)
  console.log(`   📐 ${k}  ${w}×${h}  →  ${비}`)
}
if (죽음) { console.log(`\n⛔ ${죽음}건 — Stickers.jsx 는 저장하지 않는다`); process.exit(1) }
writeFileSync(ST, t)

console.log('\n✅ 재편 끝')
console.log(`   갈래 ${Object.keys(새목록).length}개 · 픽커에서 내린 것 ${내림.length}개(파일은 그대로)`)
console.log(`   양념·소스 ${양념소스.length} · 포케·샐러드 ${포케샐러드.length} · 새 컷 ${컷.length}`)
