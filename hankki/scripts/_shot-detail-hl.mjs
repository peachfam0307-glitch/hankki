// 🖍 절 제목 형광펜 6색 — 창업자 2026-08-08 *"재료랑 만드는 법에 형광펜이나 색을 넣어도 좋을 것 같아"*
//   ⛔ 색 판정은 창업자 몫이다(규칙 11). 나는 여섯을 «같은 자리에» 나란히 놓기만 한다.
//   ⭐ 형광펜은 `multiply` 라 종이색을 타고 번진다 — 반드시 «앱 배경 위»에서 봐야 한다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4363, r))

// 색·이름을 Stickers.jsx 에서 «읽는다» — 베껴 적으면 코드와 어긋난다
const SRC = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/components/Stickers.jsx'), 'utf8')
const H = SRC.slice(SRC.indexOf('export const HL_COLORS = ['))
const COLORS = [...H.slice(0, H.indexOf(']')).matchAll(/key: '(\w+)', label: '([^']+)'/g)].map((m) => ({ key: m[1], label: m[2] }))
if (COLORS.length !== 6) { console.error(`⛔ 형광펜 색을 ${COLORS.length}개 읽었다 — 6개라야 한다`); process.exit(1) }
console.log(`   ✅ Stickers.jsx 에서 형광펜 ${COLORS.length}색 읽음 — ${COLORS.map((c) => c.label).join(' · ')}`)

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let bad = 0

for (const c of COLORS) {
  const page = await b.newPage({ viewport: { width: 360, height: 1000 }, deviceScaleFactor: 3 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION })
  await page.goto(`http://127.0.0.1:4363/hankki/?decor=h&hl=${c.key}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.locator('.grid-card').first().click()
  await page.waitForTimeout(800)

  const marks = await page.locator('.hl-mark').count()
  if (marks !== 2) { bad++; console.log(`   ⛔ ${c.label} — 형광펜이 ${marks}곳(재료·만드는 법 둘이라야 한다)`) }
  if (errors.length) { bad++; console.log(`   ⛔ ${c.label} — pageerror ${errors.length}`) }

  // 재료 제목 ~ 첫 세 줄만 — 색만 보면 되니 크게 잡을 필요가 없다
  await page.evaluate(() => {
    const head = [...document.querySelectorAll('.sec-head')].find((h) => /재료/.test(h.textContent))
    const wrap = document.createElement('div'); wrap.id = 'hl-wrap'
    head.parentNode.insertBefore(wrap, head)
    let n = wrap.nextSibling, cnt = 0
    while (n && cnt < 3) { const next = n.nextSibling; wrap.appendChild(n); cnt++; n = next }
    wrap.style.padding = '6px 0 10px'
  })
  await page.locator('#hl-wrap').screenshot({ path: `${OUT}/형광펜-${c.key}.png` })
  await page.close()
}

console.log(`\n   ${bad ? `⛔ 문제 ${bad}건` : '✅ 여섯 색 다 두 곳에 · pageerror 0'}`)
await b.close(); srv.close()
console.log(`📁 ${OUT}/형광펜-{${COLORS.map((c) => c.key).join(',')}}.png`)
