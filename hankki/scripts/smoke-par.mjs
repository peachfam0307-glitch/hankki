/**
 * ⚡ 스모크를 «동시에» 돌린다 (2026-08-27)
 *
 * 📮 창업자 = *"스모크시간을 더 줄일수있어?"* → *"병렬로 바꿔줘"*
 *
 * ⭐⭐ **검사를 하나도 안 뺀다 — 「실행 방식」만 바꾼다.**
 *    `_probe-스모크시간-0827` 실측 = 브라우저 띄우는 재현판 26개가 **시간의 95%**(220초)를 먹고
 *    정적 검사 63개는 12초(5%)다. **패턴이 하나** — 재현판마다 크로미움을 «새로» 띄운다.
 *    26번 띄우는 게 시간의 전부고 검사 «로직»은 거의 안 걸린다.
 *    👉 그래서 답이 「검사를 빼자」가 아니라 **「동시에 돌리자」**다.
 *
 * ⛔⛔ **목록을 여기에 손으로 적지 않는다** — `package.json` 의 `smoke:seq` 를 «읽어서» 만든다.
 *    📌 손으로 적으면 반드시 낡는다(CLAUDE.md 절대원칙 22 · 「목록을 사람이 관리하면 낡는다」).
 *    검사를 새로 만들면 `smoke:seq` 에만 이어 붙이면 여기도 저절로 따라온다.
 *
 * 🔙 **되돌리기 = `package.json` 한 줄** — `"smoke"` 를 `"smoke:seq"` 내용으로 되돌리면 끝.
 *
 * 쓰기: node scripts/smoke-par.mjs          (동시 실행 수 = CPU 기준 자동)
 *       SMOKE_JOBS=2 node scripts/smoke-par.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/* ─────────────────────────────────────────────────────────────
   ① 선행 관문 — dist 신선도
   ⛔ `smoke.mjs` 가 체인 «끝»에 있어서, 병렬로 돌리면 이 검사가 «맨 나중»에 걸린다.
      그동안 브라우저 26개가 «옛 화면»을 보고 헛돈다(2026-08-04 사고와 같은 뿌리).
      그래서 잣대를 그대로 가져와 **맨 앞에서** 본다.
   ───────────────────────────────────────────────────────────── */
function newestMtime(dir) {
  let t = 0
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith('.')) continue
    const p = path.join(dir, f.name)
    t = Math.max(t, f.isDirectory() ? newestMtime(p) : statSync(p).mtimeMs)
  }
  return t
}
{
  const idx = path.join(ROOT, 'dist/index.html')
  if (!existsSync(idx)) {
    console.error('\n⛔ `dist/` 가 없다 — 스모크는 빌드 결과를 띄운다. 먼저 `npm run build`.\n')
    process.exit(1)
  }
  const 낡음 = newestMtime(path.join(ROOT, 'src')) - statSync(idx).mtimeMs
  if (낡음 > 0) {
    console.error(`\n⛔⛔ **dist 가 src 보다 ${Math.round(낡음 / 60000)}분 낡았다 — 지금 스모크는 «옛 화면»을 보고 있다.**`)
    console.error('   👉 `npm run build` 를 «exit code 0» 으로 통과시킨 뒤 다시 돌릴 것.\n')
    process.exit(1)
  }
}

/* ─────────────────────────────────────────────────────────────
   ② 순차 체인을 읽어 단계 목록을 만든다
   ───────────────────────────────────────────────────────────── */
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const 체인 = pkg.scripts['smoke:seq']
if (!체인) {
  console.error('⛔ `package.json` 에 `smoke:seq` 가 없다 — 이 러너는 그걸 읽어서 목록을 만든다.')
  process.exit(1)
}

