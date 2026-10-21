// 📸 ④편 대답 장면용 앱 화면 — 냉장고(임박·가진 재료) ＋ 식비 (2026-10-21)
//   ⛔ 날짜는 todayKST() ±n일(절대원칙 27) · 씨앗은 앱이 한 번 저장한 뒤 심는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4651, r))
const 밖 = process.env.OUT || '/tmp/④편대답'; mkdirSync(밖, { recursive: true })
const { todayKST } = await import('../src/today.js')
const 며칠 = (n) => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 재료 = [['두부', 1], ['애호박', 2], ['우유', 3], ['돼지고기', 4], ['대파', 6], ['달걀', 12], ['당근', 15], ['양파', 20]].map(([n, d]) => [n, 며칠(d)])
const 식비 = [[0, 'shop', 38400, '마트 장보기'], [-1, 'out', 15000, '치킨'], [-2, 'shop', 12700, '자연드림'], [-4, 'shop', 26800, '컬리'], [-5, 'out', 32000, '외식'], [-7, 'shop', 41000, '이마트몰'], [-9, 'shop', 33000, '한살림'], [-11, 'out', 9500, '국밥']].map(([d, k, won, memo]) => ({ d: 며칠(d), k, won, memo }))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4651/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
console.log(await p.evaluate(([재료, 식비]) => { const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null'); if (!s || !Array.isArray(s.recipes)) return '저장 전'; s.pantry = 재료.map(([name, expiry], i) => ({ id: 'seed' + i, name, icon: null, expiry, addedAt: Date.now() - i * 1000 })); s.foodCost = 식비.map((e, i) => ({ id: 'fc' + i, ...e })); s.foodBudget = { w: 150000, m: 600000 }; localStorage.setItem('hankki:v1', JSON.stringify(s)); return '심음' }, [재료, 식비]))
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
for (let i = 0; i < 8; i++) { const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (!(await 것.count()) || !(await 것.isVisible().catch(() => false))) break; await 것.click().catch(() => {}); await p.waitForTimeout(300) }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(900)
await p.locator('[data-coach="pantry"]').first().click(); await p.waitForTimeout(1600)
await p.screenshot({ path: join(밖, 'A1-냉장고.png') })
await p.mouse.wheel(0, 520); await p.waitForTimeout(900); await p.screenshot({ path: join(밖, 'A2-가진재료.png') })
await p.mouse.wheel(0, -2000); await p.waitForTimeout(500)
await p.locator('button, [role="tab"]').filter({ hasText: /^식비/ }).first().click(); await p.waitForTimeout(1600)
await p.screenshot({ path: join(밖, 'A3-식비.png') })
await p.mouse.wheel(0, 600); await p.waitForTimeout(900); await p.screenshot({ path: join(밖, 'A4-식비아래.png') })
await b.close(); srv.close(); console.log('✅', 밖)
