// 📸 닭곰탕·오이물김치 «앱 화면 그대로» — 창업자 확인용 (2026-08-12)
//    📮 창업자 *"레시피 올리기전에 나한테 꼭 확인하고 올리라고 얘기했었는데.."* → 맞다. 실물을 보여준다.
//    ⛔ 코드 글자를 옮겨 적지 않는다 — 유저가 보는 화면을 그대로 찍는다(규칙 21).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4407, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 90)))
await pg.goto('http://127.0.0.1:4407/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(1200)

const 닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = pg.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await pg.waitForTimeout(200) }
  }
}
await 닫기()

for (const [제목, 파일] of [['닭곰탕', '레시피-닭곰탕.png'], ['오이물김치', '레시피-오이물김치.png']]) {
  await pg.getByRole('button', { name: /레시피/ }).last().click(); await pg.waitForTimeout(700); await 닫기()
  const 찾기 = pg.locator('input[type="search"], input[placeholder*="찾"], input[placeholder*="검색"]').first()
  if (await 찾기.count()) { await 찾기.fill(제목); await pg.waitForTimeout(900) }
  // ⛔⛔ 첫 판은 «맨 앞 카드»를 눌러 **콩국수**를 찍었다 — 찾기가 안 걸렸는데 그냥 첫 칸을 누른 것이다.
  //    보내기 전에 열어봐서 잡았다(규칙 21). ✅ **제목이 들어간 카드**를 콕 집는다. 못 찾으면 «폴백 없이» 넘긴다.
  const 카드 = pg.locator('.grid-card', { hasText: 제목 }).first()
  if (!(await 카드.count())) { console.log('⛔', 제목, '— 그 제목의 카드를 못 찾았다(찾기가 안 걸렸다)'); continue }
  await 카드.click(); await pg.waitForTimeout(1200); await 닫기()
  // ⚠️ 「열렸나」를 화면 글자로 확인한다 — 엉뚱한 편을 찍어 보내면 그게 제일 나쁘다(규칙 21)
  const 글 = await pg.evaluate(() => document.body.innerText)
  if (!글.includes(제목)) { console.log('⛔', 제목, '— 다른 화면이 열렸다'); continue }
  // ⛔⛔  만으론 «화면 한 장»만 찍힌다 — 우리 앱은  이 «안에서» 굴러가서
  //    페이지 자체는 안 길다. 첫 판이 그래서 재료·순서가 통째로 안 찍혔다(열어보고 잡았다 · 규칙 21).
  //    ✅ 찍는 «동안»만 그 칸을 펼친다 — 앱을 고치는 게 아니라 카메라를 고치는 것이다.
  await pg.evaluate(() => {
    const s = document.querySelector('.screen')
    if (s) { s.style.height = 'auto'; s.style.maxHeight = 'none'; s.style.overflow = 'visible'; s.scrollTop = 0 }
    for (const sel of ['.app-frame', '#root']) {
      const e = document.querySelector(sel)
      if (e) { e.style.height = 'auto'; e.style.maxHeight = 'none'; e.style.overflow = 'visible' }
    }
    // 아래 고정 줄(요리 시작·만들었어요)은 찍는 동안 감춘다 — 글을 덮는다
    for (const e of document.querySelectorAll('.detail-actions, .bottom-bar, nav')) e.style.display = 'none'
    document.body.style.height = 'auto'; document.body.style.overflow = 'visible'
  })
  await pg.waitForTimeout(500)
  await pg.screenshot({ path: join(OUT, 파일), fullPage: true })
  const 높이 = await pg.evaluate(() => document.documentElement.scrollHeight)
  console.log('   찍은 높이', 높이, 'px', 높이 < 1200 ? '⛔ 너무 짧다 — 아직 안 펼쳐졌다' : '')
  console.log('✅', 제목, '찍음 —', 파일)
  await pg.goBack().catch(() => {}); await pg.waitForTimeout(700)
}
await b.close(); srv.close(); process.exit(0)
