// 🗓 날짜 흔들기 — 운영 1단계 「스모크 시계 한 곳」 ＋ 「흔들리는 판 표시」 (2026-11-02)
//   날짜를 쓰는 재현판을 «위험한 날짜들»로 돌려, 오늘은 초록인데 그날엔 죽는 판을 «미리» 찾는다.
//   대상은 손으로 안 적는다 — `new Date()`·`Date.now()` 를 쓰는 _repro 판 중 스모크에 든 것 = 대상.
//   쓰는 법: SMOKE_CHROMIUM=… node scripts/날짜흔들기.mjs [--날 2026-01-31T23:30:00+09:00] [--판 <이름조각>]
//   결과: 날짜 탓으로 죽는 판(오늘은 통과 · 그날은 실패)이 있으면 exit 1
import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const 인자 = process.argv.slice(2), 값 = (k) => { const i = 인자.indexOf(k); return i < 0 ? null : 인자[i + 1] }
// ⚠️ 위험한 날은 «앞으로 올» 날만 — 지난 날로 돌리면 이미 열린 레시피·카드가 «아직 안 열린» 것이 돼서
//    날짜 탓이 아닌데 다 죽는다(2026-11-02 실측: 1월·3월로 돌리니 멀쩡한 판까지 전부 빨강).
//    그래서 «오늘(KST)» 기준으로 다가오는 달 끝·달 첫날·해 끝·새해를 그때그때 만든다.
const { todayKST } = await import('../src/today.js')
const [Y, M] = todayKST().split('-').map(Number)
const 두자리 = (n) => String(n).padStart(2, '0')
const 말일 = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()   // m = 1~12
const 다음달 = M === 12 ? [Y + 1, 1] : [Y, M + 1]
const 위험날 = 값('--날') ? [값('--날')] : [
  `${Y}-${두자리(M)}-${말일(Y, M)}T23:30:00+09:00`,                 // 이번 달 끝 · 밤
  `${다음달[0]}-${두자리(다음달[1])}-01T00:10:00+09:00`,            // 다음 달 첫날 · 자정 직후
  `${Y}-12-31T23:50:00+09:00`,                                      // 해 끝
  `${Y + 1}-01-01T08:30:00+09:00`,                                  // 새해 첫날 · KST 오전(UTC 는 전날)
].filter((v, i, a) => a.indexOf(v) === i)
// 🚫 뺄 판 = «저장소의 실제 상태»(문서 날짜·git 이력)를 보는 판 — 시계만 옮기면 그 상태가 안 따라와서 «날짜 탓이 아닌데» 죽는다. ⛔이유 없이 넣지 말 것
const 제외 = {
  '_repro-문서다이어트-0903.mjs': 'hello-read 가 «최근 14일 문서»를 실제 파일 날짜로 고른다 — 가짜 11/30 엔 11/2 문서가 밀려나 표가 바뀐다(실측 2026-11-02)',
}
const 스모크 = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
const 판들 = readdirSync(new URL('.', import.meta.url)).filter((f) => /^_repro-.*\.mjs$/.test(f))
  .filter((f) => 스모크.includes(`scripts/${f}`))
  .filter((f) => /new Date\(\)|Date\.now\(\)/.test(readFileSync(new URL(f, import.meta.url), 'utf8')))
  .filter((f) => !값('--판') || f.includes(값('--판')))
  .filter((f) => !(f in 제외))
// ⚠️ 시계는 NODE_OPTIONS 로 심는다 — 재현판이 띄우는 «자식 node» 까지 같은 날이어야 한다(실측 문서다이어트: 자식만 진짜 오늘이라 어긋났다)
const 시계 = new URL('./시험시계.mjs', import.meta.url).href
const 돌림 = (f, 날) => spawnSync('node', [`scripts/${f}`], {
  cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, HANKKI_NOW: 날 || '', NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${시계}`.trim() }, encoding: 'utf8', timeout: 240000,
}).status
console.log(`🗓 대상 ${판들.length}판 × 날짜 ${위험날.length}개`)
const 흔들 = [], 흔들림 = []
for (const f of 판들) {
  const 오늘 = 돌림(f, '')
  // 🎲 흔들리는 판 표시 — 오늘 실패하면 한 번만 더 돌린다. 두 번째에 통과하면 «가끔 실패»(코드가 아니라 느림·순서 탓일 수 있다)
  //    ⛔ 「가끔」이라도 원인은 찾는다 — 표시는 «덮는» 게 아니라 «보이게» 하는 것이다
  if (오늘 !== 0) {
    const 다시 = 돌림(f, '')
    if (다시 === 0) { 흔들림.push(f); console.log(`🎲 ${f} — 가끔 실패(1번째 exit ${오늘} · 2번째 통과) · 원인 따로 본다`) }
    else console.log(`⚪ ${f} — 오늘부터 실패(두 번 다 exit ${다시}) · 날짜 탓 아님 · 따로 본다`)
    continue
  }
  const 죽은날 = 위험날.filter((d) => 돌림(f, d) !== 0)
  if (죽은날.length) { 흔들.push([f, 죽은날]); console.log(`🔴 ${f} — 죽는 날: ${죽은날.join(' · ')}`) } else console.log(`✅ ${f}`)
}
console.log(흔들.length ? `\n⛔ 날짜 탓으로 죽는 판 ${흔들.length}개 — 그날이 오면 배포가 막힌다` : '\n✅ 날짜 탓으로 죽는 판 없음')
if (흔들림.length) console.log(`🎲 가끔 실패하는 판 ${흔들림.length}개: ${흔들림.join(' · ')}`)
process.exit(흔들.length ? 1 : 0)
