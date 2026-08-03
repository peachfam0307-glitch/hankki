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
export const todayKST = () =>
  new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })   // sv-SE = YYYY-MM-DD
const dday = (d, from = todayKST()) => Math.round((Date.parse(d) - Date.parse(from)) / 86400000)
const items = (s) => [...s.matchAll(/'([a-z0-9_]+)'/gi)].map((m) => m[1])

// ── ① 꾸미기 서랍 — `STICKER_GROUPS` 의 `from:` ────────────────────
//    그날이 오면 **서랍에 그룹이 통째로 나타난다.**
function drawer() {
  const out = []
  for (const line of read('src/components/Stickers.jsx').split('\n')) {
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

export const gates = () => [...drawer(), ...cards(), ...promises()].sort((a, b) => a.date.localeCompare(b.date))
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

if (mode === '--on') {
  const g = gates().filter((x) => x.date === arg)
  if (!g.length) { console.log(`(${arg} 에 열리는 건 없다)`); process.exit(0) }
  console.log(g.flatMap((x) => x.keys).join(' '))
  process.exit(0)
}

const nx = nextGate()
if (mode === '--brief' || mode === '--check') {
  if (!nx.length) process.exit(0)
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
}
