// 📸 서랍 맨 위 — 선물 → 표지 그림(배경 음식 아이콘 지우기 · 사진 스티커로 붙이기)
//   창업자 2026-08-07 *"배경음식아이콘지우기앞에도 이모지?아이콘 같은거 넣으면 좋겠어
//                       (사진스티커로 붙이기 앞에 있는 이모지처럼)"*
//   ⭐ 「배경 음식 아이콘 지우기」는 **레시피 꾸미기에서만** 뜬다 — 일기엔 표지 그림이 없다(종이가 곧 판이다).
//   ⭐ 아이콘이 상태를 말한다 — 지울 땐 ✕, 되돌릴 땐 ↻. 누르기 «전»에 무슨 일이 날지 보인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/표지그림줄'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4413, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear(); localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: /레시피 꾸미기/ }).first().click(); await page.waitForTimeout(1500)

const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log('  📸', n) }
await shot('1-지우기전')

// 눌러서 「되돌리기」 상태 — 아이콘이 ✕ → ↻ 로 바뀌는지
const btn = page.locator('.decor-drawer button').filter({ hasText: /배경 음식 아이콘/ }).first()
if (await btn.count()) {
  const before = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.decor-drawer button')].find((x) => /배경 음식 아이콘/.test(x.textContent || ''))
    return { 글자: b.textContent.trim(), 아이콘: !!b.querySelector('svg') }
  })
  console.log(`   ℹ️ 누르기 전 — "${before.글자}" · 앞 아이콘 ${before.아이콘 ? '있다' : '없다'}`)
  await btn.click(); await page.waitForTimeout(900)
  await shot('2-지운뒤')
  const after = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.decor-drawer button')].find((x) => /배경 음식 아이콘/.test(x.textContent || ''))
    return { 글자: b.textContent.trim(), 아이콘: !!b.querySelector('svg') }
  })
  console.log(`   ℹ️ 누른 뒤 — "${after.글자}" · 앞 아이콘 ${after.아이콘 ? '있다' : '없다'}`)
  if (before.아이콘 && after.아이콘) console.log('   ✅ 두 상태 다 앞에 아이콘이 있다')
  else console.log('   ⛔ 아이콘이 빠진 상태가 있다')
} else console.log('   ⛔ 「배경 음식 아이콘」 줄을 못 찾았다 — 검사 방식부터 볼 것')

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
