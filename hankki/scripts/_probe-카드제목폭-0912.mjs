// 📏 홈 「아직 안 해봤어요」 카드 제목이 «몇 px 이면» 안 잘리나 — 실측
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
const dist = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 글들 = ['아보카도 바나나 스무디', '충무김밥 오징어무침', '닭가슴살 피자 브리또']
for (const W of [320, 360, 390, 412]) {
  const pg = await b.newPage({ viewport: { width: W, height: 900 } })
  await pg.addInitScript(SEED_COACH_SEEN)
  await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await pg.goto(`http://localhost:${port}/hankki/`); await pg.waitForTimeout(1500)
  const r = await pg.evaluate((글들) => {
    const el = document.querySelector('.next-title')
    if (!el) return null
    const 원래 = el.textContent
    const cs = getComputedStyle(el)
    const 폭 = el.clientWidth
    const out = { 폭, 지금크기: cs.fontSize, 결과: {} }
    for (const g of 글들) {
      el.textContent = g
      let 맞는크기 = null
      for (let px = 17.5; px >= 11; px -= 0.5) {
        el.style.fontSize = px + 'px'
        if (el.scrollWidth <= el.clientWidth) { 맞는크기 = px; break }
      }
      out.결과[g] = 맞는크기
      el.style.fontSize = ''
    }
    el.textContent = 원래
    return out
  }, 글들)
  console.log(`\n📏 ${W}px — 칸 폭 ${r.폭}px · 지금 글자 ${r.지금크기}`)
  for (const [g, px] of Object.entries(r.결과)) console.log(`   ${px ? px + 'px' : '11px 로도 안 들어감'}  ${g}`)
  await pg.close()
}
await b.close(); srv.close()
