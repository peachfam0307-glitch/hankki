// 🛒🗓 **주부의 장바구니 「여는 날짜」가 «새지 않나»** — 배포 게이트.
//
//   📮 창업자 확정 2026-08-29 = **"1주에 3개씩 올리자"**
//      ⛔ 2026-08-28 v11.78 이 **한 번에 82개**를 열어 운영 방침(*"양보다 엄선 … 아무거나 잔뜩 = 신뢰 희석"*)이 깨졌다.
//
//   ⭐⭐ **이 검사의 심장 = 「거르는 곳이 «한 군데»인가」**
//      ⛔ `ShopScreen` 은 `CURATION` 을 **직접** 쓴다(`flat`·`groupList`·갈래 필터 = 세 자리).
//         `PRODUCTS` 까지 하면 **넷**이다. 한 곳만 거르면 나머지 셋으로 «안 열린 제품이 샌다».
//         📌 v11.00 「한살림」 때 정확히 그 모양이었다 — *"새는 자리가 넷이라 넷을 다 막았다"*.
//      ✅ 그래서 **`CURATION` export 자체를 걸러진 판으로** 만들었다. 이 검사는 그게 유지되는지 본다.
//
//   ⛔ `curation.js` 는 노드가 **못 연다**(`import.meta.glob` = Vite 전용) → **글자로 읽는다.**
//      (`weeklypick.js` 를 갈라 낸 이유와 같다)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
// ⏰ 「오늘」은 «한 곳»에서만 만든다(절대원칙 27) — 여기서 만들면 KST 폰에서 0~9시에 하루 어긋난다.
import { todayKST } from '../src/today.js'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => readFileSync(join(APP, p), 'utf8')
const src = 읽기('src/data/curation.js')
const shop = 읽기('src/screens/ShopScreen.jsx')

let 죽음 = 0
const 나쁨 = (m) => {
  console.error(`⛔ ${m}`)
  죽음++
}
const 좋음 = (m) => console.log(`✅ ${m}`)

// ① 원본과 걸러진 판이 갈라져 있나
if (!/const CURATION_ALL = \[/.test(src)) 나쁨('원본이 `CURATION_ALL` 이 아니다 — 거르는 판이 사라졌다')
else 좋음('원본 = `CURATION_ALL`')

const 거름 = src.match(/export const CURATION = CURATION_ALL[\s\S]{0,400}?\n\n/)
if (!거름) 나쁨('`export const CURATION` 이 `CURATION_ALL` 을 «거르지» 않는다')
else if (!/it\.from \|\| it\.from <= /.test(거름[0])) 나쁨('거르는 잣대에 `from` 비교가 없다')
else if (!/items\.length > 0/.test(거름[0])) 나쁨('빈 갈래를 안 뺀다 — 화면에 «빈 갈래 칩»이 남는다')
else 좋음('`CURATION` 이 여는 날짜로 걸러진다 (빈 갈래도 뺀다)')

// ② 잣대가 레시피와 «같은 모양»인가 — 제각각이면 나중에 한쪽만 고쳐 어긋난다
const basics = 읽기('src/data/basics.js')
if (!/!r\.from \|\| r\.from <= today/.test(basics)) 나쁨('`basics.js` 의 잣대가 바뀌었다 — 장바구니 잣대도 같이 봐야 한다')
else 좋음('레시피(`basics.js`)와 같은 잣대')

// ③ 날짜를 «한 곳»에서 만드나 (규칙 27)
if (!/import \{ todayKST \} from '\.\.\/today\.js'/.test(src)) 나쁨('`todayKST` 를 안 쓴다 — 날짜는 한 곳에서만 만든다(규칙 27)')
else 좋음('날짜 = `todayKST()`')

// ④ ⭐ 화면이 «원본»을 직접 보지 않나 — 여기가 제일 위험한 자리다
if (/CURATION_ALL/.test(shop)) 나쁨('`ShopScreen` 이 `CURATION_ALL`(원본)을 본다 — 안 열린 제품이 화면에 샌다')
else 좋음('`ShopScreen` 은 걸러진 `CURATION` 만 본다')
// ⛔ [2026-08-29] `whatsnew.js` 도 여기 들어왔다 — 창업자 확정 *"소식에 띄우자"*.
//    소식이 «원본»을 읽으면 **아직 안 열린 제품이 소식에 먼저 뜬다**(제일 나쁜 새는 자리다).
// ⛔⛔ **주석은 빼고 본다** — 안 그러면 *"`CURATION_ALL`(원본) 금지"* 라고 «적어둔 경고»가 걸려
//    고쳐놓고도 빨간불이 난다(규칙 18 ⓘ · 2026-08-29 실제로 여기서 한 번 났다).
const 코드만 = (s) =>
  s
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n')
const 새는곳 = []
for (const f of ['src/screens/ShopScreen.jsx', 'src/screens/RecipeDetailScreen.jsx', 'src/components/PantryView.jsx', 'src/data/whatsnew.js'])
  if (/CURATION_ALL|PRODUCTS_ALL/.test(코드만(읽기(f)))) 새는곳.push(f)
if (새는곳.length) 나쁨(`원본을 직접 보는 화면 ${새는곳.length}개 — ${새는곳.join(' · ')}`)

// ⑤ 달력이 이 통로를 세나 (절대원칙 28)
const cal = 읽기('scripts/release-calendar.mjs')
if (!/function cart\(\)/.test(cal) || !/\.\.\.cart\(\)/.test(cal))
  나쁨('`release-calendar.mjs` 가 장바구니를 «안 센다» — 날짜가 저절로 여는 문이 조용해진다(절대원칙 28)')
else 좋음('달력이 장바구니를 센다')

// ⑥ 실제 상태 — 지금 몇 개가 열려 있나 (막지는 않는다 · 눈으로 보라고 찍는다)
const 줄 = src.split('\n').filter((l) => /^\s*\{\s*name:\s*'/.test(l))
const 날짜있음 = 줄.filter((l) => /from:\s*'/.test(l))
const 오늘 = todayKST()
const 미래 = 날짜있음.filter((l) => (l.match(/from:\s*'([^']+)'/) || [])[1] > 오늘)
console.log(`· 제품 ${줄.length}개 · 여는 날짜가 박힌 것 ${날짜있음.length}개 · 아직 «안 열린» 것 ${미래.length}개`)

if (죽음) {
  console.error(`\n⛔⛔ 장바구니 여는 날짜 게이트 실패 — ${죽음}건. 배포를 막는다.`)
  process.exit(1)
}
console.log('✅ 장바구니 여는 날짜 통과 — 거르는 곳 하나 · 화면이 원본을 안 본다 · 달력이 센다')
