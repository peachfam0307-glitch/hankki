// 🎬 [2026-11-11] 예고 릴스 — 다 붙인 «다음» 완성 표지가 «정상 속도로 움직이는» 장면 (창업자 「다 붙인다음에 정상적으로 움직이는거 1초보여줘 레시피 두개다」)
//    ⛔ 꾸미기 화면은 움직임이 멈춰 있고, zoom 고화질은 상세 화면 칸이 깨진다(실측) → 상세 표지를 DSF 2.77 «낱장»으로 찍는다
//    ⭐ CSS 움직임을 CDP 로 1/5 배속으로 늦추고 낱장을 연달아 찍은 뒤 → 굽기에서 «찍은 동안 흐른 애니 시간» 기준 정상 속도로 맞춘다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const 앱 = join(dirname(fileURLToPath(import.meta.url)), '..'); const DIST = join(앱, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4623, r))
const 밖 = process.env.OUT || '/tmp/claude-0/릴스-크리스마스예고-완성본'; mkdirSync(밖, { recursive: true })
const 배속 = Number(process.env.RATE || 0.05), 애니초 = Number(process.env.ANI || 1.6)
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const 이름 of ['어묵탕', '스키야키']) {
  const 폴더 = join(밖, 이름); mkdirSync(폴더, { recursive: true })
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1080 / 390, locale: 'ko-KR' })
  await ctx.clock.install({ time: new Date('2026-12-01T11:00:00Z') })
  await ctx.addInitScript(() => { try { for (const k of ['hankki:nudge:giftpack', 'hankki:nudge:cloudgate', 'hankki:onboarded', 'hankki:news:off', 'hankki:열쇠:크리스마스']) localStorage.setItem(k, '1'); localStorage.setItem('hankki-theme', 'apricot'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4623/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(1200)
  const 그것 = p.locator(`text=${이름}`).first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
  await 그것.scrollIntoViewIfNeeded(); await 그것.click({ force: true }); await p.waitForTimeout(3000)
  const cdp = await ctx.newCDPSession(p); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 배속 })
  const t0 = Date.now(); let n = 0
  while ((Date.now() - t0) / 1000 * 배속 < 애니초) { await p.screenshot({ path: join(폴더, `f${String(n).padStart(4, '0')}.png`) }); n++ }
  const 흐른 = (Date.now() - t0) / 1000 * 배속
  writeFileSync(join(폴더, '낱장.json'), JSON.stringify({ 장수: n, 애니초: 흐른, fps: n / 흐른 }))
  console.log('✅', 이름, n, '장 ·', 흐른.toFixed(2), '초 분량 · fps', (n / 흐른).toFixed(1))
  await ctx.close()
}
await b.close(); srv.close()
