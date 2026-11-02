// 🗓 날짜 흔들기 — 운영 1단계 「스모크 시계 한 곳」 ＋ 「흔들리는 판 표시」 (2026-11-02)
//   날짜를 쓰는 재현판을 «위험한 날짜들»로 돌려, 오늘은 초록인데 그날엔 죽는 판을 «미리» 찾는다.
//   대상은 손으로 안 적는다 — `new Date()`·`Date.now()` 를 쓰는 _repro 판 중 스모크에 든 것 = 대상.
//   쓰는 법: SMOKE_CHROMIUM=… node scripts/날짜흔들기.mjs [--날 2026-01-31T23:30:00+09:00] [--판 <이름조각>]
//   결과: 날짜 탓으로 죽는 판(오늘은 통과 · 그날은 실패)이 있으면 exit 1
import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const 인자 = process.argv.slice(2), 값 = (k) => { const i = 인자.indexOf(k); return i < 0 ? null : 인자[i + 1] }
const 위험날 = 값('--날') ? [값('--날')] : [
  '2026-01-31T23:30:00+09:00',   // 달 끝 · 밤
  '2026-03-01T00:10:00+09:00',   // 달 첫날 · 자정 직후(2월 다음)
  '2026-12-31T23:50:00+09:00',   // 해 끝
  '2027-01-01T08:30:00+09:00',   // 새해 첫날 · KST 오전(UTC 는 전날)
]
const 스모크 = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
const 판들 = readdirSync(new URL('.', import.meta.url)).filter((f) => /^_repro-.*\.mjs$/.test(f))
  .filter((f) => 스모크.includes(`scripts/${f}`))
  .filter((f) => /new Date\(\)|Date\.now\(\)/.test(readFileSync(new URL(f, import.meta.url), 'utf8')))
  .filter((f) => !값('--판') || f.includes(값('--판')))
const 돌림 = (f, 날) => spawnSync('node', ['--import', './scripts/시험시계.mjs', `scripts/${f}`], {
  cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, HANKKI_NOW: 날 || '' }, encoding: 'utf8', timeout: 240000,
}).status
console.log(`🗓 대상 ${판들.length}판 × 날짜 ${위험날.length}개`)
const 흔들 = []
for (const f of 판들) {
  const 오늘 = 돌림(f, '')
  if (오늘 !== 0) { console.log(`⚪ ${f} — 오늘부터 실패(exit ${오늘}) · 날짜 탓 아님 · 따로 본다`); continue }
  const 죽은날 = 위험날.filter((d) => 돌림(f, d) !== 0)
  if (죽은날.length) { 흔들.push([f, 죽은날]); console.log(`🔴 ${f} — 죽는 날: ${죽은날.join(' · ')}`) } else console.log(`✅ ${f}`)
}
console.log(흔들.length ? `\n⛔ 날짜 탓으로 죽는 판 ${흔들.length}개 — 그날이 오면 배포가 막힌다` : '\n✅ 날짜 탓으로 죽는 판 없음')
process.exit(흔들.length ? 1 : 0)
