// 🗓🗓 [재현판 · 2026-08-28] **셋이 «다른 요일»에 열리나** — 월 우리집 · 수 제철 · 금 장바구니
//
// 📮 창업자 = *"이번주 레시피랑 제철을 각각 다른요일에 오픈하면 어떨까.
//    **월요일날 오픈하면 일주일내내 앱이 변화가 없으니까. 나눠서 오픈하면 들어올 일이 생겨**
//    (예를 들어 월-이번주레시피 수-이번주제철 금-주부의 장바구니 이런 식으로. **요일도 딱 박고**)"*
//
// ⭐⭐ **심장 = 「한 주에 «며칠» 바뀌나」다.** ⛔「요일 표가 있나」가 아니다 —
//    표를 적어두고 안 쓰는 코드가 있으면 표 검사는 초록불인데 앱은 그대로 월요일이다(규칙 18 ⓘ).
//    그래서 **7일을 하루씩 실제로 돌려** 「어제와 달라진 날」을 센다.
//
// ⛔ 브라우저가 필요 없다 — 순수 계산이라 노드로 돈다(빠르고 안 흔들린다).
//
// 🧪 규칙 12 = `src/openday.js` 의 `OPEN_DAY` 를 셋 다 `1`(전부 월요일)로 되돌리면
//    「바뀌는 날이 3일」과 「제철은 월요일엔 아직 지난 줄」 칸이 죽는다.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { WEEKLY, HOMEMADE, weeklyNow, homemadeNow } from '../src/data/weekly.js'
import { allBasicRecipes } from '../src/data/basics.js'
import { OPEN_DAY, rotateTodayKST, openYmd, openedOn, openDayName } from '../src/openday.js'
import { pickRotate } from '../src/data/weeklypick.js'
import { todayKST } from '../src/today.js'

// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 연다 → 글자로 읽는다.
//    (`check-weeklypick.mjs` 가 이미 쓰는 방식 — 새로 발명하지 않는다)
const HERE = dirname(fileURLToPath(import.meta.url))
const 큐레이션소스 = readFileSync(join(HERE, '../src/data/curation.js'), 'utf8')
const PRODUCTS = [...큐레이션소스.matchAll(/\{\s*name:\s*'([^']+)'(?:,\s*brand:\s*'([^']+)')?(?:[^}\n]*?since:\s*'([^']+)')?/g)]
  .map((m) => ({ name: m[2] ? `${m[2]} ${m[1]}` : m[1], since: m[3] || '' }))
// ⭐ 픽 목록 = 「이번 주 제철이 쓰는 제품」은 여기서 안 흉내낸다(그건 `check-weeklypick` 이 본다).
//    이 판이 재는 것은 **«언제» 바뀌나** 하나뿐이라 회전만 있으면 충분하다.
const 픽목록 = (ymd) => pickRotate({ products: PRODUCTS, matched: [], today: ymd, n: 4 })

