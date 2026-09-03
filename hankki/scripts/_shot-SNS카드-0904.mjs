// 📸 유튜브 편·인스타 편 상세 «나란히» — 창업자에게 보내기 «전»에 내가 열어서 본다(절대원칙 21)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/3e7cc7f3-a746-5daf-b584-984c5d968d3d/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(0, r))
const BASE = `http://127.0.0.1:${srv.address().port}/`
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
let page = await ctx.newPage(); page.setDefaultTimeout(20000)
await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200)
if (await page.getByText('Google 계정으로 시작하기').count()) {
  const p2 = await ctx.newPage(); p2.setDefaultTimeout(20000)
  await p2.goto(BASE, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(2200); await page.close(); page = p2
}
for (const [이름, 제목] of [['1-유튜브-꽈리고추', '꽈리고추'], ['2-인스타-광어깻잎무침', '광어깻잎무침']]) {
  // ⛔ 상세엔 하단바가 없다 — 탭을 누르기 전에 나온다
  if (!(await page.getByRole('button', { name: '레시피', exact: true }).count())) {
    const 뒤로 = page.locator('button[aria-label="뒤로"]')
    if (await 뒤로.count()) { await 뒤로.first().click({ force: true }); await page.waitForTimeout(900) }
  }
  await page.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true })
  await page.waitForTimeout(1300)
  await page.locator('.name', { hasText: 제목 }).first().click({ force: true })
  await page.waitForTimeout(1400)
  // ⭐ 숫자만 믿지 않는다 — 카드를 화면에 올려놓고 찍는다
  const 절 = page.locator('.sec-head').filter({ hasText: /영상으로 보기|원본 보기/ })
  // ⛔ 절 제목만 올리면 «카드 아래쪽»이 하단바에 가린다 — 카드를 통째로 올린다
  const 문 = page.locator('button.card').filter({ has: page.locator('.opt-row') })
  if (await 문.count()) { await 문.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await page.mouse.move(206, 500); await page.mouse.wheel(0, 220); await page.waitForTimeout(600) }
  else if (await 절.count()) { await 절.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(700) }
  console.log(`  🔎 ${제목} — 절 = ${await 절.count() ? JSON.stringify((await 절.first().innerText()).trim()) : '⛔없다'}`)
  await page.screenshot({ path: join(OUT, `카드-${이름}.png`) })
}
await b.close(); srv.close(); console.log('  📸', OUT)
