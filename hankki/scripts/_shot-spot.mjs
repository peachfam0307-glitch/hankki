// 👀 판정판 — 딥 배경 표지에서 「밝은 원(스포트)」이 있는 것 ↔ 없는 것
//   창업자 질문 2026-08-05 *"근데 원이 꼭 들어가야해?"*
//   ⛔ 내 말로 답하지 않는다. 같은 화면에 나란히 놓고 «눈으로» 고른다.
//   원은 v8.5(2026-07-22) 딥 배경 넣을 때 내가 넣은 것이고 창업자 판정을 받은 적이 없다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')

// 밝은 음식·어두운 음식을 섞는다 — 어두운 그릇이 딥 배경에 묻히는지가 핵심이다
// 딥플럼 2 · 미드나잇 2 — 어두운 음식과 밝은 음식을 섞는다(어두운 그릇이 묻히는지가 핵심)
const ICONS = [
  ['fe_04', '솥밥'],        // 검은 뚝배기 = 제일 어두운 쪽
  ['fe_87', '피자'],        // 밝고 노랗다
]
const now = Date.now()
const recipes = []
ICONS.forEach(([k, n], i) => {
  recipes.push({ id: `y-${k}`, title: `${n} · 딥플럼`, category: '한식', time: 10, thumb: 'icon', icon: k,
    decorBg: 'plum', ingredients: ['재료'], steps: ['만들어요.'], tags: [], savedAt: now + 1000 - i, source: 'user' })
})
ICONS.forEach(([k, n], i) => {
  recipes.push({ id: `n-${k}`, title: `${n} · 미드나잇`, category: '한식', time: 10, thumb: 'icon', icon: k,
    decorBg: 'midnight', ingredients: ['재료'], steps: ['만들어요.'], tags: [], savedAt: now + 500 - i, source: 'user' })
})
const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = { recipes, seedV: BASICS_VERSION }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  try { res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(join(DIST, p))) }
  catch { res.writeHead(200, { 'content-type': 'text/html' }); res.end(readFileSync(join(DIST, 'index.html'))) }
})
await new Promise((r) => srv.listen(4333, r))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4333/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
// ⚠️ 레시피 탭은 시드까지 섞여 내 판정용 카드가 위로 안 온다 → 홈 「최근 저장」 2×2 로 본다

// 「원없음」 카드에서만 스포트를 뗀다 — 같은 화면에 두 판을 나란히 놓으려고
const removed = await page.evaluate(() => {
  let n = 0
  for (const card of document.querySelectorAll('.grid-card')) {
    if (!/절대안걸림/.test(card.textContent || '')) continue
    for (const sp of card.querySelectorAll('span')) {
      if (getComputedStyle(sp).backgroundImage.includes('radial-gradient')) { sp.style.display = 'none'; n += 1 }
    }
  }
  return n
})
console.log(`원을 뗀 칸 = ${removed}개 (4라야 함)`)
const path = join(OUT, '스포트-판정판.png')
await page.locator('.grid2, .grid-card').first().scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path })
console.log(`→ ${path}`)
await browser.close()
srv.close()
