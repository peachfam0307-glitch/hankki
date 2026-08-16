// ⏰⏰ 「오늘」이 한국 폰에서 맞나 — UTC 컨테이너에서만 재면 «영영 못 잡는» 버그 (2026-08-17 신설)
//
// 📮 창업자 캡처(8/17 아침 8:01) = 홈에 **「이번 주 제철 = 깻잎」**(8/10 주차)이 떠 있었다.
//    8/17 주차 「여름 시원한 것」이 열렸어야 하는데 안 열렸다.
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
// ⭐ 그래서 이 검사는 **TZ 를 Asia/Seoul 로 바꿔 «폰과 같은 조건»으로** 앱 코드를 부른다.
//    ⛔ 우리 컨테이너 시간대를 고치는 게 아니다 — 폰을 흉내내는 것이다.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
let fail = 0
const ok = (m) => console.log(`  ✅ ${m}`)
const bad = (m) => { console.error(`  ⛔ ${m}`); fail++ }

// 앱의 공식을 그대로 — 여기서 «따라 적지» 않는다. 앱 파일에서 읽어 쓴다.
//   ⛔ 베껴 적으면 앱만 고치고 검사는 옛 공식을 재게 된다(그럼 또 초록불).
const 재기 = (tz, isoUTC) => {
  const code = `
    const { todayKST } = await import('${path.join(here, '../src/data/weekly.js')}')
    process.stdout.write(todayKST(new Date('${isoUTC}')))
  `
  return execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: tz }, encoding: 'utf8',
  })
}

console.log('⏰ 「오늘(KST)」이 한국 폰에서도 맞나\n')

// 창업자가 실제로 겪은 그 순간 — 2026-08-17 08:01 KST = 2026-08-16 23:01 UTC
const 아침 = '2026-08-16T23:01:00Z'
for (const [tz, 이름] of [['UTC', '내 컨테이너(UTC)'], ['Asia/Seoul', '창업자 폰(KST)']]) {
  const got = 재기(tz, 아침)
  if (got === '2026-08-17') ok(`${이름} — 아침 8:01 에 «${got}» (맞다)`)
  else bad(`${이름} — 아침 8:01 인데 «${got}» 가 나온다. KST 로는 8/17 이다`)
}

// 자정 직후 — 제일 위험한 자리
const 자정 = '2026-08-16T15:05:00Z'   // = 2026-08-17 00:05 KST
for (const [tz, 이름] of [['UTC', '내 컨테이너(UTC)'], ['Asia/Seoul', '창업자 폰(KST)']]) {
  const got = 재기(tz, 자정)
  if (got === '2026-08-17') ok(`${이름} — 자정 직후 00:05 에 «${got}»`)
  else bad(`${이름} — 자정 직후인데 «${got}»`)
}

// 자정 «직전» — 하루 일찍 넘어가면 그것도 사고다
const 직전 = '2026-08-16T14:55:00Z'   // = 2026-08-16 23:55 KST
for (const [tz, 이름] of [['UTC', '내 컨테이너(UTC)'], ['Asia/Seoul', '창업자 폰(KST)']]) {
  const got = 재기(tz, 직전)
  if (got === '2026-08-16') ok(`${이름} — 자정 5분 전에 «${got}» (아직 어제)`)
  else bad(`${이름} — 자정 5분 전인데 «${got}» — 하루 일찍 넘어갔다`)
}

// ⛔ 세 파일이 «같은 공식»을 쓰나 — 하나만 고치면 반쪽이다
{
  const { readFileSync } = await import('node:fs')
  // ⛔ **주석 줄은 안 본다** — 「옛 공식은 이랬다」고 설명으로 적어둔 것을 진짜 코드로 읽어 실패했다.
  //    (2026-08-16 `check-hookinline` 에서 겪은 것과 같은 오탐. 같은 실수를 이틀 연속 밟았다)
  const 코드만 = (s) => s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
  const 나쁜공식 = /getTimezoneOffset/
  const 볼것 = ['src/data/weekly.js', 'src/data/whatsnew.js', 'src/data/basics.js', 'scripts/test-whatsnew.mjs']
  const 걸린것 = 볼것.filter((f) => 나쁜공식.test(코드만(readFileSync(path.join(here, '..', f), 'utf8'))))
  if (걸린것.length) bad(`아직 «getTimezoneOffset» 을 쓰는 곳 ${걸린것.length}개 — ${걸린것.join(', ')}`)
  else ok(`날짜를 재는 네 곳 전부 «그냥 +9시간» 공식`)
}

console.log(fail ? `\n⛔ ${fail}칸 실패` : '\n✅ 「오늘」이 한국 폰에서도 맞다')
process.exit(fail ? 1 : 0)
