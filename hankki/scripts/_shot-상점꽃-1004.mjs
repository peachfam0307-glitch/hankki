// 📸 한끼상점 카드 — 창업자 그림(꽃 화분 가게) 크게 (2026-10-04 「적용해봐 · 좀 크게」) · 앱 코드는 안 고친다
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body) })
await new Promise((r) => srv.listen(4395, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const IMG = 'data:image/png;base64,' + readFileSync(new URL('../src/assets/ui/hankki_shop.png', import.meta.url)).toString('base64')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.click('button[aria-label="설정"]'); await p.waitForTimeout(1200)
await p.evaluate((img) => {
  const h = [...document.querySelectorAll('*')].find((e) => e.childElementCount === 0 && e.textContent.trim() === '내 것 지키기')
  const sz = 64
  h?.insertAdjacentHTML('beforebegin', `<div style="display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:12px 16px;margin:14px 0 18px">
    <span style="width:${sz}px;height:${sz}px;flex:none;background:url(${img}) no-repeat center/contain"></span>
    <div style="flex:1"><div style="font-weight:800;font-size:17px">한끼상점</div><div style="color:var(--text-sub);font-size:13.5px;margin-top:3px">레시피열쇠 · 레꾸팩</div></div>
    <span style="color:var(--text-sub);font-size:20px">›</span></div>`)
}, IMG)
await p.screenshot({ path: join(OUT, '새아이콘-설정.png'), clip: { x: 0, y: 0, width: 390, height: 560 } })
await p.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
await p.getByText('가져오기', { exact: true }).first().click(); await p.waitForTimeout(1000)
await p.screenshot({ path: join(OUT, '새아이콘-가져오기.png'), clip: { x: 0, y: 0, width: 390, height: 560 } })
await p.getByText('한끼 앱에서 사진 가져오기').first().click(); await p.waitForTimeout(1000)
await p.screenshot({ path: join(OUT, '새아이콘-사진안내.png'), clip: { x: 0, y: 0, width: 390, height: 420 } })
await b.close(); srv.close()
