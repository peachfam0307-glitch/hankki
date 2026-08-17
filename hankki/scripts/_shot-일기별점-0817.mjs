// 📸 일기 화면 「이 날 만든 요리」에 별점 — 창업자 판정용 실물 (2026-08-17)
//
// 📮 창업자 *"일기칸이 제일 좋아보여. **어떻게 하게 할건데?**"*
// ⭐ 답 = **톡 한 번.** 시트도 안 뜨고 화면도 안 떠난다.
//
// ⭐ 찍을 것 셋 =
//    ① 별을 안 매긴 상태 (셋 다 회색)  ② 톡 눌러 매긴 «직후»  ③ 이름이 긴 요리에서 안 깨지나
//    ⚠️ 폭이 제일 걱정이다 — 360px 폰에서 「그림 ＋ 긴 이름 ＋ 별 다섯」이 한 줄에 들어가야 한다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-일기별점-0817.mjs
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
await new Promise((r) => srv.listen(4364, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now, source: 'user', status: 'sorted' })
const C = (id, title, rating) => ({ id, recipeId: id, title, at: now, rating, note: '', photo: null })
const state = {
  // ⚠️ 셋째는 **일부러 긴 이름** — 말줄임이 도는지, 별을 밀어내지 않는지 본다
  recipes: [R('들깨나물무침', '들깨나물무침', 'fe_143'), R('콩나물국', '콩나물국', 'fh_k02'), R('목살돼지갈비구이', '목살돼지갈비구이', 'fe_18')],
  diary: [
    C('들깨나물무침', '들깨나물무침', 0),
    C('콩나물국', '콩나물국', 0),
    C('목살돼지갈비구이', '목살돼지갈비구이', 0),
    { id: 'j1', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' },
  ],
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
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4364/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)

// 🔎 굴릴 놈을 «찾는다» (화면마다 다를 수 있어 손으로 박지 않는다)
const 굴리기 = async (y) => page.evaluate((top) => {
  const els = [document.scrollingElement, ...document.querySelectorAll('*')]
  const s = els.find((e) => e && e.scrollHeight - e.clientHeight > 40)
  if (s) s.scrollTop = top
}, y)
const 칸 = page.locator('.card').filter({ hasText: '이 날 만든 요리' }).first()
await 칸.scrollIntoViewIfNeeded(); await page.waitForTimeout(400)

// ① 안 매긴 상태
await page.screenshot({ path: join(OUT, '일기별점-1-안매김.png') })
const 폭 = await 칸.boundingBox()
console.log(`   📏 칸 폭 ${Math.round(폭.width)}px · 높이 ${Math.round(폭.height)}px`)
// 한 줄에 다 들어갔나 = 줄마다 별 다섯이 «같은 y»에 있나
const 줄 = await 칸.locator('> div > div').count()
const 별 = await 칸.getByRole('button', { name: /^\d점$/ }).count()
console.log(`   🔢 요리 ${줄}줄 · 별 버튼 ${별}개 (기대 ${줄 * 5})`)
// 이름이 잘렸나 (긴 이름이 말줄임으로 도는지)
const 이름폭 = await 칸.locator('span').filter({ hasText: '목살돼지갈비구이' }).first().boundingBox().catch(() => null)
if (이름폭) console.log(`   📏 긴 이름 칸 폭 ${Math.round(이름폭.width)}px`)

// ② 톡 눌러 매긴 «직후» — 시트가 안 뜨고 화면도 안 바뀌어야 한다
const 셋째별4 = 칸.locator('> div > div').nth(2).getByRole('button', { name: '4점' })
await 셋째별4.click(); await page.waitForTimeout(400)
const 첫째별5 = 칸.locator('> div > div').nth(0).getByRole('button', { name: '5점' })
await 첫째별5.click(); await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, '일기별점-2-매긴직후.png') })
const 시트떴나 = await page.locator('.sheet').count()
const 여전히일기 = await page.locator('.paper').count()
console.log(`   🧪 시트 뜬 개수 ${시트떴나} (기대 0) · 일기 화면 그대로 ${여전히일기 > 0 ? '예' : '아니오'}`)

// ③ 진짜 저장됐나 — 앨범으로 가서 배지 확인
await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(900)
const 배지 = (await page.locator('.album-star').allInnerTexts()).map((s) => s.trim())
console.log(`   💾 앨범 배지 = ${배지.length ? 배지.join(' · ') : '없음'} (기대 5 · 4)`)
await page.screenshot({ path: join(OUT, '일기별점-3-앨범에저장됨.png') })

if (errors.length) console.log('   ⛔ pageerror:', errors.join(' / '))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log('\n✅ 스샷 완료 →', OUT, '\n')
