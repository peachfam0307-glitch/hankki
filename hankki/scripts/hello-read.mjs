// 👋 `/안녕` 이 «무엇을, 어떤 순서로» 읽을지 — 손으로 적지 말고 **만들어서 준다.**
//
// 📮 창업자 2026-08-13: *"내가 안녕돌리면 전날 혹은 최근문서부터 읽고 브리핑하기로 했는데,
//    **예전문서 읽어와서 짬뽕만들고있어.** 이것도 규칙으로 박아둬."*
//
// ⛔⛔ 뿌리 = `/안녕` 의 읽을 목록이 **손으로 적은 파일 이름 목록**이었다. 그래서 —
//   ⓐ **날짜도 순서도 없다** → 7/21 문서와 8/13 문서를 «같은 무게»로 읽고 섞는다(＝짬뽕)
//   ⓑ **목록 자체가 낡는다** → 실제로 그 안에 *"음식88·도구94"* 라고 적혀 있었는데
//      진짜는 **236컷**이다. 읽으라고 준 목록이 이미 틀린 값을 담고 있었다.
//   📌 **목록을 사람이 관리하면 반드시 낡는다.** 그래서 «날짜와 git 이 정하게» 한다.
//
// ⭐ 순서에 뜻이 있다 — **최근 것이 옛것을 «이긴다».**
//   ① 어제~오늘 손댄 문서   ← 여기부터. 지난 세션이 끝난 자리다
//   ② 주제별 최신 한 장씩   ← 「그 주제는 이게 마지막 판」
//   ③ 날짜 없는 상시 문서   ← 규칙·일하는 방식(늘 유효하니 순서가 늦어도 된다)
//   ⛔ 목록에 «없는» 날짜 문서는 브리핑 근거로 쓰지 않는다.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { generations, recentDocs } from './doc-guard.mjs'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/docs')) ? join(ROOT, 'hankki') : ROOT
const rel = (p) => resolve(p).replace(APP + '/', '')

// 날짜가 안 붙은 «상시» 문서 — 규칙·일하는 방식이라 낡는 개념이 아니다.
// ⛔ 여기에 «날짜 붙은» 문서를 넣지 말 것. 그 순간 이 목록이 낡기 시작한다.
const 상시 = [
  ['CLAUDE.md', '작업 규칙·고정 메모 — ⚠️핀이 길다. 「현재 버전」 줄과 «지금 하는 일»에 걸리는 핀만'],
  ['docs/창업자-니즈-일하는방식.md', '창업자와 일하는 방식·미감 기준'],
  ['docs/스티커-검수-절대원칙.md', '자산을 앱에 넣기 전 5가지'],
]

console.log('👋 `/안녕` — **이 순서로 읽는다. 위가 아래를 이긴다.**\n')

// ── ① 어제~오늘 ──────────────────────────────────────────
// ⚠️ `recentDocs()` 는 2026-08-13 에 고친 값을 쓴다 — 그 전엔 git 이 한글 경로를
//    이스케이프해서 **한글 이름 문서를 통째로 못 봤다**(28개 중 2개만 봤다).
// 🗄 **보관소는 「읽을 것」이 아니다** (2026-08-13)
//   📮 창업자 *"이거 저장소로 옮기면 «또 여기가서 읽고 오는거 아냐?»"* — **맞는 걱정이었다.**
//      CLAUDE.md 에서 덜어낸 옛 버전 기록이 «오늘 손댄 문서»라 이 목록 맨 위에 올라왔다.
//      **자리만 옮기고 위험은 그대로**였던 것이다 — 브리핑이 옛 판부터 읽게 된다.
//   ⭐ 경로 이름(`_archive` …)으로 거르지 않는다 — **새 보관소가 생길 때마다 여기를 고쳐야 하고, 반드시 낡는다.**
//      대신 **문서가 스스로 「🗄 보관소」라고 말하게** 하고 그 표시를 읽는다. 붙이는 쪽이 아는 게 맞다.
//   ⚠️ 앞 40줄만 본다 — 본문 «중간»에 그 낱말이 나온다고 보관소는 아니다.
//   ⛔⛔ **`try/catch` 로 감싸지 않는다** — 첫 판이 `readFileSync` 를 import 안 하고 썼는데
//      catch 가 그 오류를 삼켜 «조용히 통과»시켰다. 규칙 12(옛 값으로 돌려보기)가 아니었으면
//      「고쳤다」고 말할 뻔했다. 없는 파일만 건너뛰고, 나머지 오류는 «죽어서» 드러나게 둔다.
const 보관소 = (f) =>
  existsSync(f) && /🗄\s*\*\*보관소/.test(readFileSync(f, 'utf8').split('\n').slice(0, 40).join('\n'))
