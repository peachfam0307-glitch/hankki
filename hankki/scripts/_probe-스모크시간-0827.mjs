/**
 * ⏱ 스모크 88개를 «하나씩» 재서 어디가 느린지 찾는다 (2026-08-27)
 *
 * 📮 창업자 = *"스모크시간을 더 줄일수있어?"*
 *    ⭐ sparse-checkout 으로 checkout 이 2,690초 → 61초가 되자
 *       이제 **스모크(449초)가 배포 시간의 77%** 다.
 *
 * ⛔ 짐작으로 「Playwright 가 느리겠지」 하지 않는다 — **재서 답한다.**
 *    ⚠️ 여기서 잰 값은 «순차 실행» 기준이다. CI 와 머신이 달라 절대값은 다르지만
 *       **어느 것이 오래 걸리나(순위)** 는 그대로 쓸 수 있다.
 *
 * 🔢 2026-08-27 실측 (89개 전수)
 *    브라우저 띄우는 재현판 ~26개 → 약 220초 (**95%**)
 *    정적 검사(파일 읽기) ~63개 → 약 12초 (5%) · 그중 47개는 0.2초 «미만»
 *    느린 톱10 = 감정컷 20.7 · 캡처흐름 17.7 · 원문저장 16.5 · 일기잠금 16.1 · 장수안내 15.1
 *               링크정직 13.0 · 표지사진 12.6 · 백업실패 11.8 · 열쇠이름 11.1 · 메모지핀치 10.7
 *    ⭐ 패턴이 하나다 — **재현판마다 크로미움을 새로 띄운다.** 26번 띄우는 게 시간의 전부고
 *       검사 «로직» 자체는 거의 안 걸린다.
 *    👉 그래서 답은 「검사를 빼자」가 아니라 **「동시에 돌리자」**다.
 *
 * 쓰기: node scripts/_probe-스모크시간-0827.mjs
 *       node scripts/_probe-스모크시간-0827.mjs --상위 15
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const 체인 = pkg.scripts.smoke

// `node scripts/x.mjs`·`bash ../.claude/hooks/y.sh` 를 순서대로 뽑는다
const 단계 = []
for (const m of 체인.matchAll(/(node|bash)\s+([^\s&|>]+)([^&|>]*)/g)) {
  const 길 = m[2].trim()
  if (!/\.(mjs|sh)$/.test(길)) continue
  단계.push({ 실행: m[1], 길, 인자: m[3].trim().split(/\s+/).filter((x) => x && !x.startsWith('>')) })
}

console.log(`⏱ 스모크 ${단계.length}개를 하나씩 잰다 — 몇 분 걸린다\n`)
const 결과 = []
for (const [i, s] of 단계.entries()) {
  const t0 = process.hrtime.bigint()
  const r = spawnSync(s.실행, [s.길, ...s.인자], { stdio: 'ignore', timeout: 300000 })
  const 초 = Number(process.hrtime.bigint() - t0) / 1e9
  결과.push({ 이름: s.길.replace(/^.*\//, ''), 초, code: r.status })
  process.stdout.write(`\r  ${i + 1}/${단계.length}  ${s.길.replace(/^.*\//, '').slice(0, 34).padEnd(34)} ${초.toFixed(1)}초   `)
}
console.log('\n')

결과.sort((a, b) => b.초 - a.초)
const 합 = 결과.reduce((s, x) => s + x.초, 0)
const N = Number(process.argv[process.argv.indexOf('--상위') + 1]) || 15

console.log(`총 ${합.toFixed(0)}초 · 느린 순 ${N}개\n`)
console.log(`${'검사'.padEnd(38)} ${'초'.padStart(7)} ${'비중'.padStart(6)}  누적`)
let 누적 = 0
for (const r of 결과.slice(0, N)) {
  누적 += r.초
  const bar = '█'.repeat(Math.round((r.초 / 결과[0].초) * 18))
  console.log(`${r.이름.slice(0, 38).padEnd(38)} ${r.초.toFixed(1).padStart(7)} ${((r.초 / 합) * 100).toFixed(1).padStart(5)}% ${((누적 / 합) * 100).toFixed(0).padStart(4)}%  ${bar}`)
}
const 나머지 = 결과.slice(N)
console.log(`\n나머지 ${나머지.length}개 = ${나머지.reduce((s, x) => s + x.초, 0).toFixed(0)}초`)
console.log(`⛔ 실패(0 아님) : ${결과.filter((r) => r.code !== 0).map((r) => r.이름).join(', ') || '없다'}`)
