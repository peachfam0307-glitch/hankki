// 📸 [2026-08-28] 가져오기 새 판을 찍는다 — 창업자 지시 반영본
// ⛔ 재현판이 아니라 «눈으로 보는» 판이다(규칙 21). 숫자만 보고 보내지 않는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4471, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const OUT = process.env.SHOT_OUT || '/tmp'
for (const [이름, W] of [['390', 390], ['320', 320]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 860 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4471/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(1100)
  await p.screenshot({ path: `${OUT}/가져오기-목록-${이름}.png`, fullPage: true })
  // 재는 값 — 넘침·글자 크기
  const m = await p.evaluate(() => {
    const px = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : 0 }
    const key = document.querySelector('.imp-key')
    const opts = [...document.querySelectorAll('.imp-opt')]
    const doc = document.documentElement
    return {
      열쇠뱃지: key ? Math.round(key.getBoundingClientRect().right) : 0,
      화면폭: doc.clientWidth,
      가로넘침: doc.scrollWidth - doc.clientWidth,
      상자수: opts.length,
      상자틈: opts.length > 1 ? Math.round(opts[1].getBoundingClientRect().top - opts[0].getBoundingClientRect().bottom) : 0,
      제목: px('.imp-opt-a'), 설명: px('.imp-opt-b'), 숫자: px('.imp-key b'),
      제목들: opts.map((o) => o.querySelector('.imp-opt-a')?.innerText),
    }
  })
  console.log(`[${이름}px]`, JSON.stringify(m, null, 0))
  // 안내 화면(①)도 찍는다
  await p.locator('.imp-opt').first().click()
  await p.waitForTimeout(900)
  await p.screenshot({ path: `${OUT}/가져오기-안내1-${이름}.png`, fullPage: true })
  await ctx.close()
}
await b.close(); srv.close()
