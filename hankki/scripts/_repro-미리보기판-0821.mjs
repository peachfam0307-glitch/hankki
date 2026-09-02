// 🔗🧪 미리보기 판이 «진짜로 뜨나» — 깨진 그림 0 을 잰다 (2026-08-21)
//   ⛔ 「18.4MB 로 줄였다」는 «작아졌다»는 말이지 «된다»는 말이 아니다(절대원칙 21).
//   ⭐ 잣대 = `naturalWidth === 0` (브라우저가 못 그린 그림) ＋ pageerror 0
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const DIST = '/home/user/hankki/hankki/dist-preview'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  const f = join(DIST, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4612, r))

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
const 탈 = []
const pg = await ctx.newPage()
pg.on('pageerror', (e) => 탈.push(String(e)))
await pg.addInitScript(SEED_COACH_SEEN)
await pg.goto('http://localhost:4612/', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(2500)

const 깨진것 = async (어디) => {
  const n = await pg.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)
  return { 어디, n }
}
const 눌러 = async (이름) => { try { await pg.getByRole('button', { name: 이름, exact: true }).first().click({ timeout: 2500 }); await pg.waitForTimeout(1400) } catch { /* noop */ } }

const 결과 = []
결과.push(await 깨진것('①첫화면'))
await pg.screenshot({ path: '/tmp/미리보기1-첫화면.png' })
await 눌러('나중에 하기'); await 눌러('그냥 시작하기')
for (let i = 0; i < 12; i++) await 눌러('다음')
await 눌러('한끼 시작하기'); await 눌러('건너뛰기')
await pg.waitForTimeout(1800)
결과.push(await 깨진것('②홈'))
await pg.screenshot({ path: '/tmp/미리보기2-홈.png' })
for (const t of ['레시피', '일기', '장보기']) { await 눌러(t); await pg.waitForTimeout(1600); 결과.push(await 깨진것(`③${t}`)) }
await 눌러('설정'); await pg.waitForTimeout(1500)
결과.push(await 깨진것('④설정'))
await pg.screenshot({ path: '/tmp/미리보기3-설정.png', fullPage: true })

await ctx.close(); await b.close(); srv.close()

let 나쁨 = 0
for (const r of 결과) { const ok = r.n === 0; if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${r.어디} — 깨진 그림 ${r.n}개`) }
console.log(탈.length ? `⛔ pageerror ${탈.length}건: ${탈[0]}` : '✅ pageerror 0')
if (나쁨 || 탈.length) { console.log('\n⛔ 미리보기 판이 성하지 않다'); process.exit(1) }
console.log('\n✅ 미리보기 판 — 깨진 그림 0 · 오류 0')
