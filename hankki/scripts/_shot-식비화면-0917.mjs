// 💰📸 식비 세그먼트 실물 — 「안 쌓인다」는 «화면» 얘기였다(기록은 폰에 그대로 남는다 · 창업자 2026-09-17 물음)
//   지난달·이번달 기록을 넣고 → 장보기 탭 → 식비 칸 → 외식 적기까지 실제로 눌러 본다.
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
await new Promise((r) => srv.listen(4537, r))
const OUT = process.env.OUT || '/tmp/claude-0'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage(); const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error' && !/net::|ERR_TUNNEL/.test(m.text())) 오류.push(m.text()) })
await p.goto('http://127.0.0.1:4537/hankki/?%EC%8B%9D%EB%B9%84=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2400)
async function 치우기() { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(450) } catch { break } } }
await 치우기()

// 🗓 «지난 몇 주» 기록을 미리 넣는다 — 「달이 바뀌면 날아가나?」를 눈으로 보려고 8월 줄도 넣는다
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(Date.now() + 9 * 3600e3)
  const 날 = (n) => { const d = new Date(오늘); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
  if (process.env.한줄만) { s.foodCost = [{ id: 'z1', d: 날(0), k: 'shop', won: 45000, memo: '롯데마트' }]; localStorage.setItem('hankki:v1', JSON.stringify(s)); return }
  s.foodCost = [
    { id: 'a1', d: 날(0), k: 'shop', won: 31000, items: [{ n: '두부', won: 3900 }, { n: '대파', won: 2500 }] },
    { id: 'a2', d: 날(2), k: 'out', won: 24000, memo: '치킨' },
    { id: 'a3', d: 날(4), k: 'shop', won: 52300, memo: '한살림' },
    { id: 'a4', d: 날(8), k: 'shop', won: 18900, memo: '쿠팡' },
    { id: 'a5', d: 날(9), k: 'out', won: 16500, memo: '중국집' },
    { id: 'a6', d: 날(13), k: 'shop', won: 47200 },
    { id: 'a7', d: 날(21), k: 'shop', won: 39800 },
    { id: 'a8', d: 날(33), k: 'shop', won: 41000, memo: '지난달에 적은 것' },
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(900); await 치우기()
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click(); await p.waitForTimeout(800)
await p.screenshot({ path: join(OUT, '식비화면-1-통계.png'), fullPage: true })
console.log('주 합계 =', await p.locator('.fc-v').first().textContent())
console.log('줄 수 =', await p.locator('.fc-row').count(), '(넣은 것 8줄이 다 있나)')
// ⌨️ 외식 적기 — 숫자판을 실제로 누른다
await p.locator('.fc-out-btn').first().click(); await p.waitForTimeout(600)
for (const k of ['2', '3', '000']) { await p.locator('.fc-key', { hasText: new RegExp(`^${k}$`) }).first().click(); await p.waitForTimeout(150) }
await p.locator('.fc-memo').fill('분식집')
await p.screenshot({ path: join(OUT, '식비화면-2-외식적기.png'), fullPage: true })
const 적힌값 = await p.locator('.fc-in').first().textContent()
await p.locator('.fc-save').first().click(); await p.waitForTimeout(700)
const 뒤 = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').foodCost.length)
console.log('숫자판 입력 =', 적힌값, '· 저장 뒤 줄 수 =', 뒤, '(9 여야 한다)')
await p.screenshot({ path: join(OUT, '식비화면-3-적은뒤.png'), fullPage: true })
console.log('콘솔 오류:', 오류.length, 오류.slice(0, 3))
await b.close(); srv.close()
