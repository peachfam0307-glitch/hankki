// 📸 카와이 7컷을 새 세대로 갈아끼운 자리 «실물» — 온보딩 10장 ＋ 프로필 기본 아바타 (창업자 확인용 · 2026-09-05)
//
// 📮 창업자 = *"비슷한 걸로 네가 골라서 스샷 보여줘"*
//    바뀐 자리 = Onboarding.jsx (fe_06→fe_511 · fe_15→fe_508 · fh_k27→gr_003 · fe_09→gr_036 · fe_81→gr_232 · fe_08→fe_414)
//              ProfileScreen.jsx 기본 아바타 (fe_04→gr_343)
// ⛔ `vite preview` 는 빌드를 안 한다 — 먼저 `npm run build`. 이 스크립트도 dist 를 그냥 띄운다.
// 🔍 규칙 21 — 찍은 걸 «내가 먼저 열어» 본 뒤 창업자에게 보낸다.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.argv[2] || '/tmp/카와이대체7'
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
const PORT = 4382
await new Promise((r) => srv.listen(PORT, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')

const CHROMIUM = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium'
const b = await chromium.launch({ executablePath: CHROMIUM })
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.removeItem('hankki:onboarded'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await page.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

// ── 로그인 문이 온보딩 «앞»에 선다 — 「나중에 하기」로 지나간다 (첫 판은 11장이 전부 로그인 화면이었다 · 규칙 21)
// 「나중에 하기」 뒤에 「로그인 없이 시작할까요?」 시트가 한 번 더 선다 → 「그냥 시작하기」
for (const 글자 of ['나중에 하기', '그냥 시작하기']) {
  await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t); if (b) b.click() }, 글자)
  await page.waitForTimeout(1000)
}
// ── 온보딩 — 「다음」을 눌러 끝까지. 마지막 장 버튼은 「한끼 시작하기」
const 찍은것 = []
for (let i = 1; i <= 14; i++) {
  await page.waitForTimeout(500)
  const f = join(OUT, `온보딩-${String(i).padStart(2, '0')}.png`)
  await page.screenshot({ path: f })
  찍은것.push(f)
  // ⚠️ 겹친 press 버튼이 클릭을 가로채서 getByRole().click() 이 56번 재시도하다 죽었다 — DOM 에서 직접 누른다
  const 눌렀나 = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '다음'); if (!b) return false; b.click(); return true })
  if (!눌렀나) break
}
// ── 프로필 — 홈 상단 아바타(aria-label="프로필") → 기본 아바타가 gr_343 인가
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /한끼 시작하기/.test(x.textContent)); if (b) b.click() })
await page.waitForTimeout(900)
// ⛔ 다시 goto 하면 위 initScript 가 onboarded 를 또 지워 온보딩이 다시 선다 — 새로고침 없이 홈에서 바로 간다
await page.evaluate(() => { const b = document.querySelector('button[aria-label="프로필"]'); if (b) b.click() })
await page.waitForTimeout(900)
const pf = join(OUT, '프로필-기본아바타.png')
await page.screenshot({ path: pf }); 찍은것.push(pf)
await b.close(); srv.close()
console.log(`✅ ${찍은것.length}장 → ${OUT}`)
찍은것.forEach((f) => console.log('   ' + f))
