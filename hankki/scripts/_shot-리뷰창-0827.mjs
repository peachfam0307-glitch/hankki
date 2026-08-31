// 📸 「레꾸 자랑 보냈어요」 리뷰창을 «실물로» 찍는다 — 절대원칙 21(보여주기 전에 내가 열어본다)
//    실행: cd /home/user/hankki/hankki && node scripts/_shot-리뷰창-0827.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4421, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4421/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

await page.evaluate(() => {
  navigator.canShare = () => true
  navigator.share = () => { window.__부름 = 1; return Promise.resolve() }
})
await page.evaluate(() => {
  const bs = [...document.querySelectorAll('nav button, footer button, [class*="tab"] button')]
  bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레꾸자랑'))?.click()
})
await page.waitForTimeout(700)
await page.evaluate(() => document.querySelector('button[aria-label$="자랑하기"]')?.click())
await page.waitForTimeout(600)
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('랜덤 카드로 뽑기'))?.click())
await page.waitForTimeout(1800)
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('공유하기'))?.click())
await page.waitForFunction(() => window.__부름 === 1, null, { timeout: 45000 }).catch(() => {})
await page.waitForTimeout(600)
await page.evaluate(() => {
  const bs = [...document.querySelectorAll('button')].filter((x) => (x.innerText || '').trim() === '닫기')
  bs[bs.length - 1]?.click()
})
await page.waitForTimeout(1000)

const 떴나 = await page.evaluate(() => /레꾸 자랑 보냈어요/.test(document.body.innerText || ''))
await page.screenshot({ path: join(OUT, '리뷰창-㉠-공유직후.png') })
console.log(떴나 ? '✅ 리뷰창이 떴다 — 찍었다' : '⛔ 안 떴다 — 판정하지 말 것')
console.log('📸', join(OUT, '리뷰창-㉠-공유직후.png'))

await b.close(); srv.close()
process.exit(떴나 ? 0 : 1)