const 단계 = []
for (const 조각 of 체인.split('&&')) {
  const 낱말 = 조각.replace(/>\s*\/dev\/null/g, '').trim().split(/\s+/).filter(Boolean)
  if (!낱말.length) continue
  const [실행, ...인자] = 낱말
  if (실행 !== 'node' && 실행 !== 'bash') {
    console.error(`⛔ 어떻게 돌리는지 모르는 단계: ${조각.trim()}`)
    process.exit(1)
  }
  단계.push({ 실행, 인자, 이름: (인자[0] || '').replace(/^.*\//, '') })
}

/* ─────────────────────────────────────────────────────────────
   ③ 순서 — 무거운 것부터 · 파일 쓰는 것은 단독으로
   ───────────────────────────────────────────────────────────── */

// ⛔ **`asset-map` 만 단독으로 돌린다** — `docs/자산현황-자동집계.md` 를 «쓴다».
//    `writeFileSync` 는 원자적이 아니라(자르고 → 쓴다) 그 찰나에 docs 를 훑는 검사가
//    반쯤 빈 파일을 읽을 수 있다. 나머지 쓰기 단계는 각자 다른 폴더라 안 겹친다(실측).
//
// ⏱ **[2026-09-02 추가] `_repro-11월카드-0902.mjs` 는 «너무 무거워서» 단독으로 돌린다.**
//    🔢 혼자 = 79~257초인데 **다른 129개와 같이 돌면 480초를 넘겨** 상한에 걸려 죽었다(2~6배).
//       뽑기를 128번 하며 매번 카드를 통째로 다시 그린다 — 이 판 하나가 스모크에서 제일 무겁다.
//    ⭐ 단독으로 빼면 «전체 시간은 거의 그대로»다 — 어차피 이 판이 끝날 때까지 다들 기다리고 있었다.
//    ⛔ 「상한을 더 늘리자」로 가지 않는다 — 그건 멈춘 판을 못 잡게 만든다.
const 단독 = new Set(['asset-map.mjs', '_repro-11월카드-0902.mjs'])

// ⭐ **「무겁다」를 파일 «내용»으로 판정한다 — 목록을 안 적으니 안 낡는다.**
//    크로미움을 띄우거나 서버를 세우는 판이 오래 걸린다(실측 상위 10개가 전부 그것).
//    긴 것을 먼저 던져야 마지막에 혼자 남는 시간이 줄어든다(LPT).
function 무거운가(s) {
  try {
    const 글 = readFileSync(path.resolve(ROOT, s.인자[0]), 'utf8')
    return /chromium|playwright|createServer|vite['" ]*,?\s*['"]preview/.test(글)
  } catch { return false }
}

const 큐 = 단계.filter((s) => !단독.has(s.이름))
큐.sort((a, b) => Number(무거운가(b)) - Number(무거운가(a)))
const 뒤에 = 단계.filter((s) => 단독.has(s.이름))

/* ─────────────────────────────────────────────────────────────
   ④ 돌린다
   ⭐ 첫 실패에서 «멈추지 않는다» — 어느 것이 죽었는지 «전부» 나와야 한 번에 고친다.
   ───────────────────────────────────────────────────────────── */
const JOBS = Math.max(1, Number(process.env.SMOKE_JOBS) || Math.min(availableParallelism(), 4))
const TTY = process.stdout.isTTY
const 결과 = []
let 끝난수 = 0

console.log(`⚡ 스모크 ${단계.length}개 · 동시 ${JOBS}개 (무거운 것 ${큐.filter(무거운가).length} 먼저 · 단독 ${뒤에.length})\n`)
const t0 = Date.now()

// ⏱⏱ **[2026-09-02] 한 단계에 주는 시간 = 300초 → 480초. ⭐느린 단계는 «따로 이름을 부른다».**
//   ⛔ 300초에 걸려 죽은 게 **진짜 고장이 아니라 「이 기계가 느린 날」이었다.**
//      같은 판(`_repro-11월카드-0902`)을 혼자 돌린 실측 = **79 · 128 · 151 · 158 · 192 · 257초**.
//      한 일은 똑같은데 «세 배»가 흔들린다(공용 CPU) → 300초는 그 흔들림 «안»에 있었다.
//      그래서 코드가 멀쩡한 날에도 빨간불이 떴고, **빨간불이 진짜인지 아닌지를 알 수 없게 됐다.**
//   ⭐ 상한이 있는 «이유»는 「멈춘 판을 잡는 것」이다 — 480초로도 그건 그대로 잡는다.
//      ⛔ 상한을 늘려도 스모크는 «안» 느려진다. 빨리 끝나는 단계는 그대로 빨리 끝난다.
//   ⛔ 대신 **느려지는 걸 방치하지 않는다** — 180초를 넘으면 아래 보고에서 이름을 불러 준다.
const 한단계상한 = Number(process.env.SMOKE_STEP_MS) || 480000
const 느림기준초 = 180

function 하나(s) {
  return new Promise((resolve) => {
    const t = Date.now()
    const p = spawn(s.실행, s.인자, { cwd: ROOT, timeout: 한단계상한 })
    let out = ''
    p.stdout.on('data', (d) => { out += d })
    p.stderr.on('data', (d) => { out += d })
    p.on('close', (code, signal) => {
      const r = { ...s, 초: (Date.now() - t) / 1000, code, signal, out }
      결과.push(r)
      끝난수++
      const 표 = code === 0 ? '✅' : '⛔'
      const 줄 = `  ${표} ${String(끝난수).padStart(2)}/${단계.length}  ${s.이름.slice(0, 34).padEnd(34)} ${r.초.toFixed(1)}초`
      if (TTY && code === 0) process.stdout.write(`\r${줄}   `)
      else console.log(줄)
      resolve(r)
    })
  })
}

async function 무리(목록, 동시) {
  let i = 0
  const 일꾼 = Array.from({ length: Math.min(동시, 목록.length) }, async () => {
    while (i < 목록.length) await 하나(목록[i++])
  })
  await Promise.all(일꾼)
}

await 무리(큐, JOBS)
await 무리(뒤에, 1)
if (TTY) process.stdout.write('\n')

/* ─────────────────────────────────────────────────────────────
   ⑤ 보고
   ───────────────────────────────────────────────────────────── */
const 총초 = (Date.now() - t0) / 1000
const 죽음 = 결과.filter((r) => r.code !== 0)
const 합 = 결과.reduce((s, r) => s + r.초, 0)

// ⛔ **「합 ÷ 총초」를 «몇 배 빨라졌다»로 말하지 않는다.**
//    그 합은 «동시에 돌면서 서로 CPU 를 뺏어 느려진» 시간을 더한 값이라 **부풀려져 있다**
//    (2026-08-27 1회차 = 총 138초인데 합은 528초. 진짜 순차 기준은 `_probe-스모크시간-0827` 실측 **449초**).
//    📌 재고 싶으면 `npm run smoke:seq` 를 «따로» 돌려서 잰다.
console.log(`\n⏱ ${총초.toFixed(0)}초  (단계 시간 합 ${합.toFixed(0)}초 — 동시에 도느라 각자 느려진 값이라 «순차 시간»이 아니다)`)

// 🐢 **느린 단계는 이름을 부른다** — 상한을 늘렸으니 이게 없으면 조용히 계속 느려진다.
//    ⛔ 「막는다」가 아니라 「보인다」다. 느린 게 죄는 아니고, **모르는 게 죄다.**
const 느린것 = 결과.filter((r) => r.초 >= 느림기준초).sort((a, b) => b.초 - a.초)
if (느린것.length) {
  console.log(`🐢 ${느림기준초}초를 넘긴 단계 ${느린것.length}개 — 상한 ${(한단계상한 / 1000).toFixed(0)}초에 가까워지면 고쳐야 한다`)
  느린것.slice(0, 5).forEach((r) => console.log(`   · ${r.이름.padEnd(34)} ${r.초.toFixed(1)}초`))
}

if (!죽음.length) {
  console.log(`✅ ${결과.length}/${결과.length} 통과\n`)
  process.exit(0)
}

console.log(`\n⛔⛔ ${죽음.length}개 실패 — ${죽음.map((r) => r.이름).join(', ')}\n`)
for (const r of 죽음) {
  console.log(`${'─'.repeat(60)}\n⛔ ${r.이름}  (exit ${r.code}${r.signal ? ` · ${r.signal}` : ''} · ${r.초.toFixed(1)}초)`)
  console.log(`   다시 돌리기 = ${r.실행} ${r.인자.join(' ')}\n`)
  console.log(r.out.trimEnd().split('\n').slice(-40).join('\n'))
}
console.log()
process.exit(1)