const 요즘 = recentDocs(2)
  .filter((f) => !/_archive|_아껴둠|_구판/.test(f))
  .filter((f) => !보관소(f))
  .map((f) => ({ f, m: statSync(f).mtimeMs }))
  .sort((a, b) => b.m - a.m)

console.log('① **어제~오늘 손댄 문서** — 지난 세션이 «끝난 자리»다. 여기부터 읽는다.')
if (!요즘.length) console.log('   (없다 — 이틀 넘게 조용했다. ②부터 읽는다)')
for (const { f } of 요즘.slice(0, 8)) {
  const g = generations(f)
  const 현행 = g.length >= 2 ? `  ⭐현행 ${g[g.length - 1].line}줄부터` : ''
  console.log(`   · ${rel(f)}${현행}`)
}

// ── ② 주제별 최신 ────────────────────────────────────────
// ⚠️⚠️ **여기서 한 번 시끄러웠다** — 처음엔 주제 «전부»를 찍어 **57줄**이 나왔다.
//   7/17 문서까지 「최신」이라며 같이 오니 **「최근부터」라는 취지가 그대로 깨진다.**
//   ⭐ 그리고 시끄러우면 안 본다 — 우리가 게이트에서 이미 배운 것이다.
//   ✅ **최근 DAYS 일 안의 주제만** 줄로 찍고, 나머지는 «개수»만 알려 필요할 때 찾게 한다.
const DAYS = 14
const 문턱 = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10)
// ⭐ ②는 «읽을 목록»이 아니라 «찾아보는 표»다 — 지금 하는 일에 걸리는 것만 연다.
//   그래서 다 찍지 않고 최근 것만 보여준다(나머지는 개수로).
const 보일수 = 10
console.log(`\n② **주제별 «최신» 한 장** — 읽는 목록이 아니라 «찾는 표»다. 지금 하는 일에 걸리는 것만 연다`)
try {
  const out = execFileSync(process.execPath, [join(APP, 'scripts/latest-map.mjs')], { encoding: 'utf8', cwd: APP })
  const 줄 = out.split('\n')
  const 최근 = []
  let 옛주제 = 0
  for (let i = 0; i < 줄.length; i++) {
    const t = 줄[i]
    if (!/^\S/.test(t) || !줄[i + 1]?.includes('✅ 최신')) continue
    const m = 줄[i + 1].match(/✅ 최신\s+(\S+)\s+(.+)$/)
    if (!m) continue
    if (m[1] < 문턱) { 옛주제++; continue }
    최근.push({ date: m[1], path: m[2].trim(), topic: t.trim() })
  }
  최근.sort((a, b) => (a.date < b.date ? 1 : -1))
  최근.slice(0, 보일수).forEach((r) => console.log(`   · ${r.path}   〔${r.topic}〕`))
  const 남 = 최근.length - 보일수 + 옛주제
  if (남 > 0) console.log(`   … ＋ 주제 ${남}개 더 — **필요할 때만** \`node scripts/latest-map.mjs\` 로 찾는다`)
} catch { console.log('   ⚠️ latest-map 을 못 돌렸다 — `node scripts/latest-map.mjs` 로 직접 볼 것') }

// ── ③ 상시 문서 ──────────────────────────────────────────
console.log('\n③ **날짜 없는 상시 문서** — 규칙이라 늘 유효하다')
for (const [p, why] of 상시) if (existsSync(join(APP, p))) console.log(`   · ${p}  — ${why}`)

// ── 세지 말 것 ───────────────────────────────────────────
console.log(`
④ **숫자는 «읽지 말고 돌려서» 얻는다** — 문서에 적힌 개수는 반드시 낡는다
   · \`npm run assets\`                      자산·서랍·정원 현황
   · \`node scripts/release-calendar.mjs --brief\`  다음에 «저절로» 열리는 것
   · \`node scripts/doc-guard.mjs --gen <문서>\`    그 문서의 현행 세대 줄번호`)

console.log(`
⛔⛔ **이 목록에 «없는» 날짜 문서는 브리핑 근거로 쓰지 않는다.**
   옛 판을 굳이 인용해야 하면 **「옛 판이다」라고 밝히고** 쓴다.
   📌 창업자 2026-08-13 *"예전문서 읽어와서 짬뽕만들고있어"* — 그게 이 규칙이 생긴 이유다.`)
