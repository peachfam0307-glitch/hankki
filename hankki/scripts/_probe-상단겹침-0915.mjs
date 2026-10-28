// 🔎 [2026-09-15] 상단바 «캐릭터»가 제목 글자를 «덮고 있나» — 눈으로는 겹쳐 보였다. 숫자로 확정한다.
//    ⛔ 겹쳐 보이는 것과 «글자를 가리는» 것은 다르다. 짐작으로 「버그다」라고 말하지 않는다(과장 금지).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4499, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const [이름, w, h] of [['폰', 390, 844], ['패드세로', 834, 1194], ['큰패드가로', 1366, 1024]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4499/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600)
  for (let i = 0; i < 10; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
  for (const 탭 of ['일기', '레시피']) {
    try { await p.locator('.bottom-nav .nav-item').filter({ hasText: 탭 }).first().click({ timeout: 3000 }); await p.waitForTimeout(1000) } catch { /* noop */ }
    for (let i = 0; i < 6; i++) {
      const c = p.locator('[aria-label="다음 안내 보기"]').first()
      if (await c.count() === 0 || !(await c.isVisible().catch(() => false))) break
      try { await c.click({ timeout: 2000 }); await p.waitForTimeout(500) } catch { break }
    }
    const v = await p.evaluate(() => {
      // 📌 제목은 `.h-title` 다(BragScreen.jsx:229 등) — h1 이 아니다. 첫 판이 이걸 몰라 여섯 칸 다 «못잼» 이었다.
      const 제목 = document.querySelector('.topbar .h-title')
      const 그림 = [...document.querySelectorAll('.topbar img, .topbar svg')]
      if (!제목 || !그림.length) return { 못잼: true, 제목있나: !!제목, 그림수: 그림.length }
      const t = 제목.getBoundingClientRect()
      let 겹침 = 0, 누구 = ''
      for (const g of 그림) {
        const r = g.getBoundingClientRect()
        const w = Math.min(t.right, r.right) - Math.max(t.left, r.left)
        const h = Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top)
        if (w > 0 && h > 0 && w > 겹침) { 겹침 = Math.round(w); 누구 = g.getAttribute('alt') || g.tagName }
      }
      return { 제목: 제목.innerText.trim().slice(0, 12), 제목왼쪽: Math.round(t.left), 겹친폭: 겹침, 겹친것: 누구 }
    })
    console.log(`[${이름.padEnd(5)}] ${탭.padEnd(4)} ${JSON.stringify(v)}`)
  }
  await ctx.close()
}
await b.close(); srv.close()
