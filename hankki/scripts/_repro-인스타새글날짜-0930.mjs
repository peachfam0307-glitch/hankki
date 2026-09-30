// 📣 홈 인스타 「새 글」 표식이 «INSTA_NEW_AT 날부터» 뜨나 — 전날엔 안 뜨고 그날부터 뜨나 (2026-09-30)
//   📮 창업자 = 「오늘 올렸고 10월1일에 홈 인스타에 새로뜨면돼」 → INSTA_NEW_AT = 2026-10-01
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4394, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { INSTA_NEW_AT, INSTA_NEW_DAYS } = await import('../src/version.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const { todayKST } = await import('../src/today.js')
const 날더하기 = (d, n) => todayKST(new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000))   // ⛔ toISOString 직접 금지(check-kst) — 오늘 만드는 곳은 today.js 하나
const 결과 = []
const 보기 = async (날, 떠야) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  const p = await ctx.newPage()
  await p.clock.setFixedTime(new Date(날 + 'T03:00:00Z'))   // KST 정오
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  const 있나 = (await p.locator('.news-new', { hasText: '새 글' }).count()) > 0
  if (process.env.SHOT && 떠야) { const el = p.locator('.news-new', { hasText: '새 글' }).first(); if (await el.count()) { await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: process.env.SHOT }) } }
  결과.push(있나 === 떠야); console.log(`${있나 === 떠야 ? '✅' : '⛔'} ${날} — 「새 글」 ${있나 ? '뜸' : '안 뜸'} (${떠야 ? '떠야 함' : '안 떠야 함'})`)
  await ctx.close()
}
await 보기(날더하기(INSTA_NEW_AT, -1), false)
await 보기(INSTA_NEW_AT, true)
await 보기(날더하기(INSTA_NEW_AT, INSTA_NEW_DAYS - 1), true)
await 보기(날더하기(INSTA_NEW_AT, INSTA_NEW_DAYS), false)
await b.close(); srv.close()
console.log(`\n통과 ${결과.filter(Boolean).length} / ${결과.length}`)
process.exit(결과.every(Boolean) ? 0 : 1)
