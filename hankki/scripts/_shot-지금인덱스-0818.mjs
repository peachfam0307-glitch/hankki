// 🔖 **지금 코드 그대로**의 인덱스 단추 — 창업자 확인용 (2026-08-18)
//
// 📮 창업자 *"네가 만든거 스샷으로 한번 볼게."*
//
// ⛔⛔ **아무것도 갈아끼우지 않는다.** 스티커도, 크기도, 색도.
//    어제 판(`_shot-인덱스스티커-0817.mjs`)은 «후보 스티커»를 얹어 본 것이고,
//    이 판은 **어제 커밋한 코드가 화면에 그리는 그대로**다. 둘을 섞으면 창업자가 틀린 걸 판정한다(규칙 30).
//
// ⭐ 딱 하나만 손댄다 = **인덱스를 «섞어서» 심는다.**
//    어제 판은 6개 전부 걸려 있어서 **「걸린 것 ↔ 안 걸린 것」 차이가 안 보였다.**
//    진짜 목록은 몇 개만 걸린다 — 그래야 이 단추가 무슨 일을 하는지 보인다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-지금인덱스-0818.mjs
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
await new Promise((r) => srv.listen(4377, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// ⚠️ `status: 'sorted'` 가 없으면 목록에 아예 안 뜬다(MyRecipesScreen:227)
const R = (id, title, icon, fav) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: !!fav, cooked: 0 })
const state = {
  recipes: [
    R('a', '들깨나물무침', 'fe_143', true), R('bb', '콩나물국', 'fh_k02', false), R('ccc', '제육볶음', 'fe_18', true),
    R('dddd', '된장찌개', 'fe_133', false), R('eeeee', '김치찌개', 'fe_128', false), R('ffffff', '어묵탕', 'fh_k18', true),
    R('ggggggg', '두부조림', 'fe_66', false), R('hhhhhhhh', '무생채', 'fe_95', false), R('iiiiiiiii', '계란말이', 'fe_04', true),
  ],
  diary: [], seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []

for (const 격자 of ['big', 'small']) {
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4377/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

  // 📸 화면 «그대로» — 화살표도 이름표도 안 그린다. 창업자가 볼 건 「진짜 화면」이다.
  const 이름 = 격자 === 'big' ? '큰격자' : '작은격자'
  await page.screenshot({ path: join(OUT, `지금인덱스-${이름}.png`) })
  console.log(`   ✅ ${이름} → 지금인덱스-${이름}.png`)

  // 🔍 확대판 — 「걸린 것 ↔ 안 걸린 것」이 실제로 얼마나 다른지. ⛔줄이지 않고 «잘라서» 키운다
  if (격자 === 'big') {
    const 잘라 = await page.evaluate(() => {
      const dots = [...document.querySelectorAll('.fav-dot')]
      const on = dots.find((d) => d.getAttribute('aria-pressed') === 'true')
      const off = dots.find((d) => d.getAttribute('aria-pressed') === 'false')
      const q = (e) => { const r = e.getBoundingClientRect(); return { x: r.left - 12, y: r.top - 12, width: r.width + 24, height: r.height + 24 } }
      return { on: on ? q(on) : null, off: off ? q(off) : null }
    })
    if (잘라.on) await page.screenshot({ path: join(OUT, '지금인덱스-확대-걸림.png'), clip: 잘라.on })
    if (잘라.off) await page.screenshot({ path: join(OUT, '지금인덱스-확대-안걸림.png'), clip: 잘라.off })
    console.log('   ✅ 확대 두 장 (걸림 · 안 걸림)')
  }

  // 🖐 누르면 정말 바뀌나 — 「만든 것」이 도는지 여기서 확인한다(규칙 7)
  if (격자 === 'big') {
    const 전 = await page.locator('.fav-dot[aria-pressed="false"]').first()
    const 라벨 = await 전.getAttribute('aria-label')
    await 전.click(); await page.waitForTimeout(500)
    const 후 = await page.evaluate((lbl) => {
      const d = [...document.querySelectorAll('.fav-dot')].find((e) => (e.getAttribute('aria-label') || '').startsWith(lbl.split(' ')[0]))
      return d ? d.getAttribute('aria-pressed') : '?'
    }, 라벨)
    console.log(`   🖐 「${라벨}」 눌러 봄 → aria-pressed = ${후} ${후 === 'true' ? '✅' : '⛔'}`)
    await page.screenshot({ path: join(OUT, '지금인덱스-누른뒤.png') })
  }
  await page.close()
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
