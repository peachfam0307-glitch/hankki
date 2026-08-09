// 🐛 재현 — 창업자 제보 둘 (2026-08-05 밤)
//   ⓐ 「어두운 배경에서 음식아이콘이 하얗게 변함」
//   ⓑ 「아이콘 변경하면 한번에 안 바뀜 — 다시 들어가서 또 누르면 바뀜」
//
// ⭐ 진짜 앱을 띄운다. `dist` 를 정적 서빙하고 폰 상태(localStorage)를 심는다.
// ⛔ 눈으로만 보지 않는다 — ⓐ는 «픽셀»로, ⓑ는 «저장된 값»으로 판정한다.
//
// 쓰기: node scripts/_repro-icon2.mjs      (앱 디렉토리에서 · 먼저 npm run build)
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { inflateSync } from 'node:zlib'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

// ── PNG(RGBA) 최소 디코더 — 의존성 없이 (check-cutouts.mjs 와 같은 방식, RGB 까지 읽는다)
function readPng(file) {
  const buf = readFileSync(file)
  let w = 0, h = 0, depth = 0, ctype = 0
  const idat = []
  for (let o = 8; o + 8 <= buf.length;) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    const data = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    o += 12 + len
  }
  // 6 = RGBA · 2 = RGB. 스크린샷은 투명이 없으면 RGB 로 저장된다(처음에 이걸 놓쳐 디코더가 null 을 냈다).
  if ((ctype !== 6 && ctype !== 2) || depth !== 8) return null
  const raw = inflateSync(Buffer.concat(idat))
  const BPP = ctype === 6 ? 4 : 3, stride = w * BPP
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  const px = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y += 1) {
    const off = y * (stride + 1)
    const filter = raw[off]
    raw.copy(cur, 0, off + 1, off + 1 + stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= BPP ? cur[i - BPP] : 0, b = prev[i], c = i >= BPP ? prev[i - BPP] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 255
      else if (filter === 2) cur[i] = (cur[i] + b) & 255
      else if (filter === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    for (let x = 0; x < w; x += 1) {
      px[(y * w + x) * 3] = cur[x * BPP]
      px[(y * w + x) * 3 + 1] = cur[x * BPP + 1]
      px[(y * w + x) * 3 + 2] = cur[x * BPP + 2]
    }
    cur.copy(prev)
  }
  return { w, h, px }
}
// 가운데 사각형의 평균색·채도
function middle(img, frac = 0.18) {
  const rw = Math.round(img.w * frac), rh = Math.round(img.h * frac)
  const x0 = Math.round((img.w - rw) / 2), y0 = Math.round((img.h - rh) / 2)
  let r = 0, g = 0, b = 0, n = 0
  for (let y = y0; y < y0 + rh; y += 1) for (let x = x0; x < x0 + rw; x += 1) {
    const i = (y * img.w + x) * 3
    r += img.px[i]; g += img.px[i + 1]; b += img.px[i + 2]; n += 1
  }
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  return { r, g, b, bright: mx, sat: mx === 0 ? 0 : Math.round(((mx - mn) / mx) * 100) }
}

const now = Date.now()
const mine = [
  // ⓐ 딥플럼(어두운 배경) + 음식 아이콘 — 창업자 캡처와 같은 상태
  { id: 'u-dark', title: '콩나물무침', category: '한식', time: 10, thumb: 'icon', icon: 'fe_04',
    decorBg: 'plum', ingredients: ['콩나물 300g'], steps: ['무쳐요.'], tags: ['반찬'], savedAt: now + 80000, source: 'user' },
  // ⓐ' 같은 아이콘·같은 크기인데 배경만 밝은 것 — 「얼마나 하얘졌나」 비교 기준
  { id: 'u-light', title: '콩나물볶음', category: '한식', time: 10, thumb: 'icon', icon: 'fe_04',
    ingredients: ['콩나물 300g'], steps: ['볶아요.'], tags: ['반찬'], savedAt: now + 70000, source: 'user' },
  // ⓑ 「목록에 없어서 옛날 그림으로 잡힌」 레시피 — 제목을 손보면서 아이콘도 직접 고르는 상황
  { id: 'u-pick', title: '들깨나물', category: '한식', time: 10, thumb: 'icon', icon: 'default',
    ingredients: ['시래기 200g'], steps: ['볶아요.'], tags: ['반찬'], savedAt: now + 90000, source: 'user' },
]
const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = { recipes: mine, seedV: BASICS_VERSION }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const PORT = 4331
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  try {
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' })
    res.end(readFileSync(join(DIST, p)))
  } catch {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(readFileSync(join(DIST, 'index.html')))
  }
})
await new Promise((r) => srv.listen(PORT, r))
const BASE = `http://127.0.0.1:${PORT}/hankki/`

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

