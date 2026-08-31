// 📸 눈으로 보는 판 — 곁말이 «걸음 아래 작은 회색 줄»로 보이나 (절대원칙 21)
// 실행: node scripts/_shot-곁말-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { parseRecipeText } from '../src/parseRecipe.js'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4485, r))
const OCR = readFileSync(new URL('./_repro-곁말계량-0901.mjs', import.meta.url), 'utf8').split('const OCR = `')[1].split('`')[0]
const o = parseRecipeText(OCR, { fromOcr: true })
const { BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: [{ id: 'r곁말', title: '곁말시험', at: now, savedAt: now, status: 'sorted', ingredients: o.ingredients, steps: o.steps, cover: {} }], seedV: BASICS_VERSION }
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
await page.goto('http://127.0.0.1:4485/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.evaluate(() => [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')].find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click())
await page.waitForTimeout(500)
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith('곁말시험'))?.click())
await page.waitForTimeout(700)
await page.evaluate(() => document.querySelectorAll('.step')[0]?.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(300)
const out = join(ROOT, '../scratchshot')
await page.screenshot({ path: '/tmp/곁말-상세.png' })
await page.evaluate(() => document.querySelector('[data-coach="cook"]')?.click())
await page.waitForTimeout(600)
await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))?.click())
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/곁말-요리.png' })
await b.close(); srv.close()
console.log('찍었다 → /tmp/곁말-상세.png · /tmp/곁말-요리.png')
