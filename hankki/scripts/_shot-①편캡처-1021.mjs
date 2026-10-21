// 📸 ①편 질문2 «갤러리» 폰 화면에 깔 레시피 캡처 — 앱 레시피 상세를 여러 편 찍는다 (2026-10-21)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4662, r))
const 밖 = process.env.OUT || '/tmp/①캡처'; mkdirSync(밖, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR', hasTouch: true })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki-theme', 'cream'); const 원래 = Element.prototype.setAttribute; Element.prototype.setAttribute = function (k, v) { if (k === 'data-season') return; return 원래.call(this, k, v) }; localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4662/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
await p.locator('.bottom-nav .nav-item, nav button').filter({ hasText: '레시피' }).first().click().catch(() => {}); await p.waitForTimeout(1200)
await p.screenshot({ path: join(밖, '목록.png') })
const 이름들 = await p.evaluate(() => [...document.querySelectorAll('main *, #root *')].filter((e) => e.children.length === 0 && !e.closest('nav') && e.getBoundingClientRect().top > 450).map((e) => e.textContent.trim()).filter((t) => t.length > 2 && t.length < 20 && !/^[0-9 ]+$|샘플/.test(t)))
let n = 0
for (const 이름 of [...new Set(이름들)]) { if (n >= 14) break
  const 것 = p.locator('text=' + 이름).first(); if (!(await 것.isVisible().catch(() => false))) continue
  await 것.click().catch(() => {}); await p.waitForTimeout(1300)
  if (await p.locator('text=재료').first().isVisible().catch(() => false)) { await p.screenshot({ path: join(밖, 'r' + String(n).padStart(2, '0') + '.png') }); n++ }
  await p.goBack().catch(() => {}); await p.waitForTimeout(900) }
console.log('찍은 수', n); await b.close(); srv.close()
