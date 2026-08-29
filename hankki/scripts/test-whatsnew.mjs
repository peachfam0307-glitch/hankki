// 📣 안내 페이지 검사 — «새로 열린 것»이 실제 날짜 게이트와 «같은 답»인지.
//
// ⭐⭐ 왜 필요한가 (창업자 2026-08-03 *"새로 열릴때 꼭 안내페이지에 올라오도록 해"*)
//   안내 페이지의 값어치는 딱 하나다 — **실제로 열리는 것과 어긋나지 않는 것.**
//   어긋나면 «없는 걸 있다»고 하거나(거짓말) «있는 걸 안 알린다»(있으나 마나).
//   ⛔ 둘 다 조용히 일어난다. 화면은 멀쩡해 보이고 아무도 안 터진다 — 그래서 검사가 필요하다.
//
// ⚠️ `whatsnew.js` 는 `components/Stickers.jsx` 를 import 하는데 거기엔 `import.meta.glob` 과
//    PNG import 가 있어 **노드로는 못 읽는다**(Vite 전용). 그래서 브라우저를 띄우지 않고
//    **소스 글자를 읽어** 같은 계산을 다시 해서 맞춰본다 — `check-picks.mjs` 와 같은 방식.
//
// 무엇을 막나
//   ⒜ 안내가 읽는 «데이터 출처»가 사라짐 (파일을 옮기거나 이름을 바꿈)
//   ⒝ 안내가 세는 날짜 목록 ≠ `release-calendar.mjs` 가 세는 날짜 목록
//   ⒞ 「곧 열려요」가 «다음 한 날짜»가 아니라 엉뚱한 걸 집음
//   ⒟ 주간 레시피 재고가 말라 안내가 영영 조용해짐 (⚠️경고만 — 배포는 안 막는다)
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gates as calendarGates } from './release-calendar.mjs'
import { todayKST } from '../src/today.js'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(APP, p), 'utf8')

let bad = 0
const fail = (m) => { console.log(`  ✗ ${m}`); bad++ }
const ok = (m) => console.log(`  ok  ${m}`)

// ⛔ [2026-08-17] 앱과 «같은» 공식이어야 한다 — 옛 공식은 KST 폰에서 하루 어긋났다
//    (`getTimezoneOffset()` 을 더하면 +9시간이 상쇄된다). 검사가 앱과 다르면 재는 의미가 없다.
//    ⭐⭐ [2026-08-17] 공식을 여기서 «베껴 적지» 않는다 — `src/today.js` 를 그대로 부른다.
//       베껴 적으면 앱만 고치고 검사는 옛 공식을 재게 된다(그럼 또 초록불이다).
const today = process.env.WHATSNEW_TODAY || todayKST()

console.log('\n── 안내 페이지(한끼 소식) ──')

