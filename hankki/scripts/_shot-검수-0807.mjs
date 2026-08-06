// 📸 2026-08-07 검수판 — 창업자 폰 제보 여섯 (규칙 13 · 고화질)
//   ⭐ 실제 앱을 돌면서 찍는다. deviceScaleFactor 2 (360×880 → 720×1760)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0807'
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
await new Promise((r) => srv.listen(4383, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: Date.now(),
    paper: { rule: 'write', skin: 'ivory', art: 'today' },
    note: '오늘은 콩국수를 해먹었다\n깨를 넉넉히 갈아 넣으니\n훨씬 고소했다',
    decor: [{ id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.28, y: 0.72, s: 0.22, r: -4 }],
  }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4383/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)

const shot = async (n, name) => { await page.screenshot({ path: join(OUT, `${n}-${name}.png`) }); console.log('  📸', name) }

// ① 속지 탭 — 고르는 일이 한자리에 (축 · 사진칸)
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(900)
await shot('01', '속지탭-고르기전')

// ② 축을 골라 본다 — 날씨·기분·만족도 3
for (const label of ['날씨 표시', '기분 표시', '만족도 3']) {
  const el = page.locator(`.decor-stage [aria-label="${label}"]`).first()
  if (await el.count()) { await el.click(); await page.waitForTimeout(350) }
}
await shot('02', '속지탭-골라진-표시')

// ③ 만족도가 별점처럼 1·2·3 다 칠해졌나 — 종이만 크게
const paper = await page.locator('.decor-stage [class*="paper"]').first().boundingBox()
await page.screenshot({ path: join(OUT, '03-만족도-별점처럼.png'), clip: { x: paper.x, y: paper.y + paper.height * 0.5, width: paper.width, height: paper.height * 0.3 } })
console.log('  📸 만족도-별점처럼 (종이 아래쪽만 크게)')

// ④ 일꾸 탭 — 사진 스티커로 붙이기 (이름이 갈렸다)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
await shot('04', '일꾸탭-사진스티커로붙이기')

// ⑤ 세로 사진을 붙여 본다 — 안 잘리는지
const b64 = await page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 300; c.height = 900
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 900)
  g.addColorStop(0, '#e8c9a0'); g.addColorStop(1, '#9db487')
  x.fillStyle = g; x.fillRect(0, 0, 300, 900)
  x.fillStyle = '#5b4436'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'
  x.fillText('세로', 150, 300); x.fillText('사진', 150, 360)
  return c.toDataURL('image/png').split(',')[1]
})
const fi = page.locator('.decor-drawer input[type=file]').first()
if (await fi.count()) {
  await fi.setInputFiles({ name: 'tall.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
  await page.waitForTimeout(1600)
  await shot('05', '세로사진-안잘림')
}

// ⑥ 종이 바깥을 눌러 편집 표시창이 사라지는지
const stage = await page.locator('.decor-stage').first().boundingBox()
await page.mouse.click(stage.x + stage.width * 0.04, stage.y + stage.height * 0.5); await page.waitForTimeout(500)
await shot('06', '바깥누르면-편집창사라짐')

// ⑦ 글쓰기 — 키보드가 떠도 속지가 그대로
await page.getByRole('button', { name: '글쓰기', exact: true }).first().click(); await page.waitForTimeout(900)
await shot('07', '글쓰기-키보드전')
await page.setViewportSize({ width: 360, height: 420 }); await page.waitForTimeout(800)
await shot('08', '글쓰기-키보드올라온뒤')

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
console.log('📁', OUT)
await b.close(); srv.close()
