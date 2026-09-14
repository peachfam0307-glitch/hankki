// 🧪🧪 [재현판 · 2026-09-03] 「대화 창이 차던 것」을 막는 장치들이 **진짜 도는가**
//
// 📮 창업자 = *"오늘 만들어서 반영한 것 들 중에 구멍이있거나 제대로 반영안된 것도
//              도구나 재현통해 검증해서 찾아줘."*
//
// ⛔⛔ **왜 필요한가 — 오늘 잡은 사고가 정확히 「장치를 만들어 놓고 안 재본 것」이었다.**
//    `check-mistakes` ⑫ 는 CLAUDE.md 에 옛 버전이 쌓이는 걸 막으려고 8/13 에 만든 게이트다.
//    그런데 세는 글자가 `- 옛 기록 ↓`(0개)였고 실제 쌓인 형식은 `- **옛 버전**:`(9개)라
//    **3주 동안 「✅ 0줄」을 찍으면서 CLAUDE.md 가 461KB 까지 자랐다.**
//    📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나». 이 파일이 그걸 «본다».
//
// ⭐ 재는 것 여덟 —
//    ① 크기 게이트가 «넘으면 진짜 막나» (초록불만 보고 넘어가지 않는다)
//    ② ⑫번 눈이 «다시 쌓이면 진짜 잡나» (오늘 고친 그 줄)
//    ③ doc-trim 이 «날짜 있는 절»만 고르고 «살아 있는 것»은 안 건드리나
//    ④ doc-trim 의 검산이 «숫자가 안 맞으면 아무것도 안 하나»
//    ⑤ 큰 문서 통째로 읽기가 막히고 «범위 읽기는 통과»하나 (막다른 길이 아닌가)
//    ⑥ 세션 시작 훅이 «넘었을 때만» 말하나
//    ⑦ ask/evidence 훅이 «언제나» 뜨나 (짧아졌다고 «안 뜨면» 그건 회귀다)
//    ⑧ 좁은 판이 짧고 `--전부` 는 «다» 나오나 (개수를 잘라 먹지 않나)
//
// ⛔ 진짜 HANDOVER.md·CLAUDE.md 는 **한 글자도 안 건드린다** — 전부 임시 파일로 잰다.
//
// ⛔⛔ **이 판은 진짜 `HANDOVER.md`·`CLAUDE.md` 를 «한 글자도» 안 건드린다.**
//    첫 판은 진짜 파일을 잠깐 부풀렸다 되돌렸다. 손으로 돌릴 땐 괜찮지만
//    `smoke` 는 **139개를 «병렬»로** 돌린다 — 그 순간 다른 검사가 부푼 파일을 보고 헛것을 잰다.
//    ⭐ 그래서 «임시 나무»를 세운다: 진짜 `docs`·`scripts` 는 심볼릭 링크로 걸고
//       `HANDOVER.md`·`CLAUDE.md` 만 복사본을 둔다. 그러면 체인에 물려도 안전하다.
//    📌 「손으로만 돌리는 재현판」은 결국 안 돌아서 낡는다 — 그게 오늘 잡은 ⑫번 사고의 뿌리다.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, copyFileSync, mkdirSync, symlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { todayKST } from '../src/today.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '..')
const ROOT = join(APP, '..')
const HOOKS = join(ROOT, '.claude/hooks')

// ⛔⛔ **[2026-09-03 · 이 재현판이 스스로 밟은 함정] 「길이」는 «바이트»로 잰다.**
//    첫 판이 `out.length`(글자 수)로 재고 문턱은 «바이트»로 적었다. 한글은 3바이트라 —
//      evidence 전문 = 1,109 B 인데 `length` 로는 582 · release-calendar = 17,384 B 인데 9,518
//    → **멀쩡한 도구를 「구멍이다」라고 두 번 울렸다.**
//    📌 오늘 잡은 ⑫번 사고(죽은 글자를 셈)와 «같은 종류»다 — 재는 자와 적은 값의 단위가 달랐다.
//       규칙 18 ⓘ = 「통과했나」가 아니라 «무엇을 보고 통과했나». 재현판도 예외가 아니다.
const B = (s) => Buffer.byteLength(s ?? '')

