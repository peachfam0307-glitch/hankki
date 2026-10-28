// 🎥 ④편 대답1 「유통기한 임박한 것부터 알려줌」 — 냉장고에 재료를 심고 실제 앱을 녹화한다 (2026-10-21)
//   ⛔ 날짜는 todayKST() 에서 ±n일만 옮긴다(절대원칙 27) · 씨앗은 앱이 한 번 저장한 뒤 심는다(_shot-흐름릴스-0919 와 같은 길)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4631, r))
const 밖 = process.env.OUT || '/tmp/녹화-냉장고임박'
mkdirSync(밖, { recursive: true })
const { todayKST } = await import('../src/today.js')
const 며칠 = (n) => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 씨 = [['두부', 1], ['애호박', 2], ['우유', 3], ['대파', 6], ['달걀', 12], ['양파', 20], ['당근', 15], ['돼지고기', 4]]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const 준비 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
const 막기 = () => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } }
await 준비.addInitScript(막기)
const p0 = await 준비.newPage()
await p0.goto('http://127.0.0.1:4631/hankki/', { waitUntil: 'domcontentloaded' }); await p0.waitForTimeout(2500)
const 심음 = await p0.evaluate(([씨, 날]) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
  if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
  s.pantry = 씨.map(([이름], i) => ({ id: 'seed' + i, name: 이름, icon: null, expiry: 날[i], addedAt: Date.now() - i * 1000 }))
  localStorage.setItem('hankki:v1', JSON.stringify(s)); return '심었다 ' + s.pantry.length
}, [씨, 씨.map(([, n]) => 며칠(n))])
console.log('씨앗 =', 심음)
const 상태 = await 준비.storageState()
await 준비.close()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR', storageState: 상태, recordVideo: { dir: 밖, size: { width: 780, height: 1688 } } })
await ctx.addInitScript(막기)
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4631/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800)
for (let i = 0; i < 8; i++) { const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (!(await 것.count()) || !(await 것.isVisible().catch(() => false))) break; await 것.click().catch(() => {}); await p.waitForTimeout(300) }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(900)
await p.locator('[data-coach="pantry"]').first().click(); await p.waitForTimeout(2600)
await p.screenshot({ path: join(밖, '냉장고.png') })
await p.mouse.wheel(0, 300); await p.waitForTimeout(1500)
await p.close(); await ctx.close(); await b.close(); srv.close()
for (const f of readdirSync(밖)) if (f.endsWith('.webm')) renameSync(join(밖, f), join(밖, '녹화.webm'))
console.log('✅', 밖)
