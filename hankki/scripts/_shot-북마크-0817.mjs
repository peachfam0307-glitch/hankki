// 🔖 북마크를 목록에서 바로 — 창업자 판정용 실물 (2026-08-17)
//
// 📮 창업자 *"근데 그 북마크는 **나도 한번도 안썼어 번거로워서. 레시피에 들어가서 눌러야 하니까**"*
// 📮 → *"**북마크를 밖으로 빼면 되겠다** 레시피 속이 아니라"* · *"(**잘 보이게** 해줘.)"*
//
// ⭐ 물어야 할 것 = 「코드가 있나」가 아니라 **「목록에서 눌러서 실제로 켜지나」**(규칙 21).
//    그래서 이 판은 **누르고 나서** 다시 찍는다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-북마크-0817.mjs
import './_fresh.mjs'
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
await new Promise((r) => srv.listen(4365, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// ⚠️ `status: 'sorted'` 가 없으면 목록에 «아예 안 뜬다**(`MyRecipesScreen` 의 `sorted`)
const R = (id, title, icon, fav) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: fav, cooked: 0 })
const state = {
  recipes: [
    R('a', '들깨나물무침', 'fe_143', true),
    R('bb', '콩나물국', 'fh_k02', false),
    R('ccc', '제육볶음', 'fe_18', false),
    R('dddd', '된장찌개', 'fe_133', true),
    R('eeeee', '김치찌개', 'fe_128', false),
    R('ffffff', '어묵탕', 'fh_k18', false),
  ],
  diary: [],
  seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:gridSize', 'big')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4365/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

const 켜진수 = () => page.evaluate(() => [...document.querySelectorAll('.fav-dot')].filter((b) => b.getAttribute('aria-pressed') === 'true').length)
const 전체수 = () => page.locator('.fav-dot').count()

// ① 2열(크게 보기) — 안 찜한 것도 보이나
await page.screenshot({ path: join(OUT, '북마크-1-크게보기.png') })
console.log(`   🔢 북마크 단추 ${await 전체수()}개 (레시피 6개 전부에 붙었나) · 켜진 것 ${await 켜진수()}개`)
const 상자 = await page.locator('.fav-dot').first().boundingBox()
console.log(`   📏 단추 크기 ${Math.round(상자.width)}×${Math.round(상자.height)}px`)

// ②⭐ **진짜 눌리나** — 목록에서 톡. 상세로 튕겨 나가면 안 된다(중첩 버튼 사고)
const 콩국 = page.locator('.grid-card, .card, div').filter({ hasText: '콩나물국' })
const 둘째단추 = page.locator('.fav-dot').nth(1)
await 둘째단추.click(); await page.waitForTimeout(500)
const 아직목록 = await page.locator('.seg').count() > 0
console.log(`   🧪 누른 뒤 켜진 것 ${await 켜진수()}개 (기대 3) · 목록에 그대로 있나 ${아직목록 ? '예' : '⛔아니오(상세로 튕겼다)'}`)
await page.screenshot({ path: join(OUT, '북마크-2-누른뒤.png') })

// ③ 다시 누르면 꺼지나
await 둘째단추.click(); await page.waitForTimeout(500)
console.log(`   🧪 다시 누르니 켜진 것 ${await 켜진수()}개 (기대 2)`)

// ④ 3열(촘촘히) 에서도 안 깨지나
await page.getByRole('button', { name: '보기 방식 전환' }).first().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, '북마크-3-촘촘히.png') })
const 상자2 = await page.locator('.fav-dot').first().boundingBox()
console.log(`   📏 3열에서 단추 ${Math.round(상자2.width)}×${Math.round(상자2.height)}px`)

// ⑤ 「즐겨찾기」 칩 개수가 따라 오르나 (같은 데이터를 쓰는지)
const 칩 = await page.getByText(/즐겨찾기 \d+/).first().innerText().catch(() => '없음')
console.log(`   🏷 즐겨찾기 칩 = "${칩.trim()}"`)

if (errors.length) console.log('   ⛔ pageerror:', errors.join(' / '))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log('\n✅ 스샷 완료 →', OUT, '\n')
