// 🧹🧹 **찌꺼기 쓸기 — 「디스크」와 「컨텍스트」를 «한 곳»에서 잰다** (창업자 2026-09-05)
//
// 📮 창업자 원문 = *"컨텍스트도 점검하고 와 지우거나 보관소 보낼거 있나.
//    (`/안녕` 루틴에 어제 못한 디스크정리, 컨텍스트 정리까지 넣자) / `잘자`루틴에도 마찬가지.
//    **그날의 필요없는 파일, 찌꺼기 싹 다 정리해서 버리고, 컨텍스트정리까지 하고 마친다.**"*
//
// ⛔⛔ **무슨 일이 있었나 (2026-09-05 아침 실측)**
//    세션이 열리자마자 «아무것도 못 돌았다» — 디스크가 **8.9MB 남음 (100%)**.
//    `echo` 조차 실패했다(자식 프로세스가 stdout 을 못 썼다). 파일 쓰기도 전부 ENOSPC.
//    🌲 뿌리 = `.git/objects/pack/tmp_pack_*` **35개 · 25GB**
//       ＝ **끊긴 `git fetch` 가 남긴 찌꺼기다.** 정상 종료하면 git 이 스스로 지우는데,
//         전송이 끊기면 1GB짜리가 그대로 남는다. 그게 하루 만에 35개 쌓였다.
//    ⭐ ＝ **내용은 하나도 안 잃었다.** 이력·자산 다 멀쩡했고, 찌꺼기만 자리를 다 먹고 있었다.
//
// ⭐⭐ **그래서 이 도구가 재는 건 둘이다 — 「디스크」와 「컨텍스트」**
//    · 💽 **디스크** = 지워도 «다시 만들어지는» 것만 (빌드결과·캐시·git 찌꺼기·옛 세션 스크래치패드)
//    · 🧠 **컨텍스트** = 대화 창을 먹는 것 (HANDOVER·CLAUDE 크기 · 보관소로 내릴 지난 날짜 문서)
//
// ⛔⛔ **절대 안 지우는 것 (창업자 보존원칙)**
//    · **git 이 추적하는 파일은 «단 하나도» 손대지 않는다.** 문서는 지우는 게 아니라 `git mv` 로 «옮긴다».
//    · `.git` 안에서 건드리는 건 **`tmp_pack_*` 딱 하나**다. objects·refs·logs 는 안 본다.
//    · 창업자가 준 원본(영상·시트·캡처)은 «재생성 불가»다 → 후보에 아예 안 넣는다.
//
// 👀 **기본은 «보여만» 준다.** 실제로 치우려면 `--치움`.
//    node hankki/scripts/sweep.mjs            # 뭐가 있나 본다
//    node hankki/scripts/sweep.mjs --치움      # 재생성 가능한 것만 실제로 지운다
import { existsSync, statSync, readdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const 치움 = process.argv.includes('--치움')
const ROOT = existsSync('hankki/docs') ? resolve('.') : resolve('..')
const APP = join(ROOT, 'hankki')

const 사람크기 = (b) => {
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(1) + 'GB'
  if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(0) + 'MB'
  if (b >= 1024) return (b / 1024).toFixed(0) + 'KB'
  return b + 'B'
}

// 폴더/파일 크기를 «내가» 센다 — du 가 없는 환경도 있다
function 잰다(p) {
  let 합 = 0
  let st
  try { st = statSync(p) } catch { return 0 }
  if (!st.isDirectory()) return st.size
  let 목록
  try { 목록 = readdirSync(p) } catch { return 0 }
  for (const 이름 of 목록) 합 += 잰다(join(p, 이름))
  return 합
}

// ─────────────────────────────────────────────────────────────
// 💽 1부 — 디스크: 지워도 «다시 만들어지는» 것만 모은다
// ─────────────────────────────────────────────────────────────
const 후보 = []

function 담는다(경로, 이름, 어떻게되살리나) {
  if (!existsSync(경로)) return
  const 크기 = 잰다(경로)
  if (크기 === 0) return
  후보.push({ 경로, 이름, 크기, 되살리기: 어떻게되살리나 })
}

// ⭐ 어제(2026-09-05) 디스크를 통째로 먹은 «그» 찌꺼기 — 제일 먼저 본다
const PACK = join(ROOT, '.git/objects/pack')
if (existsSync(PACK)) {
  for (const 이름 of readdirSync(PACK)) {
    if (!이름.startsWith('tmp_pack_')) continue   // ⛔ 이 접두어 «말고는» 절대 안 건드린다
    담는다(join(PACK, 이름), `.git 찌꺼기 ${이름}`, '끊긴 fetch 가 남긴 것 — 다시 받으면 그만이다')
  }
}

담는다(join(APP, 'dist'), '빌드 결과 hankki/dist', 'npm run build')
담는다(join(APP, 'node_modules/.vite'), 'vite 캐시', '다음 빌드가 다시 만든다')
담는다('/root/.cache/uv', 'uv 캐시', '다음 설치가 다시 받는다')
담는다('/root/.cache/pip', 'pip 캐시', '다음 설치가 다시 받는다')
담는다('/tmp/node-compile-cache', 'node 컴파일 캐시', '다음 실행이 다시 만든다')

// 🗂 옛 세션 스크래치패드 — «지금 세션 것은 빼고»
const 지금세션 = process.env.CLAUDE_SCRATCHPAD_DIR || ''
for (const 뿌리 of ['/tmp/claude-0']) {
  if (!existsSync(뿌리)) continue
  let 프로젝트들
  try { 프로젝트들 = readdirSync(뿌리) } catch { continue }
  for (const p of 프로젝트들) {
    let 세션들
    try { 세션들 = readdirSync(join(뿌리, p)) } catch { continue }
    for (const s of 세션들) {
      const 패드 = join(뿌리, p, s, 'scratchpad')
      if (지금세션.includes(s)) continue          // ⛔ 지금 쓰고 있는 것은 안 지운다
      담는다(패드, `옛 세션 스크래치패드 ${s.slice(0, 8)}…`, '그 세션의 임시 출력물 — 저장소엔 이미 들어갔다')
    }
  }
}

// 🗑 찌꺼기 파일 — git 이 «추적하지 않는» 것만
const 찌꺼기무늬 = ['.orig', '.rej', '.bak', '~']
function 찌꺼기찾기(dir, 깊이 = 0) {
  if (깊이 > 6) return
  let 목록
  try { 목록 = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of 목록) {
    if (['node_modules', '.git', 'dist'].includes(e.name)) continue
    const 전체 = join(dir, e.name)
    if (e.isDirectory()) { 찌꺼기찾기(전체, 깊이 + 1); continue }
    if (e.name === '.DS_Store' || 찌꺼기무늬.some((m) => e.name.endsWith(m))) {
      담는다(전체, `찌꺼기 ${e.name}`, '없어도 되는 편집 부산물')
    }
  }
}
찌꺼기찾기(ROOT)

// ⛔ 마지막 안전장치 — git 이 추적하는 것이 후보에 «하나라도» 있으면 그건 버그다
let 추적목록 = new Set()
try {
  추적목록 = new Set(
    execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 1 << 28 })
      .split('\n').filter(Boolean).map((f) => join(ROOT, f)),
  )
} catch { /* git 이 없으면 이 검사만 건너뛴다 */ }
const 위험 = 후보.filter((c) => 추적목록.has(c.경로))
if (위험.length) {
  console.error('⛔⛔ 멈춘다 — git 이 추적하는 파일이 «지울 것»에 들어왔다. 이건 도구의 버그다:')
  위험.forEach((c) => console.error('   · ' + c.경로))
  process.exit(1)
}

