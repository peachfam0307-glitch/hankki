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
