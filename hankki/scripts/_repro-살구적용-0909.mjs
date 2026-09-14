// 🍑 살구 테마가 «진짜로» 걸리나 — 켠 판과 안 켠 판을 픽셀로 견준다.
// 📮 창업자 2026-09-09 = *"살구색배경테마로 하자했자나 왜 내말을 그냥지나쳐?"*
//    ⛔ 나는 `data-theme` 속성만 보고 「됐다」고 했다 — 속성이 붙는 것과 «색이 바뀌는 것»은 다른 말이다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(readFileSync(join(DIST, p))) } catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 재기 = async (테마) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      if (t) localStorage.setItem('hankki-theme', t)
    } catch {}
  }, 테마)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2000)
  const r = await p.evaluate(() => {
    const 뿌리 = document.documentElement
    const 화면 = document.querySelector('.screen')
    return {
      속성: 뿌리.getAttribute('data-theme'),
      bg변수: getComputedStyle(뿌리).getPropertyValue('--bg').trim(),
      body색: getComputedStyle(document.body).backgroundColor,
      화면색: 화면 ? getComputedStyle(화면).backgroundColor : null,
      메타: document.querySelector('meta[name=theme-color]')?.content,
    }
  })
  await p.screenshot({ path: `/tmp/테마-${테마 || '기본'}.png` })
  await ctx.close()
  return r
}
for (const t of [null, 'apricot']) console.log((t || '기본').padEnd(9), JSON.stringify(await 재기(t)))
await b.close(); srv.close()
