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
function cards() {
  const src = read('src/components/ShareDrawCard.jsx')
  const blk = src.slice(src.indexOf('const SEASON_CUTS'), src.indexOf('const DECOR'))
  const out = []
  for (const e of blk.split(/\n\s*\{\s*key:/).slice(1)) {
    const key = e.match(/^\s*'([^']+)'/)
    const from = e.match(/from:\s*'(\d{4}-\d{2}-\d{2})'/)
    if (!key || !from) continue
    const win = e.match(/win:\s*\['([^']+)',\s*'([^']+)'\]/)
    const grab = (n) => { const m = e.match(new RegExp(`${n}:\\s*\\[([^\\]]*)\\]`)); return m ? items(m[1]) : [] }
    const keys = [...grab('gom'), ...grab('peng'), ...grab('duo')]
    out.push({
      date: from[1], where: '레꾸자랑 카드 뽑기',
      what: `${key[1]} 세트${win ? ` (${win[1]} ~ ${win[2]})` : ''}`, keys,
    })
  }
  return out
}

export const gates = () => [...drawer(), ...cards()].sort((a, b) => a.date.localeCompare(b.date))
export const nextGate = (from = todayKST()) => {
  const up = gates().filter((g) => g.date >= from)
  return up.length ? up.filter((g) => g.date === up[0].date) : []
}

const mode = process.argv[2] || ''
const arg = process.argv[3] || ''

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
  console.log(`${hot ? '🚨' : '📅'} ${nx[0].date}(D${d === 0 ? '-DAY' : `-${d}`}) 에 **저절로** 열린다 — ${n}컷`)
  nx.forEach((g) => console.log(`   · ${g.where} — ${g.what} (${g.keys.length})`))
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
  console.log(`   ${g.where.padEnd(22)} ${g.what}  — ${g.keys.length}컷`)
}
console.log(`\n오늘(KST) = ${todayKST()}`)
console.log('⛔ 절대원칙 = **자동 공개 전날에 고화질 전수 검수하고 내보낸다** (창업자 2026-08-01)')
