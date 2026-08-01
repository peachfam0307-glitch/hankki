// 🧭 문서 함정 두 개를 잡는다 — **「문서를 믿고 실물을 안 본」 사고.**
//
// 왜 (창업자 2026-08-01):
//   *"우리가 정한거는 그때그때 반영 좀 해."* · *"원인찾고 다시이런일 없게 시스템만들어"*
//
// 하루에 같은 뿌리로 두 번 틀렸다:
//   ⒜ **한 문서 «안»의 세대** — 배경 README 위쪽(7/31 밤)만 읽고 「추석＝조각보·달밤억새」라고 썼다.
//      확정은 **같은 문서 맨 아래**(8/1)에 「추석＝클레이 가을밤 1개」로 있었다.
//      ⚠️ `latest-hook` 은 «파일 사이» 세대만 막는다. **한 파일 안은 못 막는다.**
//   ⒝ **문서의 「대기」를 그대로 믿음** — 「클레이 가을밤 재생성 대기」라고 적어둔 채 하루를 갔는데
//      **재생성본은 이미 저장돼 있었고, 그날 내가 한복 곰을 얹어 판정할 때 쓴 배경이 바로 그것**이었다.
//      **파일을 손에 쥐고 쓰면서도 문서만 보고 상태를 적었다.**
//
// 📌 그래서 이 도구는 **문서가 아니라 파일을 본다.**
//
// 쓰기:
//   node scripts/doc-guard.mjs --gen <문서>   이 문서의 세대 목록 + 맨 아래(최신)
//   node scripts/doc-guard.mjs --stale        「대기·예정」인데 **파일은 이미 있는** 줄
//   node scripts/doc-guard.mjs                둘 다
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/docs')) ? join(ROOT, 'hankki') : ROOT

const walk = (d, out = []) => {
  for (const f of readdirSync(d)) {
    if (f.startsWith('.') || f === 'node_modules') continue
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (f.endsWith('.md')) out.push(p)
  }
  return out
}

