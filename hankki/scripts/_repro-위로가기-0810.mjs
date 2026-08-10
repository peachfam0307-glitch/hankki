// ⬆️ 재현 — 「위로 가기」 단추 (창업자 2026-08-10
//    *"레시피(전체, 모아보기)에 스크롤이 기니까 위로 바로가는 버튼? 하나 만들면 좋겠어."*)
//
// ⭐ 재는 것 = **①안 굴렀을 땐 없다 ②조금 굴려선 안 뜬다 ③한참 내려오면 뜬다
//    ④누르면 맨 위로 간다 ⑤다른 탭에서도 따라온다 ⑥꾸미기 판 위엔 «안» 뜬다 ⑦하단바를 안 가린다**
//
// ⛔ ⑥ 이 핵심이다 — 꾸미기 판은 Portal 이라 `.app-frame` 밖에서 화면을 통째로 덮는다.
//    v10.19 에 `ScrollHint` 가 정확히 여기서 «판 위에 막대»를 띄웠고 재현판이 잡았다.
//    같은 자리에 같은 함정이 있으니 같이 잰다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4331)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
}, state)
await page.goto(url)
await page.waitForTimeout(1500)

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }
const 단추 = () => page.locator('[data-totop]')
const 있나 = async () => (await 단추().count()) > 0
// 맨 위 화면(=DOM 마지막 `.screen`)을 실제로 굴린다 — 앱이 보는 것과 «같은 것»을 굴려야 한다
const 굴리기 = async (px) => {
  await page.evaluate((y) => {
    const l = document.querySelectorAll('.app-frame .screen')
    l[l.length - 1].scrollTop = y
  }, px)
  await page.waitForTimeout(450)
}
const 굴린값 = () => page.evaluate(() => {
  const l = document.querySelectorAll('.app-frame .screen')
  return Math.round(l[l.length - 1].scrollTop)
})

console.log('')

// ── 레시피 탭 ──
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(900)
const 길이 = await page.evaluate(() => {
  const l = document.querySelectorAll('.app-frame .screen')
  const s = l[l.length - 1]
  return { sh: s.scrollHeight, ch: s.clientHeight }
})
칸(길이.sh > 길이.ch * 2, '레시피 탭이 한참 넘친다(재는 뜻이 있다)', `내용 ${길이.sh}px / 화면 ${길이.ch}px`)

// ① 맨 위 → 없다
칸(!(await 있나()), '① 맨 위에선 단추가 없다')

// ② 조금 굴림(문턱 아래) → 아직 안 뜬다
await 굴리기(200)
칸(!(await 있나()), '② 조금 굴려선 안 뜬다', '200px')

// ③ 한참 굴림 → 뜬다
await 굴리기(1400)
칸(await 있나(), '③ 한참 내려오면 뜬다', `${await 굴린값()}px`)
await page.screenshot({ path: `${OUT}/위로가기-떴다.png` })

// ⑦ 하단바를 안 가린다 — 단추 아래끝이 하단바 위끝보다 위에 있어야 한다
if (await 있나()) {
  const b = await 단추().boundingBox()
  const nav = await page.locator('.bottom-nav').boundingBox()
  칸(b && nav && b.y + b.height <= nav.y + 1, '⑦ 하단바를 안 가린다', `단추 아래끝 ${Math.round(b.y + b.height)} · 하단바 위끝 ${Math.round(nav.y)}`)
  칸(b.width >= 44 && b.height >= 44, '⑦ 손가락에 닿는 크기(44px 이상)', `${Math.round(b.width)}×${Math.round(b.height)}`)
}

// ④ 누르면 맨 위로
await 단추().click()
await page.waitForTimeout(900)
칸(await 굴린값() === 0, '④ 누르면 맨 위로 간다', `${await 굴린값()}px`)
칸(!(await 있나()), '④ 올라가면 단추도 사라진다')

// ⑤ 다른 탭에서도 — 레꾸자랑
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(900)
await 굴리기(1400)
칸(await 있나(), '⑤ 레꾸자랑에서도 따라온다', `${await 굴린값()}px`)
await 단추().click()
await page.waitForTimeout(900)
칸(await 굴린값() === 0, '⑤ 거기서도 맨 위로 간다')

// ⑥ 꾸미기 판 위엔 «안» 뜬다
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(800)
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(1000)
const 꾸미기 = page.getByText('레시피 꾸미기')
if (!(await 꾸미기.count())) 칸(false, '⑥ 상세에서 「레시피 꾸미기」를 못 찾았다')
else {
  await 꾸미기.first().click()
  await page.waitForTimeout(1400)
  const 판 = await page.locator('.decor-editor').count()
  칸(판 > 0, '⑥ 꾸미기 판이 열렸다')
  // 판이 열린 «상태에서» 뒤 화면을 굴려도 단추가 판 위에 뜨면 안 된다
  await page.evaluate(() => {
    const l = document.querySelectorAll('.app-frame .screen')
    if (l.length) l[l.length - 1].scrollTop = 1400
  })
  await page.waitForTimeout(500)
  칸(!(await 있나()), '⑥ 꾸미기 판 위엔 단추가 안 뜬다')
  await page.screenshot({ path: `${OUT}/위로가기-꾸미기판.png` })
}

칸(errs.length === 0, 'pageerror 0', errs.length ? errs[0] : '')

await browser.close(); stop()
console.log(fail ? `\n⛔ ${fail}칸 실패\n` : `\n✅ 전부 통과\n`)
process.exit(fail ? 1 : 0)
