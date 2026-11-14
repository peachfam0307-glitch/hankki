// 📸🎨 꾸미기 서랍 탭마다 «조각을 이름표와 함께» 찍는다 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"내꺼랑 똑같은 자리에 정확하게 얹어야해"* ＋ *"다 재고 시뮬레이션 돌려놓고 한번에 가~"*
// ⭐ 왜 필요한가 = 창업자 카드에 쓰인 조각의 «이름(key)»을 알아야 똑같이 얹는다.
//    ⛔ 문서에서 이름을 «짐작»하지 않는다 — 서랍을 열어 찍고 눈으로 맞춘다(규칙 18).
//    ⭐ 조각 단추의 aria-label 이 곧 key 다(DecorEditor.jsx:946).
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_shot-꾸미기서랍-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4616, r))
const 밖 = process.env.OUT || '/tmp/claude-0/꾸미기서랍'
mkdirSync(밖, { recursive: true })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR' })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
await ctx.clock.setFixedTime(new Date('2026-12-01T11:00:00Z'))
const p = await ctx.newPage()
const 안내치우기 = async () => {
  let 맑음 = 0
  for (let i = 0; i < 20; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() > 0 && await 것.isVisible().catch(() => false)) {
      try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(250); continue } catch { /* 다시 */ }
    }
    if (await p.locator('.sheet-mask, button:has-text("건너뛰기")').count() === 0) { 맑음++; if (맑음 >= 2) return }
    else 맑음 = 0
    await p.waitForTimeout(500)
  }
}
await p.goto('http://127.0.0.1:4616/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200); await 안내치우기()

// 🍤 창업자 카드와 «같은 레시피»로 연다 — 새우관자전(basic-saeu-gwanja-jeon)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1200); await 안내치우기()
const 것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
await 것.scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
await 것.click({ force: true }); await p.waitForTimeout(1500); await 안내치우기()
await p.locator('[data-coach="decor"]').first().click({ force: true })
await p.waitForTimeout(1600); await 안내치우기()

// 🎄 [2026-11-14] 친구들 탭 — 겨울·크리스마스 장면 8컷(xk_s01~08) 이 서랍에 뜨나 (12/1 시계)
await p.locator('button').filter({ hasText: /^친구들$/ }).first().click({ force: true }); await p.waitForTimeout(1200)
const 칸 = await p.locator('.decor-cell').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
console.log('xk_s 칸 =', 칸.filter((k) => k && k.startsWith('xk_s')).join(' '))
for (const k of ['xk_s05', 'xk_s01']) {
  const c = p.locator(`.decor-cell[aria-label="${k}"]`).first()
  if (await c.count()) { await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await p.screenshot({ path: join(밖, '친구들-' + k + '.png') }) }
  else console.log('  ⚠️ 못 찾음', k)
}
await b.close(); srv.close()
