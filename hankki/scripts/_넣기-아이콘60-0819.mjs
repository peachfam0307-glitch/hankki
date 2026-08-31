// 🍱 창업자 새 음식 아이콘 60컷을 앱에 넣는다 (2026-08-19)
//
// 📮 창업자 = *"4판은 그대로 나가면 돼. 고칠게 없어"* · *"소스는 3개 4개 다 넣어 골고루 원하는대로 쓰게"*
//    · *"콘치즈브라우니수박화채는 암거나 넣어도 돼."* · *"이거 다 저장해. 또 해야한다고 말하지말고 확정박고 배포해"*
//
// ⭐⭐ **8/12 에 이미 같은 판정이 있었다** — README 215줄:
//    *"양념은 4개짜리로 넣자. **3개짜리도 넣고. 다양하게 고르면 좋지뭐.**"*
//    → 오늘 답과 똑같다. 그래서 **둘 다** 넣는다.
//    · 콘치즈·브라우니·수박화채 = **시트07 판**(`n0704`·`n0705`·`n0706`) ← 8/12 확정 그대로
//      ⛔ 시트09 판(`n0904`~`n0906`)은 **픽커에 안 올린다**(같은 요리가 둘이면 고를 때 헷갈린다).
//         파일은 넣어 둔다 — 나중에 바꿀 수 있게.
//
// ⛔ 이 판은 «한 번 쓰고 마는» 것이다. 하는 일 =
//    ⑴ `docs/stickers/…/낱개/n****.png` → `src/assets/stickers/photo/fe_329~388.png` 로 복사
//    ⑵ `Stickers.jsx` 의 `PHOTO_RATIO` 에 실제 비율을 «재서» 넣는다(⛔짐작 금지 · 검수 절대원칙 ④)
//    ⑶ `FoodIcon.jsx` 의 `ICON_RULES`(제목 자동매칭) · `FOOD_ICON_GROUPS`(픽커) · `FOOD_NAMES`(이름표)
//
// ⚠️ `ICON_RULES` 는 **파일 «위쪽»에 넣는다** — 「구체어 먼저」(v10.89 사고).
//    아래 넓은 규칙(「국」·「조림」·「볶음」)이 먼저 걸리면 새 컷이 영영 안 뜬다.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const APP = new URL('..', import.meta.url).pathname
const 낱개 = `${APP}docs/stickers/음식아이콘-창업자-2026-08-12/낱개`
const 사진 = `${APP}src/assets/stickers/photo`

// ── 이름표 (README 표에서 읽은 것 · 60개)
const 이름표 = {
  n0101: '골뱅이소면무침', n0102: '삼치조림', n0103: '삼치구이', n0104: '갈치조림', n0105: '갈치구이', n0106: '가자미구이',
  n0201: '계란국', n0202: '미소된장국', n0203: '육개장', n0204: '냉이된장찌개', n0205: '냉이된장국', n0206: '오징어국',
  n0301: '전복미역국', n0302: '카레라이스', n0303: '냉우동', n0304: '해물볶음우동', n0305: '소고기무국', n0306: '김치콩나물국',
  n0401: '고추장진미채', n0402: '메추리알장조림', n0403: '애호박새우젓볶음', n0404: '묵무침', n0405: '소세지야채볶음', n0406: '두부조림',
  n0501: '총각김치', n0502: '유부초밥', n0503: '시금치무침', n0504: '쌀국수', n0505: '열무김치', n0506: '파김치',
  n0601: '얼큰소고기무국', n0602: '해물찜', n0603: '감자볶음', n0604: '멸치조림', n0605: '오이지무침', n0606: '깍두기',
  n0701: '소스 모둠', n0702: '양념 모둠', n0703: '샐러드소스 모둠', n0704: '콘치즈', n0705: '브라우니', n0706: '수박화채',
  n0801: '무스비', n0802: '버터명란구이', n0803: '두부김치', n0804: '바삭황태채', n0805: '알배추전', n0806: '지코바치킨',
  n0901: '소스 모둠 셋', n0902: '양념 모둠 셋', n0903: '샐러드소스 모둠 셋', n0904: '콘치즈(다른 판)', n0905: '브라우니(다른 판)', n0906: '수박화채(다른 판)',
  n1001: '오이무침', n1002: '오이탕탕이', n1003: '부추무침', n1004: '파절이', n1005: '계란말이', n1006: '계란찜',
}

// ⛔ 픽커에 «안» 올리는 것 — 같은 요리가 둘이면 고를 때 헷갈린다(8/12 창업자 확정)
const 픽커에서뺌 = new Set(['n0904', 'n0905', 'n0906'])

