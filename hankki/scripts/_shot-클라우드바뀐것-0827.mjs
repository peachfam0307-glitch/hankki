// ☁️📸 오늘 바꾼 것만 찍는다 — 2026-08-27
//
// 📮 창업자 = *"그냥.. 로그인화면 캡쳐해서 보여주면 안돼?"* · *"바꾼 것만 확인하면 되니까."*
//
// ⛔ 옛 촬영판(_shot-클라우드첫화면·시트-0821)은 «온보딩 건너뛰기»에서 멎는다 —
//    그 사이 252판이 나가 화면이 달라졌다. 고치느니 «필요한 것만» 새로 찍는다.
// ⭐ 로그인 «첫 화면»은 로그인 «전»이라 파이어베이스가 필요 없다 → 여기서 그대로 찍힌다.
//    ⛔ 로그인 «뒤» 화면(두 판·ㄱㄴ 안내·백업 줄)은 진짜 구글 계정이 있어야 해서 못 찍는다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.argv[2] || '/tmp/shots'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(DIST, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4633, r))
mkdirSync(OUT, { recursive: true })

const b = await chromium.launch()
// 📱 창업자 폰과 같은 폭으로 (갤럭시 · DPR 3 → 여기선 2로 충분히 크게 찍힌다)
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
// 🌐 이 컨테이너는 구글을 못 연다 — 막아 두고 «로그인 전» 화면만 본다
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())

const pg = await ctx.newPage()
const 탈 = []
pg.on('pageerror', (e) => 탈.push(String(e)))
await pg.goto('http://localhost:4633/', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(2600)

// ① 로그인 첫 화면 — 오늘 갈아끼운 곰펭이 여기 있다
await pg.screenshot({ path: join(OUT, '1-로그인화면.png') })
const 그림 = await pg.evaluate(() => {
  const i = [...document.querySelectorAll('img')].find((x) => /duo_hi/.test(x.currentSrc || x.src))
  if (!i) return null
  const r = i.getBoundingClientRect()
  return { 원본: `${i.naturalWidth}x${i.naturalHeight}`, 화면: `${Math.round(r.width)}x${Math.round(r.height)}`, 깨짐: i.naturalWidth === 0 }
})
console.log('① 로그인 화면 — 곰펭 =', 그림)
console.log('   화면 글자 =', JSON.stringify((await pg.evaluate(() => document.body.innerText)).split('\n').filter(Boolean)))

// ② 「나중에 하기」로 지나간 뒤 설정 → 클라우드 저장 (로그인 «전» 시트)
const 눌러 = async (이름) => {
  try { await pg.getByRole('button', { name: 이름, exact: true }).first().click({ timeout: 2500 }); await pg.waitForTimeout(1200); return true }
  catch { return false }
}
await 눌러('나중에 하기')
// 온보딩은 «건너뛰기»가 덮여 안 눌릴 때가 있다 → 좌표로 민다(옛 판이 여기서 죽었다)
for (let i = 0; i < 14; i++) { if (!(await 눌러('다음'))) break }
await 눌러('한끼 시작하기')
await pg.waitForTimeout(1200)
await pg.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /건너뛰기|시작하기/.test(x.innerText || ''))
  if (b) b.click()
})
await pg.waitForTimeout(1200)
await pg.evaluate(() => {
  const b = [...document.querySelectorAll('button,a')].find((x) => /설정/.test(x.innerText || '') || /설정/.test(x.getAttribute('aria-label') || ''))
  if (b) b.click()
})
await pg.waitForTimeout(1500)
await pg.evaluate(() => {
  const b = [...document.querySelectorAll('button,a,div[role="button"]')].find((x) => /클라우드/.test(x.innerText || ''))
  if (b) b.click()
})
await pg.waitForTimeout(1500)
await pg.screenshot({ path: join(OUT, '2-클라우드시트-로그인전.png') })
console.log('② 클라우드 시트(로그인 전) — 글자 =', JSON.stringify((await pg.evaluate(() => document.body.innerText)).split('\n').filter(Boolean).slice(-8)))

console.log('⚠️ pageerror =', 탈.length ? 탈 : '없음')
console.log('→', OUT)
await ctx.close(); await b.close(); srv.close()
