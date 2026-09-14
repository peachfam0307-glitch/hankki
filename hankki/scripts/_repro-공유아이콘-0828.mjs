// 🍱 「SNS·갤러리로 공유하면 아이콘이 안 붙는다」 재현판 — 창업자 제보 2026-08-28
//
// 📮 창업자 = *"앱에서 사진으로 가져오기하면 아이콘이 자동으로 붙거든? 근데 sns나 갤러리는 자동으로 안붙어."*
//    🔢 실물 = 홈 「최근 저장」의 「골쫄면」·「김형석 부대찌개」가 **빈 접시**였다.
//       그런데 규칙은 멀쩡하다 — 골쫄면 → gr_068(사진 있음) · 김형석 부대찌개 → fh_k07(사진 있음).
//
// ⭐ 뿌리 = 아이콘을 «글자를 읽기 전»에 정해 굳혔다(→ src/shareIcon.js 주석).
//
// ⛔⛔ **이 컨테이너에선 진짜 OCR 을 못 돌린다**(cdn.jsdelivr.net 차단 → kor.traineddata 403).
//    ✅ 그래서 화면으로 재지 않고, **판정 그 자체**(`새제목아이콘`)를 **진짜 ICON_RULES** 로 잰다.
//       규칙은 흉내가 아니라 `src/components/FoodIcon.jsx` 에서 그대로 뽑아 쓴다.
//
// 🧪 규칙 12 = `App.jsx` 의 아이콘 갱신을 지우면 ⑦이, `새제목아이콘` 의 두 막이를 지우면 ③④가 죽는다.
//
// 실행: node scripts/_repro-공유아이콘-0828.mjs
// 🏷 이름표 = 판정대기 (⏳창업자 「배포해」 전 · hold/공유아이콘-0828)
import { readFileSync } from 'node:fs'
import { 공유아이콘 } from '../src/shareIcon.js'

let fail = 0
const chk = (조건, 이름, 덧말 = '') => {
  if (!조건) fail++
  console.log(`${조건 ? '  ok' : 'FAIL'}  ${이름}${덧말 ? `\n        ${덧말}` : ''}`)
}

// ── 진짜 ICON_RULES 를 파일에서 뽑는다 (흉내 아님) ──
const 뿌리 = new URL('../', import.meta.url)
const src = readFileSync(new URL('src/components/FoodIcon.jsx', 뿌리), 'utf8')
const 본문 = src.slice(src.indexOf('const ICON_RULES = ['))
const 규칙 = [...본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 300) { console.log(`⛔ ICON_RULES 를 못 뽑았다 (${규칙.length}개) — 시험이 «헛돌 뻔»했다`); process.exit(1) }
// ⭐ 「한 글자 낱말은 안 쓴다」까지 포함해 앱과 «같은 규칙»으로 찾는다(guessFoodIconStrict 와 같은 몸)
const 찾기 = (t) => { for (const r of 규칙) if (r.keys.some((k) => k.length >= 2 && String(t).includes(k))) return r.key; return 'default' }
const 느슨 = (t) => { for (const r of 규칙) if (r.keys.some((k) => String(t).includes(k))) return r.key; return 'default' }
console.log(`\n🍱 공유 아이콘 — 재현판 (진짜 ICON_RULES ${규칙.length}개)\n`)

// ① 창업자 실물 그대로 — 담을 땐 이름이 없었고, OCR 뒤 「골쫄면」이 됐다
chk(공유아이콘({ icon: 'default' }, '골쫄면', 찾기) === 'gr_068',
    '① 담긴 뒤 이름이 「골쫄면」이 되면 골쫄면 그림을 찾는다', `찾은 것=${공유아이콘({ icon: 'default' }, '골쫄면', 찾기)}`)
chk(공유아이콘({ icon: 'default' }, '김형석 부대찌개', 찾기) === 'fh_k07',
    '② 「김형석 부대찌개」도 찾는다(계정명이 앞에 붙어도)', `찾은 것=${공유아이콘({ icon: 'default' }, '김형석 부대찌개', 찾기)}`)

