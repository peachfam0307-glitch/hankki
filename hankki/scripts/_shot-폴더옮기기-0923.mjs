// 📁 「목록에서 바로 폴더로 옮기기」 — 창업자 시안 (2026-09-23)
//
// 📮 창업자 = *"시안을 보여줘"* · *"어떤 폴더로 들어가는데? 길게 눌렀을때"*
// ⭐ 그래서 «세 장»을 찍는다 — ①꾹 눌러 고른 모습 ②［폴더］를 눌렀을 때 ③옮긴 뒤
//    (길게 누른다고 «어느 폴더로 바로» 가는 게 아니다 — 고른 뒤 어디로 갈지 «고른다»)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/폴더옮기기'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4379, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon, extra = {}) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 90000, status: 'sorted', favorite: false, cooked: 0, ...extra })
const state = {
  recipes: [
    R('u_1', '엄마 김치찌개', 'fe_128'),
    R('u_22', '우리집 제육', 'fe_18'),
    R('u_333', '릴스에서 본 마늘파스타', 'fh_k18', { sourceUrl: 'https://www.instagram.com/reel/bbbb/' }),
    R('basic-1', '꽃게탕', 'fh_k02'),
  ],
  folders: ['우리집 김치', '주말 브런치'],
  diary: [],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:nudge:cloudgate', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4379/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

// ① 꾹 눌러 고르기 모드 — 카드 두 장을 고른다
const 카드 = page.locator('.card, [class*="grid"] button').first()
await page.locator('text=편집').first().click(); await page.waitForTimeout(500)
await page.getByText('엄마 김치찌개').click(); await page.waitForTimeout(250)
await page.getByText('우리집 제육').click(); await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '폴더-1-고른모습.png') })

// ② ［폴더］를 누른다 — 「어디로 들어가나」
await page.getByText('폴더', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, '폴더-2-어디로옮길까.png') })

// ③ 「우리집 김치」로 옮긴다
await page.getByText('우리집 김치').last().click(); await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, '폴더-3-옮긴뒤.png') })
console.log('pageerror', errors.length, errors.slice(0, 3))
await b.close(); srv.close()
console.log('저장 →', OUT)
