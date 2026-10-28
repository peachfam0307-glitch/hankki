// 🔎 핼러윈 홈 장식이 10/16 만 위로 뜨는 까닭 재기 (창업자 2026-10-02 「2번이 위치가 이상해 · 30일은 맞고」)
//    날짜만 바꿔 같은 앱을 띄우고, 장식 조각의 실제 화면 top 과 그 순간의 «잰 값»을 찍는다.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r)); const PORT = srv.address().port
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
for (const 시각 of (process.argv.slice(2).length ? process.argv.slice(2) : ['2026-10-16T11:00:00Z', '2026-10-30T11:00:00Z'])) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await ctx.clock.setFixedTime(new Date(시각))
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  for (const t of [300, 1500, 4000]) {
    await p.waitForTimeout(t === 300 ? 300 : t - 300)
    const r = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter((i) => /거미줄|박쥐/.test(decodeURIComponent(i.src)))
      const scr = document.querySelector('.screen')
      return { 조각: imgs.map((i) => [decodeURIComponent(i.src).match(/(거미줄|박쥐)[^./-]*/)?.[0], Math.round(i.getBoundingClientRect().top)]),
        screenTop: scr && Math.round(scr.getBoundingClientRect().top), screenH: scr && scr.scrollHeight,
        카드: [...document.querySelectorAll('*')].filter((e) => e.textContent?.trim() === '한끼 인스타그램').slice(-1).map((e) => Math.round(e.getBoundingClientRect().top)) }
    })
    console.log(시각.slice(0, 10), `${t}ms`, JSON.stringify(r))
  }
  await ctx.close()
}
await b.close(); srv.close()
