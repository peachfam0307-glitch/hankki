// 🏷 「샘플」 표시가 «티 나나» — 옛 판(연한 크림)과 새 판(진한 잉크)을 나란히 찍는다.
//    📮 창업자 2026-08-12 *"샘플표시가 너무 작아 티도안나"*
//    ⛔ 숫자로는 못 정한다(글자 크기만 보면 11 → 12.5 = 겨우 1.5px). **눈으로 본다**(규칙 21).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4399, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { makeSampleDiary } = await import('../src/data/sampleDiary.js')
const 샘플 = makeSampleDiary()
샘플.at = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime() })() // 오늘 칸에서 바로 보게

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3 })
await ctx.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
}, { recipes: [], diary: [샘플], sampleGone: false, seedV: BASICS_VERSION })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4399/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)

const bar = await page.locator('.detail-bar').first().boundingBox()
await page.screenshot({ path: join(OUT, '샘플표시-띠.png'), clip: { x: 0, y: bar.y, width: 411, height: bar.height + 6 } })
await page.screenshot({ path: join(OUT, '샘플표시-화면.png') })
const 글 = await page.evaluate(() => document.body.innerText)
console.log(글.includes('샘플') ? '✅ 화면에 「샘플」이 적혀 있다' : '⛔ 「샘플」이 없다')
await b.close(); srv.close(); process.exit(0)
