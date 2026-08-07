// 📔🐛 창업자 폰 제보 2026-08-07
//   *"일기인데 줄이 없어..가운데 뻥뚫려있음 줄도 안생기고. 이것도 줄 선택하게 해줌 좋겠어. 위에처럼"*
//
// ⛔ 「DOM 에 칸이 생겼나」로 판정하면 안 된다 — 만족도 점이 «DOM 엔 눌렸는데 화면엔 안 보이던» 일을 이미 겪었다.
//    **가운데 자리를 픽셀로 재서 「줄이 진짜 그어졌나」**를 본다.
// ⭐ 그리고 「무지」를 고르면 예전처럼 «비어 있어야» 한다 — 줄을 강제하는 게 아니라 «고를 수 있게» 하는 것이다.
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
await new Promise((r) => srv.listen(4393, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'card' }, note: '', decor: [] }], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: '속지 레시피 기록' }).first().click(); await page.waitForTimeout(700)

// 📐 종이 «가운데 빈 자리»(그림 실측 y 41.5~75.5%)를 잘라서 잉크를 센다
const inkMid = async (tag) => {
  const paper = await page.locator('.decor-stage [class*="paper"]').first().boundingBox()
  const clip = { x: paper.x + paper.width * 0.14, y: paper.y + paper.height * 0.44, width: paper.width * 0.72, height: paper.height * 0.28 }
  const buf = await page.screenshot({ clip, path: join(OUT, `속지가운데-${tag}.png`) })
  return page.evaluate(async (b64) => {
    const img = new Image()
    await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64 })
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    // 가장 흔한 밝기(=종이색)에서 얼마나 벗어나나
    const lum = []
    for (let i = 0; i < d.length; i += 4) lum.push((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000)
    const s = [...lum].sort((a, z) => a - z)
    const bgv = s[Math.floor(s.length / 2)]
    let n = 0
    for (const v of lum) if (Math.abs(v - bgv) > 6) n++
    return Math.round((n / lum.length) * 10000) / 100 // %
  }, buf.toString('base64'))
}

// ── ① 「무지」면 예전처럼 비어 있어야 한다 ──
await page.getByRole('button', { name: '속지 무지', exact: true }).first().click(); await page.waitForTimeout(500)
const plain = await inkMid('무지')
if (plain < 1.5) ok(`「무지」를 고르면 가운데가 비어 있다 (잉크 ${plain}%)`)
else no(`「무지」인데 가운데에 뭔가 그려진다 (잉크 ${plain}%)`)

// ── ② 「줄」이면 가운데에도 줄이 그어져야 한다 ──
await page.getByRole('button', { name: '속지 줄', exact: true }).first().click(); await page.waitForTimeout(600)
const lined = await inkMid('줄')
if (lined > plain + 1.5) ok(`⭐ 「줄」을 고르니 가운데에도 줄이 그어졌다 (잉크 ${plain}% → ${lined}%)`)
else no(`⭐ 「줄」을 골랐는데 가운데가 그대로다 (잉크 ${plain}% → ${lined}%) — 뻥 뚫린 채다`)

// ── ③ 모눈·도트도 같이 살아야 한다 ──
for (const [name, tag] of [['속지 모눈', '모눈'], ['속지 도트', '도트']]) {
  await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(600)
  const v = await inkMid(tag)
  if (v > plain + 1.0) ok(`「${tag}」도 가운데에 그려진다 (잉크 ${v}%)`)
  else no(`「${tag}」가 가운데에 안 그려진다 (잉크 ${v}%)`)
}

// ── ④ 가운데에 «글도 써져야» 한다 ──
await page.getByRole('button', { name: '속지 줄', exact: true }).first().click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: '글쓰기', exact: true }).first().click(); await page.waitForTimeout(800)
const mid = page.locator('[aria-label="일기 본문 · 가운데"]')
if (!(await mid.count())) no('⭐ 가운데에 «쓰는 칸»이 없다 — 줄만 있고 못 쓴다')
else {
  await mid.first().fill('가운데에 쓴 글')
  await page.waitForTimeout(400)
  const got = await mid.first().inputValue()
  if (got === '가운데에 쓴 글') ok('⭐ 가운데에 글이 써진다')
  else no(`가운데에 글이 안 써진다 — "${got}"`)
  // 위 칸과 «따로» 저장돼야 한다 (같은 자리를 쓰면 두 칸이 같은 글을 비춘다)
  const top = page.locator('[aria-label="일기 본문"]')
  if (await top.count()) {
    const tv = await top.first().inputValue()
    if (tv === '') ok('위 칸과 «따로» 저장된다 (위 칸은 비어 있다)')
    else no(`위 칸에도 같은 글이 들어갔다 — "${tv}"`)
  }
}
await page.screenshot({ path: join(OUT, '속지가운데-글쓰기.png') })

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
