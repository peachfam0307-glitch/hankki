// 📜🐛 창업자 폰 제보 2026-08-07 *"꾸미기탭에 다른스티커 보려고했는데 스크롤이 안움직여"*
//   캡처 = 스티커를 고르면 컨텍스트 바가 «네 줄»(순서·뒤집기·움직임·효과) 나고 서랍이 화면 밖으로 밀린다.
//
// ⛔ 「스크롤 되나」를 손가락으로 흉내내 판정하지 않는다 — **자리(px)를 잰다.**
//    ⒜ 서랍 스크롤 칸이 몇 px 인가  ⒝ 담긴 내용이 몇 px 인가  ⒞ 실제로 굴러가나
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
await new Promise((r) => srv.listen(4394, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [{ id: 'r1', title: '콩국수', at: Date.now(), thumb: 'none', ing: [], steps: [], source: 'hankki',
    // 🐻🐧 창업자 캡처와 같은 상황 — 곰펭 콤비를 하나 얹어 두면 고르는 순간 컨텍스트 바가 «네 줄» 난다
    decor: [{ id: 'g1', type: 'sticker', key: 'gp_duohi', x: 0.42, y: 0.55, s: 0.34, r: -3, motion: 'tilt', fx: 'bubble' }] }],
  diary: [], seedV: BASICS_VERSION,
})
await page.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: /레시피 꾸미기/ }).first().click(); await page.waitForTimeout(1200)

const measure = async () => page.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0)
  const sc = q('.decor-scroll')
  const ed = q('.decor-editor')
  // 컨텍스트 바 = 서랍 «바로 위» 형제
  const dr = q('.decor-drawer')
  const ctx = dr?.previousElementSibling
  return {
    화면: Math.round(window.innerHeight),
    편집기: h(ed),
    판: h(q('.decor-stage')),
    컨텍스트: h(ctx),
    서랍: h(dr),
    스크롤칸: sc ? sc.clientHeight : 0,
    담긴내용: sc ? sc.scrollHeight : 0,
  }
})

const roll = async () => page.evaluate(async () => {
  const sc = document.querySelector('.decor-scroll')
  if (!sc) return -1
  sc.scrollTop = 0
  sc.scrollTop = 400
  await new Promise((r) => setTimeout(r, 120))
  return sc.scrollTop
})

console.log('\n── 아무것도 안 골랐을 때 ──')
const a = await measure()
console.log('   ', JSON.stringify(a, null, 0))
await page.screenshot({ path: join(OUT, '서랍-1-안고름.png') })

console.log('\n── 스티커를 골랐을 때 (창업자 상황) ──')
const st = page.locator('.decor-stage img').first()
const bb = await st.boundingBox()
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(600)
const c = await measure()
console.log('   ', JSON.stringify(c, null, 0))
await page.screenshot({ path: join(OUT, '서랍-2-고름.png') })

const rolled = await roll()
console.log(`   ℹ️ 400px 굴려 보니 = ${rolled}px`)

// ── 판정 ──
if (c.스크롤칸 >= 240) ok(`⭐ 스티커를 골라도 서랍 스크롤 칸이 남는다 (${c.스크롤칸}px)`)
else no(`⭐ 스티커를 고르니 서랍 스크롤 칸이 ${c.스크롤칸}px 밖에 안 된다 — 한두 줄이라 손가락이 탭 줄에 닿는다`)
if (c.담긴내용 > c.스크롤칸 && rolled > 50) ok(`실제로 굴러간다 (${rolled}px 내려감 · 담긴 내용 ${c.담긴내용}px)`)
else if (c.담긴내용 <= c.스크롤칸) no('담긴 내용이 칸보다 작다 — 서랍이 통째로 눌렸다')
else no(`굴려도 ${rolled}px 밖에 안 내려간다`)
// 판(종이)이 화면 밖으로 나가면 안 된다
if (c.판 + c.컨텍스트 + c.서랍 <= c.화면 + 4) ok(`판＋컨텍스트＋서랍이 화면에 다 들어온다 (${c.판}＋${c.컨텍스트}＋${c.서랍} ≤ ${c.화면})`)
else no(`⭐ 다 합치면 화면을 ${c.판 + c.컨텍스트 + c.서랍 - c.화면}px 넘는다 — 뭔가 밀려난다`)

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남 — 창업자 제보가 재현됐다\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