// ── ⒜ 한 문서 안의 «세대» ──────────────────────────────────────
//   날짜가 붙은 제목이 2개 이상이면 「세대 문서」다. 맨 아래가 현행이다.
export function generations(file) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const gens = []
  lines.forEach((l, i) => {
    if (!/^#{1,3}\s/.test(l)) return
    const d = l.match(/(20\d\d-\d\d-\d\d)/)
    if (d) gens.push({ line: i + 1, date: d[1], title: l.replace(/^#+\s*/, '').trim() })
  })
  return gens
}

// ── ⒝ 「대기」인데 파일은 이미 있는 줄 ──────────────────────────
//   ⚠️⚠️ **처음엔 「백틱 안의 경로」만 봤는데 그러면 오늘 사고를 못 잡는다.**
//      실제 문장은 *"**클레이 가을밤** — 나무 작게"* 였다 — **경로도 확장자도 없다.**
//      ⭐ 그래서 **이름을 느슨하게 맞춘다** — 공백·하이픈·언더바를 지우고 비교한다.
//        「클레이 가을밤」 → `클레이가을밤` ↔ `원본/클레이-가을밤.png` → `클레이가을밤` **일치**
//   📌 이게 「검사를 만들면 옛 값으로 먼저 돌려본다」의 결과다. 안 돌려봤으면 못 잡는 검사를 두고 안심했다.
//   ⚠️⚠️ **두 번째 헛방** — 넓힌 뒤에도 못 잡았다. 실제 문서는 이렇게 생겼다:
//        `### ⏳ 창업자가 다시 뽑기로 한 것`      ← 「대기」 신호는 **제목에만** 있고
//        `- **클레이 가을밤** — 나무 작게`        ← **정작 대상이 있는 줄엔 없다**
//      → **줄 단위로 보면 안 된다.** 제목에 신호가 걸리면 **그 아래 문단 전체**를 대기 구간으로 본다.
const WAIT = /대기|예정|아직|미정|TODO|뽑기로|다시 뽑|재생성|만들 것|해야 함|할 것|필요/
const norm = (s) => s.replace(/\.[a-z0-9]+$/i, '').replace(/^.*\//, '').replace(/[\s\-_·]/g, '').toLowerCase()
const SKIP_DIR = /^_|제외|보관|백업|구판|아껴둠|archive/
const rel = (p) => resolve(p).replace(APP + '/', '')

// 저장소의 «현행» 자산 이름표 — 격리 폴더는 뺀다(거기 있는 건 「있다」로 안 친다)
function assetIndex() {
  const idx = new Map()
  const roots = ['docs/stickers', 'design', 'src/assets', 'docs'].map((r) => join(APP, r)).filter(existsSync)
  const st = roots.map((r) => [r, 0])
  while (st.length) {
    const [d, k] = st.pop()
    if (k > 6) continue
    let fs = []
    try { fs = readdirSync(d) } catch { continue }
    for (const f of fs) {
      const p = join(d, f)
      let s
      try { s = statSync(p) } catch { continue }
      if (s.isDirectory()) { if (!SKIP_DIR.test(f)) st.push([p, k + 1]) }
      else if (/\.(png|jpg|jpeg|mjs|js|jsx|py|html|mp4|aab)$/i.test(f) && !idx.has(norm(f))) idx.set(norm(f), p)
    }
  }
  return idx
}

// ⭐ **요즘 손댄 문서만** — 46건을 매번 쏟으면 아무도 안 본다(시끄러운 게이트는 죽은 게이트).
//   오래된 문서의 낡은 「대기」는 사고를 안 낸다. **지금 만지는 문서**의 것만 봐야 값이 있다.
export function recentDocs(days = 3) {
  try {
    const out = execFileSync('git', ['log', `--since=${days} days ago`, '--name-only', '--pretty=format:'],
      { cwd: ROOT, encoding: 'utf8' })
    const set = new Set(out.split('\n').map((s) => s.trim()).filter((s) => s.endsWith('.md')))
    return [...set].map((r) => join(ROOT, r)).filter(existsSync)
  } catch { return [] }
}

export function stale(files) {
  const idx = assetIndex()
  const hits = []
  for (const f of (files || walk(join(APP, 'docs')))) {
    if (/CLAUDE\.md$|기능-아카이브|작업복기|전체복기|삽질/.test(f)) continue   // 기록 문서는 「할 일」이 아니다
    const lines = readFileSync(f, 'utf8').split('\n')
    let zone = false                                   // 「대기 문단」 안인가
    lines.forEach((l, i) => {
      if (/^#{1,4}\s/.test(l)) zone = WAIT.test(l)     // 제목이 구간을 연다/닫는다
      // ⚠️⚠️ **조이지 않으면 죽은 검사가 된다.** 처음엔 9건 중 대부분이 헛방이었다 —
      //   `CLAUDE.md` 의 긴 «핀» 줄은 지나간 이야기라 「대기」 낱말이 우연히 섞인다.
      //   📌 시끄러운 게이트는 아무도 안 본다(우리 규칙). → **짧은 줄 · 핀 파일 제외**로 조인다.
      if (l.length > 180) return                       // 긴 줄 = 기록이지 할 일 목록이 아니다
      if (!zone && !WAIT.test(l)) return
      // 이 줄에서 「이름처럼 생긴 것」 = **굵게** 또는 `백틱` 으로 감싼 토큰
      const toks = [...l.matchAll(/\*\*([^*]{2,30})\*\*/g), ...l.matchAll(/`([^`]{2,60})`/g)].map((m) => m[1])
      for (const t of toks) {
        const key = norm(t)
        if (key.length < 4) continue
        const found = idx.get(key)
        if (found && !SKIP_DIR.test(rel(found).split('/').pop())) {
          hits.push({ file: rel(f), line: i + 1, name: t, found: rel(found), text: l.trim().slice(0, 110) })
        }
      }
    })
  }
  // 같은 줄 중복 제거
  return hits.filter((h, i) => hits.findIndex((x) => x.file === h.file && x.line === h.line) === i)
}

// ⚠️ 다른 스크립트가 `import` 할 때 아래 출력이 딸려 나오면 안 된다 — 직접 실행일 때만 돈다.
const isMain = (process.argv[1] || '').endsWith('doc-guard.mjs')
const mode = process.argv[2] || ''
const arg = process.argv[3] || ''
if (!isMain) { /* 라이브러리로 쓰임 */ } else {

if (mode === '--gen') {
  const f = resolve(arg.startsWith('/') ? arg : join(APP, arg))
  const g = generations(f)
  if (g.length < 2) { console.log('세대 1개 이하 — 그냥 읽으면 된다'); process.exit(0) }
  const top = g[g.length - 1]
  console.log(`📚 이 문서엔 «세대»가 ${g.length}개 쌓여 있다 — **맨 아래가 현행이다.**`)
  g.forEach((x) => console.log(`   ${x === top ? '⭐' : '  '} ${x.line}줄  ${x.date}  ${x.title}`))
  console.log(`\n👉 ${top.line}줄부터 먼저 읽어라. 위쪽은 «지나간 판단»이다.`)
  process.exit(0)
}

if (mode !== '--stale') {
  // 전체 훑기 — 세대 문서 목록
  const many = []
  for (const f of walk(join(APP, 'docs'))) {
    const g = generations(f)
    if (g.length >= 2) many.push({ f: rel(f), n: g.length, top: g[g.length - 1] })
  }
  console.log(`📚 «세대»가 쌓인 문서 ${many.length}개 — 이런 건 **맨 아래부터** 읽는다\n`)
  many.sort((a, b) => b.n - a.n).slice(0, 12)
    .forEach((m) => console.log(`   ${String(m.n).padStart(2)}세대  ${m.f}\n            ⭐ 현행 = ${m.top.line}줄  ${m.top.title}`))
  console.log('')
}

const st = stale(mode === '--stale' && arg === '--recent' ? recentDocs() : undefined)
if (!st.length) console.log('✅ 「대기」인데 파일이 이미 있는 줄 — 없음')
else {
  console.log(`⚠️  「대기·예정」이라고 적혀 있는데 **파일은 이미 있는** 줄 ${st.length}개`)
  console.log('   (끝난 일을 「대기」로 남겨두면 다음 사람이 또 안 한다 — 2026-08-01 클레이 가을밤 사고)\n')
  st.slice(0, 20).forEach((h) => {
    console.log(`   ${h.file}:${h.line}`)
    console.log(`      ${h.text}`)
    console.log(`      👉 실제로 있다: ${h.found}`)
  })
}
}
