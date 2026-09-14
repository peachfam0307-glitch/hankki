// 📸 2026-08-07 세 번째 검수판 — 창업자 폰 제보 *"하나추가 사진지우는게 없어."* (규칙 13 · 고화질)
//   ⭐ 「전 ↔ 후」를 같이 뽑는다 — 「후」만 보면 «뭐가 달라졌는지»가 안 보인다.
//      「전」은 지어내지 않는다: 새로 넣은 단추만 `display:none` 으로 감춰 **어제 화면 그대로**를 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-사진지우기'
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
await new Promise((r) => srv.listen(4396, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []

// 🖼 시험 사진 — 창업자 캡처처럼 «세로로 긴 폰 사진». 빈 페이지에서 한 번만 만든다
let PHOTO = null
{
  const ctx = await b.newContext()
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'domcontentloaded' })
  PHOTO = await p.evaluate(() => {
    const W = 540, H = 960
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const x = c.getContext('2d')
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d9b48a'); g.addColorStop(1, '#8a9c74')
    x.fillStyle = g; x.fillRect(0, 0, W, H)
    x.fillStyle = 'rgba(91,68,54,.85)'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center'
    x.fillText('넣은', W / 2, 440); x.fillText('사진', W / 2, 520)
    return c.toDataURL('image/png')
  })
  await ctx.close()
}

const open = async (art, photo, { editor = false } = {}) => {
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, {
    recipes: [], seedV: BASICS_VERSION,
    diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'lined', skin: 'ivory', art }, note: '', photo, decor: [] }],
  })
  await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
  if (editor) { await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100) }
  return page
}
const shot = async (page, name) => { await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log('  📸', name) }

// ① 전 — 새 단추만 감춘다 = 어제까지의 화면 그대로(사진을 넣으면 «비울 길이 없다»)
{
  const page = await open('card', PHOTO)
  await page.addStyleTag({ content: '[aria-label="사진 지우기"]{display:none !important}' })
  await page.waitForTimeout(300)
  await shot(page, '1-전-레시피기록-지울길이없다')
  await page.context().close()
}

// ② 후 — 사진칸이 있는 틀 셋 전부
for (const [art, name] of [['card', '레시피기록'], ['photo', '사진일기'], ['today', '오늘의한끼']]) {
  const page = await open(art, PHOTO)
  await shot(page, `2-후-${name}`)
  await page.context().close()
}

// ③ 눌러서 비운 뒤 — 그 자리가 바로 「사진 넣기」로 돌아온다
{
  const page = await open('card', PHOTO)
  await page.locator('.paper [aria-label="사진 지우기"]').first().click(); await page.waitForTimeout(900)
  await shot(page, '3-후-지운뒤-사진넣기로')
  await page.context().close()
}

// ④ 꾸미는 중에도 — 「속지」 탭
{
  const page = await open('card', PHOTO, { editor: true })
  await page.getByRole('button', { name: '속지', exact: true }).last().click(); await page.waitForTimeout(700)
  await shot(page, '4-후-꾸미기판-속지탭')
  await page.context().close()
}

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
