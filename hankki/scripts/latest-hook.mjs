// 🔒 최신 훅 — 「옛 문서·옛 파일을 먼저 보는 것」을 하네스가 막는다.
//
// 왜 (창업자 2026-07-31):
//   *"규칙만 만들면 뭐해 안지키는데."*
//   *"모든 걸 다 그렇게 만들어줘. 어떤 문서든 관련된 최신문서 미리 읽고 시작하도록"*
//   `cut-guard.sh` 와 같은 생각이다 — **문서에 "읽기로 약속"하는 건 결국 기억이다.**
//
// 세 자리에 붙는다
//   ① UserPromptSubmit — 창업자 말에서 주제를 뽑아 **그 주제의 최신 문서를 먼저 들이민다**
//   ② SessionStart     — 세션 열릴 때 주제별 최신을 한 번 깔아둔다
//   ③ PreToolUse(Read/Edit/Write) — **옛 것을 열면 막는다**
//        · `_구판/` 안의 파일        → 현행을 먼저 읽어야 열린다
//        · 같은 주제의 더 옛 문서    → 최신을 먼저 읽어야 열린다
//      ⭐ 막기만 하고 길이 없으면 일을 못 한다. 그래서 **«최신을 읽었으면 옛것도 열린다»** 로 했다.
//         (역사를 봐야 할 때가 진짜 있다. 다만 최신을 본 뒤에 보라는 것.)
//
// 읽은 기록은 `.git/hankki-최신읽음.json` — `.git` 안이라 커밋되지 않는다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readPins, byTopic, scanDocs, topicsIn } from './latest-map.mjs'
import { checkStale, staleBanner } from './stale-check.mjs'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/docs')) ? join(ROOT, 'hankki') : ROOT
const STATE = join(ROOT, '.git/hankki-최신읽음.json')
const readSet = () => { try { return new Set(JSON.parse(readFileSync(STATE, 'utf8'))) } catch { return new Set() } }
const save = (s) => { try { writeFileSync(STATE, JSON.stringify([...s])) } catch { /* 훅은 절대 세션을 깨지 않는다 */ } }

// 앱 폴더 기준 상대경로로 통일 (docs/… · design/…)
const rel = (p) => {
  if (!p) return ''
  const abs = p.startsWith('/') ? p : join(process.cwd(), p)
  for (const base of [APP, ROOT]) if (abs.startsWith(base + '/')) return abs.slice(base.length + 1)
  return p
}

let hook = {}
try { hook = JSON.parse(readFileSync(0, 'utf8')) } catch { process.exit(0) }
const ev = hook.hook_event_name || ''

// ⛔⛔⛔ **낡은 디스크에서는 「최신 문서」를 «뿌리지 않는다».** (창업자 2026-08-11 *"시작브리핑 낡은거 반영안되도록 시스템만들자"*)
//
//   그날 아침 컨테이너가 «어제 낮» 스냅샷으로 되살아났는데 이 훅은 **그걸 모르고**
//   *"작업복기 → 2026-08-09"* 를 「최신」이라며 뿌렸다. 어젯밤에 8/10 판을 만들어 푸시해 뒀는데도.
//   ⭐⭐ **제일 나쁜 것은 「낡은 것」이 아니라 「낡은 것을 최신인 척 주는 것」이다.**
//      최신인 줄 알면 그 위에서 판단하고 문서를 고치고 창업자에게 보고한다 — 2026-08-10 에 실제로 그랬다.
//
//   ⭐ 그래서 낡았으면 **목록 대신 「낡았다」만** 내보낸다. 값이 없으면 다시 받게 되지만,
//      틀린 값이 있으면 그걸 믿는다. **없는 게 틀린 것보다 낫다.**
//   ⚠️ 도는 자리를 «둘»로 좁힌다 — 창업자가 말할 때(UserPromptSubmit)와 세션 시작(SessionStart).
//      PreToolUse(파일 열기)에서까지 뿌리면 시끄럽고, 시끄러운 게이트는 죽은 게이트다.
//   ⏱ 세션 시작엔 반드시 새로 받아 보고(always), 그 뒤엔 10분마다만 받는다(auto).
if (ev === 'UserPromptSubmit' || ev === 'SessionStart') {
  try {
    const s = checkStale({ fetch: ev === 'SessionStart' ? 'always' : 'auto' })
    if (s.ok && s.stale) {
      console.log(staleBanner(s))
      process.exit(0) // ⛔ 낡은 목록을 «이어서» 뿌리지 않는다 — 그게 그날 사고의 모양이었다
    }
  } catch { /* 훅은 절대 세션을 깨지 않는다 — 못 재면 그냥 평소대로 간다 */ }
}

