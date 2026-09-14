import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4434, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage(); p.on('console', (m) => { if (m.type() === 'error') console.log('  console.error:', m.text().slice(0, 200)) })
await p.goto('http://127.0.0.1:4434/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
const 잰다 = async (표) => console.log(표, await p.evaluate(() => { const ks = Object.keys(localStorage).filter((k) => /hankki/.test(k)); const out = {}; for (const k of ks) { try { const v = JSON.parse(localStorage.getItem(k)); if (v && Array.isArray(v.recipes)) { const rs = v.recipes; out[k] = { n: rs.length, src: rs.reduce((a, r) => (a[r.source] = (a[r.source] || 0) + 1, a), {}), top: [...rs].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).slice(0, 4).map((r) => r.title + '@' + new Date(r.savedAt).toISOString().slice(5, 16)), cooked: rs.filter((r) => r.cooked > 0).length, diary: (v.diary || []).length } } } catch {} } return out }))
await 잰다('① 처음')
await p.locator('button[aria-label="설정"]').first().click(); await p.waitForTimeout(900)
const 카드 = p.locator('[data-coach="backup"]').first(); await 카드.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 카드.click(); await p.waitForTimeout(900)
const 불러 = p.getByRole('button', { name: '백업 파일 불러오기' }).first()
const [ch] = await Promise.all([p.waitForEvent('filechooser'), 불러.click()]); await ch.setFiles(join(ROOT, 'docs/_내레시피-백업/2026-09-07.json'))
// ⏳ 7MB 를 읽고 파싱한 뒤에야 확인 시트(「레시피 N개가 담긴 백업이에요」)가 뜬다 — 뜰 때까지 기다린다(1.5초로는 안 떠서 시드 70편을 찍고 있었다)
await p.getByText(/레시피 \d+개가 담긴 백업/).waitFor({ timeout: 60000 })
await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await p.waitForTimeout(5000)
await 잰다('② 불러온 뒤')
await p.goto('http://127.0.0.1:4434/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await 잰다('③ 다시 켠 뒤')
await b.close(); srv.close()
