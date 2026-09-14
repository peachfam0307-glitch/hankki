// 📸 2026-08-07 두 번째 검수판 — 창업자 폰 제보 다섯 (규칙 13 · 고화질)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0807-2'
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
await new Promise((r) => srv.listen(4395, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const { FRAME_WINDOW } = await import('../src/data/frameWindows.js')
const FKEY = Object.keys(FRAME_WINDOW).find((k) => /^pf_(0|1)/.test(k)) || Object.keys(FRAME_WINDOW)[0]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const open = async (state, opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, state)
  await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  if (opts.recipe) {
    await page.locator('.grid-card').first().click(); await page.waitForTimeout(900)
    await page.getByRole('button', { name: /레시피 꾸미기/ }).first().click(); await page.waitForTimeout(1200)
  } else {
    await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
    await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
    await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
    await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  }
  return page
}
const diary = (extra = {}) => ({
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [], ...extra }],
})
const shot = async (page, n, name) => { await page.screenshot({ path: join(OUT, `${n}-${name}.png`) }); console.log('  📸', name) }
const tallPhoto = (page) => page.evaluate(() => {
  const W = 540, H = 960
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e8c9a0'); g.addColorStop(1, '#9db487')
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  x.fillStyle = '#5b4436'; x.font = 'bold 62px sans-serif'; x.textAlign = 'center'
  x.fillText('세로', W / 2, 320); x.fillText('사진', W / 2, 400)
  return c.toDataURL('image/png').split(',')[1]
})

// ① 사진을 위로 끌어도 지우기 단추가 종이 안에 남는다
{
  const page = await open(diary())
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  const b64 = await tallPhoto(page)
  await page.locator('.decor-drawer input[type=file]').first()
    .setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
  await page.waitForTimeout(1600)
  const stage = await page.locator('.decor-stage').first().boundingBox()
  const ph = await page.locator('.decor-stage img[src^="data:"]').first().boundingBox()
  await page.mouse.move(ph.x + ph.width / 2, ph.y + ph.height / 2)
  await page.mouse.down()
  await page.mouse.move(stage.x + stage.width * 0.5, stage.y + stage.height * 0.08, { steps: 12 })
  await page.mouse.up(); await page.waitForTimeout(600)
  await shot(page, '01', '사진을위로끌어도-지우기단추가남는다')
  await page.context().close()
}

// ② 프레임 속 사진 고르기
{
  const page = await open(diary({ decor: [{ id: 'fr1', type: 'sticker', key: FKEY, x: 0.5, y: 0.42, s: 0.58, r: 0 }] }))
  await page.getByRole('button', { name: '레꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  const fimg = page.locator(`.decor-stage img[src*="${FKEY}"]`).first()
  const bb = await fimg.boundingBox(); await page.mouse.click(bb.x + 8, bb.y + 8); await page.waitForTimeout(500)
  const b64 = await tallPhoto(page)
  await page.locator('.decor-drawer input[type=file]').first()
    .setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
  await page.waitForTimeout(1600)
  // ⚠️ 끼운 «직후»엔 사진이 골라져 있다 → 창 안을 눌러 프레임을 고르면 「속 사진 고르기」가 뜬다
  const st2 = await page.locator('.decor-stage').first().boundingBox()
  await page.mouse.click(st2.x + st2.width * 0.06, st2.y + st2.height * 0.06); await page.waitForTimeout(400)
  const ph2 = await page.locator('.decor-stage img[src^="data:"]').first().boundingBox()
  await page.mouse.click(ph2.x + ph2.width / 2, ph2.y + ph2.height / 2); await page.waitForTimeout(500)
  await shot(page, '02', '프레임에넣음-속사진고르기단추')
  await page.getByRole('button', { name: '속 사진 고르기' }).first().click(); await page.waitForTimeout(500)
  await shot(page, '03', '속사진을골랐다-크기손잡이가산다')
  await page.context().close()
}

// ③ 「레시피 기록」 틀 가운데
{
  const page = await open(diary({ paper: { rule: 'lined', skin: 'ivory', art: 'card' } }))
  await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(700)
  await shot(page, '04', '레시피기록틀-가운데에도줄')
  await page.getByRole('button', { name: '속지 무지', exact: true }).first().click(); await page.waitForTimeout(600)
  await shot(page, '05', '무지를고르면-예전처럼비어있다')
  await page.getByRole('button', { name: '속지 줄', exact: true }).first().click(); await page.waitForTimeout(400)
  await page.getByRole('button', { name: '글쓰기', exact: true }).first().click(); await page.waitForTimeout(800)
  await page.locator('[aria-label="일기 본문 · 가운데"]').first().fill('가운데에도 이렇게 써져요\n줄 위에 그대로')
  await page.waitForTimeout(500)
  await shot(page, '06', '가운데에-글도써진다')
  await page.context().close()
}

// ④⑤ 서랍 — 스티커를 골랐을 때
{
  const page = await open({
    recipes: [{ id: 'r1', title: '콩국수', at: Date.now(), thumb: 'none', ing: [], steps: [], source: 'hankki',
      decor: [{ id: 'g1', type: 'sticker', key: 'gp_duohi', x: 0.42, y: 0.55, s: 0.34, r: -3, motion: 'tilt', fx: 'bubble' }] }],
    diary: [], seedV: BASICS_VERSION,
  }, { recipe: true })
  await shot(page, '07', '레꾸-안골랐을때')
  const st = await page.locator('.decor-stage img').first().boundingBox()
  await page.mouse.click(st.x + st.width / 2, st.y + st.height / 2); await page.waitForTimeout(700)
  await shot(page, '08', '스티커를골라도-서랍이산다')
  await page.context().close()
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
console.log('📁', OUT)
await b.close(); srv.close()
