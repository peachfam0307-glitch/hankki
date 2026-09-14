// 🛒➡️🍱 「쇼핑」 갈래에 잘못 들어간 음식 컷 29개를 제자리로 — 2026-08-26
//
// ⛔⛔ 무슨 일인가 (v11.38 · 2026-08-24)
//   창업자 8/24 컷을 앱에 넣으며 **「이름이 겹쳐 규칙을 안 준 24장」을 픽커 «맨 끝 갈래»(쇼핑)에 몰아 넣었다.**
//   그래서 ⑴장바구니·카트 사이에 «음식 사진»이 뜨고 ⑵그 중 **25컷은 이름표가 아예 없어 라벨이 빈칸**이었다.
//
// ⛔⛔ 왜 아무도 못 잡았나 = `check-foodtab` 의 `isPhoto` 가 `fe|fh|fy|fj|fi|fb` 뿐이라
//   **`gr_` 219장을 통째로 안 보고 있었다.** 빈 이름표·같은 이름·깨진 참조 검사가 전부 그 컷들을 건너뛰었다.
//   📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나».
//
// ✅ 이름은 «짐작이 아니다» — 창업자 원본 시트 라벨(`docs/stickers/음식-창업자-2026-08-24/이름표.json`)을
//   낱개 파일 해시로 되짚어 가져왔다. 29컷 전부 그림과 라벨이 맞는지 눈으로도 봤다.
//
// 실행 = node scripts/_고침-쇼핑에빠진음식29-0826.mjs
// 🏷 이름표 = 반영됨 (v11.46)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 파일 = path.join(앱, 'src/components/FoodIcon.jsx')

// 키 → [제자리 갈래, 창업자 시트 라벨]  (⛔이름이 이미 규칙에 있는 넷은 라벨 자리를 비운다)
const 옮길것 = {
  gr_227: ['국·탕·찌개', null],          // 매운감자탕 — 규칙 있음
  gr_229: ['국·탕·찌개', null],          // 매운알탕 — 규칙 있음
  gr_301: ['국·탕·찌개', '마라탕'],
  gr_317: ['국·탕·찌개', null],          // (매운)오징어무국 — 규칙 있음
  gr_247: ['밥', '돌솥비빔밥'],
  gr_248: ['밥', '전복솥밥'],
  gr_249: ['밥', '전복죽'],
  gr_255: ['볶음·조림', null],           // 양배추돼지고기볶음(하얀) — 규칙 있음
  gr_256: ['볶음·조림', '마늘쫑볶음'],
  gr_257: ['볶음·조림', '간장불고기'],
  gr_258: ['볶음·조림', '두부조림(간장)'],
  gr_259: ['볶음·조림', '매운해물볶음'],
  gr_260: ['볶음·조림', '야채볶음'],
  gr_261: ['볶음·조림', '브로콜리볶음'],
  gr_263: ['볶음·조림', '두부조림(간장)'],
  gr_268: ['볶음·조림', '항정살간장조림'],
  gr_269: ['볶음·조림', '닭고기데리야끼조림'],
  gr_270: ['볶음·조림', '백순대볶음'],
  gr_271: ['볶음·조림', '몽골리안비프'],
  gr_272: ['볶음·조림', '삼치조림'],
  gr_239: ['반찬·나물·김치', '계란찜'],
  gr_240: ['반찬·나물·김치', '콘치즈'],
  gr_252: ['반찬·나물·김치', '코울슬로'],
  gr_273: ['반찬·나물·김치', '메추리알장조림'],
  gr_251: ['분식', '빨간떡볶이'],
  gr_327: ['중식', '군만두'],
  gr_328: ['일식', '부타노가쿠니'],
  gr_329: ['일식', '가라아게'],
  gr_330: ['일식', '초밥'],
}

let src = fs.readFileSync(파일, 'utf8')
const 원본길이 = src.length

// ① 쇼핑 갈래를 원래대로 (도형 다섯만)
const 쇼핑줄 = src.match(/^ {2}\{ label: '쇼핑', items: \[[^\]]*\] \},$/m)
if (!쇼핑줄) throw new Error('⛔ 쇼핑 갈래 줄을 못 찾았다 — 모양이 바뀌었다')
const 쇼핑키 = [...쇼핑줄[0].matchAll(/'([^']+)'/g)].map((m) => m[1]).slice(1)
const 남길것 = 쇼핑키.filter((k) => !옮길것[k])
const 못옮길것 = 쇼핑키.filter((k) => 옮길것[k] === undefined && /^gr_/.test(k))
if (못옮길것.length) throw new Error(`⛔ 갈래를 안 정한 음식 컷 = ${못옮길것.join(', ')}`)
src = src.replace(쇼핑줄[0], `  { label: '쇼핑', items: [${남길것.map((k) => `'${k}'`).join(', ')}] },`)

// ② 제자리 갈래 «맨 앞»에 넣는다 (새 컷이 위로 — 픽커에서 바로 보인다)
//    ⛔ «쇼핑에 있던 것»만 옮긴다 — `gr_330`(초밥)은 처음부터 일식 갈래에 있었고 이름표만 없었다.
//       안 걸러서 한 번 두 갈래에 넣었고 게이트 ①이 그걸 잡았다.
const 쇼핑에있던 = new Set(쇼핑키)
const 갈래별 = {}
for (const [키, [갈래]] of Object.entries(옮길것)) if (쇼핑에있던.has(키)) (갈래별[갈래] ||= []).push(키)
for (const [갈래, 키들] of Object.entries(갈래별)) {
  const re = new RegExp(`^ {2}\\{ label: '${갈래.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',( kind: '\\w+',)? items: \\[`, 'm')
  const m = src.match(re)
  if (!m) throw new Error(`⛔ 「${갈래}」 갈래를 못 찾았다`)
  src = src.replace(re, `${m[0]}${키들.map((k) => `'${k}', `).join('')}`)
}

// ③ 이름표 — 창업자 시트 라벨을 EXTRA_NAMES 맨 앞에
const 새이름 = Object.entries(옮길것)
  .filter(([, [, nm]]) => nm)
  .map(([k, [, nm]]) => `${k}: '${nm}'`)
const 머리 = `const EXTRA_NAMES = {
  // 🛒➡️🍱 [2026-08-26] v11.38 에서 «쇼핑» 갈래에 잘못 들어가 «라벨이 빈칸»이던 25컷.
  //    이름은 창업자 원본 시트 라벨 그대로다(\`docs/stickers/음식-창업자-2026-08-24/이름표.json\`).
  //    ⛔ 규칙(\`ICON_RULES\`)은 «안» 준다 — 같은 이름을 쓰는 컷이 이미 있어 규칙을 주면 그 컷을 덮는다(규칙 11).
  ${새이름.join(', ')},`
if (!src.includes('const EXTRA_NAMES = {')) throw new Error('⛔ EXTRA_NAMES 를 못 찾았다')
src = src.replace('const EXTRA_NAMES = {', 머리)

fs.writeFileSync(파일, src)
console.log(`✅ ${path.relative(앱, 파일)} — ${원본길이} → ${src.length}자`)
console.log(`   쇼핑 ${쇼핑키.length}개 → ${남길것.length}개 · 옮긴 음식 ${Object.keys(옮길것).length}컷 · 새 이름표 ${새이름.length}개`)
