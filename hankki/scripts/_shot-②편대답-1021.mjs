// 📸 ②편 「요리할 때」 대답 장면용 앱 화면 — 인분 · 요리모드(폰·패드) · 단계 타이머(알람 소리 고르기) (2026-10-21)
//   🎨 크림 테마 고정 · 할로윈 보라 막음(④편과 같은 길) · 📮 창업자 = *"패드랑 요리모드 둘다 넣어줘(크게볼수있는 거니까)"* · *"알람설정할 수 있는가 넣어주고"*
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4661, r))
const 밖 = process.env.OUT || '/tmp/②편대답'; mkdirSync(밖, { recursive: true })
const 레시피 = process.env.RECIPE || '어남선생 두부조림'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
async function 판(이름, vp, 일) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 3, locale: 'ko-KR', hasTouch: true })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki-theme', 'cream'); const 원래 = Element.prototype.setAttribute; Element.prototype.setAttribute = function (k, v) { if (k === 'data-season') return; return 원래.call(this, k, v) }; localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4661/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  for (let i = 0; i < 8; i++) { const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (!(await 것.count()) || !(await 것.isVisible().catch(() => false))) break; await 것.click().catch(() => {}); await p.waitForTimeout(300) }
  await p.locator('.bottom-nav .nav-item, .side-nav .nav-item, nav button').filter({ hasText: '레시피' }).first().click().catch(() => {}); await p.waitForTimeout(1200)
  await p.locator('text=' + 레시피).first().click(); await p.waitForTimeout(1600)
  await 일(p); await ctx.close()
}
await 판('폰', { width: 390, height: 844 }, async (p) => {
  const 늘 = p.getByRole('button', { name: '늘리기' }).first(); await 늘.scrollIntoViewIfNeeded(); await p.waitForTimeout(400)
  await p.screenshot({ path: join(밖, 'B3-인분-전.png') })
  await 늘.click(); await p.waitForTimeout(300); await 늘.click(); await p.waitForTimeout(600)
  await p.screenshot({ path: join(밖, 'B3-인분-후.png') })
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1500)
  await p.locator('button:has-text("시작")').filter({ hasText: '재료 준비' }).first().click().catch(() => {}); await p.waitForTimeout(1300)
  await p.screenshot({ path: join(밖, 'B1-요리모드-폰.png') })
  const 타 = p.locator('button:has-text("타이머 맞추기")').first()
  if (await 타.count()) { await 타.click(); await p.waitForTimeout(1200); await p.screenshot({ path: join(밖, 'B2-타이머.png') }) } else console.log('⚠️ 타이머 단추 못 찾음')
})
await 판('패드', { width: 820, height: 1180 }, async (p) => {
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1500)
  await p.locator('button:has-text("시작")').filter({ hasText: '재료 준비' }).first().click().catch(() => {}); await p.waitForTimeout(1300)
  await p.screenshot({ path: join(밖, 'B4-요리모드-패드.png') })
})
await b.close(); srv.close(); console.log('✅', 밖)
