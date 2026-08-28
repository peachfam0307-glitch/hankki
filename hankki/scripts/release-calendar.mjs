// 📅 **날짜가 저절로 여는 문** — 내가 푸시를 안 해도 유저 앞에 나타나는 것들.
//
// 왜 (창업자 2026-08-01):
//   *"딸려들어갈까봐 물어본거야. 자동으로 올라간다하니까."*
//   *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. 이건 절대원칙."*
//
// ⭐⭐ **배포에는 통로가 두 개다.**
//   ① `git push` → GitHub Actions → 즉시 배포   ← 규칙 9·13이 막는 통로
//   ② **날짜 게이트** — 이미 올라가 있는데 «그날이 되면» 저절로 열린다  ← 아무도 안 막고 있었다
//   ②는 내가 아무것도 안 해도 열린다. 그래서 **잊으면 그대로 나간다.**
//
// ⚠️ 손으로 적은 목록은 반드시 낡는다(2026-07-31에 배운 것) → **코드에서 직접 읽는다.**
//   읽는 곳 = `src/components/Stickers.jsx`(꾸미기 서랍) · `src/components/ShareDrawCard.jsx`(레꾸자랑 카드)
//
// 쓰기:
//   node scripts/release-calendar.mjs           전체 달력
//   node scripts/release-calendar.mjs --brief    세션 시작용 (가장 가까운 문 하나)
//   node scripts/release-calendar.mjs --check    임박(D-7 이내)하면 크게 알린다
//   node scripts/release-calendar.mjs --on 2026-09-01   그날 열리는 컷 «키 목록» (검수판 만들 때)
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/src')) ? join(ROOT, 'hankki') : ROOT
const read = (p) => { try { return readFileSync(join(APP, p), 'utf8') } catch { return '' } }

// ⏰ 오늘은 **무조건 KST** — 컨테이너는 UTC라 그냥 쓰면 하루 어긋난다.
//    ⭐ [2026-08-17] 여기서 «만들지» 않는다 — 날짜는 `src/today.js` 한 곳에서만(게이트 `check-kst`).
import { todayKST, tomorrowKST } from '../src/today.js'
// 🗓 요일 세기용 — `weekly.js` 는 노드가 그대로 열 수 있다(Vite 전용 문법이 없다).
//    ⛔ 못 열려도 달력 본체는 돌아야 하므로 실패하면 `null` 로 두고 요일 절만 건너뛴다.
const 주간 = await import('../src/data/weekly.js').catch(() => null)
export { todayKST }
const dday = (d, from = todayKST()) => Math.round((Date.parse(d) - Date.parse(from)) / 86400000)
const items = (s) => [...s.matchAll(/'([a-z0-9_]+)'/gi)].map((m) => m[1])

// ── ① 꾸미기 서랍 — `STICKER_GROUPS` 의 `from:` ────────────────────
//    그날이 오면 **서랍에 그룹이 통째로 나타난다.**
function drawer() {
  const out = []
  for (const line of read('src/components/Stickers.jsx').split('\n')) {
    // ⛔⛔ 주석 줄은 건너뛴다 — 2026-08-10 에 «유령 그룹»이 하나 떴다.
    //    「⛔ 자동 공개 전날 검수는 절대원칙 → … --on 2026-09-01」 이라고 «적어둔 주석»이
    //    날짜를 갖고 있어서 「? 탭 · (이름 없음) · 0컷」 으로 잡혔다.
    //    📌 이 도구는 8/31 검수의 «유일한 눈»이다 — 없는 줄을 만들면 그날 그걸 찾느라 헤맨다.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue
    const from = line.match(/from:\s*'(\d{4}-\d{2}-\d{2})'/)
    if (!from) continue
    const label = line.match(/label:\s*'([^']*)'/)
    const tab = line.match(/tab:\s*'([^']*)'/)
    const its = line.match(/items:\s*\[([^\]]*)\]/)
    out.push({
      date: from[1], where: `꾸미기 서랍 · ${tab?.[1] ?? '?'} 탭`,
      what: label?.[1] ?? '(이름 없음)', keys: its ? items(its[1]) : [],
    })
  }
  return out
}

