// 📸 [2026-09-01] 로그인 화면의 «선물 안내»를 눈으로 본다
// 📮 창업자 = *"로그인화면에서 10개 주고 로그인하면 20개준다는 것도 안내붙였어? 스샷줘."*
// ⛔ 재현판이 아니라 «보는» 판이다(절대원칙 21).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4483, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const OUT = process.env.SHOT_OUT || '/tmp'
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:founder', 'x') } catch { /* noop */ } })
const p = await ctx.newPage()
p.on('pageerror', () => { /* noop */ })
// 🕸 서버 답 — 비로그인 10 · 로그인 30 (진짜 워커가 주는 모양 그대로)
await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, left: { welcome: 10, month: 5, cap: 10, bonus: 0, earned: [], anon: 10, acct: 30, monthly: 5, signed: false } }) })
})
await p.goto('http://127.0.0.1:4483/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.locator('.nav-item', { hasText: '홈' }).first().click().catch(() => {})
await p.waitForTimeout(600)
// 설정 → 클라우드 저장
await p.locator('[aria-label="설정"], .icon-btn').filter({ hasText: /^$/ }).last().click().catch(() => {})
await p.waitForTimeout(900)
// ⛔ 글자만 누르면 줄(버튼)이 아니라 «라벨»을 누를 수 있다 — 누를 수 있는 조상까지 올라간다
await p.evaluate(() => {
  const 글 = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /^클라우드 저장$/.test(e.textContent.trim()))
  let n = 글
  while (n && !(n.tagName === 'BUTTON' || n.getAttribute('role') === 'button' || /opt-row|opt-item|row/.test(n.className || ''))) n = n.parentElement
  ;(n || 글)?.click()
})
await p.waitForTimeout(1800)
// ⛔ 시트가 안 열렸으면 «안 열렸다»고 말한다 — 「안 보인다」를 「없다」로 바꿔 읽지 않는다(규칙 18)
if (!(await p.locator('.cg-gift').count())) console.log('⚠️ 시트가 안 열렸을 수 있다 — 화면 글을 본다')
await p.screenshot({ path: `${OUT}/로그인선물.png`, fullPage: true })
const m = await p.evaluate(() => ({
  선물줄: document.querySelector('.cg-gift')?.innerText.replace(/\n/g, ' ') || '(없다)',
  화면글: document.body.innerText.slice(0, 400),
}))
console.log(JSON.stringify(m, null, 1))
await b.close(); srv.close()
