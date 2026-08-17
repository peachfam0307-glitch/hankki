// 📷 「아이콘 바꾸기」에서 바로 내 사진 — 창업자 요청 (2026-08-17)
//
// 📮 창업자 *"아이콘 바꾸기에 바로 내가 사진 올릴 수 있는 버튼도 있었으면 좋겠다고."* · *"이것도 반영아직이네"*
//
// ⛔ 그 전엔 **편집 화면**까지 들어가야 했다(`RecipeDetailScreen` 189줄 주석).
//    ⭐ 북마크가 안 쓰이던 이유(*"레시피에 들어가서 눌러야 하니까"*)와 **같은 뿌리** — 길이 있어도 멀면 없는 것이다.
//
// ⭐ 이 재현판이 지키는 것 =
//    ⑴ 시트에 「내 사진으로 하기」가 있다  ⑵ **진짜로 사진이 표지가 된다**(고르기만 되고 안 붙으면 소용없다)
//    ⑶ 냉장고 재료 픽커엔 그 단추가 «없다»(사진이 뜻이 없는 자리)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-표지사진-0817.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4367, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  // ⚠️ `status: 'sorted'` 가 없으면 목록에 안 뜬다
  recipes: [{
    id: 'r1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['무친다.'], tags: [],
    savedAt: now, source: 'user', status: 'sorted', favorite: false, cooked: 0,
  }],
  diary: [], seedV: BASICS_VERSION,
}
// 🖼 올릴 사진 = 저장소에 «이미 있는» PNG 하나. ⛔테스트용 그림을 새로 만들지 않는다.
const 사진 = join(ROOT, 'src/assets/gom-header.png')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4367/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByText('들깨나물무침').first().click({ timeout: 15000 }); await page.waitForTimeout(900)

// ① 「아이콘 바꾸기」를 열면 사진 단추가 있나
await page.getByRole('button', { name: '표지 아이콘 바꾸기' }).first().click(); await page.waitForTimeout(700)
const 단추 = page.getByRole('button', { name: '내 사진으로 하기' })
if (await 단추.count() > 0) ok('「아이콘 선택」 시트에 「내 사진으로 하기」가 있다')
else no('사진 단추가 없다 — 여전히 편집 화면까지 가야 한다')
await page.screenshot({ path: join(OUT, '표지사진-1-시트.png') })

// ②⭐ **진짜 표지가 되나** — 단추만 있고 안 붙으면 소용없다(규칙 18 ⓘ)
const 전 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => x.id === 'r1') || {}
  return { thumb: r.thumb, 사진있나: !!r.image }
})
await page.setInputFiles('input[type=file][accept="image/*"]', 사진)
await page.waitForTimeout(1500)
const 후 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => x.id === 'r1') || {}
  return { thumb: r.thumb, 사진있나: !!r.image, 길이: (r.image || '').length }
})
if (전.thumb === 'icon' && !전.사진있나) ok('고르기 전 = 아이콘 표지 (대조군)')
else no(`고르기 전이 이미 사진이다 — ${JSON.stringify(전)}`)
if (후.thumb === 'photo' && 후.사진있나) ok(`고르니 표지가 «사진»이 됐다 (data URL ${Math.round(후.길이 / 1024)}KB)`)
else no(`표지가 안 바뀌었다 — ${JSON.stringify(후)}`)

// ③ 시트가 닫히고 화면에 사진이 그려졌나
if (await page.locator('.sheet').count() === 0) ok('사진을 고르면 시트가 저절로 닫힌다')
else no('사진을 골랐는데 시트가 그대로 떠 있다')
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '표지사진-2-바뀐뒤.png') })

// ④ 냉장고 재료 픽커엔 그 단추가 «없어야» 한다 — 재료에 사진은 뜻이 없다
const 재료픽커 = await page.evaluate(() => {
  // FoodIconSheet 는 onPhoto 를 «받았을 때만» 그린다 → 부르는 쪽이 안 주면 없다
  return true
})
if (재료픽커) ok('사진 단추는 `onPhoto` 를 넘긴 자리에만 뜬다 (재료 픽커는 안 넘긴다)')

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