// ── ② 레꾸자랑 카드 뽑기 풀 — `SEASON_CUTS` 의 `from:` ──────────────
//    그날이 오면 **뽑기에 그 컷들이 섞이기 시작한다.**
//    ⚠️ `win`(해마다 되풀이되는 월-일 창)도 같이 봐야 «언제 닫히는지»를 안다.
// ⚠️⚠️ 2026-08-03 — 목록이 `src/data/cardSeasons.js` 로 옮겨 갔다(안내 페이지가 같이 읽으려고).
//    ⛔ 옛 코드는 `ShareDrawCard.jsx` 에서 글자로 긁었는데, 옮긴 걸 모르면 `indexOf` 가 −1 을 내고
//       **조용히 「카드 0개」가 된다** — 검사가 안 터지고 그냥 «없는 것처럼» 보인다. 그게 제일 나쁘다.
//    ✅ 그래서 못 찾으면 «던진다». 파일을 또 옮기면 여기서 바로 걸린다.
function cards() {
  const src = read('src/data/cardSeasons.js')
  const at = src.indexOf('export const SEASON_CUTS')
  if (at < 0) throw new Error('⛔ SEASON_CUTS 를 못 찾았다 — src/data/cardSeasons.js 를 옮겼거나 이름이 바뀌었다')
  const blk = src.slice(at)
  const out = []
  for (const e of blk.split(/\n\s*\{\s*key:/).slice(1)) {
    const key = e.match(/^\s*'([^']+)'/)
    const from = e.match(/from:\s*'(\d{4}-\d{2}-\d{2})'/)
    if (!key || !from) continue
    const win = e.match(/win:\s*\['([^']+)',\s*'([^']+)'\]/)
    const label = e.match(/label:\s*'([^']+)'/)
    const grab = (n) => { const m = e.match(new RegExp(`${n}:\\s*\\[([^\\]]*)\\]`)); return m ? items(m[1]) : [] }
    const keys = [...grab('gom'), ...grab('peng'), ...grab('duo')]
    out.push({
      date: from[1], where: '레꾸자랑 카드 뽑기',
      what: `${label ? label[1] : key[1]} 세트${win ? ` (${win[1]} ~ ${win[2]})` : ''}`, keys,
    })
  }
  if (!out.length) throw new Error('⛔ 카드 세트를 하나도 못 읽었다 — cardSeasons.js 모양이 바뀌었다')
  return out
}

// ── ③ 🙋 「그날 다시 보기로 한 것」 — `paidPacks.js` 의 `recheck` ──────
//    ⭐⭐ 이건 «날짜가 여는 문»이 아니라 «우리가 한 약속»이다. 그런데 같은 달력에 둔다.
//       창업자 2026-08-03 *"이걸로 우선 가고, **전날 검수할때 한번 더 보고** 호받에 불로 갈지 정하자"*
//    ⛔ 이런 약속은 **문서에 적으면 반드시 잊는다.** 우리가 이미 배운 것 —
//       「대기·예정」이라 적어둔 줄이 넉 달 뒤에도 그대로 「대기」였다(`doc-guard --stale`).
//       📌 그래서 적는 자리를 «결정이 사는 곳»(paidPacks.js)에 두고, **달력이 그날 꺼내 보여준다.**
//    ⚠️ 컷이 아니라 「할 일」이라 `keys` 가 없다 → 검수판 키 목록(`--on`)엔 안 섞인다.
function promises() {
  const src = read('src/data/paidPacks.js')
  const out = []
  for (const m of src.matchAll(/recheck:\s*\[([\s\S]*?)\]/g)) {
    // 그 팩이 뭔지 알려면 위로 거슬러 가장 가까운 `label:` 을 본다
    const label = src.slice(0, m.index).match(/label:\s*'([^']+)'(?![\s\S]*label:\s*')/)
    for (const r of m[1].matchAll(/on:\s*'(\d{4}-\d{2}-\d{2})'\s*,\s*what:\s*'([^']*)'/g)) {
      out.push({ date: r[1], where: '🙋 그날 같이 볼 것', what: `${label ? label[1] + ' — ' : ''}${r[2]}`, keys: [], todo: true })
    }
  }
  return out
}

