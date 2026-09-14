// 📸🏠 소소 기능 캐러셀 2편 「홈이 알아서」 앱 화면 재료 (2026-09-06)
//
// 📮 창업자 20:13 확정 묶음 ② = 제철 · 우리집 · SNS 영상칩 · 다른 추천 · 자주 해먹는 · 검색/폴더/북마크
// 📮 창업자 23:50 = *"패드 되는 것도 한 줄 넣어줘"* → 패드(820×1180) 홈도 한 장 찍는다
//
// ⭐ 재료는 «UI 로» 넣는다 — 「만들었어요」를 눌러 cooked 를 쌓아야 「자주 해먹는 요리」 줄이 뜬다.
// ⭐ 규칙 21 — 찍고 «열어 보고» 판정한다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_shot-소소홈-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || join(ROOT, 'design/promo/소소기능-앱화면-2509/홈')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4432, r))
const URL0 = 'http://127.0.0.1:4432/hankki/'

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 문닫기 = (ctx) => ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN); await 문닫기(ctx)
const p = await ctx.newPage()
const 쉼 = (ms) => p.waitForTimeout(ms)
const 찍 = async (이름, pg = p) => { await pg.screenshot({ path: join(OUT, 이름 + '.png') }); console.log('  📸', 이름) }
const 탭 = async (글자) => { await p.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click(); await 쉼(1100) }
const 맨위 = () => p.evaluate(() => { document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0 }); window.scrollTo(0, 0) })
const 보이게 = async (loc, block = 'center') => { await loc.evaluate((el, block) => el.scrollIntoView({ block }), block); await 쉼(500) }

await p.goto(URL0, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await 쉼(900)

// ── ① 창업자 백업(2026-09-07 · 레시피 269 · 만든 것 14 · 책갈피 12 · 폴더 12)을 «앱 UI 로» 불러온다 ─────
//    📮 창업자 = *"옛화면 그만찍고 요즘 화면찍어"* · *"이것도 예전꺼 찍기 금지. 최신 json파일 내가 줬잖아"*
//    ⛔ 시드 화면으로 찍지 않는다 — 실제 창업자 폰과 같은 데이터로 찍는다.
const 백업 = process.env.BACKUP || join(ROOT, 'docs/_내레시피-백업/2026-09-07.json')
await p.locator('button[aria-label="설정"]').first().click(); await 쉼(900)
// 「백업 파일 불러오기」는 설정의 「백업」 카드를 눌러 여는 시트 «안»에 있다
const 백업카드 = p.locator('[data-coach="backup"]').first(); await 백업카드.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(300); await 백업카드.click(); await 쉼(900)
// ⛔ 「백업 파일 불러오기」(파일 고르기)는 Playwright 에선 onChange 가 안 난다(filechooser·setInputFiles 둘 다 12초 기다려도 시트 없음 · _probe-백업시트-0907)
//    → 「코드 붙여넣기로 불러오기」에 JSON 글자를 통째로 넣는다. 앱 쪽 흐름은 둘 다 같은 importFromText/불러오기끝 이다.
const 불러 = p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).first()
await 불러.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(300)
await 불러.click(); await 쉼(700)
await p.locator('textarea:visible').first().evaluate((el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }, readFileSync(백업, 'utf8'))
await 쉼(400); await p.getByRole('button', { name: '불러오기', exact: true }).last().click()
// ⏳ 7MB 를 읽고 파싱한 뒤에야 확인 시트(「레시피 N개가 담긴 백업이에요」)가 뜬다 — 뜰 때까지 기다린다(1.5초로는 안 떠서 시드 70편을 찍었었다)
await p.getByText(/레시피 \d+개가 담긴 백업/).waitFor({ timeout: 60000 })
await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await 쉼(5000)
console.log('  📦 백업 불러옴 →', 백업.split('/').pop())
await p.goto(URL0, { waitUntil: 'networkidle' }); await 쉼(1200)

const 덤프 = async (이름) => {
  const r = await p.evaluate(() => ({
    카드: [...document.querySelectorAll('.card,.h-section,[data-coach]')].map((e) => (e.dataset.coach ? '@' + e.dataset.coach : '') + '·' + (e.textContent || '').slice(0, 34).replace(/\s+/g, ' ')).slice(0, 26),
    시트: [...document.querySelectorAll('.sheet-mask,.sheet')].map((e) => e.className),
    타일: document.querySelectorAll('.album-tile').length,
    포스트잇: document.querySelectorAll('.memo-note').length,
  }))
  console.log('\n=== ' + 이름, JSON.stringify(r, null, 1))
}
await 탭('홈'); await 맨위(); await 쉼(900); await 덤프('홈')
await 탭('레시피'); await 맨위(); await 쉼(900); await 덤프('레시피')
await 탭('홈'); await 맨위(); await 쉼(900)
console.log('mini-card 수', await p.locator('.mini-card').count())
await 탭('레시피'); await 맨위(); await 쉼(900)
console.log('레시피탭 클릭거리', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('main a,main button,[role=button]')].map(e=>e.className).filter(c=>typeof c==='string'&&c).slice(0,30))))
await 탭('홈'); await 맨위(); await 쉼(600)
const 자주 = p.locator('.h-section', { hasText: '자주 해먹는' }).first()
if (await 자주.count()) { await 보이게(자주, 'start'); await 쉼(600); console.log('보이게 뒤 mini-card', await 자주.locator('.mini-card').count()) }
await 탭('일기'); await 맨위(); await 쉼(900); await 덤프('일기')
const 타일 = p.locator('.album-tile').first()
if (await 타일.count()) { await 타일.click(); await 쉼(1500); console.log('타일 누른 뒤 포스트잇', await p.locator('.memo-note').count(), '· 요리단추', await p.locator('[data-coach="cook"]').count()) }
const dw = p.locator('[data-coach="diary-write"]').first()
if (await dw.count()) { await dw.click(); await 쉼(1500); await 덤프('일기쓰기-누른뒤') }
await b.close(); srv.close()
