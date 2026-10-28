// 🎃 홈 핼러윈 장식 — 갤럭시(시계줄 0) vs 아이폰(시계줄 47px 흉내) 자리 대조 (2026-10-20 · 창업자 「갤럭시랑 위치 맞춰줘」)
// 🎴📊 [2026-09-24] 레꾸자랑 «재기»를 눈으로 — 실제로 눌러서 ①나가는 카드 그림 ②글·주소 ③찍힌 계측 이름을 뽑는다.
//   폰 공유창은 가짜로 바꿔 끼운다(보낸 파일·글을 그대로 붙잡는다). 「닫기」도 흉내 낸다(AbortError).
//   ⛔ 찍고 재기만 한다. 앱 소스는 안 고친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4519, r))
const OUT = process.env.SHOT_OUT || '/tmp/홈장식'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
for (const [이름, 안전] of [['갤럭시', 0], ['아이폰', 47]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  await ctx.addInitScript((안전) => {
    try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch {}
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `:root{--safe-top:${안전}px !important}`; document.head.appendChild(s) })
  }, 안전)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4519/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '홈' }).first().click().catch(() => {})
  await p.waitForTimeout(2500); await 치우기(p)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  await ctx.close()
}
await b.close(); srv.close()
