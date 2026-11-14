// 🛒 장보기 위 탭(장보기·식비·냉장고) 안 고른 칸 대비 시안 — 지금 / 1번 / 2번 (2026-11-14)
import { chromium } from 'playwright'
import { createServer } from 'http'; import { readFileSync, existsSync } from 'fs'; import { join, extname } from 'path'
const root = new URL('../dist', import.meta.url).pathname, 밖 = process.argv[2] || '.'
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || !extname(p)) p = '/index.html'; const f = join(root, p); if (!existsSync(f)) { s.statusCode = 404; return s.end() } s.setHeader('content-type', { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }[extname(f)] || 'application/octet-stream'); s.end(readFileSync(f)) }).listen(5180)
const 시안 = {
  '0-지금': '',
  '1-글씨진하게': '.seg:not(.on){color:var(--text)!important;font-weight:700!important}',
  '2-흰칸': '.segment{gap:4px}.seg:not(.on){color:var(--text)!important;font-weight:700!important;background:var(--surface)!important;box-shadow:0 1px 3px rgba(0,0,0,.08)}',
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })
for (const 테마 of ['apricot', 'dark']) for (const [이름, css] of Object.entries(시안)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR', serviceWorkers: 'block' })
  await ctx.addInitScript((t) => { try { for (const k of ['hankki:nudge:giftpack', 'hankki:nudge:cloudgate', 'hankki:onboarded', 'hankki:news:off']) localStorage.setItem(k, '1'); localStorage.setItem('hankki-theme', t); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch {} }, 테마)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:5180/hankki/shop?식비=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  await p.locator('nav >> text=장보기').last().click(); await p.waitForTimeout(1500)
  if (css) await p.addStyleTag({ content: css })
  const pt = p.locator('.seg', { hasText: '냉장고' }); if (await pt.count()) await pt.first().click(); await p.waitForTimeout(600)
  await p.screenshot({ path: `${밖}/탭-${테마}-${이름}.png`, clip: { x: 0, y: 0, width: 390, height: 300 } })
  await ctx.close()
}
await b.close(); srv.close()
