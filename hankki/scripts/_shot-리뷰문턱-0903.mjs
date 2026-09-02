// 📸 「리뷰 문턱·자리 옮기기」 눈으로 보기 — 창업자 확정 2026-09-03
//   ⛔ 숫자만 보고 보내지 않는다(절대원칙 21) — 두 장을 뽑아 «열어서» 본다.
//     ① 설정의 상시 입구 「스토어에 한마디」 ② 레시피 2개째를 담은 «직후» 리뷰창
// 실행: node scripts/_shot-리뷰문턱-0903.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-리뷰-0903'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4423, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => { try { localStorage.removeItem('hankki:nudge:review') } catch {} })

// ① 설정
await page.evaluate(() => document.querySelector('button[aria-label="설정"]')?.click())
await page.waitForFunction(() => /스토어에 한마디/.test(document.body.innerText || ''), null, { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, '1-설정-상시입구.png') })
console.log('①', /스토어에 한마디/.test(await page.evaluate(() => document.body.innerText)) ? '있다' : '없다')

// ② 레시피 두 편을 «진짜로» 담고 리뷰창
const 담기 = async (제목) => {
  await page.evaluate(() => document.querySelector('button[aria-label="가져오기"]')?.click())
  await page.waitForTimeout(600)
  await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('직접 입력하기'))?.click() })
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('빈 종이 열기')), null, { timeout: 15000 }).catch(() => {})
  await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('빈 종이 열기'))?.click() })
  await page.waitForSelector('input[placeholder="예) 명란 크림 파스타"]', { timeout: 15000 })
  await page.fill('input[placeholder="예) 명란 크림 파스타"]', 제목)
  await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '저장')?.click() })
  await page.waitForTimeout(2500)
}
await 담기('오이무침')
await page.screenshot({ path: join(OUT, '2-한개째-안뜬다.png') })
await 담기('감자조림')
await page.waitForFunction(() => /한마디 남겨주실래요/.test(document.body.innerText || ''), null, { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '3-두개째-리뷰창.png') })
console.log('③', /한마디 남겨주실래요/.test(await page.evaluate(() => document.body.innerText)) ? '떴다' : '안 떴다')
console.log('📁', OUT)
await b.close(); srv.close()