let 통과 = 0
let 실패 = 0
const 잰다 = (이름, 참인가, 덧말 = '') => {
  if (참인가) { 통과++; console.log(`  ✅ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
  else { 실패++; console.log(`  ❌ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
}

// 그날 낮 12시(KST) 로 만든다 — 자정 언저리 반올림에 안 흔들리게.
const 더하기 = (ymd, n) => new Date(Date.parse(`${ymd}T03:00:00Z`) + n * 86400000)
// ⛔ 날짜 문자열은 우리가 안 만든다 — 「한 곳에서만」(절대원칙 27 · check-kst 가 막는다)
const 찍기 = (d) => todayKST(d)

const 레시피 = allBasicRecipes

console.log('\n🗓 오픈 요일 재현판 — 월 우리집 · 수 제철 · 금 장바구니\n')

// ── ① 요일 표 ────────────────────────────────────────────────
console.log('① 요일 표')
잰다('우리집레시피 = 월요일', OPEN_DAY.homemade === 1, openDayName('homemade'))
잰다('이번 주 제철 = 수요일', OPEN_DAY.season === 3, openDayName('season'))
잰다('주부의 장바구니 = 금요일', OPEN_DAY.pick === 5, openDayName('pick'))

// ── ② 밀기·되돌리기가 짝이 맞나 ──────────────────────────────
console.log('\n② 밀기 ↔ 되돌리기')
for (const 갈래 of ['homemade', 'season', 'pick']) {
  const 월 = '2026-09-07'
  const 열림 = openedOn(갈래, 월)
  잰다(`${갈래}: ${월}(월) → 실제 열리는 날 ${열림}`,
    openYmd(갈래, 열림) === 월,
    `되돌리면 ${openYmd(갈래, 열림)}`)
}
잰다('제철은 월요일 이틀 뒤(수)에 열린다', openedOn('season', '2026-09-07') === '2026-09-09')
잰다('장바구니는 나흘 뒤(금)에 열린다', openedOn('pick', '2026-09-07') === '2026-09-11')

// ── ③ 그 주 «어느 날»에 바뀌나 ────────────────────────────────
// 시험 창 = 앞으로 열릴 줄이 둘 다 있는 주를 고른다(재고가 마르면 못 잰다).
const 오늘 = 찍기(new Date())
const 다음제철 = WEEKLY.filter((w) => w.from > 오늘).sort((a, b) => a.from.localeCompare(b.from))[0]
const 다음우리집 = HOMEMADE.filter((w) => w.from > 오늘).sort((a, b) => a.from.localeCompare(b.from))[0]

console.log('\n③ 한 주를 하루씩 돌려 «바뀌는 날»을 센다')
if (!다음제철 || !다음우리집) {
  실패++
  console.log('  ❌ 앞으로 열릴 줄이 모자라 못 쟀다 — 재고를 채우고 다시 돌린다')
} else {
  // 두 줄의 `from` 이 같은 주가 아니면 늦은 쪽 주를 본다(둘 다 그 주 월요일이다)
  const 그주월 = 다음제철.from > 다음우리집.from ? 다음제철.from : 다음우리집.from
  const 요일이름 = ['월', '화', '수', '목', '금', '토', '일']
  const 본것 = []
  for (let i = -1; i < 7; i++) {
    const d = 더하기(그주월, i)
    본것.push({
      요일: i < 0 ? '(전날)' : 요일이름[i],
      날: 찍기(d),
      제철: weeklyNow(레시피, d)?.from || '-',
      우리집: homemadeNow(레시피, d)?.from || '-',
      픽: 픽목록(rotateTodayKST('pick', d)).map((p) => p.name).join('/'),
    })
  }
  for (const r of 본것) console.log(`     ${r.요일}\t${r.날}\t제철 ${r.제철}\t우리집 ${r.우리집}`)

  const 바뀐날 = []
  for (let i = 1; i < 본것.length; i++) {
    const a = 본것[i - 1]
    const b = 본것[i]
    const 뭐가 = []
    if (a.제철 !== b.제철) 뭐가.push('제철')
    if (a.우리집 !== b.우리집) 뭐가.push('우리집')
    if (a.픽 !== b.픽) 뭐가.push('장바구니')
    if (뭐가.length) 바뀐날.push(`${b.요일}(${뭐가.join('＋')})`)
  }
  console.log(`     → 바뀌는 날 = ${바뀐날.join(' · ') || '없음'}`)

  잰다('한 주에 «세 번» 바뀐다', 바뀐날.length === 3, 바뀐날.join(' · '))
  잰다('월요일에 바뀌는 것 = 우리집레시피 하나', 바뀐날.some((s) => s.startsWith('월(우리집)')))
  잰다('수요일에 바뀌는 것 = 제철 하나', 바뀐날.some((s) => s.startsWith('수(제철)')))
  잰다('금요일에 바뀌는 것 = 장바구니 하나', 바뀐날.some((s) => s.startsWith('금(장바구니)')))
  잰다('제철은 월·화엔 아직 «지난 줄»이다',
    본것[1].제철 !== 다음제철.from && 본것[3].제철 === 다음제철.from,
    `월 ${본것[1].제철} → 수 ${본것[3].제철}`)

  // ⛔ 빈 날이 있으면 안 된다 — 미루는 것이지 비우는 게 아니다(우리 규칙)
  잰다('일곱 날 모두 제철·우리집 박스가 있다',
    본것.every((r) => r.제철 !== '-' && r.우리집 !== '-'))
  잰다('일곱 날 모두 장바구니 픽이 4개', 본것.every((r) => r.픽.split('/').length === 4))
}

console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
