// 📸 [2026-09-10] 상세 하단 단추바 뒤로 「… 완성!」 글자가 비치나 — 눈으로 본다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4597, r))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
await ctx.addInitScript(() => {
  try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4597/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2400)
const 길막 = async () => {
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
}
await 길막()
// 첫 레시피 열기 — 레시피 탭에서
await p.locator('.nav-item', { hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1400); await 길막()
await p.getByText('치킨 레터스랩').first().click().catch(() => {})
await p.waitForTimeout(1600); await 길막()
// 끝까지 내린다 — 「… 완성!」 꾸밈이 하단 단추바 뒤로 지나가는 자리
await p.evaluate(() => { const s = document.querySelector('.screen, .scroll, main') || document.scrollingElement; s.scrollTop = s.scrollHeight })
await p.waitForTimeout(900)
await p.screenshot({ path: join(ROOT, '_cap-완성비침.jpg'), quality: 38, type: 'jpeg' })
console.log('찍었다')
await b.close(); srv.close()
