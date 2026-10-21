// 📸 ①편 「레시피 모으기」 대답 장면용 앱 화면 — 가져오기 · 레시피 목록 · 인덱스 (2026-10-21) · 크림 테마 고정
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4663, r))
const 밖 = process.env.OUT || '/tmp/①대답'; mkdirSync(밖, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR', hasTouch: true })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki-theme', 'cream'); const 원래 = Element.prototype.setAttribute; Element.prototype.setAttribute = function (k, v) { if (k === 'data-season') return; return 원래.call(this, k, v) }; localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4663/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
const 탭 = async (이름) => { await p.locator('.bottom-nav .nav-item, nav button').filter({ hasText: 이름 }).first().click().catch(() => {}); await p.waitForTimeout(1300) }
await 탭('가져오기'); await p.screenshot({ path: join(밖, 'C1-가져오기.png') })
await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(500); await p.screenshot({ path: join(밖, 'C1-가져오기-아래.png') })
await 탭('레시피'); await p.screenshot({ path: join(밖, 'C2-목록.png') })
const 클립 = p.locator('[aria-label*="인덱스"]'); console.log('인덱스 단추', await 클립.count())
for (let i = 0; i < 3; i++) { await 클립.nth(i).click().catch(() => {}); await p.waitForTimeout(500) }
await p.screenshot({ path: join(밖, 'C4-인덱스.png') })
console.log(await p.evaluate(() => [...document.querySelectorAll('button')].map((e) => e.textContent.trim()).filter((t) => t && t.length < 14).slice(0, 60).join(' | ')))
await b.close(); srv.close()
