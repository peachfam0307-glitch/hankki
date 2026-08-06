// 👀 창업자 제보 둘 — 실물을 본다
//   ⓐ 레꾸 표지 아이콘 바꾸기 버튼 (지금 갤러리 이모지라 안 눌러본다)
//   ⓑ 요리 기록 달력 + 메모 (다이어리 느낌이 안 난다)
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
  try { s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(readFileSync(join(DIST, p))) }
  catch { s.writeHead(200, { 'content-type': 'text/html' }); s.end(readFileSync(join(DIST, 'index.html'))) }
})
await new Promise((r) => srv.listen(4340, r))
const { BASICS_VERSION, basicRecipes } = await import('../src/data/basics.js')
const now = Date.now(), day = 86400000
const kong = basicRecipes.find((r) => r.title === '콩국수')
const mine = [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
  decorBg: kong?.decorBg, decor: kong?.decor, ingredients: ['시래기 200g'], steps: ['볶아요.'], tags: [], savedAt: now + 9e4, source: 'user', cooked: 3 },
  // ⚠️ 안 꾸민 표지 — 창업자 화면(오징어볶음)과 같은 조건. 크림 바탕 위에서도 버튼이 보이나
  { id: 'u2', title: '오징어볶음', category: '한식', time: 20, thumb: 'icon', icon: 'fe_75',
    ingredients: ['오징어 2마리'], steps: ['볶는다.'], tags: [], savedAt: now + 8e4, source: 'user', cooked: 1 }]
// 달력에 점이 찍히게 요리 기록 몇 개
const diary = [
  { id: 'd1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '들기름 조금 더 넣으니 훨씬 고소했다', photo: null },
  // ⭐ 같은 날 두 번 — 칸 구석에 `+1` 이 뜨는지 보려고(예전엔 점 «안»에 숫자가 들어갔다)
  // ⚠️ 「1시간 전」으로 뒀더니 컨테이너 시계가 UTC라 «어제»로 갈라졌다 → 몇 초 전으로.
  { id: 'd4', recipeId: 'u2', title: '오징어볶음', at: now - 5e3, rating: 4, note: '', photo: null },
  { id: 'd2', recipeId: 'u1', title: '들깨나물무침', at: now - day * 2, rating: 4, note: '', photo: null },
  { id: 'd3', recipeId: 'u1', title: '들깨나물무침', at: now - day * 5, rating: 5, note: '아이가 잘 먹음', photo: null },
]
const state = { recipes: mine, diary, seedV: BASICS_VERSION }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const W = Number(process.env.W || 390) // ⚠️ 창업자 폰은 360 — 알약 둘이 한 줄에 들어가는지 좁은 쪽으로도 잰다
const page = await b.newPage({ viewport: { width: W, height: 880 }, deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4340/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// ⓐ 레시피 상세 = 표지 아이콘 버튼
await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, `ui-a-표지버튼-${W}.png`) })
const btn = await page.locator('[aria-label="표지 아이콘 바꾸기"]').boundingBox()
const dec = await page.locator('[aria-label="레시피 꾸미기"]').boundingBox()
const gap = Math.round(dec.x - (btn.x + btn.width))
console.log(`화면 폭 ${W}px`)
console.log(`  왼쪽 「아이콘 바꾸기」  = ${Math.round(btn.width)}x${Math.round(btn.height)}px  (x ${Math.round(btn.x)})`)
console.log(`  오른쪽 「레시피 꾸미기」 = ${Math.round(dec.width)}x${Math.round(dec.height)}px  (x ${Math.round(dec.x)})`)
console.log(gap < 8
  ? `  ⛔ 둘 사이 ${gap}px — 붙거나 겹친다`
  : `  ✅ 둘 사이 ${gap}px · 높이 ${Math.round(btn.height)}=${Math.round(dec.height)} 로 한 줄`)

// ⓐ-2 안 꾸민 표지에서도 버튼이 보이나 (창업자 화면과 같은 조건)
await page.goto('http://127.0.0.1:4340/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.locator('.grid-card').nth(1).click(); await page.waitForTimeout(800)
await page.locator('[ref]').first().isVisible().catch(() => {})
await page.locator('div').first().evaluate(() => window.scrollTo(0, 0))
await page.screenshot({ path: join(OUT, `ui-a2-안꾸민표지-${W}.png`), clip: { x: 0, y: 0, width: W, height: 520 } })
console.log('  → 안 꾸민 표지 캡처 완료')

// ⓑ 레시피 탭 → 요리 기록 → 달력 펼치기
await page.goto('http://127.0.0.1:4340/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.locator('nav button, [role="tablist"] button').filter({ hasText: '레시피' }).first().click()
await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '요리 기록' }).first().click()
await page.waitForTimeout(700)
// 달력 접혀 있으면 편다
const cal = page.locator('button', { hasText: /달력|캘린더/ }).first()
if (await cal.count()) { await cal.click(); await page.waitForTimeout(600) }
await page.screenshot({ path: join(OUT, 'ui-b-요리기록.png'), fullPage: true })
console.log('→ 캡처 둘 완료')
await b.close(); srv.close()
