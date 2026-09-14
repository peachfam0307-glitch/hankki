import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage(); await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
for (const 글자 of ['나중에 볼게요', '확인', '닫기']) { const t = p.getByRole('button', { name: 글자 }).first(); if (await t.count()) { await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(400) } }
const box = p.locator('.week-pair').first(); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(500)
await p.screenshot({ path: process.env.SCRATCH + '/홈-제철2편.png' }); console.log('✅')
await b.close(); srv.close()
