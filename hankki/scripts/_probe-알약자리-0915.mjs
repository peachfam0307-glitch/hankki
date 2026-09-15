// 📏📏 [2026-09-15] **「장보기 담기」알약과 「장바구니」알약이 지금 «어디»에 있나 — 재본다.**
//   📮 창업자 = *"장보기 알약이랑 광고알약이 어느위치에 붙으면 좋은지도 네가 생각해봐. 다 담고 누르기 좋은 위치가 어딘지"*
//   ⛔ 짐작으로 답하지 않는다 — 체크박스가 생겨서 «손가락이 목록 끝»에 있게 됐는지부터 숫자로 본다.
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
await new Promise((r) => srv.listen(4512, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4512/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
const 칸수 = await p.locator('.grid-card').count()
for (let n = 0; n < Math.min(칸수, 6); n++) {
  await p.locator('.grid-card').nth(n).click(); await p.waitForTimeout(1100); await 치우기(p)
  const 잰값 = await p.evaluate(() => {
    const y = (e) => (e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null)
    const 재료들 = [...document.querySelectorAll('.ing')]
    const 픽 = [...document.querySelectorAll('button,div')].filter((e) => (e.textContent || '').includes('이 레시피에 쓴 제품 보기') || (e.textContent || '').includes('주부의 장바구니에서 고른'))
    return {
      제목: (document.querySelector('h1, .detail-title')?.textContent || '').trim().slice(0, 14),
      담기알약: y(document.querySelector('.mini-buy')),
      재료첫줄: y(재료들[0]),
      재료끝: 재료들.length ? Math.round(재료들[재료들.length - 1].getBoundingClientRect().bottom + window.scrollY) : null,
      재료줄수: 재료들.length,
      장바구니알약: y(픽[픽.length - 1]),
      문서높이: Math.round(document.documentElement.scrollHeight),
      화면: window.innerHeight,
    }
  })
  console.log(JSON.stringify(잰값))
  await p.goBack(); await p.waitForTimeout(900); await 치우기(p)
}
await ctx.close(); await b.close(); srv.close()
