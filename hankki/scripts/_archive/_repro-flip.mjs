// ↔ 좌우 뒤집기 — 창업자 2026-08-06 *"캐릭터좌우반전돼?"* → 된다
//
// ⛔ 지켜야 하는 것 넷:
//   ① 캐릭터·코너를 고르면 「좌우 뒤집기」가 뜬다
//   ② 누르면 실제로 **화면이 뒤집힌다**(scaleX(-1)) · 저장에도 `flip` 이 남는다
//   ③ **글자가 그려진 스티커(tw_·tn_)엔 안 뜬다** — 뒤집으면 거울 글자가 된다
//   ④ 손잡이·지우기 단추는 **안 뒤집힌다**(조작이 헷갈리면 안 된다)
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
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
await new Promise((r) => srv.listen(4359, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
// 🐻 캐릭터 하나 · 🔤 글자 스티커 하나를 미리 붙여 둔다
const BEAR = { id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.32, y: 0.3, s: 0.3, r: 0 }
const WORD = { id: 'w1', type: 'sticker', key: 'tw_haenaem', x: 0.7, y: 0.62, s: 0.3, r: 0 }
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [BEAR, WORD], note: '' }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4359/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

// 판 위의 그림을 탭해서 고른다
const tapKey = async (key) => {
  const img = page.locator(`.decor-stage img[src*="${key}"]`).first()
  const bb = await img.boundingBox()
  if (!bb) return false
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2)
  await page.waitForTimeout(450)
  return true
}
const flipBtn = () => page.getByRole('button', { name: '좌우 뒤집기', exact: true })
// 그 그림이 실제로 뒤집혀 그려졌나 — 부모 상자의 transform 을 읽는다
const isFlipped = (key) => page.evaluate((k) => {
  const img = [...document.querySelectorAll('.decor-stage img')].find((i) => (i.currentSrc || i.src).includes(k))
  if (!img) return null
  const box = img.closest('[style*="translate(-50%"]') || img.parentElement
  return /matrix\(-1|scaleX\(-1\)/.test(getComputedStyle(box).transform || '') || getComputedStyle(box).transform.startsWith('matrix(-')
}, key)

// ── ③ 글자 스티커엔 «안» 뜬다 ─────────────────────────
if (await tapKey('tw_haenaem')) {
  if (await flipBtn().count() === 0) ok('글자 스티커(tw_)엔 「좌우 뒤집기」가 «안» 뜬다')
  else no('글자 스티커에 뒤집기가 떴다 — 뒤집으면 거울 글자가 된다')
} else no('판에서 글자 스티커를 못 찾았다')

// ── ① 캐릭터엔 뜬다 ────────────────────────────────
if (await tapKey('gp_gomhi')) {
  if (await flipBtn().count() > 0) ok('캐릭터를 고르니 「좌우 뒤집기」가 뜬다')
  else no('캐릭터인데 뒤집기가 안 뜬다')
} else no('판에서 캐릭터를 못 찾았다')

// ── ② 누르면 진짜 뒤집힌다 ──────────────────────────
const before = await isFlipped('gp_gomhi')
if (before === false) ok('누르기 «전» = 안 뒤집힌 상태')
else no(`누르기 전인데 이미 뒤집혀 있다 (${before})`)
await page.screenshot({ path: join(OUT, 'flip-1-전.png') })
await flipBtn().first().click(); await page.waitForTimeout(500)
const after = await isFlipped('gp_gomhi')
if (after === true) ok('누르니 화면이 «실제로» 뒤집혔다')
else no(`눌렀는데 화면이 안 뒤집혔다 (${after})`)
await page.screenshot({ path: join(OUT, 'flip-2-후.png') })

// ── ④ 손잡이는 안 뒤집힌다 ──────────────────────────
// ⛔⛔ **개별 `transform` 을 보면 안 된다** — 부모(아이템 상자)가 이미 뒤집혀 있어서
//   손잡이 판의 `scaleX(-1)` 은 «상쇄용»이다. 곱하면 정상인데 낱개로 읽으면 matrix(-1) 이라
//   「뒤집혔다」로 잘못 읽힌다(2026-08-06 실제로 이 검사가 거짓 실패를 냈다).
//   ⭐ **화면에서 «어디 있나»로 잰다** — 지우기 단추는 뒤집든 말든 늘 «오른쪽 위»라야 한다.
const sideOf = () => page.evaluate(() => {
  const btn = [...document.querySelectorAll('.decor-stage button')].find((b) => b.getAttribute('aria-label') === '스티커 삭제')
  const img = [...document.querySelectorAll('.decor-stage img')].find((i) => (i.currentSrc || i.src).includes('gp_gomhi'))
  if (!btn || !img) return null
  const a = btn.getBoundingClientRect(), c = img.getBoundingClientRect()
  return a.left + a.width / 2 > c.left + c.width / 2 ? 'right' : 'left'
})
const side = await sideOf()
if (side === 'right') ok('뒤집어도 지우기 단추는 «오른쪽 위» 그대로 — 조작이 안 헷갈린다')
else no(`뒤집으니 지우기 단추가 ${side} 로 넘어갔다`)

// ── ② 저장에도 남나 ────────────────────────────────
await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1000)
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary?.[0]?.decor || [])
const bear = saved.find((x) => x.key === 'gp_gomhi')
const word = saved.find((x) => x.key === 'tw_haenaem')
if (bear?.flip === true) ok('저장에 `flip: true` 가 남았다')
else no(`저장에 flip 이 안 남았다 (${JSON.stringify(bear?.flip)})`)
if (!word?.flip) ok('글자 스티커엔 flip 이 안 붙었다')
else no('글자 스티커에 flip 이 붙었다')

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
