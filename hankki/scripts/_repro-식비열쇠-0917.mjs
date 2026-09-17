// 🔑🔬 식비 열쇠 재현판 (2026-09-17) — 「창업자 폰에만 뜨고 유저 화면은 그대로」를 확인한다
//   ⛔ 이게 깨지면 검수 전 기능이 유저에게 그대로 나간다(규칙 13).
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
await new Promise((r) => srv.listen(4539, r))
let 통과 = 0; const 실패 = []
const 본다 = (n, 참) => { if (참) { 통과++; console.log('  ✓', n) } else { 실패.push(n); console.log('  ✗', n) } }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 열기(주소, ctx) {
  const p = await ctx.newPage()
  await p.goto(주소, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300)
  for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break } }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(900)
  for (let i = 0; i < 8; i++) { const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break } }
  return p
}
// ① 보통 유저 — 열쇠 없음
const c1 = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await c1.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
let p = await 열기('http://127.0.0.1:4539/hankki/', c1)
본다('유저 화면엔 식비 칸이 없다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 0)
await p.locator('input[placeholder*="살 재료"], input[placeholder*="두부"]').first().fill('두부'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
본다('유저 화면엔 값 칸도 없다', await p.locator('button[aria-label*="값 적기"]').count() === 0)
본다('장보기 리스트는 그대로 뜬다', await p.locator('.shop-row').count() === 1)
// ② 창업자 — 열쇠 링크로 한 번 열기
const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await c2.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
p = await 열기('http://127.0.0.1:4539/hankki/?%EC%8B%9D%EB%B9%84=1', c2)
본다('열쇠 링크로 열면 식비 칸이 생긴다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 1)
await p.locator('input[placeholder*="살 재료"], input[placeholder*="두부"]').first().fill('대파'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
본다('값 칸도 같이 생긴다', await p.locator('button[aria-label*="값 적기"]').count() === 1)
// ③ 그 폰에서 «주소 없이» 다시 열어도 남아 있나
p = await 열기('http://127.0.0.1:4539/hankki/', c2)
본다('다음부터는 주소 없이도 뜬다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 1)
// ④ 끄기
p = await 열기('http://127.0.0.1:4539/hankki/?%EC%8B%9D%EB%B9%84=0', c2)
본다('?식비=0 으로 끈다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 0)
await b.close(); srv.close()
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) process.exit(1)