// ─────────────────────────────────────────────────────────────
// 📤 보고
// ─────────────────────────────────────────────────────────────
console.log('\n🧹 **찌꺼기 쓸기** — 지워도 «다시 만들어지는» 것만 본다\n')

let 남은공간 = ''
try {
  const df = execFileSync('df', ['-h', '/'], { encoding: 'utf8' }).trim().split('\n').pop().split(/\s+/)
  남은공간 = `${df[3]} 남음 (${df[4]} 씀)`
  console.log(`💽 지금 디스크 — **${남은공간}**`)
} catch { /* df 가 없으면 넘어간다 */ }

if (!후보.length) {
  console.log('\n✅ 지울 것 없다 — 재생성 가능한 찌꺼기가 하나도 없다.\n')
} else {
  후보.sort((a, b) => b.크기 - a.크기)
  const 합 = 후보.reduce((s, c) => s + c.크기, 0)
  console.log(`\n🗑 **${후보.length}개 · 합쳐서 ${사람크기(합)}** — 전부 다시 만들 수 있는 것이다\n`)
  for (const c of 후보.slice(0, 20)) {
    console.log(`   ${사람크기(c.크기).padStart(7)}  ${c.이름}`)
    console.log(`            ↩︎ ${c.되살리기}`)
  }
  if (후보.length > 20) console.log(`   … ${후보.length - 20}개 더`)

  if (치움) {
    let 지운합 = 0
    for (const c of 후보) {
      try { rmSync(c.경로, { recursive: true, force: true }); 지운합 += c.크기 } catch { /* 이미 없으면 그만 */ }
    }
    console.log(`\n✅ **치웠다 — ${사람크기(지운합)}**`)
    try {
      const df = execFileSync('df', ['-h', '/'], { encoding: 'utf8' }).trim().split('\n').pop().split(/\s+/)
      console.log(`💽 이제 — **${df[3]} 남음 (${df[4]} 씀)**`)
    } catch { /* df 가 없으면 넘어간다 */ }
  } else {
    console.log('\n👀 «보여만» 줬다. 실제로 치우려면 → node hankki/scripts/sweep.mjs --치움')
  }
}

