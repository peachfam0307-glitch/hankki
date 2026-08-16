// ⏰⏰ 「오늘」이 한국 폰에서 맞나 — UTC 컨테이너에서만 재면 «영영 못 잡는» 버그 (2026-08-17)
//
// 📮 창업자 캡처(8/17 아침 8:01) = 홈에 **「이번 주 제철 = 깻잎」**(8/10 주차)이 떠 있었다.
//    8/17 주차 「여름 시원한 것」이 열렸어야 하는데 안 열렸다.
// 📮 그리고 = *"한국시간은 정확하게 고쳐. **반복되지않게. 절대원칙. 강제할수있게 만들어**"*
//
// ⛔⛔⛔ **뿌리 = `getTimezoneOffset()` 을 더한 것.**
//    옛 공식 = `Date.now() + (9*60 + new Date().getTimezoneOffset()) * 60000`
//      · UTC 컨테이너(offset 0)  → +540분 → ✅ 맞다
//      · **KST 폰(offset −540)  → +0분  → UTC 그대로 → ⛔ 0~9시엔 «어제»**
//    ⭐ `Date.now()` 는 이미 UTC 기준 숫자이고 `toISOString()` 도 UTC 로 찍는다 → **그냥 +9시간.**
//
// ⭐⭐ **왜 여태 안 들켰나** — 내 검사가 전부 UTC 컨테이너에서 돌아서 «항상 초록불»이었다.
//    그리고 한국에서도 **오후에 열면 멀쩡하다.** 창업자가 아침 8시에 봐서 걸렸다.
//    📌 규칙 18 ⓘ — 「통과했나」가 아니라 «무엇을 보고 통과했나».
//
// 🔒 **장치 둘로 강제한다**
//    ⑴ `check-kst.mjs`  = 날짜를 «어디서» 만드나 (`src/today.js` 밖이면 배포 차단)
//    ⑵ 이 재현판        = 그 한 곳의 답이 «맞나» (다섯 시간대에서 실제로 돌려본다)
//
// ⛔ 공식을 여기서 «베껴 적지» 않는다 — 앱 파일에서 읽어 쓴다.
//    베껴 적으면 앱만 고치고 검사는 옛 공식을 재게 된다(그럼 또 초록불).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const 오늘파일 = path.join(here, '../src/today.js')
let fail = 0
const ok = (m) => console.log(`  ✅ ${m}`)
const bad = (m) => { console.error(`  ⛔ ${m}`); fail++ }

// 앱 코드를 «그 시간대 안에서» 실제로 부른다. ⛔우리 컨테이너 시간대를 고치는 게 아니라 폰을 흉내낸다.
const 재기 = (tz, isoUTC, 무엇 = 'todayKST') => {
  const code = `
    const m = await import('${오늘파일}')
    process.stdout.write(m.${무엇}(new Date('${isoUTC}')))
  `
  return execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: tz }, encoding: 'utf8',
  })
}

// ⭐ 우리가 안 만든 답으로 교차검증 — 브라우저·노드의 시간대 데이터가 계산한 «한국 날짜»
const 정답 = (isoUTC) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(isoUTC)).map((x) => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day}`
}

console.log('⏰ 「오늘(KST)」이 어느 시간대에서 돌려도 맞나\n')

// ⛔ 다섯 시간대 — 우리 컨테이너(UTC)·창업자 폰(KST)·시차가 큰 곳·오프셋이 30분 단위인 곳
const 시간대 = [
  ['UTC', '내 컨테이너'],
  ['Asia/Seoul', '창업자 폰'],
  ['America/New_York', '지구 반대'],
  ['Australia/Sydney', 'KST 보다 앞'],
  ['Asia/Kathmandu', '30분 단위 오프셋'],
]
// 하루가 넘어가는 «위험한 세 순간»
const 순간 = [
  ['2026-08-16T23:01:00Z', '아침 8:01', '2026-08-17'],
  ['2026-08-16T15:05:00Z', '자정 직후 00:05', '2026-08-17'],
  ['2026-08-16T14:55:00Z', '자정 5분 전 23:55', '2026-08-16'],
]

for (const [iso, 이름, 바라는값] of 순간) {
  if (정답(iso) !== 바라는값) { bad(`검사 자체가 틀렸다 — ${이름} 의 KST 날짜는 ${정답(iso)} 다`); continue }
  const 답 = 시간대.map(([tz]) => 재기(tz, iso))
  const 어긋난것 = 시간대.filter((_, i) => 답[i] !== 바라는값)
  if (!어긋난것.length) ok(`${이름.padEnd(16)} → 다섯 시간대 전부 «${바라는값}»`)
  else for (const [tz, 뭐] of 어긋난것) {
    bad(`${이름} · ${뭐}(${tz}) → «${재기(tz, iso)}» 인데 «${바라는값}» 이라야 한다`)
  }
}

// 📅 「자동 공개 전날 검수」 게이트가 쓰는 «내일»
{
  const 답 = 시간대.map(([tz]) => 재기(tz, '2026-08-16T23:01:00Z', 'tomorrowKST'))
  if (답.every((d) => d === '2026-08-18')) ok('내일(tomorrowKST)  → 다섯 시간대 전부 «2026-08-18»')
  else bad(`내일이 어긋난다 — ${답.join(' · ')}`)
}

// ⭐ Intl 과 교차검증 — 우리 산수와 엔진의 시간대 데이터가 «같은 답»인가 (1년치 훑는다)
{
  let 다른날 = 0
  const 시작 = Date.parse('2026-01-01T00:00:00Z')
  const code = `
    const m = await import('${오늘파일}')
    const out = []
    for (let i = 0; i < 365 * 24; i++) out.push(m.todayKST(new Date(${시작} + i * 3600000)))
    process.stdout.write(out.join(','))
  `
  const 우리답 = execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: 'Asia/Seoul' }, encoding: 'utf8',
  }).split(',')
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
  우리답.forEach((got, i) => {
    const p = Object.fromEntries(f.formatToParts(new Date(시작 + i * 3600000)).map((x) => [x.type, x.value]))
    if (got !== `${p.year}-${p.month}-${p.day}`) 다른날++
  })
  if (다른날) bad(`Intl 과 다른 시각 ${다른날}개 — 산수가 틀렸다`)
  else ok(`Intl(Asia/Seoul) 과 1년치 8,760시간 전부 같은 답`)
}

// ⛔ 앱이 정말 그 한 곳을 쓰나 — 각자 공식을 되살리면 여기서 걸린다
{
  const 코드만 = (s) => s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
  const 볼것 = ['src/data/weekly.js', 'src/data/whatsnew.js', 'src/data/basics.js', 'scripts/test-whatsnew.mjs', 'scripts/check-review.mjs']
  const 안쓰는것 = 볼것.filter((f) => !/todayKST/.test(코드만(readFileSync(path.join(here, '..', f), 'utf8'))))
  if (안쓰는것.length) bad(`«${안쓰는것.join(', ')}» 가 todayKST 를 안 쓴다 — 각자 공식으로 되돌아간 것 아닌지 볼 것`)
  else ok(`날짜를 쓰는 ${볼것.length}곳 전부 src/today.js 를 부른다`)
}

console.log(fail ? `\n⛔ ${fail}칸 실패` : '\n✅ 「오늘」이 어느 시간대에서도 맞다')
process.exit(fail ? 1 : 0)