try {
  // ── ① 창업자가 말할 때마다 — 그 주제의 최신을 들이민다 ──────────
  if (ev === 'UserPromptSubmit') {
    // ⏰ **지금 몇 시인지 먼저 박아준다.** 컨테이너는 UTC라 머릿속으로 +9 하면 반드시 틀린다.
    //    (2026-07-31 밤 실제로 계속 틀렸다 — 창업자: *"여기 12시 46분이야 한국시간이라 했잖아"*
    //     · *"저장좀해둬.. 매번 플려"*)
    //    규칙은 CLAUDE.md 에 있었는데도 틀렸다 → **읽는 규칙이 아니라 보이는 값**으로 바꾼다.
    console.log(`⏰ 지금 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' })} (KST) — 날짜·시각은 무조건 이 값 기준`)
    const text = hook.prompt || ''
    const hits = topicsIn(text)
    const pins = readPins()
    const lines = []
    for (const h of hits.slice(0, 3)) {
      const pin = pins.find((p) => p.name === h)
      if (pin) {
        pin.now.forEach((n) => lines.push(`   · ${n}`))
        pin.outside.forEach((o) => lines.push(`   ⚠️ 저장소 밖 — 파일로 확인 불가: ${o}`))
      }
      const g = byTopic().get(h)
      if (g?.length) lines.push(`   · ${g[0].path}${g.length > 1 ? `   (같은 주제 옛 문서 ${g.length - 1}개 — 그건 근거로 쓰지 말 것)` : ''}`)
    }
    if (lines.length) {
      console.log(`📌 「${hits.slice(0, 3).join('·')}」 주제의 **최신** 문서다. 일 시작 전에 먼저 읽어라:`)
      console.log([...new Set(lines)].slice(0, 8).join('\n'))
    }
    process.exit(0)
  }

  // ── ② 세션 시작 — 한 번 깔아둔다 ────────────────────────────────
  if (ev === 'SessionStart') {
    const t = byTopic()
    const rows = [...t].sort((a, b) => b[1][0].date.localeCompare(a[1][0].date)).slice(0, 8)
    console.log('📌 주제별 «최신» 문서 (옛 문서로 판단하는 게 반복된 사고다 — 이걸 먼저 읽는다):')
    rows.forEach(([k, v]) => console.log(`   ${k} → ${v[0].path}${v.length > 1 ? ` (옛 ${v.length - 1})` : ''}`))
    console.log('   전체는 `node hankki/scripts/latest-map.mjs` · 지도는 hankki/docs/최신-지도.md')
    // 📅 날짜가 «저절로» 여는 문 — 푸시 안 해도 열린다 (창업자 2026-08-01 절대원칙)
    try {
      const { nextGate, todayKST } = await import('./release-calendar.mjs')
      const nx = nextGate()
      if (nx.length) {
        const d = Math.round((Date.parse(nx[0].date) - Date.parse(todayKST())) / 86400000)
        const n = nx.reduce((s, g) => s + g.keys.length, 0)
        console.log(`\n${d <= 7 ? '🚨' : '📅'} ${nx[0].date}(D-${d}) 에 **저절로** 열린다 — ${n}컷`)
        if (d <= 7) console.log('   ⛔ 전날에 «고화질 전수 검수». 안 하면 그대로 유저 앞에 나간다.')
      }
    } catch { /* 없으면 조용히 */ }
    // 👋 세션 «시작»에만 — 읽을 것과 순서를 어디서 얻는지 (창업자 2026-08-13 *"예전문서 읽어와서 짬뽕만들고있어"*)
    //   ⛔ UserPromptSubmit 마다 뿌리면 시끄럽다. 시작 한 번이면 족하다.
    if (ev === 'SessionStart') {
      console.log('\n👋 **읽는 순서는 `npm run hello` 가 정해준다** — ①어제~오늘 → ②주제별 최신 → ③상시 문서')
      console.log('   ⛔ 그 목록에 «없는» 날짜 문서는 브리핑 근거로 쓰지 않는다(옛 판을 쓸 땐 「옛 판이다」라고 밝힌다)')
    }
    // 🧭 「대기」라고 적혀 있는데 **파일은 이미 있는** 줄 (2026-08-01 클레이 가을밤 사고)
    try {
      const { stale, recentDocs } = await import('./doc-guard.mjs')
      const st = stale(recentDocs())
      if (st.length) {
        console.log(`\n🧭 요즘 문서에 「대기·예정」인데 **파일은 이미 있는** 줄 ${st.length}개 — 끝난 걸 대기로 두면 또 안 한다`)
        st.slice(0, 3).forEach((h) => console.log(`   ${h.file}:${h.line}  「${h.name}」 → ${h.found}`))
        console.log('   전체 = `node hankki/scripts/doc-guard.mjs --stale --recent`')
      }
    } catch { /* 없으면 조용히 */ }
    // 🔢 「대기」라고 적혀 있는데 **상수는 이미 채워진** 줄 (#81 · 2026-08-05 모션 배분 사고)
    //   ⭐ 위 검사의 «짝»이다 — 저건 파일을 보고 이건 코드에 박힌 값을 본다.
    try {
      const { constStale, recentDocs } = await import('./doc-guard.mjs')
      const cs = constStale(recentDocs())
      if (cs.length) {
        console.log(`\n🔢 요즘 문서에 「대기」인데 **코드엔 이미 값이 있는** 줄 ${cs.length}개 — 나중에 코드를 보고 「확정」으로 굳힌다`)
        cs.slice(0, 3).forEach((h) => console.log(`   ${h.file}:${h.line}  「${h.name}」 = ${h.val}  (${h.at})`))
        console.log('   전체 = `node hankki/scripts/doc-guard.mjs --const --recent`')
      }
    } catch { /* 없으면 조용히 */ }
    // 🙈 「모른다」고 적어놓고 «그 위에서 추천»한 곳 (2026-08-03 네이버 커넥트 사고)
    try {
      const { execFileSync } = await import('node:child_process')
      const out = execFileSync(process.execPath, [new URL('./check-claims.mjs', import.meta.url).pathname],
        { encoding: 'utf8', timeout: 8000 })
      if (out.includes('⚠️')) {
        console.log(`\n🙈 「모른다」고 적어놓고 «추천»한 곳이 있다 — 창업자가 읽는 건 표와 추천이다`)
        out.split('\n').filter((l) => l.includes('«모른다»')).slice(0, 3).forEach((l) => console.log(`  ${l.trim()}`))
        console.log('   전체 = `npm run claims`')
      }
    } catch { /* 없으면 조용히 */ }
    process.exit(0)
  }

  // ── ③ 열기 전에 막는다 ──────────────────────────────────────────
  if (ev !== 'PreToolUse') process.exit(0)
  const path = rel(hook.tool_input?.file_path || '')
  if (!path) process.exit(0)
  const seen = readSet()

  // 격리된 옛 자산
  //   ⭐ 예외 = `_구판/README.md` — 「여기 보지 마라, 현행은 저기다」를 알려주는 표지판이라 늘 열려야 한다.
  //      (이 훅을 켜자마자 그 표지판 쓰는 걸 스스로 막았다. 살아있다는 증거이자, 필요한 예외다.)
  if (path.includes('_구판/') && !/_구판\/README\.md$/.test(path)) {
    const area = path.split('_구판/')[0]
    const pin = readPins().find((p) => p.old.some((o) => rel(o) === area.replace(/\/$/, '') + '/_구판' || area.startsWith(rel(o).replace(/\/_구판$/, ''))))
    const now = pin?.now || []
    if (now.some((n) => seen.has(n))) process.exit(0)
    console.error(`⛔ 이건 «격리된 옛 파일»이다 — ${path}`)
    if (now.length) {
      console.error('\n지금 쓰는 건 이것들이다:')
      now.forEach((n) => console.error(`   · ${n}`))
      console.error('\n👉 위 현행을 **먼저 읽으면** 이 옛 파일도 열린다. (2026-07-31: 옛 스크립트를 집어서 폐기한 브랜드명을 도로 넣었다)')
    } else {
      console.error('\n👉 `_구판/` 은 «지금 쓰지 않는 것»만 모아둔 곳이다. 현행부터 찾을 것 — hankki/docs/최신-지도.md')
    }
    process.exit(2)
  }

  // ── ⓷-b 📚 **한 문서 «안»의 세대** — 2026-08-01 사고 ────────────
  //   `latest-map` 은 «파일 사이» 세대만 본다. 그런데 한 파일에
  //     `# 2026-07-31 …` … `# 2026-08-01 확정 …` 이 쌓여 있으면 **위쪽만 읽고 틀린다.**
  //   실제로 배경 배정을 「추석＝조각보·달밤억새」로 썼는데 확정은 **같은 문서 201줄**에
  //   「추석＝클레이 가을밤 1개」로 있었다. 창업자: *"우리가 정한거는 그때그때 반영 좀 해."*
  //   ⭐ **부분 읽기(offset)가 맨 아래 세대를 안 덮으면 막는다.** 전체 읽기는 그냥 통과.
  if (path.endsWith('.md') && (hook.tool_name === 'Read')) {
    try {
      const abs = [join(APP, path), join(ROOT, path)].find((p) => existsSync(p))
      if (abs) {
        const { generations } = await import('./doc-guard.mjs')
        const g = generations(abs)
        const off = Number(hook.tool_input?.offset || 0)
        const lim = Number(hook.tool_input?.limit || 0)
        if (g.length >= 2 && off > 0) {
          const top = g[g.length - 1]
          const end = lim ? off + lim : Infinity
          if (top.line < off || top.line > end) {
            console.error(`⛔ 이 문서엔 «세대»가 ${g.length}개 쌓여 있는데, 지금 읽는 범위(${off}~${lim ? off + lim : '끝'})가 «현행»을 안 덮는다.`)
            console.error(`\n⭐ 현행 = ${top.line}줄  ${top.date}  ${top.title}`)
            console.error('\n👉 맨 아래 세대부터 읽어라. 위쪽은 «지나간 판단»이다.')
            console.error(`   전체 목록 = node hankki/scripts/doc-guard.mjs --gen ${path}`)
            process.exit(2)
          }
        }
      }
    } catch { /* 훅은 절대 세션을 깨지 않는다 */ }
  }

  // 같은 주제의 더 옛 문서
  const me = scanDocs().find((d) => d.path === path)
  if (!me || !me.date) process.exit(0)
  const group = byTopic().get(me.topic) || []
  const top = group[0]
  if (!top || top.path === path) { seen.add(path); save(seen); process.exit(0) }   // 최신을 읽었다 → 기록
  if (seen.has(top.path)) process.exit(0)                                          // 최신을 이미 읽었다 → 옛것도 허용
  console.error(`⛔ 이건 «${me.topic}» 주제의 옛 문서다 (${me.date})`)
  console.error(`\n최신은 이거다 → ${top.path}  (${top.date})`)
  if (group.length > 2) console.error(`   같은 주제에 옛 문서가 ${group.length - 1}개 더 있다.`)
  console.error('\n👉 최신을 **먼저 읽으면** 이 문서도 열린다.')
  process.exit(2)
} catch {
  process.exit(0)   // 훅이 터져서 일이 막히는 일은 없게
}
