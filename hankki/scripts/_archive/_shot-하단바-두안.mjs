// 📸 하단바 두 안을 «나란히» — 창업자가 눈으로 고른다 (2026-08-07 *"두가지 다 해보자"*)
//   A = 여섯 (가져오기 그대로 ＋ 일기)      B = 다섯 (가져오기를 빼고 그 자리에 일기)
// ⭐ 홈에 「＋ 가져오기」 버튼이 **이미** 있다(HomeScreen 상단) → B 안이라고 못 쓰게 되는 게 아니다.
//    그래서 B 판엔 홈 화면도 같이 찍어 «어디서 가져오기를 누르나»를 보여준다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/하단바-두안'
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
await new Promise((r) => srv.listen(4412, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const cuts = {}

for (const [mode, name] of [['six', 'A-여섯'], ['fab', 'B-다섯']]) {
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(([s, m]) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:navmode', m)
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, [{ recipes: [], seedV: BASICS_VERSION }, mode])
  await page.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
  // 하단바만 잘라 «1:1 픽셀»로 견준다 — 화면 전체를 줄여 붙이면 칸 폭 차이가 안 보인다
  const nav = await page.locator('.bottom-nav').boundingBox()
  cuts[name] = (await page.screenshot({ clip: { x: Math.round(nav.x), y: Math.round(nav.y), width: Math.round(nav.width), height: Math.round(nav.height) } })).toString('base64')
  await page.screenshot({ path: join(OUT, `${name}-홈.png`) })
  // 「일기」 탭을 눌러 실제로 한끼 일기가 열리나
  const d = page.getByRole('button', { name: '일기', exact: true }).first()
  if (await d.count()) { await d.click(); await page.waitForTimeout(1200); await page.screenshot({ path: join(OUT, `${name}-일기탭.png`) }) }
  console.log('  📸', name)
  await page.close()
}

// 🧩 하단바 둘을 위아래로 붙여 놓고 본다 — 같은 폭이라 칸 차이가 바로 보인다
const gp = await b.newPage()
await gp.setViewportSize({ width: 1400, height: 900 })
await gp.setContent(`<style>
  body{margin:0;background:#2a2723;color:#fff;font-family:system-ui,sans-serif;padding:30px}
  h1{font-size:30px;margin:0 0 4px} p{font-size:18px;margin:0 0 22px;color:#e5cf9e}
  .row{margin-bottom:26px} .tag{font-size:22px;font-weight:800;margin-bottom:8px}
  .sub{font-size:16px;color:#cfc6b4;margin-bottom:8px}
  img{display:block;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
</style>
<h1>Bottom bar - two options</h1><p>360px phone / actual pixels (x3)</p>
${Object.entries(cuts).map(([k, v]) => `<div class="row"><div class="tag">${k === 'A-여섯' ? 'A : 6 tabs' : 'B : 5 tabs'}</div>
  <div class="sub">${k === 'A-여섯' ? 'home / import / recipe / DIARY / shop / share  -  cell 60px' : 'home / recipe / DIARY / shop / share  -  cell 72px  (import stays on Home top)'}</div>
  <img src="data:image/png;base64,${v}"></div>`).join('')}`, { waitUntil: 'load' })
await gp.waitForTimeout(600)
const h = await gp.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height))
await gp.setViewportSize({ width: 1400, height: h + 40 }); await gp.waitForTimeout(300)
await gp.screenshot({ path: join(OUT, '0-하단바-비교.png') })
console.log('  📸 0-하단바-비교')

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
