// 🔎 진단용 — 심어둔 프레임이 «왜» 판에 안 뜨나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4392, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: Date.now(),
    paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '',
    decor: [{ id: 'fr1', type: 'sticker', key: 'pf_02', x: 0.5, y: 0.42, s: 0.58, r: 0 }],
  }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.log('  ⛔ pageerror', String(e.message).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('저장된 diary.decor =', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary?.[0]?.decor || 'X')))
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)

console.log('판 위 img 목록:')
console.log(await page.evaluate(() => [...document.querySelectorAll('.decor-stage img')].map((i) => (i.currentSrc || i.src).split('/').pop()).join(' | ') || '(없음)'))
console.log('판 위 svg 개수 =', await page.locator('.decor-stage svg').count())
console.log('안내문 =', await page.locator('.decor-editor .t-sub').first().innerText().catch(() => '(없음)'))
await page.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/probe-프레임.png' })
await b.close(); srv.close()
