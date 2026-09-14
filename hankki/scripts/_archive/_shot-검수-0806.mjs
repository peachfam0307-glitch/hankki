// 📸 2026-08-06 검수판 — 창업자 «고화질 전수 검수»용 (규칙 13)
//   창업자 *"다하면 바로 검수 배포가자."*
//
// ⭐ 실제 앱을 돌면서 찍는다 — 그려낸 목업이 아니다. 유저가 볼 화면 그대로.
// ⛔ 줄인 판으로 판정하지 않는다 → deviceScaleFactor 2 (360×880 → 720×1760)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0806'
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
await new Promise((r) => srv.listen(4371, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '',
    decor: [
      { id: 'w1', type: 'text', color: 'ink', font: 'gaegu', w: 'mid', text: '오늘도 해냈다', x: 0.5, y: 0.28, s: 0.46, r: -2 },
      { id: 'h1', type: 'hl', key: 'lemon', x: 0.5, y: 0.285, s: 0.54, r: 0, o: 0.5 },
      { id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.3, y: 0.62, s: 0.3, r: 0 },
      { id: 'b2', type: 'sticker', key: 'gp_gomhi', x: 0.7, y: 0.62, s: 0.3, r: 0, flip: true },
    ],
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
await page.goto('http://127.0.0.1:4371/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)

const shot = async (n, name) => { await page.screenshot({ path: join(OUT, `${n}-${name}.png`) }); console.log('  📸', name) }
const tapTab = async (t) => { await page.getByRole('button', { name: t, exact: true }).first().click(); await page.waitForTimeout(700) }
const tapShelf = async (s) => { await page.getByRole('button', { name: s, exact: true }).last().click(); await page.waitForTimeout(700) }

// ① 일꾸 — 기본으로 열리는 자리
await tapShelf('일꾸'); await shot('01', '일꾸-기본')
// ② 일꾸 데코 = 한끼 일기 세트
await tapTab('데코'); await page.waitForTimeout(500); await shot('02', '일꾸-데코-일기세트')
// ③ 일꾸 글자 = 글자·형광펜·포스트잇
//   ⚠️ 형광펜 칸은 서랍 아래쪽이라 «그냥 찍으면 안 보인다» — 그 칸까지 내려서 찍는다.
//      (검수판에 안 보이면 「없는 것」으로 읽힌다)
await tapTab('글자')
const toPen = async () => {
  const el = page.locator('.decor-scroll button[aria-label^="형광펜 "]').first()
  if (await el.count()) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500) }
}
await toPen(); await shot('03', '일꾸-글자-형광펜')
// ④ 레꾸
await tapShelf('레꾸'); await shot('04', '레꾸-기본')
await tapTab('글자'); await toPen(); await shot('05', '레꾸-글자-형광펜')
// ⑤ 스티커 골라 컨텍스트 바(뒤집기·순서)
const bear = page.locator('.decor-stage img[src*="gp_gomhi"]').first()
const bb = await bear.boundingBox()
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(600)
await shot('06', '스티커-고른-편집바')
// ⑥ 형광펜 골라 컨텍스트 바(색·굵기·진하기)
const hl = await page.evaluate(() => {
  const el = document.querySelector('.decor-stage [data-hl]'); const r = el.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await page.mouse.click(hl.x, hl.y); await page.waitForTimeout(600)
await shot('07', '형광펜-고른-편집바')
// ⑦ 되돌리기 — «무언가 한 뒤»에만 뜬다(죽은 버튼 금지). 색을 한 번 바꿔서 띄운다
const sky = page.getByRole('button', { name: /^형광펜 아쿠아$/ })
if (await sky.count()) { await sky.first().click(); await page.waitForTimeout(600) }
await shot('10', '되돌리기-생김')

// ⑧ 프레임에 사진 끼우기 — 프레임을 고르면 버튼 이름이 바뀐다
await page.getByRole('button', { name: '레꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await tapTab('프레임')
const fr = page.locator('.decor-scroll .decor-grid button').first()
if (await fr.count()) {
  await fr.click(); await page.waitForTimeout(900)
  await page.locator('.decor-scroll').first().evaluate((el) => el.scrollTo({ top: 0 })); await page.waitForTimeout(400)
  await shot('11', '프레임-고르면-사진넣기')
}

// ⑨ 속지 고르기
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(900)
await shot('08', '속지-고르기')
// ⑧ 글쓰기
const w = page.getByRole('button', { name: '글쓰기', exact: true })
if (await w.count()) { await w.first().click(); await page.waitForTimeout(800); await shot('09', '글쓰기') }

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
console.log('📁', OUT)
await b.close(); srv.close()