let fail = 0
const bad = (m) => { console.log(`  ❌ ${m}`); fail++ }
const ok = (m) => console.log(`  ✅ ${m}`)

// ─────────────────────────────────────────────────────────────
console.log('\nⓐ 어두운 배경 위의 음식 아이콘 — 하얗게 되나')
// ⚠️ 그림이 있는 «표지 네모»만 찍는다 — 처음에 카드 통째를 찍어 밑에 하단바까지 들어갔다.
const shotOf = async (title, file) => {
  const el = page.locator('.grid-card', { hasText: title }).first().locator('button > div').first()
  await el.waitFor()
  const path = join(OUT, file)
  await el.screenshot({ path })
  return readPng(path)
}
// 아이콘이 실제로 몇 px 로 그려졌나 — 층을 고치면서 «크기»가 흔들리면 안 된다
const iconBox = async (title) => {
  const img = page.locator('.grid-card', { hasText: title }).first().locator('button > div img').first()
  const b = await img.boundingBox()
  return b ? Math.round(b.width) : 0
}
const darkImg = await shotOf('콩나물무침', 'icon-dark.png')
const lightImg = await shotOf('콩나물볶음', 'icon-light.png')
const d = middle(darkImg), l = middle(lightImg)
console.log(`     딥플럼  가운데 rgb(${d.r},${d.g},${d.b}) · 밝기 ${d.bright} · 채도 ${d.sat}%`)
console.log(`     밝은판  가운데 rgb(${l.r},${l.g},${l.b}) · 밝기 ${l.bright} · 채도 ${l.sat}%   ← 같은 아이콘`)
// 판정 = 흰 장막이 «위»에 깔리면 가운데가 거의 흰색이 되고 색이 죽는다.
//        밝은 판과 견줘 채도가 반 넘게 죽었으면 덮인 것이다.
if (d.bright >= 235 && d.sat <= Math.max(4, Math.round(l.sat / 2))) bad(`아이콘이 흰 장막에 덮였다 (채도 ${l.sat}% → ${d.sat}%)`)
else ok(`아이콘 색이 살아 있다 (밝은판 ${l.sat}% · 딥플럼 ${d.sat}%)`)

// ⭐ 밝은 원(스포트)이 «없어야» 한다 — 창업자 판정 2026-08-05 «어두운배경에만 원 생기는 거 별로야».
//   판정 = 딥플럼 카드의 «모서리»(배경)와 «아이콘 위쪽»(원이 있었다면 밝았을 자리)의 밝기 차이.
const at = (img, fx, fy) => {
  const x = Math.round(img.w * fx), y = Math.round(img.h * fy)
  const i = (y * img.w + x) * 3
  return Math.max(img.px[i], img.px[i + 1], img.px[i + 2])
}
const corner = at(darkImg, 0.05, 0.05)   // 배경만 (딥플럼)
const ring = at(darkImg, 0.5, 0.22)      // 스포트 안쪽 위 — 아이콘보다 위쪽
console.log(`     모서리 밝기 ${corner} · 스포트 자리 밝기 ${ring}`)
if (ring - corner > 25) bad(`밝은 원이 아직 있다 (모서리 ${corner} → 원 자리 ${ring}) — 창업자가 빼기로 정했다`)
else ok(`밝은 원이 없다 — 배경이 그대로다 (모서리 ${corner} · 원 자리 ${ring})`)