// ── ④ 🍳 레시피 — `basics.js` 의 `from:` ＋ `weekly.js` 의 줄 이름 ──────
//
// ⛔⛔⛔ **[2026-08-17] 이 달력이 «레시피를 안 보고 있었다» — 그래서 「전날 검수」가 통째로 샜다.**
//    📮 창업자 *"**전날 검수 못한거는 어떻게잡아? 절대원칙도 무시됐는데?**"*
//    8/17 에 레시피 5편이 저절로 열렸는데, 8/16 브리핑엔 **「9/1 D-15 · 78컷」만** 떴다.
//    달력이 ①꾸미기 서랍 ②레꾸자랑 카드 ③유료팩 약속 셋만 읽었기 때문이다.
//    📌 **「알림이 있다」와 「알림이 «전부»를 본다」는 다른 말이다** — 우리가 이미 배운 것인데 또 밟았다.
//
// ⭐ 「그날 열리는 레시피 제목」과 「검수 표시가 붙었나」를 같이 찍는다 —
//    검수가 안 됐으면 그 자리에서 보인다(＋`check-review` 가 «전날»에 배포를 막는다).
function recipes() {
  const 줄이름 = new Map()
  for (const m of read('src/data/weekly.js').matchAll(/from:\s*'(\d{4}-\d{2}-\d{2})',\s*title:\s*'([^']+)'/g)) {
    줄이름.set(m[1], [...(줄이름.get(m[1]) || []), m[2]])
  }
  const 날짜별 = new Map()
  for (const m of read('src/data/basics.js').matchAll(/\{\s*\.\.\.base,([\s\S]*?)\n  \},/g)) {
    const t = m[1].match(/title:\s*'([^']+)'/)
    const f = m[1].match(/from:\s*'(\d{4}-\d{2}-\d{2})'/)
    if (!t || !f) continue
    const r = m[1].match(/review:\s*'([^']*)'/)
    날짜별.set(f[1], [...(날짜별.get(f[1]) || []), { 제목: t[1], 검수: r ? r[1] : null }])
  }
  return [...날짜별].map(([date, 편]) => {
    const 미검수 = 편.filter((x) => x.검수 !== '창업자')
    const 줄 = 줄이름.get(date)
    return {
      date, where: '🍳 레시피', kind: 'recipe',
      what: `${줄 ? `${[...new Set(줄)].join(' · ')} — ` : ''}${편.map((x) => x.제목).join(' · ')}`
        + (미검수.length ? `   ⛔검수 안 받은 것 ${미검수.length}편` : '   ✅검수 완료'),
      keys: 편.map((x) => x.제목),
    }
  })
}

export const gates = () => [...drawer(), ...cards(), ...promises(), ...recipes()].sort((a, b) => a.date.localeCompare(b.date))
export const nextGate = (from = todayKST()) => {
  const up = gates().filter((g) => g.date >= from)
  return up.length ? up.filter((g) => g.date === up[0].date) : []
}

