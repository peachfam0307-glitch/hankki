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

// 🎨 테마 셋 다 본다 — 창업자 2026-08-08 *"앱배경 우리 테마 3개라 다 잘어울려야해"*
//   ⛔ 다크는 배경이 #17171b 라 multiply 가 죽는다(곱하기는 어두운 쪽이 이긴다) → screen 으로 뒤집었다.
const THEMES = [['greige', '그레이지(기본)'], ['cream', '크림'], ['dark', '다크']]
for (const [theme, tname] of THEMES)
for (const c of COLORS.filter((x) => x.key === 'lemon')) {
  const page = await b.newPage({ viewport: { width: 360, height: 1000 }, deviceScaleFactor: 3 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((a) => {
    localStorage.setItem('hankki:v1', JSON.stringify(a.s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    localStorage.setItem('hankki-theme', a.theme)   // 부팅 때 main.jsx 가 applyTheme(getTheme()) 을 부른다
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { s: { recipes: [], seedV: BASICS_VERSION }, theme })
  // ⛔ 시안 스위치(?decor=)는 지웠다 — 이제 «그냥 열어도» 보여야 한다. 안 보이면 정리하다 깨뜨린 것
  await page.goto('http://127.0.0.1:4363/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.locator('.grid-card').first().click()
  await page.waitForTimeout(800)

  const marks = await page.locator('.hl-mark').count()
  if (marks !== 2) { bad++; console.log(`   ⛔ ${tname}/${c.label} — 형광펜이 ${marks}곳(재료·만드는 법 둘이라야 한다)`) }
  if (errors.length) { bad++; console.log(`   ⛔ ${tname}/${c.label} — pageerror ${errors.length}`) }
  // ⛔ 테마가 실제로 걸렸나 — 「걸린 줄 알았는데 안 걸림」이 제일 흔한 거짓 통과다
  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  if (applied !== theme) { bad++; console.log(`   ⛔ 테마가 '${applied}' 다 — '${theme}' 라야 한다`) }

  // 재료 제목 ~ 첫 세 줄만 — 색만 보면 되니 크게 잡을 필요가 없다
  await page.evaluate(() => {
    const head = [...document.querySelectorAll('.sec-head')].find((h) => /재료/.test(h.textContent))
    const wrap = document.createElement('div'); wrap.id = 'hl-wrap'
    head.parentNode.insertBefore(wrap, head)
    // 최종판 = 재료 절 머리부터 «완성 칸»까지 통째로(세 갈래가 한 화면에 어떻게 보이나)
    let n = wrap.nextSibling, cnt = 0
    while (n && cnt < 2) { const next = n.nextSibling; wrap.appendChild(n); cnt++; n = next }
    wrap.style.padding = '6px 0 10px'
  })
  // 완성 칸만 따로 — 최종판에선 하단 고정바가 이 칸을 덮는다(스크롤하면 보이지만 캡처엔 안 잡힌다)
  const dn = page.locator('.done-strip')
  if (!(await dn.count())) { bad++; console.log(`   ⛔ ${tname} — 완성 칸이 없다`) }
  else await dn.screenshot({ path: `${OUT}/완성칸-${theme}.png` })
  await page.close()
}

console.log(`\n   ${bad ? `⛔ 문제 ${bad}건` : '✅ 여섯 색 다 두 곳에 · pageerror 0'}`)
await b.close(); srv.close()
console.log(`📁 ${OUT}/형광펜-{${COLORS.map((c) => c.key).join(',')}}.png`)
