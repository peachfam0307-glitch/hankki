// 🪤🪤 **내가 반복하는 실수를 «기계로» 잡는다** — 배포 게이트(`npm run smoke`)
//
// 창업자 2026-08-07 *"우리 네가 자주 실수하는 것들 바로잡는 시스템 만들자.
//   네 실수목록 복기하고 검수할 수 있는 시스템 마련해."*
//
// ⛔⛔ **규칙은 이미 다 있다. 그런데 안 지켜진다.** 창업자가 2026-07-31 에 한 말이 그대로 맞다 —
//    *"규칙만 만들면 뭐해 안지키는데."* 그래서 여기엔 **규칙을 안 적는다.**
//    기계가 «혼자» 확인할 수 있는 것만 담고, 나머지는 `docs/실수-패턴-2026-08-07.md` 로 보낸다.
//
// 📖 무엇을 담을지는 **기록을 파서** 정했다(짐작 아님) — `CLAUDE.md` 의 ⛔·📌 줄,
//    `docs/삽질-리스트-*.md`, 작업복기 40여 편. 거기서 «두 번 이상» 나온 것만 골랐다.
//
// ⚠️ 여기서 안 잡히는 것도 있다. 그건 «못 잡는 것»이라고 문서에 적어 뒀다 —
//    ⛔「잡히니까 괜찮다」로 읽지 말 것.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative, sep } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const REPO = join(ROOT, '..')
let bad = 0
const no = (m) => { bad++; console.log('   ⛔', m) }
const ok = (m) => console.log('   ✅', m)

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
const SRC = walk(join(ROOT, 'src')).filter((p) => /\.(jsx?|mjs)$/.test(p))
const SCRIPTS = readdirSync(join(ROOT, 'scripts')).filter((f) => f.endsWith('.mjs')).map((f) => join(ROOT, 'scripts', f))

console.log('\n🪤 반복 실수 게이트')

