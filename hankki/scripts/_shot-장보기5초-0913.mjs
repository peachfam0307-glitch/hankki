// 🛒 「장보기가 5초 만에 닫힌다」 — 유저가 «실제로 보는 화면»을 찍는다 (2026-09-13)
//
// 🔢 실측(GA4 28일 · 2026-09-13) = `shop` 19번 열림 · 평균 **5초**.
//    `myrecipes` 49초 · `detail` 44초 인데 장보기만 5초다. **모든 화면 중 제일 짧다.**
//
// ⛔ 왜 소스만 읽지 않나 = 「빈 화면이라 그렇겠지」는 짐작이다(절대원칙 · 과장 금지).
//    ⭐ 두 상태를 «갈라» 찍어서 눈으로 본다 — 빈손일 때 / 담긴 게 있을 때.
//
// 🖨  SMOKE_CHROMIUM=… node scripts/_shot-장보기5초-0913.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a2a1e2e3-d972-556f-b791-6ad309c4df0c/scratchpad'
const 방 = `${OUT}/장보기5초`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const 레시피들 = basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 }))

const PORT = 4383
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 열어찍는다(이름, 담긴것) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.evaluate(([s, 장보기]) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:news:off', '1')
    // ⛔ 키는 `hankki:shopping` 이고 «배열»이다(store.jsx migrateShopping).
    //    처음에 `hankki:shop` 에 객체를 넣어서 «담긴 게 없는 화면»을 두 번 찍었다 — 규칙 18.
    if (장보기) localStorage.setItem('hankki:shopping', JSON.stringify(장보기))
  }, [{ recipes: 레시피들, seedV: BASICS_VERSION }, 담긴것])
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.waitForTimeout(1600)
  // 시트가 떠 있으면 닫는다
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }
  // 🛒 장보기 열기 — 아래 탭
  const 탭 = p.getByRole('button', { name: /장보기/ }).first()
  if (await 탭.count()) await 탭.click().catch(() => {})
  else await p.getByText('장보기', { exact: true }).first().click().catch(() => {})
  await p.waitForTimeout(1400)
  await p.screenshot({ path: `${방}/${이름}.png`, fullPage: false })
  // 📏 「장보기 리스트」가 화면 «어디»에 있나 — 첫 화면(891px) 안인가 밖인가
  const 자리 = await p.evaluate(() => {
    // ⛔ 잎 노드로만 찾으면 못 찾는다 — 제목에 아이콘이 같이 들어 있다.
    //    ⭐ 「그 글자를 품은 것 중 «제일 작은» 것」을 고른다.
    const 후보 = [...document.querySelectorAll('h1,h2,h3,h4,div,span,section')]
      .filter((e) => (e.textContent || '').trim().startsWith('장보기 리스트'))
    const 찾 = 후보.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]
    if (!찾) return null
    const r = 찾.getBoundingClientRect()
    return { 위 : Math.round(r.top + window.scrollY), 화면높이: window.innerHeight }
  })
  const 글 = (await p.locator('body').innerText().catch(() => '')).trim()
  if (자리) {
    const 밖 = 자리.위 > 자리.화면높이
    console.log(`   📏 「장보기 리스트」 자리 = 위에서 ${자리.위}px · 첫 화면 높이 ${자리.화면높이}px → ${밖 ? '⛔ 첫 화면 «밖»(스크롤해야 보인다)' : '✅ 첫 화면 «안»'}`)
  }
  await ctx.close()
  return 글
}

console.log('\n🛒 장보기 — 유저가 보는 화면\n')

const 빈손 = await 열어찍는다('1-빈손', null)
console.log('【① 장보기가 «비었을» 때】')
console.log(빈손.split('\n').filter((l) => l.trim()).map((l) => '   ' + l).join('\n'))

console.log('\n' + '─'.repeat(60) + '\n')

const 담김 = await 열어찍는다('2-담김', [
  { id: 'x1', name: '돼지고기 앞다리살', done: false },
  { id: 'x2', name: '애호박', done: false },
  { id: 'x3', name: '두부', done: true },
])
console.log('【② 장보기에 «담긴 게 있을» 때】')
console.log(담김.split('\n').filter((l) => l.trim()).map((l) => '   ' + l).join('\n'))

await b.close(); srv.kill()
console.log(`\n📸 캡처 = ${방}`)