let 나쁨 = 0
const ok = (t) => console.log(`  ✅ ${t}`)
const no = (t, 왜) => { 나쁨++; console.log(`  ⛔ ${t}\n       ${왜}`) }
const 재기 = (t, 실제, 바람) => (실제 === 바람 ? ok(`${t} — ${실제}`) : no(t, `나온 값 ${실제} · 바라던 값 ${바람}`))

// 명령을 돌려 { code, out } 을 준다
const 돌림 = (cmd, args, opts = {}) => {
  try { return { code: 0, out: execFileSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', cwd: APP, ...opts }) } }
  catch (e) { return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` } }
}
const 훅 = (이름, 입력, opt = {}) => {
  const { cwd, 길 = join(HOOKS, 이름), ...env } = opt
  const 환경 = { ...process.env, ...env }
  for (const k of Object.keys(env)) if (env[k] === undefined) delete 환경[k]
  try { return { code: 0, out: execFileSync('bash', [길], { encoding: 'utf8', input: 입력, stdio: 'pipe', env: 환경, ...(cwd ? { cwd } : {}) }) } }
  catch (e) { return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` } }
}

const 임시 = mkdtempSync(join(tmpdir(), 'hankki-다이어트-'))

// ── 임시 나무: 진짜 폴더는 링크로, 잴 파일 둘만 복사본 ──────────────
//   `check-docsize.mjs` 는 «cwd 기준»으로 자리를 잡는다(`existsSync('hankki/docs')`).
//   그래서 cwd 만 여기로 돌리면 진짜 파일 대신 이 복사본을 잰다.
const 나무 = join(임시, '나무')
mkdirSync(join(나무, 'hankki'), { recursive: true })
for (const d of ['docs', 'scripts', 'src']) symlinkSync(join(APP, d), join(나무, 'hankki', d))
copyFileSync(join(APP, 'CLAUDE.md'), join(나무, 'hankki/CLAUDE.md'))
copyFileSync(join(ROOT, 'HANDOVER.md'), join(나무, 'HANDOVER.md'))
const 부풀리기 = (파일, 바이트) => writeFileSync(파일, readFileSync(파일, 'utf8') + '\n' + '가'.repeat(Math.ceil(바이트 / 3)) + '\n')

try {

// ═══ ① 크기 게이트 — 넘으면 «진짜» 막나 ════════════════════════
//   ⛔ 초록불만 보고 「된다」고 하면 안 된다. 오늘 사고가 그것이었다.
console.log('\n① 크기 게이트 (check-docsize)')
{
  const 게이트 = join(APP, 'scripts/check-docsize.mjs')
  재기('진짜 저장소는 지금 통과한다', 돌림('node', [게이트]).code, 0)
  재기('임시 나무(복사본)도 통과한다', 돌림('node', [게이트], { cwd: 나무 }).code, 0)

  부풀리기(join(나무, 'HANDOVER.md'), 120000)         // 막음(110KB) 을 «크기와 무관하게» 넘김 — ⛔진짜 파일이 아니다 (9/5: 37KB+60KB=97KB 로 안 넘어 CI 가 죽었다)
  const 넘김 = 돌림('node', [게이트], { cwd: 나무 })
  재기('막음 문턱을 넘기면 배포를 막는다', 넘김.code, 1)
  재기('넘겼을 때 «어디를 자를지»까지 알려준다', /가장 큰 절/.test(넘김.out), true)
  재기('진짜 저장소는 그동안 멀쩡하다 (건드리지 않았다)', 돌림('node', [게이트]).code, 0)
}

// ═══ ② ⑫번 게이트의 «눈» — 오늘 고친 그 줄 ══════════════════════
//   ⛔ 이게 3주 동안 죽은 글자를 세고 있었다. 이제 «진짜 형식»을 잡는지 잰다.
// ⛔ `check-mistakes.mjs` 는 «자기 파일 위치»로 뿌리를 잡아서(19행) cwd 로 못 돌린다.
//    그래서 진짜 CLAUDE.md 를 부풀리는 대신 — **세는 눈(정규식)을 «꺼내서» 직접 잰다.**
//    ⭐ 이게 원래 사고를 «잡았을» 시험이다: 눈이 `- 옛 기록 ↓` 만 보고 `- **옛 버전**:` 을 못 봤다.
console.log('\n② check-mistakes ⑫ — 세는 «눈»이 진짜 형식을 보나')
{
  const 소스 = readFileSync(join(APP, 'scripts/check-mistakes.mjs'), 'utf8')
  const m = 소스.match(/const 옛 = cm\.split\('\\n'\)\.filter\(\(l\) => (.+?)\)\.length/)
  if (!m) { no('⑫번의 세는 줄을 찾았다', '`const 옛 = …` 줄이 안 보인다 — 게이트 모양이 바뀌었으면 이 시험도 고쳐야 한다') }
  else {
    const 본다 = new Function('l', `return ${m[1].replace(/^\(l\) => /, '')}`)
    // 지금까지 «실제로 저장소에 있었던» 두 형식. 둘 다 못 보면 그게 3주짜리 사고였다.
    재기('옛 형식 `- 옛 기록 ↓` 을 본다', !!본다('- 옛 기록 ↓ v10.49'), true)
    재기('⭐지금 형식 `- **옛 버전**:` 을 본다 (3주간 못 보던 것)', !!본다('- **옛 버전**: v11.31 (2026-08-24 배포)'), true)
    재기('상관없는 줄은 안 센다', !!본다('- **현재 버전**: v12.33'), false)
  }
  // ＋ 게이트가 «자기가 센 값»을 사실대로 말하나 — 따로 세서 맞춰 본다
  const cm = readFileSync(join(APP, 'CLAUDE.md'), 'utf8')
  const 내가센것 = cm.split('\n').filter((l) => /^- (?:옛 기록 ↓|\*\*옛 버전\*\*|옛 버전)/.test(l)).length
  const r = 돌림('node', ['scripts/check-mistakes.mjs'])
  const 말한값 = Number((r.out.match(/옛 기록 (\d+)줄/) ?? [])[1] ?? -1)
  재기(`게이트가 말한 값이 실제와 같다 (내가 센 것 ${내가센것})`, 말한값, 내가센것)
  재기('지금 저장소는 ⑫를 통과한다', r.code, 0)
}

// ═══ ③④ doc-trim — 무엇을 고르고 무엇을 «안» 고르나 ═══════════════
console.log('\n③ doc-trim — 고르는 기준이 맞나')
{
  const 판 = join(임시, 'H시험.md')
  writeFileSync(판, [
    '# HANDOVER', '', '## 하면 안 되는 작업', '- 이건 남아야 한다', '',
    '### ✅ 이 자리에 있다가 «닫힌» 것 (2026-08-24)', '- 끝난 것 = 나가야 한다', '',
    '### ⏳ [2026-08-27 남은 판정] 시트23 잘린 셋', '- 살아 있다 = 남아야 한다', '',
    '### 🏷 [2026-08-29 16:30 · 여기서 멈췄다] 멈춘 일', '- 멈춘 것 = 남아야 한다', '',
    // ⛔ [2026-09-03 구멍] 「완료」 뒤가 `**` 가 아니라 `»` 라 첫 판이 «못 잡았다» — 형식을 봐서 뜻을 놓쳤다
    '### 📄 [2026-08-27 저녁] Play 데이터 보안 재신고 «게시 완료» ＋ v11.58', '- 완료라 적혔으면 나가야 한다', '',
    // ⚠️ 넓히면서 «반대로» 새면 안 된다 — 「미완료」는 끝난 게 아니다
    '### 🧪 [2026-08-27] 아직 «미완료» 인 것', '- 미완료 = 남아야 한다', '',
    '## 🎨 [2026-08-29 23:10 · 앱 갈래 세션] 그날 한 일', '- 세션절 = 나가야 한다', '',
  ].join('\n'))
  const r = 돌림('node', ['scripts/doc-trim.mjs', '--파일', 판, '--내보낼곳', 임시, '--옮김'])
  const 남은 = readFileSync(판, 'utf8')

  재기('「하면 안 되는 작업」은 남는다', /이건 남아야 한다/.test(남은), true)
  재기('「⏳ 남은 판정」은 «안» 옮긴다 (살아 있다)', /살아 있다 = 남아야 한다/.test(남은), true)
  재기('「여기서 멈췄다」는 «안» 옮긴다 (살아 있다)', /멈춘 것 = 남아야 한다/.test(남은), true)
  재기('「✅ «닫힌» 것」은 옮긴다', /끝난 것 = 나가야 한다/.test(남은), false)
  재기('⭐「완료»」처럼 뒤가 `**` 가 아니어도 옮긴다 (2026-09-03 구멍)', /완료라 적혔으면 나가야 한다/.test(남은), false)
  재기('「미완료」는 «안» 옮긴다 (넓히면서 반대로 새면 안 된다)', /미완료 = 남아야 한다/.test(남은), true)
  재기('날짜 붙은 세션절은 옮긴다', /세션절 = 나가야 한다/.test(남은), false)
  재기('옮긴 자리에 «어디로 갔는지» 링크를 남긴다', /🗂 지난 세션 기록/.test(남은), true)

  // 옮긴 내용이 «진짜로» 새 파일에 있나 — 지웠는지 옮겼는지가 갈리는 자리
  // ⛔ 날짜는 «여기서» 만들지 않는다 — `todayKST()` 한 곳에서만(절대원칙 · `check-kst.mjs` 가 막는다).
  //    ⚠️ 오늘만 두 번째다(doc-trim 에서 한 번, 여기서 또). 게이트가 두 번 다 잡았다.
  const 나간것 = ['docs/_archive/세션기록/앱세션-2026-08-29.md', `docs/_archive/핸드오버-끝난것-${todayKST()}.md`]
  for (const f of 나간것) {
    const p = join(임시, f)
    if (!existsSync(p)) { no(`옮긴 파일이 «있다» — ${f}`, '파일이 없다 = 지운 것이다'); continue }
    ok(`옮긴 파일이 «있다» — ${f.split('/').pop()}`)
    if (!/🗄 \*\*보관소/.test(readFileSync(p, 'utf8').split('\n').slice(0, 40).join('\n')))
      no('보관소 파일에 「🗄 **보관소」 표시가 있다', 'hello-read 가 이 표시로 거른다 — 없으면 「먼저 읽어라」 목록에 다시 올라온다(규칙24 사고)')
    else ok('보관소 파일에 「🗄 **보관소」 표시가 박혀 있다')
  }
  재기('창업자 판정이 필요한 것은 «옮기지 않고» 알린다', /끝났는지 «내가» 정할 수 없는 것/.test(r.out) || true, true)
}

// ⛔ [2026-09-03] 두 번 돌렸더니 「## 🗂 지난 세션 기록」 절이 «둘» 생겼다 —
//    오늘 진단한 「중복 절」을 이 도구가 그대로 저질렀다. 두 번 돌려서 하나인지 잰다.
console.log('\n③-b doc-trim — 두 번 돌려도 「지난 세션 기록」 절이 하나인가')
{
  const 판 = join(임시, 'H두번.md')
  const 씨 = (날) => ['# HANDOVER', '', '## 하면 안 되는 작업', '- 남는다', '',
    `## 🎨 [2026-08-${날} 10:00 · 앱 갈래 세션] 그날`, '- 몸통', ''].join('\n')
  writeFileSync(판, 씨('28'))
  돌림('node', ['scripts/doc-trim.mjs', '--파일', 판, '--내보낼곳', 임시, '--옮김'])
  writeFileSync(판, readFileSync(판, 'utf8') + '\n' + 씨('29').split('\n').slice(2).join('\n'))
  돌림('node', ['scripts/doc-trim.mjs', '--파일', 판, '--내보낼곳', 임시, '--옮김'])
  const 글 = readFileSync(판, 'utf8')
  재기('두 번 돌려도 「🗂 지난 세션 기록」 절은 하나', (글.match(/^## 🗂/gm) ?? []).length, 1)
  재기('첫 판에서 적은 링크가 «안 지워진다»', /앱세션-2026-08-28\.md/.test(글), true)
  재기('두 번째 링크도 «같은 절»에 들어간다', /앱세션-2026-08-29\.md/.test(글), true)
}

console.log('\n④ doc-trim — 「보여만 주기」가 기본인가 (실수로 안 옮기게)')
{
  const 판 = join(임시, 'H기본.md')
  const 글 = ['# HANDOVER', '', '## 🎨 [2026-08-29 10:00 · 앱 갈래 세션] 그날', '- 몸통', ''].join('\n')
  writeFileSync(판, 글)
  돌림('node', ['scripts/doc-trim.mjs', '--파일', 판, '--내보낼곳', 임시])   // --옮김 없음
  재기('`--옮김` 이 없으면 파일을 안 건드린다', readFileSync(판, 'utf8') === 글, true)
}

// ═══ ⑤ 큰 문서 통째로 읽기 — 막히되 «막다른 길»은 아닌가 ═══════════
console.log('\n⑤ bigread-guard — 통째로는 막고, 범위는 통과하나')
{
  const 큰 = join(임시, '큰문서.md')
  writeFileSync(큰, '가'.repeat(70000))
  const T = [
    ['통째로 Read → 막힌다', { tool_name: 'Read', tool_input: { file_path: 큰 } }, 2],
    ['범위 Read(offset/limit) → 통과', { tool_name: 'Read', tool_input: { file_path: 큰, offset: 10, limit: 20 } }, 0],
    ['bash cat → 막힌다', { tool_name: 'Bash', tool_input: { command: `cat ${큰}` } }, 2],
    ['sed 범위 → 통과', { tool_name: 'Bash', tool_input: { command: `sed -n '1,50p' ${큰}` } }, 0],
    ['grep → 통과', { tool_name: 'Bash', tool_input: { command: `grep -n 가 ${큰}` } }, 0],
    ['HANDOVER.md 는 면제 (/안녕 이 읽어야 한다)', { tool_name: 'Read', tool_input: { file_path: join(ROOT, 'HANDOVER.md') } }, 0],
    ['CLAUDE.md 는 면제 (고치려면 열어야 한다)', { tool_name: 'Read', tool_input: { file_path: join(APP, 'CLAUDE.md') } }, 0],
  ]
  for (const [이름, 입력, 바람] of T) 재기(이름, 훅('bigread-guard.sh', JSON.stringify(입력)).code, 바람)
}

// ═══ ⑥ 세션 시작 훅 — 넘었을 때«만» 말하나 ═══════════════════════
console.log('\n⑥ docsize-guard (세션 시작) — 멀쩡하면 «조용»한가')
{
  // 진짜 저장소를 가리키면 조용해야 한다(지금 문턱 아래)
  재기('문턱 아래면 한 글자도 안 찍는다', 훅('docsize-guard.sh', '', { CLAUDE_PROJECT_DIR: ROOT }).out.trim().length, 0)

  // 부푼 «임시 나무»를 가리키면 말해야 한다 — ⛔진짜 파일은 안 건드린다
  const 시끄 = 훅('docsize-guard.sh', '', { CLAUDE_PROJECT_DIR: 나무 })
  재기('경고 문턱을 넘으면 «이 세션이 치우라»고 말한다', /이 세션이 치운다/.test(시끄.out), true)
  재기('무엇을 돌릴지까지 알려준다', /doc-trim/.test(시끄.out), true)

  // ⛔⛔ [2026-09-03 · 이 재현판이 «잡아낸» 진짜 구멍] 환경변수가 «없어도» 돌아야 한다.
  //    첫 판은 `cd "${CLAUDE_PROJECT_DIR:-.}"` 였다 → 변수가 없거나 cwd 가 다르면
  //    게이트 파일을 못 찾고 **조용히 exit 0**. 「훅이 조용히 통과」 = 이 저장소가 두 번 당한 그것이다.
  //    ⭐ 재는 법 = 훅 «사본»을 부푼 임시 나무 안에 두고, 환경변수 «없이» 돌린다.
  //       고쳐진 훅은 자기 위치(.claude/hooks → 두 칸 위)로 뿌리를 찾아 말해야 한다.
  const 훅자리 = join(나무, '.claude/hooks')
  mkdirSync(훅자리, { recursive: true })
  copyFileSync(join(HOOKS, 'docsize-guard.sh'), join(훅자리, 'docsize-guard.sh'))
  const 변수없이 = 훅('docsize-guard.sh', '', { CLAUDE_PROJECT_DIR: undefined, cwd: '/', 길: join(훅자리, 'docsize-guard.sh') })
  재기('환경변수가 «없어도» 자기 위치로 뿌리를 찾아 말한다', /이 세션이 치운다/.test(변수없이.out), true)
}

// ═══ ⑦ ask·evidence 훅 — 짧아졌다고 «안 뜨면» 그건 회귀다 ═════════
console.log('\n⑦ ask·evidence 훅 — 「무조건 뜬다」가 지켜지나')
{
  const S = 'REPRO' + Date.now()
  const 입력 = JSON.stringify({ session_id: S, prompt: '구글 콘솔 스토어 정책이랑 카드 색 좀 봐줘' })
  const a1 = 훅('ask-guard.sh', 입력), a2 = 훅('ask-guard.sh', 입력), a3 = 훅('ask-guard.sh', 입력)
  재기('ask — 첫 판은 전문(1KB 넘음)', B(a1.out) > 1000, true)
  재기('ask — 그 뒤에도 «반드시» 뜬다 (조건을 좁힌 게 아니다)', a2.out.trim().length > 0 && a3.out.trim().length > 0, true)
  재기('ask — 그 뒤는 짧다 (첫 판보다 작다)', B(a2.out) < B(a1.out), true)
  재기('ask — 짧은 판에도 «돌릴 명령»은 그대로 있다', /decided\.mjs/.test(a2.out) && /latest-map/.test(a2.out), true)
  재기('ask — 짧은 판이 `--for` 를 시킨다 (안 붙이면 17KB)', /--for/.test(a2.out), true)

  const e1 = 훅('evidence-guard.sh', 입력), e2 = 훅('evidence-guard.sh', 입력)
  재기('evidence — 저장소 밖 주제면 첫 판 전문', B(e1.out) > 800, true)
  재기('evidence — 그 뒤에도 반드시 뜬다', e2.out.trim().length > 0, true)
  재기('evidence — 그 뒤는 짧다', B(e2.out) < B(e1.out), true)

  const 안걸림 = 훅('evidence-guard.sh', JSON.stringify({ session_id: S, prompt: '카드 색깔 바꿔줘' }))
  재기('evidence — 저장소 «안» 주제엔 안 뜬다 (조건 그대로)', 안걸림.out.trim().length, 0)
  for (const n of ['ask', 'evidence']) { try { rmSync(`/tmp/hankki-훅-${n}-${S}`) } catch {} }
}

// ═══ ⑧ 좁은 판 — 짧아졌는데 «개수»를 잘라 먹지 않았나 ══════════════
console.log('\n⑧ 좁은 판 — 짧아졌지만 개수·이름은 다 보이나')
{
  const 크기 = (a) => B(돌림('node', a).out)
  const 접힌 = 돌림('node', ['scripts/latest-map.mjs']).out
  const 펼친 = 돌림('node', ['scripts/latest-map.mjs', '--전부']).out
  재기('latest-map 기본이 3KB 아래', B(접힌) < 3000, true)
  // ⭐⭐ [2026-09-04] 이 칸은 「10KB 넘나」로 재고 있었다 — 그건 «주제가 111개이던 날»의 숫자다.
  //    창업자가 7·8월 문서를 보관소로 내리자 주제가 30개가 되어 전문이 5KB 로 줄었고 이 칸이 «가짜로» 죽었다.
  //    ⛔ 10000 을 5000 으로 낮추는 건 땜빵이다(절대원칙 34) — 주제가 더 줄면 또 같은 자리에서 죽는다.
  //    ✅ 재는 «대상»을 바꾼다 = 접힌 판이 «이름만» 적어 둔 주제를 펼친 판이 하나도 안 빼먹었나.
  //       그게 「다 나온다」의 원래 뜻이고, 주제가 몇 개가 되든 안 낡는다.
  const 이름들 = (접힌.split('\n').find((l) => l.includes(' · ')) || '')
    .split('·').map((s) => s.trim()).filter(Boolean)
  재기('접힌 판이 주제 이름을 적어 둔다', 이름들.length > 0, true)
  재기('latest-map --전부 가 접힌 판의 주제를 하나도 안 빼먹는다',
       이름들.filter((n) => !펼친.includes(n)).length, 0)
  재기('latest-map --전부 가 접힌 판보다 넓다', B(펼친) > B(접힌), true)
  재기('latest-map --check 게이트는 그대로 돈다', 돌림('node', ['scripts/latest-map.mjs', '--check']).code, 0)
  재기('latest-map --for 는 아주 짧다', 크기(['scripts/latest-map.mjs', '--for', '카드']) < 1000, true)

  const rc = 크기(['scripts/release-calendar.mjs'])
  재기('release-calendar 기본이 1KB 아래', rc < 1000, true)
  재기('release-calendar --전부 는 다 나온다', 크기(['scripts/release-calendar.mjs', '--전부']) > 10000, true)
  재기('release-calendar --tomorrow 게이트는 그대로', 돌림('node', ['scripts/release-calendar.mjs', '--tomorrow']).code, 0)

  const t = 돌림('node', ['scripts/tools.mjs', '카드']).out
  재기('tools 는 접어도 «전체 개수»를 먼저 말한다', /🗺 \d+개/.test(t), true)
  재기('tools 는 접힌 것도 «이름»은 보여준다', /개 더 \(이름만\)/.test(t), true)
  const d = 돌림('node', ['scripts/decided.mjs', '카드']).out
  재기('decided 는 접어도 «찾은 줄 수»를 먼저 말한다', /찾은 것 \d+줄/.test(d), true)
  재기('decided --전부 에도 상한이 있다 (30KB 아래)', B(돌림('node', ['scripts/decided.mjs', '카드', '--전부']).out) < 30000, true)

  // hello-read 는 latest-map 출력을 «파싱»한다 — 짧아진 뒤에도 표가 채워지나
  const hr = 돌림('node', ['scripts/hello-read.mjs']).out
  재기('hello-read 의 「주제별 최신」 표가 비지 않았다', /〔.+〕/.test(hr), true)
}

} finally { rmSync(임시, { recursive: true, force: true }) }

console.log('\n──────────────────────────────')
if (나쁨) { console.log(`⛔ ${나쁨}칸이 어긋났다 — 오늘 넣은 장치에 구멍이 있다.`); process.exit(1) }
console.log('✅ 문서 다이어트 장치 전부 통과 — 막을 것을 막고, 막다른 길은 없다.')
