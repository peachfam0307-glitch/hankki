// 🔑🔬 식비 열쇠 재현판 (2026-09-17 → 2026-09-18 뒤집음)
//   ⭐ v13.76 에서 열쇠를 «뗐다» — 이제 유저에게도 보이고, `?식비=0` 으로 «끄는» 쪽이 열쇠다.
//   ⛔ 이게 깨지면 식비가 안 보이거나(공개 실패) 못 끄게 된다(되돌릴 길 없음).
import { chromium } from 'playwright'
// 🔑 [2026-09-23 00:4x] 코치마크·로그인 팝업 열쇠를 «미리 켠다» — 다른 재현판이 다 쓰는 표준 꼴이다.
//    ⛔ 이 판만 그걸 안 해서, 9/23 00:00 에 레시피 4편이 열려 「한끼 소식」 팝업이 «먼저» 뜨자
//       그걸 치운 뒤에야 로그인 팝업이 뜨는 2단이 됐고, 네 번째로 여는 화면에서 장보기 탭을 덮었다.
//    📌 LoginNudge.jsx:33 이 이미 적어 둔 그대로다 — *"검사판이 COACH 목록으로 이 팝업을 «본 상태»로 연다"*.
const { COACH } = await import('../src/coach.js')
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
// ① 보통 유저 — 이제 «그냥 보인다»(v13.76 에 열쇠를 뗐다)
const c1 = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await c1.addInitScript((keys) => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); keys.forEach((k) => localStorage.setItem(k, '1')) } catch { /* noop */ } }, Object.values(COACH))
let p = await 열기('http://127.0.0.1:4539/hankki/', c1)
본다('유저 화면에도 식비 칸이 있다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 1)
await p.locator('input[aria-label="살 재료 적기"]').first().fill('두부'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
본다('값 칸도 같이 있다', await p.locator('button[aria-label*="금액 적기"]').count() === 1)
본다('장보기 리스트는 그대로 뜬다', await p.locator('.shop-row').count() === 1)
// ② 끄기 — ?식비=0 으로 그 폰에서만 끈다
const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await c2.addInitScript((keys) => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); keys.forEach((k) => localStorage.setItem(k, '1')) } catch { /* noop */ } }, Object.values(COACH))
p = await 열기('http://127.0.0.1:4539/hankki/?%EC%8B%9D%EB%B9%84=0', c2)
본다('?식비=0 으로 끈다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 0)
await p.locator('input[aria-label="살 재료 적기"]').first().fill('대파'); await p.keyboard.press('Enter'); await p.waitForTimeout(400)
본다('끄면 값 칸도 없다', await p.locator('button[aria-label*="금액 적기"]').count() === 0)
// ③ 끈 폰에서 «주소 없이» 다시 열어도 꺼져 있나
p = await 열기('http://127.0.0.1:4539/hankki/', c2)
본다('끈 것은 주소 없이도 유지된다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 0)
// ④ 다시 켜기
p = await 열기('http://127.0.0.1:4539/hankki/?%EC%8B%9D%EB%B9%84=1', c2)
본다('?식비=1 로 다시 켠다', await p.locator('.segment .seg').filter({ hasText: '식비' }).count() === 1)
await b.close(); srv.close()
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) process.exit(1)
