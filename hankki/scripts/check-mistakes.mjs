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
    {
      // ⛔⛔ [2026-09-04] 「비동기인데 «동기» 재기함수로 재기」 — ＝조용한 거짓 초록불
      //   실제로 `_repro-클라우드동기화-0821` ⑱ 이 그랬다. 던진 Promise 를 아무도 안 잡아
      //   ✅ 를 찍고 지나갔고, 뒤에 오는 칸이 그 사이 표식을 바꿔 «경주»가 났다.
      //   📌 로컬은 30/30 초록불 · CI 만 죽었다 — 「초록불」이 무엇을 보는지 봐야 한다(규칙 18 ⓘ).
      //   ⭐ 그 파일 «안»에 경고 주석이 이미 있었는데도 한 칸이 빠져 있었다.
      //      파일 안의 경고는 새 칸을 쓸 때 안 읽힌다 → 그래서 파일 «바깥»에서 본다.
      name: '비동기 칸을 동기 잰다로',
      hit: (s) => /(?<!비동기)\s*잰다\(\s*['"`][^\n]*?,\s*async\s*\(/.test(s)
        || /(?<!await )(?<!const )잰다비동기\(/.test(s),
      waive: () => false,
      why: '던진 Promise 를 못 잡아 «틀려도 ✅»가 찍힌다 → `await 잰다비동기(…)` 로 재라',
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
  // ⛔⛔⛔ **[2026-09-03] 이 한 줄이 «3주 동안 헛것을 세고» 있었다 — 이 게이트의 존재 이유가 무너졌다.**
  //    세던 글자 = `- 옛 기록 ↓`      → CLAUDE.md 에 **0개**
  //    실제 쌓인 것 = `- **옛 버전**:` → **9개 · 86,977 B**
  //    **형식이 바뀌었는데 여기를 안 고쳤다.** 그래서 배포할 때마다 «✅ 옛 기록 0줄»을 찍으면서
  //    막으라고 만든 그것이 그대로 자랐고, CLAUDE.md 는 461,814 B 가 됐다.
  //    📌 규칙 18 ⓘ — **「통과했나」가 아니라 «무엇을 보고 통과했나».** 8/31 `pkg.scripts.smoke` 사고와 같은 꼴이다.
  //    ✅ 그래서 ⓐ **아는 형식을 다 본다** ⓑ **크기 게이트를 따로 세웠다**(`check-docsize.mjs` · 낱말은 배신해도 바이트는 안 한다)
  const 옛 = cm.split('\n').filter((l) => /^- (?:옛 기록 ↓|\*\*옛 버전\*\*|옛 버전)/.test(l)).length
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
  // ⛔⛔ [2026-08-31] 여기가 `pkg.scripts.smoke` «하나»만 봤다 — 그건 `smoke-par.mjs` 한 줄이라
  //    **검사하는 판이 «1개»뿐이었다.** 진짜 목록은 `smoke:seq` 에 있다(100개 넘는다).
  //    그래서 오늘 내 새 판(박힌 경로)이 이 게이트를 그대로 통과했고 배포가 두 번 죽었다.
  //    📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나».
  const 체인글 = `${pkg.scripts.smoke || ''} ${pkg.scripts['smoke:seq'] || ''}`
  const 체인 = [...new Set([...체인글.matchAll(/node (scripts\/[^\s]+\.mjs)/g)].map((m) => m[1]))]
  const 박힘 = []
  const 박힘2 = []   // «이 컨테이너 저장소 경로»를 박은 판
  for (const rel of 체인) {
    let src = ''
    try { src = readFileSync(join(ROOT, rel), 'utf8') } catch { continue }
    // ⚠️ 「그 글자가 있나」로 보면 **주석과 이 검사 자신까지** 잡는다(첫 판이 그랬다 · 규칙 18 ⓘ).
    //    «브라우저를 그 경로로 여는 줄»만 본다 — 주석은 떼고, `executablePath` 가 같은 줄에 있어야 한다.
    const 코드 = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    // ⛔⛔ [2026-09-03 넓힘] 전엔 `executablePath` 와 경로가 **«같은 줄»에 있을 때만** 잡았다.
    //    그런데 경로를 «변수에 먼저 담으면» 두 줄로 갈려 이 그물을 그대로 빠져나간다:
    //        const CHROMIUM = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium'   ← 여기
    //        chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})                ← 그리고 여기
    //    🔢 그래서 2026-09-03 에 내 새 판이 이 게이트를 통과하고 **배포가 죽었다**(run #2054).
    //       v10.90(run #1416)과 «같은» 사고인데 게이트가 못 잡았다 — 규칙 18 ⓘ 그대로다.
    //    ✅ 이제 «코드 어디에든» 그 경로가 있으면 잡는다(주석은 위에서 이미 뗐다).
    //    ⚠️ 단 «이 검사 자신»은 뺀다 — 잣대에 그 글자가 들어 있어서 스스로를 잡는다.
    //       (원래 `executablePath` 를 같이 요구한 이유가 이 자기참조였다. 그 대신 파일 하나만 뺀다.)
    //       ⛔ 이 판은 브라우저를 열지 않는다 — 그러니 빼도 잃는 게 없다.
    if (!rel.endsWith('check-mistakes.mjs') && /\/opt\/pw-browsers/.test(코드)) 박힘.push(rel)
    // ⛔⛔ [2026-08-31 추가] «이 컨테이너의 저장소 경로»를 박은 것도 같은 사고다 — 배포가 두 번 막혔다.
    //    새 판이 dist 자리를 「/home/user/hankki/hankki/dist」 로 박았는데 CI 체크아웃은 「/home/runner/…」 라
    //    그 폴더가 없다 → 모든 요청이 404 → 화면이 «영영 빈칸» → 검사가 헛것을 재고 죽는다(#1965 · #1966).
    //    ⭐ 무서운 건 죽는 쪽이 아니다 — 「입구가 없다 = 통과」처럼 **빈 화면이 초록불로 읽히는** 칸이다.
    //    👉 「new URL('..', import.meta.url).pathname」 으로 «이 파일 자리»에서 찾는다(다른 판들이 다 그렇게 한다).
    if (/['`"]\/home\/(user|runner)\//.test(코드)) 박힘2.push(rel)
  }
  if (박힘.length) no(`배포 체인 ${박힘.length}개가 /opt/pw-browsers 를 «박아» 쓴다 — CI 엔 그 파일이 없다: ${박힘.join(' ')}\n     👉 chromium.launch() 로 두거나 process.env.SMOKE_CHROMIUM 이 있을 때만 executablePath 를 준다`)
  else ok(`배포 체인 ${체인.length}개 — 박힌 브라우저 경로 0`)
  if (박힘2.length) no(`배포 체인 ${박힘2.length}개가 «이 컨테이너 저장소 경로»를 박아 쓴다 — CI 엔 그 자리가 없다: ${박힘2.join(' ')}\n     👉 new URL('..', import.meta.url).pathname 으로 이 파일 자리에서 찾는다`)
  else ok(`배포 체인 ${체인.length}개 — 박힌 저장소 경로 0`)
}

// 🎴🎴 자랑카드를 표지로 저장할 때 «카드라는 표시»가 붙나 (창업자 2026-08-18)
//   📮 *"원래 자랑카드전체가 표지여야하는데 동그랗게됐다고"* — 2026-08-17 에 「사진을 동그랗게」를
//      넣으면서 **자랑카드까지 같이 원 안에 갇혔다**(표지를 채우는 넓이 24.5% · 카드 생존 62.8%).
//   ⭐ 뿌리 = 카드와 사진이 **저장 모양이 똑같아서**(`thumb:'photo'` ＋ `image`) 구분이 안 됐다.
//      → `imageFit: 'fill'` 이 그 표시다. 이 표시가 빠지면 **또 동그래진다.**
//   ⛔ 이 검사는 「글자가 있나」가 아니라 «두 짝이 다 있나»를 본다(규칙 18 ⓘ) —
//      ⑴저장하는 쪽이 표시를 붙이나 ⑵그리는 쪽이 그 표시를 보나. 한쪽만 있으면 조용히 반쪽이 된다.
{
  console.log('\n🎴 자랑카드 표지 — 「사진」과 갈리는 표시')
  const 부르는곳 = ['src/screens/RecipeDetailScreen.jsx', 'src/screens/BragScreen.jsx']
  let 샘 = 0
  for (const rel of 부르는곳) {
    const src = readFileSync(join(ROOT, rel), 'utf8')
    const 줄 = src.split('\n').filter((l) => l.includes('onSaveCover=') && !l.trim().startsWith('//'))
    if (!줄.length) { no(`${rel} — onSaveCover 를 넘기는 줄이 없다(자랑카드→표지 길이 끊겼나?)`); 샘++; continue }
    const 직접 = 줄.filter((l) => !l.includes('카드표지로('))
    if (직접.length) { no(`${rel} — onSaveCover 가 «카드표지로()» 를 안 쓴다 → imageFit 표시가 안 붙어 또 동그래진다`); 샘++ }
  }
  const 만드는곳 = readFileSync(join(ROOT, 'src/components/ShareDrawCard.jsx'), 'utf8')
  if (!/export const 카드표지로[^\n]*imageFit:\s*'whole'/.test(만드는곳)) { no("ShareDrawCard 의 카드표지로() 가 imageFit:'whole' 을 안 담는다"); 샘++ }
  const 그리는곳 = readFileSync(join(ROOT, 'src/components/Thumb.jsx'), 'utf8')
  const 코드 = 그리는곳.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n')
  if (!/recipe\.imageFit\s*===\s*'whole'/.test(코드)) { no('Thumb 이 imageFit 을 안 본다 — 저장은 되는데 그릴 때 무시되면 표시가 헛것이 된다'); 샘++ }
  else if (!/카드표지\s*\?[\s\S]{0,220}borderRadius:\s*'50%'/.test(코드)) { no('Thumb 이 imageFit 을 보긴 하는데 «원/네모»를 안 가른다'); 샘++ }
  if (!샘) ok('저장(2곳) → 표시(imageFit:whole) → 그리기(Thumb·contain) 세 짝이 다 붙어 있다')
}

// ═══ ⑫ 저장이 «함부로 지워지는» 보험이 살아 있나 ═══════════
//   💾 2026-08-19 — 창업자 *"저장한거 초기화되면 나같으면 앱지워"* · *"이거 되게 큰거야."*
//      폰 저장 공간이 모자라면 크롬은 «안 쓰는 사이트 데이터»부터 지운다. 그때 우리가 1순위가 될 수 있다.
//      `navigator.storage.persist()` 한 줄이 그걸 막는다 — 클라우드 저장이 나오기 전까지의 보험이다.
//   ⛔ **한 줄짜리라 리팩터링에서 소리 없이 사라지기 딱 좋다.** 사라져도 화면은 멀쩡해서 아무도 모른다.
//   ⭐ ＋ «구경 온 사람에게 권한 팝업을 띄우지 않는» 조건도 같이 지킨다 —
//      크롬은 조용히 켜 주지만 파이어폭스 등은 창을 띄운다. 그래서 «앱으로 깔아 쓰는 사람»에게만 묻는다.
//   ✅ 실물 = 창업자 폰에서 `persist: 켜짐 ✅` 확인(2026-08-19 · logintest.html)
{
  console.log('\n💾 저장 지킴(persist)')
  const m = readFileSync(join(ROOT, 'src/main.jsx'), 'utf8')
  const 코드 = m.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  if (!/navigator\.storage\.persist\(\)/.test(코드)) no('main.jsx 에서 persist() 요청이 사라졌다 — 저장이 함부로 지워질 수 있다')
  else if (!/display-mode:\s*standalone/.test(코드) || !/if \(!installed\) return/.test(코드)) {
    no('persist() 를 «누구에게나» 부른다 — 구경 온 사람에게 권한 팝업이 뜬다(앱으로 깐 사람에게만 물어야 한다)')
  } else ok('persist() 요청이 있고, 앱으로 깐 사람에게만 묻는다')
}

// ═══ ⑬ 창업자가 «무른 말»이 되살아났나 ═════════════════════
//   🗣 2026-08-21 — 창업자 *"매어둘까요 그런거말고"* 를 듣고 **첫 화면(CloudGate)만 고쳤다.**
//      홈 한 줄과 설정 카드에는 그 말이 그대로 살아남아 «검수 캡처»에서야 드러났다.
//   ⭐⭐ 같은 모양을 이미 밟았다 — v11.02 「책갈피」가 **일곱 곳**이었다(칩·사용법·설정 메뉴·통계·모아보기·빈칸·상세).
//      📌 **말은 한 곳에 안 산다.** 한 곳만 고치면 앱이 두 말을 하게 된다.
//   ⛔ 「금지어 사전」을 넓히지 말 것 — **창업자가 «직접 무른 말»만** 담는다(시끄러운 게이트는 죽은 게이트).
//   ⚠️ 주석은 걷어내고 본다 — 여기와 코드 주석에 «왜 무렀는지»가 적혀 있어야 하니까.
{
  console.log('\n🗣 창업자가 무른 말')
  const 무른말 = [
    [/매어\s?두|매어둘까요/, '「(계정에) 매어 두다」', '2026-08-21 · "매어둘까요 그런거말고" — 우리끼리 쓰는 말'],
    [/둘러보기/, '「둘러보기」', '2026-08-21 · "그냥 둘러보기??" — 로그인 없이도 다 되는데 «구경만»으로 읽힌다'],
    [/올라가는\s?것|안\s?올라가는\s?것/, '「올라가는 것 / 안 올라가는 것」', '2026-08-21 · "안내도 올라가는 것 이런거 말고" — 코드 읽는 말이지 안내가 아니다'],
  ]
  const 벗기기 = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')
  const 걸림 = []
  for (const p of SRC) {
    const t = 벗기기(readFileSync(p, 'utf8'))
    for (const [re, 이름, 왜] of 무른말) if (re.test(t)) 걸림.push([relative(ROOT, p), 이름, 왜])
  }
  if (걸림.length) {
    no(`창업자가 무른 말이 화면 글자로 살아 있다 (${걸림.length}곳)`)
    걸림.forEach(([f, 이름, 왜]) => console.log(`        ${f} — ${이름}\n          ↳ ${왜}`))
  } else ok(`창업자가 무른 말 ${무른말.length}개 — 화면 글자에 0곳`)
}

// ═══ ⑭ 개인정보처리방침의 «시행일 자리표시자»가 그대로 나가나 ═══
// ⛔⛔ 왜 = 방침의 「시행일」은 **실제로 효력이 생기는 날**이라 미리 못 박는다.
//    그래서 `@@시행일@@` 로 비워 두는데, **그대로 배포되면 유저가 그 글자를 본다.**
// ⭐ 배포 브랜치에서만 죽인다 — `hold/*` 는 «아직 안 나가는» 판이라 여기서 죽이면
//    고치는 동안 내내 빨간불이고, **늘 빨간 게이트는 아무도 안 본다**(우리가 여러 번 배운 것).
{
  console.log('\n⑭ 방침 시행일 자리표시자')
  // ⛓ 둘은 «같은 날» 나간다 — 방침만 고치고 삭제 안내를 안 고치면 말이 갈린다
  const 볼것 = ['privacy.html', 'delete-account.html']
  const 남은파일 = 볼것.filter((f) => {
    try { return readFileSync(join(ROOT, 'public', f), 'utf8').includes('@@시행일@@') } catch { return false }
  })
  const 남았나 = 남은파일.length > 0
  let 브랜치 = ''
  try { 브랜치 = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim() } catch { /* git 없으면 조용히 */ }
  const 나가는판 = 브랜치 && !브랜치.startsWith('hold/') && !브랜치.startsWith('wip/')
  if (남았나 && 나가는판) {
    no(`«시행일»이 아직 @@시행일@@ 인 파일 ${남은파일.length}개 — ${남은파일.join(' · ')} (지금 브랜치 ${브랜치})`)
    console.log('        ↳ 배포하는 «그날 날짜»로 바꾼다. 예) 2026년 9월 3일')
  } else if (남았나) {
    ok(`시행일이 아직 비어 있다 — ${브랜치} 는 안 나가는 판이라 넘어간다 (배포 브랜치에선 막힌다)`)
  } else ok('시행일이 채워져 있다')
}

console.log(bad ? `\n⛔⛔ ${bad}건 — 고치고 다시 돌릴 것\n` : '\n✅ 반복 실수 게이트 통과\n')
console.log('   📖 기계가 «못 잡는» 것들 = docs/실수-패턴-2026-08-07.md\n')
process.exit(bad ? 1 : 0)
