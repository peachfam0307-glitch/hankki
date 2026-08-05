// 👀 새 아이콘 16컷이 «앱 안에서» 제대로 뜨나 — 픽커 실물로 확인
//   📌 v9.31 교훈: 「고른 것」이 아니라 «들어간 것»을 본다(컨택트시트 번호만 보고 식빵을 계란으로 넣었다).
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
await new Promise((r) => srv.listen(4334, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = { recipes: [{ id: 'u1', title: '김치찜', category: '한식', time: 30, thumb: 'icon',
  ingredients: ['묵은지 1/2포기'], steps: ['끓여요.'], tags: [], savedAt: now + 90000, source: 'user' }], seedV: BASICS_VERSION }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await b.newPage({ viewport: { width: 390, height: 880 }, deviceScaleFactor: 2 })
const errs = []; page.on('pageerror', (e) => errs.push(String(e)))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4334/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
// 상세 → 표지 아이콘 바꾸기 → 픽커에서 새 컷 찾기
await page.locator('.grid-card').first().click(); await page.waitForTimeout(700)
await page.locator('[aria-label="표지 아이콘 바꾸기"]').click()
await page.locator('.emoji-sheet').waitFor()
// ⚠️ 검색 «첫 칸»만 보면 안 된다 — 「양념장」은 기존 달래양념장이 먼저 걸린다.
//    그래서 «찾은 목록 안에 새 키가 있나» 와 «그 그림이 뜨나» 를 따로 본다.
const NEW = [['두부조림', 'fe_140'], ['닭곰탕', 'fe_141'], ['양념장', 'fe_142'], ['들깨나물', 'fe_143'],
  ['해물볶음', 'fe_144'], ['콩나물무침', 'fe_145'], ['꼬막무침', 'fe_146'], ['황태채무침', 'fe_147'],
  ['황태국', 'fe_148'], ['샐러드드레싱', 'fe_149'], ['김치찜', 'fe_150'], ['바지락국', 'fe_151'],
  ['샤브샤브', 'fe_152'], ['매콤새우장', 'fe_153'], ['계란찜', 'fe_154'], ['볶음우동', 'fe_155']]
let miss = 0
for (const [n, key] of NEW) {
  await page.locator('.emoji-sheet input').first().fill(n)
  await page.waitForTimeout(320)
  const found = await page.locator('.ficon-cell img').evaluateAll(
    (imgs, k) => imgs.map((i) => ({ src: i.getAttribute('src') || '', w: i.naturalWidth }))
      .filter((x) => x.src.includes(k)), key)
  if (!found.length) { console.log(`  ❌ 「${n}」 → ${key} 가 찾기 결과에 없다`); miss += 1; continue }
  const broke = found.some((x) => x.w === 0)
  console.log(`  ${broke ? '❌' : '✅'} 「${n}」 → ${key} 있음${broke ? ' (그림 깨짐)' : ''}`)
  if (broke) miss += 1
}
// 찾기 비우고 «탭 순서»를 화면에서 읽는다 — 순서는 코드로 세도 눈으로 한 번 봐야 안다
await page.locator('.emoji-sheet input').first().fill('')
await page.waitForTimeout(600)
const labels = await page.locator('.emoji-sheet .chip, .emoji-sheet .pill, .emoji-sheet button').evaluateAll(
  (bs) => bs.map((b) => (b.textContent || '').trim()).filter((t) => t && t.length < 12))
console.log('\n화면에 보이는 탭 순서:')
console.log('  ' + labels.join(' › '))
await page.locator('.emoji-sheet').screenshot({ path: join(OUT, '픽커.png') })
console.log(errs.length ? `❌ pageerror ${errs.length}` : '✅ pageerror 0')
await b.close(); srv.close()
process.exit(miss || errs.length ? 1 : 0)
