// 📸 로그인 안내 팝업 시안 — 테마 셋(그레이지·살구·다크)에서 «실물로» 찍는다 (창업자 「시안 보여줘」용 · 규칙 21)
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-로그인안내팝업-0906.mjs   → OUT 폴더에 png 셋
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
// ⛔ SEED_COACH_SEEN 을 쓰면 «이 팝업도» 본 상태가 된다(열쇠가 코치 접두어 아래) → 코치 열쇠만 «이름으로» 심는다
import { COACH } from '../src/coach.js'
const COACH_KEYS = Object.values(COACH).filter((k) => k !== COACH.loginpop) // ⭐ 이 팝업 열쇠만 «빼고» 심는다
import { THEME_KEY } from '../src/theme.js'

const OUT = process.env.OUT || '/tmp/shot-로그인안내팝업-0906'
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

for (const theme of ['greige', 'apricot', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript((ks) => { ks.forEach((k) => localStorage.setItem(k, '1')) }, COACH_KEYS)
  await pg.addInitScript(([k, t]) => {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:coach:home', '1'); localStorage.setItem(k, t)
    localStorage.setItem('hankki:v1', JSON.stringify({
      recipes: Array.from({ length: 12 }, (_, i) => ({ id: 'u' + i, title: '내가 쓴 레시피 ' + i, ingredients: [], steps: [] })),
      folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [], shoppingList: [], pantry: [], diary: [{ id: 'd1', kind: 'diary', title: '오늘 한 끼', date: '2026-09-01' }, { id: 'd2', kind: 'diary', title: '오늘 한 끼 2', date: '2026-09-02' }, { id: 'd3', kind: 'diary', title: '오늘 한 끼 3', date: '2026-09-03' }], seedV: 999, memoCleanV: 9, removedSeedIds: [],
    }))
  }, [THEME_KEY, theme])
  await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1200)
  await pg.screenshot({ path: join(OUT, `로그인안내-${theme}.png`) })
  console.log('📸', join(OUT, `로그인안내-${theme}.png`))
  await ctx.close()
}
await b.close(); srv.close()
