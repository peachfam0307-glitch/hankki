// 📋 «규칙은 다 만들어놨는데 왜 안 지켜져?» — 규칙마다 «장치가 있나»를 본다.
//
// ⭐⭐ 왜 (창업자 2026-08-18 *"규칙 다 만들어놓고 안지키고 그러거든"*)
//   창업자 원문(2026-07-31) = *"규칙만 만들면 뭐해 안지키는데"*
//   📌 그 말이 맞다 — **규칙은 부탁이고, 장치는 강제다.** 그런데 지금은
//      「어느 규칙에 장치가 있고 어느 규칙이 맨몸인지」를 아무도 모른다.
//
// 🔢 2026-08-18 실측 = 절대원칙 **31개** 중 ⚠️맨몸 **17** · 장치 있음 14. 센 적이 없던 숫자다.
//
// ⛔⛔ **그리고 만들자마자 내 짐작이 틀린 게 드러났다** — 주석에 *"그날 깨진 둘(규칙 29·17)이 맨몸이었다"*
//    라고 썼는데, 돌려보니 **둘 다 장치가 «있다»**(29→`recipe.mjs` · 17→`decided.mjs`).
//    ⭐⭐ 그래서 진짜 갈래가 드러났다 — **「맨몸이냐」가 아니라 「저절로 도느냐」다:**
//        🚦배포막음·🪝훅 = 내가 안 불러도 «저절로» 막는다  → 그날 하나도 안 깨졌다
//        🔧도구        = 내가 «불러야만» 돈다             → **그날 깨진 게 전부 여기였다**
//    📌 규칙 17·29 는 도구가 있는데도 깨졌다. 내가 `decided.mjs` 를 안 돌렸거나(29),
//       돌리고도 **230줄 중 앞 10줄만 보고** 넘어갔다(17). 도구는 «부를 때만» 돈다.
//    ✅ 그러니 고칠 자리 = ⚠️맨몸 17개 **＋** 🔧불러야 도는 4개. 뒤쪽이 더 위험하다 —
//       **「장치가 있다」고 적혀 있어 안심하게 되기 때문이다.**
//
// ⭐ 판정 방법 — 규칙 글에 적힌 «도구 이름»을 그대로 읽는다(손으로 안 적는다).
//   `check-kst.mjs` 처럼 파일명이 적혀 있고 그 파일이 실제로 있으면 「장치 있음」,
//   smoke 체인에도 있으면 「배포를 막는다」.
//   ⛔ 그러니 규칙에 도구 이름을 안 적으면 여기서 «맨몸»으로 뜬다. 그게 맞다 — 실제로 맨몸이니까.
//
// 쓰기
//   node hankki/scripts/rules.mjs           전부 (장치 있는 것 / 맨몸)
//   node hankki/scripts/rules.mjs --bare    ⚠️맨몸 규칙만 — **여기가 다음에 깨질 자리다**
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const MD = join(APP, 'CLAUDE.md')
let SMOKE = ''
try { SMOKE = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')).scripts?.smoke || '' } catch { /* 표시만 못 한다 */ }
const HAVE = new Set(readdirSync(join(APP, 'scripts')).filter((f) => /\.(mjs|js)$/.test(f)))
let HOOKS = []
try { HOOKS = readdirSync(join(APP, '..', '.claude', 'hooks')) } catch { /* 훅 폴더가 없으면 넘어간다 */ }

const lines = readFileSync(MD, 'utf8').split('\n')

// ── 규칙 = 「숫자. **…**」 로 시작하는 줄. 다음 규칙 머리까지가 그 규칙의 «몸»이다 ──
const HEAD = /^(\d+)\.\s+\*\*(.+?)\*\*/
const rules = []
lines.forEach((ln, i) => {
  const m = ln.match(HEAD)
  if (!m) return
  rules.push({ no: +m[1], title: m[2].replace(/\s+/g, ' ').trim(), at: i + 1, body: '' })
})
rules.forEach((r, k) => {
  // ⛔ 마지막 규칙엔 «다음 머리»가 없다. 첫 판은 +60 줄로 잘랐는데 그건 근거 없는 값이라
  //    그보다 긴 규칙이면 도구를 놓쳐 «맨몸»으로 잘못 뜬다 → 파일 끝까지 본다(2026-08-18 재검수).
  const end = k + 1 < rules.length ? rules[k + 1].at - 1 : lines.length
  r.body = lines.slice(r.at - 1, end).join('\n')
})

// ── 그 규칙 글이 «가리키는» 도구 ──
const TOOL = /([A-Za-z0-9_가-힣-]+\.(?:mjs|js|sh|py))/g
for (const r of rules) {
  const named = [...new Set([...r.body.matchAll(TOOL)].map((m) => m[1]))]
  r.tools = named.filter((t) => HAVE.has(t) || HOOKS.includes(t))
  r.gate = r.tools.filter((t) => SMOKE.includes(t))
  r.hook = r.tools.filter((t) => HOOKS.includes(t))
}

// ══════════════════════════════════════════════════════════════════
// 🪤 --patterns : 반복 실수 «패턴»(docs/실수-패턴)에 장치가 있나 — 규칙과 «다른 축»이다
//   ⭐ 왜 (창업자 2026-08-18 *"쟤가 매번 놓치고 실수하는 포인트들 검사해서 도구 만들어줘"*)
//   ⛔ 그 말을 듣고 곧장 「JSX 주석 게이트를 만들자」고 했는데 — **이미 있었고 잘 잡고 있었다.**
//      그날 «네 번째»로 「이미 있는 걸 만들 뻔한」 것이다.
//   📌 그래서 짐작을 버리고 **패턴 여덟을 기계로 대조**한다. 빈 자리는 «세어서» 안다.
if (process.argv.includes('--patterns')) {
  const PDOC = join(APP, 'docs', '실수-패턴-2026-08-07.md')
  let ptxt = ''
  try { ptxt = readFileSync(PDOC, 'utf8') } catch {
    console.error(`\n⛔ ${PDOC} 를 못 읽었다 — 패턴 문서가 옮겨졌나 확인할 것.\n`); process.exit(1)
  }
  const pl = ptxt.split('\n')
  const pats = []
  pl.forEach((ln, i) => {
    const m = ln.match(/^##\s+(\S+)\s+패턴\s+([A-Z])\s+—\s+(.+)$/)
    if (m) pats.push({ tag: m[1], id: m[2], title: m[3].replace(/\s*⭐.*$/, '').trim(), at: i + 1 })
  })
  pats.forEach((p, k) => {
    const end = k + 1 < pats.length ? pats[k + 1].at - 1 : pl.length
    const body = pl.slice(p.at - 1, end)
    p.block = body.join('\n')
    p.guard = (body.find((l) => l.includes('지금 막는 것')) || '').replace(/^.*지금 막는 것\*{0,2}\s*—?\s*/, '').trim()
    p.hole = (body.find((l) => l.includes('**구멍**')) || '').replace(/^.*\*\*구멍\*\*\s*—?\s*/, '').trim()
    const named = [...new Set([...p.block.matchAll(/([A-Za-z0-9_가-힣-]+\.(?:mjs|js|sh|py))/g)].map((m) => m[1]))]
    p.tools = named.filter((t) => HAVE.has(t) || HOOKS.includes(t))
    p.gate = p.tools.filter((t) => SMOKE.includes(t))
    // 「npm run 실수」처럼 «명령»으로만 적힌 것도 장치다 — package.json 을 뒤져 실체를 찾는다
    // ⛔ `(\S+)` 로 잡으면 감싼 백틱까지 낱말에 붙어 scripts['실수`'] 를 찾다 «거짓 맨몸»이 된다
    //    (2026-08-18 재검수에서 잡음 — 🅶 가 잘 막히는데 맨몸으로 떴다)
    if (!p.tools.length && /npm run ([가-힣A-Za-z0-9_-]+)/.test(p.block)) {
      const n = p.block.match(/npm run ([가-힣A-Za-z0-9_-]+)/)[1]
      try {
        const s = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')).scripts?.[n] || ''
        const t = [...s.matchAll(/scripts\/([A-Za-z0-9_가-힣-]+\.m?js)/g)].map((m) => m[1])
        p.tools = t; p.gate = t.filter((x) => SMOKE.includes(x))
      } catch { /* 없으면 맨몸으로 둔다 */ }
    }
  })
  console.log(`\n🪤 반복 실수 패턴 ${pats.length}개 — 장치가 «저절로» 도나\n`)
  for (const p of pats) {
    const mark = p.gate.length ? '🚦배포막음' : p.tools.length ? '🔧불러야함' : '⚠️맨몸  '
    console.log(`  ${p.tag} ${p.id}  ${mark}  ${p.title}`)
    if (p.tools.length) console.log(`        ${p.tools.slice(0, 3).join(' · ')}`)
    if (p.hole) console.log(`        🕳 ${p.hole.replace(/[*_]/g, '').slice(0, 88)}`)
  }
  const g = pats.filter((p) => p.gate.length).length
  const c = pats.filter((p) => !p.gate.length && p.tools.length).length
  const b = pats.length - g - c
  console.log(`
  🔢 🚦저절로 ${g}  ·  🔧불러야 ${c}  ·  ⚠️맨몸 ${b}

  ⛔ **「구멍」은 문서가 «이미» 적어둔 것이다** — 새로 지어내지 말 것.
  ⭐ 도구를 만들기 «전»에 반드시: node hankki/scripts/tools.mjs "<핵심어>"
     📌 2026-08-18 에 「JSX 주석 게이트를 만들자」고 했는데 **이미 있었고 잘 잡고 있었다**(네 번째 헛돎).
`)
  process.exit(0)
}

const bareOnly = process.argv.includes('--bare')
const bare = rules.filter((r) => !r.tools.length)
const armed = rules.filter((r) => r.tools.length)

const short = (s) => s.replace(/^[^가-힣A-Za-z]*/, '').replace(/\s*\(창업자.*$/, '').slice(0, 58)

if (!bareOnly) {
  console.log(`\n📋 절대원칙 ${rules.length}개 — 장치가 있는 것 ${armed.length} · ⚠️맨몸 ${bare.length}\n`)
  console.log(`  ── ✅ 장치가 지키는 규칙 ${armed.length}개`)
  for (const r of armed.sort((a, b) => a.no - b.no)) {
    const mark = r.gate.length ? '🚦배포막음' : r.hook.length ? '🪝훅' : '🔧도구'
    console.log(`  ${String(r.no).padStart(2)} ${short(r.title)}`)
    console.log(`        ${mark}  ${r.tools.slice(0, 3).join(' · ')}`)
  }
  console.log('')
}

console.log(`  ── ⚠️ 맨몸 규칙 ${bare.length}개 — **여기가 다음에 깨질 자리다**`)
for (const r of bare.sort((a, b) => a.no - b.no)) {
  console.log(`  ${String(r.no).padStart(2)} ${short(r.title)}   (CLAUDE.md:${r.at})`)
}

const auto = armed.filter((r) => r.gate.length || r.hook.length).length
const call = armed.length - auto
console.log(`
  🚦 = smoke 체인(깨지면 배포가 막힌다) · 🪝 = 훅(그 자리에서 막는다) · 🔧 = 도구는 있으나 «부를 때만» 돈다

  🔢 저절로 도는 것 ${auto}개  ·  🔧불러야 도는 것 ${call}개  ·  ⚠️맨몸 ${bare.length}개

  ⛔⛔ **위험한 건 맨몸(${bare.length})만이 아니다 — 🔧불러야 도는 ${call}개가 «더» 위험하다.**
     「장치가 있다」고 적혀 있어 **안심하게 되기 때문**이다.
     📌 2026-08-18 에 깨진 둘(규칙 29 말하기 전 확인 · 규칙 17 「없다」는 돌린 뒤에만)이
        **바로 그 칸**이었다 — 도구는 있었고, 내가 안 돌렸거나 결과를 끝까지 안 봤다.

  ✅ 고치는 법 = ⓐ🚦나 🪝로 «저절로» 돌게 올린다  ⓑ못 하면 한 줄 명령으로 «부르기 쉽게»
     ⛔ 규칙 글을 더 크게 쓰는 것은 고치는 게 아니다 — 그날 그 규칙들은 이미 «절대원칙»이었다.
`)
