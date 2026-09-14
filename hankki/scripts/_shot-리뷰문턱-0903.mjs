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

// ④ 🚪 「만들었어요」 문 — 레시피를 한 편도 «안 담은» 사람으로 새로 연다
//    ⛔ 「물어봤음」과 «오늘 기록»을 둘 다 비운다 — 안 그러면 문이 안 열려 아무것도 못 찍는다
//       (`onCook` 은 오늘 기록이 있으면 조기 return 한다 · `RecipeDetailScreen.jsx:249`)
const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
await p2.evaluate(() => {
  try {
    localStorage.removeItem('hankki:nudge:review')
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    s.diary = []
    s.recipes = (s.recipes || []).filter((r) => String(r?.id || '').startsWith('basic-'))
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  } catch { /* noop */ }
})
await p2.reload({ waitUntil: 'networkidle' })
await p2.waitForTimeout(700)
await p2.evaluate(() => {
  const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
  bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
})
await p2.waitForTimeout(700)
await p2.evaluate(() => { [...document.querySelectorAll('button')][6]?.click() })
await p2.waitForTimeout(900)
await p2.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('만들었어요'))?.click()
})
await p2.waitForFunction(() => /한마디 남겨주실래요/.test(document.body.innerText || ''), null, { timeout: 8000 }).catch(() => {})
await p2.waitForTimeout(400)
await p2.screenshot({ path: join(OUT, '4-만들었어요-리뷰창.png') })
console.log('④', /오늘도 한 끼 해냈어요/.test(await p2.evaluate(() => document.body.innerText)) ? '떴다(머리글 참)' : '안 떴다')

console.log('📁', OUT)
await b.close(); srv.close()
