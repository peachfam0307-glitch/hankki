// 👁️ 시간 없는 레시피에 「undefined분」이 안 뜨나 — 검색 화면 (2026-11-25)
//
// 📮 창업자 = *"요리모드 첨에 재료나오는 화면도 글씨체 귀염체?로 바꿔야함."*
//
// ⭐ 숫자만 보고 끝내지 않는다 — **찍어서 눈으로 본다**(절대원칙 21).
//    ＋ 「진짜 Gaegu 가 그려졌나」는 화면 글자로는 못 안다 → `document.fonts.check` 로 «파일이 왔나»까지 본다.
// ⛔ 레시피 «상세»의 재료 줄은 «안» 바뀌어야 한다 — 창업자가 말한 화면이 아니다. 그것도 같이 잰다.
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-재료귀염체-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/눈검사'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await p.locator('[aria-label="검색"]').first().click(); await p.waitForTimeout(1000)
const inp = p.locator('input').first(); await inp.fill('떡볶이'); await p.waitForTimeout(1200)
await p.screenshot({ path: OUT + '/검색.png' })
const t = await p.evaluate(() => [...document.querySelectorAll('.date')].map(x => x.textContent).slice(0, 8))
console.log(JSON.stringify(t), 'undefined 있음=', t.some(x => x.includes('undefined')))
await b.close(); srv.close()
