// 📸 「한 장씩」 시트를 실물로 찍는다 — 창업자에게 보여주기 «전»에 내가 눈으로 본다(절대원칙 21).
//
//   ⭐ 재현판(`_repro-한장씩-0828`)은 «숫자»를 잰다. 이건 «생김새»를 본다 — 둘은 다른 것이다.
//      숫자로는 「글자가 두 줄로 깨졌다」·「단추가 화면 밖으로 나갔다」가 안 잡힌다.
//
//   ⛔ 온보딩·코치마크를 끄고 찍는다(안 끄면 덮인다 — 2026-08-11 사고).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-한장씩-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.argv[2] || '/tmp/한장씩'
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
await new Promise((r) => srv.listen(4422, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 새탭 = async () => {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4422/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.removeItem('hankki:nudge:review') } catch {} })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}
const 눌러 = (page, t) => page.evaluate((s) => {
  [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes(s))?.click()
}, t)
const 기다려 = (page, t, ms = 45000) => page.waitForFunction(
  (s) => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes(s)), t, { timeout: ms },
).catch(() => {})
const 자랑탭 = async (page) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레꾸자랑'))?.click()
  })
  await page.waitForTimeout(700)
  await page.evaluate(() => document.querySelector('button[aria-label="콩국수 자랑하기"]')?.click())
  await 기다려(page, '내가 꾸민 표지 그대로', 20000)
}
const 덮였나 = (page) => page.evaluate(() => {
  const el = document.elementFromPoint(195, 422)
  return el ? `${el.tagName}.${el.className || ''}`.slice(0, 60) : '(없음)'
})

// ① 🎨 꾸민 표지 → 「레시피도 보내기」
{
  const page = await 새탭()
  await page.evaluate(() => { navigator.canShare = () => true; navigator.share = () => Promise.resolve() })
  await 자랑탭(page)
  await 눌러(page, '내가 꾸민 표지 그대로')
  await 기다려(page, '레시피도 보내기', 60000)
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, '1-표지뒤-레시피도보내기.png') })
  console.log('① 가운데를 덮은 것 =', await 덮였나(page))
  await page.close()
}

// ② 🎴 랜덤 카드 → 「레시피도 보내기」
{
  const page = await 새탭()
  await page.evaluate(() => { navigator.canShare = () => true; navigator.share = () => Promise.resolve() })
  await 자랑탭(page)
  await 눌러(page, '랜덤 카드로 뽑기')
  await 기다려(page, '공유하기')
  await 눌러(page, '공유하기')
  await 기다려(page, '레시피도 보내기', 60000)
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, '2-랜덤카드뒤-레시피도보내기.png') })
  console.log('② 가운데를 덮은 것 =', await 덮였나(page))
  await page.close()
}

// ③ 📮 허가 끊김 → 「지금 보내기」(원래 시트가 안 망가졌나)
{
  const page = await 새탭()
  await page.evaluate(() => {
    navigator.canShare = () => true
    let 첫번 = true
    navigator.share = () => {
      if (첫번) { 첫번 = false; return Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })) }
      return Promise.resolve()
    }
  })
  await 자랑탭(page)
  await 눌러(page, '내가 꾸민 표지 그대로')
  await 기다려(page, '지금 보내기', 60000)
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, '3-허가끊김-지금보내기.png') })
  console.log('③ 가운데를 덮은 것 =', await 덮였나(page))
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}\n`)
