// 🔍 검수36 판 검사 — 2판(오늘 아침 정정 반영본)
//   ⛔ 「내 눈」이 아니라 «판을 열어» 센다. 실패할 줄 모르는 칸은 만들지 않는다.
import { createRequire } from 'node:module'
const require_ = createRequire('/home/user/hankki/hankki/package.json')
const { chromium } = require_('playwright')
import { readFileSync } from 'node:fs'
import { 정정2차 } from './검수36-데이터.mjs'

const DIR = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const d = JSON.parse(readFileSync('/home/user/hankki/hankki/docs/_대기/레시피-정리-초안-2026-08-10.json', 'utf8'))
// ⛔ 개수를 손으로 세지 말 것 — 데이터에서 «센다»
//    (첫 판에 14로 손수 적었다가 틀렸다. 정정2차가 11편이고 식용유 5편 중 목살조림이 겹쳐 15편이다)
const 식용유편 = ['간장 제육볶음', '마파두부', '매콤 콩나물덮밥', '목살조림', '10분 버섯밥']
const 오늘편수 = new Set([...Object.keys(정정2차), ...식용유편]).size

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 411, height: 891 } })
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
await p.goto('file://' + DIR + '/검수36.html')
await p.waitForTimeout(300)

const 판 = []
const 재 = (n, 값, 기대) => 판.push([값 === 기대, n, `${값} (기대 ${기대})`])

// ① 카드 수
const 카드 = await p.locator('article.rc').count()
재('① 카드 36장', 카드, 36)

// ② 「🔁 오늘 아침」 뱃지 = n2 카드 수
const 오늘뱃지 = await p.locator('.badge.b-new').count()
const n2카드 = await p.locator('article.rc.n2').count()
재('② 「오늘 아침」 뱃지 = n2 카드', 오늘뱃지, n2카드)
재(`②-2 오늘 손댄 편 ${오늘편수}`, n2카드, 오늘편수)

// ③ 고침 뱃지
const 고침 = await p.locator('.badge.b-fix').count()
재('③ ✏️고침 뱃지 28', 고침, 28)
재('③-2 ✅그대로 뱃지 8', await p.locator('.badge.b-ok').count(), 8)

// ④ 칩 「오늘 아침」 → 그 수만 보임
await p.locator('.chip[data-f="n2"]').click(); await p.waitForTimeout(150)
재('④ 칩「오늘 아침」 → 보이는 카드', await p.locator('article.rc:not(.hide)').count(), n2카드)
await p.locator('.chip[data-f="all"]').click(); await p.waitForTimeout(150)
재('④-2 칩「전체」 되돌리기', await p.locator('article.rc:not(.hide)').count(), 36)

// ⑤ 초성 찾기 — ⭐「초성으로 찾은 것」과 「글자로 찾은 것」이 같아야 한다
//    ⛔ 첫 판에 「ㅎㅌㄱ → 2편(황태국·황태장아찌)」로 적었는데 틀렸다.
//       황태장아찌의 초성은 ㅎㅌㅈㅇㅉ 라 ㅎㅌㄱ 에 안 걸린다. 검사가 틀렸던 것.
for (const [초, 글] of [['ㅎㅌㄱ', '황태국'], ['ㅁㅍㄷㅂ', '마파두부'], ['ㅇㅈㅇ', '오징어']]) {
  await p.locator('#q').fill(초); await p.waitForTimeout(140)
  const a = await p.locator('article.rc:not(.hide)').count()
  await p.locator('#q').fill(글); await p.waitForTimeout(140)
  const c = await p.locator('article.rc:not(.hide)').count()
  판.push([a === c && a > 0, `⑤ 초성 「${초}」 = 글자 「${글}」`, `초성 ${a}편 · 글자 ${c}편`])
}
await p.locator('#q').fill(''); await p.waitForTimeout(150)

// ⑥ 재료·순서에 「식용유」가 0곳 (⛔인용문엔 남아 있어야 정상)
const 본문식용유 = await p.locator('.ing li, .stp li').filter({ hasText: '식용유' }).count()
재('⑥ 재료·만드는 법에 식용유 0곳', 본문식용유, 0)
const 인용식용유 = await p.locator('.allfix .q').filter({ hasText: '식용유' }).count()
판.push([인용식용유 >= 1, '⑥-2 네 원문 인용엔 「식용유」가 남아 있다', `${인용식용유}곳 (원문이라 그대로가 맞다)`])

// ⑦ 광고 끊기는 이름이 재료·순서에 없나
const 나쁜이름 = await p.locator('.ing li, .stp li').filter({ hasText: '육수가루' }).count()
재('⑦ 「육수가루」·「해물육수가루」 0곳 (광고 끊김)', 나쁜이름, 0)

// ⑧ 뺀 2편이 카드에 없나 (⛔맨 위 안내문엔 있어야 정상)
const 제목들 = await p.locator('article.rc h3').allInnerTexts()
const 뺀게있나 = ['들깨 궁채나물', '항정삼합'].filter((t) => 제목들.includes(t))
재('⑧ 뺀 2편이 카드에 없다', 뺀게있나.length, 0)

// ⑨ 데이터와 판이 어긋나지 않나 — 카드 제목이 JSON 과 완전히 같은가
const 어긋 = d.map((r) => r.title).filter((t) => !제목들.includes(t))
재('⑨ JSON 36편 제목이 판에 다 있다', 어긋.length, 0)

// ⑩ 가로 넘침 (폰에서 옆으로 안 밀리나)
const 넘침 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
판.push([넘침 <= 0, '⑩ 가로 넘침 없음', `${넘침}px`])

// ⑪ 물어볼 것 2개
재('⑪ 물어볼 것 2개', await p.locator('.ask li').count(), 2)

console.log('')
for (const [ok, n, v] of 판) console.log(`  ${ok ? '✅' : '⛔'} ${n}  —  ${v}`)
console.log(`\n  ${오류.length ? '⛔' : '✅'} pageerror ${오류.length}`)
오류.forEach((e) => console.log('     ' + e))
console.log(`\n  ${판.every(([o]) => o) && !오류.length ? '🎉 전부 통과' : '⛔ 어긋난 칸이 있다'}`)
await b.close()