// ═══ ① JSX 주석을 «표현식 여는 자리»에 ═══════════════════
//   📌 2026-08-04 · 08-06 · 08-07 ×2 = **네 번** 밟았다. 매번 빌드가 죽었다.
//      `{/* */}` 는 «자식» 자리에서만 된다. `=> (` · `return (` 바로 뒤는 객체 리터럴로 파싱돼
//      `Expected ")"` 로 죽는다. 경고를 바로 윗줄에 적어놓고도 또 밟았다 → 그래서 기계로.
//   ⚠️ 빌드도 잡지만 **빌드는 30초, 이건 0.2초**다. 그리고 스모크는 옛 dist 로 통과할 수 있다.
{
  const hits = []
  for (const p of SRC) {
    const lines = readFileSync(p, 'utf8').split('\n')
    for (let i = 1; i < lines.length; i++) {
      const prev = lines[i - 1].replace(/\s+$/, '')
      const cur = lines[i].trim()
      // 앞줄이 «괄호를 열고 끝났고»(=> ( · return ( · = ( ) 다음 줄이 `{/*` 로 시작
      if (/(=>|return|=|\()\s*\($/.test(prev) && cur.startsWith('{/*')) {
        hits.push(`${relative(REPO, p)}:${i + 1}`)
      }
    }
  }
  if (hits.length) {
    no(`JSX 주석이 «표현식 여는 자리»에 있다 — 빌드가 죽는다 (${hits.length}곳)`)
    hits.forEach((h) => console.log(`        ${h}   → 함수 «바깥»으로 빼고 \`//\` 주석으로`))
  } else ok('JSX 주석 자리 — `(` 바로 뒤에 `{/*` 없음 (오늘까지 네 번 밟은 자리)')
}

// ═══ ② CI(Node 20)에 없는 API ═════════════════════════════
//   📌 2026-08-03 — `check-hooks.mjs` 에 `globSync`(Node 22+)를 써서 **배포가 세 번 연속 실패**했다.
//      이 컨테이너는 Node 22 라 로컬은 통과하고 **배포만 죽는다.** 그동안 v9.48·v9.49 가 안 나갔다.
//   ⚠️ 목록은 «우리가 실제로 밟은 것 ＋ 밟기 쉬운 것»만. 넓히면 시끄러워져 아무도 안 본다.
{
  const CI = Number((readFileSync(join(REPO, '.github/workflows/deploy-hankki.yml'), 'utf8')
    .match(/node-version:\s*'?(\d+)/) || [])[1] || 20)
  const BANNED = [
    [/\bglobSync\b/, 'fs.globSync', 22],
    [/import\.meta\.dirname/, 'import.meta.dirname', 21],
    [/\.withResolvers\s*\(/, 'Promise.withResolvers', 22],
    [/\bnode:sqlite\b/, 'node:sqlite', 22],
  ]
  // ⛔⛔ **첫 판이 «주석 속 경고문»을 실제 사용으로 읽었다** — `check-hooks.mjs` 6줄에
  //    *"globSync 를 쓰면 안 된다"* 라고 «적어둔 것»을 「쓴다」로 잡았다.
  //    📌 내가 잡으려던 실수(검사가 엉뚱한 걸 본다)를 **검사 자신이 저질렀다.**
  //    → 주석을 걷어내고 본다. 그리고 이 파일 자신은 건너뛴다(금지 목록이 여기 적혀 있다).
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')
  const hits = []
  for (const p of [...SRC, ...SCRIPTS]) {
    if (p.endsWith('check-mistakes.mjs')) continue
    const t = strip(readFileSync(p, 'utf8'))
    for (const [re, name, since] of BANNED) {
      if (since > CI && re.test(t)) hits.push(`${relative(REPO, p)} — ${name}(Node ${since}+)`)
    }
  }
  if (hits.length) {
    no(`CI 는 Node ${CI} 인데 더 높은 버전 API 를 쓴다 — 로컬만 통과하고 «배포가 죽는다»`)
    hits.forEach((h) => console.log(`        ${h}`))
  } else ok(`CI(Node ${CI})에 없는 API 안 씀`)
}

// ═══ ③ «절대 안 걸리는» 검사 ═══════════════════════════════
//   📌 검사는 늘었는데 «걸리지 않는» 검사가 섞이면 초록불이 거짓말이 된다.
//      실패 경로(`process.exit(1)`)가 아예 없는 검사는 무엇을 넣어도 통과한다.
//   ⛔⛔ **첫 판이 두 군데서 틀렸다** (기록으로 남긴다 — 같은 결의 실수다):
//      ⒜ `package.json` «전체»를 훑어서 스모크에 없는 것(`npm run claims` 등)까지 잡았다
//      ⒝ `process.exit(fail ? 1 : 0)` 를 «실패 경로 없음»으로 읽었다(리터럴 1 만 찾았다)
//      📌 둘 다 「무엇을 보는지」가 틀린 것이다.
{
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const smoke = pkg.scripts.smoke || ''
  const inSmoke = [...new Set([...smoke.matchAll(/scripts\/([\w.-]+\.mjs)/g)].map((m) => m[1]))]
  const canFail = (t) => /process\.exit\(\s*(?!0\s*\))/.test(t) || /process\.exitCode\s*=\s*[^0]/.test(t) || /\bthrow\b/.test(t)
  const hits = []
  for (const f of inSmoke) {
    const p = join(ROOT, 'scripts', f)
    try { if (!canFail(readFileSync(p, 'utf8'))) hits.push(f) } catch { hits.push(`${f} (파일이 없다)`) }
  }
  if (hits.length) {
    no(`배포 게이트에 «실패할 줄 모르는» 검사가 있다 — 초록불이 거짓이 된다 (${hits.length}개)`)
    hits.forEach((h) => console.log(`        ${h}`))
  } else ok(`배포 게이트의 검사 ${inSmoke.length}개가 전부 «실패할 줄 안다»`)

  // 🕳 만들어 놓고 «아무도 안 돌리는» 검사 — 있으나 마나다
  const all = readdirSync(join(ROOT, 'scripts')).filter((f) => /^check-.*\.mjs$/.test(f))
  const orphan = all.filter((f) => !smoke.includes(f) && !JSON.stringify(pkg.scripts).includes(f))
  if (orphan.length) console.log(`   ⚠️ 아무 명령에도 안 물린 검사 ${orphan.length}개 — ${orphan.join(', ')}`)
  else ok(`검사 ${all.length}개가 다 어딘가에 물려 있다`)
}

// ═══ ③-2 배포 게이트가 «CI 에 없는 것»에 기대나 ═══════════
//   ⛔⛔ 2026-08-07 — 내가 만든 `check-fontchip.mjs` 가 파이썬 `fontTools` 로 woff2 를 열었다.
//      **CI 엔 fontTools 가 없다** → 로컬만 통과하고 **배포가 죽었다**(run 1128 · v9.91 이 안 나갔다).
//      📌 2026-08-03 `globSync` 사고와 «똑같은 종류»다 — 「내 자리에 있는 것」을 CI 에도 있다고 여겼다.
//   ⭐ 배포를 막는 게이트는 **노드만으로** 돌아야 한다. 파이썬·이미지 도구는 «만들 때» 쓰고,
//      «검사할 때» 필요한 값은 만들면서 파일에 적어 둔다(`chip-chars.json` 이 그 방식이다).
//   ⚠️ 주석에 `python3` 를 «적어둔 것»은 안 잡는다 — 첫 판이 그걸로 틀렸다.
{
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const smoke = pkg.scripts.smoke || ''
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')
  const hits = []
  for (const f of new Set([...smoke.matchAll(/scripts\/([\w.-]+\.mjs)/g)].map((m) => m[1]))) {
    try {
      const t = strip(readFileSync(join(ROOT, 'scripts', f), 'utf8'))
      if (/(execFileSync|execSync|spawnSync|spawn)\s*\(\s*['"`]python/.test(t)) hits.push(f)
    } catch { /* ③ 이 이미 잡는다 */ }
  }
  if (hits.length) {
    no(`배포 게이트가 «파이썬»을 부른다 — CI 엔 우리 파이썬 꾸러미가 없다. 로컬만 통과하고 배포가 죽는다 (${hits.length}개)`)
    hits.forEach((h) => console.log(`        ${h}   → 필요한 값은 «만들 때» 파일로 적어 두고 노드로 읽을 것`))
  } else ok('배포 게이트가 노드만으로 돈다 (CI 에 없는 도구에 안 기댄다)')
}

// ═══ ④ 규칙 12 — 「옛 값으로 진짜 걸리는지」 확인한 흔적 ═════
//   📌 창업자 2026-07-31 *"검사를 만들면 옛 값으로 진짜 걸리는지 먼저 돌려본다."*
//      실제로 오늘도 세 번 «거짓 통과»가 나왔다(글씨 살 재기 · CORS · 뒤에 깔린 판).
//   ⚠️ 확인했는지는 기계가 못 본다 → **적어뒀는지**를 본다. 안 적었으면 안 한 것으로 친다.
//      ⛔ 실패로 안 세운다(경고) — 시끄러운 게이트는 죽은 게이트다.
//   ⛔ **첫 판은 20개를 늘어놓았다 — 시끄러운 게이트는 죽은 게이트다.**
//      옛 검사까지 다 훑을 게 아니라 **오늘 손댄 것**만 본다(고칠 수 있는 것만 말한다).
//   ⛔⛔ **둘째 판도 틀렸다 — 「오늘 손댄 것」을 파일 시각(mtime)으로 봤다.**
//      `git checkout` 한 번에 **전부** 오늘 것이 돼서 36개가 늘어섰다.
//      📌 또 「무엇을 보는지」다. 손댄 것은 파일 시각이 아니라 **git 이 안다.**
{
//   ⛔ **셋째 판도 넓었다** — `git log --since=24h` 는 어제 밤 판까지 끌고 와 20개가 나왔다.
//      ⭐ 볼 자리는 **「지금 커밋하려는 것」** 하나다. 이미 나간 검사는 여기서 말할 게 아니다.
  let changed = []
  try {
    changed = execFileSync('git', ['status', '--porcelain', '--', 'hankki/scripts'], { cwd: REPO, encoding: 'utf8' })
      .split('\n').map((s) => s.slice(3).trim().replace(/^"|"$/g, '')).filter(Boolean)
  } catch { /* git 이 없으면 이 항목은 건너뛴다 */ }
  const now = SCRIPTS.filter((p) => /check-|_repro-/.test(p) && changed.some((c) => p.endsWith(c.replace(/^hankki\//, ''))))
  const miss = now.filter((p) => !/규칙 12|옛 값|옛 코드|일부러 .{0,12}(심어|넣어|돌려)|걸리는 것까지/.test(readFileSync(p, 'utf8')))
  if (miss.length) console.log(`   ⚠️ 지금 «안 커밋된» 검사 중 「옛 값으로 걸리는지 확인」 기록이 없는 것 — ${miss.map((p) => p.split('/').pop()).join(', ')}`)
  else if (now.length) ok(`지금 손댄 검사 ${now.length}개에 「옛 값으로 걸리는지 확인」 기록이 있다`)
}

// ═══ ⑤ 손으로 적은 목록이 코드와 어긋나나 ═══════════════════
//   📌 「음식 아이콘 88종」(실제 218) · 「서랍엔 0컷」(이미 12컷) · 「여름 프레임은 비어 있다」(살아 있었다).
//      **개수를 손으로 적으면 반드시 낡는다.** 자주 틀린 자리 = 글씨체 목록.
{
  const S = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
  const T = S.slice(S.indexOf('export const TEXT_FONTS = ['))
  const fonts = [...T.slice(0, T.indexOf('\n]')).matchAll(/family: "'([^']+)'/g)].map((m) => m[1])
  const embed = readFileSync(join(ROOT, 'src/fontEmbed.js'), 'utf8')
  const listed = [...(embed.match(/OUR_FONTS = \[[\s\S]*?\]/) || [''])[0].matchAll(/'([^']+)'/g)].map((m) => m[1])
  const missing = fonts.filter((f) => !listed.includes(f))
  if (missing.length) no(`글씨체가 fontEmbed.js 목록에 빠졌다 — 그 글씨로 쓴 글자가 «공유 카드에서 다른 글씨»로 나간다: ${missing.join(', ')}`)
  else ok(`글씨체 ${fonts.length}개가 공유 꾸러미 목록과 «같다»`)

  const css = readFileSync(join(ROOT, 'src/styles.css'), 'utf8')
  const noFace = fonts.filter((f) => !css.includes(`font-family: '${f}';`))
  if (noFace.length) no(`@font-face 가 없는 글씨체 — ${noFace.join(', ')}`)
  else ok('글씨체마다 @font-face 가 있다')
}

// ═══ ⑥ 「대기」라 적어놓고 코드엔 이미 박은 것 ═══════════════
//   📌 2026-08-05 — 모션 배분 «초안»을 코드에 먼저 넣어두고, 나중에 그 코드를 보고
//      *"이미 정해져 있었다"* 며 확정으로 굳혔다. 창업자 *"추석에 아장아장은 처음들어."*
//      ⭐ 창업자 판정 자리를 내가 대신 정한 것이다 → **「대기」인 것은 코드에 안 넣는다.**
{
  const docs = readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md'))
  const waiting = []
  for (const f of docs) {
    const t = readFileSync(join(ROOT, 'docs', f), 'utf8')
    if (/창업자 (최종 )?확정 대기|⏳.{0,20}판정 대기/.test(t)) waiting.push(f)
  }
  if (waiting.length) console.log(`   ⚠️ 「창업자 확정 대기」가 적힌 문서 ${waiting.length}개 — ${waiting.slice(0, 4).join(', ')}${waiting.length > 4 ? ' …' : ''}`)
  else ok('「창업자 확정 대기」로 남은 문서 없음')
  console.log('      (⛔대기인 값을 코드에 «먼저» 넣지 말 것 — 나중에 그 코드를 근거로 읽게 된다)')
}

// ═══ ⑦ dist 가 src 보다 낡았나 ═════════════════════════════
//   📌 스모크는 «빌드를 안 한다» — 옛 dist 로 통과해놓고 배포가 죽은 적이 있다(2026-08-04·08-06).
{
  try {
    const newest = Math.max(...SRC.map((p) => statSync(p).mtimeMs))
    const d = statSync(join(ROOT, 'dist/index.html')).mtimeMs
    if (d < newest) no(`dist 가 src 보다 ${Math.round((newest - d) / 60000)}분 낡았다 — 지금 검사는 «옛 화면»을 본다`)
    else ok('dist 가 src 보다 새것이다')
  } catch { no('dist 를 못 읽었다 — `npm run build` 부터') }
}

// ═══ ⑧ «한 번 밟은 함정»을 또 밟았나 ═══════════════════════
//   ⛔⛔ 2026-08-08 — `page.reload()` 로 「저장이 남나」를 재는 재현판을 또 만들었다.
//      `addInitScript` 는 **되돌아올 때마다 처음 상태를 다시 심어** 저장값을 «검사가» 지운다.
//      → 앱이 멀쩡한데 「안 남는다」로 나오고, 그 거짓 실패를 좇아 코드를 고치려 든다.
//   📌 **2026-08-06 에 `_shot-diary.mjs` 안에 경고를 적어뒀는데도 재발했다.**
//      경고가 «그 파일 안»에만 있었기 때문이다 — 새 파일을 쓸 땐 옛 파일을 안 본다.
//      ⭐ 그래서 파일 «바깥»(여기)에서 본다. 이게 「함정 사전」의 첫 항목이다.
//   ⭐ 대신 쓰는 법 = ⑴뒤로 갔다 다시 들어오기(유저가 실제로 하는 행동) ⑵새 탭(앱 껐다 켜기)
{
  const TRAPS = [
    {
      name: 'reload ＋ addInitScript',
      // 둘 다 쓰는 재현판 = 저장 검사가 «검사 자신»에게 지워질 수 있다
      hit: (s) => /page\.reload\s*\(/.test(s) && /addInitScript/.test(s),
      // 이미 알고 쓰는 경우는 통과 — 「왜 괜찮은지」를 적어 두면 그게 근거다
      waive: (s) => /reload.{0,80}(시드|초기화|일부러|의도)/s.test(s) || /⛔.{0,200}reload/s.test(s),
      why: 'addInitScript 가 reload 때 저장값을 시드로 덮어써 «거짓 실패»가 난다 → 뒤로가기·새 탭으로 재라',
    },
  ]
  let files = []
  try {
    files = readdirSync(join(ROOT, 'scripts'))
      .filter((f) => /^_(repro|shot|measure)-.*\.mjs$/.test(f))
      .map((f) => join(ROOT, 'scripts', f))
  } catch { /* scripts 가 없으면 볼 것도 없다 */ }
  let trapped = 0
  for (const f of files) {
    let s = ''
    try { s = readFileSync(f, 'utf8') } catch { continue }
    for (const t of TRAPS) {
      if (t.hit(s) && !t.waive(s)) {
        trapped++
        no(`${f.split('/').pop()} — 옛 함정 「${t.name}」\n      ${t.why}`)
      }
    }
  }
  if (!trapped) ok(`재현판 ${files.length}개 — 옛 함정 재발 0`)
}

// ═══ ⑨ 코치 키를 «손으로» 적었나 ═══════════════════════════
//   ⛔⛔ 2026-08-08 — v10.05 에서 홈 코치를 `home2` → `home3` 으로 올렸더니 «두 군데»가 조용히 깨졌다.
//      ⒜ 🐛 설정 「기능 안내 다시 보기」가 `hankki:coach:home` 을 지우고 있었다 —
//         홈 키는 v8.60 에 이미 `home2` 였다. **v8.60 부터 두 달 넘게 홈 안내가 안 돌아왔고 아무도 몰랐다.**
//      ⒝ 🧪 배포 게이트가 `hankki:coach:home2` 를 «이름으로» 심어서, 키가 올라가자 코치 오버레이가
//         화면을 덮었고 `test-exit` 가 「장보기 탭을 못 누른다」로 **배포를 막았다.** 앱은 멀쩡했다.
//   📌 뿌리 = **같은 이름을 여러 곳에 손으로 적어 뒀다.** 한 곳만 고치면 나머지가 낡는다.
//   ⭐ 그래서 키는 `src/coach.js` 에서만 만든다. 검사 스크립트는 **접두어로 통째로**(SEED_COACH_SEEN).
//   ⚠️ 실패는 «배포에 걸리는 자리»만 — 앱(`src/`)과 배포 게이트 셋. 일회용 재현판까지 잡으면
//      백 개가 쏟아져 시끄러운 게이트가 되고, 시끄러운 게이트는 아무도 안 본다(개수만 알려준다).
{
  const LIT = /['"`]hankki:coach:/
  const APP = ['screens', 'components', '.'].flatMap((d) => {
    try {
      return readdirSync(join(ROOT, 'src', d === '.' ? '' : d))
        .filter((f) => /\.(jsx?|mjs)$/.test(f))
        .map((f) => join(ROOT, 'src', d === '.' ? '' : d, f))
    } catch { return [] }
  })
  const GATES = ['smoke.mjs', 'test-exit.mjs', 'test-swart.mjs'].map((f) => join(ROOT, 'scripts', f))
  let hits = 0
  for (const p of [...APP, ...GATES]) {
    if (p.endsWith(`${sep}coach.js`)) continue          // ⭐ 키를 만드는 «그 한 곳»
    let s = ''
    try { s = readFileSync(p, 'utf8') } catch { continue }
    // 주석 줄은 뺀다 — 사고 기록에 옛 키 이름이 그대로 적혀 있다
    const code = s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    if (LIT.test(code)) { hits++; no(`${relative(REPO, p)} — 코치 키를 손으로 적었다. src/coach.js 의 COACH / SEED_COACH_SEEN 을 쓸 것`) }
  }
  if (!hits) {
    let stale = 0
    try {
      for (const f of readdirSync(join(ROOT, 'scripts')).filter((f) => /^_(repro|shot|measure)-.*\.mjs$/.test(f))) {
        if (/['"`]hankki:coach:|coach:\$\{/.test(readFileSync(join(ROOT, 'scripts', f), 'utf8'))) stale++
      }
    } catch { /* noop */ }
    ok(`코치 키 = src/coach.js 한 곳${stale ? ` (일회용 재현판 ${stale}개는 아직 옛 이름 — 쓸 때 SEED_COACH_SEEN 으로 바꿀 것)` : ''}`)
  }
}

// ═══ ⑩ 가로모드 잠금이 «되살아났나» ════════════════════════
//   📱 2026-08-09 — 창업자 폰이 안 돌아가던 이유가 **세로 잠금 두 곳**이었다.
//      ⒜ `vite.config.js` 웹 매니페스트 `orientation: 'portrait'` — 설치한 PWA 를 잠근다
//      ⒝ `android/twa-manifest.json` 의 `"orientation"` — Play 앱(TWA)을 잠근다
//   ⛔ **둘은 다른 파일이고 한쪽만 고치면 반쪽만 풀린다.** 게다가 twa-manifest 는 JSON 이라
//      «주석을 못 단다» — 왜 그 값인지 파일 안에 남길 방법이 없다. 그래서 여기서 지킨다.
//   ⭐ 값은 `default`(＝기기 설정을 따른다). `any` 는 안 쓴다 —
//      쓰지 않은 이유 = 그 값이 「사용자의 회전 잠금까지 무시」하는지 확인하지 못했다.
//   ✅ 규칙 12 — **옛 값(`portrait`)으로 되돌려 돌려 봤다. 두 줄 다 ⛔ 로 잡혔다**(2026-08-09).
{
  console.log('\n📱 가로모드 잠금')
  const 웹 = readFileSync(join(ROOT, 'vite.config.js'), 'utf8')
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
  if (/orientation:\s*['"]portrait/.test(웹)) no("vite.config.js — 웹 매니페스트가 다시 세로로 잠겼다(orientation: 'portrait')")
  else ok('웹 매니페스트 — 세로 잠금 없음')
  let twa = null
  try { twa = JSON.parse(readFileSync(join(REPO, 'android/twa-manifest.json'), 'utf8')) } catch { /* 없으면 넘어간다 */ }
  if (!twa) ok('android/twa-manifest.json 을 못 읽었다 — 건너뜀')
  else if (String(twa.orientation || '').startsWith('portrait')) no(`android/twa-manifest.json — Play 앱이 다시 세로로 잠겼다("${twa.orientation}")`)
  else ok(`Play 앱(TWA) — "${twa.orientation}"`)
}



// ═══ ⑪ CSS 「미디어쿼리가 기본 규칙보다 «앞»에 있어서 안 먹는 것」 ══════
//   🎨 2026-08-09 — 창업자 *"하나고치면 하나가 틀어지고 ㅠㅠ 무한반복인것같아"*
//      그날 폴드 달력 아이콘을 34px 로 키웠는데 **재현판이 재보니 24px 그대로**였다.
//      뿌리 = `@media (min-width:600px) { .cal-food { width:34px } }` 을 쓴 자리가
//      기본 `.cal-food { width:24px }` 보다 **앞**이라, 세기가 같으면 «뒤엣것»이 이겨서 늘 24px.
//   ⛔ 이건 v10.12 에 하루 여섯 번 밟은 것과 «같은» 실수다(확대 단추가 안 뜸·탭 줄이 안 줄음…).
//      CLAUDE.md 에 적어뒀는데 또 밟았다 → **글로 적는 대신 여기서 막는다.**
//   ⭐ 판정 = 선택자 «문자열이 정확히 같을» 때만 본다. 같으면 특정성도 같아서 **순서가 결과를 정한다.**
//      다르면 순서와 무관하니 안 본다 — 거짓 경보를 안 내려는 것이다(시끄러운 게이트는 죽은 게이트).
//   ⭐ `!important` 가 붙었으면 미디어 쪽이 이기므로 통과시킨다.
{
  console.log('\n🎨 CSS 우선순위(미디어쿼리 자리)')
  const raw = readFileSync(join(ROOT, 'src/styles.css'), 'utf8')
  // 주석은 지우되 «줄 수»는 남긴다 — 줄번호로 알려줘야 찾아간다.
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const decls = []
  const stack = []
  let buf = '', line = 1
  const flush = () => {
    const cur = stack[stack.length - 1]
    const d = buf.trim()
    buf = ''
    if (!cur || cur.at || !d) return
    const m = d.match(/^([-a-zA-Z]+)\s*:/)
    if (!m) return
    const inMedia = stack.some((x) => x.at && /^@media/.test(x.head))
    for (const s of cur.head.split(',').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean)) {
      decls.push({ sel: s, prop: m[1], line, inMedia, imp: /!important/.test(d) })
    }
  }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\n') { line++; buf += ch; continue }
    if (ch === '{') {
      const head = buf.replace(/\s+/g, ' ').trim()
      stack.push({ head, at: head.startsWith('@') })
      buf = ''
      continue
    }
    if (ch === '}') { flush(); stack.pop(); buf = ''; continue }
    if (ch === ';') { flush(); continue }
    buf += ch
  }
  const 기본 = decls.filter((d) => !d.inMedia && !d.imp)
  let hits = 0
  for (const d of decls.filter((x) => x.inMedia && !x.imp)) {
    const 뒤 = 기본.find((b) => b.sel === d.sel && b.prop === d.prop && b.line > d.line)
    if (!뒤) continue
    hits++
    no(`styles.css:${d.line} — 미디어쿼리 안의 «${d.sel} { ${d.prop} }» 이 ${뒤.line}줄 기본 규칙에 «덮인다». 미디어 블록을 기본 규칙 뒤로 옮길 것`)
  }
  if (!hits) ok(`미디어쿼리가 전부 기본 규칙 뒤에 있다 (선언 ${decls.length}줄 검사)`)
}

// ═══ ⑫ CLAUDE.md 에 «옛 버전 기록»이 다시 쌓였나 ═══════════
//   📮 창업자 2026-08-13 *"낡은 지침들 claude md정리하려고하는데.. **자꾸 옛날꺼 읽어서 실수하니까.**"*
//   🔢 그날 실측 = CLAUDE.md **1714줄 251,374자 중 버전 로그가 623줄 130,451자 = 52%**.
//      **파일의 절반이 옛 기록**이라 정작 지켜야 할 규칙·핀이 그 사이에 묻혔다.
//      위에서부터 읽으면 «옛 판을 먼저 만나 그대로 쓰는» 사고가 난다(규칙 12 ⒜ 와 같은 뿌리).
//   ✅ 그래서 옛 기록은 `docs/_archive/버전기록-전체.md` 로 옮겼다. ⛔한 글자도 안 지웠다 — 옮겼을 뿐이다.
//   ⭐ 그런데 **새 판이 나올 때마다 여기 한 줄씩 다시 쌓인다** — 두면 반년 만에 원래대로 돌아간다.
//      📌 그래서 「옮기자」를 규칙으로 적지 않고 여기서 «막는다»(창업자 *"규칙만 만들면 뭐해 안지키는데"*).
//   ⚠️ 문턱을 10 으로 둔 이유 = 매 판마다 한 줄이니 **열흘치**다. 하루이틀 못 옮겼다고 배포를 막으면
//      급할 때 게이트를 꺼버리고, **꺼진 게이트는 없는 게이트다.** 5줄부터는 미리 알려만 준다.
{
  console.log('\n📚 CLAUDE.md 옛 버전 기록')
  const cm = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')
  const 옛 = cm.split('\n').filter((l) => l.startsWith('- 옛 기록 ↓')).length
  const 자 = cm.length
  let 보관 = true
  try { readFileSync(join(ROOT, 'docs/_archive/버전기록-전체.md'), 'utf8') } catch { 보관 = false }
  if (!보관) no('docs/_archive/버전기록-전체.md 가 없다 — 옛 기록을 옮겨 둔 곳이다. 지웠으면 되살릴 것')
  else if (옛 > 10) no(`CLAUDE.md 에 옛 기록이 ${옛}줄 쌓였다(${자}자) — docs/_archive/버전기록-전체.md «맨 위»로 옮길 것`)
  else if (옛 > 5) ok(`옛 기록 ${옛}줄 — 아직 괜찮지만 슬슬 docs/_archive/버전기록-전체.md 로 옮길 것 (${자}자)`)
  else ok(`옛 기록 ${옛}줄 · CLAUDE.md ${자}자`)
}

// ── 🖥 배포 체인 스크립트가 «이 컨테이너에만 있는 것»에 기대나 (2026-08-15) ──
//   ⛔⛔ **오늘 두 번 밟았다 — 둘 다 「로컬은 초록불인데 CI 에서 죽는」 꼴이다.**
//      ⑴ 아침 — 일기잠금 재현판이 preview 서버를 «고정 시간»만 기다려 ERR_CONNECTION_REFUSED
//      ⑵ 밤   — 감정컷 재현판에 `/opt/pw-browsers/chromium` 을 «박아» 넣어 배포 실패(run #1416)
//   ⭐ CI 러너는 이 컨테이너가 아니다. 브라우저 자리도, 속도도 다르다.
//      플레이라이트가 «알아서 찾게» 두면 양쪽에서 다 돈다(`smoke.mjs` 가 그렇게 한다).
//   ⚠️ 배포를 «막는» 것은 smoke 체인에 실제로 물린 스크립트뿐이다 — 그 밖의 도구는 알려만 준다.
{
  console.log('\n🖥 배포 체인 — 이 컨테이너에만 있는 경로')
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const 체인 = [...(pkg.scripts.smoke || '').matchAll(/node (scripts\/[^\s]+\.mjs)/g)].map((m) => m[1])
  const 박힘 = []
  for (const rel of 체인) {
    let src = ''
    try { src = readFileSync(join(ROOT, rel), 'utf8') } catch { continue }
    // ⚠️ 「그 글자가 있나」로 보면 **주석과 이 검사 자신까지** 잡는다(첫 판이 그랬다 · 규칙 18 ⓘ).
    //    «브라우저를 그 경로로 여는 줄»만 본다 — 주석은 떼고, `executablePath` 가 같은 줄에 있어야 한다.
    const 코드 = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    if (/executablePath[^\n]*\/opt\/pw-browsers/.test(코드)) 박힘.push(rel)
  }
  if (박힘.length) no(`배포 체인 ${박힘.length}개가 /opt/pw-browsers 를 «박아» 쓴다 — CI 엔 그 파일이 없다: ${박힘.join(' ')}\n     👉 chromium.launch() 로 두거나 process.env.SMOKE_CHROMIUM 이 있을 때만 executablePath 를 준다`)
  else ok(`배포 체인 ${체인.length}개 — 박힌 브라우저 경로 0`)
}

console.log(bad ? `\n⛔⛔ ${bad}건 — 고치고 다시 돌릴 것\n` : '\n✅ 반복 실수 게이트 통과\n')
console.log('   📖 기계가 «못 잡는» 것들 = docs/실수-패턴-2026-08-07.md\n')
process.exit(bad ? 1 : 0)
