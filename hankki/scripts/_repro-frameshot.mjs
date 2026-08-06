// 🖼 프레임에 사진 끼우기 — 창업자 2026-08-06
//   *"프레임 꾸미기에 넣어서 프레임잡으려면 사진 넣을수(스티커처럼) 있으면 좋겠어"*
//   *"무지에는 사진 넣는거 없어??"* → 있는데 «있는 줄을 몰랐다» → 안내 한 줄
//
// ⛔ 지켜야 하는 것 넷:
//   ① 프레임을 고르면 버튼 이름이 「이 프레임에 사진 넣기」로 바뀐다
//   ② 넣으면 사진이 **프레임 «뒤»**에 깔린다(앞에 두면 프레임을 덮는다)
//   ③ 사진이 **창 자리·창 크기**에 들어간다(가운데에 덜렁 놓이지 않는다)
//   ④ 사진칸 없는 틀(없음)을 고르면 「사진은 꾸미기에서」 안내가 뜬다
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
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
await new Promise((r) => srv.listen(4358, r))

const { FRAME_WINDOW } = await import('../src/data/frameWindows.js')
const { BASICS_VERSION } = await import('../src/data/basics.js')

// 🖼 창을 «실측한» 프레임 하나로 시험한다 — 그래야 자리가 맞는지 숫자로 잴 수 있다
const KEY = Object.keys(FRAME_WINDOW).find((k) => /^pf_(0|1)/.test(k)) || Object.keys(FRAME_WINDOW)[0]
const WIN = FRAME_WINDOW[KEY]
const FRAME = { id: 'fr1', type: 'sticker', key: KEY, x: 0.5, y: 0.42, s: 0.58, r: 0 }
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [FRAME], note: '' }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }
console.log(`   🖼 시험 프레임 = ${KEY} · 실측 창 = 가운데(${WIN.cx}, ${WIN.cy}) 크기(${WIN.w} × ${WIN.h})`)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4358/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)

// ── ④ 사진칸 없는 틀 안내 ────────────────────────────────
await page.getByRole('button', { name: '속지', exact: true }).last().click(); await page.waitForTimeout(600)
const hintNone = await page.locator('.decor-editor .t-sub').first().innerText()
if (/사진칸이 없어요/.test(hintNone)) ok(`틀 「없음」 안내가 뜬다 — "${hintNone}"`)
else no(`틀 「없음」인데 사진 안내가 없다 — "${hintNone}"`)
// 사진칸 있는 틀로 바꾸면 그 안내는 사라져야 한다
await page.getByRole('button', { name: '속지 사진일기' }).first().click(); await page.waitForTimeout(600)
const hintPhoto = await page.locator('.decor-editor .t-sub').first().innerText()
if (!/사진칸이 없어요/.test(hintPhoto)) ok('「사진일기」로 바꾸면 그 안내가 사라진다')
else no('「사진일기」는 사진칸이 있는데 안내가 그대로다')
await page.getByRole('button', { name: '속지 없음' }).first().click(); await page.waitForTimeout(500)

// ── ① 프레임을 고르면 버튼 이름이 바뀐다 ──────────────────
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
const before = await page.getByText('내 사진 넣기', { exact: true }).count()
if (before > 0) ok('프레임 고르기 전 = 「내 사진 넣기」')
else no('「내 사진 넣기」 버튼이 아예 없다')
// 판 위의 프레임을 탭해서 고른다
await page.locator('.decor-stage [style*="position: absolute"]').first().click({ position: { x: 8, y: 8 } }).catch(() => {})
await page.waitForTimeout(400)
// 못 골랐으면 프레임 그림을 직접 누른다
if (!(await page.getByText('이 프레임에 사진 넣기', { exact: true }).count())) {
  const img = page.locator(`.decor-stage img[src*="${KEY}"]`).first()
  if (await img.count()) { const bb = await img.boundingBox(); if (bb) await page.mouse.click(bb.x + 6, bb.y + 6) }
  await page.waitForTimeout(400)
}
const after = await page.getByText('이 프레임에 사진 넣기', { exact: true }).count()
if (after > 0) ok('프레임을 고르니 「이 프레임에 사진 넣기」로 바뀐다')
else no('프레임을 골랐는데 버튼 이름이 안 바뀐다')
const hintFrame = await page.locator('.decor-editor .t-sub').first().innerText()
if (/사진을 끼울 수 있어요/.test(hintFrame)) ok(`안내도 바뀐다 — "${hintFrame}"`)
else no(`프레임 안내가 안 뜬다 — "${hintFrame}"`)
await page.screenshot({ path: join(OUT, 'frame-1-프레임고름.png') })

