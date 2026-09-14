// 📸 로그인 안내 팝업 시안 — 테마 셋(그레이지·살구·다크)에서 «실물로» 찍는다 (창업자 「시안 보여줘」용 · 규칙 21)
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-로그인안내-0편-0908.mjs   → OUT 폴더에 png 셋
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
// ⛔ SEED_COACH_SEEN 을 쓰면 «이 팝업도» 본 상태가 된다(열쇠가 코치 접두어 아래) → 코치 열쇠만 «이름으로» 심는다
import { COACH } from '../src/coach.js'
const COACH_KEYS = Object.values(COACH).filter((k) => k !== COACH.loginpop) // ⭐ 이 팝업 열쇠만 «빼고» 심는다
import { THEME_KEY } from '../src/theme.js'

const OUT = process.env.OUT || '/tmp/shot-로그인안내-0편-0908'
mkdirSync(OUT, { recursive: true })
const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

for (const [이름, 편수] of [['0편', 0], ['쌓인사람', 12]]) {
  const theme = 'greige'
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript((ks) => { ks.forEach((k) => localStorage.setItem(k, '1')) }, COACH_KEYS)
  // ⛔⛔ `편수` 를 «인자로» 넘긴다 — addInitScript 는 함수를 글자로 말아 브라우저에 넣는다.
  //    바깥 변수를 그냥 쓰면 «브라우저 안에서 ReferenceError» 가 나고, 이 스크립트는 «조용히» 통째로 안 돌아
  //    저장 데이터가 하나도 안 심긴다 → 두 시안이 «똑같은 0편 화면» 으로 찍힌다(2026-09-08 실제 사고).
  await pg.addInitScript(([k, t, 편수]) => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:coach:home', '1'); localStorage.setItem(k, t)
    localStorage.setItem('hankki:v1', JSON.stringify({
      recipes: Array.from({ length: 편수 }, (_, i) => ({ id: 'u' + i, title: '내가 쓴 레시피 ' + i, ingredients: [], steps: [] })),
      folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [], shoppingList: [], pantry: [], diary: 편수 ? [{ id: 'd1', kind: 'diary', title: '오늘 한 끼', date: '2026-09-01' }, { id: 'd2', kind: 'diary', title: '오늘 한 끼 2', date: '2026-09-02' }, { id: 'd3', kind: 'diary', title: '오늘 한 끼 3', date: '2026-09-03' }] : [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
    }))
  }, [THEME_KEY, theme, 편수])
  await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1200)
  await pg.screenshot({ path: join(OUT, `로그인안내-${이름}.png`) })
  console.log('📸', join(OUT, `로그인안내-${이름}.png`))
  await ctx.close()
}
// ⚙️🔐 설정 화면 — 「로그인하러 가기」 카드 (창업자 2026-09-08 *"설정에 로그인하러가기 하나 만들수있나??"*)
//    ⭐ 로그인 «안» 한 상태로 연다 — 표식(`hankki:cloud:on`)을 안 심으면 그게 비로그인이다.
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript((ks) => { ks.forEach((k) => localStorage.setItem(k, '1')) }, Object.values(COACH))
  await pg.addInitScript(([k, t]) => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem(k, t)
    localStorage.setItem('hankki:v1', JSON.stringify({
      recipes: [], folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [], shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
    }))
    // ⛔ 탭은 «해시»가 아니라 `sessionStorage['hankki:tab']` 로 정해진다(App.jsx:74) — #/profile 은 아무 일도 안 한다
    sessionStorage.setItem('hankki:tab', 'profile')
  }, [THEME_KEY, 'greige'])
  await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1500)
  const 칸 = pg.locator('[data-coach="cloud"]')
  await 칸.scrollIntoViewIfNeeded().catch(() => {})
  await pg.waitForTimeout(400)
  await pg.screenshot({ path: join(OUT, '설정-로그인하러가기.png') })
  console.log('📸', join(OUT, '설정-로그인하러가기.png'), '·', (await 칸.innerText().catch(() => '(못 찾음)')).replace(/\n/g, ' / '))
  await ctx.close()
}

await b.close(); srv.close()
