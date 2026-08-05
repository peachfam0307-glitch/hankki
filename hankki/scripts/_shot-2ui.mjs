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
  decorBg: kong?.decorBg, decor: kong?.decor, ingredients: ['시래기 200g'], steps: ['볶아요.'], tags: [], savedAt: now + 9e4, source: 'user', cooked: 3 }]
// 달력에 점이 찍히게 요리 기록 몇 개
const diary = [
  { id: 'd1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '들기름 조금 더 넣으니 훨씬 고소했다', photo: null },
  { id: 'd2', recipeId: 'u1', title: '들깨나물무침', at: now - day * 2, rating: 4, note: '', photo: null },
  { id: 'd3', recipeId: 'u1', title: '들깨나물무침', at: now - day * 5, rating: 5, note: '아이가 잘 먹음', photo: null },
]
const state = { recipes: mine, diary, seedV: BASICS_VERSION }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await b.newPage({ viewport: { width: 390, height: 880 }, deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4340/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// ⓐ 레시피 상세 = 표지 아이콘 버튼
await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, 'ui-a-표지버튼.png') })
const btn = await page.locator('[aria-label="표지 아이콘 바꾸기"]').boundingBox()
console.log(`표지 아이콘 버튼 = ${Math.round(btn.width)}x${Math.round(btn.height)}px · 화면 왼쪽아래`)

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
