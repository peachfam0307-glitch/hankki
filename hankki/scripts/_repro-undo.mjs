// ↩ 실행 취소 — 창업자 2026-08-06 *"우리 근데 이거는 x버튼 있지 않아? 그거랑 다른건가?"*
//   → **다르다.** X = 없앤다(되살릴 길 0) · 되돌리기 = 방금 한 짓을 무른다.
//
// ⛔ 지켜야 하는 것 다섯:
//   ① 아무것도 안 했으면 버튼이 «안» 보인다(죽은 버튼 금지)
//   ② 스티커를 붙이면 버튼이 «생긴다»
//   ③ **X 로 지운 것이 되살아난다** — 창업자 질문의 핵심
//   ④ 옮긴 것이 «제자리»로 온다 · 드래그 한 번 = 한 칸(백 번 눌러야 하면 안 된다)
//   ⑤ 다 되돌리면 버튼이 다시 사라진다
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
await new Promise((r) => srv.listen(4360, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const BEAR = { id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.35, y: 0.3, s: 0.3, r: 0 }
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [BEAR], note: '' }],
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
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4360/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

const undoBtn = () => page.getByRole('button', { name: '되돌리기', exact: true })
// ⛔ 그냥 click 하면 버튼이 «없을 때» 30초 타임아웃 크래시로 죽어서
//   「무엇이 어긋났는지」가 안 보인다(2026-08-06 회귀 확인 때 실제로 그랬다).
//   → 없으면 ⛔ 한 줄로 적고 넘어간다. 그래야 뒤 항목도 마저 잰다.
const undoClick = async (why) => {
  if (await undoBtn().count() === 0) { no(`${why} — 「되돌리기」가 아예 없다(그 동작이 기록을 안 남겼다)`); return false }
  await undoBtn().first().click(); await page.waitForTimeout(500)
  return true
}
const count = () => page.locator('.decor-stage img').count()
const bearBox = async () => {
  const img = page.locator('.decor-stage img[src*="gp_gomhi"]').first()
  return (await img.count()) ? await img.boundingBox() : null
}

// ── ① 아무것도 안 했으면 «안» 보인다 ────────────────────
if (await undoBtn().count() === 0) ok('아무것도 안 했을 땐 「되돌리기」가 «안» 보인다')
else no('아무것도 안 했는데 되돌리기가 보인다 — 죽은 버튼이다')

// ── ② 스티커를 붙이면 생긴다 ───────────────────────────
const n0 = await count()
await page.getByRole('button', { name: '레꾸', exact: true }).last().click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: '데코', exact: true }).first().click(); await page.waitForTimeout(700)
await page.locator('.decor-drawer .decor-sec button img').first().click(); await page.waitForTimeout(600)
const n1 = await count()
if (n1 > n0) ok(`스티커가 붙었다 (${n0} → ${n1})`); else no(`스티커가 안 붙었다 (${n0} → ${n1})`)
if (await undoBtn().count() > 0) ok('붙이니 「되돌리기」가 생겼다'); else no('붙였는데 되돌리기가 안 생긴다')
await undoClick('붙인 것을 되돌리려는데')
const n2 = await count()
if (n2 === n0) ok(`되돌리니 붙인 게 사라졌다 (${n2})`); else no(`되돌렸는데 그대로다 (${n2}, 기대 ${n0})`)

// ── ⑤ 다 되돌리면 버튼이 사라진다 ──────────────────────
if (await undoBtn().count() === 0) ok('다 되돌리니 버튼이 다시 사라졌다')
else no('되돌릴 게 없는데 버튼이 남아 있다')

// ── ③ **X 로 지운 것이 되살아난다** ────────────────────
const box0 = await bearBox()
await page.mouse.click(box0.x + box0.width / 2, box0.y + box0.height / 2); await page.waitForTimeout(450)
await page.getByRole('button', { name: '스티커 삭제' }).first().click(); await page.waitForTimeout(500)
if (!(await bearBox())) ok('X 로 꼬르곰을 지웠다')
else no('X 를 눌렀는데 안 지워졌다')
await undoClick('X 로 지운 것을 되살리려는데')
const back = await bearBox()
if (back) ok('⭐ 되돌리기로 **지운 스티커가 되살아났다** — X 와 다른 점이 이것')
else no('지운 스티커가 안 되살아났다')

// ── ④ 옮긴 것이 제자리로 · 드래그 한 번 = 한 칸 ────────
// ⛔ 앞 항목이 어긋나 꼬르곰이 판에 없으면 여기서 크래시로 죽어 «뒤 항목을 못 잰다» → 건너뛰고 계속.
const before = await bearBox()
if (!before) no('꼬르곰이 판에 없어 드래그 되돌리기를 못 쟀다')
else {
await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
await page.mouse.down()
for (let i = 1; i <= 12; i++) { await page.mouse.move(before.x + before.width / 2 + i * 6, before.y + before.height / 2 + i * 4); await page.waitForTimeout(20) }
await page.mouse.up(); await page.waitForTimeout(400)
const moved = await bearBox()
if (Math.abs(moved.x - before.x) > 20) ok(`드래그로 옮겼다 (x ${Math.round(before.x)} → ${Math.round(moved.x)})`)
else no('드래그가 안 먹었다')
await undoClick('옮긴 것을 제자리로 돌리려는데')
const home = await bearBox()
if (home && Math.abs(home.x - before.x) < 6) ok(`⭐ **한 번** 눌러 제자리로 왔다 (x ${Math.round(home.x)}) — 드래그가 한 칸으로 묶였다`)
else no(`한 번 눌렀는데 제자리가 아니다 (x ${Math.round(home?.x ?? -1)}, 기대 ${Math.round(before.x)})`)
}
await page.screenshot({ path: join(OUT, 'undo-확인.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