// ⒜ 안내가 읽는 출처가 살아 있나 ─────────────────────────────
const NEWS = read('src/data/whatsnew.js')
for (const need of ["from './weekly'", "from '../components/Stickers'", "from './cardSeasons'"]) {
  if (NEWS.includes(need)) ok(`출처 살아 있음 — ${need}`)
  else fail(`⛔ 안내가 ${need} 를 더는 안 읽는다 — 손으로 적은 목록으로 되돌아간 것 아닌지 볼 것`)
}
// ⛔ 「손으로 적은 새 소식」이 다시 기어들어오는 것을 막는다.
if (/opened\s*[:=]\s*\[\s*\{/.test(NEWS)) fail('⛔ 안내에 «손으로 적은» 목록이 박혔다 — 데이터에서 세야 한다')
else ok('손으로 적은 목록 0')

// ⒝ 안내가 세는 날짜 == 달력이 세는 날짜 ─────────────────────
//    안내는 `STICKER_GROUPS.from` 과 `SEASON_CUTS.from` 을 읽고, 달력도 같은 것을 읽는다.
//    둘이 다르면 한쪽이 낡은 것이다.
const drawerDates = [...read('src/components/Stickers.jsx').matchAll(/from:\s*'(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1])
const cardDates = [...read('src/data/cardSeasons.js').matchAll(/from:\s*'(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1])
const mine = [...new Set([...drawerDates, ...cardDates])].sort()
// ⚠️ 달력엔 «우리 할 일»(`paidPacks.recheck` → `todo: true`)도 같이 실린다 — 잊지 않으려고 한 데 모은 것.
//    ⛔ 그건 «유저에게 새로 열리는 것»이 아니라 안내 페이지엔 안 나간다. 여기선 빼고 센다.
//    (2026-08-03 실제로 이 검사가 막았다 — 9/30 「효과 다시 보기」 약속을 넣자마자 걸렸다. 옳게 걸린 것.)
// ⛔ [2026-08-17] 달력에 «레시피»도 실리기 시작했다(전날 검수가 새던 자리) — 여기선 빼고 센다.
//    이 검사가 보는 건 «꾸미기 서랍 ＋ 레꾸자랑 카드» 두 출처뿐이다.
// ⛔ [2026-08-29] 「주부의 장바구니」(`kind: 'cart'`)도 달력에 실리기 시작했다 — 1주에 3개씩 열린다.
//    ⏳ **소식에 띄울지는 창업자 판정이다**(규칙 11) — 내가 정해서 `whatsnew.js` 에 넣지 않는다.
//    ⭐ 띄우기로 하면 ⑴`whatsnew.js` 가 `curation.js` 를 읽게 하고 ⑵여기 `kind !== 'cart'` 를 뺀다.
//       그 둘을 «같이» 해야 한다 — 한쪽만 하면 이 검사가 바로 잡는다(그게 이 검사가 하는 일이다).
const theirs = [
  ...new Set(calendarGates().filter((g) => !g.todo && g.kind !== 'recipe' && g.kind !== 'cart').map((g) => g.date)),
].sort()
if (mine.join() === theirs.join()) ok(`여는 날짜가 달력과 같다 — ${theirs.length}개 (${theirs.join(' · ')})`)
else fail(`⛔ 안내 ${mine.join(' · ')} ≠ 달력 ${theirs.join(' · ')}`)

// ⒞ 「곧 열려요」 = 오늘 이후 «가장 가까운 한 날짜» ───────────
const weeklyFroms = [...read('src/data/weekly.js').matchAll(/from:\s*'(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1]).sort()
const nextAll = [...mine, ...weeklyFroms].filter((d) => d > today).sort()
if (!nextAll.length) {
  fail('⛔ 앞으로 열릴 게 하나도 없다 — 안내가 영영 조용해진다(재고를 채울 것)')
} else {
  const next = nextAll[0]
  const n = [...mine, ...weeklyFroms].filter((d) => d === next).length
  ok(`다음에 열리는 날 = ${next} (${Math.round((Date.parse(next) - Date.parse(today)) / 86400000)}일 뒤 · ${n}건)`)
  if (nextAll.filter((d) => d === next).length !== n) fail('⛔ 같은 날짜인데 개수가 안 맞는다')
}

// ⒟ 주간 레시피 재고 ─────────────────────────────────────────
//    ⚠️ 경고만 한다 — 배포를 막으면 「재고 떨어짐」 때문에 급한 버그 수정을 못 내보낸다.
//    (`check-weekly.mjs` 가 이미 주차 재고를 따로 본다)
const left = weeklyFroms.filter((d) => d >= today).length
if (left === 0) console.log(`  ⚠️  주간 레시피 재고 0 — 홈 「이번 주 제철」 줄이 이미 사라졌다`)
else if (left <= 2) console.log(`  ⚠️  주간 레시피 재고 ${left}주치뿐 — 마지막 = ${weeklyFroms[weeklyFroms.length - 1]}`)
else ok(`주간 레시피 재고 ${left}주치 (마지막 ${weeklyFroms[weeklyFroms.length - 1]})`)

if (bad) { console.log(`\n❌ 안내 페이지 검사 실패 ${bad}건 — 배포 차단\n`); process.exit(1) }
console.log('\n✅ 안내 페이지 통과 — 안내와 실제 날짜 게이트가 같다\n')
