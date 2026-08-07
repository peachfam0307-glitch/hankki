// 📸 2026-08-07 다섯 번째 검수판 — 창업자 폰 제보 셋 (규칙 13 · 고화질)
//   ⓐ 스티커 붙이고 빈 종이 탭 → 글쓰기로 튀던 것   ⓑ 길게 눌러 늘릴 때 구글 검색 뜨던 것
//   ⓒ 글쓰기 탭에서 «본문» 글씨체 고르기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0807-4'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4404, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'lined', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
await page.goto('http://127.0.0.1:4404/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log('  📸', n) }

// ⓐ 일꾸에서 셋을 붙이고 빈 자리를 눌러 보기 — 탭이 그대로여야 한다
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
const chips = page.locator('.decor-drawer .decor-sec img')
for (let i = 0; i < Math.min(3, await chips.count()); i++) { await chips.nth(i).click(); await page.waitForTimeout(450) }
const st = await page.locator('.decor-stage .paper').first().boundingBox()
await page.mouse.click(st.x + st.width * 0.22, st.y + st.height * 0.7); await page.waitForTimeout(700)
await shot('1-일꾸에서-셋-붙이고-빈종이-탭')

// ⓒ 글쓰기 탭 — 본문 글씨체 줄
await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(800)
const ta = page.locator('.decor-stage textarea').first()
if (await ta.count()) { await ta.fill('오늘도 한 끼 해냈다\n맛있겠다  5분 컷'); await page.waitForTimeout(600) }
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700)
await shot('2-글쓰기-글씨체줄-귀염체')

for (const name of ['삐뚤체', '몽글체', '납작체']) {
  const btn = page.locator('.decor-drawer button').filter({ hasText: new RegExp(`^${name}$`) })
  if (!(await btn.count())) continue
  await btn.first().click(); await page.waitForTimeout(700)
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600)
  await shot(`3-글쓰기-${name}`)
}

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