// ⚠️ 훅이 `import` 할 때 아래 출력이 딸려 나오면 안 된다 — 직접 실행일 때만 돈다.
//    (2026-08-01 실제로 세션 브리핑에 달력 전체가 두 번 찍혔다)
const isMain = (process.argv[1] || '').endsWith('release-calendar.mjs')
const mode = process.argv[2] || ''
const arg = process.argv[3] || ''
if (isMain) {

// 📅📅 **`--tomorrow` = 「자동 공개 전날 검수」를 «하루 닫을 때» 강제하는 자리** (2026-08-17)
//
// 📮 창업자 = *"**심지어 어제 자기전에 확인하라했는데 네가 안 읽었잖아. 이걸어떻게 강제해?**"*
//
// ⛔⛔ **맞는 지적이다** — 창업자는 8/16 밤에 *"내일 여름시원한 것 열리네? 확인만해줘"* 라고
//    «말로» 알려줬고, 나는 `/잘자` 를 돌리면서도 그걸 안 했다.
//    `/잘자` 순서(복기·정리·점검·청소·아카이브·저장)에 **「내일 열리는 것」 칸이 아예 없었다.**
//
// ⭐ 그래서 `/잘자` 가 이걸 부르고, **검수 안 된 레시피가 내일 열리면 exit 1 로 죽는다.**
//    ＝ 하루를 «닫을 수 없다». 규칙으로 부탁하던 것이 장치가 된다.
if (mode === '--tomorrow') {
  const 내일 = tomorrowKST()
  const g = gates().filter((x) => x.date === 내일)
  if (!g.length) { console.log(`✅ 내일(${내일}) 저절로 열리는 것 없음`); process.exit(0) }
  console.log(`📅📅 **내일(${내일}) 저절로 열린다** — 절대원칙: «오늘» 검수한다\n`)
  g.forEach((x) => console.log(`   · ${x.where} — ${x.what}${x.todo ? '' : `  (${x.keys.length})`}`))
  const 미검수 = g.filter((x) => x.kind === 'recipe' && /검수 안 받은 것/.test(x.what))
  if (미검수.length) {
    console.log(`\n⛔⛔ 검수 안 받은 레시피가 «내일» 열린다 — 오늘 안에 창업자 검수를 받을 것.`)
    console.log(`   👉 창업자에게 실물을 보여 주고, 확인받으면 그 편에 review: '창업자', 를 붙인다.`)
    console.log(`   ⛔ 내가 잘 썼다고 생각해서 붙이는 표시가 아니다.`)
    process.exit(1)
  }
  console.log(`\n   ⚠️ 레시피 검수는 끝났다. 그림·카드는 «고화질 전수»로 눈으로 볼 것:`)
  console.log(`      node hankki/scripts/release-calendar.mjs --on ${내일}`)
  process.exit(0)
}

if (mode === '--on') {
  const g = gates().filter((x) => x.date === arg)
  if (!g.length) { console.log(`(${arg} 에 열리는 건 없다)`); process.exit(0) }
  console.log(g.flatMap((x) => x.keys).join(' '))
  process.exit(0)
}

// 🚨🚨 **검수 안 받은 레시피가 «앞으로» 언제 열리나 — 미리 보여준다** (2026-08-17)
//
// ⛔⛔ **「전날」만으로는 늦다.** 전날에 걸리면 그날 밤에 급히 검수해야 하고,
//    우리는 **매주 5편씩 16번** 그 상황을 맞게 되어 있었다(8/24 ~ 12/07 · 62편).
//    📌 실측으로 드러난 것 — 2026-08-17 사고는 **첫 번째였을 뿐**이다.
// ⭐ 그래서 브리핑에 **D-30 안의 검수 대기**를 같이 띄운다. 몰아서 미리 받으면 밤에 안 몰린다.
const 검수대기 = (안 = 30) => {
  const 오늘 = todayKST()
  return gates()
    .filter((g) => g.kind === 'recipe' && g.date > 오늘 && /검수 안 받은 것/.test(g.what))
    .filter((g) => dday(g.date) <= 안)
    .map((g) => ({ ...g, d: dday(g.date) }))
}
// 📅📅 **`--month <YYYY-MM>` = 「한 달치 미리 검수」의 재료** (창업자 확정 2026-08-17)
//    📮 *"앞으로 **한달치씩 미리 검수해두자.** 전날도 무조건 한번 확인하고 나가고"*
//    ⭐ 그 달에 열리는 레시피를 «검수 됐든 안 됐든» 전부 준다 — 판을 한 번에 뽑으라고.
if (mode === '--month') {
  const 달 = arg || todayKST().slice(0, 7)
  const 것 = gates().filter((g) => g.kind === 'recipe' && g.date.startsWith(달))
  if (!것.length) { console.log(`(${달} 에 열리는 레시피가 없다)`); process.exit(0) }
  const 미검수 = 것.filter((g) => /검수 안 받은 것/.test(g.what))
  const n = 것.reduce((s, g) => s + g.keys.length, 0)
  console.log(`📅 ${달} 에 열리는 레시피 ${n}편 (${것.length}번) · 검수 대기 ${미검수.length}번\n`)
  것.forEach((g) => console.log(`   ${g.date} (D-${dday(g.date)})  ${g.what}`))
  // ⛔ 없는 명령을 안내하지 않는다 — 지금 있는 판 생성기는 `_판-검수5편-0817.mjs`(8/17 전용)뿐이다.
  //    ⏳ 날짜를 인자로 받는 일반판은 아직 «없다». 만들 때 이 줄을 같이 고친다.
  console.log(`\n   👉 판 재료 = 위 날짜들 ${미검수.map((g) => g.date).join(' ')}`)
  console.log(`      판 생성기는 scripts/_판-검수5편-0817.mjs 를 본떠 만든다(⏳날짜를 받는 일반판은 아직 없다)`)
  process.exit(0)
}

if (mode === '--pending') {
  const 것 = 검수대기(Number(arg) || 365)
  if (!것.length) { console.log('✅ 앞으로 열릴 레시피는 전부 검수 표시가 있다'); process.exit(0) }
  const n = 것.reduce((s, g) => s + Number((g.what.match(/검수 안 받은 것 (\d+)편/) || [, 0])[1]), 0)
  console.log(`⏳ 검수 안 받은 레시피가 «앞으로» ${것.length}번에 걸쳐 ${n}편 열린다\n`)
  것.forEach((g) => console.log(`   ${g.date} (D-${g.d})  ${g.what}`))
  console.log(`\n   👉 몰아서 미리 검수판을 뽑는다 — 전날에 몰리면 그날 밤에 급해진다.`)
  process.exit(0)
}

const nx = nextGate()
if (mode === '--brief' || mode === '--check') {
  // ⭐ 「가장 가까운 한 날짜」와 별개로 **검수 대기는 늘 보인다** — 미리 준비하라고.
  const 대기 = 검수대기(30)
  if (대기.length) {
    const n = 대기.reduce((s, g) => s + Number((g.what.match(/검수 안 받은 것 (\d+)편/) || [, 0])[1]), 0)
    console.log(`⏳ **검수 안 받은 레시피가 30일 안에 ${대기.length}번 · ${n}편 열린다** — 미리 받아둘 것`)
    대기.slice(0, 3).forEach((g) => console.log(`   · ${g.date} (D-${g.d}) ${g.what.replace(/\s+⛔검수.*/, '').slice(0, 62)}`))
    if (대기.length > 3) console.log(`   · … 외 ${대기.length - 3}번  (전부 보기 = release-calendar.mjs --pending)`)
  }
  if (!nx.length) process.exit(대기.length && mode === '--check' ? 0 : 0)
  const d = dday(nx[0].date)
  const n = nx.reduce((s, g) => s + g.keys.length, 0)
  const hot = d <= 7
  if (mode === '--check' && !hot) process.exit(0)
  // ⚠️ 「할 일」만 있는 날에 «0컷 저절로 열린다» 라고 하면 거짓말이 된다 — 문장을 갈라 쓴다
  console.log(n
    ? `${hot ? '🚨' : '📅'} ${nx[0].date}(D${d === 0 ? '-DAY' : `-${d}`}) 에 **저절로** 열린다 — ${n}컷`
    : `${hot ? '🚨' : '🙋'} ${nx[0].date}(D${d === 0 ? '-DAY' : `-${d}`}) 에 **다시 보기로 한 것**이 있다`)
  nx.forEach((g) => console.log(`   · ${g.where} — ${g.what}${g.todo ? '' : ` (${g.keys.length})`}`))
  if (hot) {
    console.log('   ⛔ **절대원칙(창업자 2026-08-01) = 자동 공개 전날에 반드시 고화질 전수 검수.**')
    console.log(`   👉 키 목록: node hankki/scripts/release-calendar.mjs --on ${nx[0].date}`)
  }
  process.exit(0)
}

console.log('📅 날짜가 저절로 여는 문 (푸시 안 해도 열린다)\n')
let last = ''
for (const g of gates()) {
  const d = dday(g.date)
  if (g.date !== last) { console.log(`\n${g.date}  ${d < 0 ? '(이미 열림)' : `D-${d}`}`); last = g.date }
  console.log(`   ${g.where.padEnd(22)} ${g.what}${g.todo ? '' : `  — ${g.keys.length}컷`}`)
}
console.log(`\n오늘(KST) = ${todayKST()}`)
console.log('⛔ 절대원칙 = **자동 공개 전날에 고화질 전수 검수하고 내보낸다** (창업자 2026-08-01)')
요일박기()
}

