// 📏 홈 「아직 안 해봤어요」 카드 제목이 «눈으로» 어떤가 — 규칙 21
// 📮 창업자 확정 2026-09-12 「B」 = 글자를 줄인다(17.5 → 14.5px · 실측 근거는 styles.css 주석)
// 보는 것 = ①잘린 제목이 없나 ②가장 긴 제목(아보카도 바나나 스무디)도 다 보이나
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = join(여기, '../../_shots')
if (!existsSync(낼곳)) mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
let 죽음 = 0
const 칸 = (참, 이름, 말 = '') => { console.log(`${참 ? '✅' : '❌'} ${이름}${말 ? ' · ' + 말 : ''}`); if (!참) 죽음++ }
for (const W of [320, 390]) {
  const pg = await b.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 2 })
  await pg.addInitScript(SEED_COACH_SEEN)
  await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await pg.goto(`http://localhost:${port}/hankki/`); await pg.waitForTimeout(1500)
  const r = await pg.evaluate(() => {
    const el = document.querySelector('.next-title')
    if (!el) return null
    const 지금 = { 글: el.textContent, 잘림: el.scrollWidth > el.clientWidth, 크기: getComputedStyle(el).fontSize }
    const 원래 = el.textContent
    el.textContent = '아보카도 바나나 스무디'
    지금.최장잘림 = el.scrollWidth > el.clientWidth
    el.textContent = 원래
    return 지금
  })
  console.log(`\n📏 ${W}px — 글자 ${r.크기}`)
  칸(!r.잘림, `지금 뜬 제목이 안 잘린다 — 「${r.글}」`)
  칸(!r.최장잘림, '앱에서 제일 긴 제목(아보카도 바나나 스무디)도 다 보인다')
  await pg.screenshot({ path: join(낼곳, `카드제목-${W}-0912.png`) })
  await pg.close()
}
await b.close(); srv.close()
console.log(죽음 ? `\n❌ ${죽음}칸 실패` : '\n✅ 전부 통과 · _shots/ 에 두 장')
process.exit(죽음 ? 1 : 0)