// ⭐ 아이콘 크기가 안 변했나 — 딥플럼과 밝은판이 같은 크기라야 한다
const bd = await iconBox('콩나물무침'), bl = await iconBox('콩나물볶음')
if (!bd || !bl || Math.abs(bd - bl) > 2) bad(`아이콘 크기가 어긋났다 (딥플럼 ${bd}px · 밝은판 ${bl}px)`)
else ok(`아이콘 크기 같다 (${bd}px)`)

// ─────────────────────────────────────────────────────────────
console.log('\nⓑ 아이콘을 «직접» 고르고 저장하면 그대로 남나')
const readRec = () => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (s.recipes || []).find((x) => x.id === 'u-pick')
  return { icon: r?.icon, thumb: r?.thumb, title: r?.title }
})

const pickAndSave = async ({ newTitle, query, label }) => {
  await page.locator('.grid-card').filter({ hasText: /들깨나물/ }).first().click()
  await page.waitForTimeout(600)
  await page.locator('[aria-label="편집"]').first().click()
  await page.waitForTimeout(700)
  if (newTitle) {
    await page.locator('input[placeholder^="예)"]').first().fill(newTitle)
    await page.waitForTimeout(200)
  }
  await page.locator('button.pill', { hasText: '아이콘' }).first().click()
  await page.waitForTimeout(300)
  await page.locator('[aria-label="아이콘 선택"]').first().click()
  await page.locator('.emoji-sheet').waitFor({ timeout: 4000 })
  await page.locator('.emoji-sheet input').first().fill(query)
  await page.waitForTimeout(500)
  // ⛔ 「첫 칸」을 집지 않는다 — 「김밥」에 오니기리(별명 삼각김밥)가 걸려 첫 칸이 바뀔 수 있다.
  //    ⭐ 2026-08-07 에 찾기 순서를 「친 이름이 맨 앞」으로 고쳤지만, 검사는 «이름으로» 집는 게 안전하다.
  const named = page.locator('.ficon-cell').filter({ has: page.locator(':scope') }).and(page.locator(`[aria-label="${query}"]`))
  const cell = (await named.count()) ? named.first() : page.locator('.ficon-cell').first()
  const picked = await cell.getAttribute('aria-label')
  await cell.click()
  await page.waitForTimeout(400)
  await page.locator('button', { hasText: '저장' }).last().click()
  await page.waitForTimeout(1000)
  const after = await readRec()
  console.log(`     [${label}] 고른 것 = ${picked} → 저장 뒤 icon:${after.icon} · title:${after.title}`)
  return { picked, after }
}

// ⚠️ 고른 것과 «제목으로 자동 추천되는 것»이 겹치면 판정이 안 된다(처음에 '무침'으로 골랐다가
//    자동 추천과 같은 컷이 나와 통과해 버렸다). 그래서 제목과 «전혀 상관없는» 컷을 고른다.
// ⑴ 제목 그대로 두고 아이콘만 고르기 — 김밥(fh_k22)
const a1 = await pickAndSave({ newTitle: null, query: '김밥', label: '제목 그대로' })
if (a1.after.icon !== 'fh_k22') bad(`제목 그대로인데도 고른 아이콘이 버려졌다 (fh_k22 → ${a1.after.icon})`)
else ok('제목 그대로 → 고른 아이콘이 남는다')

// ⑵ 제목도 손보면서 아이콘 고르기 — 창업자가 실제로 한 것. 피자(fe_87)
await page.goto(BASE, { waitUntil: 'networkidle' }) // 홈으로
await page.waitForTimeout(800)
const a2 = await pickAndSave({ newTitle: '들깨나물무침', query: '피자', label: '제목도 손봄' })
if (a2.after.icon !== 'fe_87') bad(`제목을 손보니 «직접 고른 아이콘이 버려졌다» (피자 fe_87 → ${a2.after.icon})`)
else ok('제목을 손봐도 고른 아이콘이 남는다')

if (errs.length) bad(`pageerror ${errs.length}건 — ${errs[0]}`)
else ok('pageerror 0')

await browser.close()
srv.close()
console.log(fail ? `\n⛔ 재현됨 — ${fail}건\n` : '\n✅ 둘 다 정상\n')
process.exit(fail ? 1 : 0)
