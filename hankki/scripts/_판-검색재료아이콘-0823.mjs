// 🥕 시안 — 검색 「재료로 찾기」 8칸 (창업자 할일 4번 · 2026-08-23)
//
// 📮 *"홈에서 검색하면 아래 음식아이콘 옛날꺼."* · 📮 *"확정전에 시안줘 다고치고"*
//
// ⭐ 찍는 것 = 고친 «뒤» 화면 ＋ 칸마다 «실제 그림 파일 이름»을 같이 박는다.
//   ⛔ 예쁘게만 찍으면 「어느 칸이 아직 옛것인지」가 안 보인다 — 그래서 이름을 얹는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-검색재료아이콘-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'docs/시안/검색재료아이콘-0823')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4387, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4387/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

await page.locator('.bottom-nav .nav-item').filter({ hasText: '홈' }).first().click()
await page.waitForTimeout(600)
const 검색열기 = page.locator('[class*="search"], [aria-label*="검색"]').first()
if (await 검색열기.count()) { await 검색열기.click(); await page.waitForTimeout(900) }

// 화면 통째로 한 장
await page.screenshot({ path: join(OUT, '1-검색화면.png') })

// 「재료로 찾기」 칸만 크게 ＋ 파일 이름 얹기
const 격자상자 = await page.evaluate(() => {
  const 머리 = [...document.querySelectorAll('*')].find((e) => e.textContent.trim() === '재료로 찾기' && e.children.length === 0)
  const 격자 = 머리?.nextElementSibling
  if (!격자) return null
  // 칸마다 «실제 그림 파일 이름»을 아래에 박는다 — 「보이는 것」과 「앱이 쓰는 값」을 한 장에
  for (const btn of 격자.querySelectorAll('button')) {
    const img = btn.querySelector('img')
    const 이름 = img ? (img.getAttribute('src') || '').split('/').pop().replace(/-[A-Za-z0-9_-]{8}\.png$/, '.png') : '⛔ 옛 SVG 도형'
    const 표 = document.createElement('div')
    표.textContent = 이름
    표.style.cssText = `font-size:9px;line-height:1.2;color:${img ? '#4a7a4a' : '#c03a2b'};font-weight:700;word-break:break-all;text-align:center;margin-top:2px`
    btn.appendChild(표)
  }
  const r = 머리.getBoundingClientRect()
  const g = 격자.getBoundingClientRect()
  return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(390, g.width + 20), height: g.bottom - r.y + 20 }
})
if (격자상자) await page.screenshot({ path: join(OUT, '2-재료로찾기-파일이름.png'), clip: 격자상자 })

console.log(`\n🥕 시안 2장 → ${OUT}\n`)
await b.close(); srv.close()