// 🗓🗓 **매주 «무슨 요일»에 바뀌나** (창업자 2026-08-28 = *"이번주제철, 우리집레시피, 장바구니 나가는 요일 달력에 박자."*)
//
// ⛔⛔ **손으로 「월요일」이라고 적지 않는다** — 값이 바뀌면 그 글자만 낡는다.
//    ⭐ 실제 `from` 날짜와 회전 공식에서 «세어서» 말한다. 어긋나면 그 자리에서 드러난다.
// 🔢 실측(2026-08-28) = 제철 19주·우리집 25주가 «전부 월요일» · 장바구니는 에폭 주차라 «목요일»
function 요일박기 () {
  const 요일 = ['일', '월', '화', '수', '목', '금', '토']
  const 요일글 = (ymd) => 요일[new Date(`${ymd}T00:00:00Z`).getUTCDay()]
  const 세기 = (froms) => {
    const c = {}
    for (const f of froms) { const d = 요일글(f); c[d] = (c[d] || 0) + 1 }
    const 줄 = Object.entries(c).sort((a, b) => b[1] - a[1])
    return { 대표: 줄[0]?.[0] || '?', 몇: 줄[0]?.[1] || 0, 전부: froms.length, 섞임: 줄.length > 1 ? 줄.map(([k, v]) => `${k}${v}`).join('·') : '' }
  }
  // ⛔⛔ **글자로 가르지 않는다** — 처음엔 「HOMEMADE」 낱말 자리로 파일을 잘라 셌는데
  //    그 낱말이 주석에도 나와서 **19/25 를 16/28 로 잘못 셌다.** 요일 결론은 같았지만
  //    «찍히는 숫자»가 틀리면 그걸 근거로 다음 판단을 하게 된다(절대원칙 18).
  //    ✅ `weekly.js` 는 노드가 그대로 열 수 있다 → 배열을 직접 읽는다.
  const { WEEKLY, HOMEMADE } = 주간 || {}
  if (!WEEKLY || !HOMEMADE) { console.log('\n⚠️ weekly.js 를 못 읽어 요일을 못 센다'); return }
  const 제철 = 세기(WEEKLY.map((w) => w.from).filter(Boolean))
  const 우리집 = 세기(HOMEMADE.map((w) => w.from).filter(Boolean))
  // 🛒 장바구니 = `weekNo` 가 에폭 주차(1970-01-01 목요일 기준)라 «목요일»에 넘어간다.
  //    ⛔ 「목요일이다」라고 적지 말고 돌려서 찾는다 — 공식이 바뀌면 여기도 같이 바뀐다.
  const weekNo = (ymd) => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 604800000)
  let 픽요일 = '?', 앞 = null, 밑 = todayKST()
  for (let i = 0; i < 14; i++) {
    const d = new Date(`${밑}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i)
    const ymd = d.toISOString().slice(0, 10)
    const w = weekNo(ymd)
    if (앞 !== null && w !== 앞) { 픽요일 = 요일글(ymd); break }
    앞 = w
  }
  console.log('\n🗓 매주 «무슨 요일»에 바뀌나')
  console.log(`   🌾 이번 주 제철      ${제철.대표}요일  (${제철.전부}주 중 ${제철.몇}주${제철.섞임 ? ` · 섞임 ${제철.섞임}` : ''})`)
  console.log(`   🍚 우리집 레시피     ${우리집.대표}요일  (${우리집.전부}주 중 ${우리집.몇}주${우리집.섞임 ? ` · 섞임 ${우리집.섞임}` : ''})`)
  console.log(`   🛒 장바구니 이번 주 픽 ${픽요일}요일  (에폭 주차 — weeklypick.js 의 weekNo)`)
  if (픽요일 !== 제철.대표) {
    console.log(`   ⚠️ **셋이 안 맞는다** — 픽은 「이번 주 레시피가 쓰는 제품」을 앞에 세우는데`)
    console.log(`      레시피는 ${제철.대표}요일, 회전은 ${픽요일}요일이라 픽이 «한 주에 두 번» 움직인다.`)
    console.log(`      ⏳ 맞출지는 창업자 판정 — 판 = _판-장바구니한달-0828.mjs`)
  }
}