// ③ ⛔⛔ 창업자가 «직접 고른» 아이콘은 절대 안 덮는다 — v9.77 `iconPicked` 규칙 그대로
chk(공유아이콘({ icon: 'fe_91', iconPicked: true }, '골쫄면', 찾기) === null,
    '③ 직접 고른 아이콘(iconPicked)은 «안» 덮는다', `${공유아이콘({ icon: 'fe_91', iconPicked: true }, '골쫄면', 찾기)}`)

// ④ ⛔ 못 찾으면(default) 있던 것을 지킨다 — 나빠질 길을 없앤다
chk(공유아이콘({ icon: 'gr_068' }, '풀리게 저어주다가', 찾기) === null,
    '④ 못 찾는 이름이면 있던 아이콘을 지킨다', `${공유아이콘({ icon: 'gr_068' }, '풀리게 저어주다가', 찾기)}`)
chk(공유아이콘({ icon: 'default' }, '', 찾기) === null, '⑤ 이름이 비면 안 건드린다')
chk(공유아이콘({ icon: 'gr_068' }, '골쫄면', 찾기) === null, '⑤-b 이미 같은 아이콘이면 안 건드린다')

// ⑥ ⭐⭐ 창업자가 짚은 것 — 「제목이 잘 안들어가면 아이콘도 이상한거 붙자나」
//    한 글자 낱말(물·면)에 걸려 엉뚱한 그림이 붙던 것. 실물로 잰 두 건이다.
chk(느슨('게시물') === 'water' && 공유아이콘({ icon: 'default' }, '게시물', 찾기) === null,
    '⑥ 「게시물」이 「물」에 걸려 «물 그림»이 되던 것 — 이제 안 붙는다', `느슨하면=${느슨('게시물')}`)
chk(느슨('2:49 9 나였으면 다') === 'fe_395' && 공유아이콘({ icon: 'default' }, '2:49 9 나였으면 다', 찾기) === null,
    '⑦ 「2:49 9 나였으면 다」가 「면」에 걸려 «국수 그림»이 되던 것', `느슨하면=${느슨('2:49 9 나였으면 다')}`)

// ⑧ 창업자가 오늘 담은 것들이 다 찾아지나 (실물 이름)
const 실물 = { 골쫄면: 'gr_068', 콩나물무침: 'gr_414', 차돌짬뽕: 'gr_440', 공심채볶음: 'fe_499', 탕수육: 'fe_91' }
for (const [이름, 키] of Object.entries(실물)) {
  chk(공유아이콘({ icon: 'default' }, 이름, 찾기) === 키, `⑧ 「${이름}」 → ${키}`, `찾은 것=${공유아이콘({ icon: 'default' }, 이름, 찾기)}`)
}

// ⑦ ⭐⭐ **App.jsx 가 실제로 이 판정을 «부르나»** — 이게 없으면 위가 다 맞아도 화면은 그대로다
const app = readFileSync(new URL('src/App.jsx', 뿌리), 'utf8')
// ⚠️ `indexOf` 는 «import 줄»을 먼저 잡는다 — 그러면 이 칸이 «영영 실패»한다(첫 판이 그랬다).
//    ✅ 실제로 부르는 자리를 본다 = `updateRecipe` 로 넘기는 덩어리에 `icon:` 이 있나.
const 부르는자리 = app.indexOf('const 새아이콘 = 공유아이콘(')
chk(부르는자리 > 0 && /icon:\s*새아이콘/.test(app.slice(부르는자리, 부르는자리 + 900)),
    '⑨ App.jsx 의 OCR 뒤 갱신이 아이콘을 같이 넣는다')

console.log(fail ? `\n⛔ ${fail}칸 실패` : '\n✅ 전부 통과')
process.exit(fail ? 1 : 0)
