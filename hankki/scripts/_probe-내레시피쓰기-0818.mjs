// 판을 «열어서» 확인한다 — 규칙 21(보여주기 전에 실물을 본다) ＋ 저장·복사가 진짜 도나
import { chromium } from 'playwright'
const 판 = process.argv[2]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
const 에러 = []
p.on('pageerror', (e) => 에러.push(String(e)))
await p.goto('file://' + 판)

const 편수 = await p.locator('article[data-key]').count()
const 첫제목 = await p.locator('article h2').first().textContent()

// ① 타이핑 → 저장 → 새로 열기 → 남아 있나
const ta = p.locator('.st-in').first()
await ta.click()
await ta.fill('간장·고춧가루·올리고당·물을 볼에 넣는다\n참기름을 마지막에 넣고 잘 섞는다')
await p.locator('.t-in').first().fill('5')
await p.locator('.s-in').first().fill('2')
await p.waitForTimeout(120)
const 칠해짐 = await p.locator('article').first().evaluate((el) => el.classList.contains('is-done'))
const 진행 = await p.locator('#cnt').textContent()

await p.goto('about:blank')
await p.goto('file://' + 판)
const 되살아남 = await p.locator('.st-in').first().inputValue()
const 분 = await p.locator('.t-in').first().inputValue()

// ② 「나중에」 체크
await p.locator('.skip').nth(1).check()
await p.waitForTimeout(80)
const 미룸 = await p.locator('article').nth(1).evaluate((el) => el.classList.contains('is-skip'))

// ③ 결과 복사 — 폴백 글이 실제로 나오나
await p.locator('#copy').click()
await p.waitForTimeout(150)
const 폴백보임 = await p.locator('#fallback').isVisible()
const 글 = await p.locator('#out').inputValue()

// ④ 가로 넘침
const 넘침 = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)

console.log('편 수      ', 편수)
console.log('첫 제목    ', (첫제목 || '').trim())
console.log('칠해짐     ', 칠해짐, '·', (진행 || '').trim())
console.log('새로 열어도 ', JSON.stringify(되살아남.slice(0, 22)) + '…', '· 분=' + 분)
console.log('나중에     ', 미룸)
console.log('폴백 보임  ', 폴백보임)
console.log('복사 글    \n' + 글.split('\n').slice(0, 12).map((s) => '  | ' + s).join('\n'))
console.log('가로 넘침  ', 넘침)
console.log('pageerror  ', 에러.length ? 에러 : '없음')

await p.evaluate(() => window.scrollTo(0, 0))
await p.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/판-위.png' })
await p.locator('article').first().scrollIntoViewIfNeeded()
await p.locator('article').first().screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/판-카드.png' })
await b.close()