// ─────────────────────────────────────────────────────────────
// 🧠 2부 — 컨텍스트: 대화 창을 먹는 것
// ─────────────────────────────────────────────────────────────
console.log('\n🧠 **컨텍스트** — 대화 창을 먹는 쪽은 «파일 크기»가 아니라 이쪽이다\n')

const 돌린다 = (스크립트, 인자 = []) => {
  const p = join(APP, 'scripts', 스크립트)
  if (!existsSync(p)) return null
  try { return execFileSync('node', [p, ...인자], { encoding: 'utf8', cwd: ROOT }) } catch (e) { return e.stdout || null }
}

const 크기 = 돌린다('check-docsize.mjs')
if (크기) console.log(크기.trim().split('\n').filter((l) => l.trim()).map((l) => '   ' + l.trim()).join('\n'))

const 트림 = 돌린다('doc-trim.mjs')
if (트림) {
  const 줄 = 트림.trim().split('\n').filter((l) => /①|②|❓/.test(l))
  if (줄.length) {
    console.log('\n   🧹 HANDOVER 에서 «내릴 수 있는 것»')
    줄.forEach((l) => console.log('   ' + l.trim()))
    console.log('   👉 옮기려면 → node hankki/scripts/doc-trim.mjs --옮김')
  }
}

// 📅 같은 계열인데 «더 새 것이 있는» 날짜 문서 = 보관소 후보
const DOCS = join(APP, 'docs')
if (existsSync(DOCS)) {
  const 계열 = new Map()
  for (const 이름 of readdirSync(DOCS)) {
    if (!이름.endsWith('.md')) continue
    const m = 이름.match(/^(.*?)-?(\d{4}-\d{2}-\d{2})/)
    if (!m) continue
    const 키 = m[1].replace(/-\d+$/, '')
    if (!키) continue
    if (!계열.has(키)) 계열.set(키, [])
    계열.get(키).push({ 이름, 날짜: m[2] })
  }
  const 내릴것 = []
  for (const [키, 목록] of 계열) {
    if (목록.length < 2) continue
    목록.sort((a, b) => b.날짜.localeCompare(a.날짜))
    // ⭐ 작업복기는 최근 «셋»을 남긴다(/청소 규칙). 나머지 계열은 최신 하나만.
    const 남길수 = 키.startsWith('작업복기') ? 3 : 1
    목록.slice(남길수).forEach((x) => 내릴것.push({ 키, ...x }))
  }
  if (내릴것.length) {
    console.log(`\n   📅 **보관소 후보 ${내릴것.length}장** — 같은 계열에 «더 새 것»이 있다`)
    내릴것.slice(0, 12).forEach((x) => console.log(`      · ${x.이름}`))
    if (내릴것.length > 12) console.log(`      … ${내릴것.length - 12}장 더`)
    console.log('   ⛔ **지우지 말 것 — `git mv` 로 `docs/_archive/` 로 «옮긴다».**')
    console.log('   ⛔ 옮긴 뒤 **그 파일을 가리키던 경로를 고칠 것** (안 고치면 끊긴 링크가 된다)')
  } else {
    console.log('\n   ✅ 보관소로 내릴 지난 날짜 문서 없다')
  }
}

console.log('')
