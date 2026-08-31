// ☁️📸 클라우드 전체 화면을 «진짜 앱에서» 찍는다 — 창업자 검수용 (2026-08-21)
//   ⛔ 손으로 그린 그림이 아니다. 빌드한 앱을 띄워 실제로 눌러서 찍는다(절대원칙 30).
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'
const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4606, r))
const b = await chromium.launch()
const 있는것 = { recipes: [{ id: 'u1', title: '내가 쓴 레시피', ingredients: [], steps: [] }], folders: [], profile: { name: '한끼러버', bio: '맛있는 한 끼로 행복한 하루 :)' }, shops: [], wishlist: [], shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [] }

async function 창 (init) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript(SEED_COACH_SEEN)
  if (init) await pg.addInitScript(init)
  await pg.goto('http://localhost:4606/hankki/', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1600)
  return { ctx, pg }
}

// ① 첫 화면 (닫힌 상태) ② 자세히 편 것 ③ 「나중에 하기」 팝업
{
  const { ctx, pg } = await 창()
  await pg.screenshot({ path: '/tmp/검수1-첫화면.png' })
  // ⛔ `.first()` 는 «홈 한 줄»을 집는다 — 같은 문장이 세 곳(첫화면·홈·설정)에 있고 홈이 DOM 에서 앞이라
  //    첫 화면이 그 위를 덮어 클릭이 «가로채인다». 첫 화면은 맨 나중에 그려지므로 `.last()`.
  //    📌 문구를 통일한 대가다 — 통일이 맞고, 잣대를 좁히는 게 맞다.
  await pg.getByText('로그인하면 새 폰에서도 이어서 써요').last().click(); await pg.waitForTimeout(400)
  await pg.screenshot({ path: '/tmp/검수2-자세히.png' })
  await pg.getByText('나중에 하기').first().click(); await pg.waitForTimeout(600)
  await pg.screenshot({ path: '/tmp/검수3-나중에팝업.png' })
  console.log('✅ ①②③ 첫 화면 셋')
  await ctx.close()
}

// ④ 홈 한 줄 ⑤ 설정 카드 ⑥ 설정 시트 ⑦ 시트 자세히
{
  const { ctx, pg } = await 창(() => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:v1', JSON.stringify({ recipes: [{ id: 'u1', title: '내가 쓴 레시피', ingredients: [], steps: [] }], folders: [], profile: { name: '한끼러버', bio: '맛있는 한 끼로 행복한 하루 :)' }, shops: [], wishlist: [], shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [] }))
  })
  await pg.screenshot({ path: '/tmp/검수4-홈한줄.png' })
  await pg.locator('button[aria-label="설정"]').first().click(); await pg.waitForTimeout(900)
  await pg.screenshot({ path: '/tmp/검수5-설정카드.png', fullPage: true })
  await pg.getByText('클라우드 저장', { exact: true }).first().click(); await pg.waitForTimeout(1300)
  await pg.screenshot({ path: '/tmp/검수6-설정시트.png' })
  const 자 = pg.getByText('로그인하면 새 폰에서도 이어서 써요')
  if (await 자.count()) { await 자.last().click(); await pg.waitForTimeout(400); await pg.screenshot({ path: '/tmp/검수7-시트자세히.png' }) }
  console.log('✅ ④⑤⑥⑦ 홈·설정')
  await ctx.close()
}
await b.close(); srv.close()
