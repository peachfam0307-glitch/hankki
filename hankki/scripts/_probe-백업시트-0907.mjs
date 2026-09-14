import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4435, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN); await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage(); p.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) console.log('  console:', m.text().slice(0, 300)) }); p.on('pageerror', (e) => console.log('  pageerror:', String(e).slice(0, 300)))
await p.goto('http://127.0.0.1:4435/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.locator('button[aria-label="설정"]').first().click(); await p.waitForTimeout(900)
const 카드 = p.locator('[data-coach="backup"]').first(); await 카드.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 카드.click(); await p.waitForTimeout(900)
console.log('  input file 개수:', await p.locator('input[type=file][accept*=json]').count())
const 불러 = p.getByRole('button', { name: '백업 파일 불러오기' }).first()
// 파일 경로(filechooser · setInputFiles 둘 다)로는 onChange 가 안 났다 → 「코드 붙여넣기로 불러오기」에 JSON 글자를 통째로 넣는다
await p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).first().click(); await p.waitForTimeout(700)
const 글 = readFileSync(join(ROOT, 'docs/_내레시피-백업/2026-09-07.json'), 'utf8')
const ta = p.locator('textarea:visible').first(); await ta.evaluate((el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }, 글)
await p.waitForTimeout(500); await p.getByRole('button', { name: '불러오기', exact: true }).last().click()
await p.getByText(/레시피 \d+개가 담긴 백업/).waitFor({ timeout: 60000 }); console.log('  ✅ 확인 시트 떴다')
await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await p.waitForTimeout(6000)
console.log('  저장소:', await p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const v = JSON.parse(localStorage.getItem(k)); if (v && Array.isArray(v.recipes)) { const rs = v.recipes; return { k, n: rs.length, src: rs.reduce((a, r) => (a[r.source] = (a[r.source] || 0) + 1, a), {}), cooked: rs.filter((r) => r.cooked > 0).length, diary: (v.diary || []).length, top: [...rs].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).slice(0, 5).map((r) => r.title) } } } catch {} } return null }))
await p.screenshot({ path: process.env.OUT + '/백업시트.png' })
await b.close(); srv.close()