// ── ②③ 사진을 끼운다 ───────────────────────────────────
// 파일 고르기는 못 흉내내니 «저장된 값»으로 직접 확인한다 — 앱과 같은 계산을 여기서 다시 하고 대조
const px = 8
const png = Buffer.concat([
  Buffer.from('89504e470d0a1a0a', 'hex'),
])
// 작은 JPEG 한 장을 만들어 파일 고르기에 밀어 넣는다
const jpg = await page.evaluate(async (n) => {
  const c = document.createElement('canvas'); c.width = c.height = n
  const g = c.getContext('2d'); g.fillStyle = '#c0392b'; g.fillRect(0, 0, n, n)
  g.fillStyle = '#2980b9'; g.fillRect(0, 0, n / 2, n / 2)
  return c.toDataURL('image/jpeg', 0.9)
}, 64)
const buf = Buffer.from(jpg.split(',')[1], 'base64')
await page.locator('.decor-drawer input[type=file]').first().setInputFiles({ name: 'a.jpg', mimeType: 'image/jpeg', buffer: buf })
await page.waitForTimeout(900)

const got = await page.evaluate(() => {
  const raw = localStorage.getItem('hankki:decorDraft') || '{}'
  return raw
})
// 저장 눌러서 실제 값으로 확인한다
await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1000)
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary?.[0]?.decor || [])
const iFrame = saved.findIndex((x) => x.key === KEY)
const iPhoto = saved.findIndex((x) => x.type === 'photo')
if (iPhoto < 0) { no('사진이 아예 안 들어갔다') }
else {
  if (iPhoto < iFrame) ok(`사진이 프레임 «뒤»에 깔렸다 (배열 ${iPhoto} < 프레임 ${iFrame})`)
  else no(`사진이 프레임 «앞»에 있다 (배열 ${iPhoto} > 프레임 ${iFrame}) — 프레임을 덮는다`)
  const p = saved[iPhoto]
  const want = FRAME.s * WIN.w
  if (Math.abs(p.s - want) < 0.005) ok(`사진 크기가 창에 맞다 (${p.s.toFixed(3)} ≈ ${want.toFixed(3)})`)
  else no(`사진 크기가 창과 다르다 — ${p.s?.toFixed(3)} 인데 ${want.toFixed(3)} 이라야 한다`)
  const dx = Math.abs(p.x - (FRAME.x + (WIN.cx - 0.5) * FRAME.s))
  if (dx < 0.01) ok(`사진이 창 «가로 자리»에 있다 (어긋남 ${(dx * 100).toFixed(2)}%)`)
  else no(`사진 가로 자리가 ${(dx * 100).toFixed(1)}% 어긋났다`)
  if (p.ratio && Math.abs(p.ratio - 1) > 0.001) ok(`사진을 창 모양대로 잘랐다 (가로÷세로 ${p.ratio.toFixed(3)})`)
  else console.log(`   ℹ️ 창이 거의 정사각이라 자른 모양이 1 에 가깝다 (${p.ratio})`)
}
await page.screenshot({ path: join(OUT, 'frame-2-사진끼움.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