// 🗂 픽커 갈래 — 「한식이면 종류로, 아니면 나라로」(분류 원칙 ②)
const 갈래 = {
  '국·탕·찌개': ['n0201', 'n0202', 'n0203', 'n0204', 'n0205', 'n0206', 'n0301', 'n0305', 'n0306', 'n0601'],
  '구이·튀김': ['n0103', 'n0105', 'n0106', 'n0802', 'n0805', 'n0806'],
  '볶음·조림': ['n0102', 'n0104', 'n0401', 'n0402', 'n0403', 'n0405', 'n0406', 'n0603', 'n0604', 'n1005', 'n1006'],
  반찬: ['n0101', 'n0404', 'n0501', 'n0503', 'n0505', 'n0506', 'n0605', 'n0606', 'n1001', 'n1002', 'n1003', 'n1004'],
  밥: ['n0302', 'n0502', 'n0801', 'n0803'],
  면: ['n0303', 'n0304', 'n0504'],
  '회·수육': ['n0602', 'n0804'],
  양념: ['n0701', 'n0702', 'n0703', 'n0901', 'n0902', 'n0903'],
  간식: ['n0704', 'n0705', 'n0706'],
}

// ── ① 복사 + 비율 재기
const 키들 = Object.keys(이름표).sort()
const 짝 = {} // n0101 → fe_329
const 비율 = {}
let 번호 = 329
for (const n of 키들) {
  const 옛 = `${낱개}/${n}.png`
  if (!existsSync(옛)) { console.error(`⛔ ${n}.png 가 없다`); process.exit(1) }
  const 새 = `fe_${번호}`
  copyFileSync(옛, `${사진}/${새}.png`)
  짝[n] = 새
  // ⛔ 비율은 «재서» 넣는다 — 짐작하면 앱에서 찌그러진다(검수 절대원칙 ④)
  const wh = execSync(`python3 -c "from PIL import Image;im=Image.open('${사진}/${새}.png');print(im.size[0],im.size[1])"`).toString().trim().split(' ')
  비율[새] = +(wh[0] / wh[1]).toFixed(4)
  번호++
}
console.log(`✅ ${키들.length}컷 복사 — fe_329 ~ fe_${번호 - 1}`)

// ── ② PHOTO_RATIO
const S = `${APP}src/components/Stickers.jsx`
let s = readFileSync(S, 'utf8')
const 표시 = Object.entries(비율).map(([k, v]) => `${k}: ${v.toFixed(4)}`)
const 줄들 = []
for (let i = 0; i < 표시.length; i += 7) 줄들.push('  ' + 표시.slice(i, i + 7).join(', ') + ',')
const 넣을것 = `  // 🍱 [2026-08-19] 창업자 새 음식 아이콘 60컷 — 시트 10장(8/12 제공)\n${줄들.join('\n')}\n`
const 표식 = '  fe_328: 1.2405,   // 갈비살조림'
if (!s.includes(표식)) { console.error('⛔ PHOTO_RATIO 자리를 못 찾았다'); process.exit(1) }
s = s.replace(표식, 표식 + 넣을것)
writeFileSync(S, s)
console.log('✅ PHOTO_RATIO 갱신')

// ── ③ FoodIcon.jsx
const F = `${APP}src/components/FoodIcon.jsx`
let f = readFileSync(F, 'utf8')

// ICON_RULES — 파일 «위쪽»에(구체어 먼저)
const 규칙들 = 키들
  .filter((n) => !픽커에서뺌.has(n))
  .map((n) => {
    const 이름 = 이름표[n]
    const 말 = [이름]
    if (이름.includes(' ')) 말.push(이름.replace(/ /g, ''))
    return `  [[${말.map((w) => `'${w}'`).join(', ')}], '${짝[n]}'],`
  })
const 규칙표식 = "  // 🥩 갈비 둘 — ⛔순서가 중요하다"
if (!f.includes(규칙표식)) { console.error('⛔ ICON_RULES 자리를 못 찾았다'); process.exit(1) }
f = f.replace(
  규칙표식,
  `  // 🍱 [2026-08-19] 창업자 새 아이콘 60컷 — ⛔여기(위쪽)에 둬야 아래 넓은 규칙(「국」·「조림」·「볶음」)보다 먼저 걸린다\n${규칙들.join('\n')}\n\n${규칙표식}`,
)

// ⭐ FOOD_NAMES 는 «손대지 않는다» — `ICON_RULES` 에서 저절로 만들어진다(1463줄).
//   `for (const [keys, key] of ICON_RULES) if (!m[key]) m[key] = keys[0]`
//   → 규칙의 «첫 낱말»이 곧 이름표다. 위에서 이름표를 첫 낱말로 넣었으니 그대로 붙는다.
//   ⛔ 픽커에서 뺀 셋(n0904~n0906)은 규칙이 없어 이름표도 없다 — 픽커에 안 올리니 맞다.
writeFileSync(F, f)
console.log('✅ ICON_RULES 갱신 (FOOD_NAMES 는 여기서 저절로 나온다)')

// ── ④ 픽커 갈래 — 어디에 넣을지 알려만 준다(손으로 넣는다)
console.log('\n📋 FOOD_ICON_GROUPS 에 넣을 것:')
for (const [g, ns] of Object.entries(갈래)) {
  const 키 = ns.filter((n) => !픽커에서뺌.has(n)).map((n) => `'${짝[n]}'`)
  if (키.length) console.log(`   ${g}: ${키.join(', ')}`)
}
console.log(`\n⛔ 픽커에서 뺀 것 = ${[...픽커에서뺌].map((n) => `${짝[n]}(${이름표[n]})`).join(' · ')}`)
